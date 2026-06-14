export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    logoutAllDevices: '/auth/logout-all-devices',
  },

  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    activate: (id: string) => `/users/${id}/activate`,
    deactivate: (id: string) => `/users/${id}/deactivate`,
    activity: (id: string) => `/users/${id}/activity`,
    stats: (id: string) => `/users/${id}/stats`,
    export: '/users/export',
    import: '/users/import',
  },

  departments: {
    list: '/departments',
    create: '/departments',
    get: (id: string) => `/departments/${id}`,
    update: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
    nextCode: '/departments/next-code',
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
    nextCode: '/employees/next-code',
    import: '/employees/import',
    export: '/employees/export',
    template: '/employees/template',
    bulkAssignShift: '/employees/bulk/shift',
    restore: (id: string) => `/employees/${id}/restore`,
    uploadDocument: (id: string) => `/employees/${id}/documents`,
    downloadDocument: (id: string, docId: string) => `/employees/${id}/documents/${docId}`,
    removeDocument: (id: string, docId: string) => `/employees/${id}/documents/${docId}`,
    photo: (id: string) => `/employees/${id}/photo`,
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
    create: '/attendance',
    bulk: '/attendance/bulk',
    monthly: (employeeId: string) => `/attendance/monthly/${employeeId}`,
    monthlyView: '/attendance/monthly-view',
    summary: '/attendance/summary',
    bulkUpdate: '/attendance/bulk-update',
    update: (id: string) => `/attendance/${id}`,
    delete: (id: string) => `/attendance/${id}`,
    adminCheckout: (employeeId: string) => `/attendance/admin-checkout/${employeeId}`,
    getByEmployee: (employeeId: string) => `/attendance/employee/${employeeId}`,
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
      create: '/payroll/run',
      get: (id: string) => `/payroll/run/${id}`,
      preview: '/payroll/preview',
      submit: (id: string) => `/payroll/run/${id}/submit`,
      approve: (id: string) => `/payroll/run/${id}/approve`,
      reject: (id: string) => `/payroll/run/${id}/reject`,
      finalize: (id: string) => `/payroll/run/${id}/finalize`,
      unfinalize: (id: string) => `/payroll/run/${id}/unfinalize`,
      delete: (id: string) => `/payroll/run/${id}`,
      update: (id: string) => `/payroll/run/${id}`,
    },
    items: {
      list: '/payroll/items',
      get: (id: string) => `/payroll/items/${id}`,
      update: (id: string) => `/payroll/items/${id}`,
      batch: (runId: string) => `/payroll/run/${runId}/items/batch`,
      updateInRun: (runId: string, itemId: string) => `/payroll/run/${runId}/items/${itemId}`,
    },
    employee: (employeeId: string) => `/payroll/runs/employee/${employeeId}`,
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
    testEmail: '/settings/test-email',
    uploadLogo: '/settings/upload-logo',
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
    actions: '/audit-logs/actions',
    export: '/audit-logs/export',
    stats: '/audit-logs/stats',
    retention: '/audit-logs/retention',
    cleanup: '/audit-logs/cleanup',
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
      list: '/training/enrollments',
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
      submitSelfReview: (id: string) => `/performance/reviews/${id}/self-review`,
      managerReview: (id: string) => `/performance/reviews/${id}/manager-review`,
      appeal: (id: string) => `/performance/reviews/${id}/appeal`,
      resolveAppeal: (id: string) => `/performance/reviews/${id}/resolve-appeal`,
      feedback: (id: string) => `/performance/reviews/${id}/feedback`,
      feedbackRequest: (id: string) => `/performance/reviews/${id}/feedback-request`,
    },
  },

  upload: {
    logo: '/upload/logo',
    employeePhoto: '/upload/employee-photo',
  },

  permissions: {
    groups: '/permissions/groups',
    roles: '/permissions/roles',
    role: (role: string) => `/permissions/roles/${role}`,
    resetRole: (role: string) => `/permissions/roles/${role}/reset`,
  },

  componentMaster: {
    list: '/component-master',
    create: '/component-master',
    get: (id: string) => `/component-master/${id}`,
    update: (id: string) => `/component-master/${id}`,
    delete: (id: string) => `/component-master/${id}`,
  },

  salaryStructures: {
    list: '/salary-structures',
    create: '/salary-structures',
    get: (id: string) => `/salary-structures/${id}`,
    update: (id: string) => `/salary-structures/${id}`,
    delete: (id: string) => `/salary-structures/${id}`,
  },

  announcements: {
    list: '/announcements',
    create: '/announcements',
    get: (id: string) => `/announcements/${id}`,
    update: (id: string) => `/announcements/${id}`,
    delete: (id: string) => `/announcements/${id}`,
    markRead: (id: string) => `/announcements/${id}/read`,
    unreadCount: '/announcements/unread-count',
  },

  helpdesk: {
    list: '/helpdesk',
    create: '/helpdesk',
    get: (id: string) => `/helpdesk/${id}`,
    update: (id: string) => `/helpdesk/${id}`,
    delete: (id: string) => `/helpdesk/${id}`,
    stats: '/helpdesk/stats',
    checkSla: '/helpdesk/check-sla',
    addComment: (id: string) => `/helpdesk/${id}/comment`,
  },

  loans: {
    list: '/loans',
    create: '/loans',
    get: (id: string) => `/loans/${id}`,
    update: (id: string) => `/loans/${id}`,
    delete: (id: string) => `/loans/${id}`,
    types: {
      list: '/loans/types',
      get: (id: string) => `/loans/types/${id}`,
      create: '/loans/types',
      update: (id: string) => `/loans/types/${id}`,
      delete: (id: string) => `/loans/types/${id}`,
    },
    apply: '/loans/apply',
    approve: (id: string) => `/loans/${id}/approve`,
    reject: (id: string) => `/loans/${id}/reject`,
    disburse: (id: string) => `/loans/${id}/disburse`,
    cancel: (id: string) => `/loans/${id}/cancel`,
    repay: (id: string) => `/loans/${id}/repay`,
    employeeSummary: (employeeId: string) => `/loans/employee/${employeeId}/summary`,
  },

  assets: {
    list: '/assets',
    create: '/assets',
    get: (id: string) => `/assets/${id}`,
    update: (id: string) => `/assets/${id}`,
    delete: (id: string) => `/assets/${id}`,
    allocate: (id: string) => `/assets/${id}/allocate`,
    returnAsset: (id: string) => `/assets/${id}/return`,
    maintenance: (id: string) => `/assets/${id}/maintenance`,
    retire: (id: string) => `/assets/${id}/retire`,
    employeeAssets: (employeeId: string) => `/assets/employee/${employeeId}`,
    stats: '/assets/stats',
    history: (id: string) => `/assets/${id}/history`,
    categories: '/assets/categories',
  },

  statutory: {
    config: '/statutory/config',
    defaults: '/statutory/defaults',
    calculate: '/statutory/calculate',
    summary: (month: string) => `/statutory/summary/${month}`,
    compliance: {
      check: '/statutory/compliance/check',
      report: (id: string) => `/statutory/compliance/report/${id}`,
    },
    challans: {
      generate: (month: string) => `/statutory/challans/generate/${month}`,
      list: '/statutory/challans',
      get: (id: string) => `/statutory/challans/${id}`,
      update: (id: string) => `/statutory/challans/${id}`,
    },
    reports: {
      generate: '/statutory/reports/generate',
      list: '/statutory/reports',
      get: (id: string) => `/statutory/reports/${id}`,
      update: (id: string) => `/statutory/reports/${id}`,
    },
  },

  compliance: {
    summary: '/compliance/summary',
    runCheck: (runId: string) => `/compliance/runs/${runId}/check`,
    runSummary: (runId: string) => `/compliance/runs/${runId}/summary`,
    gapReport: (runId: string) => `/compliance/runs/${runId}/gap-report`,
    auditLog: '/compliance/audit-log',
  },

  salaryStructureTemplates: {
    list: '/salary-structure-templates',
    create: '/salary-structure-templates',
    get: (id: string) => `/salary-structure-templates/${id}`,
    update: (id: string) => `/salary-structure-templates/${id}`,
    delete: (id: string) => `/salary-structure-templates/${id}`,
  },

  payrollReports: {
    payslipPdf: (itemId: string) => `/payroll-reports/payslip/${itemId}/pdf`,
    bankFile: (runId: string) => `/payroll-reports/bank-file/${runId}`,
    salaryRegister: (runId: string) => `/payroll-reports/salary-register/${runId}`,
    salaryRegisterCsv: (runId: string) => `/payroll-reports/salary-register/${runId}/csv`,
    runPdf: (runId: string) => `/payroll-reports/run/${runId}/pdf`,
    headcountCost: '/payroll-reports/headcount-cost',
    momVariance: '/payroll-reports/mom-variance',
    ytdCost: '/payroll-reports/ytd-cost',
    otLop: (runId: string) => `/payroll-reports/ot-lop/${runId}`,
    loanOutstanding: '/payroll-reports/loan-outstanding',
    budgetVsActual: (runId: string) => `/payroll-reports/budget-vs-actual/${runId}`,
  },
} as const;