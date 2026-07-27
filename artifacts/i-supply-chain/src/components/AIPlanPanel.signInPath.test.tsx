/**
 * Task 236 — Confirm the 'Sign in to generate' button passes the correct
 * return path for every toolkit panel.
 *
 * Covers:
 *  - AIPlanPanel mounted at each known toolkit path; clicking the sign-in
 *    button must navigate to /login?from=<encoded-path>.
 *  - Login component: after a successful login the component calls
 *    navigate(redirectTo) with the decoded `from` query-param value.
 *  - Login component: after a successful registration the same redirect fires.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AIPlanPanel } from './AIPlanPanel';
import { Login } from '@/pages/Login';

/* ── Shared navigate spy ──────────────────────────────────────────────── */
const mockNavigate = vi.fn();

/* ── Mock wouter ─────────────────────────────────────────────────────── */
// We control `location` per-test via `mockLocation`.
let mockLocation = '/';

vi.mock('wouter', () => ({
  useLocation: () => [mockLocation, mockNavigate],
  useSearch:   () => new URLSearchParams(mockSearch).toString()
    // useSearch returns the raw search string (without '?')
    ? mockSearch
    : '',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

// `mockSearch` is used by the Login tests (controls ?from=...)
let mockSearch = '';

/* ── Mock AuthContext ─────────────────────────────────────────────────── */
const mockLogin    = vi.fn();
const mockRegister = vi.fn();
const mockUseAuth  = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ── Mock LanguageContext (needed by Login) ───────────────────────────── */
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en' }),
}));

/* ── Mock apiBase (needed by Login) ──────────────────────────────────── */
vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Helpers ─────────────────────────────────────────────────────────── */

function renderPanel() {
  return render(
    <AIPlanPanel
      loading={false}
      result={null}
      error={null}
      onGenerate={vi.fn()}
      onReset={vi.fn()}
      buttonLabel="Generate Plan ✨"
      isAr={false}
    />,
  );
}

function clickSignIn() {
  const btn = screen.getByText(/Sign in to generate an AI plan/i).closest('button');
  expect(btn).toBeTruthy();
  fireEvent.click(btn!);
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockLogin.mockClear();
  mockRegister.mockClear();
  // Default: not authenticated
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
    loading: false,
    login:          mockLogin,
    register:       mockRegister,
    logout:         vi.fn(),
    changePassword: vi.fn(),
    updateProfile:  vi.fn(),
  });
});

afterEach(cleanup);

/* ══════════════════════════════════════════════════════════════════════
   1. AIPlanPanel — sign-in button encodes the correct path per toolkit panel
══════════════════════════════════════════════════════════════════════ */

describe('AIPlanPanel — sign-in button return path', () => {
  /**
   * Toolkit panels and the page routes they live at (from App.tsx routing):
   *   SupplierScorecard  → /command-center
   *   MaturityTools      → /command-center
   *   RiskTools          → /command-center
   *   TrainingTools      → /command-center
   *   KPIDashboard       → /maturity
   *
   * All five panels embed AIPlanPanel; the button must encode whatever path
   * useLocation() returns so login can redirect back to the right page.
   */
  const TOOLKIT_PATHS: { panel: string; path: string }[] = [
    { panel: 'SupplierScorecard',  path: '/command-center' },
    { panel: 'MaturityTools',      path: '/command-center' },
    { panel: 'RiskTools',          path: '/command-center' },
    { panel: 'TrainingTools',      path: '/command-center' },
    { panel: 'KPIDashboard',       path: '/maturity' },
  ];

  for (const { panel, path } of TOOLKIT_PATHS) {
    it(`navigates to /login?from=<encoded path> for ${panel} (path=${path})`, () => {
      mockLocation = path;
      renderPanel();

      clickSignIn();

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        `/login?from=${encodeURIComponent(path)}`,
      );
    });
  }

  it('preserves query-string and hash in the from param if present', () => {
    const pathWithQuery = '/command-center?supplier=42';
    mockLocation = pathWithQuery;
    renderPanel();

    clickSignIn();

    expect(mockNavigate).toHaveBeenCalledWith(
      `/login?from=${encodeURIComponent(pathWithQuery)}`,
    );
  });

  it('encodes special characters in the path correctly', () => {
    mockLocation = '/command-center';
    renderPanel();

    clickSignIn();

    // %2F must appear in the encoded string (forward-slash is encoded)
    const call = mockNavigate.mock.calls[0][0] as string;
    expect(call.startsWith('/login?from=')).toBe(true);
    expect(call).not.toContain('/command-center'); // raw slash must be encoded
    expect(decodeURIComponent(call.split('from=')[1])).toBe('/command-center');
  });

  it('does not navigate when the user is already authenticated (Generate button shown)', () => {
    mockLocation = '/command-center';
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1 },
      loading: false,
      login:          mockLogin,
      register:       mockRegister,
      logout:         vi.fn(),
      changePassword: vi.fn(),
      updateProfile:  vi.fn(),
    });
    renderPanel();

    // Sign-in prompt must not appear
    expect(screen.queryByText(/Sign in to generate an AI plan/i)).toBeNull();
    // Navigate must not have been called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════
   2. Login — redirects to the decoded `from` path after successful login
══════════════════════════════════════════════════════════════════════ */

describe('Login — post-login redirect uses decoded `from` param', () => {
  beforeEach(() => {
    // Stub fetch used in handleLogin (no real server in unit tests)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Helper: switch to the Sign In tab and return the submit button.
   * The Login page has two buttons with "Sign In" text — the tab switcher
   * and the form submit.  We click the tab first, then locate the submit
   * button by its `type="submit"` attribute to avoid ambiguity.
   */
  function switchToLoginTab() {
    // The tab buttons are plain <button> elements (not type="submit")
    const tabs = screen.getAllByRole('button').filter(
      b => b.textContent?.trim() === 'Sign In' && b.getAttribute('type') !== 'submit',
    );
    fireEvent.click(tabs[0]);
  }

  function getLoginSubmitBtn() {
    // The submit button inside the sign-in form carries type="submit"
    const btns = screen.getAllByRole('button').filter(
      b => b.getAttribute('type') === 'submit',
    );
    return btns[0];
  }

  async function fillAndSubmitLogin(email: string, password: string) {
    const [emailInput] = screen.getAllByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: email } });
    const passInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(passInputs[0], { target: { value: password } });
    fireEvent.click(getLoginSubmitBtn());
  }

  it('navigates to /command-center after login when from=/command-center', async () => {
    mockSearch = 'from=%2Fcommand-center';
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'password123');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/command-center');
    });
  });

  it('navigates to /maturity after login when from=/maturity', async () => {
    mockSearch = 'from=%2Fmaturity';
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'password123');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/maturity');
    });
  });

  it('falls back to / when no from param is present', async () => {
    mockSearch = '';
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'password123');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to decoded path after successful registration', async () => {
    mockSearch = 'from=%2Fcommand-center';
    mockRegister.mockResolvedValue(undefined);

    render(<Login />);

    // Default tab is register — fill in all required registration fields
    fireEvent.change(screen.getByPlaceholderText(/Ahmed Al-Rashid/i), { target: { value: 'Test User' } });

    const [emailInput] = screen.getAllByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });

    const passInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(passInputs[0], { target: { value: 'password123' } });

    fireEvent.change(screen.getByPlaceholderText(/\+966/i), { target: { value: '+966501234567' } });
    fireEvent.change(screen.getByPlaceholderText(/Supply Chain Manager/i), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByPlaceholderText(/Saudi Aramco/i), { target: { value: 'Test Corp' } });

    // The register submit button text is "Create Account & Continue"
    const createBtn = screen.getByRole('button', { name: /Create Account & Continue/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/command-center');
    });
  });

  it('falls back to / when the from param is an absolute URL (open-redirect guard)', async () => {
    // Simulate a tampered from param pointing to an external site
    mockSearch = 'from=https%3A%2F%2Fevil.com%2Fphish';
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'password123');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('falls back to / when the from param is a protocol-relative URL (//evil.com bypass guard)', async () => {
    // Protocol-relative URLs start with '//' — they pass a naive startsWith('/')
    // check but navigate the browser to an external origin.
    mockSearch = 'from=%2F%2Fevil.com%2Fphish';
    mockLogin.mockResolvedValue(undefined);

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'password123');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('falls back to / on registration when the from param is a protocol-relative URL (//evil.com bypass guard)', async () => {
    // Same guard must fire on the registration path, not just the sign-in path.
    mockSearch = 'from=%2F%2Fevil.com%2Fphish';
    mockRegister.mockResolvedValue(undefined);

    render(<Login />);

    // Default tab is register — fill in all required registration fields
    fireEvent.change(screen.getByPlaceholderText(/Ahmed Al-Rashid/i), { target: { value: 'Test User' } });
    const [emailInput] = screen.getAllByPlaceholderText('you@company.com');
    fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
    const passInputs = document.querySelectorAll('input[type="password"]');
    fireEvent.change(passInputs[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/\+966/i), { target: { value: '+966501234567' } });
    fireEvent.change(screen.getByPlaceholderText(/Supply Chain Manager/i), { target: { value: 'Manager' } });
    fireEvent.change(screen.getByPlaceholderText(/Saudi Aramco/i), { target: { value: 'Test Corp' } });

    const createBtn = screen.getByRole('button', { name: /Create Account & Continue/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not redirect when login fails', async () => {
    mockSearch = 'from=%2Fcommand-center';
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<Login />);
    switchToLoginTab();
    await fillAndSubmitLogin('user@test.com', 'wrongpass');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    // navigate must NOT have been called on failure
    expect(mockNavigate).not.toHaveBeenCalled();
    // Error message must appear
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });
});
