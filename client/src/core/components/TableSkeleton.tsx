import { Skeleton } from 'antd';

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 10 }: TableSkeletonProps) {
  return (
    <div>
      <Skeleton.Input active style={{ width: '100%', height: 40, marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Skeleton.Input
          key={rowIndex}
          active
          style={{
            width: '100%',
            height: 48,
            marginBottom: 8,
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
}