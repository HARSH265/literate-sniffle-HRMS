import { useState } from 'react';
import { Card, Select, Button, Space, message, DatePicker } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import apiClient from '../../../core/api/apiClient';
import type { ExportTabProps } from '../types/reportTypes';

const { RangePicker } = DatePicker;

export function ExportTab({
  filters, setFilters,
  attendanceMonth, setAttendanceMonth,
  attendanceDept, setAttendanceDept,
  dateRange, setDateRange,
  payrollYear, setPayrollYear,
  payrollDept, setPayrollDept,
  overtimeMonth, setOvertimeMonth,
  overtimeDept, setOvertimeDept,
  deptData,
}: ExportTabProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    try {
      setLoading(type);
      let url = '';
      let filename = '';

      switch (type) {
        case 'employees': {
          const params = new URLSearchParams();
          if (filters.status) params.append('status', filters.status);
          if (filters.category) params.append('category', filters.category);
          if (filters.empDeptId) params.append('department', filters.empDeptId);
          url = `/reports/employees?${params.toString()}`;
          filename = 'employees';
          break;
        }
        case 'attendance': {
          const attParams = new URLSearchParams();
          if (dateRange) {
            attParams.append('startDate', dateRange[0].format('YYYY-MM-DD'));
            attParams.append('endDate', dateRange[1].format('YYYY-MM-DD'));
          } else {
            attParams.append('month', String(attendanceMonth.month() + 1));
            attParams.append('year', String(attendanceMonth.year()));
          }
          if (attendanceDept) attParams.append('department', attendanceDept);
          url = `/reports/attendance?${attParams.toString()}`;
          filename = 'attendance';
          break;
        }
        case 'payroll': {
          const payParams = new URLSearchParams();
          if (dateRange) {
            payParams.append('startDate', dateRange[0].format('YYYY-MM-DD'));
            payParams.append('endDate', dateRange[1].format('YYYY-MM-DD'));
          } else {
            payParams.append('year', String(payrollYear));
          }
          if (payrollDept) payParams.append('department', payrollDept);
          url = `/reports/payroll?${payParams.toString()}`;
          filename = 'payroll';
          break;
        }
        case 'overtime': {
          const otParams = new URLSearchParams();
          otParams.append('month', String(overtimeMonth.month() + 1));
          otParams.append('year', String(overtimeMonth.year()));
          if (overtimeDept) otParams.append('department', overtimeDept);
          url = `/reports/overtime?${otParams.toString()}`;
          filename = 'overtime';
          break;
        }
      }

      const response = await apiClient.get(url, { responseType: 'blob' });
      const blob = response.data;
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

  const deptOptions = deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'stretch' }}>
      {[
        {
          title: 'Employee Export', color: '#52c41a', loadingKey: 'employees',
          fields: (
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
              <Space wrap>
                <Select placeholder="Status" allowClear style={{ width: 120 }} value={filters.status || undefined} onChange={(val) => setFilters({ ...filters, status: val })} options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Terminated', value: 'terminated' }]} />
                <Select placeholder="Category" allowClear style={{ width: 140 }} value={filters.category || undefined} onChange={(val) => setFilters({ ...filters, category: val })} options={[{ label: 'Office Staff', value: 'staff' }, { label: 'Worker', value: 'worker' }]} />
              </Space>
              <div style={{ marginTop: 12 }}>
                <Select placeholder="Filter by Department (Optional)" allowClear style={{ width: '100%' }} value={filters.empDeptId} onChange={(val) => setFilters({ ...filters, empDeptId: val })} options={deptOptions} />
              </div>
            </div>
          ),
        },
        {
          title: 'Attendance Report', color: '#1890ff', loadingKey: 'attendance',
          fields: (
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select placeholder="Department" allowClear style={{ width: '100%' }} value={attendanceDept} onChange={setAttendanceDept} options={deptOptions} />
                <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [any, any] | null)} format="YYYY-MM-DD" placeholder={['Start Date', 'End Date']} style={{ width: '100%' }} />
                <DatePicker.MonthPicker value={attendanceMonth} onChange={(val) => val && setAttendanceMonth(val)} allowClear={false} format="YYYY-MM" style={{ width: '100%' }} />
              </Space>
            </div>
          ),
        },
        {
          title: 'Payroll Report', color: '#722ed1', loadingKey: 'payroll',
          fields: (
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select placeholder="Department" allowClear style={{ width: '100%' }} value={payrollDept} onChange={setPayrollDept} options={deptOptions} />
                <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [any, any] | null)} format="YYYY-MM-DD" placeholder={['Start Date', 'End Date']} style={{ width: '100%' }} />
                <Select value={payrollYear} onChange={setPayrollYear} style={{ width: '100%' }} placeholder="Select Year" options={[{ label: '2026', value: 2026 }, { label: '2025', value: 2025 }, { label: '2024', value: 2024 }]} />
              </Space>
            </div>
          ),
        },
        {
          title: 'Overtime Report', color: '#fa8c16', loadingKey: 'overtime',
          fields: (
            <div>
              <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select placeholder="Department" allowClear style={{ width: '100%' }} value={overtimeDept} onChange={setOvertimeDept} options={deptOptions} />
                <DatePicker.MonthPicker value={overtimeMonth} onChange={(val) => val && setOvertimeMonth(val)} allowClear={false} format="YYYY-MM" style={{ width: '100%' }} />
              </Space>
            </div>
          ),
        },
      ].map((card) => (
        <Card
          key={card.title}
          hoverable
          title={
            <Space>
              <FileExcelOutlined style={{ color: card.color }} />
              <span>{card.title}</span>
            </Space>
          }
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          styles={{
            body: {
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }
          }}
        >
          <div style={{ flex: 1, marginBottom: 16 }}>
            {card.fields}
          </div>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            block
            loading={loading === card.loadingKey}
            onClick={() => handleExport(card.loadingKey)}
            style={{ fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Export
          </Button>
        </Card>
      ))}
    </div>
  );
}
