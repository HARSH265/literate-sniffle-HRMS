import { useState } from 'react';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Modal, Select, message, Tag, Card, Row, Col, Descriptions } from 'antd';
import { FilePdfOutlined, EyeOutlined } from '@ant-design/icons';
import { salarySlipService } from '../services/salarySlipService';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiClient from '../../../core/api/apiClient';

const STATUS_COLORS: Record<string, string> = {
  draft: 'orange',
  finalized: 'green',
};

export function SalarySlipsPage() {
  const [monthFilter, setMonthFilter] = useState<string | undefined>(undefined);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['salary-slips', monthFilter],
    queryFn: () => salarySlipService.list({ month: monthFilter }),
    refetchOnWindowFocus: false,
  });

  const previewMutation = useMutation({
    mutationFn: async (runId: string) => {
      const result = await salarySlipService.generatePdf(runId);
      return result.data;
    },
    onSuccess: (slipData: any) => {
      setSelectedSlip(slipData);
      setIsPreviewOpen(true);
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to generate slip'),
  });

  const handleDownloadPdf = async (runId: string, month: string) => {
    try {
      const response = await apiClient.get(`/salary-slips/${runId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SalarySlip_${month.replace('-', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('PDF downloaded successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Failed to download PDF');
    }
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (m: string) => <span style={{ fontWeight: 600 }}>{dayjs(m + '-01').format('MMMM YYYY')}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag>,
    },
    {
      title: 'Employees',
      dataIndex: 'totalEmployees',
      key: 'totalEmployees',
    },
    {
      title: 'Total Net Pay',
      dataIndex: 'totalNetPay',
      key: 'totalNetPay',
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--hrms-success)' }}>₹{v.toLocaleString()}</span>,
    },
    {
      title: 'Generated',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-',
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => previewMutation.mutate(record.id)}
            loading={previewMutation.isPending}
          >
            Preview
          </Button>
          {record.status === 'finalized' && (
            <Button 
              size="small" 
              icon={<FilePdfOutlined />}
              onClick={() => handleDownloadPdf(record.id, record.month)}
            >
              Download PDF
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="Salary Slips" 
        subtitle="View and download employee salary slips"
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              placeholder="Filter by month"
              allowClear
              style={{ width: 200 }}
              value={monthFilter}
              onChange={(val) => setMonthFilter(val)}
              options={data?.data?.map((s: any) => ({
                label: dayjs(s.month + '-01').format('MMMM YYYY'),
                value: s.month,
              }))}
            />
          </Col>
          <Col>
            <Button onClick={() => refetch()}>Refresh</Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Salary Slip Preview - ${selectedSlip?.month || ''}`}
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)}>Close</Button>,
          <Button key="download" type="primary" icon={<FilePdfOutlined />}>Download PDF</Button>,
        ]}
        width={700}
      >
        {selectedSlip && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Company">{selectedSlip.companyName}</Descriptions.Item>
              <Descriptions.Item label="Address">{selectedSlip.companyAddress || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Month">{selectedSlip.month}</Descriptions.Item>
              <Descriptions.Item label="Generated Date">{dayjs(selectedSlip.generatedDate).format('DD MMM YYYY')}</Descriptions.Item>
            </Descriptions>
            
            <Table
              dataSource={selectedSlip.employees}
              rowKey="employeeCode"
              size="small"
              pagination={false}
              columns={[
                { title: 'Employee', dataIndex: 'name', key: 'name' },
                { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode' },
                { title: 'Dept', dataIndex: 'department', key: 'department' },
                { title: 'Basic', dataIndex: 'basicSalary', key: 'basicSalary', render: (v: number) => `₹${v?.toLocaleString()}` },
                { title: 'Earnings', dataIndex: 'totalEarnings', key: 'totalEarnings', render: (v: number) => `₹${v?.toLocaleString()}` },
                { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => `₹${v?.toLocaleString()}` },
                { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', render: (v: number) => <b style={{ color: 'var(--hrms-success)' }}>₹{v?.toLocaleString()}</b> },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}