import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../core/components/PageHeader';
import { DataTable } from '../../../core/components/DataTable';
import { Button, Select, message, Tag } from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { salarySlipService, SalarySlip } from '../services/salarySlipService';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '../../../core/constants/routes';
import { SALARY_SLIP_STATUS_COLORS } from '../../../core/constants/statusColors';
import { formatCurrency } from '../../../core/constants/currency';
import { downloadPdfBlob } from '../../../core/utils/downloadPdfBlob';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = SALARY_SLIP_STATUS_COLORS;

export function SalarySlipsPage() {
  const [monthFilter, setMonthFilter] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const monthOptions = useMemo(() => {
    const options = [];
    const now = dayjs();
    for (let i = 0; i < 12; i++) {
      const d = now.subtract(i, 'month');
      options.push({ value: d.format('YYYY-MM'), label: d.format('MMMM YYYY') });
    }
    return options;
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['salary-slips', monthFilter],
    queryFn: () => salarySlipService.list({ month: monthFilter }),
    refetchOnWindowFocus: false,
  });

  const handleDownloadExcel = async (runId: string, month: string) => {
    try {
      await downloadPdfBlob(
        `/salary-slips/${runId}/excel`,
        `SalarySlips_${month.replace('-', '_')}.xlsx`,
      );
      message.success('Excel downloaded successfully');
    } catch (err: unknown) {
      message.error((err as any)?.response?.data?.message || 'Failed to download Excel');
    }
  };

  const handlePreview = (runId: string) => {
    navigate(ROUTES.salarySlipDetails(runId));
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (m: string) => <span style={{ fontWeight: 600 }}>{m}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status.toUpperCase()}</Tag>
      ),
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
      render: (v: number) => formatCurrency(v || 0),
    },
    {
      title: 'Generated',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (d: string) => d ? new Date(d).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SalarySlip) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record.id)}
          >
            View
          </Button>
          <Button 
            type="default" 
            size="small" 
            icon={<FileExcelOutlined />}
            onClick={() => handleDownloadExcel(record.id, record.month)}
          >
            Excel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Salary Slips"
        subtitle="View and download employee salary slips"
      />

      <DataTable
        dataSource={data?.data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        toolbarLeft={
          <Select
            placeholder="Filter by month"
            allowClear
            style={{ width: 200 }}
            value={monthFilter}
            onChange={setMonthFilter}
            options={monthOptions}
          />
        }
      />
    </div>
  );
}