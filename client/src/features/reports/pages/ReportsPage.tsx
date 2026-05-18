import { useState } from 'react';
import { Card, Select, Button, Space, message, DatePicker, Table, Row, Col, Statistic, Tabs } from 'antd';
import { DownloadOutlined, FileExcelOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import apiClient from '../../../core/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Filters {
  status: string | undefined;
  category: string | undefined;
  empDeptId: string | undefined;
}

export function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: undefined, category: undefined, empDeptId: undefined });
  const [attendanceMonth, setAttendanceMonth] = useState<dayjs.Dayjs>(dayjs());
  const [attendanceDept, setAttendanceDept] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [payrollYear, setPayrollYear] = useState<number>(dayjs().year());
  const [payrollDept, setPayrollDept] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('export');
  const [overtimeMonth, setOvertimeMonth] = useState<dayjs.Dayjs>(dayjs());
  const [overtimeDept, setOvertimeDept] = useState<string | undefined>(undefined);

  const deptData = useQuery({
    queryKey: ['departments-report'],
    queryFn: async () => {
      const module = await import('../../departments/services/departmentService');
      return module.departmentService.list({ limit: 100 });
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['attendance-summary', dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD'), attendanceDept],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        params.append('month', String(attendanceMonth.month() + 1));
        params.append('year', String(attendanceMonth.year()));
      }
      if (attendanceDept) params.append('department', attendanceDept);
      const res = await fetch(`${apiClient.getUri()}/reports/attendance/summary?${params.toString()}`, { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'summary',
  });

  const { data: payrollSummary } = useQuery({
    queryKey: ['payroll-summary', payrollYear, payrollDept],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', String(payrollYear));
      if (payrollDept) params.append('department', payrollDept);
      const res = await fetch(`${apiClient.getUri()}/reports/payroll/summary?${params.toString()}`, { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'summary',
  });

  const { data: deptSummary } = useQuery({
    queryKey: ['department-summary'],
    queryFn: async () => {
      const res = await fetch(`${apiClient.getUri()}/reports/departments`, { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'summary',
  });

  const { data: overtimeSummary } = useQuery({
    queryKey: ['overtime-summary', overtimeMonth.month() + 1, overtimeMonth.year(), overtimeDept],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('month', String(overtimeMonth.month() + 1));
      params.append('year', String(overtimeMonth.year()));
      if (overtimeDept) params.append('department', overtimeDept);
      const res = await fetch(`${apiClient.getUri()}/reports/overtime/summary?${params.toString()}`, { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'summary',
  });

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
          if (filters.empDeptId) params.append('department', filters.empDeptId);
          url = `/reports/employees?${params.toString()}`;
          filename = 'employees';
          break;
        case 'attendance':
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
        case 'payroll':
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
        case 'overtime':
          const otParams = new URLSearchParams();
          otParams.append('month', String(overtimeMonth.month() + 1));
          otParams.append('year', String(overtimeMonth.year()));
          if (overtimeDept) otParams.append('department', overtimeDept);
          url = `/reports/overtime?${otParams.toString()}`;
          filename = 'overtime';
          break;
      }

      const response = await fetch(apiClient.getUri() + url, { credentials: 'include' });
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

  const deptColumns = [
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'Total', dataIndex: 'totalEmployees', key: 'totalEmployees' },
    { title: 'Workers', dataIndex: 'workers', key: 'workers' },
    { title: 'Office Staff', dataIndex: 'officeStaff', key: 'officeStaff' },
    { title: 'Monthly', dataIndex: 'monthlySalary', key: 'monthlySalary' },
    { title: 'Daily Wage', dataIndex: 'dailyWage', key: 'dailyWage' },
  ];

  const SummaryTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Employees" 
              value={attendanceSummary?.data?.stats?.totalEmployees || 0} 
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Present" 
              value={attendanceSummary?.data?.stats?.totalPresent || 0} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Absent" 
              value={attendanceSummary?.data?.stats?.totalAbsent || 0} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Attendance by Department" style={{ marginBottom: 24 }}>
        <Table 
          dataSource={Object.entries(attendanceSummary?.data?.stats?.byDepartment || {}).map(([name, data]: any) => ({ name, ...data }))}
          columns={[
            { title: 'Department', dataIndex: 'name', key: 'name' },
            { title: 'Employees', dataIndex: 'employees', key: 'employees' },
            { title: 'Present', dataIndex: 'present', key: 'present' },
            { title: 'Absent', dataIndex: 'absent', key: 'absent' },
            { title: 'Half Day', dataIndex: 'halfDay', key: 'halfDay' },
            { title: 'Leave', dataIndex: 'leave', key: 'leave' },
          ]}
          rowKey="name"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title="Payroll Summary (YTD)" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="Total Gross" value={payrollSummary?.data?.ytd?.totalGross || 0} prefix="₹" />
          </Col>
          <Col span={8}>
            <Statistic title="Total Deductions" value={payrollSummary?.data?.ytd?.totalDeductions || 0} prefix="₹" />
          </Col>
          <Col span={8}>
            <Statistic title="Total Net Pay" value={payrollSummary?.data?.ytd?.totalNet || 0} prefix="₹" valueStyle={{ color: '#3f8600' }} />
          </Col>
        </Row>
      </Card>

      <Card title="Monthly Payroll Trend">
        <Table 
          dataSource={payrollSummary?.data?.monthlyData || []}
          columns={[
            { title: 'Month', dataIndex: 'month', key: 'month' },
            { title: 'Employees', dataIndex: 'employees', key: 'employees' },
            { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Deductions', dataIndex: 'deductions', key: 'deductions', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v: number) => <b>₹{v.toLocaleString()}</b> },
          ]}
          rowKey="month"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title="Department Overview" style={{ marginTop: 24 }}>
        <Table 
          dataSource={deptSummary?.data?.departments || []}
          columns={deptColumns}
          rowKey="name"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title="Overtime Summary" style={{ marginTop: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="Employees with OT" value={overtimeSummary?.data?.stats?.totalEmployeesWithOT || 0} />
          </Col>
          <Col span={6}>
            <Statistic title="Total OT Hours" value={overtimeSummary?.data?.stats?.totalOvertimeHours || 0} suffix="hrs" />
          </Col>
          <Col span={6}>
            <Statistic title="Total Entries" value={overtimeSummary?.data?.stats?.totalEntries || 0} />
          </Col>
          <Col span={6}>
            <Select 
              placeholder="Month" 
              style={{ width: '100%', marginTop: 20 }} 
              value={overtimeMonth.month() + 1} 
              onChange={(val) => setOvertimeMonth(overtimeMonth.month(val - 1))}
              options={Array.from({ length: 12 }, (_, i) => ({ label: dayjs().month(i).format('MMMM'), value: i + 1 }))}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <h4 style={{ marginBottom: 8 }}>By Employee</h4>
            <Table 
              dataSource={Object.values(overtimeSummary?.data?.stats?.byEmployee || {}).slice(0, 10)}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Code', dataIndex: 'code', key: 'code' },
                { title: 'Hours', dataIndex: 'totalHours', key: 'totalHours', render: (v: number) => `${v}h` },
                { title: 'Entries', dataIndex: 'entries', key: 'entries' },
              ]}
              rowKey="code"
              size="small"
              pagination={false}
            />
          </Col>
          <Col span={12}>
            <h4 style={{ marginBottom: 8 }}>Rule Usage</h4>
            <Table 
              dataSource={Object.entries(overtimeSummary?.data?.stats?.ruleUsage || {}).map(([name, hours]: any) => ({ name, hours }))}
              columns={[
                { title: 'Rule', dataIndex: 'name', key: 'name' },
                { title: 'Total Hours', dataIndex: 'hours', key: 'hours', render: (v: number) => `${v}h` },
              ]}
              rowKey="name"
              size="small"
              pagination={false}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );

  const ExportTab = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
      <Card hoverable title={<Space><FileExcelOutlined style={{ color: '#52c41a' }} /><span>Employee Export</span></Space>} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
            <Space wrap>
              <Select placeholder="Status" allowClear style={{ width: 120 }} value={filters.status || undefined} onChange={(val) => setFilters({ ...filters, status: val })} options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Terminated', value: 'terminated' }]} />
              <Select placeholder="Category" allowClear style={{ width: 140 }} value={filters.category || undefined} onChange={(val) => setFilters({ ...filters, category: val })} options={[{ label: 'Office Staff', value: 'staff' }, { label: 'Worker', value: 'worker' }]} />
            </Space>
            <div style={{ marginTop: 12 }}>
              <Select 
                placeholder="Filter by Department (Optional)" 
                allowClear 
                style={{ width: 220 }} 
                value={filters.empDeptId} 
                onChange={(val) => setFilters({ ...filters, empDeptId: val })}
                options={deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []}
              />
            </div>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'employees'} onClick={() => handleExport('employees')}>Export</Button>
        </Space>
      </Card>

      <Card hoverable title={<Space><FileExcelOutlined style={{ color: '#1890ff' }} /><span>Attendance Report</span></Space>} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select placeholder="Department" allowClear style={{ width: '100%' }} value={attendanceDept} onChange={setAttendanceDept} options={deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []} />
              <RangePicker 
                value={dateRange} 
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} 
                placeholder={['Start Date', 'End Date']}
              />
              <DatePicker.MonthPicker value={attendanceMonth} onChange={(val) => val && setAttendanceMonth(val)} allowClear={false} style={{ width: '100%' }} />
            </Space>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'attendance'} onClick={() => handleExport('attendance')}>Export</Button>
        </Space>
      </Card>

      <Card hoverable title={<Space><FileExcelOutlined style={{ color: '#722ed1' }} /><span>Payroll Report</span></Space>} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select placeholder="Department" allowClear style={{ width: '100%' }} value={payrollDept} onChange={setPayrollDept} options={deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []} />
              <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} placeholder={['Start Date', 'End Date']} />
              <Select value={payrollYear} onChange={setPayrollYear} style={{ width: '100%' }} placeholder="Select Year" options={[{ label: '2026', value: 2026 }, { label: '2025', value: 2025 }, { label: '2024', value: 2024 }]} />
            </Space>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'payroll'} onClick={() => handleExport('payroll')}>Export</Button>
        </Space>
      </Card>

      <Card hoverable title={<Space><FileExcelOutlined style={{ color: '#fa8c16' }} /><span>Overtime Report</span></Space>} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <span style={{ color: '#888', fontSize: 12, display: 'block', marginBottom: 8 }}>FILTERS</span>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select placeholder="Department" allowClear style={{ width: '100%' }} value={overtimeDept} onChange={setOvertimeDept} options={deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []} />
              <DatePicker.MonthPicker value={overtimeMonth} onChange={(val) => val && setOvertimeMonth(val)} allowClear={false} style={{ width: '100%' }} />
            </Space>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} block loading={loading === 'overtime'} onClick={() => handleExport('overtime')}>Export</Button>
        </Space>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export data and view interactive summaries" />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[{ key: 'export', label: <span><DownloadOutlined /> Export</span> }, { key: 'summary', label: <span><BarChartOutlined /> Summary</span> }]} />
      {activeTab === 'export' ? <ExportTab /> : <SummaryTab />}
    </div>
  );
}