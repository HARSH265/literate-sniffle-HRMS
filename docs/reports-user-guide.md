# Reports – End‑User Guide
---

## 1. Overview
The **Reports** module provides HR staff, managers, and administrators with data exports, summary dashboards, custom report building, and interactive charts. Users can download Excel files for employees, attendance, payroll, and overtime, view high‑level statistics, drill down into specific entities, and create ad‑hoc queries.

---
## 2. Permissions
| Action | Required permission |
|--------|----------------------|
| View reports page (all tabs) | `view-reports` |
| Export employee / attendance / payroll / overtime data | `view-reports` |
| View summary dashboards (attendance, payroll, department, leave) | `view-reports` |
| Build custom reports (send JSON query) | `view-reports` |
| View interactive charts & drill‑down data | `view-reports` |
| Save / load scheduled export configuration | `manage-settings` (settings group) |

If you lack a permission, the entire Reports page or specific tabs/buttons are hidden and API calls will return **403 Unauthorized**.

---
## 3. Related Settings
Reports generation reads the following **CompanySettings.reportsConfig** fields (editable via **Settings → Reports**):
- **reportsConfig.scheduledExportEnabled** – Enables automated nightly/weekly/monthly exports.
- **reportsConfig.scheduledExportFrequency** – Export cadence (`daily`, `weekly`, `monthly`).
- **reportsConfig.scheduledExportDay** – Day of week (1‑7) for weekly exports or day of month for monthly exports.
- **reportsConfig.scheduledExportFormat** – File format for scheduled exports (`xlsx` or `csv`).
- **reportsConfig.scheduledExportRecipients** – Email addresses that receive scheduled export files.
- **reportsConfig.scheduledExportReports** – List of report identifiers to include in the scheduled export (e.g., `attendance`, `payroll`).

---
## 4. UI Pages & Workflow
### 4.1 Reports Main Page (`/reports`)
A **PageHeader** shows the title *Reports* with the subtitle *Export data, view interactive charts, and build custom reports*.
Four tabs are available:
- **Export** – Choose a report type (Employees, Attendance, Payroll, Overtime), set filters, and click **Export** to download an Excel (`.xlsx`) file.
- **Summary** – Shows high‑level statistical cards and tables for Attendance, Payroll, Department, and Leave. Each card can open a drill‑down modal for deeper analysis.
- **Custom Report** – Builder UI that lets you write a JSON query (payload) and generate a custom report. The result is displayed in a table and can be exported.
- **Charts** – Select a chart type (`attendance`, `payroll`, `department`, `leave`), grouping (`month`, `department`, `category`, `status`), and a date range. The chart renders using the server‑provided data.

### 4.2 Export Tab
For each report type a card displays relevant filter controls:
- **Employee Export** – Filter by status, category, and department.
- **Attendance Report** – Filter by department, optional date range, or a specific month/year.
- **Payroll Report** – Filter by department, optional date range, or a specific fiscal year.
- **Overtime Report** – Filter by department and month.
After configuring filters, click **Export**. The UI calls the corresponding `/reports/<type>` endpoint and triggers a file download named `<type>_YYYY‑MM‑DD.xlsx`.

### 4.3 Summary Tab
Displays four summary sections (Attendance, Payroll, Department, Leave) each with key metrics (totals, averages, counts). Clicking a **Drill‑Down** button on a row triggers a request to `/reports/drill-down` with the entity and optional filters. Results appear in a modal showing a detailed table for the selected entity.

### 4.4 Custom Report Tab
- Write a JSON payload defining the *select*, *where*, *groupBy*, etc. (see API docs).
- Click **Generate Report**.
- The server returns a result set; the UI renders it in a table and provides an **Export** button to download the data.

### 4.5 Charts Tab
- Choose **Chart Type** (Attendance, Payroll, Department, Leave).
- Choose **Group By** (Month, Department, Category, Status).
- Select a **Period** (date range via a month picker range).
- The chart updates automatically; hover for exact values.
- Clicking a chart segment can open a drill‑down view (handled internally).

---
## 5. API Reference (for troubleshooting)
| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/reports/employees` | Export employee list (filters via query) | `view-reports` |
| GET | `/reports/attendance` | Export attendance data (filters: month, year, department, optional date range) | `view-reports` |
| GET | `/reports/payroll` | Export payroll data (filters: year, department, optional date range) | `view-reports` |
| GET | `/reports/overtime` | Export overtime data (filters: month, year, department) | `view-reports` |
| GET | `/reports/attendance/summary` | Get attendance summary statistics | `view-reports` |
| GET | `/reports/payroll/summary` | Get payroll summary statistics | `view-reports` |
| GET | `/reports/department/summary` | Get department‑wise summary | `view-reports` |
| GET | `/reports/leave/summary` | Get leave summary statistics | `view-reports` |
| GET | `/reports/chart-data` | Retrieve chart data for a given entity, group, and period | `view-reports` |
| GET | `/reports/drill-down` | Retrieve detailed rows for a selected entity (e.g., employee, department) | `view-reports` |
| POST | `/reports/custom` | Generate a custom report based on a JSON query payload | `view-reports` |
| GET | `/reports/scheduled-export-config` | Get current scheduled export configuration | `manage-settings` |
| POST | `/reports/scheduled-export-config` | Save scheduled export configuration (recipients, frequency, report list) | `manage-settings` |

---
## 6. Quick Actions Summary
- **Export any report** → Export tab → set filters → click **Export**.
- **View summary dashboards** → Summary tab → read high‑level stats → click **Drill‑Down** for details.
- **Create a custom report** → Custom Report tab → write JSON query → **Generate Report** → export if needed.
- **Explore charts** → Charts tab → pick chart type, grouping, period → view visual data.
- **Schedule regular exports** → Settings → Reports (requires `manage-settings`).

---
*Generated on **2026‑06‑11***