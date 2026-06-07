import { Card, Table, Tag, Spin, Empty, Typography, Rate } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEssTraining } from '../hooks/useEssTraining';
import { EnrollmentStatusBadge } from '../../training/components/TrainingStatusBadge';

const { Text } = Typography;
const cardStyle = { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

const columns = [
  {
    title: 'Program', key: 'program', width: 160,
    render: (_: any, r: any) => <Text strong>{r.training?.title || '-'}</Text>,
  },
  {
    title: 'Category', key: 'category', width: 100,
    render: (_: any, r: any) => <Tag style={{ fontSize: 11 }}>{r.training?.category || '-'}</Tag>,
  },
  {
    title: 'Status', dataIndex: 'status', key: 'status', width: 100,
    render: (s: string) => <EnrollmentStatusBadge status={s} />,
  },
  {
    title: 'Period', key: 'period', width: 120,
    render: (_: any, r: any) => r.training?.startDate
      ? `${dayjs(r.training.startDate).format('DD/MM')} - ${dayjs(r.training.endDate).format('DD/MM/YY')}`
      : '-',
  },
  {
    title: 'Enrolled', dataIndex: 'enrolledAt', key: 'enrolledAt', width: 100,
    render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-',
  },
  {
    title: 'Score', dataIndex: 'score', key: 'score', width: 60,
    render: (s: number | undefined) => s != null ? `${s}%` : '-',
  },
  {
    title: 'Rating', dataIndex: 'rating', key: 'rating', width: 120,
    render: (r: number | undefined) => r != null ? <Rate disabled value={r} count={5} style={{ fontSize: 12 }} /> : '-',
  },
];

export function EssTrainingPage() {
  const { data, isLoading } = useEssTraining();
  const enrollments = data?.data || [];

  return (
    <Card
      title={<span style={{ fontSize: 15 }}><BookOutlined style={{ marginRight: 8 }} />My Training</span>}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
      style={cardStyle}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : enrollments.length === 0 ? (
        <Empty description="No training programs assigned to you" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={enrollments}
            columns={columns}
            rowKey={(r: any) => r._id || r.id}
            size="small"
            scroll={{ x: 'max-content' }}
            bordered
          />
        </div>
      )}
    </Card>
  );
}
