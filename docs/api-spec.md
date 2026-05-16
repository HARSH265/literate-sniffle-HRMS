# API Specification — Manufacturing HRMS V1

## Base URL
`/api/v1`

## Authentication
- `POST /auth/login` — Login with email/password, returns JWT in httpOnly cookie
- `POST /auth/logout` — Clear cookie
- `GET /auth/me` — Get current authenticated user
- `POST /auth/change-password` — Change password

## Users
- `GET /users` — List users (paginated)
- `POST /users` — Create user
- `GET /users/:id` — Get user by ID
- `PATCH /users/:id` — Update user
- `DELETE /users/:id` — Delete user (soft)

## Departments
- `GET /departments` — List departments (cached)
- `POST /departments` — Create department
- `GET /departments/:id` — Get department by ID
- `PATCH /departments/:id` — Update department
- `DELETE /departments/:id` — Delete department

## Designations
- `GET /designations` — List designations (cached)
- `POST /designations` — Create designation
- `GET /designations/:id` — Get designation by ID
- `PATCH /designations/:id` — Update designation
- `DELETE /designations/:id` — Delete designation

## Shifts
- `GET /shifts` — List shifts (cached)
- `POST /shifts` — Create shift
- `GET /shifts/:id` — Get shift by ID
- `PATCH /shifts/:id` — Update shift
- `DELETE /shifts/:id` — Delete shift

## Employees
- `GET /employees` — List employees (paginated, with filters)
- `POST /employees` — Create employee
- `GET /employees/:id` — Get employee by ID
- `PATCH /employees/:id` — Update employee
- `DELETE /employees/:id` — Delete employee

## Holidays
- `GET /holidays` — List holidays (cached)
- `POST /holidays` — Create holiday
- `GET /holidays/:id` — Get holiday by ID
- `PATCH /holidays/:id` — Update holiday
- `DELETE /holidays/:id` — Delete holiday

## Weekly Off Rules
- `GET /weekly-off-rules` — List weekly off rules (cached)
- `POST /weekly-off-rules` — Create rule
- `GET /weekly-off-rules/:id` — Get rule by ID
- `PATCH /weekly-off-rules/:id` — Update rule
- `DELETE /weekly-off-rules/:id` — Delete rule

## Attendance
- `GET /attendance` — List attendance entries (paginated, filtered by date range, employee, month)
- `POST /attendance/bulk` — Bulk entry by date
- `GET /attendance/monthly/:employeeId` — Monthly attendance grid for employee
- `GET /attendance/summary` — Attendance summary (aggregation)

## Overtime Rules
- `GET /overtime-rules` — List overtime rules
- `POST /overtime-rules` — Create rule
- `GET /overtime-rules/:id` — Get rule by ID
- `PATCH /overtime-rules/:id` — Update rule
- `DELETE /overtime-rules/:id` — Delete rule

## Overtime Entries
- `GET /overtime-entries` — List overtime entries (paginated)
- `POST /overtime-entries` — Create entry
- `GET /overtime-entries/:id` — Get entry by ID
- `PATCH /overtime-entries/:id` — Update entry
- `DELETE /overtime-entries/:id` — Delete entry

## Payroll Runs
- `GET /payroll/runs` — List payroll runs (paginated)
- `POST /payroll/runs` — Create and process payroll run for month
- `GET /payroll/runs/:id` — Get payroll run by ID
- `PATCH /payroll/runs/:id/finalize` — Finalize payroll run
- `PATCH /payroll/runs/:id` — Update remarks

## Payroll Items
- `GET /payroll/items` — List payroll items (paginated, by month, employee, run)
- `GET /payroll/items/:id` — Get payroll item by ID
- `PATCH /payroll/items/:id` — Update payroll item

## Salary Slips
- `GET /salary-slips` — List salary slips (paginated)
- `GET /salary-slips/:id` — Get salary slip data
- `GET /salary-slips/:id/pdf` — Download salary slip as PDF
- `POST /salary-slips/generate/:payrollRunId` — Generate slips for a payroll run

## Reports
- `GET /reports/attendance` — Attendance report (Excel export)
- `GET /reports/payroll` — Payroll report (Excel export)
- `GET /reports/employees` — Employee list (Excel export)

## Settings
- `GET /settings` — Get company settings
- `PATCH /settings` — Update company settings

## Audit Logs
- `GET /audit-logs` — List audit logs (paginated, with filters)

## Notifications
- `GET /notifications` — List user notifications (paginated)
- `PATCH /notifications/:id/read` — Mark as read
- `PATCH /notifications/read-all` — Mark all as read
- `GET /notifications/unread-count` — Get unread count

## File Upload
- `POST /upload/logo` — Upload company logo
- `POST /upload/employee-photo` — Upload employee profile photo

## Response Shapes

### Success
```json
{ "success": true, "message": "...", "data": {...} }
```

### Paginated
```json
{ "success": true, "message": "...", "data": [...], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### Error
```json
{ "success": false, "message": "...", "errors": [...] }
```

## Standard Query Parameters (List endpoints)
`page`, `limit`, `sort`, `order`, `search`, `status`, `department`, `category`, `month`, `startDate`, `endDate`