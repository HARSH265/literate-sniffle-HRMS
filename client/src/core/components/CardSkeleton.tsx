import { Skeleton } from 'antd';

interface CardSkeletonProps {
  cards?: number;
}

export function CardSkeleton({ cards = 3 }: CardSkeletonProps) {
  return (
    <div>
      {Array.from({ length: cards }).map((_, index) => (
        <Skeleton
          key={index}
          active
          paragraph={{ rows: 2 }}
          style={{ marginBottom: 16 }}
        />
      ))}
    </div>
  );
}