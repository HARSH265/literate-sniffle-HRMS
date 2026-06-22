# Permission Module Audit Report

## Overview
This report audits the permission system across server (Node/Express) and client (React/Zustand), identifying drift, gaps, and enforcement issues.

---

## Architecture
```
Server: permissions.config.ts (static defaults)
        RolePermission model (DB overrides, only when customized)
        authorize middleware (checks role -> permission, 60s cache)
        SUPER_ADMIN bypasses all checks

Client: ROLE_PERMISSIONS (static constants, synced with server config)
        usePermission hook (checks user.permissions || ROLE_PERMISSIONS[role])
        ProtectedRoute (route-level guard)
        Sidebar (menu visibility)
```

---

## Findings

### CRITICAL: Worker Role Missing from Validation Schema
- `permissions.validation.ts` enum: `['super-admin', 'hr-admin', 'hr-staff', 'accounts', 'manager']`
- `worker` role excluded - cannot update/reset worker permissions via API
- **Status:** FIXED - Added `'worker'` to the enum

### CRITICAL: Server/Client Permission Matrix Drift
- `ROLE_PERMISSIONS` in `client/src/core/constants/permissions.ts` was manually duplicated from `server/src/core/permissions/permissions.config.ts`
- Already diverged across multiple roles
- **Status:** FIXED - Rewrote `ROLE_PERMISSIONS` to exactly match server config

### HIGH: Client Never Fetches Custom Permissions
- Login response did NOT include permissions
- `user.permissions` was always `undefined` for non-admin users
- Custom permissions enforced server-side but invisible client-side
- **Status:** FIXED - Added `GET /auth/permissions` endpoint, fetch on login

### HIGH: Many Routes Unprotected in App.tsx
- ~25 routes had no `ProtectedRoute` guard
- Server-side protection existed, but user saw page shell before 403
- **Status:** FIXED - Wrapped all routes with appropriate `ProtectedRoute`

### MEDIUM: ProtectedRoute Silently Redirects
- No toast/notification when redirecting due to missing permission
- **Status:** FIXED - Added `message.warning()` on permission denied

---

## Remediation Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Worker role missing from validation | CRITICAL | FIXED |
| 2 | Sync client/server permission matrix | CRITICAL | FIXED |
| 3 | Fetch permissions on login | HIGH | FIXED |
| 4 | Add ProtectedRoute to all routes | HIGH | FIXED |
| 5 | ProtectedRoute redirect message | MEDIUM | FIXED |

---

## Files Changed

| File | Change |
|------|--------|
| `server/src/modules/permissions/permissions.validation.ts` | Added `'worker'` to role enum |
| `client/src/core/constants/permissions.ts` | Rewrote `ROLE_PERMISSIONS` to match server config |
| `server/src/modules/auth/auth.service.ts` | Added `getEffectivePermissions()` method |
| `server/src/modules/auth/auth.controller.ts` | Added `getMyPermissions` handler |
| `server/src/modules/auth/auth.routes.ts` | Added `GET /auth/permissions` route |
| `client/src/core/constants/api.endpoints.ts` | Added `auth.permissions` endpoint |
| `client/src/features/auth/pages/LoginPage.tsx` | Fetch permissions from new endpoint |
| `client/src/App.tsx` | Added `ProtectedRoute` to 25+ routes |
| `client/src/core/components/ProtectedRoute.tsx` | Added permission warning toast |

---
