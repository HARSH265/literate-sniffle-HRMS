export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type SwapType = 'one-time' | 'recurring' | 'preference';

export interface ShiftSwapPopulated {
  _id: string;
  requestor: { _id: string; fullName: string; employeeCode: string };
  targetEmployee?: { _id: string; fullName: string; employeeCode: string };
  fromShift: { _id: string; name: string; startTime: string; endTime: string };
  toShift: { _id: string; name: string; startTime: string; endTime: string };
  fromDate: string;
  toDate: string;
  reason?: string;
  status: SwapStatus;
  approvedBy?: { _id: string; name: string; email: string };
  approvedAt?: string;
  rejectionReason?: string;
  isRecurring: boolean;
  recurringUntil?: string;
  swapType: SwapType;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftPreferencePopulated {
  _id: string;
  employee: string;
  preferredShift: { _id: string; name: string; startTime: string; endTime: string };
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestSwapPayload {
  targetEmployee?: string;
  fromShift: string;
  toShift: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  isRecurring?: boolean;
  recurringUntil?: string;
  swapType?: SwapType;
}

export interface SetPreferencePayload {
  preferredShift: string;
  effectiveFrom: string;
  effectiveTo?: string;
  priority?: number;
  reason?: string;
}

export interface SwapListParams {
  page?: number;
  limit?: number;
  status?: SwapStatus;
  fromDate?: string;
  toDate?: string;
}

export interface SwapEligibility {
  maxSwaps: number;
  usedSwaps: number;
  remainingSwaps: number;
  shiftSwapEnabled: boolean;
}

export interface ShiftSwapPaginatedResponse {
  success: boolean;
  message: string;
  data: ShiftSwapPopulated[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShiftSwapSingleResponse {
  success: boolean;
  message: string;
  data: ShiftSwapPopulated;
}
