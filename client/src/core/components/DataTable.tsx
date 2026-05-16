import { useState } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableProps } from 'antd';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';

interface DataTableProps {
  queryKey: readonly unknown[];
  queryFn: (params: Record<string, unknown>) => Promise<{ data: unknown[]; meta: { total: number } }>;
  columns: TableProps<Record<string, unknown>>['columns'];
}

export function DataTable({
  queryKey,
  queryFn,
  columns,
}: DataTableProps) {
  const { page, limit, paginationConfig } = usePagination();
  const [search] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit };
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    return params;
  }, [page, limit, debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, queryParams],
    queryFn: () => queryFn(queryParams),
    staleTime: 60000,
  });

  const tableData = (data?.data || []) as Record<string, unknown>[];
  const total = data?.meta?.total || 0;

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      loading={isLoading}
      rowKey="id"
      pagination={{
        ...paginationConfig,
        total,
      }}
    />
  );
}