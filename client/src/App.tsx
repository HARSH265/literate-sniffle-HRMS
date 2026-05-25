import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useAuthStore } from './core/stores/authStore';

import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('./features/auth/pages/LandingPage').then(m => ({ default: m.LandingPage })));

import { DashboardPage } from './features/auth/pages/DashboardPage';
import { EmployeesPage } from './features/employees/pages/EmployeesPage';
import { EmployeeNewPage } from './features/employees/pages/EmployeeNewPage';
import { EmployeeEditPage } from './features/employees/pages/EmployeeEditPage';
import { EmployeeDetailPage } from './features/employees/pages/EmployeeDetailPage';
import { DepartmentsPage } from './features/departments/pages/DepartmentsPage';
import { DesignationsPage } from './features/designations/pages/DesignationsPage';
import { ShiftsPage } from './features/shifts/pages/ShiftsPage';
import { HolidaysPage } from './features/holidays/pages/HolidaysPage';
import { AttendancePage } from './features/attendance/pages/AttendancePage';
import { OvertimePage } from './features/overtime/pages/OvertimePage';
import { PayrollPage } from './features/payroll/pages/PayrollPage';
import { PayrollDetailsPage } from './features/payroll/pages/PayrollDetailsPage';
import { SalarySlipsPage } from './features/payroll/pages/SalarySlipsPage';
import { SalarySlipDetailsPage } from './features/payroll/pages/SalarySlipDetailsPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { LeaveTypesPage } from './features/leave/pages/LeaveTypesPage';
import { LeaveApplyPage } from './features/leave/pages/LeaveApplyPage';
import { LeaveApprovalsPage } from './features/leave/pages/LeaveApprovalsPage';
import { LeaveBalancesPage } from './features/leave/pages/LeaveBalancesPage';
import { LeaveApplicationsPage } from './features/leave/pages/LeaveApplicationsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { UserNewPage } from './features/users/pages/UserNewPage';
import { UserEditPage } from './features/users/pages/UserEditPage';
import { UserActivityPage } from './features/users/pages/UserActivityPage';
import { AuditLogsPage } from './features/audit/pages/AuditLogsPage';
import { NotificationsPage } from './features/notifications/pages/NotificationsPage';
import { RuleBookPage } from './features/rule-book/pages/RuleBookPage';
import { KioskPage } from './features/kiosk/pages/KioskPage';
import { ScanPage } from './features/attendance-qr/pages/ScanPage';
import { TOTPEnrollPage } from './features/totp/pages/TOTPEnrollPage';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
);

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/m/scan" element={<ScanPage />} />
            <Route path="/m/confirm" element={<ScanPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/*" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employees/new" element={<EmployeeNewPage />} />
            <Route path="employees/:id" element={<EmployeeDetailPage />} />
            <Route path="employees/:id/edit" element={<EmployeeEditPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="designations" element={<DesignationsPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="overtime" element={<OvertimePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="payroll/:id" element={<PayrollDetailsPage />} />
            <Route path="salary-slips" element={<SalarySlipsPage />} />
            <Route path="salary-slips/:id" element={<SalarySlipDetailsPage />} />
            <Route path="leave/types" element={<LeaveTypesPage />} />
            <Route path="leave/my-applications" element={<LeaveApplyPage />} />
            <Route path="leave/approvals" element={<LeaveApprovalsPage />} />
            <Route path="leave/balances" element={<LeaveBalancesPage />} />
            <Route path="leave/applications" element={<LeaveApplicationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/totp" element={<TOTPEnrollPage />} />
            <Route path="rule-book" element={<RuleBookPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/new" element={<UserNewPage />} />
            <Route path="users/:id" element={<UsersPage />} />
            <Route path="users/:id/edit" element={<UserEditPage />} />
            <Route path="users/:id/activity" element={<UserActivityPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
