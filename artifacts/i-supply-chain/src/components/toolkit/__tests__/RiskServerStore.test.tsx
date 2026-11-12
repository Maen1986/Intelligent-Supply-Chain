/**
 * #866 risk register server store: sign-in sync and one-time import from the browser.
 * Guests never call the server. Signed-in users load their register from the account;
 * if the account is empty and the browser holds a register, they are offered an import.
 */
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const auth = vi.hoisted(() => ({ user: null as null | { id: number } }));
vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: auth.user, isAuthenticated: !!auth.user, loading: false }),
}));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(),
    savedPlan: null, viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));
vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

import { RiskToolsSection } from '../RiskTools';

const LOCAL = {
  id: 'local1', category: 'supply', description: 'Local-only risk', driver: '', affectedArea: '',
  likelihood: 4, impact: 4, velocity: 'medium', mitigationAction: '', owner: '', dueDate: '',
  status: 'open', mitigationStatus: 'not-started', residualLikelihood: 2, residualImpact: 2,
};
const SERVER_ROW = {
  id: 9, clientKey: 'srv1', category: 'cyber', description: 'Server-side risk', driver: '', affectedArea: '',
  likelihood: 5, impact: 3, velocity: 'fast', mitigationAction: '', owner: '', dueDate: '',
  status: 'open', mitigationStatus: 'not-started', residualLikelihood: 2, residualImpact: 2,
};

let fetchMock: ReturnType<typeof vi.fn>;
function serverReturns(risks: unknown[]) {
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') return { ok: true, json: async () => ({ ok: true, risks: [] }) };
    return { ok: true, json: async () => ({ ok: true, risks }) };
  });
  vi.stubGlobal('fetch', fetchMock);
}
const openRegister = () => fireEvent.click(screen.getByRole('tab', { name: /Risk Register/ }));
const putCalls = () => fetchMock.mock.calls.filter(c => (c[1] as RequestInit | undefined)?.method === 'PUT');

beforeEach(() => { localStorage.clear(); auth.user = null; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('risk register server store (#866)', () => {
  it('guest: never calls the server and shows no store banner', async () => {
    serverReturns([]);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={false} />);
    openRegister();
    await new Promise(r => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('risk-store-status')).toBeNull();
  });

  it('signed in, account has a register: it replaces the browser copy', async () => {
    auth.user = { id: 5 };
    serverReturns([SERVER_ROW]);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={false} />);
    openRegister();
    await waitFor(() => expect(screen.getByDisplayValue('Server-side risk')).toBeTruthy());
    expect(screen.queryByDisplayValue('Local-only risk')).toBeNull();
    expect(putCalls().length).toBe(0);
  });

  it('signed in, account empty, browser has a register: offers import, and Import sends it once', async () => {
    auth.user = { id: 5 };
    serverReturns([]);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={false} />);
    openRegister();
    await waitFor(() => expect(screen.getByText(/We found a risk register saved in this browser \(1\)/)).toBeTruthy());
    expect(putCalls().length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => expect(putCalls().length).toBe(1));
    const body = JSON.parse((putCalls()[0][1] as RequestInit).body as string);
    expect(body.risks).toHaveLength(1);
    expect(body.risks[0].clientKey).toBe('local1');
    expect(body.risks[0].dataSource).toBe('imported-file');
    expect(body.risks[0]).not.toHaveProperty('score');
  });

  it('Not now keeps the browser register and never writes to the account', async () => {
    auth.user = { id: 5 };
    serverReturns([]);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={false} />);
    openRegister();
    await waitFor(() => screen.getByRole('button', { name: 'Not now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.getByText(/stays here and is not saved to your account/)).toBeTruthy();
    expect(screen.getByDisplayValue('Local-only risk')).toBeTruthy();
    await new Promise(r => setTimeout(r, 500));
    expect(putCalls().length).toBe(0);
  });

  it('Arabic banner is Arabic and carries no Latin brand', async () => {
    auth.user = { id: 5 };
    serverReturns([]);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={true} />);
    fireEvent.click(screen.getByRole('tab', { name: /سجل المخاطر/ }));
    await waitFor(() => screen.getByRole('button', { name: 'استيراد' }));
    const txt = screen.getByTestId('risk-store-status').textContent || '';
    expect(txt).toMatch(/[؀-ۿ]/);
    expect(txt).not.toMatch(/ISC/);
  });

  it('server unreachable: no crash, browser copy stays, honest status', async () => {
    auth.user = { id: 5 };
    fetchMock = vi.fn(async () => { throw new Error('offline'); });
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('isc-tool-risk-register-v2', JSON.stringify([LOCAL]));
    render(<RiskToolsSection isAr={false} />);
    openRegister();
    await waitFor(() => expect(screen.getByText(/Not saved to your account yet/)).toBeTruthy());
    expect(screen.getByDisplayValue('Local-only risk')).toBeTruthy();
  });
});
