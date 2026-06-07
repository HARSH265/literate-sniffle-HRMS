import { Component, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f5f5f5',
            padding: 24,
          }}>
            <Result
              status="error"
              title="Something went wrong"
              subTitle="We're sorry, something unexpected happened. Please try again or return to the dashboard."
              extra={[
                <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                  Try Again
                </Button>,
                <Button key="home" icon={<HomeOutlined />} onClick={() => {
                  window.location.href = window.location.pathname.startsWith('/ess') ? '/ess' : '/dashboard';
                }}>
                  Go to Dashboard
                </Button>,
              ]}
            />
          </div>
        )
      );
    }
    return this.props.children;
  }
}