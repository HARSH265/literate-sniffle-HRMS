import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  fluid?: boolean;
}

export function PageContainer({ children, fluid }: PageContainerProps) {
  return (
    <div
      style={{
        padding: '0 4px',
        maxWidth: fluid ? '100%' : 1600,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}
