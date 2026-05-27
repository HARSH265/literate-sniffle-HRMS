import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../EmptyState';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as any };
});

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<MemoryRouter><EmptyState /></MemoryRouter>);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<MemoryRouter><EmptyState title="Custom Title" description="Custom description" /></MemoryRouter>);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('renders action button when action props provided', () => {
    render(<MemoryRouter><EmptyState actionLabel="Add New" actionPath="/new" /></MemoryRouter>);
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });
});
