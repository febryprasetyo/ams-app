import { timingSafeEqual } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

function keysMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function createAgentAuthenticator(expectedKey: string) {
  if (!expectedKey) throw new Error('Agent API key cannot be empty');

  return (req: Request, res: Response, next: NextFunction) => {
    const provided = req.header('X-Agent-Key') ?? '';

    if (!keysMatch(provided, expectedKey)) {
      return res.status(401).json({ error: 'Invalid agent credentials' });
    }

    next();
  };
}
