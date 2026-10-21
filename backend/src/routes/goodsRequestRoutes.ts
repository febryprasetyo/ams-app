import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { and, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  goodsRequests,
  goodsRequestItems,
  goodsRequestAttachments,
  goodsRequestStatusLogs,
  goodsRequestSignedDocuments,
} from '../db/schema/goodsRequests';
import { users } from '../db/schema/users';
import { authenticateToken, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import {
  GoodsInputError,
  GoodsRequestStatus,
  isRequestEditable,
  isValidStatusTransition,
  validateGoodsRequest,
} from '../domain/goodsRequest';
import {
  GOODS_STORAGE_ROOT,
  saveGoodsEvidence,
  saveSignedDocument,
} from '../services/goodsEvidence';

const router = Router();
router.use(authenticateToken);
const view = requirePermission('ga.requests.view');
const create = requirePermission('ga.requests.create');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 60,
    fileSize: 512000,
    fields: 2,
    fieldSize: 100000,
    parts: 62,
  },
}).array('evidence', 60);

const uploadSigned = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
    fields: 1,
  },
}).single('document');

const asyncRoute = (handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };

const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

router.get('/', view, asyncRoute(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Math.floor(Number(req.query.page)) || 1));
  const limit = 20;
  const statusFilter = typeof req.query.status === 'string' && req.query.status.trim() !== ''
    ? req.query.status.trim()
    : undefined;

  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 1000) : '';
  const searchClause = search ? sql`(
    strpos(lower(${goodsRequests.title}), lower(${search})) > 0
    or strpos(lower(${goodsRequests.requesterName}), lower(${search})) > 0
    or strpos(lower(${goodsRequests.division}), lower(${search})) > 0
    or strpos(lower('GA-' || replace(${goodsRequests.requestDate}::text, '-', '') || '-' || left(${goodsRequests.id}::text, 8)), lower(${search})) > 0
    or exists (
      select 1 from ga_goods_request_items i
      where i.request_id = ${goodsRequests.id} and strpos(lower(i.name), lower(${search})) > 0
    )
  )` : undefined;
  const whereClause = and(statusFilter ? eq(goodsRequests.status, statusFilter) : undefined, searchClause);

  const [items, [total]] = await Promise.all([
    db.select({
      ...getTableColumns(goodsRequests),
      creatorName: users.username,
      matchedItemNames: search ? sql<string[]>`array(select i.name from ga_goods_request_items i where i.request_id = ${goodsRequests.id} and strpos(lower(i.name), lower(${search})) > 0 order by i.position)` : sql<string[]>`array[]::text[]`,
      firstItemName: sql<string | null>`(select i.name from ga_goods_request_items i where i.request_id = ${goodsRequests.id} order by i.position, i.id limit 1)`,
      itemCount: sql<number>`(select count(*)::int from ga_goods_request_items i where i.request_id = ga_goods_requests.id)`,
      totalEstimated: sql<string>`coalesce((select sum(subtotal)::text from ga_goods_request_items i where i.request_id = ga_goods_requests.id), '0')`,
    })
      .from(goodsRequests)
      .leftJoin(users, eq(goodsRequests.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(goodsRequests.createdAt), desc(goodsRequests.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)::int` })
      .from(goodsRequests)
      .where(whereClause),
  ]);

  res.json({ items, total: total.count, page, pageSize: limit });
}));

router.get('/:id', view, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
  const [request] = await db.select({
    ...getTableColumns(goodsRequests),
    creatorName: users.username,
  })
    .from(goodsRequests)
    .leftJoin(users, eq(goodsRequests.createdBy, users.id))
    .where(eq(goodsRequests.id, req.params.id));

  if (!request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  const items = await db.select()
    .from(goodsRequestItems)
    .where(eq(goodsRequestItems.requestId, request.id))
    .orderBy(goodsRequestItems.position);

  const attachments = items.length
    ? await db.select({
        id: goodsRequestAttachments.id,
        itemId: goodsRequestAttachments.itemId,
        size: goodsRequestAttachments.size,
      })
      .from(goodsRequestAttachments)
      .where(inArray(goodsRequestAttachments.itemId, items.map(item => item.id)))
    : [];

  const signedDocuments = await db.select({
    id: goodsRequestSignedDocuments.id,
    fileName: goodsRequestSignedDocuments.fileName,
    size: goodsRequestSignedDocuments.size,
    createdAt: goodsRequestSignedDocuments.createdAt,
    uploaderName: users.username,
  })
    .from(goodsRequestSignedDocuments)
    .leftJoin(users, eq(goodsRequestSignedDocuments.uploadedBy, users.id))
    .where(eq(goodsRequestSignedDocuments.requestId, request.id))
    .orderBy(desc(goodsRequestSignedDocuments.createdAt));

  res.json({
    ...request,
    items: items.map(item => ({
      ...item,
      attachments: attachments.filter(file => file.itemId === item.id),
    })),
    signedDocuments,
  });
}));

router.get('/:id/history', view, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  const logs = await db.select({
    id: goodsRequestStatusLogs.id,
    requestId: goodsRequestStatusLogs.requestId,
    fromStatus: goodsRequestStatusLogs.fromStatus,
    toStatus: goodsRequestStatusLogs.toStatus,
    notes: goodsRequestStatusLogs.notes,
    createdAt: goodsRequestStatusLogs.createdAt,
    changerName: users.username,
  })
    .from(goodsRequestStatusLogs)
    .leftJoin(users, eq(goodsRequestStatusLogs.changedBy, users.id))
    .where(eq(goodsRequestStatusLogs.requestId, req.params.id))
    .orderBy(goodsRequestStatusLogs.createdAt, goodsRequestStatusLogs.id);

  res.json(logs);
}));

router.get('/:id/evidence/:attachmentId', view, asyncRoute(async (req, res) => {
  if (!validId(req.params.id) || !validId(req.params.attachmentId)) {
    return res.status(404).json({ error: 'Lampiran tidak ditemukan.' });
  }

  const [file] = await db.select({ storageKey: goodsRequestAttachments.storageKey })
    .from(goodsRequestAttachments)
    .innerJoin(goodsRequestItems, eq(goodsRequestItems.id, goodsRequestAttachments.itemId))
    .where(and(
      eq(goodsRequestItems.requestId, req.params.id),
      eq(goodsRequestAttachments.id, req.params.attachmentId)
    ));

  if (!file) return res.status(404).json({ error: 'Lampiran tidak ditemukan.' });

  res.set({
    'Content-Type': 'image/webp',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  res.sendFile(path.resolve(GOODS_STORAGE_ROOT, file.storageKey), err => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'File lampiran tidak tersedia. Hubungi administrator.' });
    }
  });
}));

router.post('/:id/signed-document', create, uploadSigned, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
  const [request] = await db.select().from(goodsRequests).where(eq(goodsRequests.id, req.params.id));
  if (!request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  const file = req.file;
  if (!file) throw new GoodsInputError('File dokumen fisik bertanda tangan wajib dilampirkan.');

  const directory = path.join(GOODS_STORAGE_ROOT, request.id);
  const stored = await saveSignedDocument(directory, file.buffer, file.originalname);
  const documentId = randomUUID();

  await db.insert(goodsRequestSignedDocuments).values({
    id: documentId,
    requestId: request.id,
    storageKey: request.id + '/' + stored.storageKey,
    fileName: file.originalname,
    size: stored.size,
    uploadedBy: req.user!.userId,
  });

  res.status(201).json({ id: documentId, fileName: file.originalname, size: stored.size });
}));

router.get('/:id/signed-document/:docId', view, asyncRoute(async (req, res) => {
  if (!validId(req.params.id) || !validId(req.params.docId)) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
  }

  const [doc] = await db.select().from(goodsRequestSignedDocuments)
    .where(and(
      eq(goodsRequestSignedDocuments.requestId, req.params.id),
      eq(goodsRequestSignedDocuments.id, req.params.docId)
    ));

  if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });

  const isPdf = doc.storageKey.endsWith('.pdf');
  res.set({
    'Content-Type': isPdf ? 'application/pdf' : 'image/webp',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  res.sendFile(path.resolve(GOODS_STORAGE_ROOT, doc.storageKey), err => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'File dokumen fisik tidak tersedia.' });
    }
  });
}));

router.post('/:id/status', create, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
  const [request] = await db.select().from(goodsRequests).where(eq(goodsRequests.id, req.params.id));
  if (!request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  const toStatus = req.body.toStatus as GoodsRequestStatus;
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';

  if (!isValidStatusTransition(request.status as GoodsRequestStatus, toStatus)) {
    return res.status(400).json({
      error: `Transisi status dari '${request.status}' ke '${toStatus}' tidak diizinkan.`,
    });
  }

  if ((toStatus === 'cancelled' || toStatus === 'rejected') && !notes) {
    return res.status(400).json({ error: toStatus === 'rejected' ? 'Alasan penolakan wajib diisi.' : 'Catatan alasan pembatalan wajib diisi.' });
  }

  if (toStatus === 'approved_manually') {
    const items = await db.select().from(goodsRequestItems).where(eq(goodsRequestItems.requestId, request.id));
    const attachments = items.length ? await db.select().from(goodsRequestAttachments)
      .where(inArray(goodsRequestAttachments.itemId, items.map(item => item.id))) : [];
    validateGoodsRequest({ ...request, items: items.map(item => ({
      ...item,
      estimatedPrice: Number(item.estimatedPrice),
      attachmentKeys: attachments.filter(file => file.itemId === item.id).map(file => file.id),
    })) }, attachments.map(file => file.id));
  }

  await db.transaction(async tx => {
    await tx.update(goodsRequests)
      .set({ status: toStatus })
      .where(eq(goodsRequests.id, request.id));

    await tx.insert(goodsRequestStatusLogs).values({
      requestId: request.id,
      fromStatus: request.status,
      toStatus,
      notes,
      changedBy: req.user!.userId,
    });
  });

  res.json({ success: true, status: toStatus });
}));

router.post('/', create, upload, asyncRoute(async (req, res) => {
  const files = (req.files || []) as Express.Multer.File[];
  let raw: any;
  try {
    raw = JSON.parse(req.body.payload);
  } catch {
    throw new GoodsInputError('Data pengajuan tidak valid.');
  }

  const isDraft = raw.isDraft === true || raw.isDraft === 'true';
  const input = validateGoodsRequest(raw, files.map(file => file.originalname), isDraft);
  const requestId = randomUUID();
  const directory = path.join(GOODS_STORAGE_ROOT, requestId);

  try {
    const evidence = new Map<string, { storageKey: string; size: number }>();
    for (const file of files) {
      const stored = await saveGoodsEvidence(directory, file.buffer);
      evidence.set(file.originalname, { ...stored, storageKey: requestId + '/' + stored.storageKey });
    }

    await db.transaction(async tx => {
      await tx.insert(goodsRequests).values({
        id: requestId,
        title: input.title,
        purpose: input.purpose,
        status: input.status,
        version: 1,
        requestDate: input.requestDate,
        requesterName: input.requesterName,
        jobTitle: input.jobTitle,
        division: input.division,
        createdBy: req.user!.userId,
      });

      await tx.insert(goodsRequestStatusLogs).values({
        requestId,
        fromStatus: '',
        toStatus: input.status,
        notes: 'Draft pengajuan dibuat',
        changedBy: req.user!.userId,
      });

      for (const [position, item] of input.items.entries()) {
        const [saved] = await tx.insert(goodsRequestItems).values({
          requestId,
          position: position + 1,
          name: item.name,
          quantity: item.quantity,
          estimatedPrice: String(item.estimatedPrice),
          subtotal: String(item.subtotal),
          notes: item.notes,
        }).returning();

        if (item.attachmentKeys && item.attachmentKeys.length > 0) {
          await tx.insert(goodsRequestAttachments).values(
            item.attachmentKeys.map(key => ({
              id: randomUUID(),
              itemId: saved.id,
              ...evidence.get(key)!,
            }))
          );
        }
      }
    });

    res.status(201).json({ id: requestId });
  } catch (error) {
    await rm(directory, { recursive: true, force: true }).catch(cleanupError =>
      console.error('GA evidence cleanup failed', cleanupError)
    );
    throw error;
  }
}));


router.put('/:id', create, upload, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
  const [request] = await db.select().from(goodsRequests).where(eq(goodsRequests.id, req.params.id));
  if (!request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  if (!isRequestEditable(request.status)) {
    return res.status(403).json({ error: 'Pengajuan yang sudah disetujui atau diproses tidak dapat diubah.' });
  }

  const files = (req.files || []) as Express.Multer.File[];
  let raw: any;
  try {
    raw = JSON.parse(req.body.payload);
  } catch {
    throw new GoodsInputError('Data pengajuan tidak valid.');
  }

  const existingItems = await db.select().from(goodsRequestItems).where(eq(goodsRequestItems.requestId, request.id));
  const existingAtts = existingItems.length
    ? await db.select().from(goodsRequestAttachments).where(inArray(goodsRequestAttachments.itemId, existingItems.map(i => i.id)))
    : [];
  const existingAttMap = new Map(existingAtts.map(att => [att.id, att]));

  const newFileNames = files.map(file => file.originalname);
  const availableKeys = [...newFileNames, ...existingAtts.map(att => att.id)];

  const isDraft = raw.isDraft === true || raw.isDraft === 'true';
  const input = validateGoodsRequest(raw, availableKeys, isDraft);
  const directory = path.join(GOODS_STORAGE_ROOT, request.id);

  const evidence = new Map<string, { storageKey: string; size: number }>();
  for (const file of files) {
    const stored = await saveGoodsEvidence(directory, file.buffer);
    evidence.set(file.originalname, { ...stored, storageKey: request.id + '/' + stored.storageKey });
  }

  const nextVersion = (request.version || 1) + 1;

  await db.transaction(async tx => {
    await tx.update(goodsRequests)
      .set({
        title: input.title,
        purpose: input.purpose,
        requestDate: input.requestDate,
        requesterName: input.requesterName,
        jobTitle: input.jobTitle,
        division: input.division,
        version: nextVersion,
      })
      .where(eq(goodsRequests.id, request.id));

    await tx.insert(goodsRequestStatusLogs).values({
      requestId: request.id,
      fromStatus: request.status,
      toStatus: request.status,
      notes: `Pengajuan diperbarui (Versi ${nextVersion})`,
      changedBy: req.user!.userId,
    });

    // Delete existing items (cascades to attachments)
    await tx.delete(goodsRequestItems).where(eq(goodsRequestItems.requestId, request.id));

    // Re-insert items and re-link attachments
    for (const [position, item] of input.items.entries()) {
      const [saved] = await tx.insert(goodsRequestItems).values({
        requestId: request.id,
        position: position + 1,
        name: item.name,
        quantity: item.quantity,
        estimatedPrice: String(item.estimatedPrice),
        subtotal: String(item.subtotal),
        notes: item.notes,
      }).returning();

      if (item.attachmentKeys && item.attachmentKeys.length > 0) {
        const attValues = item.attachmentKeys.map(key => {
          if (existingAttMap.has(key)) {
            const oldAtt = existingAttMap.get(key)!;
            return {
              id: oldAtt.id,
              itemId: saved.id,
              storageKey: oldAtt.storageKey,
              size: oldAtt.size,
            };
          }
          const newlyStored = evidence.get(key)!;
          return {
            id: randomUUID(),
            itemId: saved.id,
            storageKey: newlyStored.storageKey,
            size: newlyStored.size,
          };
        });
        await tx.insert(goodsRequestAttachments).values(attValues);
      }
    }
  });

  res.json({ success: true, id: request.id, version: nextVersion });
}));

router.delete('/:id', create, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
  const [request] = await db.select().from(goodsRequests).where(eq(goodsRequests.id, req.params.id));
  if (!request) return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });

  if (!isRequestEditable(request.status)) {
    return res.status(403).json({ error: 'Pengajuan yang sudah disetujui atau diproses tidak dapat dihapus.' });
  }

  await db.delete(goodsRequests).where(eq(goodsRequests.id, request.id));

  const directory = path.join(GOODS_STORAGE_ROOT, request.id);
  await rm(directory, { recursive: true, force: true }).catch(() => {});

  res.json({ success: true, message: 'Pengajuan berhasil dihapus.' });
}));

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Lampiran melebihi batas: maksimal 3 gambar per item, 500 KB per gambar, dan 20 item.',
    });
  }
  if (error instanceof GoodsInputError) return res.status(400).json({ error: error.message });
  console.error('GA request failed', error);
  res.status(500).json({ error: 'Pengajuan belum dapat diproses. Coba kembali; data formulir tetap tersedia.' });
});

export default router;
