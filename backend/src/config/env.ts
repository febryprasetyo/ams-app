import dotenv from 'dotenv';

dotenv.config();

export interface AppEnv {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  agentApiKey: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const errors: string[] = [];

  const rawDbUrl = source.DATABASE_URL?.trim();
  if (!rawDbUrl) {
    errors.push('DATABASE_URL is required and cannot be empty');
  } else {
    try {
      const parsed = new URL(rawDbUrl);
      if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
        errors.push('DATABASE_URL must be a valid postgresql:// or postgres:// URL');
      }
    } catch {
      errors.push('DATABASE_URL must be a valid URL');
    }
  }

  const jwtSecret = source.JWT_SECRET?.trim();
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required and cannot be empty');
  }

  const jwtRefreshSecret = source.JWT_REFRESH_SECRET?.trim();
  if (!jwtRefreshSecret) {
    errors.push('JWT_REFRESH_SECRET is required and cannot be empty');
  }

  const agentApiKey = source.AGENT_API_KEY?.trim();
  if (!agentApiKey) {
    errors.push('AGENT_API_KEY is required and cannot be empty');
  }

  const rawPort = source.PORT?.trim() || '5000';
  const port = parseInt(rawPort, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  const rawNodeEnv = source.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(rawNodeEnv)) {
    errors.push("NODE_ENV must be 'development', 'test', or 'production'");
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration validation failed:\n - ${errors.join('\n - ')}`);
  }

  return {
    port,
    nodeEnv: rawNodeEnv as 'development' | 'test' | 'production',
    databaseUrl: rawDbUrl!,
    jwtSecret: jwtSecret!,
    jwtRefreshSecret: jwtRefreshSecret!,
    agentApiKey: agentApiKey!,
  };
}
