import { useState, useMemo } from 'react';
import { Table, Button, Drawer, Descriptions, Tag, Empty, Skeleton } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { FilterOutlined, CloseOutlined } from '@ant-design/icons';
import { APP_CONSTANTS } from '../constants/app.constants';

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div style={{ padding: '0 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
                <Skeleton.Input active size="small" style={{ width: 80 + Math.random() * 40, height: 16 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                  <Skeleton.Input active size="small" style={{ width: 60 + Math.random() * 80, height: 16 }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span style={{ color: '#999' }}>—</span>;
  if (typeof value === 'boolean') return <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.join(', ') || <span style={{ color: '#999' }}>—</span>;
    const obj = value as Record<string, unknown>;
    if ('name' in obj && typeof obj.name === 'string') return obj.name;
    if ('label' in obj && typeof obj.label === 'string') return obj.label;
    return <pre style={{ margin: 0, fontSize: 12, maxHeight: 120, overflow: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 6 }}>{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
}

const SKIP_KEYS = new Set([
  'id', '_id', '__v', 'password', 'createdAt', 'updatedAt', 'createdBy',
  'refreshToken', 'refreshTokenHash', 'token', 'accessToken',
  'lastLogin', 'lastActivity', 'lastActivityAt',
  'twoFactorSecret', 'totpSecret', 'otpSecret', 'otp',
  'resetPasswordToken', 'emailVerificationToken', 'apiKey',
]);

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ');
}

interface DataTableProps<T extends object> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  rowKey?: string | keyof T | ((record: T, index?: number) => string);
  loading?: boolean;

  /** Pagination structured props (use these instead of `pagination`) */
  total?: number;
  page?: number;
  pageSize?: number;
  onPaginationChange?: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
  hidePagination?: boolean;

  /** Raw pagination config override (if set, takes precedence over structured props) */
  pagination?: TablePaginationConfig | false;

  scroll?: { x?: number | string; y?: number | string };

  onRowClick?: (record: T) => void;
  disableRowClick?: boolean;

  filterContent?: React.ReactNode;

  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;

  noCard?: boolean;
}

export function DataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  total,
  page,
  pageSize,
  onPaginationChange,
  showSizeChanger = true,
  pageSizeOptions,
  hidePagination = false,
  pagination: paginationProp,
  scroll,
  onRowClick,
  disableRowClick = false,
  filterContent,
  toolbarLeft,
  toolbarRight,
  noCard = false,
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const [detailRecord, setDetailRecord] = useState<T | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const hasFilterContent = !!filterContent;

  const paginationConfig: TablePaginationConfig | false = (() => {
    if (hidePagination) return false;
    if (paginationProp !== undefined) return paginationProp;
    if (total === undefined && page === undefined && pageSize === undefined) {
      return {
        showSizeChanger,
        showQuickJumper: false,
        defaultPageSize: APP_CONSTANTS.DEFAULT_PAGE_SIZE,
        pageSizeOptions: pageSizeOptions ?? APP_CONSTANTS.PAGE_SIZE_OPTIONS.map(String),
        showTotal: (t: number, r: [number, number]) => `${r[0]}–${r[1]} of ${t}`,
      };
    }
    return {
      current: page ?? 1,
      pageSize: pageSize ?? APP_CONSTANTS.DEFAULT_PAGE_SIZE,
      total: total ?? 0,
      showSizeChanger,
      showQuickJumper: false,
      pageSizeOptions: pageSizeOptions ?? APP_CONSTANTS.PAGE_SIZE_OPTIONS.map(String),
      onChange: onPaginationChange,
      showTotal: (t: number, r: [number, number]) => `${r[0]}–${r[1]} of ${t}`,
    };
  })();

  const detailEntries = useMemo(() => {
    if (!detailRecord) return [];
    return Object.entries(detailRecord as Record<string, unknown>).filter(
      ([key]) => !SKIP_KEYS.has(key)
    );
  }, [detailRecord]);

  const handleRowClick = (record: T) => {
    if (disableRowClick) return;
    if (onRowClick) {
      onRowClick(record);
    } else {
      setDetailRecord(record);
      setDetailOpen(true);
    }
  };

  const tableContent = loading && (!dataSource || dataSource.length === 0) ? (
    <TableSkeleton columns={columns.length || 5} rows={5} />
  ) : (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey ?? ('id' as string)}
      loading={loading}
      scroll={scroll ?? { x: 'max-content' }}
      style={{ fontSize: 14 }}
      pagination={paginationConfig}
      onRow={(record) => ({
        onClick: (event: React.MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.closest('.ant-btn, button, a, input, .ant-select, .ant-switch, .ant-checkbox, .ant-radio, .ant-tag')) return;
          handleRowClick(record);
        },
        style: { cursor: disableRowClick ? 'default' : 'pointer' },
      })}
      size="small"
    />
  );

  if (noCard) return tableContent;

  return (
    <>
      <div className="hrms-table-card">
        <div className="hrms-table-toolbar">
          <div className="hrms-table-toolbar-left">
            {toolbarLeft}
            {hasFilterContent && (
              <Button
                icon={showFilters ? <CloseOutlined /> : <FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
                size="small"
              >
                Filters
              </Button>
            )}
          </div>
          <div className="hrms-table-toolbar-right">
            {toolbarRight}
          </div>
        </div>

        {hasFilterContent && showFilters && (
          <div style={{
            padding: '12px 20px 4px',
            borderBottom: '1px solid var(--hrms-border-light)',
            background: '#fafafa',
          }}>
            {filterContent}
          </div>
        )}

        <div style={{ padding: '0 0 4px' }}>
          {tableContent}
        </div>
      </div>

      <Drawer
        title={detailRecord ? `Record Details` : ''}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={720}
        styles={{ body: { padding: 0 } }}
      >
        {detailRecord && (
          <div style={{ padding: 24 }}>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              bordered
              size="small"
              style={{ width: '100%' }}
            >
              {detailEntries.map(([key, value]) => {
                const isLong = typeof value === 'string' && value.length > 80;
                return (
                  <Descriptions.Item
                    key={key}
                    label={<span style={{ fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>{formatLabel(key)}</span>}
                    span={typeof value === 'object' && value !== null && !Array.isArray(value) ? 2 : isLong ? 2 : 1}
                  >
                    <div style={{ maxWidth: isLong ? 600 : undefined, wordBreak: 'break-word' }}>
                      {formatValue(value)}
                    </div>
                  </Descriptions.Item>
                );
              })}
            </Descriptions>
            {detailEntries.length === 0 && <Empty description="No details available" />}
          </div>
        )}
      </Drawer>
    </>
  );
}
