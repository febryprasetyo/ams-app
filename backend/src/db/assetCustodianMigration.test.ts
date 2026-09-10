import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { pool, closeDatabase } from './index';

test('custodian migration backfills referenced holders, rejects orphans, and optional specs retain positive checks', async () => {
  const client = await pool.connect();
  const namespace = `custodian_migration_${process.pid}`;
  const migration = readFileSync(resolve('drizzle/0007_asset_custodians.sql'), 'utf8').replaceAll('"public"', `"${namespace}"`);
  async function prepare() {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA "${namespace}"`);
    await client.query(`SET LOCAL search_path TO "${namespace}"`);
    await client.query(`CREATE TABLE users(id bigint PRIMARY KEY);
      CREATE TABLE locations(id bigint PRIMARY KEY,name varchar(100));
      CREATE TABLE departments(id bigint PRIMARY KEY,name varchar(100));
      CREATE TABLE employees(id bigint PRIMARY KEY,full_name varchar(150),location_id bigint,department_id bigint);
      CREATE TABLE assets(id bigint PRIMARY KEY,current_user_id bigint,location_id bigint);
      CREATE TABLE asset_assignment_history(id bigint PRIMARY KEY,asset_id bigint,employee_id bigint);
      CREATE TABLE asset_computer_specs(id bigint PRIMARY KEY, cpu_name varchar(200) NOT NULL,
        ram_size_gb integer NOT NULL CHECK(ram_size_gb>0),ram_slot_count integer NOT NULL CHECK(ram_slot_count>0),
        disk_1_size_gb integer NOT NULL CHECK(disk_1_size_gb>0), disk_2_size_gb integer CHECK(disk_2_size_gb>0));
      INSERT INTO locations VALUES(1,'Jakarta');
      INSERT INTO departments VALUES(1,'Finance');
      INSERT INTO employees VALUES(1,'  Budi   Santoso ',1,1),(2,'Historical Holder',NULL,NULL),(3,'Unreferenced HR',NULL,NULL);
      INSERT INTO assets VALUES(1,1,1),(2,NULL,NULL);
      INSERT INTO asset_assignment_history VALUES(1,1,1),(2,2,2),(3,2,NULL);`);
  }
  try {
    await prepare();
    await client.query(migration);
    const holders = await client.query('SELECT * FROM asset_custodians ORDER BY employee_id');
    assert.equal(holders.rows.length, 2);
    assert.equal(holders.rows[0].display_name, 'Budi Santoso');
    assert.equal(holders.rows[0].normalized_name, 'budi santoso');
    assert.equal(holders.rows[0].unit_text, 'Finance');
    const current = await client.query('SELECT current_user_id,current_custodian_id FROM assets ORDER BY id');
    assert.equal(current.rows[0].current_user_id, '1');
    assert.equal(current.rows[0].current_custodian_id, holders.rows[0].id);
    assert.equal(current.rows[1].current_custodian_id, null);
    const history = await client.query('SELECT * FROM asset_assignment_history ORDER BY id');
    assert.equal(history.rows[0].custodian_name_snapshot, 'Budi Santoso');
    assert.equal(history.rows[0].location_name_snapshot, 'Jakarta');
    assert.equal(history.rows[1].custodian_name_snapshot, 'Historical Holder');
    assert.equal(history.rows[2].custodian_id, null);
    await client.query(readFileSync(resolve('drizzle/0008_optional_computer_specs.sql'), 'utf8'));
    await client.query('INSERT INTO asset_computer_specs(id) VALUES(1)');
    await client.query('INSERT INTO asset_computer_specs(id,ram_size_gb) VALUES(2,16)');
    await client.query('SAVEPOINT invalid_spec');
    await assert.rejects(client.query('INSERT INTO asset_computer_specs(id,ram_size_gb) VALUES(3,0)'), /check constraint/);
    await client.query('ROLLBACK TO SAVEPOINT invalid_spec');
    await client.query('ROLLBACK');
    await prepare();
    await client.query('UPDATE assets SET current_user_id=999 WHERE id=1');
    await assert.rejects(client.query(migration), /unresolved legacy employee references/);
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await closeDatabase();
  }
});
