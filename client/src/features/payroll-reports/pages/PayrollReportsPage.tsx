import { useState } from 'react';
import { Card, Tabs, Select, Button, Space, Statistic, Row, Col, message, Spin, Empty, Tag } from 'antd';
import { DownloadOutlined, BankOutlined, FileExcelOutlined, TeamOutlined, BarChartOutlined, DollarOutlined, WarningOutlined, ToolOutlined, FundOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { ErrorBoundary } from '../../../core/components/ErrorBoundary';
import { payrollReportsService } from '../services/payrollReportsService';
import { payrollService, PayrollRun } from '../../payroll/services/payrollService';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCurrencySymbol } from '../../../core/constants/currency';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../../../core/api/apiClient';

function formatMoney(val: number): string {
  return formatCurrency(val);
}

function handleBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function ExportButton({ onExport, filename, columns: columnOverrides }: { onExport: () => Record<string, unknown>[]; filename: string; columns?: string[] }) {
  const [loading, setLoading] = useState(false);
  const handleExport = async () => {
    try {
      const data = onExport();
      if (!data.length) { message.info('No data to export'); return; }
      setLoading(true);
      const cols = columnOverrides || Object.keys(data[0]);
      const rows = data.map(row => cols.map(c => row[c] ?? ''));
      const { data: blob } = await apiClient.post('/payroll-reports/export-table',
        { filename: filename.replace('.xlsx', ''), columns: cols, rows },
        { responseType: 'blob' },
      );
      handleBlobDownload(blob, filename);
      message.success('Exported successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Export failed');
    } finally { setLoading(false); }
  };
  return <Button icon={<FileExcelOutlined />} loading={loading} onClick={handleExport}>Export</Button>;
}

/* ──────────────────────────── Bank File Tab ──────────────────────────── */
function BankFileTab({ runId, runLabel }: { runId: string; runLabel?: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await payrollReportsService.downloadBankFile(runId);
      handleBlobDownload(blob, `bank-file-${runLabel || runId}.csv`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Download failed');
    } finally { setLoading(false); }
  };
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <p>Download the NEFT/RTGS/NACH bank file for the selected payroll run.</p>
        <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={handleDownload}>
          Download Bank File
        </Button>
      </Space>
    </Card>
  );
}

/* ──────────────────────────── Salary Register Tab ────────────────────── */
function SalaryRegisterTab({ runId, runLabel }: { runId: string; runLabel?: string }) {
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const handleDownload = async (format: 'xlsx' | 'csv') => {
    const setLoading = format === 'xlsx' ? setLoadingXlsx : setLoadingCsv;
    setLoading(true);
    try {
      const blob = format === 'csv'
        ? await payrollReportsService.downloadSalaryRegisterCsv(runId)
        : await payrollReportsService.downloadSalaryRegister(runId);
      handleBlobDownload(blob, `salary-register-${runLabel || runId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      message.success('Downloaded successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Download failed');
    } finally { setLoading(false); }
  };
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <p>Download the salary register with component-wise breakdown for all employees.</p>
        <Space>
          <Button type="primary" icon={<DownloadOutlined />} loading={loadingXlsx} onClick={() => handleDownload('xlsx')}>
            Download Excel
          </Button>
          <Button icon={<DownloadOutlined />} loading={loadingCsv} onClick={() => handleDownload('csv')}>
            Download CSV
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

/* ──────────────────────────── Headcount Cost Tab ─────────────────────── */
interface HeadcountDept {
  department: string; headcount: number; workers: number; officeStaff: number;
  permanent: number; contract: number; totalMonthlySalary: number;
}

function HeadcountCostTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-headcount-cost'],
    queryFn: () => payrollReportsService.getHeadcountCost(),
  });
  const result = data?.data;
  const departments: HeadcountDept[] = result?.departments || [];

  const columns: ColumnsType<HeadcountDept> = [
    { title: 'Department', dataIndex: 'department', key: 'dept', sorter: (a, b) => a.department.localeCompare(b.department) },
    { title: 'Headcount', dataIndex: 'headcount', key: 'hc', sorter: (a, b) => a.headcount - b.headcount },
    { title: 'Workers', dataIndex: 'workers', key: 'workers' },
    { title: 'Office Staff', dataIndex: 'officeStaff', key: 'office' },
    { title: 'Permanent', dataIndex: 'permanent', key: 'perm' },
    { title: 'Contract', dataIndex: 'contract', key: 'contract' },
    { title: 'Monthly Salary', dataIndex: 'totalMonthlySalary', key: 'salary', render: (v: number) => formatMoney(v), sorter: (a, b) => a.totalMonthlySalary - b.totalMonthlySalary },
  ];

  const exportData = departments.map(d => ({
    Department: d.department, Headcount: d.headcount, Workers: d.workers, 'Office Staff': d.officeStaff,
    Permanent: d.permanent, Contract: d.contract, 'Monthly Salary': d.totalMonthlySalary,
  }));

  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load headcount data" />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total Employees" value={result?.totalEmployees || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Monthly Salary" value={result?.totalMonthlySalary || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Departments" value={departments.length} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename="headcount-cost.xlsx" />}>
        <DataTable dataSource={departments} columns={columns} rowKey="department" hidePagination noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── MoM Variance Tab ───────────────────────── */
interface MoMMonth {
  month: string; gross: number; net: number; employees: number; variance: number | null;
}

function MoMVarianceTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-mom-variance'],
    queryFn: () => payrollReportsService.getMoMVariance(),
  });
  const result = data?.data;
  const months: MoMMonth[] = result?.months || [];

  const columns: ColumnsType<MoMMonth> = [
    { title: 'Month', dataIndex: 'month', key: 'month', sorter: (a, b) => a.month.localeCompare(b.month) },
    { title: 'Employees', dataIndex: 'employees', key: 'emp' },
    { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v: number) => formatMoney(v), sorter: (a, b) => a.gross - b.gross },
    { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v: number) => formatMoney(v), sorter: (a, b) => a.net - b.net },
    {
      title: 'MoM Variance', dataIndex: 'variance', key: 'variance',
      render: (v: number | null) => v === null ? '—' : (
        <Tag color={v > 0 ? 'green' : v < 0 ? 'red' : 'default'}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</Tag>
      ),
      sorter: (a, b) => (a.variance ?? 0) - (b.variance ?? 0),
    },
  ];

  const exportData = months.map(m => ({
    Month: m.month, Employees: m.employees, Gross: m.gross, 'Net Pay': m.net,
    'MoM Variance %': m.variance !== null ? m.variance.toFixed(2) : '',
  }));

  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load MoM variance data" />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Months Tracked" value={months.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Avg MoM Variance" value={`${(result?.averageMonthOverMonth || 0).toFixed(2)}%`} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename="mom-variance.xlsx" />}>
        <DataTable dataSource={[...months].reverse()} columns={columns} rowKey="month" hidePagination noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── YTD Cost Tab ───────────────────────────── */
interface YTDMonth {
  month: string; gross: number; net: number; deductions: number; cumulativeGross: number; cumulativeNet: number;
}

function YtdCostTab() {
  const fyStartMonth = 3; // April
  const currentYear = new Date().getMonth() >= fyStartMonth ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, error } = useQuery({
    queryKey: ['report-ytd-cost', year],
    queryFn: () => payrollReportsService.getYtdCost({ year }),
  });
  const result = data?.data;
  const months: YTDMonth[] = result?.months || [];

  const columns: ColumnsType<YTDMonth> = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v: number) => formatMoney(v) },
    { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v: number) => formatMoney(v) },
    { title: 'Deductions', dataIndex: 'deductions', key: 'ded', render: (v: number) => formatMoney(v) },
    { title: 'Cumulative Gross', dataIndex: 'cumulativeGross', key: 'cg', render: (v: number) => formatMoney(v) },
    { title: 'Cumulative Net', dataIndex: 'cumulativeNet', key: 'cn', render: (v: number) => formatMoney(v) },
  ];

  const exportData = months.map(m => ({
    Month: m.month, Gross: m.gross, 'Net Pay': m.net, Deductions: m.deductions,
    'Cumulative Gross': m.cumulativeGross, 'Cumulative Net': m.cumulativeNet,
  }));

  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load YTD cost data" />;

  const ytdFilename = `ytd-cost-${year}.xlsx`;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16} align="middle">
        <Col>
          <Select value={year} onChange={setYear} style={{ width: 120 }}
            options={Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => ({ value: y, label: `${y}-${y + 1}` }))} />
        </Col>
        <Col><Tag>FY {result?.financialYear || `${year}-${year + 1}`}</Tag></Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total Gross" value={result?.totals?.gross || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Net" value={result?.totals?.net || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Deductions" value={result?.totals?.deductions || 0} prefix={getCurrencySymbol()} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename={ytdFilename} />}>
        <DataTable dataSource={months} columns={columns} rowKey="month" hidePagination noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── OT/LOP Tab ─────────────────────────────── */
interface OtLopDept {
  department: string; otHours: number; otAmount: number; lopDays: number; lopAmount: number;
}

function OtLopTab({ runId }: { runId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-ot-lop', runId],
    queryFn: () => payrollReportsService.getOtLop(runId),
    enabled: !!runId,
  });
  const result = data?.data;
  const departments: OtLopDept[] = result?.byDepartment || [];

  const columns: ColumnsType<OtLopDept> = [
    { title: 'Department', dataIndex: 'department', key: 'dept' },
    { title: 'OT Hours', dataIndex: 'otHours', key: 'otH', render: (v: number) => v.toFixed(1) },
    { title: 'OT Amount', dataIndex: 'otAmount', key: 'otA', render: (v: number) => formatMoney(v) },
    { title: 'LOP Days', dataIndex: 'lopDays', key: 'lopD' },
    { title: 'LOP Amount', dataIndex: 'lopAmount', key: 'lopA', render: (v: number) => formatMoney(v) },
  ];

  const exportData = departments.map(d => ({
    Department: d.department, 'OT Hours': d.otHours, 'OT Amount': d.otAmount,
    'LOP Days': d.lopDays, 'LOP Amount': d.lopAmount,
  }));

  if (!runId) return <Empty description="Select a payroll run to view OT/LOP analysis" />;
  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load OT/LOP data" />;

  const otLopFilename = `ot-lop-${runId}.xlsx`;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total OT Hours" value={result?.totalOtHours || 0} precision={1} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total OT Amount" value={result?.totalOtAmount || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total LOP Days" value={result?.totalLopDays || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total LOP Amount" value={result?.totalLopAmount || 0} prefix={getCurrencySymbol()} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename={otLopFilename} />}>
        <DataTable dataSource={departments} columns={columns} rowKey="department" hidePagination noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── Loan Outstanding Tab ───────────────────── */
interface LoanDetail {
  employee: string; employeeCode: string; loanType: string; amount: number; paid: number; outstanding: number; emi: number;
}

function LoanOutstandingTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-loan-outstanding'],
    queryFn: () => payrollReportsService.getLoanOutstanding(),
  });
  const result = data?.data;
  const details: LoanDetail[] = result?.details || [];

  const columns: ColumnsType<LoanDetail> = [
    { title: 'Employee', dataIndex: 'employee', key: 'emp', sorter: (a, b) => a.employee.localeCompare(b.employee) },
    { title: 'Code', dataIndex: 'employeeCode', key: 'code' },
    { title: 'Loan Type', dataIndex: 'loanType', key: 'type' },
    { title: 'Loan Amount', dataIndex: 'amount', key: 'amt', render: (v: number) => formatMoney(v) },
    { title: 'Paid', dataIndex: 'paid', key: 'paid', render: (v: number) => formatMoney(v) },
    {
      title: 'Outstanding', dataIndex: 'outstanding', key: 'out',
      render: (v: number) => <span style={{ color: v > 0 ? 'var(--hrms-danger)' : 'var(--hrms-success)' }}>{formatMoney(v)}</span>,
      sorter: (a, b) => a.outstanding - b.outstanding,
    },
    { title: 'EMI', dataIndex: 'emi', key: 'emi', render: (v: number) => formatMoney(v) },
  ];

  const exportData = details.map(d => ({
    Employee: d.employee, Code: d.employeeCode, 'Loan Type': d.loanType,
    'Loan Amount': d.amount, Paid: d.paid, Outstanding: d.outstanding, EMI: d.emi,
  }));

  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load loan data" />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total Loans" value={result?.totalLoans || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Outstanding" value={result?.totalOutstanding || 0} prefix={getCurrencySymbol()} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename="loan-outstanding.xlsx" />}>
        <DataTable dataSource={details} columns={columns} rowKey={(r) => `${r.employeeCode}-${r.loanType}`} noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── Budget vs Actual Tab ───────────────────── */
interface BudgetDept {
  budgeted: number; actual: number; variance: number; variancePct: number;
}

function BudgetVsActualTab({ runId }: { runId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['report-budget-vs-actual', runId],
    queryFn: () => payrollReportsService.getBudgetVsActual(runId),
    enabled: !!runId,
  });
  const result = data?.data;
  const deptEntries = result?.departments ? Object.entries(result.departments as Record<string, BudgetDept>) : [];

  const tableData = deptEntries.map(([name, d]) => ({ department: name, ...d }));

  const columns: ColumnsType<typeof tableData[number]> = [
    { title: 'Department', dataIndex: 'department', key: 'dept' },
    { title: 'Budgeted', dataIndex: 'budgeted', key: 'bud', render: (v: number) => formatMoney(v) },
    { title: 'Actual (Net Pay)', dataIndex: 'actual', key: 'act', render: (v: number) => formatMoney(v) },
    {
      title: 'Variance', dataIndex: 'variance', key: 'var',
      render: (v: number) => <span style={{ color: v >= 0 ? 'var(--hrms-success)' : 'var(--hrms-danger)' }}>{formatMoney(v)}</span>,
    },
    {
      title: 'Variance %', dataIndex: 'variancePct', key: 'varPct',
      render: (v: number) => <Tag color={v >= 0 ? 'green' : 'red'}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</Tag>,
    },
  ];

  const exportData = tableData.map(d => ({
    Department: d.department, Budgeted: d.budgeted, Actual: d.actual, Variance: d.variance, 'Variance %': d.variancePct,
  }));

  if (!runId) return <Empty description="Select a payroll run to view budget vs actual" />;
  if (isLoading) return <Spin />;
  if (error) return <Empty description="Failed to load budget data" />;

  const budgetFilename = `budget-vs-actual-${runId}.xlsx`;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="Total Budgeted" value={result?.totalBudgeted || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Actual" value={result?.totalActual || 0} prefix={getCurrencySymbol()} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Variance" value={result?.totalVariance || 0} prefix={getCurrencySymbol()} /></Card></Col>
      </Row>
      <Card extra={<ExportButton onExport={() => exportData} filename={budgetFilename} />}>
        <DataTable dataSource={tableData} columns={columns} rowKey="department" hidePagination noCard disableRowClick />
      </Card>
    </Space>
  );
}

/* ──────────────────────────── Main Page ──────────────────────────────── */
function PayrollReportsPageInner() {
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs-list'],
    queryFn: () => payrollService.listRuns({ page: 1, limit: 100, status: 'finalized' }),
  });

  const runs: PayrollRun[] = runsData?.data || [];
  const runOptions = runs.map((r) => ({ value: r.id, label: `${r.month}` }));
  const hasRuns = runs.length > 0;
  const selectedRunLabel = runs.find((r) => r.id === selectedRunId)?.month || selectedRunId;

  const tabItems = [
    { key: 'bank-file', label: <span><BankOutlined /> Bank File</span>, children: <BankFileTab runId={selectedRunId} runLabel={selectedRunLabel} /> },
    { key: 'salary-register', label: <span><FileExcelOutlined /> Salary Register</span>, children: <SalaryRegisterTab runId={selectedRunId} runLabel={selectedRunLabel} /> },
    { key: 'headcount', label: <span><TeamOutlined /> Headcount Cost</span>, children: <HeadcountCostTab /> },
    { key: 'mom-variance', label: <span><BarChartOutlined /> MoM Variance</span>, children: <MoMVarianceTab /> },
    { key: 'ytd-cost', label: <span><DollarOutlined /> YTD Cost</span>, children: <YtdCostTab /> },
    { key: 'ot-lop', label: <span><ToolOutlined /> OT/LOP Analysis</span>, children: <OtLopTab runId={selectedRunId} /> },
    { key: 'loan-outstanding', label: <span><FundOutlined /> Loan Outstanding</span>, children: <LoanOutstandingTab /> },
    { key: 'budget-vs-actual', label: <span><WarningOutlined /> Budget vs Actual</span>, children: <BudgetVsActualTab runId={selectedRunId} /> },
  ];

  if (runsLoading) {
    return (
      <div style={{ padding: '0 4px' }}>
        <PageHeader title="Payroll Reports" />
        <Card><div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div></Card>
      </div>
    );
  }

  if (!hasRuns) {
    return (
      <div style={{ padding: '0 4px' }}>
        <PageHeader title="Payroll Reports" />
        <Card>
          <Empty description="No finalized payroll runs found. Finalize a payroll run to generate reports." />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader
        title="Payroll Reports"
        actions={
          <Space>
            <span>Select Run:</span>
            <Select
              showSearch
              placeholder="Select a finalized run"
              style={{ width: 260 }}
              value={selectedRunId || undefined}
              onChange={setSelectedRunId}
              loading={runsLoading}
              options={runOptions}
              notFoundContent="No finalized runs available"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Space>
        }
      />
      <Card>
        <Tabs defaultActiveKey="bank-file" items={tabItems} />
      </Card>
    </div>
  );
}

export function PayrollReportsPage() {
  return (
    <ErrorBoundary module="Payroll Reports">
      <PayrollReportsPageInner />
    </ErrorBoundary>
  );
}
