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

  leave: {
    types: {
      list: '/leave/types',
      create: '/leave/types',
      update: (id: string) => `/leave/types/${id}`,
      delete: (id: string) => `/leave/types/${id}`,
    },
    applications: {
      list: '/leave/applications',
      my: '/leave/applications/my',
      create: '/leave/applications',
      cancel: (id: string) => `/leave/applications/${id}/cancel`,
      approve: '/leave/applications/approve',
    },
    approvals: {
      pending: '/leave/approvals/pending',
    },
    balances: {
      get: (employeeId: string) => `/leave/balances/${employeeId}`,
      my: '/leave/balances/my',
    },
    accrue: '/leave/accrue',
    calendar: '/leave/calendar',
    summary: '/leave/summary',
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

  training: {
    programs: {
      list: '/training/programs',
      create: '/training/programs',
      get: (id: string) => `/training/programs/${id}`,
      update: (id: string) => `/training/programs/${id}`,
      cancel: (id: string) => `/training/programs/${id}`,
    },
    enrollments: {
      my: '/training/enrollments/my',
      pending: '/training/enrollments/pending',
      create: '/training/enrollments',
      batch: '/training/enrollments/batch',
      complete: (id: string) => `/training/enrollments/${id}/complete`,
      drop: (id: string) => `/training/enrollments/${id}/drop`,
      attendance: (id: string) => `/training/enrollments/${id}/attendance`,
    },
    skills: {
      list: '/training/skills',
      my: '/training/skills/my',
      employee: (employeeId: string) => `/training/skills/employee/${employeeId}`,
      gap: (designationId: string) => `/training/skills/gap/${designationId}`,
      create: '/training/skills',
      update: (employeeId: string, skillId: string) => `/training/skills/employee/${employeeId}/${skillId}`,
    },
    stats: '/training/stats',
    certificationsExpiring: '/training/certifications/expiring',
  },

  performance: {
    cycles: {
      list: '/performance/cycles',
      create: '/performance/cycles',
      get: (id: string) => `/performance/cycles/${id}`,
      update: (id: string) => `/performance/cycles/${id}`,
    },
    reviews: {
      list: '/performance/reviews',
      get: (id: string) => `/performance/reviews/${id}`,
      setGoals: (id: string) => `/performance/reviews/${id}/goals`,
      submit: (id: string) => `/performance/reviews/${id}/submit`,
      managerReview: (id: string) => `/performance/reviews/${id}/manager-review`,
      appeal: (id: string) => `/performance/reviews/${id}/appeal`,
      resolveAppeal: (id: string) => `/performance/reviews/${id}/resolve-appeal`,
      feedback: (id: string) => `/performance/reviews/${id}/feedback`,
    },
  },

  upload: {
    logo: '/upload/logo',
    employeePhoto: '/upload/employee-photo',
  },
} as const;