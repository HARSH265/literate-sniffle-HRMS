import { useState } from 'react';
import { Card, Button, Select, Space, Typography, Modal, InputNumber, Input, Rate } from 'antd';
import { DataTable } from '../../../core/components/DataTable';
import { ErrorState } from '../../../core/components/ErrorState';
import { PlusOutlined, BookOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useCompleteEnrollment, useDropEnrollment } from '../hooks/useTraining';
import { EnrollEmployeeModal } from '../components/EnrollEmployeeModal';
import { EnrollmentStatusBadge } from '../components/TrainingStatusBadge';
import { PageContainer } from '../../../core/components/PageContainer';
import { PageHeader } from '../../../core/components/PageHeader';
import { usePermission } from '../../../core/hooks/usePermission';
import { trainingService } from '../services/trainingService';

const { Text } = Typography;
const getId = (record: any) => record?.id || record?._id;

export function TrainingEnrollmentsPage() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission('manage-training');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [programFilter, setProgramFilter] = useState<string | undefined>();
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeId, setCompleteId] = useState<string>('');
  const [score, setScore] = useState<number | undefined>();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(3);
  const completeMutation = useCompleteEnrollment();
  const dropMutation = useDropEnrollment();

  const { data: programs } = useQuery({
    queryKey: ['training', 'programs', 'simple-list'],
    queryFn: () => trainingService.listPrograms({ limit: 200 }),
  });

  const { data: enrollmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['training', 'enrollments', statusFilter, programFilter, page],
    queryFn: () => trainingService.listEnrollments({ page, limit: 20, status: statusFilter, programId: programFilter }),
  });

  const columns = [
    {
      title: 'Employee', key: 'employee',
      render: (_: any, r: any) => {
        const emp = typeof r.employee === 'object' ? r.employee : null;
        return emp ? `${emp.fullName} (${emp.employeeCode})` : r.employee;
      },
    },
    { title: 'Program', key: 'program', render: (_: any, r: any) => r.training?.title || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <EnrollmentStatusBadge status={s} /> },
    {
      title: 'Enrolled', dataIndex: 'enrolledAt', key: 'enrolledAt',
      render: (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-',
    },
    { title: 'Score', dataIndex: 'score', key: 'score', render: (s: number | undefined) => s != null ? `${s}%` : '-' },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r: number | undefined) => r != null ? <Rate disabled value={r} count={5} /> : '-' },
    {
      title: '', key: 'actions', width: 160,
      render: (_: any, r: any) => canManage ? (
        <Space size={4}>
          {(r.status === 'enrolled' || r.status === 'in-progress') && (
            <Button size="small" type="primary" onClick={() => { setCompleteId(getId(r)); setScore(undefined); setFeedback(''); setRating(3); setCompleteModalOpen(true); }}>
              Complete
            </Button>
          )}
          {r.status !== 'dropped' && r.status !== 'completed' && r.status !== 'certified' && (
            <Button size="small" danger onClick={() => { Modal.confirm({ title: 'Drop Enrollment?', content: 'Remove this employee from the program?', onOk: () => dropMutation.mutate(getId(r)) }); }}>
              Drop
            </Button>
          )}
        </Space>
      ) : null,
    },
  ];

  if (error) {
    return <ErrorState message="Failed to load enrollments" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Training Enrollments"
        subtitle="Manage employee enrollments in training programs"
        actions={canManage && <Space size={4}><Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedProgram(''); setEnrollModalOpen(true); }}>Enroll Employee</Button></Space>}
      />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select placeholder="Program" value={programFilter} onChange={(v) => { setProgramFilter(v); setPage(1); }} allowClear style={{ width: 250 }}
            options={(programs?.data || []).map((p: any) => ({ label: p.title, value: getId(p) })).filter((option: any) => Boolean(option.value))} showSearch optionFilterProp="label"
          />
          <Select placeholder="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} allowClear style={{ width: 150 }}
            options={[
              { label: 'Enrolled', value: 'enrolled' }, { label: 'In Progress', value: 'in-progress' },
              { label: 'Completed', value: 'completed' }, { label: 'Dropped', value: 'dropped' }, { label: 'Certified', value: 'certified' },
            ]}
          />
        </Space>
<DataTable
            dataSource={enrollmentsData?.data || []}
            columns={columns}
            rowKey={(record) => getId(record)}
            loading={isLoading}
            page={page}
            total={enrollmentsData?.meta?.total ?? 0}
            onPaginationChange={(p) => setPage(p)}
          />
      </Card>

      {enrollModalOpen && selectedProgram && (
        <EnrollEmployeeModal open={enrollModalOpen} trainingId={selectedProgram} onClose={() => { setEnrollModalOpen(false); refetch(); }} />
      )}

      {enrollModalOpen && !selectedProgram && (
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hrms-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hrms-primary)' }}>
                <BookOutlined />
              </div>
              <span>Select Program</span>
            </div>
          }
          open={enrollModalOpen}
          onCancel={() => { setSelectedProgram(''); setEnrollModalOpen(false); }}
          footer={null}
          destroyOnClose
          width={480}
        >
          <Select placeholder="Select a training program..." value={selectedProgram || undefined} onChange={setSelectedProgram}
            style={{ width: '100%', borderRadius: 6 }} showSearch optionFilterProp="label" size="large"
            options={(programs?.data || []).filter((p: any) => p.status === 'planned' || p.status === 'in-progress').map((p: any) => ({ label: p.title, value: getId(p) })).filter((option: any) => Boolean(option.value))}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button style={{ borderRadius: 6, marginRight: 8 }} onClick={() => { setSelectedProgram(''); setEnrollModalOpen(false); }}>Cancel</Button>
            <Button type="primary" icon={<ArrowRightOutlined />} disabled={!selectedProgram} onClick={() => { setEnrollModalOpen(false); setEnrollModalOpen(true); }}>
              Next
            </Button>
          </div>
        </Modal>
      )}

      <Modal title="Complete Enrollment" open={completeModalOpen}
        onOk={() => completeMutation.mutate({ id: completeId, payload: { score, feedback: feedback || undefined, rating } }, { onSuccess: () => setCompleteModalOpen(false) })}
        onCancel={() => setCompleteModalOpen(false)} confirmLoading={completeMutation.isPending} destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div><Text>Score (%):</Text><InputNumber min={0} max={100} value={score} onChange={(val) => setScore(val ?? undefined)} style={{ width: '100%', marginTop: 4 }} /></div>
          <div><Text>Rating:</Text><Rate value={rating} onChange={setRating} count={5} style={{ marginLeft: 8 }} /></div>
          <div><Text>Feedback:</Text><Input.TextArea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ marginTop: 4 }} /></div>
        </Space>
      </Modal>
    </PageContainer>
  );
}
