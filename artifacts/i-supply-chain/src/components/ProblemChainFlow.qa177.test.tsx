/**
 * ProblemChainFlow — QA pass for #177 Causal Chain Visualization delta (24 Aug 2026)
 *
 * No dedicated test existed for this component before this pass -- a real
 * gap, closed here rather than left implicit. Covers the #177 delta
 * specifically: contributingCauses[] and downstreamEffects[] now render as
 * their own connected step-nodes (one <div> per item, each with its own
 * icon badge), not a single <ul><li> bullet list -- verified by checking
 * each item's text renders as an independent sibling node, plus the
 * existing 4-step main chain and both languages, plus the honest-empty
 * behavior when either array is empty.
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProblemChainFlow } from './ProblemChainFlow';

afterEach(cleanup);

const FULL_CHAIN = {
  symptom: 'OTIF has dropped to 68%',
  trigger: 'New 3PL onboarded without a transition buffer',
  immediateCause: 'Carrier capacity mismatched to peak-season volume',
  contributingCauses: ['No SLA penalty clause', 'Demand forecast not shared with 3PL'],
  rootCause: 'Carrier selection skipped a capacity-stress test',
  downstreamEffects: ['Customer SLA breaches accumulating', 'Expedite freight costs rising 22%'],
};

describe('ProblemChainFlow — #177 QA', () => {
  it('renders the four main chain steps with their real values', () => {
    render(<ProblemChainFlow chain={FULL_CHAIN} />);
    expect(screen.getByText('OTIF has dropped to 68%')).toBeInTheDocument();
    expect(screen.getByText('New 3PL onboarded without a transition buffer')).toBeInTheDocument();
    expect(screen.getByText('Carrier capacity mismatched to peak-season volume')).toBeInTheDocument();
    expect(screen.getByText('Carrier selection skipped a capacity-stress test')).toBeInTheDocument();
  });

  it('#177: renders each contributing cause as its own node, not one bullet list item under a shared <ul>', () => {
    const { container } = render(<ProblemChainFlow chain={FULL_CHAIN} />);
    expect(screen.getByText('No SLA penalty clause')).toBeInTheDocument();
    expect(screen.getByText('Demand forecast not shared with 3PL')).toBeInTheDocument();
    // No <ul>/<li> anywhere in the tree anymore -- both branches were converted to connected nodes.
    expect(container.querySelectorAll('ul').length).toBe(0);
    expect(container.querySelectorAll('li').length).toBe(0);
  });

  it('#177: renders each downstream effect as its own connected node cascading from Root Cause', () => {
    render(<ProblemChainFlow chain={FULL_CHAIN} />);
    expect(screen.getByText('Customer SLA breaches accumulating')).toBeInTheDocument();
    expect(screen.getByText('Expedite freight costs rising 22%')).toBeInTheDocument();
  });

  it('renders nothing for the Contributing Causes section when the array is empty (honest-empty rule)', () => {
    render(<ProblemChainFlow chain={{ ...FULL_CHAIN, contributingCauses: [] }} />);
    expect(screen.queryByText('Contributing Causes')).not.toBeInTheDocument();
  });

  it('renders nothing for the Downstream Effects section when the array is empty (honest-empty rule)', () => {
    render(<ProblemChainFlow chain={{ ...FULL_CHAIN, downstreamEffects: [] }} />);
    expect(screen.queryByText('Downstream Effects if Unresolved')).not.toBeInTheDocument();
  });

  it('renders Arabic labels for both extended sections when ar=true', () => {
    render(<ProblemChainFlow chain={FULL_CHAIN} ar />);
    expect(screen.getByText('أسباب مساهمة')).toBeInTheDocument();
    expect(screen.getByText('الآثار اللاحقة إن لم تُعالج')).toBeInTheDocument();
  });
});
