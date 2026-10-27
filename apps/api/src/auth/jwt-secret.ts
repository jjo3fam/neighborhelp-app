import { ConfigService } from '@nestjs/config';

/**
 * Resolves the JWT secret through ConfigService so values from .env are honoured
 * (reading process.env at module-definition time runs before .env is loaded).
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-secret';
}
