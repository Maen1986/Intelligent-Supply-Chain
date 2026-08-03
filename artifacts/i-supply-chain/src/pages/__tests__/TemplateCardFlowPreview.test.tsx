/**
 * TemplateCardFlowPreview.test.tsx
 *
 * Confirms that expanding a TemplateCard's Setup section renders the
 * FlowPreview panel correctly:
 *
 *   • The "Flow preview" heading appears after clicking Setup
 *   • The correct number of node chips is rendered
 *   • Webhook and Gmail nodes each show their expected English description
 *   • An unknown node name falls back to the generic description
 *   • The Arabic path renders without crashing and shows the Arabic heading
 *   • Arabic descriptions are shown for Webhook and Gmail in ar=true mode
 *
 * Fixtures use the `kpi-breach-alert` n8n template from the manifest
 * (nodes: Webhook, Switch, HTTP Request (Slack), Gmail, HTTP Request (Twilio))
 * because it contains both Webhook and Gmail, making it ideal for spot-checks.
 * A synthetic fixture with a single unknown-named node exercises the fallback.
 */

import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TemplateCard } from '../AdminAutomations';

/* ── Load manifest ──────────────────────────────────────────────────────── */

const manifestPath = path.resolve(
  __dirname,
  '../../../../../artifacts/api-server/public/n8n-templates/manifest.json',
);

interface ManifestTemplate {
  id: string;
  platform: string;
  filename: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  triggerEvent: string;
  category: string;
  setupTimeMinutes: number;
  nodes: string[];
}

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
  templates: ManifestTemplate[];
};
const allTemplates = manifestJson.templates;

/* ── Build a TemplateManifestItem-shaped fixture from the manifest ─────── */

function toFixture(t: ManifestTemplate) {
  return {
    id: t.id,
    platform: t.platform as 'n8n' | 'make' | 'zapier',
    filename: t.filename,
    downloadPath: `/n8n-templates/${t.filename}`,
    name: t.name,
    nameAr: t.nameAr,
    description: t.description,
    descriptionAr: t.descriptionAr,
    triggerEvent: t.triggerEvent,
    category: t.category,
    setupTimeMinutes: t.setupTimeMinutes,
    nodes: t.nodes,
  };
}

/* ── Primary fixture: kpi-breach-alert (Webhook + Gmail + 3 others) ──── */

const rawKpi = allTemplates.find(t => t.id === 'kpi-breach-alert')!;
const kpiTemplate = toFixture(rawKpi);
// nodes: ['Webhook', 'Switch', 'HTTP Request (Slack)', 'Gmail', 'HTTP Request (Twilio)']

/* ── Synthetic fixture with one unknown node for fallback testing ─────── */

const unknownNodeTemplate = toFixture({
  ...rawKpi,
  id: 'test-unknown-node',
  nodes: ['MyCustomUnknownNode'],
});

/* ── DOM helpers ────────────────────────────────────────────────────────── */

function clickSetupEN(container: HTMLElement) {
  const btn = container.querySelector('button[title="Setup guide"]') as HTMLButtonElement;
  expect(btn, 'Setup guide button (EN) must exist').not.toBeNull();
  fireEvent.click(btn);
}

function clickSetupAR(container: HTMLElement) {
  const btn = container.querySelector('button[title="دليل الإعداد"]') as HTMLButtonElement;
  expect(btn, 'Setup guide button (AR) must exist').not.toBeNull();
  fireEvent.click(btn);
}

/**
 * Returns all node-name elements inside the flow preview.
 * FlowPreview renders each node name as:
 *   <p class="... font-mono ...">name</p>
 */
function getNodeNameElements(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('p.font-mono'));
}

/**
 * Returns the description element that immediately follows a node-name
 * element whose textContent equals `nodeName`.
 */
function getNodeDesc(container: HTMLElement, nodeName: string): string | null {
  const nameEls = getNodeNameElements(container);
  const nameEl = nameEls.find(el => el.textContent === nodeName);
  if (!nameEl) return null;
  // The description <p> is the next sibling element
  const desc = nameEl.nextElementSibling;
  return desc ? desc.textContent ?? null : null;
}

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 1 — Flow preview heading
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview heading', () => {
  it('does NOT show "Flow preview" before the Setup button is clicked', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    expect(container.textContent).not.toContain('Flow preview');
  });

  it('shows the English "Flow preview" heading after clicking Setup', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    clickSetupEN(container);
    expect(container.textContent).toContain('Flow preview');
  });

  it('shows the Arabic "معاينة التدفق" heading when ar=true', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={true} />);
    clickSetupAR(container);
    expect(container.textContent).toContain('معاينة التدفق');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 2 — Correct node count
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview node count', () => {
  it('renders exactly one node chip per entry in t.nodes (kpi-breach-alert, EN)', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    clickSetupEN(container);

    const nameEls = getNodeNameElements(container);
    expect(nameEls.length).toBe(kpiTemplate.nodes.length);
  });

  it('renders exactly one node chip per entry in t.nodes (kpi-breach-alert, AR)', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={true} />);
    clickSetupAR(container);

    const nameEls = getNodeNameElements(container);
    expect(nameEls.length).toBe(kpiTemplate.nodes.length);
  });

  it('each node name text matches the fixture nodes array in order', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    clickSetupEN(container);

    const nameEls = getNodeNameElements(container);
    nameEls.forEach((el, i) => {
      expect(el.textContent).toBe(kpiTemplate.nodes[i]);
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 3 — Webhook description spot-check
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview Webhook node description', () => {
  it('Webhook node shows the English description', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    clickSetupEN(container);

    const desc = getNodeDesc(container, 'Webhook');
    expect(desc).toBe('Receives the ISC event payload via HTTP POST');
  });

  it('Webhook node shows the Arabic description when ar=true', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={true} />);
    clickSetupAR(container);

    const desc = getNodeDesc(container, 'Webhook');
    expect(desc).toBe('يستقبل حمولة حدث ISC عبر HTTP POST');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 4 — Gmail description spot-check
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview Gmail node description', () => {
  it('Gmail node shows the English description', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={false} />);
    clickSetupEN(container);

    const desc = getNodeDesc(container, 'Gmail');
    expect(desc).toBe('Sends an email via the connected Gmail account');
  });

  it('Gmail node shows the Arabic description when ar=true', () => {
    const { container } = render(<TemplateCard template={kpiTemplate} ar={true} />);
    clickSetupAR(container);

    const desc = getNodeDesc(container, 'Gmail');
    expect(desc).toBe('يرسل بريداً عبر حساب Gmail المربوط');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 5 — Unknown node name falls back to the generic description
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview unknown node fallback', () => {
  it('unknown node shows the English generic description', () => {
    const { container } = render(<TemplateCard template={unknownNodeTemplate} ar={false} />);
    clickSetupEN(container);

    const desc = getNodeDesc(container, 'MyCustomUnknownNode');
    expect(desc).toBe('Processing or transformation node');
  });

  it('unknown node shows the Arabic generic description when ar=true', () => {
    const { container } = render(<TemplateCard template={unknownNodeTemplate} ar={true} />);
    clickSetupAR(container);

    const desc = getNodeDesc(container, 'MyCustomUnknownNode');
    expect(desc).toBe('عقدة معالجة أو تحويل');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 6 — Arabic render does not crash (all 8 n8n templates)
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview Arabic render (all n8n templates)', () => {
  const n8nTemplates = allTemplates.filter(t => t.platform === 'n8n');

  n8nTemplates.forEach(raw => {
    it(`ar=true does not crash for n8n template "${raw.id}"`, () => {
      const template = toFixture(raw);
      expect(() => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        clickSetupAR(container);
        // Just verify the Arabic heading rendered without throwing
        expect(container.textContent).toContain('معاينة التدفق');
        // And that the node count is correct
        const nameEls = getNodeNameElements(container);
        expect(nameEls.length).toBe(raw.nodes.length);
      }).not.toThrow();
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 7 — FlowPreview never silently shows an empty node list (Task 620)
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — FlowPreview never renders zero node chips (Task 620)', () => {
  /**
   * For every n8n template in the manifest, the rendered FlowPreview must
   * contain at least one node chip. An empty `nodes: []` in the manifest
   * would silently produce a blank preview — this test catches that.
   *
   * This is distinct from the "node count matches manifest" assertion in
   * Section 6: if nodes were [], both `nameEls.length` and `raw.nodes.length`
   * would be 0 and the equality check would pass silently. The `> 0` guard
   * here prevents that false positive.
   */
  const n8nTemplates = allTemplates.filter(t => t.platform === 'n8n');

  n8nTemplates.forEach(raw => {
    it(`"${raw.id}" renders at least one node chip (not silently empty)`, () => {
      const template = toFixture(raw);
      const { container } = render(<TemplateCard template={template} ar={false} />);
      clickSetupEN(container);
      const nameEls = getNodeNameElements(container);
      expect(nameEls.length).toBeGreaterThan(0);
    });
  });
});
