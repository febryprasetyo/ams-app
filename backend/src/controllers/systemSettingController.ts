import { Request, Response } from 'express';
import { db } from '../db';
import { systemSettings } from '../db/schema/system';
import { eq, sql } from 'drizzle-orm';

export async function getSystemSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const rows = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (rows.length === 0) {
      return res.status(200).json({ key, value: null });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve system setting' });
  }
}

export async function getAllSystemSettings(_req: Request, res: Response) {
  try {
    const rows = await db.select().from(systemSettings);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
}

export async function setSystemSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const result = await db
      .insert(systemSettings)
      .values({
        key,
        value,
        description: description ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          description: description !== undefined ? description : sql`COALESCE(${systemSettings.description}, NULL)`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.status(200).json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update system setting' });
  }
}
