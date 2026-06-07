import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    render(<MemoryRouter><PageHeader title="Test Title" subtitle="Test subtitle" /></MemoryRouter>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders actions', () => {
    render(<MemoryRouter><PageHeader title="Title" actions={<button>Action</button>} /></MemoryRouter>);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<MemoryRouter><PageHeader title="Title" breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Current' }]} /></MemoryRouter>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders title only when no optional props', () => {
    render(<MemoryRouter><PageHeader title="Minimal" /></MemoryRouter>);
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });
});
