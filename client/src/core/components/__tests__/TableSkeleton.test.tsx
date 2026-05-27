import { describe, it, expect } from 'vitest';
import { render } from '../../../test/test-utils';
import { TableSkeleton } from '../TableSkeleton';

describe('TableSkeleton', () => {
  it('renders default 10 skeleton rows', () => {
    const { container } = render(<TableSkeleton />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(11);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(4);
  });
});
