import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Descriptions, Tag, Typography, Button, Space, Divider } from 'antd';
import { ArrowLeftOutlined, BellOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../core/components/PageHeader';
import { useAnnouncement, useMarkAsRead } from '../hooks/useAnnouncements';
import dayjs from 'dayjs';

const { Paragraph, Title } = Typography;

const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAnnouncement(id!);
  const markAsRead = useMarkAsRead();

  const announcement = data?.data;

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  if (!announcement) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
        Announcement not found
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Announcement Details"
        subtitle={announcement.title}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/announcements')}>
            Back
          </Button>
        }
      />

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <BellOutlined style={{ fontSize: 24, color: priorityColors[announcement.priority] || '#999' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>{announcement.title}</Title>
            <Space style={{ marginTop: 4 }}>
              <Tag color={priorityColors[announcement.priority]}>{announcement.priority?.toUpperCase()}</Tag>
              <Tag>{announcement.targetAudience?.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</Tag>
              {!announcement.isActive && <Tag color="red">Inactive</Tag>}
            </Space>
          </div>
        </div>

        <Divider />

        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#333' }}>
          {announcement.content}
        </div>

        <Divider />

        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Created By">{announcement.createdBy?.name || 'Unknown'}</Descriptions.Item>
          <Descriptions.Item label="Created At">{dayjs(announcement.createdAt).format('DD MMM YYYY hh:mm A')}</Descriptions.Item>
          {announcement.scheduledAt && (
            <Descriptions.Item label="Scheduled At">{dayjs(announcement.scheduledAt).format('DD MMM YYYY hh:mm A')}</Descriptions.Item>
          )}
          {announcement.expiresAt && (
            <Descriptions.Item label="Expires At">{dayjs(announcement.expiresAt).format('DD MMM YYYY hh:mm A')}</Descriptions.Item>
          )}
          <Descriptions.Item label="Read by">{announcement.readBy?.length || 0} user{(announcement.readBy?.length || 0) !== 1 ? 's' : ''}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {announcement.isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
