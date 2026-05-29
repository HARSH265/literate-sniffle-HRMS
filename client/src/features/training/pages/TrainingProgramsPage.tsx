import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Select, Space, Typography, Tag, Modal } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTrainingPrograms, useCancelTrainingProgram } from '../hooks/useTraining';
import { ProgramStatusBadge } from '../components/TrainingStatusBadge';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text } = Typography;

export function TrainingProgramsPage() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-training');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const cancelMutation = useCancelTrainingProgram();

  const { data, isLoading } = useTrainingPrograms({ page, limit: 20, search, status: statusFilter });

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (t: string, r: any) => <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/training/${r._id}`)}><Text strong>{t}</Text></Button> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c}</Tag> },
    {
      title: 'Duration', key: 'duration',
      render: (_: any, r: any) => r.duration ? `${r.duration.value} ${r.duration.unit}` : '-',
    },
    {
      title: 'Period', key: 'period',
      render: (_: any, r: any) => `${new Date(r.startDate).toLocaleDateString('en-IN')} - ${new Date(r.endDate).toLocaleDateString('en-IN')}`,
    },
    { title: 'Mode', dataIndex: 'mode', key: 'mode' },
    { title: 'Capacity', dataIndex: 'maxParticipants', key: 'maxParticipants', render: (v: number | undefined) => v || 'Unlimited' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <ProgramStatusBadge status={s} /> },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, r: any) => canManage && r.status === 'planned' ? (
        <Button size="small" danger onClick={() => { Modal.confirm({ title: 'Cancel Program?', content: `Cancel "${r.title}"?`, onOk: () => cancelMutation.mutate(r._id) }); }}>Cancel</Button>
      ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Training Programs"
        subtitle="Manage training and development programs"
        actions={canManage && <Space><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/training/new')}>New Program</Button></Space>}
      />

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16 }}>
          <Input placeholder="Search programs..." prefix={<SearchOutlined />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: 280 }} allowClear />
          <Select placeholder="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} allowClear style={{ width: 150 }}
            options={[{ label: 'Planned', value: 'planned' }, { label: 'In Progress', value: 'in-progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]}
          />
        </Space>
        <Table dataSource={data?.data || []} columns={columns} rowKey="_id" loading={isLoading}
          pagination={{ current: page, pageSize: 20, total: data?.meta?.total || 0, onChange: setPage, showSizeChanger: false }}
        />
      </Card>
    </div>
  );
}
