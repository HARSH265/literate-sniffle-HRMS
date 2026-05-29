import React from 'react';
import { Table, Card, Button, Input, Select, Space, Row, Col, Statistic, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, SearchOutlined, FileTextOutlined, TeamOutlined, BankOutlined, WarningOutlined } from '@ant-design/icons';
import { useDocuments, useDocumentStats } from '../hooks/useDocuments';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text } = Typography;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-documents');
  const [page, setPage] = React.useState(1);
  const [category, setCategory] = React.useState<string | undefined>();
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useDocuments({ page, limit: 20, category, search });
  const { data: stats } = useDocumentStats();

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => (
        <a onClick={() => navigate(`/documents/${record._id}`)}>
          <Text strong>{title}</Text>
        </a>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: ['file', 'mimeType'],
      key: 'type',
      render: (mime: string) => {
        const ext = mime.split('/').pop()?.toUpperCase();
        return <Text code>{ext}</Text>;
      },
    },
    {
      title: 'Size',
      dataIndex: ['file', 'size'],
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      render: (emp: any) =>
        emp ? `${emp.fullName} (${emp.employeeCode})` : <Text type="secondary">Company</Text>,
    },
    {
      title: 'Downloads',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 100,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Document Repository"
        subtitle="Manage company policies, contracts, and employee documents"
        actions={
          canManage && (
            <Button type="primary" icon={<UploadOutlined />} onClick={() => navigate('/documents/new')}>
              Upload Document
            </Button>
          )
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Documents" value={stats?.data?.total || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Company Docs" value={stats?.data?.companyDocs || 0} prefix={<BankOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Employee Docs" value={stats?.data?.employeeDocs || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Expiring Soon"
              value={stats?.data?.expiringSoon || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats?.data?.expiringSoon ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by title, description, or tags..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Category"
            value={category}
            onChange={(val) => { setCategory(val); setPage(1); }}
            allowClear
            style={{ width: 150 }}
          />
        </Space>

        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
