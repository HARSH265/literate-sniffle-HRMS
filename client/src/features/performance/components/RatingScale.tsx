import { Rate, Typography, Space } from 'antd';

const { Text } = Typography;

interface RatingScaleProps {
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showLabel?: boolean;
  count?: number;
}

const LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

export function RatingScale({ value, onChange, disabled, showLabel = true, count = 5 }: RatingScaleProps) {
  return (
    <Space>
      <Rate value={value} onChange={onChange} disabled={disabled} count={count} />
      {showLabel && value != null && (
        <Text type="secondary" style={{ fontSize: 12 }}>{LABELS[value] || `${value}/${count}`}</Text>
      )}
    </Space>
  );
}
