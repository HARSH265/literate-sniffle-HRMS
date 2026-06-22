import { useNavigate } from 'react-router-dom';
import { Tag, Card, Skeleton } from 'antd';
import { BellOutlined, RightOutlined } from '@ant-design/icons';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { EmptyState } from '../../../core/components/EmptyState';
import dayjs from 'dayjs';

const priorityColors: Record<string, string> = {
  low: 'default', normal: 'blue', high: 'orange', urgent: 'red',
};

export function AnnouncementWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useAnnouncements({ page: 1, limit: 5, status: 'active' });

  const announcements = data?.data || [];

  return (
    <Card
      title={<><BellOutlined style={{ marginRight: 6 }} />Announcements</>}
      extra={<span style={{ fontSize: 12, color: 'var(--hrms-primary)', cursor: 'pointer' }} onClick={() => navigate('/announcements')}>View All <RightOutlined style={{ fontSize: 10 }} /></span>}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : announcements.length === 0 ? (
        <EmptyState title="No announcements" />
      ) : (
        announcements.map((a: any) => (
          <div
            key={a._id}
            style={{ cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid var(--hrms-border-light)' }}
            onClick={() => navigate(`/announcements/${a._id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.title}
              </span>
              <Tag color={priorityColors[a.priority] || 'default'} style={{ fontSize: 10, marginLeft: 8, flexShrink: 0 }}>{a.priority?.toUpperCase()}</Tag>
            </div>
            <div style={{ fontSize: 12, color: 'var(--hrms-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {a.content}
            </div>
            <div style={{ fontSize: 11, color: 'var(--hrms-text-muted)', marginTop: 4 }}>
              {dayjs(a.createdAt).format('DD MMM YYYY')}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
