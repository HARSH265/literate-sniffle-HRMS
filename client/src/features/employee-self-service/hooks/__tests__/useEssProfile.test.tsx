import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEssProfile, useUpdateProfile, useChangeRequests, useEssStats, useCreateChangeRequest } from '../useEssProfile';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...(actual as any),
    message: { success: vi.fn(), error: vi.fn() },
  };
});

import apiClient from '../../../../core/api/apiClient';
const mockApi = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const mockProfile = {
  success: true,
  data: {
    id: 'emp1',
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    fatherName: 'Robert Doe',
    department: { id: 'dept1', name: 'Engineering' },
    designation: { id: 'desig1', name: 'Software Engineer' },
    shift: { id: 'shift1', name: 'Morning' },
    joiningDate: '2023-01-15',
    contactNumber: '1234567890',
    editableFields: ['contactNumber', 'address'],
  },
};

const mockChangeRequests = {
  success: true,
  data: [
    { id: 'cr1', field: 'contactNumber', oldValue: '123', newValue: '456', status: 'pending', createdAt: '2024-01-01' },
  ],
  meta: { total: 1 },
};

const mockStats = {
  success: true,
  data: { pending: 2, approved: 5, rejected: 1, total: 8 },
};

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useEssProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches profile data', async () => {
    mockApi.get.mockResolvedValue({ data: mockProfile });

    const { result } = renderHook(() => useEssProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfile);
    expect(mockApi.get).toHaveBeenCalledWith('/ess/profile');
  });

  it('handles profile fetch error', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEssProfile(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useChangeRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches change requests', async () => {
    mockApi.get.mockResolvedValue({ data: mockChangeRequests });

    const { result } = renderHook(() => useChangeRequests(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockChangeRequests);
    expect(mockApi.get).toHaveBeenCalledWith('/ess/change-requests', { params: undefined });
  });

  it('fetches change requests with params', async () => {
    mockApi.get.mockResolvedValue({ data: mockChangeRequests });

    const { result } = renderHook(() => useChangeRequests({ status: 'pending' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.get).toHaveBeenCalledWith('/ess/change-requests', { params: { status: 'pending' } });
  });
});

describe('useEssStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches stats', async () => {
    mockApi.get.mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() => useEssStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStats);
    expect(mockApi.get).toHaveBeenCalledWith('/ess/stats');
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls update profile API', async () => {
    mockApi.put.mockResolvedValue({ data: { success: true, data: { message: 'Profile updated' } } });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.mutate({ contactNumber: '9999999999' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.put).toHaveBeenCalledWith('/ess/profile', { contactNumber: '9999999999' });
  });
});

describe('useCreateChangeRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls create change request API', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true, data: { message: 'Submitted', requestId: 'cr-new' } } });

    const { result } = renderHook(() => useCreateChangeRequest(), { wrapper: createWrapper() });

    result.current.mutate({ field: 'address', newValue: 'New Address', notes: 'Please update' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/ess/change-requests', { field: 'address', newValue: 'New Address', notes: 'Please update' });
  });
});
