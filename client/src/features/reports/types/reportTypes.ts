import type { Dayjs } from 'dayjs';

export interface ReportFilters {
  status: string | undefined;
  category: string | undefined;
  empDeptId: string | undefined;
}

export interface ExportTabProps {
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  attendanceMonth: Dayjs;
  setAttendanceMonth: (month: Dayjs) => void;
  attendanceDept: string | undefined;
  setAttendanceDept: (dept: string | undefined) => void;
  dateRange: [Dayjs, Dayjs] | null;
  setDateRange: (range: [Dayjs, Dayjs] | null) => void;
  payrollYear: number;
  setPayrollYear: (year: number) => void;
  payrollDept: string | undefined;
  setPayrollDept: (dept: string | undefined) => void;
  overtimeMonth: Dayjs;
  setOvertimeMonth: (month: Dayjs) => void;
  overtimeDept: string | undefined;
  setOvertimeDept: (dept: string | undefined) => void;
  deptData: any;
}

export interface SummaryTabProps {
  attendanceMonth: Dayjs;
  dateRange: [Dayjs, Dayjs] | null;
  attendanceDept: string | undefined;
  payrollYear: number;
  payrollDept: string | undefined;
  overtimeMonth: Dayjs;
  overtimeDept: string | undefined;
  setOvertimeMonth: (month: Dayjs) => void;
  handleDrillDown: (entity: string, id?: string, filters?: Record<string, any>) => void;
  drillDownLoading: boolean;
}

export interface CustomReportTabProps {
  deptData: any;
}

export interface ChartsTabProps {
  chartType: 'attendance' | 'payroll' | 'department' | 'leave';
  setChartType: (type: 'attendance' | 'payroll' | 'department' | 'leave') => void;
  chartGroupBy: 'month' | 'department' | 'category' | 'status' | undefined;
  setChartGroupBy: (group: 'month' | 'department' | 'category' | 'status' | undefined) => void;
  chartPeriod: [Dayjs, Dayjs];
  setChartPeriod: (period: [Dayjs, Dayjs]) => void;
}

export interface DrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  data: any;
  loading?: boolean;
}
