import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as usersSchema from './schema/users';
import * as masterSchema from './schema/master';
import * as vendorsSchema from './schema/vendors';
import * as assetsSchema from './schema/assets';
import * as employeesSchema from './schema/employees';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ams_itsm_db',
});

export const db = drizzle(pool, {
  schema: {
    ...usersSchema,
    ...masterSchema,
    ...vendorsSchema,
    ...assetsSchema,
    ...employeesSchema,
  },
});
