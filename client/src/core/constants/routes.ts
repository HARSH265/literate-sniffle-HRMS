export const ROUTES = {
  login: '/login',

  dashboard: '/dashboard',

  employees: {
    list: '/employees',
    new: '/employees/new',
    edit: (id: string) => `/employees/${id}`,
    view: (id: string) => `/employees/${id}`,
  },

  departments: '/departments',
  designations: '/designations',
  shifts: '/shifts',
  holidays: '/holidays',
  weeklyOffRules: '/weekly-off-rules',

  attendance: {
    index: '/attendance',
    monthly: '/attendance/monthly',
  },

  overtime: {
    rules: '/overtime/rules',
    entries: '/overtime/entries',
  },

  payroll: {
    index: '/payroll',
    process: (month: string) => `/payroll/${month}/process`,
  },

  salarySlips: '/salary-slips',

  reports: {
    attendance: '/reports/attendance',
    payroll: '/reports/payroll',
  },

  settings: '/settings',
  users: '/users',
  auditLogs: '/audit-logs',
} as const;