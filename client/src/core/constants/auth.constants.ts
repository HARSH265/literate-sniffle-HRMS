export const AUTH_CONSTANTS = {
  cookieNames: {
    jwt: 'jwt',
    refreshToken: 'refreshToken',
  },
  storageKeys: {
    authSlice: 'hrms-auth',
    returnUrl: 'returnUrl',
  },
  sessionTimeoutMs: 30 * 60 * 1000,
  sessionWarningMs: 2 * 60 * 1000,
  refreshTokenMaxAgeDays: 7,
  activityEvents: ['mousedown', 'keydown', 'scroll', 'touchstart'] as const,
} as const;

export type AuthCookieName = typeof AUTH_CONSTANTS.cookieNames[keyof typeof AUTH_CONSTANTS.cookieNames];
export type AuthStorageKey = typeof AUTH_CONSTANTS.storageKeys[keyof typeof AUTH_CONSTANTS.storageKeys];
