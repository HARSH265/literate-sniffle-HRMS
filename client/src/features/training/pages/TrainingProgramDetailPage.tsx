import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Divider, Tag, Row, Col, Statistic, Table } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, CalendarOutlined, EnvironmentOutlined, DollarOutlined, BookOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';
import { ProgramStatusBadge } from '../components/TrainingStatusBadge';
const { Text, Title } = Typography;

export function TrainingProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['training', 'programs', id],
    queryFn: () => trainingService.getProgram(id!),
    enabled: !!id,
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['training', 'enrollments', 'program', id],
    queryFn: () => trainingService.listEnrollments({ programId: id, limit: 200 }),
    enabled: !!id,
  });

  const program = data?.data;
  const enrollments = enrollmentsData?.data || [];

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (!program) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Text type="danger">Program not found</Text></div>;
  }

  const enrolledCount = enrollments.filter((e: any) => e.status !== 'dropped').length;

  const enrollmentColumns = [
    {
      title: 'Employee', key: 'employee',
      render: (_: any, r: any) => {
        const emp = typeof r.employee === 'object' ? r.employee : null;
        return emp ? `${emp.fullName} (${emp.employeeCode})` : r.employee;
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <ProgramStatusBadge status={s} /> },
    { title: 'Enrolled', dataIndex: 'enrolledAt', key: 'enrolledAt', render: (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '-' },
    { title: 'Score', dataIndex: 'score', key: 'score', render: (s: number | undefined) => s != null ? `${s}%` : '-' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/training')}>Back to Programs</Button>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Capacity" value={program.maxParticipants || 'Unlimited'} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Enrolled" value={enrolledCount} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Duration" value={program.duration ? `${program.duration.value} ${program.duration.unit}` : '-'} prefix={<CalendarOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Cost" value={program.cost ? `₹${program.cost}` : 'Free'} prefix={<DollarOutlined />} /></Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>{program.title}</Title>
          <ProgramStatusBadge status={program.status} />
        </Space>

        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Category"><Tag>{program.category}</Tag></Descriptions.Item>
          <Descriptions.Item label="Mode">{program.mode}</Descriptions.Item>
          <Descriptions.Item label="Trainer">{program.trainer || '-'}</Descriptions.Item>
          <Descriptions.Item label="Location"><EnvironmentOutlined /> {program.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="Start Date">{new Date(program.startDate).toLocaleDateString('en-IN')}</Descriptions.Item>
          <Descriptions.Item label="End Date">{new Date(program.endDate).toLocaleDateString('en-IN')}</Descriptions.Item>
          <Descriptions.Item label="Certification">{program.certificationOffered ? `Yes (valid ${program.certificationValidForDays || 'N/A'} days)` : 'No'}</Descriptions.Item>
          <Descriptions.Item label="Max Participants">{program.maxParticipants || 'Unlimited'}</Descriptions.Item>
          {(program.prerequisites ?? []).length > 0 && (
            <Descriptions.Item label="Prerequisites" span={2}>
              {(program.prerequisites ?? []).map((p: string) => <Tag key={p}>{p}</Tag>)}
            </Descriptions.Item>
          )}
          {(program.tags ?? []).length > 0 && (
            <Descriptions.Item label="Tags" span={2}>
              {(program.tags ?? []).map((t: string) => <Tag key={t}>{t}</Tag>)}
            </Descriptions.Item>
          )}
          {program.description && (
            <Descriptions.Item label="Description" span={2}>{program.description}</Descriptions.Item>
          )}
        </Descriptions>

        <Divider />
        <Title level={5}>Enrollments ({enrolledCount})</Title>
        <Table dataSource={enrollments} columns={enrollmentColumns} rowKey="_id" size="small" pagination={false} />
      </Card>
    </div>
  );
}
