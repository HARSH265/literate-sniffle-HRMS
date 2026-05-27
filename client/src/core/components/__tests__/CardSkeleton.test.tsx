import { describe, it, expect } from 'vitest';
import { render } from '../../../test/test-utils';
import { CardSkeleton } from '../CardSkeleton';

describe('CardSkeleton', () => {
  it('renders default 3 skeleton cards', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<CardSkeleton cards={5} />);
    const skeletons = container.querySelectorAll('.ant-skeleton');
    expect(skeletons.length).toBe(5);
  });
});
