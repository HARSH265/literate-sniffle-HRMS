import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:5173'),

  allowedOrigins: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()),

  MONGODB_URI: requireEnv('MONGODB_URI', process.env.NODE_ENV === 'production' ? undefined : 'mongodb://localhost:27017/hrms'),
  DB_MAX_POOL: parseInt(process.env.DB_MAX_POOL || '20', 10),
  DB_MIN_POOL: parseInt(process.env.DB_MIN_POOL || '5', 10),
  DB_SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '30000', 10),
  DB_SOCKET_TIMEOUT_MS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS || '60000', 10),

  JWT_SECRET: requireEnv('JWT_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-secret-not-for-production'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-refresh-secret-not-for-production'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '24h'),
  JWT_COOKIE_EXPIRES_IN: optionalEnv('JWT_COOKIE_EXPIRES_IN', '1'),

  REDIS_URL: optionalEnv('REDIS_URL', ''),

  CLOUDINARY_CLOUD_NAME: optionalEnv('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: optionalEnv('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: optionalEnv('CLOUDINARY_API_SECRET', ''),

  EMAIL_HOST: optionalEnv('EMAIL_HOST', ''),
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: optionalEnv('EMAIL_USER', ''),
  EMAIL_PASSWORD: optionalEnv('EMAIL_PASSWORD', ''),
  EMAIL_FROM: optionalEnv('EMAIL_FROM', ''),

  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),

  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY', process.env.NODE_ENV === 'production' ? undefined : 'dev-encryption-key-not-for-production-123456'),
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
};

const requiredInProduction = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];

if (env.NODE_ENV === 'production') {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Required environment variable ${key} is not set. Check your .env file or deployment configuration.`);
    }
  }
}