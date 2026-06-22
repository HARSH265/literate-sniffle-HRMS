import { Card, Tag, Button, Space, Spin, Empty } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEssDocuments } from '../hooks/useEssDocuments';
import { DataTable } from '../../../core/components/DataTable';

const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export function EssDocumentsPage() {
  const { data, isLoading } = useEssDocuments();
  const documents = data?.data || [];

  const columns = [
    {
      title: 'Document Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => <Tag style={{ fontSize: 11 }}>{type?.toUpperCase()}</Tag>,
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 150,
    },
    {
      title: 'Uploaded At',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD MMM YYYY') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} href={record.filePath} target="_blank" size="small" style={{ padding: 0 }} />
          <Button type="link" icon={<DownloadOutlined />} href={record.filePath} download size="small" style={{ padding: 0 }} />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ fontSize: 15 }}>My Documents</span>}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      style={cardStyle}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : documents.length === 0 ? (
        <Empty description="No documents uploaded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <DataTable
          dataSource={documents}
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