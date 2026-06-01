import dotenv from 'dotenv';

dotenv.config();
import { VaultService } from '../core/vault/vault.service.js';

// Load all secrets from Vault (dev mode). In production this will throw if Vault is unavailable.
const vaultSecrets = await VaultService.loadAll();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  allowedOrigins: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()),

  MONGODB_URI: process.env.MONGODB_URI || vaultSecrets.MONGODB_URI || '',
  // Database connection pool settings
  DB_MAX_POOL: parseInt(process.env.DB_MAX_POOL || '20', 10),
  DB_MIN_POOL: parseInt(process.env.DB_MIN_POOL || '5', 10),
  DB_SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '30000', 10),
  DB_SOCKET_TIMEOUT_MS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '60000', 10),

  JWT_SECRET: process.env.JWT_SECRET || vaultSecrets.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET must be set in production'); })() : 'dev-secret-not-for-production'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || vaultSecrets.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET must be set in production'); })() : 'dev-refresh-secret-not-for-production'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || '1',
  // Redis configuration for clustering (optional)
  REDIS_URL: process.env.REDIS_URL || vaultSecrets.REDIS_URL || '',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || vaultSecrets.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || vaultSecrets.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || vaultSecrets.CLOUDINARY_API_SECRET || '',

  EMAIL_HOST: process.env.EMAIL_HOST || vaultSecrets.EMAIL_HOST || '',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || vaultSecrets.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || vaultSecrets.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || vaultSecrets.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || vaultSecrets.EMAIL_FROM || '',
  // Cache configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),

  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || vaultSecrets.ENCRYPTION_KEY || (() => { throw new Error('ENCRYPTION_KEY must be set'); })(),
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
};