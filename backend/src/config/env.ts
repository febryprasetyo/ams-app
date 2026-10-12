import dotenv from 'dotenv';

dotenv.config();

export interface AppEnv {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  agentApiKey: string;
  corsAllowedOrigins?: string[];
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const errors: string[] = [];

  const rawNodeEnv = source.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(rawNodeEnv)) {
    errors.push("NODE_ENV must be 'development', 'test', or 'production'");
  }
  const isProduction = rawNodeEnv === 'production';

  const rawDbUrl = source.DATABASE_URL?.trim();
  if (!rawDbUrl) {
    errors.push('DATABASE_URL is required and cannot be empty');
  } else {
    try {
      const parsed = new URL(rawDbUrl);
      if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
        errors.push('DATABASE_URL must be a valid postgresql:// or postgres:// URL');
      } else if (isProduction) {
        const dbPassword = decodeURIComponent(parsed.password || '');
        if (!dbPassword || dbPassword.length < 16) {
          errors.push('DATABASE_URL password must not use weak or default credentials (min 16 chars required in production)');
        } else if (/postgres|admin|default|password|12345/i.test(dbPassword)) {
          errors.push('DATABASE_URL password must not use weak or default credentials (e.g. postgres, admin, password)');
        }
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

  if (isProduction && jwtSecret && jwtRefreshSecret && agentApiKey) {
    // 1. Length enforcement
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    }
    if (jwtRefreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }
    if (agentApiKey.length < 32) {
      errors.push('AGENT_API_KEY must be at least 32 characters long in production');
    }

    // 2. Secret uniqueness enforcement
    if (jwtSecret === jwtRefreshSecret) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be distinct keys');
    }
    if (jwtSecret === agentApiKey) {
      errors.push('JWT_SECRET and AGENT_API_KEY must be distinct keys');
    }
    if (jwtRefreshSecret === agentApiKey) {
      errors.push('JWT_REFRESH_SECRET and AGENT_API_KEY must be distinct keys');
    }

    // 3. Anti-placeholder & dev values check
    const placeholderRegex = /replace-with|generate-|dev-|ci-|placeholder|default|secret1234|password123/i;
    if (placeholderRegex.test(jwtSecret)) {
      errors.push('JWT_SECRET contains prohibited dev/placeholder values');
    }
    if (placeholderRegex.test(jwtRefreshSecret)) {
      errors.push('JWT_REFRESH_SECRET contains prohibited dev/placeholder values');
    }
    if (placeholderRegex.test(agentApiKey)) {
      errors.push('AGENT_API_KEY contains prohibited dev/placeholder values');
    }
  }

  const rawPort = source.PORT?.trim() || '5000';
  const port = parseInt(rawPort, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535');
  }

  const corsOrigins = source.CORS_ALLOWED_ORIGINS
    ? source.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : undefined;

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
    corsAllowedOrigins: corsOrigins,
  };
}
