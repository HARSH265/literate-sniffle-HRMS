# Auth Module — Audit Report

**Date:** May 30, 2026
**Module:** Authentication & Authorization
**Status:** Audit Complete — 16 Fixes Applied

---

## 1. Architecture Overview

### Components

| Layer | Implementation | Files |
|-------|---------------|-------|
| Server Auth | JWT dual-token (access + refresh), bcrypt, Mongoose | `server/src/modules/auth/` (6 files) |
| Server Middleware | authenticate, authorize, permissions.config | `server/src/core/permissions/` (3 files) |
| Server Errors | AppError, asyncHandler, errorHandler | `server/src/core/errors/` (3 files) |
| Server Auth Utility | TokenBlacklist | `server/src/core/auth/TokenBlacklist.ts` |
| Server Email | sendEmail | `server/src/core/email/sendEmail.ts` |
| Client Auth | Zustand + localStorage, Axios interceptors | `client/src/features/auth/` (6 files) |
| Client State | authStore (Zustand persist) | `client/src/core/stores/authStore.ts` |
| Client API | apiClient (Axios + interceptors) | `client/src/core/api/apiClient.ts` |
| Client Route Guard | ProtectedRoute | `client/src/core/components/ProtectedRoute.tsx` |

### Auth Flow

```
Login → POST /auth/login → Rate limiter → Zod validation → User.findOne
  → bcrypt.compare → lockout check → Sign tokens (separate secrets)
  → Set httpOnly cookies (jwt + refreshToken) → Client stores user + token only

Refresh → 401 caught → POST /auth/refresh → refresh token from httpOnly cookie
  → jwt.verify (JWT_REFRESH_SECRET) → User.findById → Issue new pair
  → Set new cookies → Retry request

Logout → POST /auth/logout → Null refresh token in DB → Blacklist access token
  → Clear both cookies → Client clears Zustand + localStorage
```

### RBAC

- 5 roles: super-admin, hr-admin, hr-staff, accounts, manager
- 51 permissions across all modules
- Server: `authorize()` middleware checks role permissions
- Client: `ProtectedRoute` component wraps sensitive routes
- Client: `usePermission()` hook for UI filtering

---

## 2. Security Findings

### CRITICAL

| # | Issue | Status | File |
|---|-------|--------|------|
| 1 | JWT secret may be example value | ⚠️ Requires manual `.env` update | `server/.env` |
| 2 | Hardcoded fallback JWT secret | ✅ FIXED — throws in production | `env.ts` |

### HIGH

| # | Issue | Status | File |
|---|-------|--------|------|
| 3 | No server-side auth check on app load | ✅ FIXED — `/auth/me` on mount | `App.tsx` |
| 4 | Access + refresh tokens same secret | ✅ FIXED — separate `JWT_REFRESH_SECRET` | `env.ts`, `auth.service.ts` |
| 5 | Access token not revocable after logout | ✅ FIXED — TokenBlacklist | `TokenBlacklist.ts` |
| 6 | Single refresh token per user | ⚠️ Known limitation — acceptable for scale | `auth.service.ts` |

### MEDIUM

| # | Issue | Status | File |
|---|-------|--------|------|
| 7 | No client-side route-level RBAC | ✅ FIXED — ProtectedRoute component | `App.tsx`, `ProtectedRoute.tsx` |
| 8 | Refresh token in localStorage (XSS) | ✅ FIXED — httpOnly cookie | `auth.controller.ts`, `authStore.ts` |
| 9 | Socket.io no auth middleware | ⚠️ Intentional — kiosk needs public access | `socket.ts` |
| 10 | ESS logout doesn't call server | ✅ FIXED | `EssLayout.tsx` |
| 11 | Duplicate password history | ✅ FIXED — removed from pre-save hook | `User.model.ts` |
| 12 | Lockout timing disclosed | ✅ FIXED — generic message | `auth.service.ts` |
| 13 | Missing algorithms in jwt.verify | ✅ FIXED | `authenticate.middleware.ts` |
| 14 | Token expiry 2 DB queries per login | ✅ FIXED — single query, reused | `auth.service.ts` |

### LOW

| # | Issue | Status | File |
|---|-------|--------|------|
| 15 | Demo credentials in UI | ✅ FIXED — dev-only | `LoginPage.tsx` |
| 16 | Dead registration form | ✅ FIXED — removed | `LoginPage.tsx` |
| 17 | `/auth/me` never called | ✅ FIXED — called on app load | `App.tsx` |
| 18 | No password reset flow | ✅ FIXED — forgot + reset endpoints | `auth.service.ts`, `auth.routes.ts` |
| 19 | No account unlock mechanism | ✅ FIXED — admin unlock endpoint | `auth.service.ts`, `auth.routes.ts` |
| 20 | CORS wide open in dev | ⚠️ Acceptable for development | `app.ts` |

---

## 3. Edge Cases

| # | Edge Case | Current Behavior | Risk |
|---|-----------|------------------|------|
| 1 | Concurrent logins from 2 devices | 2nd login overwrites 1st device's refresh token | Medium |
| 2 | Access token used after logout | ✅ Immediately revoked via blacklist | Low |
| 3 | Simultaneous refresh requests | Both succeed, 2nd overwrites 1st refresh token | Medium |
| 4 | Token expires during active session | Client interceptor triggers refresh automatically | Low |
| 5 | localStorage cleared but cookie exists | Refresh token in httpOnly cookie, can still refresh | Low |
| 6 | Account locked out | 15 min lockout, admin can unlock | Low |
| 7 | Password changed on another device | Current device's JWT still valid, refresh still works | Medium |
| 8 | Password reset requested | 1 hour expiry, single use, hashed token in DB | Low |

---

## 4. Client-Server Wiring

| Check | Status | Notes |
|-------|--------|-------|
| API client configured | ✅ | Axios with baseURL, timeout, withCredentials |
| Token attached to requests | ✅ | Request interceptor adds Bearer header |
| 401 handling | ✅ | Response interceptor with refresh + queue |
| Token refresh | ✅ | Cookie-based, no body needed |
| Logout — back-office | ✅ | Calls server, blacklists token, clears cookies |
| Logout — ESS/mobile | ✅ | Now calls server endpoint |
| Auth check on app load | ✅ | `/auth/me` validates token on mount |
| Route protection — server | ✅ | All modules use `authenticate` + `authorize` |
| Route protection — client | ✅ | ProtectedRoute on sensitive routes |
| Error boundary | ✅ | Wraps auth routes |

---

## 5. Performance Checklist Cross-Reference

Items from the global performance checklist that are implemented in this module:

| Checklist Item | How Auth Implements It |
|----------------|----------------------|
| Rate limiting: auth routes 10/min | `app.ts` — `authLimiter` on `/api/v1/auth` |
| Rate limiting: general routes 100/min | `app.ts` — `generalLimiter` on `/api/v1` |
| Request timeout: 30 seconds | `app.ts` — global timeout middleware |
| Maximum request body size: 10MB | `app.ts` — express.json limit |
| Global error handler | `errorHandler.ts` — JWT, Mongo, validation |
| Stack traces hidden in production | `errorHandler.ts` — generic 500 message |
| express-mongo-sanitize | `app.ts` — applied globally |
| helmet | `app.ts` — applied globally |
| CORS configured | `app.ts` — restricted in production |
| Health check endpoint | `app.ts` — `GET /api/v1/health` |
| ResponseHandler | `auth.controller.ts` — all endpoints |

---

## 6. Fixes Applied

| # | Fix | Severity | Files Changed |
|---|-----|----------|---------------|
| 1 | JWT secret throws in production if missing | CRITICAL | `env.ts` |
| 2 | `/auth/me` validates token on app load | HIGH | `App.tsx` |
| 3 | Token blacklist for immediate revocation | HIGH | `TokenBlacklist.ts`, `authenticate.middleware.ts`, `auth.service.ts`, `auth.controller.ts` |
| 4 | `algorithms: ['HS256']` in authenticate middleware | HIGH | `authenticate.middleware.ts` |
| 5 | Separate JWT_REFRESH_SECRET for refresh tokens | HIGH | `env.ts`, `.env`, `auth.service.ts` |
| 6 | Client-side RBAC with ProtectedRoute | HIGH | `ProtectedRoute.tsx`, `App.tsx` |
| 7 | Refresh token in httpOnly cookie | HIGH | `auth.controller.ts`, `authStore.ts`, `apiClient.ts`, `LoginPage.tsx` |
| 8 | Fixed duplicate password history | MEDIUM | `User.model.ts` |
| 9 | Server logout call in ESS layout | MEDIUM | `EssLayout.tsx` |
| 10 | Merged 2 DB queries into 1 | MEDIUM | `auth.service.ts` |
| 11 | refreshToken index on User model | MEDIUM | `User.model.ts` |
| 12 | Generic lockout message | MEDIUM | `auth.service.ts` |
| 13 | Password reset flow (forgot + reset) | MEDIUM | `auth.service.ts`, `auth.routes.ts`, `auth.validation.ts`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` |
| 14 | Account unlock mechanism | MEDIUM | `auth.service.ts`, `auth.routes.ts`, `auth.validation.ts` |
| 15 | Removed dead registration form | LOW | `LoginPage.tsx` |
| 16 | Demo credentials dev-only | LOW | `LoginPage.tsx` |

---

## 7. Remaining Items

| # | Item | Reason |
|---|------|--------|
| 1 | Socket.io auth middleware | Intentional — kiosk needs public access |
| 2 | CORS in development | Acceptable for dev environment |
| 3 | Single refresh token per user | Acceptable for current scale |

---

## 8. Files Modified/Created

### Server
| File | Change |
|------|--------|
| `server/.env` | Added `JWT_REFRESH_SECRET` |
| `server/src/config/env.ts` | Added `JWT_REFRESH_SECRET`, throws in production |
| `server/src/core/auth/TokenBlacklist.ts` | **New** — in-memory token blacklist |
| `server/src/core/email/sendEmail.ts` | **New** — email service |
| `server/src/core/permissions/authenticate.middleware.ts` | Added `algorithms`, blacklist check |
| `server/src/modules/auth/auth.service.ts` | Separate secrets, merged queries, blacklist, forgot/reset/unlock |
| `server/src/modules/auth/auth.controller.ts` | Refresh token cookie, forgot/reset/unlock endpoints |
| `server/src/modules/auth/auth.routes.ts` | Added forgot-password, reset-password, unlock-account routes |
| `server/src/modules/auth/auth.validation.ts` | Added forgotPassword, resetPassword, unlockAccount schemas |
| `server/src/models/User.model.ts` | Removed pre-save history, added refreshToken index |
| `server/src/models/PasswordResetToken.model.ts` | **New** — reset token storage |

### Client
| File | Change |
|------|--------|
| `client/src/core/components/ProtectedRoute.tsx` | **New** — RBAC route guard |
| `client/src/core/api/apiClient.ts` | Refresh via cookie, no body needed |
| `client/src/core/stores/authStore.ts` | Removed refreshToken from store |
| `client/src/App.tsx` | `/auth/me` validation, ProtectedRoute, forgot/reset routes |
| `client/src/features/auth/pages/LoginPage.tsx` | Removed registration, forgot password link, dev-only demo creds |
| `client/src/features/auth/pages/ForgotPasswordPage.tsx` | **New** — forgot password form |
| `client/src/features/auth/pages/ResetPasswordPage.tsx` | **New** — reset password form |
| `client/src/features/employee-self-service/layout/EssLayout.tsx` | Added server logout call |
