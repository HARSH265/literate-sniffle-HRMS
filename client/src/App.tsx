import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ErrorBoundary } from './core/components/ErrorBoundary';
import { useAuthStore } from './core/stores/authStore';
import { ROLES } from './core/constants/permissions';
import { useIsMobile } from './core/hooks/useIsMobile';
import { EssLayout } from './features/employee-self-service/layout/EssLayout';

import { lazy, Suspense, useEffect, useState } from 'react';
import apiClient from './core/api/apiClient';
import { ProtectedRoute } from './core/components/ProtectedRoute';
import { API_ENDPOINTS } from './core/constants/api.endpoints';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('./features/auth/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

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
const PayrollReportsPageLazy = lazy(() => import('./features/payroll-reports/pages/PayrollReportsPage').then(m => ({ default: m.PayrollReportsPage })));
const PayrollDetailsPage = lazy(() => import('./features/payroll/pages/PayrollDetailsPage').then(m => ({ default: m.PayrollDetailsPage })));
const SalarySlipsPage = lazy(() => import('./features/payroll/pages/SalarySlipsPage').then(m => ({ default: m.SalarySlipsPage })));
const SalarySlipDetailsPage = lazy(() => import('./features/payroll/pages/SalarySlipDetailsPage').then(m => ({ default: m.SalarySlipDetailsPage })));
const ReportsPage = lazy(() => import('./features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SalaryStructureTemplatesPageLazy = lazy(() => import('./features/salary-structure-templates/pages/SalaryStructureTemplatesPage').then(m => ({ default: m.SalaryStructureTemplatesPage })));
const StatutoryDashboard = lazy(() => import('./features/statutory/pages/StatutoryDashboard').then(m => ({ default: m.StatutoryDashboard })));
const LoansPage = lazy(() => import('./features/loans/pages/LoansPage').then(m => ({ default: m.LoansPage })));
const LoanTypesPageLazy = lazy(() => import('./features/loans/pages/LoanTypesPage').then(m => ({ default: m.LoanTypesPage })));
const LoanApplyPage = lazy(() => import('./features/loans/pages/LoanApplyPage').then(m => ({ default: m.LoanApplyPage })));
const LoanDetailPage = lazy(() => import('./features/loans/pages/LoanDetailPage').then(m => ({ default: m.LoanDetailPage })));
const LeaveApprovalsPage = lazy(() => import('./features/leave/pages/LeaveApprovalsPage').then(m => ({ default: m.LeaveApprovalsPage })));
const LeaveBalancesPage = lazy(() => import('./features/leave/pages/LeaveBalancesPage').then(m => ({ default: m.LeaveBalancesPage })));
const LeaveApplicationsPage = lazy(() => import('./features/leave/pages/LeaveApplicationsPage').then(m => ({ default: m.LeaveApplicationsPage })));

const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UserNewPageLazy = lazy(() => import('./features/users/pages/UserNewPage').then(m => ({ default: m.UserNewPage })));
const UserEditPageLazy = lazy(() => import('./features/users/pages/UserEditPage').then(m => ({ default: m.UserEditPage })));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const UserActivityPage = lazy(() => import('./features/users/pages/UserActivityPage').then(m => ({ default: m.UserActivityPage })));
const AuditLogsPage = lazy(() => import('./features/audit/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const NotificationsPage = lazy(() => import('./features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const KioskPage = lazy(() => import('./features/kiosk/pages/KioskPage').then(m => ({ default: m.KioskPage })));
const KioskDevicesPage = lazy(() => import('./features/kiosk/pages/KioskDevicesPage').then(m => ({ default: m.KioskDevicesPage })));
const ScanPage = lazy(() => import('./features/attendance-qr/pages/ScanPage').then(m => ({ default: m.ScanPage })));
const AnnouncementsPage = lazy(() => import('./features/announcements/pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const AnnouncementDetailPage = lazy(() => import('./features/announcements/pages/AnnouncementDetailPage').then(m => ({ default: m.AnnouncementDetailPage })));
const AnnouncementFormPage = lazy(() => import('./features/announcements/pages/AnnouncementFormPage').then(m => ({ default: m.AnnouncementFormPage })));
const HelpdeskPage = lazy(() => import('./features/helpdesk/pages/HelpdeskPage').then(m => ({ default: m.HelpdeskPage })));
const TicketDetailPage = lazy(() => import('./features/helpdesk/pages/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const TicketFormPage = lazy(() => import('./features/helpdesk/pages/TicketFormPage').then(m => ({ default: m.TicketFormPage })));
const ShiftSwapsPage = lazy(() => import('./features/shift-swaps/pages/ShiftSwapsPage').then(m => ({ default: m.ShiftSwapsPage })));
const ShiftSwapApprovalsPage = lazy(() => import('./features/shift-swaps/pages/ShiftSwapApprovalsPage').then(m => ({ default: m.ShiftSwapApprovalsPage })));
const ShiftPreferencesPage = lazy(() => import('./features/shift-swaps/pages/ShiftPreferencesPage').then(m => ({ default: m.ShiftPreferencesPage })));
const PerformancePage = lazy(() => import('./features/performance/pages/PerformancePage').then(m => ({ default: m.PerformancePage })));
const PerformanceReviewDetailPage = lazy(() => import('./features/performance/pages/PerformanceReviewDetailPage').then(m => ({ default: m.PerformanceReviewDetailPage })));
const TrainingProgramsPage = lazy(() => import('./features/training/pages/TrainingProgramsPage').then(m => ({ default: m.TrainingProgramsPage })));
const TrainingProgramFormPage = lazy(() => import('./features/training/pages/TrainingProgramFormPage').then(m => ({ default: m.TrainingProgramFormPage })));
const TrainingEnrollmentsPage = lazy(() => import('./features/training/pages/TrainingEnrollmentsPage').then(m => ({ default: m.TrainingEnrollmentsPage })));
const TrainingProgramDetailPage = lazy(() => import('./features/training/pages/TrainingProgramDetailPage').then(m => ({ default: m.TrainingProgramDetailPage })));
const SkillMatrixPage = lazy(() => import('./features/training/pages/SkillMatrixPage').then(m => ({ default: m.SkillMatrixPage })));
const SkillGapPage = lazy(() => import('./features/training/pages/SkillGapPage').then(m => ({ default: m.SkillGapPage })));
const CertificationsPage = lazy(() => import('./features/training/pages/CertificationsPage').then(m => ({ default: m.CertificationsPage })));
const CompliancePageLazy = lazy(() => import('./features/compliance/pages/CompliancePage').then(m => ({ default: m.CompliancePage })));
const AssetsPage = lazy(() => import('./features/assets/pages/AssetsPage').then(m => ({ default: m.AssetsPage })));
const AssetDetailPage = lazy(() => import('./features/assets/pages/AssetDetailPage').then(m => ({ default: m.AssetDetailPage })));
const AssetFormPage = lazy(() => import('./features/assets/pages/AssetFormPage').then(m => ({ default: m.AssetFormPage })));
const DocumentsPage = lazy(() => import('./features/documents/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const DocumentDetailPage = lazy(() => import('./features/documents/pages/DocumentDetailPage').then(m => ({ default: m.DocumentDetailPage })));
const DocumentUploadPage = lazy(() => import('./features/documents/pages/DocumentUploadPage').then(m => ({ default: m.DocumentUploadPage })));
const EssDashboardPageLazy = lazy(() => import('./features/employee-self-service/pages/EssDashboardPage').then(m => ({ default: m.EssDashboardPage })));
const EssProfilePageLazy = lazy(() => import('./features/employee-self-service/pages/EssProfilePage').then(m => ({ default: m.EssProfilePage })));
const EssDocumentsPageLazy = lazy(() => import('./features/employee-self-service/pages/EssDocumentsPage').then(m => ({ default: m.EssDocumentsPage })));
const EssAttendancePageLazy = lazy(() => import('./features/employee-self-service/pages/EssAttendancePage').then(m => ({ default: m.EssAttendancePage })));
const EssLeavePageLazy = lazy(() => import('./features/employee-self-service/pages/EssLeavePage').then(m => ({ default: m.EssLeavePage })));
const EssPayslipsPageLazy = lazy(() => import('./features/employee-self-service/pages/EssPayslipsPage').then(m => ({ default: m.EssPayslipsPage })));
const EssShiftSwapPageLazy = lazy(() => import('./features/employee-self-service/pages/EssShiftSwapPage').then(m => ({ default: m.EssShiftSwapPage })));
const EssShiftPreferencePageLazy = lazy(() => import('./features/employee-self-service/pages/EssShiftPreferencePage').then(m => ({ default: m.EssShiftPreferencePage })));
const EssAssetsPageLazy = lazy(() => import('./features/employee-self-service/pages/EssAssetsPage').then(m => ({ default: m.EssAssetsPage })));
const EssTrainingPageLazy = lazy(() => import('./features/employee-self-service/pages/EssTrainingPage').then(m => ({ default: m.EssTrainingPage })));
const EssLoansPageLazy = lazy(() => import('./features/employee-self-service/pages/EssLoansPage').then(m => ({ default: m.EssLoansPage })));
const EssLoanApplyPageLazy = lazy(() => import('./features/employee-self-service/pages/EssLoanApplyPage').then(m => ({ default: m.EssLoanApplyPage })));

import { Spin } from 'antd';
import { setCurrencySymbol } from './core/constants/currency';
import { setAppName } from './core/constants/app.constants';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

function RedirectToLogin() {
  const location = useLocation();
  sessionStorage.setItem('returnUrl', location.pathname + location.search);
  return <Navigate to="/" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [hydrated, setHydrated] = useState(false);
  const [authValidated, setAuthValidated] = useState(false);
  const isMobile = useIsMobile();
  const isBackOfficeRole = user?.role && (Object.values(ROLES) as readonly string[]).includes(user.role);
  const authenticatedHomePath = isMobile || (user?.employeeId && !isBackOfficeRole) ? '/ess' : '/dashboard';

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) {
      setAuthValidated(true);
      return;
    }
    apiClient.get(API_ENDPOINTS.auth.me)
      .then(() => setAuthValidated(true))
      .catch(() => {
        useAuthStore.getState().logout();
        setAuthValidated(true);
      });
  }, [hydrated, isAuthenticated]);

  // Sync currency and app name from company settings
  useEffect(() => {
    if (!isAuthenticated) return;
    import('./features/settings/services/settingsService')
      .then(m => m.settingsService.get())
      .then(({ data }) => {
        if (data.companyInfo?.currency) setCurrencySymbol(data.companyInfo.currency);
        if (data.companyInfo?.appName) setAppName(data.companyInfo.appName);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  if (!hydrated || !authValidated) {
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="/ess" element={<ProtectedRoute permission="view-own-profile"><EssLayout /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<PageLoader />}><EssDashboardPageLazy /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><EssProfilePageLazy /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<PageLoader />}><EssDocumentsPageLazy /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<PageLoader />}><EssAttendancePageLazy /></Suspense>} />
          <Route path="leave" element={<Suspense fallback={<PageLoader />}><EssLeavePageLazy /></Suspense>} />
          <Route path="payslips" element={<Suspense fallback={<PageLoader />}><EssPayslipsPageLazy /></Suspense>} />
          <Route path="shift-swaps" element={<Suspense fallback={<PageLoader />}><EssShiftSwapPageLazy /></Suspense>} />
          <Route path="shift-swaps/preferences" element={<Suspense fallback={<PageLoader />}><EssShiftPreferencePageLazy /></Suspense>} />
          <Route path="assets" element={<Suspense fallback={<PageLoader />}><EssAssetsPageLazy /></Suspense>} />
          <Route path="training" element={<Suspense fallback={<PageLoader />}><EssTrainingPageLazy /></Suspense>} />
          <Route path="loans" element={<Suspense fallback={<PageLoader />}><EssLoansPageLazy /></Suspense>} />
          <Route path="loans/apply" element={<Suspense fallback={<PageLoader />}><EssLoanApplyPageLazy /></Suspense>} />
          <Route path="*" element={<Navigate to="/ess" replace />} />
        </Route>
        <Route path="/*" element={<AppLayout />}>
            <Route index element={<Navigate to={authenticatedHomePath} replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<ProtectedRoute permission="view-employees"><EmployeesPage /></ProtectedRoute>} />
            <Route path="employees/new" element={<ProtectedRoute permission="manage-employees"><EmployeeNewPage /></ProtectedRoute>} />
            <Route path="employees/:id" element={<ProtectedRoute permission="view-employees"><EmployeeDetailPage /></ProtectedRoute>} />
            <Route path="employees/:id/edit" element={<ProtectedRoute permission="manage-employees"><EmployeeEditPage /></ProtectedRoute>} />
            <Route path="departments" element={<ProtectedRoute permission="view-departments"><DepartmentsPage /></ProtectedRoute>} />
            <Route path="designations" element={<ProtectedRoute permission="view-departments"><DesignationsPage /></ProtectedRoute>} />
            <Route path="shifts" element={<ProtectedRoute permission="view-shifts"><ShiftsPage /></ProtectedRoute>} />
            <Route path="holidays" element={<ProtectedRoute permission="view-departments"><HolidaysPage /></ProtectedRoute>} />
            <Route path="weekly-off-rules" element={<ProtectedRoute permission="view-departments"><WeeklyOffRulesPage /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute permission="manage-attendance"><AttendancePage /></ProtectedRoute>} />
            <Route path="kiosk/devices" element={<ProtectedRoute permission="manage-attendance"><KioskDevicesPage /></ProtectedRoute>} />
            <Route path="overtime" element={<ProtectedRoute permission="view-employees"><OvertimePage /></ProtectedRoute>} />
            <Route path="overtime/rules" element={<ProtectedRoute permission="view-departments"><OvertimeRulesPage /></ProtectedRoute>} />
            <Route path="payroll" element={<ProtectedRoute permission="process-payroll"><PayrollPage /></ProtectedRoute>} />
            <Route path="payroll/:id" element={<ProtectedRoute permission="process-payroll"><PayrollDetailsPage /></ProtectedRoute>} />
            <Route path="salary-structure-templates" element={<ProtectedRoute permission="process-payroll"><SalaryStructureTemplatesPageLazy /></ProtectedRoute>} />
            <Route path="salary-slips" element={<ProtectedRoute permission="view-reports"><SalarySlipsPage /></ProtectedRoute>} />
            <Route path="salary-slips/:id" element={<ProtectedRoute permission="view-reports"><SalarySlipDetailsPage /></ProtectedRoute>} />
            <Route path="leave/approvals" element={<ProtectedRoute permission="approve-leave"><Suspense fallback={<PageLoader />}><LeaveApprovalsPage /></Suspense></ProtectedRoute>} />
            <Route path="leave/balances" element={<ProtectedRoute permission="view-leave"><Suspense fallback={<PageLoader />}><LeaveBalancesPage /></Suspense></ProtectedRoute>} />
            <Route path="leave/applications" element={<ProtectedRoute permission="view-leave"><Suspense fallback={<PageLoader />}><LeaveApplicationsPage /></Suspense></ProtectedRoute>} />

            <Route path="loans" element={<ProtectedRoute permission="view-loans"><LoansPage /></ProtectedRoute>} />
            <Route path="loans/apply" element={<ProtectedRoute permission="apply-loan"><LoanApplyPage /></ProtectedRoute>} />
            <Route path="loans/:id" element={<ProtectedRoute permission="view-loans"><LoanDetailPage /></ProtectedRoute>} />
            <Route path="loan-types" element={<ProtectedRoute permission="manage-loans"><LoanTypesPageLazy /></ProtectedRoute>} />
            <Route path="statutory" element={<ProtectedRoute permission="view-statutory"><StatutoryDashboard /></ProtectedRoute>} />
            <Route path="compliance" element={<ProtectedRoute permission="view-payroll"><CompliancePageLazy /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute permission="view-reports"><ReportsPage /></ProtectedRoute>} />
            <Route path="payroll-reports" element={<ProtectedRoute permission="view-payroll"><PayrollReportsPageLazy /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute permission="manage-settings"><SettingsPage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute permission="manage-users"><UsersPage /></ProtectedRoute>} />
            <Route path="users/new" element={<ProtectedRoute permission="manage-users"><UserNewPageLazy /></ProtectedRoute>} />
            <Route path="users/:id/edit" element={<ProtectedRoute permission="manage-users"><UserEditPageLazy /></ProtectedRoute>} />
            <Route path="users/:id" element={<ProtectedRoute permission="manage-users"><Navigate to="activity" replace /></ProtectedRoute>} />
            <Route path="users/:id/activity" element={<ProtectedRoute permission="manage-users"><UserActivityPage /></ProtectedRoute>} />
            <Route path="audit-logs" element={<ProtectedRoute permission="view-audit"><AuditLogsPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute permission="view-notifications"><NotificationsPage /></ProtectedRoute>} />
            <Route path="announcements" element={<ProtectedRoute permission="view-announcements"><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="announcements/new" element={<ProtectedRoute permission="manage-announcements"><AnnouncementFormPage /></ProtectedRoute>} />
            <Route path="announcements/:id" element={<ProtectedRoute permission="view-announcements"><AnnouncementDetailPage /></ProtectedRoute>} />
            <Route path="announcements/:id/edit" element={<ProtectedRoute permission="manage-announcements"><AnnouncementFormPage /></ProtectedRoute>} />
            <Route path="helpdesk" element={<ProtectedRoute permission="view-tickets"><HelpdeskPage /></ProtectedRoute>} />
            <Route path="helpdesk/new" element={<ProtectedRoute permission="manage-tickets"><TicketFormPage /></ProtectedRoute>} />
            <Route path="helpdesk/:id" element={<ProtectedRoute permission="view-tickets"><TicketDetailPage /></ProtectedRoute>} />
            <Route path="helpdesk/:id/edit" element={<ProtectedRoute permission="manage-tickets"><TicketFormPage /></ProtectedRoute>} />
            <Route path="assets" element={<ProtectedRoute permission="view-assets"><Suspense fallback={<PageLoader />}><AssetsPage /></Suspense></ProtectedRoute>} />
            <Route path="assets/new" element={<ProtectedRoute permission="manage-assets"><Suspense fallback={<PageLoader />}><AssetFormPage /></Suspense></ProtectedRoute>} />
            <Route path="assets/:id" element={<ProtectedRoute permission="view-assets"><Suspense fallback={<PageLoader />}><AssetDetailPage /></Suspense></ProtectedRoute>} />
            <Route path="assets/:id/edit" element={<ProtectedRoute permission="manage-assets"><Suspense fallback={<PageLoader />}><AssetFormPage /></Suspense></ProtectedRoute>} />
            <Route path="documents" element={<ProtectedRoute permission="view-documents"><Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense></ProtectedRoute>} />
            <Route path="documents/new" element={<ProtectedRoute permission="manage-documents"><Suspense fallback={<PageLoader />}><DocumentUploadPage /></Suspense></ProtectedRoute>} />
            <Route path="documents/:id" element={<ProtectedRoute permission="view-documents"><Suspense fallback={<PageLoader />}><DocumentDetailPage /></Suspense></ProtectedRoute>} />
            <Route path="documents/:id/edit" element={<ProtectedRoute permission="manage-documents"><Suspense fallback={<PageLoader />}><DocumentUploadPage /></Suspense></ProtectedRoute>} />
            <Route path="shift-swaps" element={<ProtectedRoute permission="view-shift-swaps"><ShiftSwapsPage /></ProtectedRoute>} />
            <Route path="shift-swaps/approvals" element={<ProtectedRoute permission="manage-shift-swaps"><ShiftSwapApprovalsPage /></ProtectedRoute>} />
            <Route path="shift-swaps/preferences" element={<ProtectedRoute permission="view-own-shifts"><ShiftPreferencesPage /></ProtectedRoute>} />
            <Route path="training" element={<ProtectedRoute permission="view-training"><Suspense fallback={<PageLoader />}><TrainingProgramsPage /></Suspense></ProtectedRoute>} />
            <Route path="training/new" element={<ProtectedRoute permission="manage-training"><Suspense fallback={<PageLoader />}><TrainingProgramFormPage /></Suspense></ProtectedRoute>} />
            <Route path="training/enrollments" element={<ProtectedRoute permission="view-own-training"><Suspense fallback={<PageLoader />}><TrainingEnrollmentsPage /></Suspense></ProtectedRoute>} />
            <Route path="training/skills" element={<ProtectedRoute permission="view-training"><Suspense fallback={<PageLoader />}><SkillMatrixPage /></Suspense></ProtectedRoute>} />
            <Route path="training/skill-gap" element={<ProtectedRoute permission="manage-training"><Suspense fallback={<PageLoader />}><SkillGapPage /></Suspense></ProtectedRoute>} />
            <Route path="training/certifications" element={<ProtectedRoute permission="view-training"><Suspense fallback={<PageLoader />}><CertificationsPage /></Suspense></ProtectedRoute>} />
            <Route path="training/:id" element={<ProtectedRoute permission="view-training"><Suspense fallback={<PageLoader />}><TrainingProgramDetailPage /></Suspense></ProtectedRoute>} />
            <Route path="performance" element={<ProtectedRoute permission="view-performance"><Suspense fallback={<PageLoader />}><PerformancePage /></Suspense></ProtectedRoute>} />
            <Route path="performance/reviews/:id" element={<ProtectedRoute permission="view-performance"><Suspense fallback={<PageLoader />}><PerformanceReviewDetailPage /></Suspense></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={authenticatedHomePath} replace />} />
          </Route>
        </Routes>
    </ErrorBoundary>
  );
}

export default App;
