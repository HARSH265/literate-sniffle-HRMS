export const AUTH_CONSTANTS = {
  cookieNames: {
    jwt: 'jwt',
    refreshToken: 'refreshToken',
  },
  cookieMaxAge: {
    refreshTokenDays: 7,
  },
  defaultLockDurationMs: 15 * 60 * 1000,
  maxFailedLoginAttempts: 5,
  passwordHistoryDefault: 5,
} as const;
