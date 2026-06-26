import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface CompanySettings {
  id: string;
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    financialYearStart: number;
    appName?: string;
    currency?: string;
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
    // Advanced payroll settings
    perDayCalcMethod?: '30' | 'actual' | '26';
    lopCalcMethod?: '30' | 'actual' | '26';
    roundingFinalSalary?: 'floor' | 'ceil' | 'nearest';
    roundingPrecision?: number;
    negativeNetPayAllow?: boolean;
    arrearsAutoCalculate?: boolean;
    multiBankSplit?: boolean;
    makerCheckerEnabled?: boolean;
    lopPerDayBase?: '30' | 'actual' | '26';
    lopComponentsAffected?: string[];
    lopImpactsPf?: boolean;
    lopImpactsEsi?: boolean;
    lopImpactsBonus?: boolean;
    lopAutoFromAttendance?: boolean;
    lopReversalAllowed?: boolean;
    lopReversalDeadline?: 'next-month' | '2-months';
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
    autoCheckoutEnabled: boolean;
    autoCheckoutGraceMinutes: number;
    breakMinutes: number;
    breakDeductionThresholdMinutes: number;
    sandwichRuleEnabled?: boolean;
    compOffEarnRule?: 'holiday-work' | 'overtime' | 'both';
    compOffValidityDays?: number;
    regularizationAllowed?: boolean;
    regularizationDeadlineDays?: number;
  };
  allowanceConfig: Array<{
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    applicableTo: string;
    isActive: boolean;
  }>;
  deductionConfig: Array<{
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    applicableTo: string;
    isActive: boolean;
  }>;
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
    deductionPriority: string;
    allowanceProRateMode: string;
    deductionProRateMode: string;
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
  documentConfig?: {
    documentRepoEnabled: boolean;
    maxFileSizeMb: number;
    allowedFileTypes: string[];
    autoExpireReminderDays: number;
    enableVersioning: boolean;
    maxVersions: number;
    categories: { name: string; accessRoles: string[] }[];
    tags: string[];
  };
  employeeSelfService?: {
    essEnabled: boolean;
    allowAddressUpdate: boolean;
    allowBankUpdate: boolean;
    allowEmergencyContactUpdate: boolean;
    allowPhoneUpdate: boolean;
    changeRequiresApproval: boolean;
    maxChangesPerMonth: number;
  };
  userCredentialsConfig?: {
    showCredentialsInEmployeeDetail: boolean;
    autoGeneratePasswordOnUserCreate: boolean;
  };
}

export const settingsService = {
  async get(): Promise<{ success: boolean; data: CompanySettings }> {
    const { data } = await apiClient.get(API_ENDPOINTS.settings.get);
    return data;
  },

  async update(payload: Partial<CompanySettings>): Promise<{ success: boolean; data: CompanySettings }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.settings.update, payload);
    return data;
  },

  async testEmail(email: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.settings.testEmail, null, { params: { email } });
    return data;
  },

  async uploadLogo(file: File): Promise<{ success: boolean; logoUrl?: string; message?: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post(API_ENDPOINTS.settings.uploadLogo, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};