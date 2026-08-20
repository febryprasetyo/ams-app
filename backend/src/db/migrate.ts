import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import { loadEnv } from '../config/env';

export async function runMigrations(databaseUrl: string, migrationsFolder?: string): Promise<void> {
  const resolvedFolder = migrationsFolder || path.resolve(__dirname, '../../drizzle');
  console.log(`⚡ Running journal-based Drizzle migrations from: ${resolvedFolder}`);

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: resolvedFolder });
    console.log('✅ Drizzle migrations applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))) {
  const env = loadEnv();
  runMigrations(env.databaseUrl)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
