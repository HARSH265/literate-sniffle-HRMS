import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Descriptions, Card, message, Breadcrumb } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { salarySlipService } from '../services/salarySlipService';
import { ROUTES } from '../../../core/constants/routes';
import { formatCurrency } from '../../../core/constants/currency';
import { downloadPdfBlob } from '../../../core/utils/downloadPdfBlob';
import dayjs from 'dayjs';

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
    refetchOnWindowFocus: false,
  });

  const handleDownloadPdf = async (employeeId?: string) => {
    try {
      const params = employeeId ? { employeeId } : undefined;
      const suffix = employeeId ? `_${employeeId}` : '';
      await downloadPdfBlob(
        `/salary-slips/${id}/pdf`,
        `SalarySlip_${slipData?.month?.replace('-', '_')}${suffix}.pdf`,
        params,
      );
      message.success('PDF downloaded successfully');
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.message || 'Failed to download PDF');
    }
  };

  const columns = [
    { title: 'Employee', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Dept', dataIndex: 'department', key: 'department' },
    { title: 'Basic', dataIndex: 'basicSalary', key: 'basicSalary', render: (v: number) => formatCurrency(v || 0) },
    { title: 'Earnings', dataIndex: 'totalEarnings', key: 'totalEarnings', render: (v: number) => formatCurrency(v || 0) },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'totalDeductions', render: (v: number) => formatCurrency(v || 0) },
    { title: 'Net Pay', dataIndex: 'netPay', key: 'netPay', render: (v: number) => <b style={{ color: 'var(--hrms-success)' }}>{formatCurrency(v || 0)}</b> },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => handleDownloadPdf(record.id)}>
          PDF
        </Button>
      ),
    },
  ];

  const totals: { basic: number; earnings: number; deductions: number; net: number } = slipData?.employees?.reduce<{ basic: number; earnings: number; deductions: number; net: number }>((acc, emp) => ({
    basic: acc.basic + (emp.basicSalary || 0),
    earnings: acc.earnings + (emp.totalEarnings || 0),
    deductions: acc.deductions + (emp.totalDeductions || 0),
    net: acc.net + (emp.netPay || 0),
  }), { basic: 0, earnings: 0, deductions: 0, net: 0 }) ?? { basic: 0, earnings: 0, deductions: 0, net: 0 };

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

      <DataTable
        dataSource={slipData?.employees}
        rowKey="employeeCode"
        loading={isLoading}
        columns={columns}
        pagination={{ pageSize: 20 }}
        toolbarRight={
          <span style={{ fontWeight: 600 }}>
            Total — Basic: {formatCurrency(totals.basic)} &nbsp;|&nbsp; Earnings: {formatCurrency(totals.earnings)} &nbsp;|&nbsp; Deductions: {formatCurrency(totals.deductions)} &nbsp;|&nbsp; <span style={{ color: 'var(--hrms-success)' }}>Net: {formatCurrency(totals.net)}</span>
          </span>
        }
      />
    </div>
  );
}