import { useState } from 'react';
import { Card, Select, Button, Space, message, DatePicker, Table, Row, Col, Statistic, Tabs, Modal, Input, Radio } from 'antd';
import { DownloadOutlined, FileExcelOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined, FilterOutlined, EyeOutlined, ZoomInOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import apiClient from '../../../core/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { RangePicker } = DatePicker;

const COLORS = ['#3f8600', '#cf1322', '#faad14', '#1890ff', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96'];
const PIE_COLORS = ['#3f8600', '#cf1322', '#faad14', '#1890ff', '#722ed1'];

const AVAILABLE_FIELDS = [
  { label: 'Employee Code', value: 'employeeCode' },
  { label: 'Full Name', value: 'fullName' },
  { label: "Father's Name", value: 'fatherName' },
  { label: 'Category', value: 'category' },
  { label: 'Employment Type', value: 'employmentType' },
  { label: 'Salary Type', value: 'salaryType' },
  { label: 'Base Salary', value: 'baseSalary' },
  { label: 'Daily Wage', value: 'dailyWage' },
  { label: 'Status', value: 'status' },
  { label: 'Department', value: 'department' },
  { label: 'Designation', value: 'designation' },
  { label: 'Shift', value: 'shift' },
  { label: 'Joining Date', value: 'joiningDate' },
  { label: 'Contact Number', value: 'contactNumber' },
];

export function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status: string | undefined; category: string | undefined; empDeptId: string | undefined }>({ status: undefined, category: undefined, empDeptId: undefined });
  const [attendanceMonth, setAttendanceMonth] = useState<dayjs.Dayjs>(dayjs());
  const [attendanceDept, setAttendanceDept] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [payrollYear, setPayrollYear] = useState<number>(dayjs().year());
  const [payrollDept, setPayrollDept] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('export');
  const [overtimeMonth, setOvertimeMonth] = useState<dayjs.Dayjs>(dayjs());
  const [overtimeDept, setOvertimeDept] = useState<string | undefined>(undefined);

  const [selectedFields, setSelectedFields] = useState<string[]>(['fullName', 'employeeCode', 'department', 'status']);
  const [customFilters, setCustomFilters] = useState<Record<string, any>>({});
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [customResult, setCustomResult] = useState<any>(null);
  const [customLoading, setCustomLoading] = useState(false);

  const [chartType, setChartType] = useState<'attendance' | 'payroll' | 'department' | 'leave'>('attendance');
  const [chartGroupBy, setChartGroupBy] = useState<'month' | 'department' | 'category' | 'status' | undefined>('month');
  const [chartPeriod, setChartPeriod] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(11, 'month'), dayjs()]);

  const [drillDownVisible, setDrillDownVisible] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

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

  const { data: chartData } = useQuery({
    queryKey: ['chart-data', chartType, chartGroupBy, chartPeriod[0]?.format('YYYY-MM-DD'), chartPeriod[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('chartType', chartType);
      if (chartGroupBy) params.append('groupBy', chartGroupBy);
      params.append('period[start]', chartPeriod[0].format('YYYY-MM-DD'));
      params.append('period[end]', chartPeriod[1].format('YYYY-MM-DD'));
      const res = await fetch(`${apiClient.getUri()}/reports/chart-data?${params.toString()}`, { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'charts',
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

  const handleBuildCustomReport = async () => {
    try {
      setCustomLoading(true);
      const response = await fetch(`${apiClient.getUri()}/reports/custom`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: selectedFields,
          filters: customFilters,
          groupBy: groupBy || undefined,
          limit: 500,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCustomResult(result.data);
        message.success(`Report generated: ${result.data.total} records`);
      } else {
        message.error(result.message || 'Failed to generate report');
      }
    } catch {
      message.error('Failed to generate custom report');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleDrillDown = async (entity: string, id?: string, filters?: Record<string, any>) => {
    try {
      setDrillDownLoading(true);
      const params = new URLSearchParams();
      params.append('entity', entity);
      if (id) params.append('id', id);
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => params.append(`filters[${k}]`, String(v)));
      }
      const res = await fetch(`${apiClient.getUri()}/reports/drill-down?${params.toString()}`, { credentials: 'include' });
      const result = await res.json();
      if (result.success) {
        setDrillDownData({ entity, ...result.data });
        setDrillDownVisible(true);
      }
    } catch {
      message.error('Failed to load drill-down data');
    } finally {
      setDrillDownLoading(false);
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

  const renderChart = () => {
    if (!chartData?.data?.data) return <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No chart data available</div>;

    const data = chartData.data.data;
    const chartTypeData = chartData.data;

    if (chartType === 'attendance' && !chartTypeData.groupBy) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`}>
              {data.map((_: any, idx: number) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'attendance' && chartTypeData.groupBy === 'month') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#3f8600" name="Present" />
            <Bar dataKey="absent" fill="#cf1322" name="Absent" />
            <Bar dataKey="halfDay" fill="#faad14" name="Half Day" />
            <Bar dataKey="leave" fill="#1890ff" name="Leave" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'attendance' && chartTypeData.groupBy === 'department') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#3f8600" name="Present" />
            <Bar dataKey="absent" fill="#cf1322" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'payroll') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v: any) => `₹${(v || 0).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="gross" fill="#1890ff" name="Gross" />
            <Bar dataKey="deductions" fill="#faad14" name="Deductions" />
            <Bar dataKey="net" fill="#3f8600" name="Net Pay" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'department') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#1890ff" name="Total Employees" />
            <Bar dataKey="workers" fill="#3f8600" name="Workers" />
            <Bar dataKey="officeStaff" fill="#722ed1" name="Office Staff" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'leave') {
      const byType = chartTypeData.byType || [];
      const byStatus = chartTypeData.byStatus || [];
      return (
        <Row gutter={24}>
          <Col span={12}>
            <h4 style={{ textAlign: 'center', marginBottom: 16 }}>Leave by Type</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byType} dataKey="days" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, days }: any) => `${name}: ${days}`}>
                  {byType.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Col>
          <Col span={12}>
            <h4 style={{ textAlign: 'center', marginBottom: 16 }}>Leave by Status</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, count }: any) => `${name}: ${count}`}>
                  {byStatus.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Col>
        </Row>
      );
    }

    return null;
  };

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

      <Card title="Attendance by Department" style={{ marginBottom: 24 }}
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('attendance', undefined, { department: attendanceDept })} loading={drillDownLoading}>Drill Down</Button>}>
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
          onRow={(record: any) => ({ onClick: () => handleDrillDown('attendance', undefined, { department: record.name }), style: { cursor: 'pointer' } })}
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

      <Card title="Monthly Payroll Trend"
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('payroll')} loading={drillDownLoading}>Drill Down</Button>}>
        <Table
          dataSource={payrollSummary?.data?.monthlyData || []}
          columns={[
            { title: 'Month', dataIndex: 'month', key: 'month' },
            { title: 'Employees', dataIndex: 'employees', key: 'employees' },
            { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Deductions', dataIndex: 'deductions', key: 'deductions', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v: number) => <b>₹{v.toLocaleString()}</b> },
          ]}
          onRow={(record: any) => ({ onClick: () => handleDrillDown('payroll', record.month), style: { cursor: 'pointer' } })}
          rowKey="month"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title="Department Overview" style={{ marginTop: 24 }}
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('department')} loading={drillDownLoading}>View Details</Button>}>
        <Table
          dataSource={deptSummary?.data?.departments || []}
          columns={deptColumns}
          onRow={(record: any) => ({ onClick: () => handleDrillDown('department', record.name), style: { cursor: 'pointer' } })}
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

  const CustomReportTab = () => (
    <div>
      <Card title={<Space><FilterOutlined /> Custom Report Builder</Space>} style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={24} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Fields</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select fields to include"
              value={selectedFields}
              onChange={setSelectedFields}
              options={AVAILABLE_FIELDS}
            />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Status Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Statuses" value={customFilters.status} onChange={(v) => setCustomFilters({ ...customFilters, status: v })} options={[
              { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Terminated', value: 'terminated' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Category Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Categories" value={customFilters.category} onChange={(v) => setCustomFilters({ ...customFilters, category: v })} options={[
              { label: 'Worker', value: 'worker' }, { label: 'Office Staff', value: 'office-staff' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Department Filter</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Departments" value={customFilters.department} onChange={(v) => setCustomFilters({ ...customFilters, department: v })} options={deptData.data?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Employment Type</label>
            <Select allowClear style={{ width: '100%' }} placeholder="All Types" value={customFilters.employmentType} onChange={(v) => setCustomFilters({ ...customFilters, employmentType: v })} options={[
              { label: 'Permanent', value: 'permanent' }, { label: 'Contract', value: 'contract' }, { label: 'Temporary', value: 'temporary' }, { label: 'Trainee', value: 'trainee' },
            ]} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Search</label>
            <Input placeholder="Search by name or code" value={customFilters.search} onChange={(e) => setCustomFilters({ ...customFilters, search: e.target.value })} />
          </Col>
          <Col span={8} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Group By</label>
            <Select allowClear style={{ width: '100%' }} placeholder="No grouping" value={groupBy} onChange={setGroupBy} options={AVAILABLE_FIELDS} />
          </Col>
        </Row>
        <Button type="primary" icon={<EyeOutlined />} onClick={handleBuildCustomReport} loading={customLoading}>
          Generate Report
        </Button>
      </Card>

      {customResult && (
        <Card title={<Space><BarChartOutlined /> Results ({customResult.total} records{customResult.groupBy ? ` grouped by ${customResult.groupBy}` : ''})</Space>}>
          {customResult.groupBy ? (
            <Table
              dataSource={customResult.data}
              columns={[
                { title: 'Group', dataIndex: 'group', key: 'group' },
                { title: 'Count', dataIndex: 'count', key: 'count' },
              ]}
              expandable={{
                expandedRowRender: (record: any) => (
                  <Table
                    dataSource={record.items}
                    columns={customResult.fields.map((f: string) => ({ title: f, dataIndex: f, key: f, render: (v: any) => v ?? '-' }))}
                    rowKey={(_, idx) => String(idx)}
                    size="small"
                    pagination={false}
                  />
                ),
                rowExpandable: () => true,
              }}
              rowKey="group"
              size="small"
              pagination={false}
            />
          ) : (
            <Table
              dataSource={customResult.data}
              columns={customResult.fields.map((f: string) => ({ title: f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()), dataIndex: f, key: f, render: (v: any) => v ?? '-' }))}
              rowKey={(_, idx) => String(idx)}
              size="small"
              pagination={{ pageSize: 50, showSizeChanger: true }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      )}
    </div>
  );

  const ChartsTab = () => (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Chart Type</label>
            <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <Radio.Button value="attendance"><BarChartOutlined /> Attendance</Radio.Button>
              <Radio.Button value="payroll"><LineChartOutlined /> Payroll</Radio.Button>
              <Radio.Button value="department"><PieChartOutlined /> Department</Radio.Button>
              <Radio.Button value="leave">Leave</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Group By</label>
            <Select style={{ width: '100%' }} value={chartGroupBy} onChange={setChartGroupBy}>
              <Select.Option value="month">By Month</Select.Option>
              <Select.Option value="department">By Department</Select.Option>
              <Select.Option value={undefined}>Summary</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Period</label>
            <RangePicker value={chartPeriod} onChange={(dates) => dates && setChartPeriod(dates as [dayjs.Dayjs, dayjs.Dayjs])} />
          </Col>
        </Row>
      </Card>

      <Card>
        {renderChart()}
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export data, view interactive charts, and build custom reports" />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'export', label: <span><DownloadOutlined /> Export</span> },
        { key: 'summary', label: <span><BarChartOutlined /> Summary</span> },
        { key: 'custom', label: <span><FilterOutlined /> Custom Report</span> },
        { key: 'charts', label: <span><PieChartOutlined /> Charts</span> },
      ]} />
      {activeTab === 'export' && <ExportTab />}
      {activeTab === 'summary' && <SummaryTab />}
      {activeTab === 'custom' && <CustomReportTab />}
      {activeTab === 'charts' && <ChartsTab />}

      <Modal
        title={`Drill Down: ${drillDownData?.entity || ''}`}
        open={drillDownVisible}
        onCancel={() => setDrillDownVisible(false)}
        footer={null}
        width={800}
      >
        {drillDownData?.records?.length > 0 ? (
          <Table
            dataSource={drillDownData.records}
            columns={drillDownData.records[0] ? Object.keys(drillDownData.records[0]).filter(k => k !== '_id' && k !== '__v').map(k => ({
              title: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
              dataIndex: k,
              key: k,
              render: (v: any) => {
                if (v && typeof v === 'object' && v.fullName) return v.fullName;
                if (v && typeof v === 'object' && v.name) return v.name;
                return v != null ? String(v) : '-';
              },
            })) : []}
            rowKey={(_, idx) => String(idx)}
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>No records found</div>
        )}
      </Modal>
    </div>
  );
}