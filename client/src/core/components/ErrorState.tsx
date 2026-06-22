import { Button, Result } from 'antd';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Result
      status="error"
      title={message || 'Something went wrong'}
      subTitle="Please try again or contact support if the issue persists."
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
