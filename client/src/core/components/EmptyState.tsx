import { Empty, Button } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 16px' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            {title && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--hrms-text-primary)', marginBottom: 4 }}>{title}</div>}
            {description && <div style={{ fontSize: 13, color: 'var(--hrms-text-muted)' }}>{description}</div>}
          </div>
        }
      >
        {action && (
          <Button type="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Empty>
    </div>
  );
}
