import { Tag } from 'antd';

interface StatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  terminated: 'red',
  present: 'green',
  absent: 'red',
  'half-day': 'orange',
  leave: 'blue',
  'weekly-off': 'purple',
  holiday: 'cyan',
  draft: 'default',
  finalized: 'green',
  pending: 'orange',
  paid: 'green',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'default';
  const label = status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return <Tag color={color}>{label}</Tag>;
}