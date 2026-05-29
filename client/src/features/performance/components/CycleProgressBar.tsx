import { Progress, Typography, Space, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, UserSwitchOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CycleProgressBarProps {
  total: number;
  draft: number;
  selfReview: number;
  managerReview: number;
  completed: number;
}

export function CycleProgressBar({ total, draft, selfReview, managerReview, completed }: CycleProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Tooltip title="Draft"><Text style={{ fontSize: 12 }}><EditOutlined /> {draft}</Text></Tooltip>
        <Tooltip title="Self Review"><Text style={{ fontSize: 12 }}><ClockCircleOutlined /> {selfReview}</Text></Tooltip>
        <Tooltip title="Manager Review"><Text style={{ fontSize: 12 }}><UserSwitchOutlined /> {managerReview}</Text></Tooltip>
        <Tooltip title="Completed"><Text style={{ fontSize: 12 }}><CheckCircleOutlined /> {completed}</Text></Tooltip>
      </Space>
      <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#1890ff'} />
      <Text type="secondary" style={{ fontSize: 11 }}>{completed}/{total} reviews completed</Text>
    </div>
  );
}
