import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface TrainingProgram {
  _id: string;
  title: string;
  description?: string;
  category: string;
  mode: 'online' | 'offline' | 'hybrid';
  duration: { value: number; unit: 'hours' | 'days' | 'weeks' };
  maxParticipants?: number;
  startDate: string;
  endDate: string;
  trainer?: string;
  location?: string;
  cost?: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  certificationOffered?: boolean;
  certificationValidForDays?: number;
  prerequisites?: string[];
  tags?: string[];
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollment {
  _id: string;
  training: { _id: string; title: string; category: string; startDate: string; endDate: string; status: string };
  employee: { _id: string; fullName: string; employeeCode: string } | string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped' | 'certified';
  enrolledAt: string;
  completionDate?: string;
  score?: number;
  feedback?: string;
  rating?: number;
  certificationExpiry?: string;
  certificationNumber?: string;
  attendance: { date: string; present: boolean }[];
}

export interface Skill {
  _id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface EmployeeSkill {
  _id: string;
  employee: { _id: string; fullName: string; employeeCode: string } | string;
  skill: { _id: string; name: string; category: string };
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  certified?: boolean;
  certificationExpiry?: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
}

export const trainingService = {
  async listPrograms(params?: ListParams): Promise<{ success: boolean; data: TrainingProgram[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.programs.list, { params });
    return data;
  },

  async getProgram(id: string): Promise<{ success: boolean; data: TrainingProgram }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.programs.get(id));
    return data;
  },

  async createProgram(payload: {
    title: string; description?: string; category: string; mode: string;
    duration: { value: number; unit: string }; maxParticipants?: number;
    startDate: string; endDate: string; trainer?: string; location?: string;
    cost?: number; certificationOffered?: boolean; certificationValidForDays?: number;
    prerequisites?: string[]; tags?: string[];
  }): Promise<{ success: boolean; data: TrainingProgram; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.training.programs.create, payload);
    return data;
  },

  async updateProgram(id: string, payload: Partial<{
    title: string; description: string; category: string; mode: string;
    duration: { value: number; unit: string }; maxParticipants: number;
    startDate: string; endDate: string; trainer: string; location: string;
    cost: number; status: string;
  }>): Promise<{ success: boolean; data: TrainingProgram; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.training.programs.update(id), payload);
    return data;
  },

  async cancelProgram(id: string): Promise<{ success: boolean; data: TrainingProgram; message: string }> {
    const { data } = await apiClient.delete(API_ENDPOINTS.training.programs.cancel(id));
    return data;
  },

  async getMyEnrollments(): Promise<{ success: boolean; data: TrainingEnrollment[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.enrollments.my);
    return data;
  },

  async listEnrollments(params?: ListParams & { programId?: string; employeeId?: string }): Promise<{ success: boolean; data: TrainingEnrollment[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.enrollments.list, { params });
    return data;
  },

  async enrollEmployee(payload: { trainingId: string; employeeId: string }): Promise<{ success: boolean; data: TrainingEnrollment; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.training.enrollments.create, payload);
    return data;
  },

  async batchEnroll(payload: { trainingId: string; employeeIds: string[] }): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.training.enrollments.batch, payload);
    return data;
  },

  async completeEnrollment(id: string, payload?: { score?: number; feedback?: string; rating?: number; certificationExpiry?: string }): Promise<{ success: boolean; data: TrainingEnrollment; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.training.enrollments.complete(id), payload || {});
    return data;
  },

  async dropEnrollment(id: string): Promise<{ success: boolean; data: TrainingEnrollment; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.training.enrollments.drop(id));
    return data;
  },

  async recordAttendance(id: string, attendance: { date: string; present: boolean }[]): Promise<{ success: boolean; data: TrainingEnrollment; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.training.enrollments.attendance(id), { attendance });
    return data;
  },

  async listEmployeeSkills(employeeId: string): Promise<{ success: boolean; data: EmployeeSkill[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.skills.employee(employeeId));
    return data;
  },

  async listSkills(params?: { search?: string; category?: string }): Promise<{ success: boolean; data: Skill[] }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.skills.list, { params });
    return data;
  },

  async createSkill(payload: { name: string; category: string; description?: string }): Promise<{ success: boolean; data: Skill; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.training.skills.create, payload);
    return data;
  },

  async updateEmployeeSkill(employeeId: string, skillId: string, payload: { proficiency: string; yearsOfExperience?: number; certified?: boolean }): Promise<{ success: boolean; data: EmployeeSkill; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.training.skills.update(employeeId, skillId), payload);
    return data;
  },

  async getStats(): Promise<{ success: boolean; data: { totalPrograms: number; activePrograms: number; totalEnrollments: number; completionRate: number } }> {
    const { data } = await apiClient.get(API_ENDPOINTS.training.stats);
    return data;
  },
};
