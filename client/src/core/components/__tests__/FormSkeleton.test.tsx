import { describe, it, expect } from 'vitest';
import { render } from '../../../test/test-utils';
import { FormSkeleton } from '../FormSkeleton';

describe('FormSkeleton', () => {
  it('renders default 4 skeleton fields', () => {
    const { container } = render(<FormSkeleton />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(8);
  });

  it('renders custom number of fields', () => {
    const { container } = render(<FormSkeleton fields={2} />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(4);
  });
});
