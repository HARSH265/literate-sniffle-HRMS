import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })}>Retry</button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}