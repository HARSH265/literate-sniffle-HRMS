import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Spin, Typography, Tag, Popconfirm, Row, Col,
} from 'antd';
import {
  DownloadOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useDocument, useDeleteDocument } from '../hooks/useDocuments';
import { documentService } from '../services/documentService';
import { PageContainer } from '../../../core/components/PageContainer';
import { ErrorState } from '../../../core/components/ErrorState';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text, Title } = Typography;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-documents');
  const { data, isLoading } = useDocument(id!);
  const deleteMutation = useDeleteDocument();

  const doc = data?.data;

  if (isLoading) {
    return <PageContainer><Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 80 }} /></PageContainer>;
  }

  if (!doc) {
    return <PageContainer><ErrorState message="Document not found" /></PageContainer>;
  }

  return (
    <PageContainer>
      <Space size={4} style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>Back to Documents</Button>
      </Space>

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>{doc.title}</Title>
                <Tag>{doc.category}</Tag>
                {doc.isCompanyDocument && <Tag color="blue">Company</Tag>}
              </Space>
            }
            extra={
              canManage && (
                <Space size={4}>
                  <Button icon={<EditOutlined />} onClick={() => navigate(`/documents/${id}/edit`)}>Edit</Button>
                  <Popconfirm
                    title="Delete this document?"
                    description="This action cannot be undone."
                    onConfirm={() => deleteMutation.mutate(id!, { onSuccess: () => navigate('/documents') })}
                    okText="Delete"
                    okType="danger"
                  >
                    <Button danger icon={<DeleteOutlined />}>Delete</Button>
                  </Popconfirm>
                </Space>
              )
            }
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Category"><Tag>{doc.category}</Tag></Descriptions.Item>
              <Descriptions.Item label="Version">v{doc.version}</Descriptions.Item>
              <Descriptions.Item label="File Name">{doc.file.name}</Descriptions.Item>
              <Descriptions.Item label="File Size">{formatFileSize(doc.file.size)}</Descriptions.Item>
              <Descriptions.Item label="Downloads">{doc.downloadCount}</Descriptions.Item>
              <Descriptions.Item label="Uploaded By">{doc.uploadedBy?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Employee">
                {doc.employee ? `${doc.employee.fullName} (${doc.employee.employeeCode})` : 'Company Document'}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-IN') : 'No expiry'}
              </Descriptions.Item>
              {doc.tags?.length > 0 && (
                <Descriptions.Item label="Tags" span={2}>
                  {doc.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </Descriptions.Item>
              )}
              {doc.description && (
                <Descriptions.Item label="Description" span={2}>{doc.description}</Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <a href={documentService.getDownloadUrl(doc._id)} target="_blank" rel="noopener noreferrer">
                <Button type="primary" icon={<DownloadOutlined />} size="large">
                  Download File
                </Button>
              </a>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          {doc.previousVersions?.length > 0 && (
            <Card title="Version History" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {doc.previousVersions.map((v, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < doc.previousVersions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <Space>
                    <FileTextOutlined />
                    <div>
                      <div><Text strong>v{v.version}</Text> — {v.file.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatFileSize(v.file.size)} • {new Date(v.uploadedAt).toLocaleDateString('en-IN')}
                      </Text>
                    </div>
                  </Space>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}
