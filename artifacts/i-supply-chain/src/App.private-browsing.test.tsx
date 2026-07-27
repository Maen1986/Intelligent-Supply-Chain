/**
 * App — private-browsing toast integration test
 *
 * Confirms that when the App mounts in an environment where localStorage is
 * blocked (private / incognito browsing), it immediately fires a Sonner toast
 * with id="storage-private-browsing".
 *
 * The test also simulates a full page reload by:
 *   1. Unmounting the App (cleanup)
 *   2. Resetting the storage-availability cache (what a module re-initialise
 *      does on every real page load)
 *   3. Re-mounting the App
 * …and asserts that the toast fires again, confirming the warning reappears
 * after a hard reload in private mode.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

/* ── mock sonner before anything that imports it ────────────────────────── */
vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), dismiss: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

/* ── mock heavy page/component imports to keep the test fast ────────────── */
vi.mock('@/lib/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ isAuthenticated: false, user: null, loading: false }),
}));

vi.mock('@/lib/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/ChatWidget', () => ({ ChatWidget: () => null }));
vi.mock('@/components/WhatsAppButton', () => ({ WhatsAppButton: () => null }));
vi.mock('@/components/AnnouncementBanner', () => ({ AnnouncementBanner: () => null }));
vi.mock('@/components/CommandCentreFloat', () => ({ CommandCentreFloat: () => null }));
vi.mock('@/hooks/useIPProtection', () => ({ useIPProtection: () => undefined }));

/* ── mock all page imports (they pull in heavy deps we don't need) ───────── */
vi.mock('@/pages/Home', () => ({ Home: () => null }));
vi.mock('@/pages/not-found', () => ({ default: () => null }));
vi.mock('@/pages/Diagnostic', () => ({ Diagnostic: () => null }));
vi.mock('@/pages/Consultant', () => ({ Consultant: () => null }));
vi.mock('@/pages/Csr', () => ({ Csr: () => null }));
vi.mock('@/pages/About', () => ({ About: () => null }));
vi.mock('@/pages/CaseStudies', () => ({ CaseStudies: () => null }));
vi.mock('@/pages/Insights', () => ({ Insights: () => null }));
vi.mock('@/pages/Intelligence', () => ({ Intelligence: () => null }));
vi.mock('@/pages/Maturity', () => ({ Maturity: () => null }));
vi.mock('@/pages/Login', () => ({ Login: () => null }));
vi.mock('@/pages/IndustryPage', () => ({ IndustryPage: () => null }));
vi.mock('@/pages/SolutionDetail', () => ({ SolutionDetail: () => null }));
vi.mock('@/pages/LeanSixSigma', () => ({ LeanSixSigma: () => null }));
vi.mock('@/pages/RiskManagement', () => ({ RiskManagement: () => null }));
vi.mock('@/pages/GovernanceCompliance', () => ({ GovernanceCompliance: () => null }));
vi.mock('@/pages/CommandCenter', () => ({ CommandCenter: () => null }));
vi.mock('@/pages/KraljicMatrix', () => ({ KraljicMatrix: () => null }));
vi.mock('@/pages/CustomerVoice', () => ({ CustomerVoice: () => null }));
vi.mock('@/pages/Legal', () => ({ Legal: () => null }));
vi.mock('@/pages/AdminLeads', () => ({ AdminLeads: () => null }));
vi.mock('@/pages/AdminIntegrations', () => ({ AdminIntegrations: () => null }));
vi.mock('@/pages/AccountSettings', () => ({ AccountSettings: () => null }));

/* ── import storage helpers and App AFTER mocks are set up ──────────────── */
import { toast } from 'sonner';
import { _resetStorageAvailabilityCache } from '@/lib/storage';
import App from './App';

// ─── helpers ─────────────────────────────────────────────────────────────────

function blockLocalStorage() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('App — private-browsing toast on mount', () => {
  beforeEach(() => {
    _resetStorageAvailabilityCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('fires toast.warning with id="storage-private-browsing" on first mount in private mode', () => {
    blockLocalStorage();
    render(<App />);

    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('Private browsing detected'),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );
  });

  it('does NOT fire the private-browsing toast in a normal (non-private) environment', () => {
    render(<App />);
    expect(toast.warning).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );
  });

  it('re-fires the toast after a simulated full page reload in private mode', () => {
    blockLocalStorage();

    // First page load
    render(<App />);
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('Private browsing detected'),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );

    // Simulate full page reload: unmount + reset module-level cache
    cleanup();
    _resetStorageAvailabilityCache();
    vi.clearAllMocks();

    // Second page load — toast must fire again
    render(<App />);
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('Private browsing detected'),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );
  });

  it('toast fires within the same tick as mount (no artificial delay)', () => {
    // The useEffect with [] runs synchronously in the jsdom test environment
    // after the component mounts — no timers, no await needed.
    blockLocalStorage();
    render(<App />);
    // If we reach this line the assertion already passed (no waitFor required)
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('Private browsing detected'),
      expect.objectContaining({ id: 'storage-private-browsing', duration: 8000 }),
    );
  });

  it('toast includes the Arabic translation of the warning message', () => {
    blockLocalStorage();
    render(<App />);
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('التصفح الخاص'),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );
  });
});
