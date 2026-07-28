/**
 * Confirms that SETUP_GUIDES in AdminAutomations covers all 10 new Make.com
 * and Zapier templates and that each entry provides bilingual steps.
 *
 * Also confirms the 8 original n8n templates have matching EN/AR step counts.
 *
 * These checks map to the "Setup guide steps expand and display bilingual
 * content for each new template" acceptance criterion.
 */

import { describe, it, expect } from 'vitest';
import { SETUP_GUIDES } from '../AdminAutomations';

const NEW_MAKE_IDS = [
  'make-lead-nurture-sequence',
  'make-ai-plan-ready-notification',
  'make-monthly-supplier-scorecard',
  'make-erp-data-sync',
  'make-escalation-router',
];

const NEW_ZAPIER_IDS = [
  'zapier-lead-nurture-sequence',
  'zapier-ai-plan-ready-notification',
  'zapier-monthly-supplier-scorecard',
  'zapier-erp-data-sync',
  'zapier-escalation-router',
];

const ALL_NEW_IDS = [...NEW_MAKE_IDS, ...NEW_ZAPIER_IDS];

describe('SETUP_GUIDES — new Make.com and Zapier templates', () => {
  it('has an entry for all 10 new template IDs', () => {
    for (const id of ALL_NEW_IDS) {
      expect(
        SETUP_GUIDES,
        `SETUP_GUIDES missing entry for ${id}`,
      ).toHaveProperty(id);
    }
  });

  it('every new entry has at least one English setup step', () => {
    for (const id of ALL_NEW_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide?.en?.length,
        `${id} has no English steps`,
      ).toBeGreaterThan(0);
    }
  });

  it('every new entry has at least one Arabic setup step', () => {
    for (const id of ALL_NEW_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide?.ar?.length,
        `${id} has no Arabic steps`,
      ).toBeGreaterThan(0);
    }
  });

  it('English and Arabic step counts match for each new entry', () => {
    for (const id of ALL_NEW_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide.en.length,
        `${id} EN/AR step count mismatch`,
      ).toBe(guide.ar.length);
    }
  });

  it('no new setup step is an empty string', () => {
    for (const id of ALL_NEW_IDS) {
      const guide = SETUP_GUIDES[id];
      for (const step of [...guide.en, ...guide.ar]) {
        expect(step.trim(), `${id} has a blank step`).not.toBe('');
      }
    }
  });

  /* ── Make.com specifics ─────────────────────────────────────────────────── */

  it('Make.com steps mention "Import Blueprint"', () => {
    for (const id of NEW_MAKE_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasBlueprint = guide.en.some(s => s.includes('Import Blueprint'));
      expect(hasBlueprint, `${id} EN steps don't mention Import Blueprint`).toBe(true);
    }
  });

  it('Make.com steps mention turning the scenario ON', () => {
    for (const id of NEW_MAKE_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasOn = guide.en.some(s => /turn.*scenario.*on/i.test(s));
      expect(hasOn, `${id} EN steps don't mention turning the scenario ON`).toBe(true);
    }
  });

  /* ── Zapier specifics ───────────────────────────────────────────────────── */

  it('Zapier steps mention "Webhooks by Zapier" or "Schedule by Zapier"', () => {
    for (const id of NEW_ZAPIER_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasWebhook = guide.en.some(
        s => s.includes('Webhooks by Zapier') || s.includes('Schedule by Zapier'),
      );
      expect(hasWebhook, `${id} EN steps don't reference a Zapier trigger`).toBe(true);
    }
  });

  it('Zapier steps mention turning the Zap ON', () => {
    for (const id of NEW_ZAPIER_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasOn = guide.en.some(s => /turn.*zap.*on/i.test(s));
      expect(hasOn, `${id} EN steps don't mention turning the Zap ON`).toBe(true);
    }
  });
});

/* ── n8n originals ────────────────────────────────────────────────────────── */

const N8N_IDS = [
  'lead-nurture-sequence',
  'kpi-breach-alert',
  'weekly-kpi-digest',
  'new-user-welcome',
  'ai-plan-ready-notification',
  'monthly-supplier-scorecard',
  'erp-data-sync',
  'escalation-router',
];

describe('SETUP_GUIDES — original n8n templates', () => {
  it('has an entry for all 8 n8n template IDs', () => {
    for (const id of N8N_IDS) {
      expect(
        SETUP_GUIDES,
        `SETUP_GUIDES missing entry for ${id}`,
      ).toHaveProperty(id);
    }
  });

  it('every n8n entry has at least one English setup step', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide?.en?.length,
        `${id} has no English steps`,
      ).toBeGreaterThan(0);
    }
  });

  it('every n8n entry has at least one Arabic setup step', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide?.ar?.length,
        `${id} has no Arabic steps`,
      ).toBeGreaterThan(0);
    }
  });

  it('English and Arabic step counts match for each n8n entry', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      expect(
        guide.en.length,
        `${id} EN/AR step count mismatch`,
      ).toBe(guide.ar.length);
    }
  });

  it('no n8n setup step is an empty string', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      for (const step of [...guide.en, ...guide.ar]) {
        expect(step.trim(), `${id} has a blank step`).not.toBe('');
      }
    }
  });

  it('n8n steps mention importing the JSON', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasImport = guide.en.some(s => /import.*json/i.test(s));
      expect(hasImport, `${id} EN steps don't mention importing the JSON`).toBe(true);
    }
  });

  it('n8n steps mention activating the workflow', () => {
    for (const id of N8N_IDS) {
      const guide = SETUP_GUIDES[id];
      const hasActivate = guide.en.some(s => /activate.*workflow/i.test(s));
      expect(hasActivate, `${id} EN steps don't mention activating the workflow`).toBe(true);
    }
  });
});
