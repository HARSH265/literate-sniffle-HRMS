import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders active status with green tag', () => {
    render(<StatusBadge status="active" />);
    const tag = screen.getByText('Active');
    expect(tag).toBeInTheDocument();
    expect(tag.className).toContain('ant-tag');
  });

  it('renders inactive status', () => {
    render(<StatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders present status', () => {
    render(<StatusBadge status="present" />);
    expect(screen.getByText('Present')).toBeInTheDocument();
  });

  it('renders half-day status with formatted label', () => {
    render(<StatusBadge status="half-day" />);
    expect(screen.getByText('Half Day')).toBeInTheDocument();
  });

  it('handles unknown status', () => {
    render(<StatusBadge status="unknown-status" />);
    expect(screen.getByText('Unknown Status')).toBeInTheDocument();
  });
});
