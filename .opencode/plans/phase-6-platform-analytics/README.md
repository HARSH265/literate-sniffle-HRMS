# Phase 6: Platform & Analytics

## Features
1. Dashboard / BI Analytics
2. PWA / Mobile Optimization
3. Multi-language / i18n

---

## 6.1 Dashboard / BI Analytics

### Overview
Advanced analytics dashboards with drill-down capabilities, customizable widgets, trend analysis, and Excel export. Non-intrusively augments the existing DashboardPage with rich BI capabilities.

### Configuration (Settings)
- `analyticsConfig` section in `CompanySettings`:
  - `advancedAnalyticsEnabled` (Boolean, default: true)
  - `dashboardRefreshIntervalSeconds` (Number, default: 300)
  - `defaultDateRange` (String, default: 'this-month')
  - `maxWidgetsPerDashboard` (Number, default: 12)
  - `allowCustomWidgets` (Boolean, default: true)
  - `exportEnabled` (Boolean, default: true)
  - `trendAnalysisEnabled` (Boolean, default: false)
  - `comparisonPeriods` (Boolean, default: true)
  - `drillDownEnabled` (Boolean, default: true)
  - `cachedDataMaxAgeMinutes` (Number, default: 15)

### Server Plan

**Model: DashboardWidget** (new model — user-specific)
Fields: `user` (ref User), `title` (String), `widgetType` (String), `position` ({ x, y, w, h }), `config` (JSON), `dataSource` (String), `filters` (JSON), `isDefault` (Boolean), `isActive` (Boolean)

**Widget Types:**
- `employee-count` — total active, by department, by designation
- `attendance-summary` — today's count, absent %, late %
- `payroll-summary` — total payroll this month, vs last month
- `leave-summary` — pending approvals, by type
- `headcount-trend` — monthly headcount line chart
- `attendance-trend` — daily/weekly attendance trend
- `department-distribution` — pie chart of employees by dept
- `gender-distribution` — pie chart
- `overtime-summary` — total OT hours, by department
- `turnover-rate` — monthly/quarterly turnover
- `pending-actions` — pending approvals count widget
- `compliance-calendar` — upcoming filing/reminder dates
- `custom-kpi` — user-defined metric with formula

**Service:** `analytics.service.ts`
- `getDashboardData(userId)` — compute all active widget data
- `getWidgetData(userId, widgetId)` — single widget data
- `saveWidget(userId, widgetData)` — create/update custom widget
- `deleteWidget(userId, widgetId)` — remove widget
- `getTrend(metric, period, filters)` — trend data for charts
- `getComparison(metric, currentPeriod, previousPeriod)` — period comparison
- `getDrillDown(widgetType, filters)` — drill into detail data
- `getExportData(dashboardId, format)` — export all widget data to Excel
- `getPrebuiltDashboard(role)` — role-based default dashboards
- `resetToDefault(userId)` — reset to role defaults

**Controller:** `analytics.controller.ts`

**Routes:**
| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/analytics/dashboard` | `view-analytics` | Get dashboard data |
| GET | `/analytics/widgets` | `view-analytics` | List user's widgets |
| POST | `/analytics/widgets` | `manage-analytics` | Save widget |
| PATCH | `/analytics/widgets/:id` | `manage-analytics` | Update widget |
| DELETE | `/analytics/widgets/:id` | `manage-analytics` | Delete widget |
| GET | `/analytics/trend/:metric` | `view-analytics` | Trend data |
| GET | `/analytics/comparison/:metric` | `view-analytics` | Period comparison |
| GET | `/analytics/drill-down` | `view-analytics` | Drill-down data |
| GET | `/analytics/export` | `view-analytics` | Export dashboard |
| POST | `/analytics/reset` | `manage-analytics` | Reset to defaults |

**Validation:** `analytics.validation.ts`

**Tests:**
- Widget CRUD
- Data computation accuracy for each widget type
- Trend analysis data generation
- Caching behavior
- Export generation

### Client Plan

**Module:** `client/src/features/analytics/` (or extend existing dashboard)

**Pages/Components:**
- `DashboardPage.tsx` (enhanced) — widget grid with drag-and-drop
- `WidgetConfigModal.tsx` — configure widget type, data source, filters
- `WidgetGrid.tsx` — react-grid-layout based grid
- `WidgetCard.tsx` — individual widget container
- `StatWidget.tsx` — simple number stat
- `LineChartWidget.tsx` — Recharts line chart
- `BarChartWidget.tsx` — Recharts bar chart
- `PieChartWidget.tsx` — Recharts pie chart
- `TableWidget.tsx` — data table widget
- `DrillDownModal.tsx` — drill-down detail modal
- `PeriodComparisonToggle.tsx`

**Route:** `/dashboard` (enhance existing route)

### Fallbacks
- **Slow queries:** Cache dashboard data for 15 minutes; use aggregation pipelines
- **Empty data:** Show friendly empty states, not errors
- **Widget limits:** Enforce maxWidgetsPerDashboard from Settings
- **Export timeouts:** Generate exports async, notify when ready

---

## 6.2 PWA / Mobile Optimization

### Overview
Progressive Web App capabilities for mobile access. Employees can mark attendance, view payslips, apply for leave, and receive notifications offline.

### Implementation

**1. Service Worker Registration**
- Register service worker, cache static assets
- Cache API responses with Network-First strategy

**2. Manifest Configuration**
- Generate `manifest.json` via `vite-plugin-pwa`

**3. Offline Support**
- `offlineQueue.ts` — queue mutations when offline
- Sync queue when back online (Background Sync API)

**4. Mobile-Specific Pages**
- `/m/scan` — enhance with camera QR scanner (html5-qrcode already in deps)
- `/m/attendance` — simplified mobile attendance
- `/m/leave` — quick leave application
- `/m/payslips` — view/download on mobile
- `/m/profile` — ESS profile on mobile

**5. Push Notifications**
- Use existing Notification module + Service Worker push events

**Route:** `/m/*` (all public routes, like existing `/m/scan`)

### Fallbacks
- **No service worker support:** Graceful degradation to regular web app
- **Offline queue overflow:** Warn user before exceeding storage limit
- **Sync conflicts:** Server-side last-write-wins with timestamp

---

## 6.3 Multi-language / i18n

### Overview
Internationalization for regional languages. Useful for factory workforce (Hindi, Marathi, Tamil, etc.).

### Implementation

**1. i18n Framework**
- Install `react-i18next` + `i18next`
- Language detection via browser + user preference

**2. Translation Structure**
```
client/src/core/i18n/
├── index.ts
├── locales/
│   ├── en/ (common.json, auth.json, employees.json, ...)
│   ├── hi/ (Hindi)
│   └── mr/ (Marathi)
```

**3. Backend**
- Add `preferredLanguage` to User model
- Add `defaultLanguage` to CompanySettings

**4. Language Switcher**
- In header/layout
- Persist in User profile
- No page reload needed

### Configuration (Settings)
- `i18nConfig` section:
  - `multiLanguageEnabled` (Boolean, default: false)
  - `defaultLanguage` (String, default: 'en')
  - `availableLanguages` ([String], default: ['en'])
  - `allowUserPreference` (Boolean, default: true)

### Fallbacks
- **Missing translation:** English fallback + console warning
- **RTL support:** Ant Design ConfigProvider RTL

---

## Development Rules (Phase 6)

1. **Dashboard** must NOT break existing dashboard — enhance the current DashboardPage
2. **PWA** must NOT break existing `/m/scan` and `/m/confirm` routes — enhance them
3. **i18n** translations incrementally — start with most-used features first
4. **Settings toggles** must independently disable each feature
5. **Dashboard aggregation** should use MongoDB aggregation pipelines
6. **PWA cache** must not cache sensitive data offline
