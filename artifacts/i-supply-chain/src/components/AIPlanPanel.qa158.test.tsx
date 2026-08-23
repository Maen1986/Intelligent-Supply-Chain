/**
 * AIPlanPanel — QA pass for #158's evidenceSummary prop (23 Aug 2026)
 *
 * Written retroactively as part of an owner-requested QA audit. This panel
 * is shared by all 14+ toolkit "Generate AI Plan" tools; the evidenceSummary
 * prop added for #158 had no dedicated test anywhere -- only the pre-existing
 * suite (which knows nothing about this prop) was re-run.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AIPlanPanel } from './AIPlanPanel';

const mockUseAuth = vi.fn(() => ({ isAuthenticated: true, loading: false }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

afterEach(cleanup);

const noop = vi.fn();

function renderResult(props: { evidenceSummary?: any; isAr?: boolean } = {}) {
  return render(
    <AIPlanPanel
      loading={false}
      result={'## Plan\n- Reduce lead time [HIGH]'}
      evidenceSummary={props.evidenceSummary}
      error={null}
      onGenerate={noop}
      onReset={noop}
      buttonLabel="Generate ✨"
      isAr={props.isAr ?? false}
      savedPlan={null}
    />,
  );
}

describe('AIPlanPanel — #158 evidenceSummary QA', () => {
  it('shows a real plan result with no badge when evidenceSummary is undefined (fallback/legacy path)', () => {
    renderResult({ evidenceSummary: undefined });
    expect(screen.getByText('Reduce lead time')).toBeInTheDocument();
    expect(screen.queryByText('Show me why')).not.toBeInTheDocument();
  });

  it('shows the evidence badge under the plan when evidenceSummary is present', () => {
    renderResult({
      evidenceSummary: { dataUsed: ['user-entered KRI register'], assumptions: [], confidence: 78 },
    });
    expect(screen.getByText('Reduce lead time')).toBeInTheDocument();
    expect(screen.getByText('Show me why')).toBeInTheDocument();
    expect(screen.getByText('78% confidence')).toBeInTheDocument();
  });

  it('renders correctly in Arabic with RTL evidence labels', () => {
    renderResult({
      isAr: true,
      evidenceSummary: { dataUsed: ['بيانات المستخدم'], assumptions: [], confidence: 60 },
    });
    expect(screen.getByText('كيف توصلنا لهذا؟')).toBeInTheDocument();
  });

  it('does not crash when the saved-plan view has no evidenceSummary (viewSaved never sets it)', () => {
    // Mirrors useAIPlan.viewSaved() behaviour: text is restored, evidenceSummary stays undefined.
    renderResult({ evidenceSummary: undefined });
    expect(screen.queryByText('Show me why')).not.toBeInTheDocument();
  });
});
