import { Card, Row, Col, Typography, Tag, Rate } from 'antd';

const { Text } = Typography;

interface GoalCardProps {
  title: string;
  description?: string;
  weight: number;
  rating?: number;
  selfRating?: number;
  managerRating?: number;
}

export function GoalCard({ title, description, weight, rating, selfRating, managerRating }: GoalCardProps) {
  return (
    <Card size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Text strong>{title}</Text>
          {description && <div><Text type="secondary" style={{ fontSize: 12 }}>{description}</Text></div>}
        </Col>
        <Col>
          <Tag color="blue">{weight}%</Tag>
        </Col>
        {rating != null && (
          <Col><Rate disabled value={rating} count={5} style={{ fontSize: 14 }} /></Col>
        )}
        {selfRating != null && (
          <Col><Text type="secondary" style={{ fontSize: 11 }}>Self: {selfRating}/5</Text></Col>
        )}
        {managerRating != null && (
          <Col><Text type="secondary" style={{ fontSize: 11 }}>Mgr: {managerRating}/5</Text></Col>
        )}
      </Row>
    </Card>
  );
}
