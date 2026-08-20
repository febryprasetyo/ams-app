import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env';

const JWT_EXPIRES_IN = '1d';

export interface TokenPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
}

export function generateToken(payload: TokenPayload): string {
  const env = loadEnv();
  return jwt.sign(payload, env.jwtSecret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  const env = loadEnv();
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
