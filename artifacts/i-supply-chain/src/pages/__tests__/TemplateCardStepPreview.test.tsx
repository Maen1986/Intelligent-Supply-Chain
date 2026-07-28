/**
 * TemplateCardStepPreview.test.tsx
 *
 * Confirms that clicking the "Setup" expand button on a TemplateCard
 * renders the correct steps from SETUP_GUIDES for Make.com and Zapier
 * templates — and NOT the steps belonging to a different platform's entry.
 *
 * Coverage:
 *   • Spot-check tests for the two original template IDs (unchanged).
 *   • Data-driven tests that iterate over every Make.com and Zapier ID
 *     in the manifest, asserting step count and cross-platform bleed.
 */

import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TemplateCard, SETUP_GUIDES } from '../AdminAutomations';

/* Load manifest via Node fs so it works regardless of Vite's root boundary */
const manifestPath = path.resolve(
  __dirname,
  '../../../../../artifacts/api-server/public/n8n-templates/manifest.json',
);
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
  templates: ManifestTemplate[];
};

/* ── Manifest types ─────────────────────────────────────────────────────── */

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

const allTemplates: ManifestTemplate[] = (manifestJson as { templates: ManifestTemplate[] }).templates;

/** All Make.com templates from the manifest */
const makeTemplates = allTemplates.filter(t => t.platform === 'make');

/** All Zapier templates from the manifest */
const zapierTemplates = allTemplates.filter(t => t.platform === 'zapier');

/** All n8n templates from the manifest */
const n8nTemplates = allTemplates.filter(t => t.platform === 'n8n');

/* ── Minimal fixture builder ─────────────────────────────────────────────── */

function toFixture(t: ManifestTemplate) {
  return {
    id: t.id,
    platform: t.platform as 'make' | 'zapier' | 'n8n',
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

/* ── Minimal TemplateManifestItem fixtures for the spot-check tests ──────── */

const makeTemplate = toFixture(makeTemplates.find(t => t.id === 'make-kpi-breach-alert')!);
const zapierTemplate = toFixture(zapierTemplates.find(t => t.id === 'zapier-new-user-welcome')!);

/* ── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Strip the leading numeric prefix that TemplateCard removes before rendering
 * each step (e.g. "1. " or "١. ").
 */
function stripPrefix(step: string): string {
  return step.replace(/^\d+\.\s*/, '').replace(/^[٠-٩]+\.\s*/, '');
}

function openSetupPanel(container: HTMLElement) {
  const btn = container.querySelector('button[title="Setup guide"]') as HTMLButtonElement;
  expect(btn).not.toBeNull();
  fireEvent.click(btn);
}

function openSetupPanelAr(container: HTMLElement) {
  const btn = container.querySelector('button[title="دليل الإعداد"]') as HTMLButtonElement;
  expect(btn).not.toBeNull();
  fireEvent.click(btn);
}

/* ════════════════════════════════════════════════════════════════════════════
   SPOT-CHECK TESTS — original two template IDs (unchanged)
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — Setup step preview', () => {
  describe('Make.com template (make-kpi-breach-alert)', () => {
    it('shows no ordered list (steps) before the Setup button is clicked', () => {
      const { container } = render(<TemplateCard template={makeTemplate} ar={false} />);
      expect(container.querySelector('ol')).toBeNull();
    });

    it('renders the correct number of steps after clicking Setup', () => {
      const { container } = render(<TemplateCard template={makeTemplate} ar={false} />);
      openSetupPanel(container);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['make-kpi-breach-alert'].en;
      expect(items.length).toBe(expected.length);
    });

    it('each rendered step text matches the SETUP_GUIDES entry (EN)', () => {
      const { container } = render(<TemplateCard template={makeTemplate} ar={false} />);
      openSetupPanel(container);

      const items = Array.from(container.querySelectorAll('ol li span:last-child'));
      const expected = SETUP_GUIDES['make-kpi-breach-alert'].en.map(stripPrefix);

      items.forEach((item, i) => {
        expect(item.textContent).toBe(expected[i]);
      });
    });

    it('does NOT show n8n steps for a Make.com template', () => {
      const { container } = render(<TemplateCard template={makeTemplate} ar={false} />);
      openSetupPanel(container);

      const text = container.textContent ?? '';
      // n8n steps always start with "Import this JSON into n8n"
      expect(text).not.toContain('Import this JSON into n8n');
    });
  });

  describe('Zapier template (zapier-new-user-welcome)', () => {
    it('shows no ordered list (steps) before the Setup button is clicked', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={false} />);
      expect(container.querySelector('ol')).toBeNull();
    });

    it('renders the correct number of steps after clicking Setup', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={false} />);
      openSetupPanel(container);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['zapier-new-user-welcome'].en;
      expect(items.length).toBe(expected.length);
    });

    it('each rendered step text matches the SETUP_GUIDES entry (EN)', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={false} />);
      openSetupPanel(container);

      const items = Array.from(container.querySelectorAll('ol li span:last-child'));
      const expected = SETUP_GUIDES['zapier-new-user-welcome'].en.map(stripPrefix);

      items.forEach((item, i) => {
        expect(item.textContent).toBe(expected[i]);
      });
    });

    it('does NOT show Make.com steps for a Zapier template', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={false} />);
      openSetupPanel(container);

      const text = container.textContent ?? '';
      // Make.com steps always contain "Import Blueprint"
      expect(text).not.toContain('Import Blueprint');
    });

    it('does NOT show n8n steps for a Zapier template', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={false} />);
      openSetupPanel(container);

      const text = container.textContent ?? '';
      expect(text).not.toContain('Import this JSON into n8n');
    });
  });

  describe('Arabic (ar=true) step rendering', () => {
    it('Make.com template renders Arabic steps when ar=true', () => {
      const { container } = render(<TemplateCard template={makeTemplate} ar={true} />);
      openSetupPanelAr(container);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['make-kpi-breach-alert'].ar;
      expect(items.length).toBe(expected.length);
    });

    it('Zapier template renders Arabic steps when ar=true', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={true} />);
      openSetupPanelAr(container);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['zapier-new-user-welcome'].ar;
      expect(items.length).toBe(expected.length);
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   DATA-DRIVEN TESTS — all 8 Make.com templates
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — all Make.com templates from manifest', () => {
  it('manifest contains exactly 8 Make.com templates', () => {
    expect(makeTemplates).toHaveLength(8);
  });

  makeTemplates.forEach(raw => {
    const template = toFixture(raw);
    const guide = SETUP_GUIDES[raw.id];

    describe(`make template: ${raw.id}`, () => {
      it('has a SETUP_GUIDES entry', () => {
        expect(guide).toBeDefined();
        expect(guide.en.length).toBeGreaterThan(0);
        expect(guide.ar.length).toBeGreaterThan(0);
      });

      it('renders the correct EN step count after clicking Setup', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.en.length);
      });

      it('renders the correct AR step count when ar=true', () => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        openSetupPanelAr(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.ar.length);
      });

      it('does NOT bleed n8n steps into a Make.com template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        expect(text).not.toContain('Import this JSON into n8n');
      });

      it('does NOT bleed Zapier steps into a Make.com template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        // All Zapier setup guides begin with "In Zapier, create a new Zap"
        expect(text).not.toContain('In Zapier, create a new Zap');
      });

      it('each rendered step text matches the SETUP_GUIDES entry (EN)', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const items = Array.from(container.querySelectorAll('ol li span:last-child'));
        const expected = guide.en.map(stripPrefix);

        items.forEach((item, i) => {
          expect(item.textContent).toBe(expected[i]);
        });
      });

      it('each rendered step text matches the SETUP_GUIDES entry (AR)', () => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        openSetupPanelAr(container);

        const items = Array.from(container.querySelectorAll('ol li span:last-child'));
        const expected = guide.ar.map(stripPrefix);

        items.forEach((item, i) => {
          expect(item.textContent).toBe(expected[i]);
        });
      });
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   DATA-DRIVEN TESTS — all 8 Zapier templates
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — all Zapier templates from manifest', () => {
  it('manifest contains exactly 8 Zapier templates', () => {
    expect(zapierTemplates).toHaveLength(8);
  });

  zapierTemplates.forEach(raw => {
    const template = toFixture(raw);
    const guide = SETUP_GUIDES[raw.id];

    describe(`zapier template: ${raw.id}`, () => {
      it('has a SETUP_GUIDES entry', () => {
        expect(guide).toBeDefined();
        expect(guide.en.length).toBeGreaterThan(0);
        expect(guide.ar.length).toBeGreaterThan(0);
      });

      it('renders the correct EN step count after clicking Setup', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.en.length);
      });

      it('renders the correct AR step count when ar=true', () => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        openSetupPanelAr(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.ar.length);
      });

      it('does NOT bleed n8n steps into a Zapier template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        expect(text).not.toContain('Import this JSON into n8n');
      });

      it('does NOT bleed Make.com steps into a Zapier template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        // All Make.com setup guides include "Import Blueprint"
        expect(text).not.toContain('Import Blueprint');
      });

      it('each rendered step text matches the SETUP_GUIDES entry (EN)', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const items = Array.from(container.querySelectorAll('ol li span:last-child'));
        const expected = guide.en.map(stripPrefix);

        items.forEach((item, i) => {
          expect(item.textContent).toBe(expected[i]);
        });
      });

      it('each rendered step text matches the SETUP_GUIDES entry (AR)', () => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        openSetupPanelAr(container);

        const items = Array.from(container.querySelectorAll('ol li span:last-child'));
        const expected = guide.ar.map(stripPrefix);

        items.forEach((item, i) => {
          expect(item.textContent).toBe(expected[i]);
        });
      });
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   DATA-DRIVEN TESTS — all 8 n8n templates
   ════════════════════════════════════════════════════════════════════════════ */

describe('TemplateCard — all n8n templates from manifest', () => {
  it('manifest contains exactly 8 n8n templates', () => {
    expect(n8nTemplates).toHaveLength(8);
  });

  n8nTemplates.forEach(raw => {
    const template = toFixture(raw);
    const guide = SETUP_GUIDES[raw.id];

    describe(`n8n template: ${raw.id}`, () => {
      it('has a SETUP_GUIDES entry', () => {
        expect(guide).toBeDefined();
        expect(guide.en.length).toBeGreaterThan(0);
        expect(guide.ar.length).toBeGreaterThan(0);
      });

      it('renders the correct EN step count after clicking Setup', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.en.length);
      });

      it('renders the correct AR step count when ar=true', () => {
        const { container } = render(<TemplateCard template={template} ar={true} />);
        openSetupPanelAr(container);

        const items = container.querySelectorAll('ol li');
        expect(items.length).toBe(guide.ar.length);
      });

      it('does NOT bleed Make.com steps into an n8n template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        // All Make.com setup guides include "Import Blueprint"
        expect(text).not.toContain('Import Blueprint');
      });

      it('does NOT bleed Zapier steps into an n8n template', () => {
        const { container } = render(<TemplateCard template={template} ar={false} />);
        openSetupPanel(container);

        const text = container.textContent ?? '';
        // All Zapier setup guides begin with "In Zapier, create a new Zap"
        expect(text).not.toContain('In Zapier, create a new Zap');
      });
    });
  });
});
