import { Skeleton } from 'antd';

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} style={{ marginBottom: 24 }}>
          <Skeleton.Input active style={{ width: 120, height: 20, marginBottom: 8 }} />
          <Skeleton.Input active style={{ width: '100%', height: 40 }} />
        </div>
      ))}
    </div>
  );
}