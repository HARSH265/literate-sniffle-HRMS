import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title and message when open', () => {
    render(<ConfirmModal open title="Confirm Delete" message="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmModal open={false} title="Confirm" message="Message" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('renders custom button texts', () => {
    render(<ConfirmModal open title="Title" message="Msg" onConfirm={vi.fn()} onCancel={vi.fn()} confirmText="Yes" cancelText="No" />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('shows danger button when danger prop is true', () => {
    render(<ConfirmModal open title="Title" message="Msg" onConfirm={vi.fn()} onCancel={vi.fn()} danger />);
    const okBtn = screen.getByText('Confirm').closest('button');
    expect(okBtn).toBeTruthy();
  });
});
