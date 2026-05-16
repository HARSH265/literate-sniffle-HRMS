export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
  },

  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },

  departments: {
    list: '/departments',
    create: '/departments',
    get: (id: string) => `/departments/${id}`,
    update: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
  },

  designations: {
    list: '/designations',
    create: '/designations',
    get: (id: string) => `/designations/${id}`,
    update: (id: string) => `/designations/${id}`,
    delete: (id: string) => `/designations/${id}`,
  },

  shifts: {
    list: '/shifts',
    create: '/shifts',
    get: (id: string) => `/shifts/${id}`,
    update: (id: string) => `/shifts/${id}`,
    delete: (id: string) => `/shifts/${id}`,
  },

  employees: {
    list: '/employees',
    create: '/employees',
    get: (id: string) => `/employees/${id}`,
    update: (id: string) => `/employees/${id}`,
    delete: (id: string) => `/employees/${id}`,
  },

  holidays: {
    list: '/holidays',
    create: '/holidays',
    get: (id: string) => `/holidays/${id}`,
    update: (id: string) => `/holidays/${id}`,
    delete: (id: string) => `/holidays/${id}`,
  },

  weeklyOffRules: {
    list: '/weekly-off-rules',
    create: '/weekly-off-rules',
    get: (id: string) => `/weekly-off-rules/${id}`,
    update: (id: string) => `/weekly-off-rules/${id}`,
    delete: (id: string) => `/weekly-off-rules/${id}`,
  },

  attendance: {
    list: '/attendance',
    bulk: '/attendance/bulk',
    monthly: (employeeId: string) => `/attendance/monthly/${employeeId}`,
    summary: '/attendance/summary',
  },

  overtimeRules: {
    list: '/overtime-rules',
    create: '/overtime-rules',
    get: (id: string) => `/overtime-rules/${id}`,
    update: (id: string) => `/overtime-rules/${id}`,
    delete: (id: string) => `/overtime-rules/${id}`,
  },

  overtimeEntries: {
    list: '/overtime-entries',
    create: '/overtime-entries',
    get: (id: string) => `/overtime-entries/${id}`,
    update: (id: string) => `/overtime-entries/${id}`,
    delete: (id: string) => `/overtime-entries/${id}`,
  },

  payroll: {
    runs: {
      list: '/payroll/runs',
      create: '/payroll/runs',
      get: (id: string) => `/payroll/runs/${id}`,
      finalize: (id: string) => `/payroll/runs/${id}/finalize`,
      update: (id: string) => `/payroll/runs/${id}`,
    },
    items: {
      list: '/payroll/items',
      get: (id: string) => `/payroll/items/${id}`,
      update: (id: string) => `/payroll/items/${id}`,
    },
  },

  salarySlips: {
    list: '/salary-slips',
    get: (id: string) => `/salary-slips/${id}`,
    pdf: (id: string) => `/salary-slips/${id}/pdf`,
    generate: (payrollRunId: string) => `/salary-slips/generate/${payrollRunId}`,
  },

  reports: {
    attendance: '/reports/attendance',
    payroll: '/reports/payroll',
    employees: '/reports/employees',
  },

  settings: {
    get: '/settings',
    update: '/settings',
  },

  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    unreadCount: '/notifications/unread-count',
  },

  auditLogs: {
    list: '/audit-logs',
    modules: '/audit-logs/modules',
  },

  upload: {
    logo: '/upload/logo',
    employeePhoto: '/upload/employee-photo',
  },
} as const;