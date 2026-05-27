import { Badge, Tooltip } from 'antd';

interface ChangeRequestBadgeProps {
  pendingCount: number;
}

export function ChangeRequestBadge({ pendingCount }: ChangeRequestBadgeProps) {
  if (pendingCount <= 0) return null;

  return (
    <Tooltip title={`${pendingCount} pending change request${pendingCount > 1 ? 's' : ''}`}>
      <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} />
    </Tooltip>
  );
}
