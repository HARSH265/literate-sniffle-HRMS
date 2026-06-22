import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Spin, message } from 'antd';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { PageContainer } from '../../../core/components/PageContainer';
import { DataTable } from '../../../core/components/DataTable';
import { complianceService, ComplianceReport } from '../services/complianceService';

export function CompliancePage() {
  const [loading, setLoading] = useState(false);
  const [reports] = useState<ComplianceReport[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await complianceService.getSummary();
    } catch {
      message.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const columns = [
    { title: 'Payroll Run', dataIndex: 'month', key: 'month' },
    { title: 'Status', dataIndex: 'overallStatus', key: 'status', render: (s: string) => {
      const color = s === 'pass' ? 'green' : s === 'warning' ? 'orange' : 'red';
      return <Tag color={color}>{s.toUpperCase()}</Tag>;
    }},
    { title: 'Passed', dataIndex: ['summary', 'passed'], key: 'passed' },
    { title: 'Warnings', dataIndex: ['summary', 'warnings'], key: 'warnings' },
    { title: 'Failures', dataIndex: ['summary', 'failures'], key: 'failures' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Compliance" />
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Passed" value={0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Warnings" value={0} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Failures" value={0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>
      <DataTable columns={columns} dataSource={reports} rowKey="runId" />
    </PageContainer>
  );
}
