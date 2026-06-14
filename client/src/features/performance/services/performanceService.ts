import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

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
  cycle?: { _id: string; label: string; year: number; quarter: number; status: string; startDate?: string; goalDeadline?: string; selfReviewDeadline?: string; managerReviewDeadline?: string };
  reviewCycle: { _id: string; label: string; year: number; quarter: number; status: string; startDate?: string; goalDeadline?: string; selfReviewDeadline?: string; managerReviewDeadline?: string };
  reviewPeriod: { year: number; quarter: number; label: string };
  goals: PerformanceGoal[];
  selfReview?: SelfReview;
  selfComments?: string;
  managerReview?: ManagerReview;
  manager?: { _id: string; name: string; email: string };
  managerComments?: string;
  overallRating?: number;
  finalRating?: number;
  status: 'draft' | 'goals-set' | 'self-review' | 'manager-review' | 'completed' | 'appealed';
  isAppealed: boolean;
  appealReason?: string;
  appealResolution?: string;
  appealedAt?: string;
  resolvedAt?: string;
  submittedAt?: string;
  managerReviewedAt?: string;
  completedAt?: string;
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
    const { data } = await apiClient.get(API_ENDPOINTS.performance.cycles.list, { params });
    return data;
  },

  async getCycle(id: string): Promise<{ success: boolean; data: PerformanceCycle }> {
    const { data } = await apiClient.get(API_ENDPOINTS.performance.cycles.get(id));
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
    const { data } = await apiClient.post(API_ENDPOINTS.performance.cycles.create, payload);
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
    const { data } = await apiClient.patch(API_ENDPOINTS.performance.cycles.update(id), payload);
    return data;
  },

  async listReviews(params?: ListParams): Promise<{ success: boolean; data: PerformanceReview[]; meta: any }> {
    const { data } = await apiClient.get(API_ENDPOINTS.performance.reviews.list, { params });
    return data;
  },

  async getReview(id: string): Promise<{ success: boolean; data: PerformanceReview }> {
    const { data } = await apiClient.get(API_ENDPOINTS.performance.reviews.get(id));
    return data;
  },

  async setGoals(reviewId: string, goals: PerformanceGoal[]): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.performance.reviews.setGoals(reviewId), { goals });
    return data;
  },

  async submitReview(reviewId: string, payload: { rating: number; overallComment: string; strengths?: string; improvements?: string }): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.performance.reviews.submitSelfReview(reviewId), payload);
    return data;
  },

  async managerReview(reviewId: string, payload: { rating: number; overallComment: string; strengths?: string; improvements?: string }): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.patch(API_ENDPOINTS.performance.reviews.managerReview(reviewId), payload);
    return data;
  },

  async appeal(reviewId: string, reason: string): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.performance.reviews.appeal(reviewId), { reason });
    return data;
  },

  async resolveAppeal(reviewId: string, resolution: string, finalRating?: number): Promise<{ success: boolean; data: PerformanceReview; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.performance.reviews.resolveAppeal(reviewId), { resolution, finalRating });
    return data;
  },

  async requestFeedback(reviewId: string, fromEmployeeId: string): Promise<{ success: boolean; data: any; message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.performance.reviews.feedbackRequest(reviewId), { fromEmployeeId });
    return data;
  },
};
