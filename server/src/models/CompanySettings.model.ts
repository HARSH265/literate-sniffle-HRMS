import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AllowanceConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: 'all' | 'worker' | 'office-staff' | 'permanent' | 'contract' | 'temporary' | 'trainee';
  isActive: boolean;
}

export interface DeductionConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: 'all' | 'worker' | 'office-staff' | 'permanent' | 'contract' | 'temporary' | 'trainee';
  isActive: boolean;
}

export interface ICompanySettings extends Document {
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    financialYearStart: number;
    cin?: string;
    gstin?: string;
    tan?: string;
    pan?: string;
    pfEstablishmentCode?: string;
    esiCode?: string;
    ptRegistrationNumber?: string;
    lwfRegistration?: string;
    shopsLicenseNumber?: string;
    factoryLicenseNumber?: string;
    payCycle?: 'monthly' | 'weekly' | 'bi-weekly';
    payPeriod?: 'calendar' | '26th-25th' | 'custom';
    salaryCreditDate?: number;
    currency?: string;
    appName?: string;
    multiLocation?: boolean;
    multiState?: boolean;
  };
  payrollConfig: {
    overtimeBase: 'basic' | 'basicPlusAllowances';
    overtimeMultiplier: number;
    halfDayDeductionPercent: number;
    lateDeductionPerDay: number;
    paidWeeklyOff: boolean;
    paidHolidays: boolean;
    defaultWorkingDays: number;
    standardHoursPerDay: number;
    payrollLockDays: number;
    unfinalizeWindowDays: number;
    otTricksEnabled: boolean;
    otRoundingMinutes: number;
    otRoundingMethod: 'floor' | 'ceil' | 'round';
    otMultiplierBasicOnly: boolean;
    perDayCalcMethod: '30' | 'actual' | '26';
    lopCalcMethod: '30' | 'actual' | '26';
    roundingFinalSalary: 'floor' | 'ceil' | 'nearest';
    roundingPrecision: number;
    negativeNetPayAllow: boolean;
    arrearsAutoCalculate: boolean;
    multiBankSplit: boolean;
    makerCheckerEnabled: boolean;
    lopPerDayBase: '30' | 'actual' | '26';
    lopComponentsAffected: string[];
    lopImpactsPf: boolean;
    lopImpactsEsi: boolean;
    lopImpactsBonus: boolean;
    lopAutoFromAttendance: boolean;
    lopReversalAllowed: boolean;
    lopReversalDeadline: 'next-month' | '2-months';
    minimumWage: number;
  };
  attendanceConfig: {
    pastEntryLimitDays: number;
    lateMarkEnabled: boolean;
    lateMarkThresholdMinutes: number;
    lateToHalfDayAfterOccurrences: number;
    qrKioskEnabled: boolean;
    qrRefreshIntervalSeconds: number;
    qrTokenExpirySeconds: number;
    geofencingEnabled: boolean;
    geofenceLatitude: number;
    geofenceLongitude: number;
    geofenceRadiusMeters: number;
    totpEnabled: boolean;
    shiftStartTime: string;
    shiftEndTime: string;
    gracePeriodMinutes: number;
    lateMarkAsAbsent: boolean;
    lateTreatWorkAsOT: boolean;
    supervisorOverrideEnabled: boolean;
    deviceBindingEnabled: boolean;
    maxDevicesPerEmployee: number;
    sandwichRuleEnabled: boolean;
    compOffEarnRule: 'holiday-work' | 'overtime' | 'both';
    compOffValidityDays: number;
    regularizationAllowed: boolean;
    regularizationDeadlineDays: number;
  };
  allowanceConfig: AllowanceConfig[];
  deductionConfig: DeductionConfig[];
  emailConfig: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
  };
  authConfig: {
    tokenExpiry?: string;
    refreshTokenExpiry?: string;
    passwordMinLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
    passwordHistoryCount?: number;
  };
  notificationConfig: {
    emailEnabled?: boolean;
    notifyOnPayrollRun?: boolean;
    notifyOnEmployeeAdded?: boolean;
    notifyOnUserCreated?: boolean;
    notifyOnAttendanceEntry?: boolean;
    notifyOnLeaveApplied?: boolean;
    notifyOnLeaveApproved?: boolean;
  };
  employeeCodeConfig: {
    prefix: string;
    startNumber: number;
    padding: number;
    isAutoGenerate: boolean;
  };
  departmentCodeConfig: {
    prefix: string;
    startNumber: number;
    padding: number;
    isAutoGenerate: boolean;
  };
  employeeDefaults: {
    defaultCategory: 'worker' | 'office-staff';
    defaultEmploymentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
    defaultSalaryType: 'monthly' | 'daily';
    defaultWorkingDays: number;
  };
  leaveConfig: {
    financialYearStartMonth: number;
    accrualDayOfMonth: number;
    defaultApprovalLevels: number;
    allowCancelAfterApproval: boolean;
    cancelAfterApprovalDaysLimit: number;
    deductionPriority: 'unpaid-first' | 'pro-rata';
    allowanceProRateMode: 'none' | 'days' | 'calendar';
    deductionProRateMode: 'none' | 'days' | 'calendar';
  };
  reportsConfig: {
    scheduledExportEnabled: boolean;
    scheduledExportFrequency: 'daily' | 'weekly' | 'monthly';
    scheduledExportDay: number;
    scheduledExportFormat: 'xlsx' | 'csv';
    scheduledExportRecipients: string[];
    scheduledExportReports: string[];
  };
  loanConfig: {
    defaultApprovalLevels: number;
    maxLoanPercentageOfSalary: number;
    minRepaymentPeriodMonths: number;
    maxRepaymentPeriodMonths: number;
    deductionPriority: 'before-tax' | 'after-tax';
  };
  statutoryConfig: {
    pfEnabled: boolean;
    pfWageCeiling: number;
    pfEmployeeRate: number;
    pfEmployerRate: number;
    epsRate: number;
    edliRate: number;
    pfAdminCharges: number;
    edliAdminCharges: number;
    esiEnabled: boolean;
    esiThreshold: number;
    esiEmployeeRate: number;
    esiEmployerRate: number;
    ptEnabled: boolean;
    ptSlabs: {
      state: string;
      slabs: { minSalary: number; maxSalary: number; amount: number; frequency: 'monthly' | 'half-yearly' | 'yearly' }[];
    }[];
  };
  updatedBy?: mongoose.Types.ObjectId;
  employeeSelfService: {
    essEnabled: boolean;
    allowAddressUpdate: boolean;
    allowBankUpdate: boolean;
    allowEmergencyContactUpdate: boolean;
    allowPhoneUpdate: boolean;
    changeRequiresApproval: boolean;
    maxChangesPerMonth: number;
  };
  announcementConfig: {
    announcementsEnabled: boolean;
    maxAnnouncementLength: number;
    allowAttachments: boolean;
    maxAttachmentSizeMb: number;
    autoExpireDays: number;
    allowScheduling: boolean;
  };
  helpdeskConfig: {
    ticketsEnabled: boolean;
    autoAssign: boolean;
    maxAttachments: number;
    slaHoursUrgent: number;
    slaHoursHigh: number;
    slaHoursNormal: number;
    slaHoursLow: number;
  };
  assetConfig: {
    assetManagementEnabled: boolean;
    autoGenerateAssetCode: boolean;
    assetCodePrefix: string;
    assetCodePadding: number;
    allowMultipleAllocation: boolean;
    maintenanceReminderDays: number;
    categories: string[];
    conditions: string[];
  };
  documentConfig: {
    documentRepoEnabled: boolean;
    maxFileSizeMb: number;
    allowedFileTypes: string[];
    autoExpireReminderDays: number;
    enableVersioning: boolean;
    maxVersions: number;
    categories: { name: string; accessRoles: string[] }[];
    tags: string[];
  };
  shiftSwapConfig: {
    shiftSwapEnabled: boolean;
    requireManagerApproval: boolean;
    maxSwapsPerMonth: number;
    swapDeadlineHours: number;
    allowRecurringSwaps: boolean;
    notifyOnMatch: boolean;
    shiftPreferenceEnabled: boolean;
  };
  travelConfig: {
    travelEnabled: boolean;
    requirePreApproval: boolean;
    maxAdvanceAmount: number;
    mileageRatePerKm: number;
    perDiemRate: number;
    perDiemEligible: boolean;
    maxClaimsPerMonth: number;
    reimbursementProcessingDays: number;
    allowPartialReimbursement: boolean;
    expenseCategories: string[];
    approvalLevels: number;
    autoApprovalUpTo: number;
  };
  gratuityConfig: {
    gratuityEnabled: boolean;
    gratuityActApplicable: boolean;
    minServiceYears: number;
    maxGratuityAmount: number;
    calculationMethod: string;
    customMultiplier: number;
    considerMonthlyWages: boolean;
  };
  performanceConfig: {
    performanceEnabled: boolean;
    reviewFrequency: 'quarterly' | 'half-yearly' | 'yearly';
    reviewPeriodStartMonth: number;
    selfReviewRequired: boolean;
    managerReviewRequired: boolean;
    enable360Feedback: boolean;
    ratingScale: '1-3' | '1-5' | '1-10';
    goalCreationDeadlineDays: number;
    reviewSubmissionDeadlineDays: number;
    allowEmployeeGoalSetting: boolean;
    autoCloseAfterDays: number;
    ratingLabels: Record<string, string>;
  };
  trainingConfig: {
    trainingEnabled: boolean;
    autoEnrollByDesignation: boolean;
    certificationExpiryReminderDays: number;
    allowSelfEnrollment: boolean;
    maxSelfEnrollmentsPerEmployee: number;
    trainingCategories: string[];
    trainingModes: string[];
    skillCategories: string[];
  };
}

type CompanySettingsModel = Model<ICompanySettings>;

const allowanceConfigSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff', 'permanent', 'contract', 'temporary', 'trainee'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const deductionConfigSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, required: true },
    applicableTo: {
      type: String,
      enum: ['all', 'worker', 'office-staff', 'permanent', 'contract', 'temporary', 'trainee'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyInfo: {
      name: { type: String, default: 'My Company' },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      logo: { type: String },
      financialYearStart: { type: Number, default: 4 },
      cin: { type: String },
      gstin: { type: String },
      tan: { type: String },
      pan: { type: String },
      pfEstablishmentCode: { type: String },
      esiCode: { type: String },
      ptRegistrationNumber: { type: String },
      lwfRegistration: { type: String },
      shopsLicenseNumber: { type: String },
      factoryLicenseNumber: { type: String },
      payCycle: { type: String, enum: ['monthly', 'weekly', 'bi-weekly'] },
      payPeriod: { type: String, enum: ['calendar', '26th-25th', 'custom'] },
      salaryCreditDate: { type: Number, min: 1, max: 31 },
      currency: { type: String, default: 'INR' },
      appName: { type: String, default: 'Orian' },
      multiLocation: { type: Boolean, default: false },
      multiState: { type: Boolean, default: false },
    },
    payrollConfig: {
      overtimeBase: { type: String, enum: ['basic', 'basicPlusAllowances'], default: 'basic' },
      overtimeMultiplier: { type: Number, default: 2.0 },
      halfDayDeductionPercent: { type: Number, default: 50 },
      lateDeductionPerDay: { type: Number, default: 0 },
      paidWeeklyOff: { type: Boolean, default: true },
      paidHolidays: { type: Boolean, default: true },
      defaultWorkingDays: { type: Number, default: 26 },
      standardHoursPerDay: { type: Number, default: 8 },
      payrollLockDays: { type: Number, default: 10 },
      unfinalizeWindowDays: { type: Number, default: 7 },
      otTricksEnabled: { type: Boolean, default: false },
      otRoundingMinutes: { type: Number, default: 60 },
      otRoundingMethod: { type: String, enum: ['floor', 'ceil', 'round'], default: 'floor' },
      otMultiplierBasicOnly: { type: Boolean, default: false },
      perDayCalcMethod: { type: String, enum: ['30', 'actual', '26'], default: '30' },
      lopCalcMethod: { type: String, enum: ['30', 'actual', '26'], default: '30' },
      roundingFinalSalary: { type: String, enum: ['floor', 'ceil', 'nearest'], default: 'nearest' },
      roundingPrecision: { type: Number, default: 0, min: 0, max: 2 },
      negativeNetPayAllow: { type: Boolean, default: false },
      arrearsAutoCalculate: { type: Boolean, default: true },
      multiBankSplit: { type: Boolean, default: false },
      makerCheckerEnabled: { type: Boolean, default: true },
      lopPerDayBase: { type: String, enum: ['30', 'actual', '26'], default: '30' },
      lopComponentsAffected: {
        type: [String],
        default: ['basic', 'hra', 'da', 'special'],
      },
      lopImpactsPf: { type: Boolean, default: true },
      lopImpactsEsi: { type: Boolean, default: true },
      lopImpactsBonus: { type: Boolean, default: true },
      lopAutoFromAttendance: { type: Boolean, default: true },
      lopReversalAllowed: { type: Boolean, default: true },
      lopReversalDeadline: {
        type: String,
        enum: ['next-month', '2-months'],
        default: 'next-month',
      },
      minimumWage: { type: Number, default: 0 },
    },
    attendanceConfig: {
      pastEntryLimitDays: { type: Number, default: 7 },
      lateMarkEnabled: { type: Boolean, default: false },
      lateMarkThresholdMinutes: { type: Number, default: 15 },
      lateToHalfDayAfterOccurrences: { type: Number, default: 3 },
      qrKioskEnabled: { type: Boolean, default: false },
      qrRefreshIntervalSeconds: { type: Number, default: 30 },
      qrTokenExpirySeconds: { type: Number, default: 120 },
      geofencingEnabled: { type: Boolean, default: false },
      geofenceLatitude: { type: Number, default: 0 },
      geofenceLongitude: { type: Number, default: 0 },
      geofenceRadiusMeters: { type: Number, default: 50 },
      totpEnabled: { type: Boolean, default: false },
      shiftStartTime: { type: String, default: '09:00' },
      shiftEndTime: { type: String, default: '18:00' },
      gracePeriodMinutes: { type: Number, default: 5 },
      lateMarkAsAbsent: { type: Boolean, default: true },
      lateTreatWorkAsOT: { type: Boolean, default: true },
      autoCheckoutEnabled: { type: Boolean, default: true },
      autoCheckoutGraceMinutes: { type: Number, default: 30 },
      breakMinutes: { type: Number, default: 30 },
      supervisorOverrideEnabled: { type: Boolean, default: true },
      deviceBindingEnabled: { type: Boolean, default: false },
      maxDevicesPerEmployee: { type: Number, default: 1 },
      breakDeductionThresholdMinutes: { type: Number, default: 360 },
      sandwichRuleEnabled: { type: Boolean, default: false },
      compOffEarnRule: { type: String, enum: ['holiday-work', 'overtime', 'both'], default: 'both' },
      compOffValidityDays: { type: Number, default: 30 },
      regularizationAllowed: { type: Boolean, default: true },
      regularizationDeadlineDays: { type: Number, default: 3 },
    },
    allowanceConfig: { type: [allowanceConfigSchema], default: [
      { name: 'HRA', type: 'percentage', value: 20, applicableTo: 'all', isActive: true },
      { name: 'DA', type: 'percentage', value: 10, applicableTo: 'all', isActive: true },
      { name: 'Transport Allowance', type: 'fixed', value: 500, applicableTo: 'all', isActive: true },
      { name: 'Food Allowance', type: 'fixed', value: 300, applicableTo: 'all', isActive: true },
    ]},
    deductionConfig: { type: [deductionConfigSchema], default: []},
    emailConfig: {
      host: { type: String },
      port: { type: Number },
      secure: { type: Boolean, default: false },
      user: { type: String },
      password: { type: String },
      fromEmail: { type: String },
      fromName: { type: String },
    },
    authConfig: {
      tokenExpiry: { type: String, default: '24h' },
      refreshTokenExpiry: { type: String, default: '7d' },
      passwordMinLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      requireSpecialChar: { type: Boolean, default: true },
      passwordHistoryCount: { type: Number, default: 5 },
    },
    notificationConfig: {
      emailEnabled: { type: Boolean, default: false },
      notifyOnPayrollRun: { type: Boolean, default: true },
      notifyOnEmployeeAdded: { type: Boolean, default: true },
      notifyOnUserCreated: { type: Boolean, default: true },
      notifyOnAttendanceEntry: { type: Boolean, default: false },
      notifyOnLeaveApplied: { type: Boolean, default: true },
      notifyOnLeaveApproved: { type: Boolean, default: true },
    },
    employeeCodeConfig: {
      prefix: { type: String, default: 'EMP' },
      startNumber: { type: Number, default: 1 },
      padding: { type: Number, default: 3 },
      isAutoGenerate: { type: Boolean, default: true },
    },
    departmentCodeConfig: {
      prefix: { type: String, default: 'DEPT' },
      startNumber: { type: Number, default: 1 },
      padding: { type: Number, default: 3 },
      isAutoGenerate: { type: Boolean, default: true },
    },
    employeeDefaults: {
      defaultCategory: { type: String, enum: ['worker', 'office-staff'], default: 'worker' },
      defaultEmploymentType: { type: String, enum: ['permanent', 'contract', 'temporary', 'trainee'], default: 'permanent' },
      defaultSalaryType: { type: String, enum: ['monthly', 'daily'], default: 'monthly' },
      defaultWorkingDays: { type: Number, default: 26 },
    },
    leaveConfig: {
      financialYearStartMonth: { type: Number, default: 4, min: 1, max: 12 },
      accrualDayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
      defaultApprovalLevels: { type: Number, default: 1, min: 1, max: 3 },
      allowCancelAfterApproval: { type: Boolean, default: false },
      cancelAfterApprovalDaysLimit: { type: Number, default: 0, min: 0 },
      deductionPriority: { type: String, enum: ['unpaid-first', 'pro-rata'], default: 'unpaid-first' },
      allowanceProRateMode: { type: String, enum: ['none', 'days', 'calendar'], default: 'days' },
      deductionProRateMode: { type: String, enum: ['none', 'days', 'calendar'], default: 'days' },
    },
    reportsConfig: {
      scheduledExportEnabled: { type: Boolean, default: false },
      scheduledExportFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
      scheduledExportDay: { type: Number, default: 1, min: 1, max: 31 },
      scheduledExportFormat: { type: String, enum: ['xlsx', 'csv'], default: 'xlsx' },
      scheduledExportRecipients: { type: [String], default: [] },
      scheduledExportReports: { type: [String], default: ['attendance', 'payroll'] },
    },
    loanConfig: {
      defaultApprovalLevels: { type: Number, default: 1, min: 1, max: 3 },
      maxLoanPercentageOfSalary: { type: Number, default: 50, min: 1, max: 100 },
      minRepaymentPeriodMonths: { type: Number, default: 1, min: 1 },
      maxRepaymentPeriodMonths: { type: Number, default: 60, min: 1, max: 120 },
      deductionPriority: { type: String, enum: ['before-tax', 'after-tax'], default: 'after-tax' },
    },
    statutoryConfig: {
      pfEnabled: { type: Boolean, default: true },
      pfWageCeiling: { type: Number, default: 15000 },
      pfEmployeeRate: { type: Number, default: 12 },
      pfEmployerRate: { type: Number, default: 13.61 },
      epsRate: { type: Number, default: 8.33 },
      edliRate: { type: Number, default: 0.5 },
      pfAdminCharges: { type: Number, default: 1.1 },
      edliAdminCharges: { type: Number, default: 0.01 },
      esiEnabled: { type: Boolean, default: true },
      esiThreshold: { type: Number, default: 21000 },
      esiEmployeeRate: { type: Number, default: 0.75 },
      esiEmployerRate: { type: Number, default: 3.25 },
      ptEnabled: { type: Boolean, default: true },
      ptSlabs: { type: [Schema.Types.Mixed], default: [
        {
          state: 'Karnataka',
          slabs: [
            { minSalary: 0, maxSalary: 15000, amount: 0, frequency: 'monthly' },
            { minSalary: 15001, maxSalary: 20000, amount: 150, frequency: 'monthly' },
            { minSalary: 20001, maxSalary: 25000, amount: 300, frequency: 'monthly' },
            { minSalary: 25001, maxSalary: 30000, amount: 450, frequency: 'monthly' },
            { minSalary: 30001, maxSalary: 999999, amount: 600, frequency: 'monthly' },
          ],
        },
        {
          state: 'Maharashtra',
          slabs: [
            { minSalary: 0, maxSalary: 10000, amount: 0, frequency: 'monthly' },
            { minSalary: 10001, maxSalary: 15000, amount: 175, frequency: 'monthly' },
            { minSalary: 15001, maxSalary: 25000, amount: 300, frequency: 'monthly' },
            { minSalary: 25001, maxSalary: 999999, amount: 500, frequency: 'monthly' },
          ],
        },
        {
          state: 'Tamil Nadu',
          slabs: [
            { minSalary: 0, maxSalary: 21000, amount: 0, frequency: 'monthly' },
            { minSalary: 21001, maxSalary: 30000, amount: 150, frequency: 'half-yearly' },
            { minSalary: 30001, maxSalary: 45000, amount: 400, frequency: 'half-yearly' },
            { minSalary: 45001, maxSalary: 60000, amount: 750, frequency: 'half-yearly' },
            { minSalary: 60001, maxSalary: 75000, amount: 1000, frequency: 'half-yearly' },
            { minSalary: 75001, maxSalary: 999999, amount: 1250, frequency: 'half-yearly' },
          ],
        },
      ]},
    },
    employeeSelfService: {
      essEnabled: { type: Boolean, default: true },
      allowAddressUpdate: { type: Boolean, default: false },
      allowBankUpdate: { type: Boolean, default: false },
      allowEmergencyContactUpdate: { type: Boolean, default: false },
      allowPhoneUpdate: { type: Boolean, default: true },
      changeRequiresApproval: { type: Boolean, default: true },
      maxChangesPerMonth: { type: Number, default: 5 },
    },
    announcementConfig: {
      announcementsEnabled: { type: Boolean, default: true },
      maxAnnouncementLength: { type: Number, default: 5000 },
      allowAttachments: { type: Boolean, default: true },
      maxAttachmentSizeMb: { type: Number, default: 5 },
      autoExpireDays: { type: Number, default: 30 },
      allowScheduling: { type: Boolean, default: true },
    },
    helpdeskConfig: {
      ticketsEnabled: { type: Boolean, default: true },
      autoAssign: { type: Boolean, default: false },
      maxAttachments: { type: Number, default: 5 },
      slaHoursUrgent: { type: Number, default: 4 },
      slaHoursHigh: { type: Number, default: 8 },
      slaHoursNormal: { type: Number, default: 24 },
      slaHoursLow: { type: Number, default: 72 },
    },
    assetConfig: {
      assetManagementEnabled: { type: Boolean, default: true },
      autoGenerateAssetCode: { type: Boolean, default: true },
      assetCodePrefix: { type: String, default: 'AST' },
      assetCodePadding: { type: Number, default: 4 },
      allowMultipleAllocation: { type: Boolean, default: false },
      maintenanceReminderDays: { type: Number, default: 90 },
      categories: {
        type: [String],
        default: ['Laptop', 'Monitor', 'Keyboard', 'Mobile', 'Tool', 'Uniform', 'Vehicle', 'Other'],
      },
      conditions: {
        type: [String],
        default: ['New', 'Good', 'Fair', 'Damaged'],
      },
    },
    documentConfig: {
      documentRepoEnabled: { type: Boolean, default: true },
      maxFileSizeMb: { type: Number, default: 20 },
      allowedFileTypes: {
        type: [String],
        default: ['pdf', 'doc', 'docx', 'xlsx', 'jpg', 'png'],
      },
      autoExpireReminderDays: { type: Number, default: 30 },
      enableVersioning: { type: Boolean, default: true },
      maxVersions: { type: Number, default: 10 },
      categories: {
        type: [{ name: String, accessRoles: [String] }],
        default: [
          { name: 'Policy', accessRoles: ['super-admin', 'hr-admin'] },
          { name: 'Contract', accessRoles: ['super-admin', 'hr-admin', 'hr-staff'] },
          { name: 'Certificate', accessRoles: ['super-admin', 'hr-admin', 'hr-staff'] },
          { name: 'ID Proof', accessRoles: ['super-admin', 'hr-admin'] },
          { name: 'Payslip', accessRoles: ['super-admin', 'hr-admin', 'accounts'] },
        ],
      },
      tags: {
        type: [String],
        default: ['HR', 'Legal', 'Finance', 'IT', 'Operations'],
      },
    },
    shiftSwapConfig: {
      shiftSwapEnabled: { type: Boolean, default: true },
      requireManagerApproval: { type: Boolean, default: true },
      maxSwapsPerMonth: { type: Number, default: 3 },
      swapDeadlineHours: { type: Number, default: 24 },
      allowRecurringSwaps: { type: Boolean, default: false },
      notifyOnMatch: { type: Boolean, default: true },
      shiftPreferenceEnabled: { type: Boolean, default: false },
    },
    performanceConfig: {
      performanceEnabled: { type: Boolean, default: true },
      reviewFrequency: { type: String, enum: ['quarterly', 'half-yearly', 'yearly'], default: 'quarterly' },
      reviewPeriodStartMonth: { type: Number, default: 4 },
      selfReviewRequired: { type: Boolean, default: true },
      managerReviewRequired: { type: Boolean, default: true },
      enable360Feedback: { type: Boolean, default: false },
      ratingScale: { type: String, enum: ['1-3', '1-5', '1-10'], default: '1-5' },
      goalCreationDeadlineDays: { type: Number, default: 15 },
      reviewSubmissionDeadlineDays: { type: Number, default: 30 },
      allowEmployeeGoalSetting: { type: Boolean, default: true },
      autoCloseAfterDays: { type: Number, default: 60 },
      ratingLabels: { type: Schema.Types.Mixed, default: { '1': 'Needs Improvement', '2': 'Meets Expectations', '3': 'Exceeds Expectations', '4': 'Outstanding', '5': 'Exceptional' } },
    },
    trainingConfig: {
      trainingEnabled: { type: Boolean, default: true },
      autoEnrollByDesignation: { type: Boolean, default: false },
      certificationExpiryReminderDays: { type: Number, default: 30 },
      allowSelfEnrollment: { type: Boolean, default: true },
      maxSelfEnrollmentsPerEmployee: { type: Number, default: 3 },
      trainingCategories: { type: [String], default: ['Technical', 'Soft Skills', 'Compliance', 'Safety', 'Leadership', 'Other'] },
      trainingModes: { type: [String], default: ['Classroom', 'Online', 'On-the-Job', 'External'] },
      skillCategories: { type: [String], default: ['Technical', 'Functional', 'Behavioral'] },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const CompanySettings = mongoose.model<ICompanySettings, CompanySettingsModel>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;