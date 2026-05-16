export type StatusType =
  | 'active'
  | 'inactive'
  | 'terminated'
  | 'present'
  | 'absent'
  | 'half-day'
  | 'leave'
  | 'weekly-off'
  | 'holiday'
  | 'draft'
  | 'finalized'
  | 'pending'
  | 'paid';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  fatherName: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: { _id: string; name: string };
  designation: { _id: string; name: string };
  shift: { _id: string; name: string };
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage: number;
  overtimeEligible: boolean;
  status: 'active' | 'inactive' | 'terminated';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}