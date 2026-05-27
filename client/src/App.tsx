import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useAuthStore } from './core/stores/authStore';
import { EssLayout } from './features/employee-self-service/layout/EssLayout';

import { lazy, Suspense, useEffect, useState } from 'react';

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
const OvertimeRulesPage = lazy(() => import('./features/overtime-rules/pages/OvertimeRulesPage').then(m => ({ default: m.OvertimeRulesPage })));
const WeeklyOffRulesPage = lazy(() => import('./features/weekly-off-rules/pages/WeeklyOffRulesPage').then(m => ({ default: m.WeeklyOffRulesPage })));
const PayrollPage = lazy(() => import('./features/payroll/pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const PayrollDetailsPage = lazy(() => import('./features/payroll/pages/PayrollDetailsPage').then(m => ({ default: m.PayrollDetailsPage })));
const SalarySlipsPage = lazy(() => import('./features/payroll/pages/SalarySlipsPage').then(m => ({ default: m.SalarySlipsPage })));
const SalarySlipDetailsPage = lazy(() => import('./features/payroll/pages/SalarySlipDetailsPage').then(m => ({ default: m.SalarySlipDetailsPage })));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const StatutoryDashboard = lazy(() => import('./features/statutory/pages/StatutoryDashboard').then(m => ({ default: m.StatutoryDashboard })));
const LoansPage = lazy(() => import('./features/loans/pages/LoansPage').then(m => ({ default: m.LoansPage })));
const LoanTypesPage = lazy(() => import('./features/loans/pages/LoanTypesPage').then(m => ({ default: m.LoanTypesPage })));
const LoanApplyPage = lazy(() => import('./features/loans/pages/LoanApplyPage').then(m => ({ default: m.LoanApplyPage })));
const LoanDetailPage = lazy(() => import('./features/loans/pages/LoanDetailPage').then(m => ({ default: m.LoanDetailPage })));
const LeaveApprovalsPage = lazy(() => import('./features/leave/pages/LeaveApprovalsPage').then(m => ({ default: m.LeaveApprovalsPage })));
const LeaveBalancesPage = lazy(() => import('./features/leave/pages/LeaveBalancesPage').then(m => ({ default: m.LeaveBalancesPage })));
const LeaveApplicationsPage = lazy(() => import('./features/leave/pages/LeaveApplicationsPage').then(m => ({ default: m.LeaveApplicationsPage })));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const UserActivityPage = lazy(() => import('./features/users/pages/UserActivityPage').then(m => ({ default: m.UserActivityPage })));
const AuditLogsPage = lazy(() => import('./features/audit/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const NotificationsPage = lazy(() => import('./features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const RuleBookPage = lazy(() => import('./features/rule-book/pages/RuleBookPage').then(m => ({ default: m.RuleBookPage })));
const KioskPage = lazy(() => import('./features/kiosk/pages/KioskPage').then(m => ({ default: m.KioskPage })));
const KioskDevicesPage = lazy(() => import('./features/kiosk/pages/KioskDevicesPage').then(m => ({ default: m.KioskDevicesPage })));
const ScanPage = lazy(() => import('./features/attendance-qr/pages/ScanPage').then(m => ({ default: m.ScanPage })));
const AnnouncementsPage = lazy(() => import('./features/announcements/pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const AnnouncementDetailPage = lazy(() => import('./features/announcements/pages/AnnouncementDetailPage').then(m => ({ default: m.AnnouncementDetailPage })));
const AnnouncementFormPage = lazy(() => import('./features/announcements/pages/AnnouncementFormPage').then(m => ({ default: m.AnnouncementFormPage })));
const HelpdeskPage = lazy(() => import('./features/helpdesk/pages/HelpdeskPage').then(m => ({ default: m.HelpdeskPage })));
const TicketDetailPage = lazy(() => import('./features/helpdesk/pages/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const TicketFormPage = lazy(() => import('./features/helpdesk/pages/TicketFormPage').then(m => ({ default: m.TicketFormPage })));
const EssDashboardPageLazy = lazy(() => import('./features/employee-self-service/pages/EssDashboardPage').then(m => ({ default: m.EssDashboardPage })));
const EssProfilePageLazy = lazy(() => import('./features/employee-self-service/pages/EssProfilePage').then(m => ({ default: m.EssProfilePage })));
const EssDocumentsPageLazy = lazy(() => import('./features/employee-self-service/pages/EssDocumentsPage').then(m => ({ default: m.EssDocumentsPage })));
const EssAttendancePageLazy = lazy(() => import('./features/employee-self-service/pages/EssAttendancePage').then(m => ({ default: m.EssAttendancePage })));
const EssLeavePageLazy = lazy(() => import('./features/employee-self-service/pages/EssLeavePage').then(m => ({ default: m.EssLeavePage })));
const EssPayslipsPageLazy = lazy(() => import('./features/employee-self-service/pages/EssPayslipsPage').then(m => ({ default: m.EssPayslipsPage })));

import { Spin } from 'antd';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

function RedirectToLogin() {
  const location = useLocation();
  sessionStorage.setItem('returnUrl', location.pathname + location.search);
  return <Navigate to="/login" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [hydrated, setHydrated] = useState(false);
  const authenticatedHomePath = user?.employeeId ? '/ess' : '/dashboard';

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  if (!hydrated) {
    return (
      <ErrorBoundary>
        <PageLoader />
      </ErrorBoundary>
    );
  }

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
          <Route path="*" element={<RedirectToLogin />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Navigate to={authenticatedHomePath} replace />} />
        <Route path="/m/scan" element={<Suspense fallback={<PageLoader />}><ScanPage /></Suspense>} />
        <Route path="/m/confirm" element={<Suspense fallback={<PageLoader />}><ScanPage /></Suspense>} />
        <Route path="/ess" element={<EssLayout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><EssDashboardPageLazy /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><EssProfilePageLazy /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<PageLoader />}><EssDocumentsPageLazy /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<PageLoader />}><EssAttendancePageLazy /></Suspense>} />
          <Route path="leave" element={<Suspense fallback={<PageLoader />}><EssLeavePageLazy /></Suspense>} />
          <Route path="payslips" element={<Suspense fallback={<PageLoader />}><EssPayslipsPageLazy /></Suspense>} />
          <Route path="*" element={<Navigate to="/ess" replace />} />
        </Route>
        <Route path="/*" element={<AppLayout />}>
            <Route index element={<Navigate to={authenticatedHomePath} replace />} />
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
            <Route path="kiosk/devices" element={<KioskDevicesPage />} />
            <Route path="overtime" element={<OvertimePage />} />
            <Route path="overtime/rules" element={<OvertimeRulesPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="payroll/:id" element={<PayrollDetailsPage />} />
            <Route path="salary-slips" element={<SalarySlipsPage />} />
            <Route path="salary-slips/:id" element={<SalarySlipDetailsPage />} />
            <Route path="leave/approvals" element={<LeaveApprovalsPage />} />
            <Route path="leave/balances" element={<LeaveBalancesPage />} />
            <Route path="leave/applications" element={<LeaveApplicationsPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="loans/loan-types" element={<LoanTypesPage />} />
            <Route path="loans/apply" element={<LoanApplyPage />} />
            <Route path="loans/:id" element={<LoanDetailPage />} />
            <Route path="statutory" element={<StatutoryDashboard />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="rule-book" element={<RuleBookPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<Navigate to="activity" replace />} />
            <Route path="users/:id/activity" element={<UserActivityPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcements/new" element={<AnnouncementFormPage />} />
            <Route path="announcements/:id" element={<AnnouncementDetailPage />} />
            <Route path="announcements/:id/edit" element={<AnnouncementFormPage />} />
            <Route path="helpdesk" element={<HelpdeskPage />} />
            <Route path="helpdesk/new" element={<TicketFormPage />} />
            <Route path="helpdesk/:id" element={<TicketDetailPage />} />
            <Route path="helpdesk/:id/edit" element={<TicketFormPage />} />
            <Route path="*" element={<Navigate to={authenticatedHomePath} replace />} />
          </Route>
        </Routes>
    </ErrorBoundary>
  );
}

export default App;
