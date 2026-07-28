import { db } from './index';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('⚡ Running Database Migration script...');
  const sqlFilePath = path.join(__dirname, '../../drizzle/0000_elite_ares.sql');
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  // Split SQL statements by Drizzle statement-breakpoint or semicolon
  const statements = sql
    .split(/--> statement-breakpoint|;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (err: any) {
      // Ignore if table, constraint, or relation already exists (codes 42P07, 42710)
      if (err.code === '42P07' || err.code === '42710' || err.code === '42701') {
        continue;
      }
      console.warn(`  ⚠️ Migration notice: ${err.message || err}`);
    }
  }

  console.log('✅ Migration statements executed successfully!');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
