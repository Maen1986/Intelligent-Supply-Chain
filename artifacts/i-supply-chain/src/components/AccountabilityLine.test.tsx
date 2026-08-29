/**
 * #375 -- Visible human-accountability labeling, platform-wide (30 Aug 2026).
 *
 * Confirms the shared AccountabilityLine component renders the correct
 * bilingual text and is actually wired into a real AI-output surface
 * (ContractReviewReport), not just defined and unused.
 */

import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AccountabilityLine } from '@/components/AccountabilityLine';
import { ContractReviewReport } from '@/components/ContractReviewReport';
import type { ReviewReportInput } from '@/lib/clmReviewEngine';

afterEach(() => cleanup());

describe('AccountabilityLine', () => {
  it('renders the English accountability line by default', () => {
    render(<AccountabilityLine />);
    expect(screen.getByText(/Reviewed against ISC's standards/i)).toBeTruthy();
    expect(screen.getByText(/escalate to Ma'in Alhaqash directly/i)).toBeTruthy();
  });

  it('renders the Arabic accountability line when ar is true', () => {
    render(<AccountabilityLine ar />);
    expect(screen.getByText(/تمت مراجعته وفق معايير/)).toBeTruthy();
    expect(screen.getByText(/مَعِين الحقش/)).toBeTruthy();
  });
});

describe('AccountabilityLine wired into ContractReviewReport (#375 real surface)', () => {
  const minimalInput: ReviewReportInput = {};

  it('shows the accountability line on the Contract Assurance Chain report (EN)', () => {
    render(<ContractReviewReport input={minimalInput} isAr={false} />);
    expect(screen.getByText(/Reviewed against ISC's standards/i)).toBeTruthy();
  });

  it('shows the accountability line on the Contract Assurance Chain report (AR)', () => {
    render(<ContractReviewReport input={minimalInput} isAr={true} />);
    expect(screen.getByText(/تمت مراجعته وفق معايير/)).toBeTruthy();
  });
});
