/**
 * useAIPlan hook — unit tests
 *
 * Confirms:
 *   1. Initial idle state (no loading / result / error)
 *   2. generate() sets loading=true immediately
 *   3. Happy path: loading→false, result populated
 *   4. Prompt text and language param are forwarded to the API
 *   5. isAr=true sends language='ar'
 *   6. API error response → error state
 *   7. Network failure → error state
 *   8. reset() clears all state
 *   9. Second generate() aborts the first in-flight request
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

const MOCK_PLAN = '## Improvement Plan\n- Action one [HIGH]\n- Action two [MEDIUM]';

function stubFetchOk(text = MOCK_PLAN) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, text }),
    }),
  );
}

function stubFetchApiError(errorMsg = 'Could not generate — try again') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: errorMsg }),
    }),
  );
}

function stubFetchNetworkError(msg = 'Network failure') {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(msg)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAIPlan — initial state', () => {
  it('starts in idle state: loading=false, result=null, error=null', () => {
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('useAIPlan — generate() happy path', () => {
  it('sets loading=true immediately when generate() is called', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // never resolves
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    act(() => { result.current.generate(); });

    expect(result.current.loading).toBe(true);
  });

  it('clears loading and sets result on success', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(MOCK_PLAN);
    expect(result.current.error).toBeNull();
  });

  it('sends the exact prompt string to POST /ai/plan', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'my exact prompt', false));

    await act(() => result.current.generate());

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/ai/plan');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body as string);
    expect(body.prompt).toBe('my exact prompt');
  });

  it('sends language=en when isAr=false', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(opts.body as string).language).toBe('en');
  });

  it('sends language=ar when isAr=true', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'prompt', true));

    await act(() => result.current.generate());

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(opts.body as string).language).toBe('ar');
  });

  it('includes credentials: include in the request', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.credentials).toBe('include');
  });
});

describe('useAIPlan — error paths', () => {
  it('sets error when the API returns ok=false', async () => {
    stubFetchApiError('Generation failed — quota exceeded');
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('Generation failed — quota exceeded');
  });

  it('sets error on network failure', async () => {
    stubFetchNetworkError('Connection refused');
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Connection refused');
    expect(result.current.result).toBeNull();
  });

  it('sets error when HTTP response is not ok and json has no error field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }),
    );
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    await act(() => result.current.generate());

    expect(result.current.error).toBeTruthy();
  });

  it('calling generate() again after error resets the error and retries', async () => {
    stubFetchApiError('First failure');
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    await act(() => result.current.generate());
    expect(result.current.error).toBeTruthy();

    // Now stub success
    stubFetchOk('Second attempt succeeded');
    await act(() => result.current.generate());

    expect(result.current.error).toBeNull();
    expect(result.current.result).toBe('Second attempt succeeded');
  });
});

describe('useAIPlan — reset()', () => {
  it('clears result after a successful generate', async () => {
    stubFetchOk();
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    await act(() => result.current.generate());
    expect(result.current.result).toBe(MOCK_PLAN);

    act(() => result.current.reset());

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('clears error state', async () => {
    stubFetchApiError('Some error');
    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));
    await act(() => result.current.generate());
    expect(result.current.error).toBeTruthy();

    act(() => result.current.reset());

    expect(result.current.error).toBeNull();
  });
});

describe('useAIPlan — abort behaviour', () => {
  it('a second generate() call supersedes the first; only the second result is shown', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: never resolves (simulates slow request)
          return new Promise(() => {});
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, text: 'second-result' }),
        });
      }),
    );

    const { result } = renderHook(() => useAIPlan(() => 'prompt', false));

    act(() => { result.current.generate(); }); // first call, still in-flight
    await act(() => result.current.generate()); // second call aborts first

    expect(result.current.result).toBe('second-result');
    expect(result.current.loading).toBe(false);
  });
});
