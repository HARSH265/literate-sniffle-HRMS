import { useState } from 'react';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { Row, Col, Card, Statistic, Tag, Button, message, Select, Modal, Form, Descriptions } from 'antd';
import { BankOutlined, DollarOutlined, SafetyCertificateOutlined, FileTextOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statutoryService, PFChallan, StatutoryReport } from '../services/statutoryService';
import dayjs from 'dayjs';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1;
  return { label: dayjs().month(i).format('MMMM YYYY'), value: `${dayjs().year()}-${String(m).padStart(2, '0')}` };
});

const REPORT_TYPES = [
  { label: 'PF ECR', value: 'pf-ecr' },
  { label: 'PF Form 5', value: 'pf-form-5' },
  { label: 'PF Form 10', value: 'pf-form-10' },
  { label: 'ESI Return', value: 'esi-return' },
  { label: 'PT Return', value: 'pt-return' },
];

const STATUS_COLORS: Record<string, string> = {
  generated: 'blue',
  downloaded: 'orange',
  filed: 'green',
  pending: 'default',
  paid: 'green',
};

export function StatutoryDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[MONTHS.length - 1]?.value || dayjs().format('YYYY-MM'));
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['statutory-summary', selectedMonth],
    queryFn: () => statutoryService.getSummary(selectedMonth),
  });

  const { data: challans, isLoading: challansLoading } = useQuery({
    queryKey: ['statutory-challans', selectedMonth],
    queryFn: () => statutoryService.listChallans({ month: selectedMonth }),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['statutory-reports', selectedMonth],
    queryFn: () => statutoryService.listReports({ month: selectedMonth }),
  });

  const generateChallanMutation = useMutation({
    mutationFn: () => statutoryService.generateChallan(selectedMonth),
    onSuccess: () => { message.success('PF Challan generated'); setChallanModalOpen(false); queryClient.invalidateQueries({ queryKey: ['statutory-challans'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to generate challan'),
  });

  const generateReportMutation = useMutation({
    mutationFn: ({ reportType, month }: { reportType: string; month: string }) => statutoryService.generateReport(reportType, month),
    onSuccess: () => { message.success('Report generated'); setReportModalOpen(false); queryClient.invalidateQueries({ queryKey: ['statutory-reports'] }); },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to generate report'),
  });

  const challanColumns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'FY', dataIndex: 'financialYear', key: 'financialYear' },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount' },
    { title: 'Total Wages', dataIndex: 'totalWages', key: 'totalWages', render: (v: number) => `₹${(v || 0).toLocaleString()}` },
    { title: 'Employee PF', dataIndex: 'employeePfContribution', key: 'employeePfContribution', render: (v: number) => `₹${(v || 0).toLocaleString()}` },
    { title: 'Employer PF', dataIndex: 'employerPfContribution', key: 'employerPfContribution', render: (v: number) => `₹${(v || 0).toLocaleString()}` },
    { title: 'EPS', dataIndex: 'epsContribution', key: 'epsContribution', render: (v: number) => `₹${(v || 0).toLocaleString()}` },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => <strong>₹${(v || 0).toLocaleString()}</strong> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> },
    { title: 'Actions', key: 'actions', fixed: 'right' as const, render: (_: any, r: PFChallan) => (
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setViewData(r); setViewModalOpen(true); }}>View</Button>
    )},
  ];

  const reportColumns = [
    { title: 'Type', dataIndex: 'reportType', key: 'reportType', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'FY', dataIndex: 'financialYear', key: 'financialYear' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s}</Tag> },
    { title: 'Generated', dataIndex: 'generatedAt', key: 'generatedAt', render: (d: string) => d ? dayjs(d).format('DD MMM YYYY HH:mm') : '-' },
    { title: 'File', dataIndex: 'fileName', key: 'fileName', render: (f: string) => f || '-' },
    { title: 'Actions', key: 'actions', fixed: 'right' as const, render: (_: any, r: StatutoryReport) => (
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setViewData(r); setViewModalOpen(true); }}>View</Button>
    )},
  ];

  return (
    <PageContainer>
      <PageHeader title="Statutory Compliance" subtitle="PF, ESI & Professional Tax management" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ marginRight: 8, fontWeight: 500 }}>Month:</span>
          <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 200 }} options={MONTHS} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading}>
            <Statistic
              title="PF Due (Employee + Employer)"
              value={summary?.pf?.totalPfDue || 0}
              prefix={<BankOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#888' }}>/ {summary?.pf?.applicableEmployees || 0} emp</span>}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading}>
            <Statistic
              title="ESI Due (Employee + Employer)"
              value={summary?.esi?.totalEsiDue || 0}
              prefix={<SafetyCertificateOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#888' }}>/ {summary?.esi?.applicableEmployees || 0} emp</span>}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading}>
            <Statistic
              title="Professional Tax Due"
              value={summary?.pt?.totalAmount || 0}
              prefix={<DollarOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#888' }}>/ {summary?.pt?.applicableEmployees || 0} emp</span>}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  {summary?.pf && (
    <Col xs={24} sm={8} style={{ display: 'flex' }}>
      <Card 
        size="small" 
        title="PF Breakdown" 
        loading={summaryLoading}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1 } }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Total Wages">₹{summary.pf.totalWages.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="EPS">₹{summary.pf.eps.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="EDLI">₹{summary.pf.edli.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Employee Contribution">₹{summary.pf.employeeContribution.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Employer Contribution">₹{summary.pf.employerContribution.toLocaleString()}</Descriptions.Item>
          
        </Descriptions>
      </Card>
    </Col>
  )}
  {summary?.esi && (
    <Col xs={24} sm={8} style={{ display: 'flex' }}>
      <Card 
        size="small" 
        title="ESI Breakdown" 
        loading={summaryLoading}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1 } }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Total Wages">₹{summary.esi.totalWages.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Employee (0.75%)">₹{summary.esi.employeeContribution.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Employer (3.25%)">₹{summary.esi.employerContribution.toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Col>
  )}
  {summary?.pt && (
    <Col xs={24} sm={8} style={{ display: 'flex' }}>
      <Card 
        size="small" 
        title="PT Breakdown" 
        loading={summaryLoading}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1 } }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Applicable Employees">{summary.pt.applicableEmployees}</Descriptions.Item>
          <Descriptions.Item label="Total PT Amount">₹{summary.pt.totalAmount.toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Col>
  )}
</Row>


      <Card
        title={<span><BankOutlined /> PF Challans</span>}
        style={{ marginBottom: 24 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setChallanModalOpen(true)}>Generate Challan</Button>}
      >
        <DataTable dataSource={challans || []} columns={challanColumns} rowKey="id" loading={challansLoading} hidePagination noCard disableRowClick />
      </Card>

      <Card
        title={<span><FileTextOutlined /> Statutory Reports</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setReportModalOpen(true)}>Generate Report</Button>}
      >
        <DataTable dataSource={reports || []} columns={reportColumns} rowKey="id" loading={reportsLoading} hidePagination noCard disableRowClick />
      </Card>

      <Modal title="Generate PF Challan" open={challanModalOpen} onCancel={() => setChallanModalOpen(false)} onOk={() => generateChallanMutation.mutate()} confirmLoading={generateChallanMutation.isPending}>
        <p>Generate PF challan for <strong>{selectedMonth}</strong>?</p>
        <p style={{ color: '#888', fontSize: 13 }}>This will calculate PF contributions for all non-exempt employees and create a challan record.</p>
      </Modal>

      <Modal title="Generate Statutory Report" open={reportModalOpen} onCancel={() => setReportModalOpen(false)} footer={null}>
        <Form layout="vertical" onFinish={(values) => generateReportMutation.mutate(values)}>
          <Form.Item name="reportType" label="Report Type" rules={[{ required: true }]}>
            <Select options={REPORT_TYPES} />
          </Form.Item>
          <Form.Item name="month" label="Month" initialValue={selectedMonth} rules={[{ required: true }]}>
            <Select options={MONTHS} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={generateReportMutation.isPending} icon={<FileTextOutlined />}>Generate</Button>
        </Form>
      </Modal>

      <Modal title="Details" open={viewModalOpen} onCancel={() => { setViewModalOpen(false); setViewData(null); }} footer={null} width={800}>
        {viewData && (
          <pre style={{ maxHeight: 500, overflow: 'auto', fontSize: 12, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(viewData, null, 2)}
          </pre>
        )}
      </Modal>
    </PageContainer>
  );
}
