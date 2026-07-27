/**
 * TemplateCardStepPreview.test.tsx
 *
 * Confirms that clicking the "Setup" expand button on a TemplateCard
 * renders the correct steps from SETUP_GUIDES for Make.com and Zapier
 * templates — and NOT the steps belonging to a different platform's entry.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard, SETUP_GUIDES } from '../AdminAutomations';

/* ── Minimal TemplateManifestItem fixtures ─────────────────────────────── */

const makeTemplate = {
  id: 'make-kpi-breach-alert',
  platform: 'make' as const,
  filename: 'make-kpi-breach-alert.json',
  downloadPath: '/n8n-templates/make-kpi-breach-alert.json',
  name: 'KPI Breach Alert',
  nameAr: 'تنبيه خرق KPI',
  description: 'Sends alerts when a KPI threshold is breached.',
  descriptionAr: 'يرسل تنبيهات عند تجاوز حد KPI.',
  triggerEvent: 'kpi.threshold_breach',
  category: 'Alerts',
  setupTimeMinutes: 15,
  nodes: ['Webhook', 'Gmail', 'HTTP (Slack)', 'HTTP (Twilio)'],
};

const zapierTemplate = {
  id: 'zapier-new-user-welcome',
  platform: 'zapier' as const,
  filename: 'zapier-new-user-welcome.json',
  downloadPath: '/n8n-templates/zapier-new-user-welcome.json',
  name: 'New User Welcome',
  nameAr: 'ترحيب بالمستخدم الجديد',
  description: 'Sends a bilingual welcome email when a new user registers.',
  descriptionAr: 'يرسل بريد ترحيب ثنائي اللغة عند تسجيل مستخدم جديد.',
  triggerEvent: 'user.registered',
  category: 'Onboarding',
  setupTimeMinutes: 10,
  nodes: ['Webhooks by Zapier', 'Filter', 'Gmail'],
};

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

/* ── Tests ─────────────────────────────────────────────────────────────── */

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
      // Setup button uses title="دليل الإعداد" in Arabic
      const btn = container.querySelector('button[title="دليل الإعداد"]') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      fireEvent.click(btn);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['make-kpi-breach-alert'].ar;
      expect(items.length).toBe(expected.length);
    });

    it('Zapier template renders Arabic steps when ar=true', () => {
      const { container } = render(<TemplateCard template={zapierTemplate} ar={true} />);
      const btn = container.querySelector('button[title="دليل الإعداد"]') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      fireEvent.click(btn);

      const items = container.querySelectorAll('ol li');
      const expected = SETUP_GUIDES['zapier-new-user-welcome'].ar;
      expect(items.length).toBe(expected.length);
    });
  });
});
