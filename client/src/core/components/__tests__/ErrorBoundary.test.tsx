import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Child Content</div></ErrorBoundary>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders fallback on error', () => {
    const ThrowError = () => { throw new Error('Test error'); };

    render(<ErrorBoundary fallback={<div>Custom Error UI</div>}><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('renders default error UI when no fallback provided', () => {
    const ThrowError = () => { throw new Error('Test error'); };

    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
