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
  salarySlipDetails: (id: string) => `/salary-slips/${id}`,

  leave: {
    types: '/leave/types',
    applications: '/leave/applications',
    myApplications: '/leave/my-applications',
    approvals: '/leave/approvals',
    balances: '/leave/balances',
    calendar: '/leave/calendar',
  },
  loans: {
    list: '/loans',
    apply: '/loans/apply',
    detail: (id: string) => `/loans/${id}`,
    types: '/loans/types',
  },
  reports: {
    attendance: '/reports/attendance',
    payroll: '/reports/payroll',
    custom: '/reports/custom',
    charts: '/reports/charts',
  },

  statutory: '/statutory',
  settings: '/settings',
  users: '/users',
  auditLogs: '/audit-logs',

  training: {
    index: '/training',
    enrollments: '/training/enrollments',
    skills: '/training/skills',
  },

  performance: {
    index: '/performance',
    cycleNew: '/performance/cycles/new',
    cycleEdit: (id: string) => `/performance/cycles/${id}/edit`,
    review: (id: string) => `/performance/reviews/${id}`,
  },
} as const;