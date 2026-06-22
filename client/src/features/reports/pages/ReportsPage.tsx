import { useState, useCallback } from 'react';
import { Tabs } from 'antd';
import { DownloadOutlined, BarChartOutlined, PieChartOutlined, FilterOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ExportTab, SummaryTab, CustomReportTab, ChartsTab, DrillDownModal } from '../components';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('export');
  const [filters, setFilters] = useState<{ status: string | undefined; category: string | undefined; empDeptId: string | undefined }>({ status: undefined, category: undefined, empDeptId: undefined });
  const [attendanceMonth, setAttendanceMonth] = useState<dayjs.Dayjs>(dayjs());
  const [attendanceDept, setAttendanceDept] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [payrollYear, setPayrollYear] = useState<number>(dayjs().year());
  const [payrollDept, setPayrollDept] = useState<string | undefined>(undefined);
  const [overtimeMonth, setOvertimeMonth] = useState<dayjs.Dayjs>(dayjs());
  const [overtimeDept, setOvertimeDept] = useState<string | undefined>(undefined);
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

  const handleDrillDown = useCallback(async (entity: string, id?: string, filters?: Record<string, any>) => {
    try {
      setDrillDownLoading(true);
      const apiClient = (await import('../../../core/api/apiClient')).default;
      const params: Record<string, string> = { entity };
      if (id) params.id = id;
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => { params[`filters[${k}]`] = String(v); });
      }
      const res = await apiClient.get('/reports/drill-down', { params });
      const result = res.data;
      if (result.success) {
        setDrillDownData({ entity, ...result.data });
        setDrillDownVisible(true);
      }
    } catch {
      const { message } = await import('antd');
      message.error('Failed to load drill-down data');
    } finally {
      setDrillDownLoading(false);
    }
  }, []);

  return (
    <PageContainer>
    <div>
      <PageHeader title="Reports" subtitle="Export data, view interactive charts, and build custom reports" />
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'export', label: <span><DownloadOutlined /> Export</span> },
        { key: 'summary', label: <span><BarChartOutlined /> Summary</span> },
        { key: 'custom', label: <span><FilterOutlined /> Custom Report</span> },
        { key: 'charts', label: <span><PieChartOutlined /> Charts</span> },
      ]} />
      {activeTab === 'export' && (
        <ExportTab
          filters={filters} setFilters={setFilters}
          attendanceMonth={attendanceMonth} setAttendanceMonth={setAttendanceMonth}
          attendanceDept={attendanceDept} setAttendanceDept={setAttendanceDept}
          dateRange={dateRange} setDateRange={setDateRange}
          payrollYear={payrollYear} setPayrollYear={setPayrollYear}
          payrollDept={payrollDept} setPayrollDept={setPayrollDept}
          overtimeMonth={overtimeMonth} setOvertimeMonth={setOvertimeMonth}
          overtimeDept={overtimeDept} setOvertimeDept={setOvertimeDept}
          deptData={deptData}
        />
      )}
      {activeTab === 'summary' && (
        <SummaryTab
          attendanceMonth={attendanceMonth}
          dateRange={dateRange}
          attendanceDept={attendanceDept}
          payrollYear={payrollYear}
          payrollDept={payrollDept}
          overtimeMonth={overtimeMonth}
          overtimeDept={overtimeDept}
          setOvertimeMonth={setOvertimeMonth}
          handleDrillDown={handleDrillDown}
          drillDownLoading={drillDownLoading}
        />
      )}
      {activeTab === 'custom' && <CustomReportTab deptData={deptData} />}
      {activeTab === 'charts' && (
        <ChartsTab
          chartType={chartType} setChartType={setChartType}
          chartGroupBy={chartGroupBy} setChartGroupBy={setChartGroupBy}
          chartPeriod={chartPeriod} setChartPeriod={setChartPeriod}
        />
      )}
      <DrillDownModal
        visible={drillDownVisible}
        onClose={() => setDrillDownVisible(false)}
        data={drillDownData}
        loading={drillDownLoading}
      />
    </div>
    </PageContainer>
  );
}
