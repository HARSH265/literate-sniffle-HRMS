import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './layout/ProtectedRoute';
import { ErrorBoundary } from './core/components/ErrorBoundary';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./features/auth/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import('./features/employees/pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const EmployeeNewPage = lazy(() => import('./features/employees/pages/EmployeeNewPage').then((m) => ({ default: m.EmployeeNewPage })));
const EmployeeEditPage = lazy(() => import('./features/employees/pages/EmployeeEditPage').then((m) => ({ default: m.EmployeeEditPage })));
const DepartmentsPage = lazy(() => import('./features/departments/pages/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })));
const DesignationsPage = lazy(() => import('./features/designations/pages/DesignationsPage').then((m) => ({ default: m.DesignationsPage })));
const ShiftsPage = lazy(() => import('./features/shifts/pages/ShiftsPage').then((m) => ({ default: m.ShiftsPage })));
const HolidaysPage = lazy(() => import('./features/holidays/pages/HolidaysPage').then((m) => ({ default: m.HolidaysPage })));
const AttendancePage = lazy(() => import('./features/attendance/pages/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const OvertimePage = lazy(() => import('./features/overtime/pages/OvertimePage').then((m) => ({ default: m.OvertimePage })));
const PayrollPage = lazy(() => import('./features/payroll/pages/PayrollPage').then((m) => ({ default: m.PayrollPage })));
const SalarySlipsPage = lazy(() => import('./features/payroll/pages/SalarySlipsPage').then((m) => ({ default: m.SalarySlipsPage })));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const AuditLogsPage = lazy(() => import('./features/audit/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const WeeklyOffRulesPage = lazy(() => import('./features/weekly-off-rules/pages/WeeklyOffRulesPage').then((m) => ({ default: m.WeeklyOffRulesPage })));
const OvertimeRulesPage = lazy(() => import('./features/overtime-rules/pages/OvertimeRulesPage').then((m) => ({ default: m.OvertimeRulesPage })));
const RuleBookPage = lazy(() => import('./features/rule-book/pages/RuleBookPage').then((m) => ({ default: m.RuleBookPage })));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/new" element={<EmployeeNewPage />} />
            <Route path="employees/:id/edit" element={<EmployeeEditPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="designations" element={<DesignationsPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="weekly-off-rules" element={<WeeklyOffRulesPage />} />
            <Route path="overtime-rules" element={<OvertimeRulesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="overtime" element={<OvertimePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="salary-slips" element={<SalarySlipsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="rule-book" element={<RuleBookPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;