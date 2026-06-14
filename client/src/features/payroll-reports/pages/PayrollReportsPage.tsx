import { Card, Row, Col, Space, message } from 'antd';
import { DownloadOutlined, BarChartOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { payrollReportsService } from '../services/payrollReportsService';

export function PayrollReportsPage() {
  const handleDownload = async (fn: () => Promise<Blob>, filename: string) => {
    try {
      const blob = await fn();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Download failed');
    }
  };

  return (
    <>
      <PageHeader title="Payroll Reports" />
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card hoverable onClick={() => handleDownload(() => payrollReportsService.downloadBankFile('latest'), 'bank-file.csv')}>
            <Space><DownloadOutlined /><span>Bank File</span></Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable onClick={() => handleDownload(() => payrollReportsService.downloadSalaryRegister('latest'), 'salary-register.csv')}>
            <Space><DownloadOutlined /><span>Salary Register</span></Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable onClick={async () => { const r = await payrollReportsService.getHeadcountCost(); message.info(JSON.stringify(r.data)); }}>
            <Space><TeamOutlined /><span>Headcount Cost</span></Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable onClick={async () => { const r = await payrollReportsService.getMoMVariance(); message.info(JSON.stringify(r.data)); }}>
            <Space><BarChartOutlined /><span>MoM Variance</span></Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable onClick={async () => { const r = await payrollReportsService.getYtdCost(); message.info(JSON.stringify(r.data)); }}>
            <Space><DollarOutlined /><span>YTD Cost</span></Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable onClick={async () => { const r = await payrollReportsService.getLoanOutstanding(); message.info(JSON.stringify(r.data)); }}>
            <Space><DollarOutlined /><span>Loan Outstanding</span></Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}
