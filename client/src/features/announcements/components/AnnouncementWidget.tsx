import { useNavigate } from 'react-router-dom';
import { Tag, Spin } from 'antd';
import { BellOutlined, RightOutlined } from '@ant-design/icons';
import { useAnnouncements } from '../hooks/useAnnouncements';
import dayjs from 'dayjs';

const priorityColors: Record<string, string> = {
  low: 'default', normal: 'blue', high: 'orange', urgent: 'red',
};

export function AnnouncementWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useAnnouncements({ page: 1, limit: 5, status: 'active' });

  const announcements = data?.data || [];

  return (
    <div className="hrms-table-card" style={{ padding: 24 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, cursor: 'pointer' }}
        onClick={() => navigate('/announcements')}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--hrms-text-primary)' }}>
          <BellOutlined style={{ marginRight: 8, color: '#4f46e5' }} />Announcements
        </h3>
        <span style={{ fontSize: 12, color: '#4f46e5' }}>View All <RightOutlined style={{ fontSize: 10 }} /></span>
      </div>

      {isLoading ? (
        <Spin style={{ display: 'block', margin: '12px auto' }} />
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--hrms-text-muted)', fontSize: 13 }}>
          No announcements
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.map((a: any) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
