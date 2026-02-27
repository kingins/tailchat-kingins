import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../useIsMobile';
import { useSearchParam } from '../useSearchParam';
import { useWindowSize } from '../useWindowSize';

describe('useWindowSize', () => {
  test('returns current window dimensions', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  test('updates on window resize', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useWindowSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(400);
  });
});

describe('useIsMobile', () => {
  test('returns true when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  test('returns false when width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe('useSearchParam', () => {
  test('returns null when param not in URL', () => {
    window.location = new URL('https://www.example.com/foo');

    const { result } = renderHook(() => useSearchParam('token'));

    expect(result.current).toBeNull();
  });

  test('returns param value when present in URL', () => {
    window.location = new URL('https://www.example.com/foo?token=abc123');

    const { result } = renderHook(() => useSearchParam('token'));

    expect(result.current).toBe('abc123');
  });
});
