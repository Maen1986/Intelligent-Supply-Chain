import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { parseWorkspace, isEmptyWorkspace, useKraljicWorkspaceSync, type KraljicWorkspaceData } from './kraljicWorkspaceSync';

const EMPTY: KraljicWorkspaceData = { facts: {}, reviews: {}, extras: {}, ledger: [] };
const FULL: KraljicWorkspaceData = { facts: { s1: { qualifiedAlternatives: 2 } }, reviews: {}, extras: {}, ledger: [{ id: 'l1' }] };

describe('parseWorkspace / isEmptyWorkspace', () => {
  it('turns wrong shapes into empty, never throws', () => {
    expect(parseWorkspace(null)).toBeNull();
    expect(parseWorkspace('x')).toBeNull();
    expect(parseWorkspace([1])).toBeNull();
    const w = parseWorkspace({ facts: 'bad', reviews: [], extras: 5, ledger: 'no' })!;
    expect(isEmptyWorkspace(w)).toBe(true);
  });
  it('keeps good data and caps the ledger at 500', () => {
    const w = parseWorkspace({ facts: { a: 1 }, ledger: Array.from({ length: 600 }, (_, i) => i) })!;
    expect(w.facts).toEqual({ a: 1 });
    expect(w.ledger.length).toBe(500);
    expect(isEmptyWorkspace(w)).toBe(false);
  });
});

describe('useKraljicWorkspaceSync', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { vi.useFakeTimers(); fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  const ok = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

  it('does nothing for a visitor who is not signed in', async () => {
    const apply = vi.fn();
    const { result } = renderHook(() => useKraljicWorkspaceSync(null, FULL, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBe('idle');
  });

  it('loads the server copy on sign-in and applies it', async () => {
    fetchMock.mockImplementation(() => ok({ ok: true, workspace: { data: FULL } }));
    const apply = vi.fn();
    renderHook(() => useKraljicWorkspaceSync({ id: 1 }, EMPTY, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0][0].facts).toEqual(FULL.facts);
  });

  it('uploads the local copy when the server has nothing yet', async () => {
    fetchMock.mockImplementation((_u: string, init?: { method?: string }) => init?.method === 'PUT' ? ok({ ok: true }) : ok({ ok: true, workspace: null }));
    const apply = vi.fn();
    renderHook(() => useKraljicWorkspaceSync({ id: 1 }, FULL, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(apply).not.toHaveBeenCalled();
    const put = fetchMock.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(put).toBeTruthy();
    expect(JSON.parse(put![1].body).data.facts).toEqual(FULL.facts);
  });

  it('keeps local data and shows an error when the save fails', async () => {
    fetchMock.mockImplementation((_u: string, init?: { method?: string }) => init?.method === 'PUT' ? Promise.reject(new Error('offline')) : ok({ ok: true, workspace: null }));
    const apply = vi.fn();
    const { result } = renderHook(() => useKraljicWorkspaceSync({ id: 1 }, FULL, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(result.current).toBe('error');
    expect(apply).not.toHaveBeenCalled();
  });

  it('survives the server being unreachable on load', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error('down')));
    const apply = vi.fn();
    const { result } = renderHook(() => useKraljicWorkspaceSync({ id: 1 }, FULL, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(apply).not.toHaveBeenCalled();
    expect(result.current).not.toBe('saved');
  });

  it('saves again after a later edit (debounced)', async () => {
    fetchMock.mockImplementation((_u: string, init?: { method?: string }) => init?.method === 'PUT' ? ok({ ok: true }) : ok({ ok: true, workspace: { data: FULL } }));
    const apply = vi.fn();
    let cur = FULL;
    const { rerender } = renderHook(() => useKraljicWorkspaceSync({ id: 1 }, cur, apply));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    cur = { ...FULL, facts: { s1: { qualifiedAlternatives: 5 } } };
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    const puts = fetchMock.mock.calls.filter((c) => c[1]?.method === 'PUT');
    expect(puts.length).toBe(1);
    expect(JSON.parse(puts[0][1].body).data.facts.s1.qualifiedAlternatives).toBe(5);
  });
});
