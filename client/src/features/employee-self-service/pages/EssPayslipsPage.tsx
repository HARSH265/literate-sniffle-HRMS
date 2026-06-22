import { Card, Tag, Button, Space, Spin, Empty, message } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useEssPayslips } from '../hooks/useEssPayslips';
import { DataTable } from '../../../core/components/DataTable';
import apiClient from '../../../core/api/apiClient';
import dayjs from 'dayjs';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssPayslipsPage() {
  const { data, isLoading } = useEssPayslips();
  const payslips = data?.data || [];

  const handleView = (record: any) => {
    const runId = record.payrollRun?.id || record.id;
    if (runId) window.open(`/payroll/${runId}`, '_blank');
  };

  const handleDownload = async (record: any) => {
    try {
      const runId = record.payrollRun?.id || record.id;
      const employeeId = record.employee?.id || record.employee;
      if (!runId) { message.error('Unable to download payslip'); return; }
      const response = await apiClient.get(`/salary-slips/${runId}/pdf`, {
        params: employeeId ? { employeeId } : undefined,
        responseType: 'blob',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${record.month || 'payroll'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Payslip downloaded');
    } catch {
      message.error('Failed to download payslip');
    }
  };

  const columns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 130,
      render: (_: unknown, record: { payrollRun?: { month?: string }; month?: string; netPay: number }) => {
        const monthStr = record.payrollRun?.month || record.month || '';
        if (monthStr && monthStr.includes('-')) {
          const parsed = dayjs(monthStr + '-01');
          return <span style={{ fontSize: 13 }}>{parsed.isValid() ? parsed.format('MMM YYYY') : monthStr}</span>;
        }
        return <span style={{ fontSize: 13 }}>{monthStr || '-'}</span>;
      },
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      width: 110,
      render: (amount: number) => amount ? <span style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</span> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = { generated: 'green', draft: 'default', submitted: 'blue', finalized: 'green' };
        const s = status || 'draft';
        return <Tag color={colors[s] || 'default'} style={{ fontSize: 11 }}>{s?.toUpperCase()}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" style={{ padding: 0 }} onClick={() => handleView(record)} />
          <Button type="link" icon={<DownloadOutlined />} size="small" style={{ padding: 0 }} onClick={() => handleDownload(record)} />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ fontSize: 15 }}>My Payslips</span>}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      style={cardStyle}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : payslips.length === 0 ? (
        <Empty description="No payslips available yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <DataTable
          dataSource={payslips}
          columns={columns}
          rowKey="id"
          hidePagination
          noCard
          disableRowClick
          scroll={{ x: 'max-content' }}
        />
      )}
    </Card>
  );
}