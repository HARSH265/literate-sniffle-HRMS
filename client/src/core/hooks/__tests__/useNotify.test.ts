import { describe, it, expect } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { useNotify } from '../useNotify';

describe('useNotify', () => {
  it('returns all notification methods', () => {
    const { result } = renderHook(() => useNotify());

    expect(result.current).toHaveProperty('success');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('warning');
    expect(result.current).toHaveProperty('info');

    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.warning).toBe('function');
    expect(typeof result.current.info).toBe('function');
  });
});
