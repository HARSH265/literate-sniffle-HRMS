import apiClient from '../../../core/api/apiClient';

export interface PerformanceGoal {
  title: string;
  description?: string;
  weight: number;
  targetValue?: string;
  actualValue?: string;
  category?: string;
  selfRating?: number;
  managerRating?: number;
  comments?: string;
}

export interface SelfReview {
  rating: number;
  overallComment: string;
  strengths?: string;
  improvements?: string;
  submittedAt: string;
}

export interface ManagerReview {
  rating: number;
  overallComment: string;
  strengths?: string;
  improvements?: string;
  submittedAt: string;
  reviewer?: { _id: string; name: string; email: string };
}

export interface PerformanceCycle {
  _id: string;
  label: string;
  year: number;
  quarter: number;
  startDate: string;
  goalDeadline: string;
  selfReviewDeadline: string;
  managerReviewDeadline: string;
  closureDate: string;
  status: 'upcoming' | 'active' | 'closed';
  participants: string[];
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  _id: string;
  employee: { _id: string; fullName: string; employeeCode: string; department?: string; designation?: string };
  reviewCycle: { _id: string; label: string; year: number; quarter: number; status: string; startDate?: string; goalDeadline?: string; selfReviewDeadline?: string; managerReviewDeadline?: string };
  reviewPeriod: { year: number; quarter: number; label: string };
  goals: PerformanceGoal[];
  selfReview?: SelfReview;
  managerReview?: ManagerReview;
  overallRating?: number;
  finalRating?: number;
  status: 'draft' | 'goals-set' | 'self-review' | 'manager-review' | 'completed' | 'appealed';
  isAppealed: boolean;
  appealReason?: string;
  appealResolution?: string;
  createdBy: { _id: string; name: string; email: string };
  feedback?: any[];
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  cycleId?: string;
  employeeId?: string;
  search?: string;
  sort?: string;
}

export const performanceService = {
  async listCycles(params?: ListParams): Promise<{ success: boolean; data: PerformanceCycle[]; meta: any }> {
    const { data } = await apiClient.get('/performance/cycles', { params });
    return data;
  },

  async getCycle(id: string): Promise<{ success: boolean; data: PerformanceCycle }> {
    const { data } = await apiClient.get(`/performance/cycles/${id}`);
    return data;
  },

  async createCycle(payload: {
    year: number;
    quarter: number;
    label: string;
    startDate: string;
    goalDeadline: string;
    selfReviewDeadline: string;
    managerReviewDeadline: string;
    closureDate: string;
    participants?: string[];
  }): Promise<{ success: boolean; data: PerformanceCycle; message: string }> {
    const { data } = await apiClient.post('/performance/cycles', payload);
    return data;
  },

  async updateCycle(id: string, payload: Partial<{
    label: string;
    status: string;
    startDate: string;
    goalDeadline: string;
    selfReviewDeadline: string;
    managerReviewDeadline: string;
    closureDate: string;
  }>): Promise<{ success: boolean; data: PerformanceCycle; message: string }> {
    const { data } = await apiClient.patch(`/performance/cycles/${id}`, payload);
    return data;
  },

  async listReviews(params?: ListParams): Promise<{ success: boolean; data: PerformanceReview[]; meta: any }> {
    const { data } = await apiClient.get('/performance/reviews', { params });
    return data;
  },

  async getReview(id: string): Promise<{ success: boolean; data: PerformanceReview }> {
    const { data } = await apiClient.get(`/performance/reviews/${id}`);
    return data;
  },

  async setGoals(reviewId: string, goals: PerformanceGoal[]): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(`/performance/reviews/${reviewId}/goals`, { goals });
    return data;
  },

  async submitReview(reviewId: string, payload: { rating: number; overallComment: string; strengths?: string; improvements?: string }): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(`/performance/reviews/${reviewId}/self-review`, payload);
    return data;
  },

  async managerReview(reviewId: string, payload: { rating: number; overallComment: string; strengths?: string; improvements?: string }): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(`/performance/reviews/${reviewId}/manager-review`, payload);
    return data;
  },

  async appeal(reviewId: string, reason: string): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.post(`/performance/reviews/${reviewId}/appeal`, { reason });
    return data;
  },

  async resolveAppeal(reviewId: string, resolution: string, finalRating?: number): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.post(`/performance/reviews/${reviewId}/resolve-appeal`, { resolution, finalRating });
    return data;
  },

  async requestFeedback(reviewId: string, fromEmployeeId: string): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.post(`/performance/feedback/request/${reviewId}`, { fromEmployeeId });
    return data;
  },
};
