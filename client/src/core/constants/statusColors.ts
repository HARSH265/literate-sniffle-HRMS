export const PAYROLL_STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  submitted: 'blue',
  approved: 'purple',
  finalized: 'green',
};

export const ESS_STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

export const LOAN_STATUS_COLORS: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  active: 'blue',
  completed: 'green',
  defaulted: 'red',
};

export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  terminated: 'red',
  archived: 'default',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: 'green',
  absent: 'red',
  'half-day': 'orange',
  leave: 'blue',
  'weekly-off': 'purple',
  holiday: 'cyan',
};

export const SALARY_SLIP_STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  finalized: 'green',
};
