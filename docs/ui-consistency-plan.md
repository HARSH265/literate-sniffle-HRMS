# UI Consistency Plan

## Golden Rules (non-negotiable)

Every page in the application MUST follow these rules. No exceptions.

### Rule 1 — Page Layout
- Every page wraps content in `<PageContainer>`
- `<PageHeader>` is the first element inside PageContainer
- PageHeader has `title`, optionally `subtitle` and `actions`

### Rule 2 — Tables
- Every table uses `<DataTable>` from `core/components`
- NO raw Ant `<Table>` anywhere
- `rowKey` is always `"id"` (never `"_id"`)
- `pageSize` is never set explicitly (defaults to 10 from APP_CONSTANTS)
- `showSizeChanger` is not set (defaults to true)

### Rule 3 — Colors
- NO inline hex colors (`#ff4d4f`, `#52c41a`, `#1890ff`, etc.)
- Use CSS custom properties only:
  - `var(--hrms-primary)` — indigo
  - `var(--hrms-success)` — muted green (positive values)
  - `var(--hrms-danger)` — muted red (negative values)
  - `var(--hrms-text-secondary)` — secondary text
  - `var(--hrms-text-muted)` — muted text
  - `var(--hrms-border)` — borders

### Rule 4 — Empty / Error / Loading States
- Empty data → `<EmptyState>` component
- API error → `<ErrorState>` component (with retry)
- Loading → DataTable's built-in `loading` prop (skeleton)
- Full-page loading → `<Spin>` centered (only for detail/form pages)

### Rule 5 — Buttons & Actions
- Primary actions → `Button type="primary"`
- Secondary actions → `Button type="default"`
- Destructive actions → `Button danger`
- Action groups → `<Space size={4}>` with `size="small"` buttons
- Export buttons → consistent "Export" label

### Rule 6 — Modals & Drawers
- Forms inside modals use Ant `<Form>` with `layout="vertical"`
- Modal footer uses `onOk` / `onCancel` pattern (no custom footer)
- Drawer width is consistent (default 480, wide 720)

### Rule 7 — Stat Cards
- Use `<Card>` with `<Statistic>` inside (consistent pattern)
- No custom stat card CSS classes
- Statistic uses `prefix` prop for currency symbol (not inside value)

### Rule 8 — Status Badges
- Use `<Tag>` with standard Ant Design color presets only
- No custom status badge CSS classes

---

## Spacing & Typography Standards

### Component spacing (vertical rhythm)

| Context | Token | Value |
|---|---|---|
| PageContainer bottom margin | `--hrms-spacing-xl` | 24px |
| Between PageHeader and next element | `--hrms-spacing-xl` | 24px |
| Between consecutive Cards | `--hrms-spacing-lg` | 16px |
| Between Card body and content | `--hrms-spacing-lg` | 16px (Card body default) |
| Between form fields | `--hrms-spacing-md` | 16px (Ant Form default) |
| Between button and adjacent element | `--hrms-spacing-sm` | 8px |
| Between icon and label in a row | `--hrms-spacing-xs` | 4px |
| Modal body padding | `--hrms-spacing-xl` | 24px |
| Drawer body padding | `--hrms-spacing-xl` | 24px |
| Section title to first element | `--hrms-spacing-md` | 12px |
| Table cell padding (vertical) | `--hrms-spacing-md` | 12px |

### Layout dimensions

| Element | Value | Note |
|---|---|---|
| Page content max-width | 1600px | Handled by PageContainer `maxWidth` |
| Card border-radius | 12px | `var(--hrms-radius-lg)` |
| Button height | 38px | Set in global CSS |
| Input/Select height | 36px | Set in global CSS |
| Sidebar width | 260px | Collapsed: 80px |
| Header height | 64px | |
| Gap between Row cols (gutter) | 16 | `Row gutter={16}` |
| Content margin in AppLayout | `24px 28px 0` | From AppLayout |

### Typography scale

| Context | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Page title (h1) | 24px | 700 | `var(--hrms-text-primary)` | PageHeader handles this |
| Section heading inside Card | 15px | 600 | `var(--hrms-text-primary)` | Card title style |
| Table header text | 12px | 600 | `var(--hrms-text-secondary)` | Uppercase, `letter-spacing: 0.05em` |
| Table body text | 14px | 400 | `var(--hrms-text-primary)` | |
| Form label | 13px | 500 | `var(--hrms-text-primary)` | |
| Button text | 14px | 500 | varies | |
| Status badge text | 11px | 600 | varies | |
| Description / subtitle | 14px | 400 | `var(--hrms-text-muted)` | Below page title |
| Stat card value | 28px | 700 | `var(--hrms-text-primary)` | |
| Stat card label | 12px | 600 | `var(--hrms-text-muted)` | Uppercase |
| Modal title | 16px | 600 | `var(--hrms-text-primary)` | |
| Drawer title | 16px | 600 | `var(--hrms-text-primary)` | |
| Input text | 14px | 400 | `var(--hrms-text-primary)` | |
| Tab label | 14px | 500 | `var(--hrms-text-secondary)` | |
| Breadcrumb text | 13px | 400 | `var(--hrms-text-muted)` | |

### Border & radius scale

| Token | Value | Usage |
|---|---|---|
| `--hrms-radius-sm` | 6px | Small elements, tag badges |
| `--hrms-radius-md` | 8px | Buttons, inputs, selects, menu items |
| `--hrms-radius-lg` | 12px | Cards, modals, dropdowns, tables |
| `--hrms-radius-xl` | 16px | Large modals |
| `--hrms-border` | `1px solid #e2e8f0` | Cards, tables, inputs (default) |
| `--hrms-border-light` | `1px solid #f1f5f9` | Subtle dividers, table row borders |

### Box shadow scale

| Token | Value | Usage |
|---|---|---|
| `--hrms-shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Cards (resting) |
| `--hrms-shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Tables, dropdowns |
| `--hrms-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07)` | Cards (hover) |
| `--hrms-shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08)` | Dropdown menus |
| `--hrms-shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.08)` | Modals |

### Inline style ban list

These inline styles MUST NOT appear in any page file. Use the CSS token instead.

| Banned pattern | Replacement |
|---|---|
| `padding: '0 4px'` | `<PageContainer>` |
| `marginBottom: 24` / `marginBottom: 28` | Use PageHeader's built-in margin |
| `borderRadius: 12` | `var(--hrms-radius-lg)` or remove (global CSS handles it) |
| `fontSize: 16, fontWeight: 600` on Card headers | Use Card `title` prop instead |
| `color: '#ff4d4f'`, `'#52c41a'`, `'#1890ff'` | CSS custom property |
| `color: '#999'`, `'#888'`, `'#bbb'` | `var(--hrms-text-muted)` |
| `boxShadow: ...` inline | CSS custom property |
| `padding: 24` on non-standard elements | `var(--hrms-spacing-xl)` |

---

## Review Checklist (apply to every module)

For each module, go through this checklist page by page:

| # | Check | How to detect | Fix |
|---|---|---|---|
| 1 | Page wrapper | Missing `<PageContainer>` | Wrap content in `<PageContainer>` |
| 2 | Page header | Missing or inconsistent `<PageHeader>` | Add/replace with `<PageHeader title="..." />` |
| 3 | Table type | Uses raw `<Table>` instead of `<DataTable>` | Replace with `<DataTable>` |
| 4 | Pagination | `pageSize={20}` or `showSizeChanger={false}` | Remove the prop (use defaults) |
| 5 | Row key | `rowKey="_id"` | Change to `rowKey="id"` |
| 6 | Inline colors | `#ff4d4f`, `#52c41a`, `#1890ff` found inline | Replace with CSS custom property |
| 7 | Empty state | Plain text or `<Empty>` without styling | Replace with `<EmptyState>` |
| 8 | Error state | Inline error div/Alert/Card | Replace with `<ErrorState>` |
| 9 | Loading state | Missing skeleton or inconsistent `<Spin>` | Use DataTable `loading` or consistent `<Spin>` |
| 10 | Button groups | Inconsistent spacing/sizing | Use `<Space size={4}>` with `size="small"` |
| 11 | Modal pattern | Custom footer or inconsistent pattern | Use `onOk`/`onCancel` standard pattern |
| 12 | Aggressive color | Bright green/red/blue used for indicators | Replace with `var(--hrms-success)`/`var(--hrms-danger)` |

---

## Module-by-Module Schedule

| Order | Module | Pages | Est. time |
|---|---|---|---|
| 1 | **Payroll** | PayrollPage, PayrollDetailsPage, SalarySlipsPage, SalarySlipDetailsPage | ~30 min |
| 2 | **Employees** | EmployeesPage, EmployeeNewPage, EmployeeEditPage, EmployeeDetailPage | ~40 min |
| 3 | **Dashboard** | DashboardPage | ~15 min |
| 4 | **Leave** | LeaveApplicationsPage, LeaveApprovalsPage, LeaveBalancesPage | ~30 min |
| 5 | **Attendance** | AttendancePage | ~20 min |
| 6 | **Loans** | LoansPage, LoanTypesPage, LoanApplyPage, LoanDetailPage | ~25 min |
| 7 | **Assets** | AssetsPage, AssetFormPage, AssetDetailPage | ~20 min |
| 8 | **Training** | TrainingProgramsPage, TrainingProgramFormPage, TrainingEnrollmentsPage, SkillMatrixPage, SkillGapPage, CertificationsPage | ~35 min |
| 9 | **Settings** | SettingsPage + sections | ~30 min |
| 10 | **Performance** | PerformancePage, PerformanceReviewDetailPage | ~20 min |
| 11 | **Remaining** | Departments, Designations, Shifts, Holidays, WeeklyOffRules, Overtime, Reports, etc. | ~40 min |

---

## How to Update (pattern library)

### Page template
```tsx
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { EmptyState } from '../../../core/components/EmptyState';
import { ErrorState } from '../../../core/components/ErrorState';

export function SomePage() {
  if (error) return <ErrorState message="Failed to load" onRetry={refetch} />;

  return (
    <PageContainer>
      <PageHeader title="Page Title" subtitle="Optional description" actions={<Button type="primary">Action</Button>} />
      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        total={meta?.total}
        page={page}
        onPaginationChange={setPage}
      />
    </PageContainer>
  );
}
```

### Stat cards pattern
```tsx
<Row gutter={16}>
  <Col span={6}>
    <Card><Statistic title="Label" value={value} prefix={getCurrencySymbol()} /></Card>
  </Col>
</Row>
```

### Status badge pattern
```tsx
<Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'default'}>{status}</Tag>
```

### Color usage pattern
```tsx
// ✅ Good
<span style={{ color: value > 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)' }}>{value}</span>

// ❌ Bad
<span style={{ color: value > 0 ? '#52c41a' : '#ff4d4f' }}>{value}</span>
```

### Empty state pattern
```tsx
// ✅ Good
<EmptyState title="No records found" description="No data available for this period." />

// ❌ Bad
<Empty description="No data" />
<div style={{ textAlign: 'center', color: '#999' }}>No records</div>
```
