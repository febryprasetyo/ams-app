import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/*',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://erpcahaya:erpcahaya123@192.168.10.23:5432/ams_db',
  },
  verbose: true,
  strict: true,
});
