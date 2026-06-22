# Authentication Flow Documentation

## Overview

This document describes the authentication architecture, error codes, and security measures implemented in the Orian HRMS application.

## Authentication Flow

### Login

1. User submits `POST /auth/login` with email and password
2. Server validates credentials against `User` collection
3. If account is locked (`lockUntil > now`), returns `423`
4. If credentials valid:
   - Generates JWT token (HS256, configurable expiry)
   - Generates refresh token (HS256, 7-day expiry)
   - Sets `jwt` cookie (httpOnly, secure, sameSite=strict)
   - Sets `refreshToken` cookie (httpOnly, secure, sameSite=strict, path=/)
   - Returns user object + tokens
5. Client stores user in Zustand store (persisted to localStorage)
6. Client fetches effective permissions from `/permissions/roles/{role}`

### Token Refresh

1. On 401 response, client interceptor attempts refresh
2. `POST /auth/refresh` with refresh token cookie
3. Server validates refresh token against `User.refreshToken`
4. Invalidates old refresh token, issues new pair
5. Returns new JWT + refresh token
6. Client retries original request with new token

### Session Timeout

- **Timeout:** 30 minutes of inactivity
- **Warning:** Banner shown at 2 minutes remaining
- **Activity events:** mousedown, keydown, scroll, touchstart, visibilitychange
- **On timeout:** Store cleared, redirected to `/login`

### Logout

- `POST /auth/logout` clears refresh token from DB
- JWT added to blacklist with remaining TTL
- Cookies cleared
- Client store cleared and persisted storage wiped

## Error Codes

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `Invalid or expired reset token` | Password reset token is invalid, used, or expired |
| 400 | `Cannot reuse any of your last 5 passwords` | New password matches recent history |
| 401 | `Invalid email or password` | Authentication failed |
| 401 | `Account is deactivated` | User account is disabled |
| 401 | `Token has been revoked` | JWT found in blacklist |
| 401 | `Token expired` | JWT has passed expiry |
| 401 | `Invalid token` | JWT is malformed |
| 401 | `No token provided` | No JWT cookie or Bearer header |
| 401 | `Invalid refresh token` | Refresh token not found or mismatched |
| 401 | `No refresh token provided` | No refresh token in request |
| 403 | `Forbidden` | User lacks required permission |
| 409 | `Email already exists` | Duplicate email on registration |
| 423 | `Account locked` | Too many failed login attempts |
| 429 | `Too many requests` | Rate limit exceeded |

## Rate Limiting

| Endpoint | Window | Max | Key |
|----------|--------|-----|-----|
| `POST /auth/login` | 15 min | 10 | IP + email |
| `POST /auth/forgot-password` | 1 hour | 5 | IP + email |
| `POST /auth/reset-password` | 1 hour | 5 | IP + email |

## Security Measures

- **Password hashing:** bcrypt with salt rounds
- **JWT:** HS256 with configurable expiry
- **Token blacklist:** Redis-backed, falls back to in-memory
- **Cookie security:** httpOnly, secure (production), sameSite=strict
- **Rate limiting:** Per-IP + per-email to prevent brute force
- **Account lockout:** After 5 failed attempts, locked for 15 minutes
- **Password policy:** Configurable min length, complexity requirements
- **Password history:** Last 5 passwords cannot be reused

## Remediation Status

| Phase | Status | Items |
|-------|--------|-------|
| Phase 1 | Completed | Critical security fixes |
| Phase 2 | Completed | High-priority fixes |
| Phase 3 | Completed | Medium-priority fixes |
| Phase 4 | In Progress | Polish and documentation |
