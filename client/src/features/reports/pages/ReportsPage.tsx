import { useState } from 'react';
import { Card, Select, Button, Space, message, DatePicker } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import apiClient from '../../../core/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Department, PaginatedResponse } from '../../departments/services/departmentService';

type DepartmentApiResponse = PaginatedResponse<Department>;

interface Filters {
  status: string | undefined;
  category: string | undefined;
  department: string | undefined;
}

export function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: undefined, category: undefined, department: undefined });
  const [attendanceMonth, setAttendanceMonth] = useState<dayjs.Dayjs>(dayjs());
  const [payrollMonth, setPayrollMonth] = useState<dayjs.Dayjs>(dayjs());

  const deptData = useQuery({
    queryKey: ['departments-report'],
    queryFn: async () => {
      const module = await import('../../departments/services/departmentService');
      return module.departmentService.list({ limit: 100 });
    },
    staleTime: 5 * 60 * 1000,
  }).data as DepartmentApiResponse | undefined;

  const handleExport = async (type: string) => {
    try {
      setLoading(type);
      let url = '';
      let filename = '';

      switch (type) {
        case 'employees':
          const params = new URLSearchParams();
          if (filters.status) params.append('status', filters.status);
          if (filters.category) params.append('category', filters.category);
          if (filters.department) params.append('department', filters.department);
          url = `/api/v1/reports/employees?${params.toString()}`;
          filename = 'employees';
          break;
        case 'attendance':
          url = `/api/v1/reports/attendance?month=${attendanceMonth.month() + 1}&year=${attendanceMonth.year()}`;
          filename = 'attendance';
          break;
        case 'payroll':
          url = `/api/v1/reports/payroll?month=${payrollMonth.format('YYYY-MM')}`;
          filename = 'payroll';
          break;
      }

      const response = await fetch(apiClient.getUri() + url, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();

      message.success(`${type} report exported successfully`);
    } catch {
      message.error('Failed to export report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export employee, attendance, and payroll data" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <Card
          hoverable
          title={<Space><FileExcelOutlined style={{ color: '#52c41a' }} /><span>Employee Export</span></Space>}
          styles={{ body: { padding: 20 } }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
              <Space wrap>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 120 }}
                  value={filters.status || undefined}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Terminated', value: 'terminated' },
                  ]}
                />
                <Select
                  placeholder="Category"
                  allowClear
                  style={{ width: 140 }}
                  value={filters.category || undefined}
                  onChange={(val) => setFilters({ ...filters, category: val })}
                  options={[
                    { label: 'Office Staff', value: 'staff' },
                    { label: 'Worker', value: 'worker' },
                  ]}
                />
                <Select
                  placeholder="Department"
                  allowClear
                  style={{ width: 140 }}
                  value={filters.department || undefined}
                  onChange={(val) => setFilters({ ...filters, department: val })}
                  options={(deptData as any)?.data?.map((d: any) => ({ label: d.name, value: d._id })) || []}
                />
              </Space>
            </div>
            <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'employees'} onClick={() => handleExport('employees')}>
              Export
            </Button>
          </Space>
        </Card>

        <Card
          hoverable
          title={<Space><FileExcelOutlined style={{ color: '#1890ff' }} /><span>Attendance Report</span></Space>}
          styles={{ body: { padding: 20 } }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>SELECT MONTH</span>
              <DatePicker.MonthPicker
                value={attendanceMonth}
                onChange={(val) => val && setAttendanceMonth(val)}
                allowClear={false}
                style={{ width: '100%' }}
              />
            </div>
            <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'attendance'} onClick={() => handleExport('attendance')}>
              Export
            </Button>
          </Space>
        </Card>

        <Card
          hoverable
          title={<Space><FileExcelOutlined style={{ color: '#722ed1' }} /><span>Payroll Report</span></Space>}
          styles={{ body: { padding: 20 } }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>SELECT MONTH</span>
              <DatePicker.MonthPicker
                value={payrollMonth}
                onChange={(val) => val && setPayrollMonth(val)}
                allowClear={false}
                style={{ width: '100%' }}
              />
            </div>
            <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'payroll'} onClick={() => handleExport('payroll')}>
              Export
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
