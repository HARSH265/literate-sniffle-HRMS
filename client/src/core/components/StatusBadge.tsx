import { Tag } from 'antd';
import { EMPLOYEE_STATUS_COLORS, ATTENDANCE_STATUS_COLORS, PAYROLL_STATUS_COLORS, SALARY_SLIP_STATUS_COLORS, ESS_STATUS_COLORS, LOAN_STATUS_COLORS } from '../constants/statusColors';

interface StatusBadgeProps {
  status: string;
  type?: 'employee' | 'attendance' | 'payroll' | 'salary-slip' | 'ess' | 'loan';
}

const STATUS_COLOR_MAP: Record<string, Record<string, string>> = {
  employee: EMPLOYEE_STATUS_COLORS,
  attendance: ATTENDANCE_STATUS_COLORS,
  payroll: PAYROLL_STATUS_COLORS,
  'salary-slip': SALARY_SLIP_STATUS_COLORS,
  ess: ESS_STATUS_COLORS,
  loan: LOAN_STATUS_COLORS,
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const allColors = type ? STATUS_COLOR_MAP[type] : { ...EMPLOYEE_STATUS_COLORS, ...ATTENDANCE_STATUS_COLORS, ...PAYROLL_STATUS_COLORS, ...SALARY_SLIP_STATUS_COLORS, ...ESS_STATUS_COLORS, ...LOAN_STATUS_COLORS };
  const color = allColors[status] || 'default';
  const label = status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return <Tag color={color}>{label}</Tag>;
}