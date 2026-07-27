/**
 * App — private-browsing early-warning test.
 *
 * Verifies that the App root component fires the private-browsing toast
 * immediately on mount when localStorage is blocked, so users are warned
 * before they invest any effort in the app.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/* ── mock sonner before any module that imports it ──────────────────────── */
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
  Toaster: () => null,
}));

/* ── mock heavy page/component imports so render stays fast ─────────────── */
vi.mock('@/components/Header',            () => ({ Header:            () => null }));
vi.mock('@/components/Footer',            () => ({ Footer:            () => null }));
vi.mock('@/components/ChatWidget',        () => ({ ChatWidget:        () => null }));
vi.mock('@/components/WhatsAppButton',    () => ({ WhatsAppButton:    () => null }));
vi.mock('@/components/AnnouncementBanner',() => ({ AnnouncementBanner:() => null }));
vi.mock('@/components/CommandCentreFloat',() => ({ CommandCentreFloat:() => null }));
vi.mock('@/hooks/useIPProtection',        () => ({ useIPProtection:   () => undefined }));

/* ── mock all pages so wouter route resolution doesn't pull them in ──────── */
vi.mock('@/pages/Home',                () => ({ Home:                () => null }));
vi.mock('@/pages/Diagnostic',          () => ({ Diagnostic:          () => null }));
vi.mock('@/pages/Consultant',          () => ({ Consultant:          () => null }));
vi.mock('@/pages/Csr',                 () => ({ Csr:                 () => null }));
vi.mock('@/pages/About',               () => ({ About:               () => null }));
vi.mock('@/pages/CaseStudies',         () => ({ CaseStudies:         () => null }));
vi.mock('@/pages/Insights',            () => ({ Insights:            () => null }));
vi.mock('@/pages/Intelligence',        () => ({ Intelligence:        () => null }));
vi.mock('@/pages/Maturity',            () => ({ Maturity:            () => null }));
vi.mock('@/pages/Login',               () => ({ Login:               () => null }));
vi.mock('@/pages/IndustryPage',        () => ({ IndustryPage:        () => null }));
vi.mock('@/pages/SolutionDetail',      () => ({ SolutionDetail:      () => null }));
vi.mock('@/pages/LeanSixSigma',        () => ({ LeanSixSigma:        () => null }));
vi.mock('@/pages/RiskManagement',      () => ({ RiskManagement:      () => null }));
vi.mock('@/pages/GovernanceCompliance',() => ({ GovernanceCompliance:() => null }));
vi.mock('@/pages/CommandCenter',       () => ({ CommandCenter:       () => null }));
vi.mock('@/pages/CustomerVoice',       () => ({ CustomerVoice:       () => null }));
vi.mock('@/pages/Legal',               () => ({ Legal:               () => null }));
vi.mock('@/pages/AdminLeads',          () => ({ AdminLeads:          () => null }));
vi.mock('@/pages/AdminIntegrations',   () => ({ AdminIntegrations:   () => null }));
vi.mock('@/pages/AccountSettings',     () => ({ AccountSettings:     () => null }));
vi.mock('@/pages/not-found',           () => ({ default:             () => null }));

/* ── mock @tanstack/react-query so QueryClientProvider renders without fuss */
vi.mock('@tanstack/react-query', () => ({
  QueryClient: class {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { toast } from 'sonner';
import { _resetStorageAvailabilityCache } from '@/lib/storage';
import App from './App';

function makeSecurityError(): DOMException {
  return new DOMException('The operation is insecure.', 'SecurityError');
}

describe('App — private-browsing early warning on mount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore the availability cache so other test suites are not affected.
    _resetStorageAvailabilityCache();
  });

  it('fires toast.warning with id="storage-private-browsing" immediately on mount when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => { throw makeSecurityError(); });
    _resetStorageAvailabilityCache();

    render(<App />);

    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringMatching(/private browsing/i),
      expect.objectContaining({ id: 'storage-private-browsing' }),
    );

    spy.mockRestore();
  });

  it('does NOT fire toast.warning on mount when storage is available normally', () => {
    // jsdom localStorage is available by default — no spy needed
    _resetStorageAvailabilityCache();

    render(<App />);

    expect(toast.warning).not.toHaveBeenCalled();
  });
});
