# Component Master – End‑User Guide
---
## 1. Overview
The **Component Master** module stores reusable UI component definitions, style settings, and theming assets used across the HRMS front‑end. It is primarily an internal developer tool and does not have a dedicated end‑user UI.

## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View component definitions | `view-settings` |
| Create / update component definitions | `manage-settings` |
| Delete component definitions | `manage-settings` |

If you lack permission, the component management UI (usually accessed via an admin settings panel) will be hidden.

## 3. Related Settings
No specific `CompanySettings` fields; component data lives in the `componentMaster` collection in MongoDB and is version‑controlled via the UI.

## 4. UI Pages & Workflow
- **Component Library** (`/settings/components`): Lists all defined components with preview thumbnails. Actions: **Add**, **Edit**, **Delete**.
- **Component Editor** (`/settings/components/:id/edit`): Form to edit HTML/JSX templates, CSS, and metadata.

## 5. API Reference
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/settings/components` | List components | `view-settings` |
| POST | `/settings/components` | Create component | `manage-settings` |
| PATCH | `/settings/components/:id` | Update component | `manage-settings` |
| DELETE | `/settings/components/:id` | Delete component | `manage-settings` |

## 6. Edge Cases & Gotchas
- Changes affect all pages that reference the component; test in a staging environment before publishing.
- Deleting a component that is in use will cause UI errors; the system warns about dependencies.

## 7. Quick Actions Summary
- **Add Component** → **Add** button → fill template → **Create**.
- **Edit Component** → click component → **Edit** → modify → **Save**.
- **Delete Component** → **Delete** icon → confirm.

*Generated on **2026‑06‑12***