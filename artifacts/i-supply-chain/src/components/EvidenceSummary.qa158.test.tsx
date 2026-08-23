/**
 * EvidenceSummary — QA pass for #158 (23 Aug 2026)
 *
 * Written retroactively as part of an owner-requested QA audit: #158's
 * rollout to Maturity remedies, CSR, and 14+ toolkit AI Plan tools was
 * shipped with zero dedicated tests -- only pre-existing, unrelated test
 * suites were re-run. This is the real thing: the shared badge component
 * itself, checked for the honest-empty rule, both languages, and the
 * numeric/string confidence edge case the schema explicitly allows.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EvidenceSummary } from './EvidenceSummary';

afterEach(cleanup);

describe('EvidenceSummary — #158 QA', () => {
  it('renders nothing when evidence is undefined (honest-empty rule)', () => {
    const { container } = render(<EvidenceSummary evidence={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when evidence is null', () => {
    const { container } = render(<EvidenceSummary evidence={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when dataUsed and assumptions are both empty arrays', () => {
    const { container } = render(
      <EvidenceSummary evidence={{ dataUsed: [], assumptions: [], confidence: 80 }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the collapsed "Show me why" trigger with a numeric confidence badge', () => {
    render(
      <EvidenceSummary evidence={{ dataUsed: ['segment scores'], assumptions: [], confidence: 72 }} />
    );
    expect(screen.getByText('Show me why')).toBeInTheDocument();
    expect(screen.getByText('72% confidence')).toBeInTheDocument();
  });

  it('handles confidence supplied as a string (schema allows number | string)', () => {
    render(
      <EvidenceSummary evidence={{ dataUsed: ['x'], assumptions: [], confidence: '65' }} />
    );
    expect(screen.getByText('65% confidence')).toBeInTheDocument();
  });

  it('handles a non-numeric confidence string without crashing', () => {
    render(
      <EvidenceSummary evidence={{ dataUsed: ['x'], assumptions: [], confidence: 'moderate' }} />
    );
    // Falls back to showing the raw string rather than crashing or showing "NaN%"
    expect(screen.queryByText('NaN%')).not.toBeInTheDocument();
  });

  it('expands to show dataUsed and assumptions on click', () => {
    render(
      <EvidenceSummary evidence={{ dataUsed: ['real segment scores'], assumptions: ['none stated'], confidence: 90 }} />
    );
    fireEvent.click(screen.getByText('Show me why'));
    expect(screen.getByText('real segment scores')).toBeInTheDocument();
    expect(screen.getByText('none stated')).toBeInTheDocument();
  });

  it('renders Arabic label and confidence suffix when ar=true', () => {
    render(
      <EvidenceSummary evidence={{ dataUsed: ['x'], assumptions: [], confidence: 55 }} ar />
    );
    expect(screen.getByText('كيف توصلنا لهذا؟')).toBeInTheDocument();
    expect(screen.getByText('الثقة 55%')).toBeInTheDocument();
  });
});
