import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useAuthStore } from './core/stores/authStore';

import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('./features/auth/pages/LandingPage').then(m => ({ default: m.LandingPage })));

const DashboardPage = lazy(() => import('./features/auth/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import('./features/employees/pages/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const EmployeeNewPage = lazy(() => import('./features/employees/pages/EmployeeNewPage').then(m => ({ default: m.EmployeeNewPage })));
const EmployeeEditPage = lazy(() => import('./features/employees/pages/EmployeeEditPage').then(m => ({ default: m.EmployeeEditPage })));
const EmployeeDetailPage = lazy(() => import('./features/employees/pages/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const DepartmentsPage = lazy(() => import('./features/departments/pages/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const DesignationsPage = lazy(() => import('./features/designations/pages/DesignationsPage').then(m => ({ default: m.DesignationsPage })));
const ShiftsPage = lazy(() => import('./features/shifts/pages/ShiftsPage').then(m => ({ default: m.ShiftsPage })));
const HolidaysPage = lazy(() => import('./features/holidays/pages/HolidaysPage').then(m => ({ default: m.HolidaysPage })));
const AttendancePage = lazy(() => import('./features/attendance/pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const OvertimePage = lazy(() => import('./features/overtime/pages/OvertimePage').then(m => ({ default: m.OvertimePage })));
const WeeklyOffRulesPage = lazy(() => import('./features/weekly-off-rules/pages/WeeklyOffRulesPage').then(m => ({ default: m.WeeklyOffRulesPage })));
const LoanApplyPage = lazy(() => import('./features/loans/pages/LoanApplyPage').then(m => ({ default: m.LoanApplyPage })));
const LoanTypesPage = lazy(() => import('./features/loans/pages/LoanTypesPage').then(m => ({ default: m.LoanTypesPage })));
const PayrollPage = lazy(() => import('./features/payroll/pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const PayrollDetailsPage = lazy(() => import('./features/payroll/pages/PayrollDetailsPage').then(m => ({ default: m.PayrollDetailsPage })));
const SalarySlipsPage = lazy(() => import('./features/payroll/pages/SalarySlipsPage').then(m => ({ default: m.SalarySlipsPage })));
const SalarySlipDetailsPage = lazy(() => import('./features/payroll/pages/SalarySlipDetailsPage').then(m => ({ default: m.SalarySlipDetailsPage })));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const StatutoryDashboard = lazy(() => import('./features/statutory/pages/StatutoryDashboard').then(m => ({ default: m.StatutoryDashboard })));
const LoansPage = lazy(() => import('./features/loans/pages/LoansPage').then(m => ({ default: m.LoansPage })));
const LoanDetailPage = lazy(() => import('./features/loans/pages/LoanDetailPage').then(m => ({ default: m.LoanDetailPage })));
const LeaveTypesPage = lazy(() => import('./features/leave/pages/LeaveTypesPage').then(m => ({ default: m.LeaveTypesPage })));
const LeaveApplyPage = lazy(() => import('./features/leave/pages/LeaveApplyPage').then(m => ({ default: m.LeaveApplyPage })));
const LeaveApprovalsPage = lazy(() => import('./features/leave/pages/LeaveApprovalsPage').then(m => ({ default: m.LeaveApprovalsPage })));
const LeaveBalancesPage = lazy(() => import('./features/leave/pages/LeaveBalancesPage').then(m => ({ default: m.LeaveBalancesPage })));
const LeaveApplicationsPage = lazy(() => import('./features/leave/pages/LeaveApplicationsPage').then(m => ({ default: m.LeaveApplicationsPage })));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const UserNewPage = lazy(() => import('./features/users/pages/UserNewPage').then(m => ({ default: m.UserNewPage })));
const UserEditPage = lazy(() => import('./features/users/pages/UserEditPage').then(m => ({ default: m.UserEditPage })));
const UserActivityPage = lazy(() => import('./features/users/pages/UserActivityPage').then(m => ({ default: m.UserActivityPage })));
const AuditLogsPage = lazy(() => import('./features/audit/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const NotificationsPage = lazy(() => import('./features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const RuleBookPage = lazy(() => import('./features/rule-book/pages/RuleBookPage').then(m => ({ default: m.RuleBookPage })));
const KioskPage = lazy(() => import('./features/kiosk/pages/KioskPage').then(m => ({ default: m.KioskPage })));
const ScanPage = lazy(() => import('./features/attendance-qr/pages/ScanPage').then(m => ({ default: m.ScanPage })));
const TOTPEnrollPage = lazy(() => import('./features/totp/pages/TOTPEnrollPage').then(m => ({ default: m.TOTPEnrollPage })));

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
            <Route path="weekly-off-rules" element={<WeeklyOffRulesPage />} />
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
            <Route path="loans" element={<LoansPage />} />
            <Route path="loans/apply" element={<LoanApplyPage />} />
            <Route path="loans/types" element={<LoanTypesPage />} />
            <Route path="loans/:id" element={<LoanDetailPage />} />
            <Route path="statutory" element={<StatutoryDashboard />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/totp" element={<TOTPEnrollPage />} />
            <Route path="rule-book" element={<RuleBookPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/new" element={<UserNewPage />} />
            <Route path="users/:id" element={<Navigate to="activity" replace />} />
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
