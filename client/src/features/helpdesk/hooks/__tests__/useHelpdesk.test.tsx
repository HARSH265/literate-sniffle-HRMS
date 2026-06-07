import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTickets, useTicket, useCreateTicket, useUpdateTicket, useAddComment, useDeleteTicket } from '../useHelpdesk';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const mockTicket = {
  _id: '1',
  ticketId: 'TKT-0001',
  subject: 'Keyboard not working',
  description: 'Broken keyboard',
  category: 'it',
  priority: 'high',
  status: 'open',
  requestedBy: { _id: 'u1', name: 'John', email: 'john@test.com' },
  comments: [],
  createdAt: '2024-01-15T00:00:00Z',
  isActive: true,
};

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('useTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tickets list', async () => {
    const response = { success: true, data: [mockTicket], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
    mockApi.get.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useTickets({ page: 1 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApi.get).toHaveBeenCalledWith('/helpdesk', { params: { page: 1 } });
  });
});

describe('useTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single ticket by id', async () => {
    const response = { success: true, data: mockTicket };
    mockApi.get.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useTicket('1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(mockApi.get).toHaveBeenCalledWith('/helpdesk/1');
  });

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => useTicket(''), { wrapper: createWrapper() });

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls create ticket API', async () => {
    const response = { success: true, data: mockTicket, message: 'Ticket created' };
    mockApi.post.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useCreateTicket(), { wrapper: createWrapper() });

    result.current.mutate({ subject: 'Keyboard not working', description: 'Broken' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/helpdesk', { subject: 'Keyboard not working', description: 'Broken' });
  });
});

describe('useUpdateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls update ticket API', async () => {
    const response = { success: true, data: { ...mockTicket, priority: 'urgent' }, message: 'Ticket updated' };
    mockApi.put.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useUpdateTicket(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', payload: { priority: 'urgent' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.put).toHaveBeenCalledWith('/helpdesk/1', { priority: 'urgent' });
  });
});

describe('useAddComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls add comment API', async () => {
    const response = { success: true, data: mockTicket, message: 'Comment added' };
    mockApi.post.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useAddComment(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', payload: { message: 'Working on it' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.post).toHaveBeenCalledWith('/helpdesk/1/comments', { message: 'Working on it' });
  });
});

describe('useDeleteTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls delete ticket API', async () => {
    const response = { success: true, message: 'Ticket deleted' };
    mockApi.delete.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useDeleteTicket(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.delete).toHaveBeenCalledWith('/helpdesk/1');
  });
});
