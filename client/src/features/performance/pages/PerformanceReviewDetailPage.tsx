import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Typography, Divider, Modal, Input, InputNumber, Rate, Timeline, Tag, Row, Col } from 'antd';
import {
  EditOutlined, CheckCircleOutlined,
  ArrowLeftOutlined, SendOutlined, UserSwitchOutlined, FlagOutlined,
} from '@ant-design/icons';
import { usePerformanceReview, useSetGoals, useSubmitReview, useManagerReview, useAppealReview, useResolveAppeal } from '../hooks/usePerformance';
import type { PerformanceReview } from '../services/performanceService';
import { ReviewStatusBadge } from '../components/ReviewStatusBadge';
import { usePermission } from '../../../core/hooks/usePermission';

const { Text, Title } = Typography;

export function PerformanceReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { data, isLoading } = usePerformanceReview(id!);
  const setGoalsMutation = useSetGoals();
  const submitMutation = useSubmitReview();
  const managerMutation = useManagerReview();
  const appealMutation = useAppealReview();
  const resolveMutation = useResolveAppeal();

  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const [goals, setGoals] = useState<{ title: string; description?: string; weight: number }[]>([]);
  const [selfRating, setSelfRating] = useState<number>(3);
  const [selfComments, setSelfComments] = useState('');
  const [managerRating, setManagerRating] = useState<number>(3);
  const [managerComments, setManagerComments] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [resolution, setResolution] = useState('');
  const [resolveRating, setResolveRating] = useState<number | undefined>();

  const review = data?.data as PerformanceReview | undefined;
  const canManage = hasPermission('manage-performance');
  const canManageOwn = hasPermission('manage-own-performance');

  const openGoalsModal = () => {
    setGoals(review?.goals?.map((g) => ({ title: g.title, description: g.description, weight: g.weight })) || [{ title: '', description: '', weight: 100 }]);
    setGoalsModalOpen(true);
  };

  const handleSaveGoals = () => {
    const totalWeight = goals.reduce((sum, g) => sum + (g.weight || 0), 0);
    if (totalWeight !== 100) {
      Modal.warning({ title: 'Weight Error', content: `Goal weights must sum to 100. Current total: ${totalWeight}` });
      return;
    }
    setGoalsMutation.mutate(
      { reviewId: id!, goals },
      { onSuccess: () => setGoalsModalOpen(false) },
    );
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (!review) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Text type="danger">Review not found</Text></div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/performance')}>Back to Performance</Button>
      </Space>

      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>{review.employee?.fullName}</Title>
            <Text code>{review.employee?.employeeCode}</Text>
            <ReviewStatusBadge status={review.status} />
          </Space>
        }
        extra={
          <Space>
            {review.status === 'draft' && canManageOwn && (
              <Button icon={<EditOutlined />} onClick={openGoalsModal}>Set Goals</Button>
            )}
            {review.status === 'draft' && canManageOwn && review.goals?.length > 0 && (
              <Button type="primary" icon={<SendOutlined />} onClick={() => setSubmitModalOpen(true)}>
                Submit for Review
              </Button>
            )}
            {review.status === 'self-review' && canManage && (
              <Button type="primary" icon={<UserSwitchOutlined />} onClick={() => setManagerModalOpen(true)}>
                Manager Review
              </Button>
            )}
            {review.status === 'completed' && canManageOwn && (
              <Button icon={<FlagOutlined />} onClick={() => setAppealModalOpen(true)}>
                Appeal
              </Button>
            )}
            {review.status === 'appealed' && canManage && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveModalOpen(true)}>
                Resolve Appeal
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Cycle">{review.reviewCycle?.label || review.cycle?.label || '-'}</Descriptions.Item>
          <Descriptions.Item label="Manager">{review.manager?.name || 'Not assigned'}</Descriptions.Item>
          <Descriptions.Item label="Self Rating">{review.selfReview?.rating != null ? `${review.selfReview.rating}/5` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Manager Rating">{review.managerReview?.rating != null ? `${review.managerReview.rating}/5` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Final Rating">
            {review.finalRating != null ? <Text strong style={{ fontSize: 16 }}>{review.finalRating.toFixed(1)}/5</Text> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Status"><ReviewStatusBadge status={review.status} /></Descriptions.Item>
        </Descriptions>

        {review.goals?.length > 0 && (
          <>
            <Divider />
            <Title level={5}>Goals</Title>
            {review.goals.map((goal: any, idx: number) => (
              <Card key={idx} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Text strong>{goal.title}</Text>
                    {goal.description && <div><Text type="secondary">{goal.description}</Text></div>}
                  </Col>
                  <Col>
                    <Tag color="blue">Weight: {goal.weight}%</Tag>
                  </Col>
                  {goal.rating != null && (
                    <Col>
                      <Rate disabled value={goal.rating} count={5} />
                    </Col>
                  )}
                </Row>
              </Card>
            ))}
          </>
        )}

        {(review.selfReview?.overallComment || review.selfComments) && (
          <>
            <Divider />
            <Title level={5}>Self Comments</Title>
            <Text>{review.selfReview?.overallComment || review.selfComments}</Text>
          </>
        )}

        {(review.managerReview?.overallComment || review.managerComments) && (
          <>
            <Divider />
            <Title level={5}>Manager Comments</Title>
            <Text>{review.managerReview?.overallComment || review.managerComments}</Text>
          </>
        )}

        {review.appealReason && (
          <>
            <Divider />
            <Title level={5}>Appeal Reason</Title>
            <Card style={{ background: '#fff7e6', borderRadius: 8 }}>
              <Text>{review.appealReason}</Text>
              {review.appealedAt && (
                <div><Text type="secondary">Appealed on {new Date(review.appealedAt).toLocaleDateString('en-IN')}</Text></div>
              )}
            </Card>
          </>
        )}

        {review.appealResolution && (
          <>
            <Divider />
            <Title level={5}>Appeal Resolution</Title>
            <Card style={{ background: '#f6ffed', borderRadius: 8 }}>
              <Text>{review.appealResolution}</Text>
              {review.resolvedAt && (
                <div><Text type="secondary">Resolved on {new Date(review.resolvedAt).toLocaleDateString('en-IN')}</Text></div>
              )}
            </Card>
          </>
        )}

        {(review.submittedAt || review.managerReviewedAt || review.completedAt) && (
          <>
            <Divider />
            <Title level={5}>Timeline</Title>
            <Timeline
              items={[
                review.submittedAt ? { color: 'blue', children: `Self review submitted on ${new Date(review.submittedAt).toLocaleDateString('en-IN')}` } : null,
                review.managerReviewedAt ? { color: 'orange', children: `Manager review completed on ${new Date(review.managerReviewedAt).toLocaleDateString('en-IN')}` } : null,
                review.completedAt ? { color: 'green', children: `Completed on ${new Date(review.completedAt).toLocaleDateString('en-IN')}` } : null,
              ].filter((item): item is NonNullable<typeof item> => item != null)}
            />
          </>
        )}
      </Card>

      <Modal title="Set Goals" open={goalsModalOpen} onOk={handleSaveGoals} onCancel={() => setGoalsModalOpen(false)} width={600}
        confirmLoading={setGoalsMutation.isPending}
      >
        {goals.map((goal, idx) => (
          <Card key={idx} size="small" style={{ marginBottom: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Goal title"
                value={goal.title}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[idx] = { ...updated[idx], title: e.target.value };
                  setGoals(updated);
                }}
              />
              <Input
                placeholder="Description (optional)"
                value={goal.description}
                onChange={(e) => {
                  const updated = [...goals];
                  updated[idx] = { ...updated[idx], description: e.target.value };
                  setGoals(updated);
                }}
              />
              <Space>
                <Text>Weight (%):</Text>
                <InputNumber
                  min={0} max={100}
                  value={goal.weight}
                  onChange={(val) => {
                    const updated = [...goals];
                    updated[idx] = { ...updated[idx], weight: val || 0 };
                    setGoals(updated);
                  }}
                />
                {idx === goals.length - 1 ? (
                  <Button size="small" onClick={() => setGoals([...goals, { title: '', description: '', weight: 0 }])}>
                    + Add Goal
                  </Button>
                ) : (
                  <Button size="small" danger onClick={() => setGoals(goals.filter((_, i) => i !== idx))}>
                    Remove
                  </Button>
                )}
              </Space>
            </Space>
          </Card>
        ))}
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">Total weight: {goals.reduce((s, g) => s + g.weight, 0)}% (must equal 100%)</Text>
        </div>
      </Modal>

      <Modal title="Submit for Review" open={submitModalOpen} onOk={() => submitMutation.mutate({ reviewId: id!, payload: { rating: selfRating, overallComment: selfComments || 'Self review submitted' } }, { onSuccess: () => setSubmitModalOpen(false) })}
        onCancel={() => setSubmitModalOpen(false)} confirmLoading={submitMutation.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Self Rating:</Text>
            <Rate value={selfRating} onChange={setSelfRating} count={5} style={{ marginLeft: 12 }} />
            <Text style={{ marginLeft: 8 }}>{selfRating}/5</Text>
          </div>
          <Input.TextArea rows={3} placeholder="Self comments (optional)" value={selfComments} onChange={(e) => setSelfComments(e.target.value)} />
        </Space>
      </Modal>

      <Modal title="Manager Review" open={managerModalOpen} onOk={() => managerMutation.mutate({ reviewId: id!, payload: { rating: managerRating, overallComment: managerComments || 'Manager review submitted' } }, { onSuccess: () => setManagerModalOpen(false) })}
        onCancel={() => setManagerModalOpen(false)} confirmLoading={managerMutation.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Manager Rating:</Text>
            <Rate value={managerRating} onChange={setManagerRating} count={5} style={{ marginLeft: 12 }} />
            <Text style={{ marginLeft: 8 }}>{managerRating}/5</Text>
          </div>
          <Input.TextArea rows={3} placeholder="Manager comments (optional)" value={managerComments} onChange={(e) => setManagerComments(e.target.value)} />
        </Space>
      </Modal>

      <Modal title="Appeal Review" open={appealModalOpen} onOk={() => appealMutation.mutate({ reviewId: id!, reason: appealReason }, { onSuccess: () => setAppealModalOpen(false) })}
        onCancel={() => setAppealModalOpen(false)} confirmLoading={appealMutation.isPending}
      >
        <Input.TextArea rows={4} placeholder="Explain why you are appealing this review..." value={appealReason} onChange={(e) => setAppealReason(e.target.value)} />
      </Modal>

      <Modal title="Resolve Appeal" open={resolveModalOpen} onOk={() => resolveMutation.mutate({ reviewId: id!, resolution, finalRating: resolveRating }, { onSuccess: () => setResolveModalOpen(false) })}
        onCancel={() => setResolveModalOpen(false)} confirmLoading={resolveMutation.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {review.status === 'appealed' && (
            <div>
              <Text strong>Appeal Reason:</Text>
              <Card size="small" style={{ marginTop: 4, background: '#fff7e6' }}>
                <Text>{review.appealReason}</Text>
              </Card>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Text>Updated Rating (optional):</Text>
            <Rate value={resolveRating} onChange={setResolveRating} count={5} style={{ marginLeft: 12 }} />
          </div>
          <Input.TextArea rows={3} placeholder="Resolution notes..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
        </Space>
      </Modal>
    </div>
  );
}
