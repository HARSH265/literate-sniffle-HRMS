import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './layout/ProtectedRoute';
import { ErrorBoundary } from './core/components/ErrorBoundary';

import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/auth/pages/DashboardPage';
import { EmployeesPage } from './features/employees/pages/EmployeesPage';
import { EmployeeNewPage } from './features/employees/pages/EmployeeNewPage';
import { EmployeeEditPage } from './features/employees/pages/EmployeeEditPage';
import { DepartmentsPage } from './features/departments/pages/DepartmentsPage';
import { DesignationsPage } from './features/designations/pages/DesignationsPage';
import { ShiftsPage } from './features/shifts/pages/ShiftsPage';
import { HolidaysPage } from './features/holidays/pages/HolidaysPage';
import { WeeklyOffRulesPage } from './features/weekly-off-rules/pages/WeeklyOffRulesPage';
import { AttendancePage } from './features/attendance/pages/AttendancePage';
import { OvertimeRulesPage } from './features/overtime-rules/pages/OvertimeRulesPage';
import { OvertimePage } from './features/overtime/pages/OvertimePage';
import { PayrollPage } from './features/payroll/pages/PayrollPage';
import { SalarySlipsPage } from './features/payroll/pages/SalarySlipsPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { AuditLogsPage } from './features/audit/pages/AuditLogsPage';
import { RuleBookPage } from './features/rule-book/pages/RuleBookPage';

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;