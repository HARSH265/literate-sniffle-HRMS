import { Card, Button, Select, Row, Col, Statistic } from 'antd';
import { ZoomInOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { DataTable } from '../../../core/components/DataTable';
import apiClient from '../../../core/api/apiClient';
import type { SummaryTabProps } from '../types/reportTypes';

export function SummaryTab({
  attendanceMonth, dateRange, attendanceDept,
  payrollYear, payrollDept,
  overtimeMonth, overtimeDept, setOvertimeMonth,
  handleDrillDown, drillDownLoading,
}: SummaryTabProps) {
  const { data: attendanceSummary, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-summary', dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD'), attendanceDept],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      } else {
        params.month = String(attendanceMonth.month() + 1);
        params.year = String(attendanceMonth.year());
      }
      if (attendanceDept) params.department = attendanceDept;
      const res = await apiClient.get('/reports/attendance/summary', { params });
      return res.data;
    },
  });

  const { data: payrollSummary, isLoading: payLoading } = useQuery({
    queryKey: ['payroll-summary', payrollYear, payrollDept],
    queryFn: async () => {
      const params: Record<string, string> = { year: String(payrollYear) };
      if (payrollDept) params.department = payrollDept;
      const res = await apiClient.get('/reports/payroll/summary', { params });
      return res.data;
    },
  });

  const { data: deptSummary, isLoading: deptLoading } = useQuery({
    queryKey: ['department-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/departments');
      return res.data;
    },
  });

  const { data: overtimeSummary, isLoading: otLoading } = useQuery({
    queryKey: ['overtime-summary', overtimeMonth.month() + 1, overtimeMonth.year(), overtimeDept],
    queryFn: async () => {
      const params: Record<string, string> = {
        month: String(overtimeMonth.month() + 1),
        year: String(overtimeMonth.year()),
      };
      if (overtimeDept) params.department = overtimeDept;
      const res = await apiClient.get('/reports/overtime/summary', { params });
      return res.data;
    },
  });

  const deptColumns = [
    { title: 'Department', dataIndex: 'name', key: 'name' },
    { title: 'Total', dataIndex: 'totalEmployees', key: 'totalEmployees' },
    { title: 'Workers', dataIndex: 'workers', key: 'workers' },
    { title: 'Office Staff', dataIndex: 'officeStaff', key: 'officeStaff' },
    { title: 'Monthly', dataIndex: 'monthlySalary', key: 'monthlySalary' },
    { title: 'Daily Wage', dataIndex: 'dailyWage', key: 'dailyWage' },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Employees"
              value={attendanceSummary?.data?.stats?.totalEmployees || 0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Present"
              value={attendanceSummary?.data?.stats?.totalPresent || 0}
              valueStyle={{ color: 'var(--hrms-success)' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Absent"
              value={attendanceSummary?.data?.stats?.totalAbsent || 0}
              valueStyle={{ color: 'var(--hrms-danger)' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Attendance by Department" style={{ marginBottom: 24 }}
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('attendance', undefined, { department: attendanceDept })} loading={drillDownLoading}>Drill Down</Button>}>
        <DataTable
          dataSource={Object.entries(attendanceSummary?.data?.stats?.byDepartment || {}).map(([name, data]: any) => ({ name, ...data }))}
          loading={attLoading}
          columns={[
            { title: 'Department', dataIndex: 'name', key: 'name' },
            { title: 'Employees', dataIndex: 'employees', key: 'employees' },
            { title: 'Present', dataIndex: 'present', key: 'present' },
            { title: 'Absent', dataIndex: 'absent', key: 'absent' },
            { title: 'Half Day', dataIndex: 'halfDay', key: 'halfDay' },
            { title: 'Leave', dataIndex: 'leave', key: 'leave' },
          ]}
          rowKey="name"
          hidePagination
          noCard
          onRowClick={(record: any) => handleDrillDown('attendance', undefined, { department: record.name })}
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
            <Statistic title="Total Net Pay" value={payrollSummary?.data?.ytd?.totalNet || 0} prefix="₹" valueStyle={{ color: 'var(--hrms-success)' }} />
          </Col>
        </Row>
      </Card>

      <Card title="Monthly Payroll Trend"
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('payroll')} loading={drillDownLoading}>Drill Down</Button>}>
        <DataTable
          dataSource={payrollSummary?.data?.monthlyData || []}
          loading={payLoading}
          columns={[
            { title: 'Month', dataIndex: 'month', key: 'month' },
            { title: 'Employees', dataIndex: 'employees', key: 'employees' },
            { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Deductions', dataIndex: 'deductions', key: 'deductions', render: (v: number) => `₹${v.toLocaleString()}` },
            { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v: number) => <b>₹{v.toLocaleString()}</b> },
          ]}
          rowKey="month"
          hidePagination
          noCard
          onRowClick={(record: any) => handleDrillDown('payroll', record.month)}
        />
      </Card>

      <Card title="Department Overview" style={{ marginTop: 24 }}
        extra={<Button size="small" icon={<ZoomInOutlined />} onClick={() => handleDrillDown('department')} loading={drillDownLoading}>View Details</Button>}>
        <DataTable
          dataSource={deptSummary?.data?.departments || []}
          loading={deptLoading}
          columns={deptColumns}
          rowKey="name"
          hidePagination
          noCard
          onRowClick={(record: any) => handleDrillDown('department', record.name)}
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
            <DataTable
              dataSource={(Object.values(overtimeSummary?.data?.stats?.byEmployee || {}) as object[]).slice(0, 10)}
              loading={otLoading}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Code', dataIndex: 'code', key: 'code' },
                { title: 'Hours', dataIndex: 'totalHours', key: 'totalHours', render: (v: number) => `${v}h` },
                { title: 'Entries', dataIndex: 'entries', key: 'entries' },
              ]}
              rowKey="code"
              hidePagination
              noCard
              disableRowClick
            />
          </Col>
          <Col span={12}>
            <h4 style={{ marginBottom: 8 }}>Rule Usage</h4>
            <DataTable
              dataSource={Object.entries(overtimeSummary?.data?.stats?.ruleUsage || {}).map(([name, hours]: any) => ({ name, hours }))}
              loading={otLoading}
              columns={[
                { title: 'Rule', dataIndex: 'name', key: 'name' },
                { title: 'Total Hours', dataIndex: 'hours', key: 'hours', render: (v: number) => `${v}h` },
              ]}
              rowKey="name"
              hidePagination
              noCard
              disableRowClick
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
