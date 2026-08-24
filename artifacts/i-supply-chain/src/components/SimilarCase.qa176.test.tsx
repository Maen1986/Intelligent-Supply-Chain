/**
 * SimilarCase — QA pass for #176 Similar Case Matching (24 Aug 2026)
 *
 * Built into the initial pass (not bolted on after) per Decision Record
 * 8.6 Addendum 3. Covers: honest-empty rule (renders nothing with no
 * similarCase), the real challenge/challengeSummary fallback (uses the raw
 * challenge text when the AI-generated summary is absent -- never
 * fabricates a summary that was never produced), the industry named in the
 * copy matches the real match field, the link to /my-assessments (the
 * actual existing page listing past diagnostic submissions), and Arabic
 * labels. Honesty check: the copy always says "similar-industry," never
 * "similar problem" -- this is a categorical dropdown match, not a claim
 * of semantic similarity the underlying data cannot prove.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SimilarCase } from './EvidenceSummary';

afterEach(cleanup);

const CASE_WITH_SUMMARY = {
  challenge: 'Warehouse pick errors rising, WMS mis-slotting suspected',
  challengeSummary: 'Pick-accuracy declining due to WMS mis-slotting',
  industry: 'FMCG',
  subIndustry: 'Retail',
  takenAt: '2026-07-01T00:00:00Z',
};

const CASE_WITHOUT_SUMMARY = {
  challenge: 'Raw challenge text with no AI summary on file',
  challengeSummary: null,
  industry: 'Manufacturing',
  subIndustry: null,
  takenAt: '2026-06-15T00:00:00Z',
};

describe('SimilarCase — #176 QA', () => {
  it('renders nothing when similarCase is null (honest-empty rule)', () => {
    const { container } = render(<SimilarCase similarCase={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when similarCase is undefined', () => {
    const { container } = render(<SimilarCase similarCase={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the real challengeSummary when present, names the matched industry, links to /my-assessments', () => {
    render(<SimilarCase similarCase={CASE_WITH_SUMMARY} />);
    expect(screen.getByText(/Pick-accuracy declining due to WMS mis-slotting/)).toBeInTheDocument();
    expect(screen.getByText(/FMCG/)).toBeInTheDocument();
    const link = screen.getByText('View that prior diagnosis').closest('a');
    expect(link?.getAttribute('href')).toBe('/my-assessments');
  });

  it('falls back to the raw challenge text when no AI challengeSummary was ever generated (never fabricates one)', () => {
    render(<SimilarCase similarCase={CASE_WITHOUT_SUMMARY} />);
    expect(screen.getByText(/Raw challenge text with no AI summary on file/)).toBeInTheDocument();
  });

  it('says "similar-industry," never claims a semantic "similar problem" match', () => {
    render(<SimilarCase similarCase={CASE_WITH_SUMMARY} />);
    expect(screen.getByText(/similar-industry challenge/)).toBeInTheDocument();
    expect(screen.queryByText(/similar problem/i)).not.toBeInTheDocument();
  });

  it('renders Arabic labels when ar=true', () => {
    render(<SimilarCase similarCase={CASE_WITH_SUMMARY} ar />);
    expect(screen.getByText(/لديك تشخيص سابق لنفس القطاع/)).toBeInTheDocument();
    expect(screen.getByText('عرض التشخيص السابق')).toBeInTheDocument();
  });
});
