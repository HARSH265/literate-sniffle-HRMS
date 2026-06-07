import { Tag } from 'antd';

const statusColors: Record<string, string> = {
  available: 'green',
  allocated: 'blue',
  maintenance: 'orange',
  retired: 'red',
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  allocated: 'Allocated',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

export function AssetStatusBadge({ status }: { status: string }) {
  return (
    <Tag color={statusColors[status] || 'default'}>
      {statusLabels[status] || status}
    </Tag>
  );
}
