import apiClient from '../../../core/api/apiClient';

export interface CompanySettings {
  id: string;
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    financialYearStart: number;
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
  };
  attendanceConfig: {
    pastEntryLimitDays: number;
    lateMarkEnabled: boolean;
    lateMarkThresholdMinutes: number;
    lateToHalfDayAfterOccurrences: number;
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
}

export const settingsService = {
  async get(): Promise<{ success: boolean; data: CompanySettings }> {
    const { data } = await apiClient.get('/settings');
    return data;
  },

  async update(payload: Partial<CompanySettings>): Promise<{ success: boolean; data: CompanySettings }> {
    const { data } = await apiClient.patch('/settings', payload);
    return data;
  },
};