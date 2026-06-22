import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Typography, Spin, Input, Empty, Divider, Tooltip } from 'antd';
import { PageContainer } from '../../../core/components/PageContainer';
import { ArrowLeftOutlined, EditOutlined, SendOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTicket, useAddComment } from '../hooks/useHelpdesk';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const priorityColors: Record<string, string> = {
  low: 'default', medium: 'blue', high: 'orange', urgent: 'red',
};

const statusColors: Record<string, string> = {
  open: 'blue', 'in-progress': 'orange', resolved: 'green', closed: 'default',
};

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const { data, isLoading } = useTicket(id || '');
  const addComment = useAddComment();

  const ticket = data?.data;

  const handleAddComment = () => {
    if (!comment.trim() || !id) return;
    addComment.mutate({ id, payload: { message: comment } }, {
      onSuccess: () => setComment(''),
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: 80 }}>
        <Empty description="Ticket not found" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/helpdesk')}>Back to Help Desk</Button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/helpdesk')} />
        <Text strong style={{ fontSize: 18 }}>{ticket.ticketId}</Text>
        <Tag color={statusColors[ticket.status]} style={{ textTransform: 'capitalize' }}>{ticket.status}</Tag>
        <Tag color={priorityColors[ticket.priority]}>{ticket.priority?.toUpperCase()}</Tag>
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.slaBreached && (
          <Tag color="red" icon={<WarningOutlined />}>SLA Breached</Tag>
        )}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.slaDeadline && !ticket.slaBreached && (
          <Tooltip title={`Deadline: ${dayjs(ticket.slaDeadline).format('DD MMM YYYY, h:mm A')}`}>
            <Tag icon={<ClockCircleOutlined />} color="default">
              {dayjs(ticket.slaDeadline).format('DD MMM h:mm A')}
            </Tag>
          </Tooltip>
        )}
        <div style={{ flex: 1 }} />
        <Button icon={<EditOutlined />} onClick={() => navigate(`/helpdesk/${ticket._id}/edit`)} style={{ borderRadius: 8 }}>
          Edit
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>{ticket.subject}</Text>
        <Paragraph style={{ whiteSpace: 'pre-wrap', color: 'var(--hrms-text-secondary)' }}>{ticket.description}</Paragraph>
        <Divider />
        <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Category">{ticket.category?.toUpperCase()}</Descriptions.Item>
          <Descriptions.Item label="Requested By">{ticket.requestedBy?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Assigned To">{ticket.assignedTo?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Created">{dayjs(ticket.createdAt).format('DD MMM YYYY, h:mm A')}</Descriptions.Item>
          {ticket.slaDeadline && (
            <Descriptions.Item label="SLA Deadline">
              <span style={{ color: ticket.slaBreached ? '#ef4444' : 'inherit', fontWeight: ticket.slaBreached ? 600 : 400 }}>
                {ticket.slaBreached && <WarningOutlined style={{ marginRight: 6 }} />}
                {dayjs(ticket.slaDeadline).format('DD MMM YYYY, h:mm A')}
                {ticket.slaBreached && ' (Breached)'}
              </span>
            </Descriptions.Item>
          )}
          {ticket.resolvedAt && (
            <Descriptions.Item label="Resolved At">{dayjs(ticket.resolvedAt).format('DD MMM YYYY, h:mm A')}</Descriptions.Item>
          )}
          {ticket.closedAt && (
            <Descriptions.Item label="Closed At">{dayjs(ticket.closedAt).format('DD MMM YYYY, h:mm A')}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={`Comments (${ticket.comments?.length || 0})`}>
        {ticket.comments?.length === 0 ? (
          <Empty description="No comments yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          ticket.comments?.map((c: any) => (
            <div key={c._id} style={{
              padding: '12px 0', borderBottom: '1px solid var(--hrms-border-light)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text strong style={{ fontSize: 13 }}>{c.user?.name || 'Unknown'}</Text>
                <Text style={{ fontSize: 11, color: 'var(--hrms-text-muted)' }}>{dayjs(c.createdAt).format('DD MMM YYYY, h:mm A')}</Text>
              </div>
              <Paragraph style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.message}</Paragraph>
            </div>
          ))
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <TextArea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            loading={addComment.isPending}
            disabled={!comment.trim()}
            style={{ borderRadius: 8, height: 44 }}
          />
        </div>
      </Card>
    </PageContainer>
  );
}
