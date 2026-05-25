export const QUERY_KEYS = {
  auth: ['auth'] as const,
  me: ['auth', 'me'] as const,

  departments: ['departments'] as const,
  designations: ['designations'] as const,
  shifts: ['shifts'] as const,
  holidays: ['holidays'] as const,
  weeklyOffRules: ['weekly-off-rules'] as const,
  overtimeRules: ['overtime-rules'] as const,

  users: ['users'] as const,
  employees: ['employees'] as const,
  employee: (id: string) => ['employees', id] as const,

  attendance: ['attendance'] as const,
  attendanceMonthly: (employeeId: string, month: string) => ['attendance', 'monthly', employeeId, month] as const,
  attendanceSummary: (month: string) => ['attendance', 'summary', month] as const,

  overtimeEntries: ['overtime-entries'] as const,

  payrollRuns: ['payroll', 'runs'] as const,
  payrollRun: (id: string) => ['payroll', 'runs', id] as const,
  payrollItems: ['payroll', 'items'] as const,
  payrollItem: (id: string) => ['payroll', 'items', id] as const,

  salarySlips: ['salary-slips'] as const,
  salarySlip: (id: string) => ['salary-slips', id] as const,

  leaveTypes: ['leave', 'types'] as const,
  leaveApplications: ['leave', 'applications'] as const,
  leaveApplicationsMy: ['leave', 'applications', 'my'] as const,
  leaveApprovalsPending: ['leave', 'approvals', 'pending'] as const,
  leaveBalances: (employeeId: string) => ['leave', 'balances', employeeId] as const,
  leaveBalancesMy: ['leave', 'balances', 'my'] as const,
  leaveCalendar: ['leave', 'calendar'] as const,
  leaveSummary: ['leave', 'summary'] as const,

  reports: ['reports'] as const,

  settings: ['settings'] as const,

  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,

  auditLogs: ['audit-logs'] as const,
} as const;