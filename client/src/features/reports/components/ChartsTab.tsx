import { Card, Select, Row, Col, Radio } from 'antd';
import { BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from 'antd';
import apiClient from '../../../core/api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ChartsTabProps } from '../types/reportTypes';

const { RangePicker } = DatePicker;

const COLORS = ['var(--hrms-success)', 'var(--hrms-danger)', 'var(--hrms-warning)', 'var(--hrms-info)', 'var(--hrms-primary)', 'var(--hrms-warning)', 'var(--hrms-info)', 'var(--hrms-danger)'];
const PIE_COLORS = ['var(--hrms-success)', 'var(--hrms-danger)', 'var(--hrms-warning)', 'var(--hrms-info)', 'var(--hrms-primary)'];

export function ChartsTab({
  chartType, setChartType,
  chartGroupBy, setChartGroupBy,
  chartPeriod, setChartPeriod,
}: ChartsTabProps) {
  const { data: chartData } = useQuery({
    queryKey: ['chart-data', chartType, chartGroupBy, chartPeriod[0]?.format('YYYY-MM-DD'), chartPeriod[1]?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const params: Record<string, string> = {
        chartType,
        'period[start]': chartPeriod[0].format('YYYY-MM-DD'),
        'period[end]': chartPeriod[1].format('YYYY-MM-DD'),
      };
      if (chartGroupBy) params.groupBy = chartGroupBy;
      const res = await apiClient.get('/reports/chart-data', { params });
      return res.data;
    },
  });

  const renderChart = () => {
    if (!chartData?.data?.data) return <div style={{ textAlign: 'center', padding: '60px 40px', fontSize: 16, color: 'var(--hrms-text-muted)' }}>No chart data available</div>;

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
            <Bar dataKey="present" fill="var(--hrms-success)" name="Present" />
            <Bar dataKey="absent" fill="var(--hrms-danger)" name="Absent" />
            <Bar dataKey="halfDay" fill="var(--hrms-warning)" name="Half Day" />
            <Bar dataKey="leave" fill="var(--hrms-info)" name="Leave" />
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
            <Bar dataKey="present" fill="var(--hrms-success)" name="Present" />
            <Bar dataKey="absent" fill="var(--hrms-danger)" name="Absent" />
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
            <Bar dataKey="gross" fill="var(--hrms-info)" name="Gross" />
            <Bar dataKey="deductions" fill="var(--hrms-warning)" name="Deductions" />
            <Bar dataKey="net" fill="var(--hrms-success)" name="Net Pay" />
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
            <Bar dataKey="total" fill="var(--hrms-info)" name="Total Employees" />
            <Bar dataKey="workers" fill="var(--hrms-success)" name="Workers" />
            <Bar dataKey="officeStaff" fill="var(--hrms-primary)" name="Office Staff" />
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

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Chart Type</div>
            <div style={{ display: 'flex', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
              <Radio.Group
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                size="middle"
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="attendance"><BarChartOutlined /> Attendance</Radio.Button>
                <Radio.Button value="payroll"><LineChartOutlined /> Payroll</Radio.Button>
                <Radio.Button value="department"><PieChartOutlined /> Department</Radio.Button>
                <Radio.Button value="leave">Leave</Radio.Button>
              </Radio.Group>
            </div>
          </Col>
          <Col xs={24} sm={24} md={6} lg={6}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Group By</div>
            <Select style={{ width: '100%' }} value={chartGroupBy} onChange={setChartGroupBy}>
              <Select.Option value="month">By Month</Select.Option>
              <Select.Option value="department">By Department</Select.Option>
              <Select.Option value={undefined}>Summary</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Period</div>
            <RangePicker value={chartPeriod} onChange={(dates) => dates && setChartPeriod(dates as [any, any])} style={{ width: '100%' }} />
          </Col>
        </Row>
      </Card>

      <Card>
        {renderChart()}
      </Card>
    </div>
  );
}
