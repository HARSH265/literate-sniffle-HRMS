import { Tag } from 'antd';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  'draft': { color: 'default', label: 'Draft' },
  'self-review': { color: 'processing', label: 'Self Review' },
  'manager-review': { color: 'warning', label: 'Manager Review' },
  'completed': { color: 'success', label: 'Completed' },
  'appealed': { color: 'error', label: 'Appealed' },
};

export function ReviewStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { color: 'default', label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}
