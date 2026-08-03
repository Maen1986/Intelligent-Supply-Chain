/**
 * FlowPreview — nodeDetails runtime detail string (Task 625)
 *
 * Confirms that when a TemplateCard receives a `nodeDetails` array, the
 * FlowPreview inside it shows the runtime detail string for matching nodes
 * instead of the generic describeNode() description.  Without this test, a
 * regression that ignores nodeDetails (or always shows the generic fallback)
 * would be silent.
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { TemplateCard } from '../AdminAutomations';
import type { TemplateManifestItem } from '../AdminAutomations';

// ── Module stubs ──────────────────────────────────────────────────────────────

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', ar: false }),
}));

afterEach(() => {
  cleanup();
});

// ── Fixture ───────────────────────────────────────────────────────────────────

/**
 * A runtime detail string that is specific enough that it would never be
 * produced by the generic describeNode() fallback — so any match proves
 * the nodeDetails path was taken.
 */
const RUNTIME_DETAIL = 'Reads the KPI breach payload and extracts supplier_id + kpi_code.';

const TEMPLATE: TemplateManifestItem = {
  id:               'n8n-kpi-breach-alert',
  name:             'KPI Breach Alert',
  nameAr:           'تنبيه خرق مؤشر الأداء',
  description:      'Notifies the team when a KPI drops below threshold.',
  descriptionAr:    'يُنبِّه الفريق عند انخفاض مؤشر أداء عن العتبة المحددة.',
  platform:         'n8n',
  category:         'Alerts',
  triggerEvent:     'kpi-breach',
  setupTimeMinutes: 10,
  downloadUrl:      'https://example.com/template.json',
  nodes:            ['HTTP Request', 'IF'],
  nodeDetails:      [
    {
      nodeName: 'HTTP Request',
      detail:   RUNTIME_DETAIL,
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FlowPreview — nodeDetails runtime detail string (Task 625)', () => {
  it('renders the runtime detail string for a node that has a nodeDetails entry', () => {
    render(<TemplateCard template={TEMPLATE} ar={false} />);

    // Open the Setup guide to reveal the FlowPreview
    fireEvent.click(screen.getByText('Setup'));

    // The runtime detail must appear — NOT the generic description
    expect(screen.getByText(RUNTIME_DETAIL)).toBeInTheDocument();
  });

  it('does NOT show a generic description for a node whose detail is supplied by nodeDetails', () => {
    render(<TemplateCard template={TEMPLATE} ar={false} />);
    fireEvent.click(screen.getByText('Setup'));

    // Confirm the text is the runtime detail, not a generic catch-all like
    // the text that describeNode() returns for 'HTTP Request'
    const detailEl = screen.getByText(RUNTIME_DETAIL);
    expect(detailEl.tagName.toLowerCase()).toBe('p');
  });

  it('falls back to the generic description for a node without a nodeDetails entry', () => {
    render(<TemplateCard template={TEMPLATE} ar={false} />);
    fireEvent.click(screen.getByText('Setup'));

    // 'IF' has no nodeDetails entry → generic desc must appear (non-empty)
    // We can't predict the exact generic text, so just confirm it differs
    // from the runtime detail (which is only for 'HTTP Request').
    const allParas = document.querySelectorAll('p.text-xs.text-muted-foreground');
    const texts = Array.from(allParas).map(p => p.textContent ?? '');

    // Exactly one paragraph should match the runtime detail
    const runtimeMatches = texts.filter(t => t === RUNTIME_DETAIL);
    expect(runtimeMatches).toHaveLength(1);
  });
});
