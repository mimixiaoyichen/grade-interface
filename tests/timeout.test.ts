import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithTimeout, withTimeout } from '../utils/timeout';

describe('timeout helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('aborts fetches that do not finish', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn((_input: any, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });

    const request = fetchWithTimeout('/api/transcribe', {}, 100, 'timed out');
    const assertion = expect(request).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(100);

    await assertion;
  });

  it('returns fetch responses before the timeout', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await fetchWithTimeout('/api/transcribe', {}, 100, 'timed out');

    expect(response.status).toBe(200);
  });

  it('rejects slow promises with a useful timeout error', async () => {
    vi.useFakeTimers();

    const promise = withTimeout(new Promise<string>(() => undefined), 100, 'cleanup timed out');
    const assertion = expect(promise).rejects.toThrow('cleanup timed out');
    await vi.advanceTimersByTimeAsync(100);

    await assertion;
  });
});
