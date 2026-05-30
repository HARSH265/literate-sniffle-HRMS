import { memo, useMemo } from 'react';
import { Button, Table, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { MonthlyAttendanceView } from '../services/attendanceService';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
  present: 'success',
  absent: 'error',
  'half-day': 'warning',
  leave: 'processing',
  'weekly-off': 'default',
  holiday: 'purple',
};

interface MonthlyViewProps {
  selectedMonth: dayjs.Dayjs;
  monthlyData: MonthlyAttendanceView[] | undefined;
  monthlyLoading: boolean;
  onMonthChange: (month: dayjs.Dayjs) => void;
}

export const MonthlyView = memo(function MonthlyView({ selectedMonth, monthlyData, monthlyLoading, onMonthChange }: MonthlyViewProps) {
  const daysInMonth = selectedMonth.daysInMonth();
  const dayHeaders = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const monthlyColumns: ColumnsType<MonthlyAttendanceView> = useMemo(() => [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left',
      width: 180,
      render: (_: unknown, record: MonthlyAttendanceView) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.employee?.fullName}</div>
          <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{record.employee?.employeeCode}</div>
        </div>
      ),
    },
    ...dayHeaders.map((day) => ({
      title: String(day),
      key: `day-${day}`,
      width: 45,
      align: 'center' as const,
      render: (_: unknown, record: MonthlyAttendanceView) => {
        const dayData = record.days?.[day];
        if (!dayData) return <span style={{ color: '#ccc' }}>-</span>;
        return (
          <Badge
            color={STATUS_COLORS[dayData.status] || 'default'}
            text=""
            style={{ fontSize: 8 }}
          />
        );
      },
    })),
  ], [dayHeaders]);

  return (
    <div className="hrms-table-card">
      <div className="hrms-table-toolbar">
        <div className="hrms-table-toolbar-left" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            icon={<LeftOutlined />}
            size="small"
            onClick={() => onMonthChange(selectedMonth.subtract(1, 'month'))}
          />
          <span style={{ fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
            {selectedMonth.format('MMMM YYYY')}
          </span>
          <Button
            icon={<RightOutlined />}
            size="small"
            onClick={() => onMonthChange(selectedMonth.add(1, 'month'))}
            disabled={selectedMonth.isAfter(dayjs(), 'month')}
          />
        </div>
        <div className="hrms-table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>
            {monthlyData?.length ?? 0} employees
          </span>
        </div>
      </div>
      <Table
        columns={monthlyColumns}
        dataSource={monthlyData}
        rowKey={(record) => record.employee?.id || ''}
        loading={monthlyLoading}
        scroll={{ x: daysInMonth * 45 + 180 }}
        size="small"
        pagination={false}
      />
    </div>
  );
});
