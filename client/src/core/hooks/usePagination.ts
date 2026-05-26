import { useState, useCallback } from 'react';

export function usePagination(defaultPage = 1, defaultLimit = 10) {
  const [page, setPage] = useState(defaultPage);
  const [limit, setLimit] = useState(defaultLimit);

  const reset = useCallback(() => {
    setPage(defaultPage);
    setLimit(defaultLimit);
  }, [defaultPage, defaultLimit]);

  const paginationConfig = {
    current: page,
    pageSize: limit,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: (newPage: number, newLimit: number) => {
      if (newPage !== page) setPage(newPage);
      if (newLimit !== limit) setLimit(newLimit);
    },
  };

  return {
    page,
    limit,
    setPage,
    setLimit,
    reset,
    paginationConfig,
  };
}

export default usePagination;