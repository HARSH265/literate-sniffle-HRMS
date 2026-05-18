import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../core/components/PageHeader';
import { Table, Button, Descriptions, Card, message, Breadcrumb } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { salarySlipService } from '../services/salarySlipService';
import { ROUTES } from '../../../core/constants/routes';
import dayjs from 'dayjs';
import apiClient from '../../../core/api/apiClient';

export function SalarySlipDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: slipData, isLoading } = useQuery({
    queryKey: ['salary-slip-details', id],
    queryFn: async () => {
      const result = await salarySlipService.preview(id!);
      return result.data;
    },
    enabled: !!id,
  });

  const handleDownloadPdf = async (employeeId?: string) => {
    try {
      const params = employeeId ? { employeeId } : {};
      const response = await apiClient.get(`/salary-slips/${id}/pdf`, {
        params,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const suffix = employeeId ? `_${employeeId}` : '';
      link.setAttribute('download', `SalarySlip_${slipData?.month?.replace('-', '_')}${suffix}.pdf`);
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
    { title: 'Employee', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Dept', dataIndex: 'department', key: 'department' },
    { title: 'Basic', dataIndex: 'basicSalary', key: 'basicSalary', render: (v: number) => `₹${v?.toLocaleString()}` },
    { title: 'Earnings', dataIndex: 'totalEarnings', key: 'totalEarnings', render: (v: number) => `₹${v?.toLocaleString()}` },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => `₹${v?.toLocaleString()}` },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', render: (v: number) => <b style={{ color: 'var(--hrms-success)' }}>₹{v?.toLocaleString()}</b> },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => handleDownloadPdf(record.id)}>
          PDF
        </Button>
      ),
    },
  ];

  const totals = slipData?.employees?.reduce((acc: any, emp: any) => ({
    basic: acc.basic + (emp.basicSalary || 0),
    earnings: acc.earnings + (emp.totalEarnings || 0),
    deductions: acc.deductions + (emp.totalDeductions || 0),
    net: acc.net + (emp.netPay || 0),
  }), { basic: 0, earnings: 0, deductions: 0, net: 0 }) || {};

  return (
    <div>
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate(ROUTES.salarySlips)}>Salary Slips</a> },
          { title: slipData?.month || 'Details' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <PageHeader
        title={slipData?.month ? `Salary Slip - ${slipData.month}` : 'Salary Slip Details'}
        actions={[
          <Button key="download-all" type="primary" icon={<FilePdfOutlined />} onClick={() => handleDownloadPdf()}>
            Download All
          </Button>,
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 4 }}>
          <Descriptions.Item label="Company">{slipData?.companyName}</Descriptions.Item>
          <Descriptions.Item label="Address">{slipData?.companyAddress || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Month">{slipData?.month}</Descriptions.Item>
          <Descriptions.Item label="Generated Date">
            {slipData?.generatedDate ? dayjs(slipData.generatedDate).format('DD MMM YYYY') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Employees (${slipData?.employees?.length || 0})`}>
        <Table
          dataSource={slipData?.employees}
          rowKey="employeeCode"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          columns={columns}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3}><strong>₹{totals.basic?.toLocaleString()}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={4}><strong>₹{totals.earnings?.toLocaleString()}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={5}><strong>₹{totals.deductions?.toLocaleString()}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={6}><strong style={{ color: 'var(--hrms-success)' }}>₹{totals.net?.toLocaleString()}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={7}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}