import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import sharp from 'sharp';
import { createHrAuditTestDatabase } from '../testing/hrAuditDatabase';
import { runMigrations } from '../db/migrate';

test('GA API saves complete requests, protects evidence, handles drafts, status transitions, and signed documents', async t => {
  const fixture = await createHrAuditTestDatabase();
  const directory = await mkdtemp(path.join(tmpdir(), 'ams-ga-api-'));
  let closeApp = async () => {};
  t.after(async () => { await closeApp(); await fixture.cleanup(); await rm(directory, { recursive: true, force: true }); });
  await runMigrations(fixture.ownerUrl, undefined, fixture.runtimeRole);
  await fixture.owner.query('GRANT SELECT ON users, roles, permissions, role_permissions TO "' + fixture.runtimeRole + '"');
  process.env.DATABASE_URL = fixture.runtime.options.connectionString!;
  process.env.GA_STORAGE_DIR = directory;
  const { createApp } = await import('../app');
  const { closeDatabase } = await import('../db');
  const { generateToken } = await import('../utils/jwt');
  const { rows: [role] } = await fixture.owner.query("INSERT INTO roles(code,name) VALUES('ga_test_admin','GA test admin') RETURNING id");
  const { rows: [user] } = await fixture.owner.query("INSERT INTO users(username,email,password_hash,role_id) VALUES('ga_test','ga_test@example.test','unused',$1) RETURNING id", [role.id]);
  const token = generateToken({ userId: Number(user.id), roleId: Number(role.id), roleName: 'SuperAdmin', email: 'ga_test@example.test' });
  const noPermission = generateToken({ userId: Number(user.id), roleId: Number(role.id), roleName: 'NoPermissions', email: 'ga_test@example.test' });
  const missingUser = generateToken({ userId: 99999999, roleId: Number(role.id), roleName: 'SuperAdmin', email: 'missing@example.test' });
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  closeApp = async () => { await new Promise<void>(resolve => server.close(() => resolve())); await closeDatabase(); };
  const address = server.address() as { port: number };
  const base = 'http://127.0.0.1:' + address.port + '/api/v1/ga/requests';
  const image = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#fff' } }).png().toBuffer();
  const payload = {
    title: 'Pengadaan Laptop Staff',
    purpose: 'Karyawan baru divisi HR-GA',
    requestDate: '2026-10-20', requesterName: 'Fathiya', jobTitle: 'GA', division: 'HR-GA',
    items: [{ name: 'Laptop', quantity: 2, estimatedPrice: 6199000, subtotal: 1, notes: 'Karyawan baru', attachmentKeys: ['proof-1'] }]
  };
  function body(input = payload, buffer = image) {
    const data = new FormData(); data.append('payload', JSON.stringify(input));
    data.append('evidence', new Blob([new Uint8Array(buffer)], { type: 'image/png' }), 'proof-1'); return data;
  }
  const auth = { Authorization: 'Bearer ' + token };
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(base, { headers: { Authorization: 'Bearer ' + noPermission } })).status, 403);
  const incomplete = { ...payload, items: [...payload.items, { ...payload.items[0], name: 'Mouse', attachmentKeys: [] }] };
  const invalid = await fetch(base, { method: 'POST', headers: auth, body: body(incomplete) });
  assert.equal(invalid.status, 400); assert.match((await invalid.json()).error, /Item 2/);
  const broken = await fetch(base, { method: 'POST', headers: auth, body: body(payload, Buffer.from('invalid image')) });
  assert.equal(broken.status, 400); assert.deepEqual(await readdir(directory), []);
  
  // 1. Save complete request (Siap Cetak)
  const saved = await fetch(base, { method: 'POST', headers: auth, body: body() });
  assert.equal(saved.status, 201);
  const { id } = await saved.json();
  const detail = await (await fetch(base + '/' + id, { headers: auth })).json();
  assert.equal(detail.title, 'Pengadaan Laptop Staff');
  assert.equal(detail.status, 'ready_to_print');
  assert.equal(detail.items[0].subtotal, '12398000');
  assert.equal(detail.items[0].attachments.length, 1);
  
  // 2. Status Transition: ready_to_print -> pending_signature
  const toPending = await fetch(base + '/' + id + '/status', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toStatus: 'pending_signature', notes: 'Formulir dicetak untuk tanda tangan basah' })
  });
  assert.equal(toPending.status, 200);

  // Invalid jump: pending_signature -> completed directly (disallowed)
  const invalidJump = await fetch(base + '/' + id + '/status', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toStatus: 'completed', notes: 'Loncat status' })
  });
  assert.equal(invalidJump.status, 400);

  // 3. Upload signed document
  const signedDocForm = new FormData();
  signedDocForm.append('document', new Blob([new Uint8Array(image)], { type: 'image/png' }), 'scan-ttd-basah.png');
  const uploadDoc = await fetch(base + '/' + id + '/signed-document', {
    method: 'POST',
    headers: auth,
    body: signedDocForm
  });
  assert.equal(uploadDoc.status, 201);
  const signedDocRes = await uploadDoc.json();
  assert.ok(signedDocRes.id);

  // Download signed document
  const streamDoc = await fetch(base + '/' + id + '/signed-document/' + signedDocRes.id, { headers: auth });
  assert.equal(streamDoc.status, 200);

  // 4. Status Transition: pending_signature -> approved_manually
  const toApproved = await fetch(base + '/' + id + '/status', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toStatus: 'approved_manually', notes: 'Tanda tangan 5 pihak lengkap di formulir fisik' })
  });
  assert.equal(toApproved.status, 200);

  // 5. History audit log
  const historyRes = await fetch(base + '/' + id + '/history', { headers: auth });
  assert.equal(historyRes.status, 200);
  const history = await historyRes.json();
  assert.ok(history.length >= 3);
  assert.equal(history[history.length - 1].toStatus, 'approved_manually');

  // 6. Create Draft
  const draftData = new FormData();
  draftData.append('payload', JSON.stringify({
    title: 'Draft Meja Kantor',
    purpose: 'Rencana',
    isDraft: true,
    items: []
  }));
  const draftSaved = await fetch(base, { method: 'POST', headers: auth, body: draftData });
  assert.equal(draftSaved.status, 201);
  const draftId = (await draftSaved.json()).id;
  const draftDetail = await (await fetch(base + '/' + draftId, { headers: auth })).json();
  assert.equal(draftDetail.status, 'draft');
  assert.equal(draftDetail.items.length, 0);

  // Filter list by status
  const filterList = await (await fetch(base + '?status=draft', { headers: auth })).json();
  assert.equal(filterList.items.every((it: any) => it.status === 'draft'), true);
});
