import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { FormSection } from '../FormSection';

describe('FormSection', () => {
  it('renders title and children', () => {
    render(<FormSection title="Personal Info" icon={<span>I</span>}><div>Form fields here</div></FormSection>);
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Form fields here')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<FormSection title="Section" icon={<span data-testid="test-icon">🔍</span>}><div>Content</div></FormSection>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
