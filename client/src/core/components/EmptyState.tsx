import { Empty } from 'antd';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
}

export function EmptyState({
  title = 'No data found',
  description,
  actionLabel,
  actionPath,
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <p style={{ fontWeight: 500 }}>{title}</p>
          {description && <p>{description}</p>}
        </div>
      }
    >
      {actionLabel && actionPath && (
        <button onClick={() => navigate(actionPath)}>{actionLabel}</button>
      )}
    </Empty>
  );
}