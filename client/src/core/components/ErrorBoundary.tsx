import { Component } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: React.ReactNode;
  module?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title={`${this.props.module || 'Section'} crashed`}
          subTitle={this.state.error?.message || 'An unexpected error occurred'}
          extra={<Button type="primary" onClick={this.handleRetry}>Retry</Button>}
        />
      );
    }
    return this.props.children;
  }
}