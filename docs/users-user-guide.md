# Users – End‑User Guide
---
## 1. Overview
The **Users** module manages application users, their roles, and access permissions. Administrators can create new user accounts, assign roles (SUPER_ADMIN, HR_ADMIN, etc.), and reset passwords.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View user list / details | `view-users` |
| Create, edit, delete users | `manage-users` |
| Assign roles / permissions | `manage-users` |
| Reset user password | `manage-users` |

If you lack permission the UI hides the Users section and API calls return **403**.

## 3. Related Settings
No dedicated settings; user data is stored in MongoDB and cached via Redis.

## 4. UI Pages & Workflow
- **User List** (`/users`): Table of users with columns: Name, Email, Role, Status, Last login. Actions: **Edit**, **Delete**, **Reset Password**.
- **Create User** (`/users/new`): Form to input name, email, role, initial password (must meet password policy).
- **Edit User** (`/users/:id/edit`): Modify role, status (active/inactive), and contact info.
- **User Activity** (`/users/:id/activity`): Audit log of user actions, login history, and permission changes.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/users` | List all users | `view-users` |
| POST | `/users` | Create a new user | `manage-users` |
| GET | `/users/:id` | Get user details | `view-users` |
| PATCH | `/users/:id` | Update user (role, status) | `manage-users` |
| DELETE | `/users/:id` | Delete (soft‑delete) a user | `manage-users` |
| POST | `/users/:id/reset-password` | Reset password for user | `manage-users` |
| GET | `/users/:id/activity` | Get user activity log | `view-audit` |

## 6. Edge Cases & Gotchas
- **Password policy** – New passwords must satisfy the same complexity rules defined in `authConfig`.
- **Role hierarchy** – SUPER_ADMIN bypasses all permission checks; other roles are limited to the permissions listed in `permissions.ts`.
- **Soft‑delete** – Deleting a user sets `isActive: false`; the record remains for audit purposes.
- **Email uniqueness** – The system enforces unique email addresses; duplicate attempts return a validation error.

## 7. Quick Actions Summary
- **Add User** → Users → **Add User** button → fill form → **Create**.
- **Edit User** → list → **Edit** (pencil) → modify → **Save**.
- **Delete User** → list → **Delete** (trash) → confirm.
- **Reset Password** → list → **Reset Password** → new temporary password is emailed.
- **View Activity** → user row → **Activity** button → view audit log.

*Generated on **2026‑06‑12***