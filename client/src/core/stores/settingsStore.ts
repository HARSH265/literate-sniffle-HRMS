import { create } from 'zustand';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  financialYearStart: number;
}

interface PayrollConfig {
  overtimeBase: 'basic' | 'basicPlusAllowances';
  overtimeMultiplier: number;
  halfDayDeductionPercent: number;
  lateDeductionPerDay: number;
  paidWeeklyOff: boolean;
  paidHolidays: boolean;
  defaultWorkingDays: number;
  standardHoursPerDay: number;
  payrollLockDays: number;
}

interface AttendanceConfig {
  pastEntryLimitDays: number;
  lateMarkEnabled: boolean;
  lateMarkThresholdMinutes: number;
  lateToHalfDayAfterOccurrences: number;
}

interface AllowanceConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: string;
  isActive: boolean;
}

interface DeductionConfig {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  applicableTo: string;
  isActive: boolean;
}

interface EmailConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  fromAddress?: string;
}

interface SettingsState {
  companyInfo: CompanyInfo | null;
  payrollConfig: PayrollConfig | null;
  attendanceConfig: AttendanceConfig | null;
  allowanceConfig: AllowanceConfig[];
  deductionConfig: DeductionConfig[];
  emailConfig: EmailConfig | null;
  isLoaded: boolean;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  companyInfo: null,
  payrollConfig: null,
  attendanceConfig: null,
  allowanceConfig: [],
  deductionConfig: [],
  emailConfig: null,
  isLoaded: false,
  setSettings: (settings) => set(settings),
}));