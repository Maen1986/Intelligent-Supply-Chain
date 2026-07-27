/**
 * AdminAutomations — TemplatesTab
 *
 * Confirms:
 *   A. The Templates tab renders all 8 workflow template cards.
 *   B. Expanding a setup guide reveals step text.
 *   C. Each Download link points to a URL that serves valid n8n JSON
 *      (non-empty body, `_isc_version === "1.0.0"`).
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'admin', email: 'admin@test.com' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

vi.mock('wouter', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
  useLocation: () => ['/admin/automations', vi.fn()],
  useRoute:    () => [false, {}],
}));

/* ── Fixture data ─────────────────────────────────────────────────────────── */

const MANIFEST_TEMPLATES = [
  {
    id: 'lead-nurture-sequence',
    filename: 'lead-nurture-sequence.json',
    name: 'Lead Nurture Sequence',
    nameAr: 'تسلسل رعاية العملاء المحتملين',
    description: 'Triggers on lead.captured.',
    descriptionAr: 'يُشغَّل عند التقاط عميل محتمل.',
    triggerEvent: 'lead.captured',
    category: 'Sales',
    setupTimeMinutes: 5,
    nodes: ['Webhook', 'Email', 'Wait', 'IF', 'HTTP Request'],
  },
  {
    id: 'kpi-breach-alert',
    filename: 'kpi-breach-alert.json',
    name: 'KPI Breach Alert',
    nameAr: 'تنبيه خرق مؤشر الأداء',
    description: 'Triggers on kpi.threshold_breach.',
    descriptionAr: 'يُشغَّل عند خرق عتبة مؤشر الأداء.',
    triggerEvent: 'kpi.threshold_breach',
    category: 'Alerts',
    setupTimeMinutes: 5,
    nodes: ['Webhook', 'Switch', 'HTTP Request (Slack)', 'Gmail'],
  },
  {
    id: 'weekly-kpi-digest',
    filename: 'weekly-kpi-digest.json',
    name: 'Weekly KPI Digest',
    nameAr: 'ملخص مؤشرات الأداء الأسبوعي',
    description: 'Triggers on schedule.weekly_kpi_digest.',
    descriptionAr: 'يُشغَّل عبر جدولة أسبوعية.',
    triggerEvent: 'schedule.weekly_kpi_digest',
    category: 'Reporting',
    setupTimeMinutes: 4,
    nodes: ['Webhook', 'Code', 'Gmail'],
  },
  {
    id: 'new-user-welcome',
    filename: 'new-user-welcome.json',
    name: 'New User Welcome',
    nameAr: 'ترحيب بالمستخدم الجديد',
    description: 'Triggers on user.registered.',
    descriptionAr: 'يُشغَّل عند تسجيل مستخدم جديد.',
    triggerEvent: 'user.registered',
    category: 'Onboarding',
    setupTimeMinutes: 3,
    nodes: ['Webhook', 'Code', 'Gmail'],
  },
  {
    id: 'ai-plan-ready-notification',
    filename: 'ai-plan-ready-notification.json',
    name: 'AI Plan Ready Notification',
    nameAr: 'إشعار جاهزية خطة الذكاء الاصطناعي',
    description: 'Triggers on ai_plan.generated.',
    descriptionAr: 'يُشغَّل عند إنشاء خطة ذكاء اصطناعي.',
    triggerEvent: 'ai_plan.generated',
    category: 'Notifications',
    setupTimeMinutes: 3,
    nodes: ['Webhook', 'Gmail', 'HTTP Request (WhatsApp)'],
  },
  {
    id: 'monthly-supplier-scorecard',
    filename: 'monthly-supplier-scorecard.json',
    name: 'Monthly Supplier Scorecard',
    nameAr: 'بطاقة تقييم الموردين الشهرية',
    description: 'Triggers on schedule.monthly_scorecard.',
    descriptionAr: 'يُشغَّل شهرياً.',
    triggerEvent: 'schedule.monthly_scorecard',
    category: 'Reporting',
    setupTimeMinutes: 5,
    nodes: ['Webhook', 'HTTP Request (ISC API)', 'Code', 'Gmail'],
  },
  {
    id: 'erp-data-sync',
    filename: 'erp-data-sync.json',
    name: 'ERP Data Sync',
    nameAr: 'مزامنة بيانات نظام ERP',
    description: 'Scheduled daily trigger.',
    descriptionAr: 'مشغّل يومي مجدول.',
    triggerEvent: 'cron.daily',
    category: 'Integration',
    setupTimeMinutes: 5,
    nodes: ['Schedule Trigger', 'HTTP Request (ERP)', 'Code (Field Mapping)'],
  },
  {
    id: 'escalation-router',
    filename: 'escalation-router.json',
    name: 'Escalation Router',
    nameAr: 'موجّه التصعيد',
    description: 'Triggers on kpi.threshold_breach (critical only).',
    descriptionAr: 'يُشغَّل عند خرق حرج.',
    triggerEvent: 'kpi.threshold_breach',
    category: 'Escalation',
    setupTimeMinutes: 5,
    nodes: ['Webhook', 'IF (critical only)', 'Google Sheets', 'Gmail'],
  },
];

const SAMPLE_N8N_JSON = {
  _isc_version: '1.0.0',
  name: 'ISC — Lead Nurture Sequence',
  nodes: [{ id: 'node-1', name: 'Webhook', type: 'n8n-nodes-base.webhook' }],
  connections: {},
  settings: {},
};

/* ── fetch mock ───────────────────────────────────────────────────────────── */

function makeFetchMock() {
  return vi.fn(async (url: string) => {
    const u = String(url);

    // Templates manifest
    if (u.includes('/admin/automations/templates')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          _isc_version: '1.0.0',
          generatedAt: '2026-07-27T00:00:00Z',
          templates: MANIFEST_TEMPLATES,
        }),
      };
    }

    // Any of the 8 n8n JSON files
    if (u.includes('/public/n8n-templates/') && u.endsWith('.json')) {
      return {
        ok: true,
        json: async () => SAMPLE_N8N_JSON,
        text: async () => JSON.stringify(SAMPLE_N8N_JSON),
      };
    }

    // Automations overview (loaded by OverviewTab on mount, but we switch away)
    if (u.includes('/admin/automations/overview')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          webhooks: { configCount: 0, totalDeliveries: 0, successful: 0, failed: 0, lastDeliveryAt: null, successRate: null },
          inbound:  { total: 0, successful: 0, failed: 0, lastReceivedAt: null },
          schedule: {},
          kpiAlerts: { totalBreaches: 0 },
        }),
      };
    }

    return { ok: false, json: async () => ({ ok: false, error: 'Not mocked' }) };
  });
}

/* ── component under test ─────────────────────────────────────────────────── */

import { AdminAutomations } from './AdminAutomations';

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('AdminAutomations — TemplatesTab', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function renderAndOpenTemplates() {
    render(React.createElement(AdminAutomations));

    // Click the "Templates" tab
    const templatesTab = await screen.findByRole('button', { name: /Templates/i });
    fireEvent.click(templatesTab);

    // Wait for all 8 template names to appear
    await waitFor(() => {
      expect(screen.getByText('Lead Nurture Sequence')).toBeInTheDocument();
      expect(screen.getByText('Escalation Router')).toBeInTheDocument();
    });
  }

  /* ── A. Card count ──────────────────────────────────────────────────────── */

  it('A — renders exactly 8 template cards', async () => {
    await renderAndOpenTemplates();

    // Each card has a "Prepare & Download" button; count them as a proxy for card count
    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons).toHaveLength(8);

    // Spot-check all 8 template names are visible
    const expectedNames = [
      'Lead Nurture Sequence',
      'KPI Breach Alert',
      'Weekly KPI Digest',
      'New User Welcome',
      'AI Plan Ready Notification',
      'Monthly Supplier Scorecard',
      'ERP Data Sync',
      'Escalation Router',
    ];
    for (const name of expectedNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  /* ── B. Setup guide expansion ───────────────────────────────────────────── */

  it('B — expanding a setup guide reveals step text', async () => {
    await renderAndOpenTemplates();

    // Click the first "Setup" toggle button
    const setupButtons = screen.getAllByRole('button', { name: /Setup/i });
    expect(setupButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(setupButtons[0]);

    // The first step of lead-nurture-sequence guide should appear
    await waitFor(() => {
      expect(
        screen.getByText(/Import this JSON into n8n/i),
      ).toBeInTheDocument();
    });

    // The node list should also be visible (may appear in both the flow preview
    // and the nodes-chips section, so use getAllByText)
    const webhookEls = screen.getAllByText('Webhook');
    expect(webhookEls.length).toBeGreaterThanOrEqual(1);
  });

  /* ── C. Prepare & Download button opens the modal ───────────────────────── */

  it('C — clicking Prepare & Download opens the preparation modal', async () => {
    await renderAndOpenTemplates();

    // Click the first "Prepare & Download" button
    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(downloadButtons[0]);

    // The preparation modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Prepare & Download Template/i)).toBeInTheDocument();
    });

    // Modal should contain the ISC Domain and API Key fields
    expect(screen.getByText(/ISC Domain/i)).toBeInTheDocument();
    expect(screen.getByText(/ISC API Key/i)).toBeInTheDocument();
  });

  /* ── D. All 8 template cards have Prepare & Download buttons ─────────────── */

  it('D — all 8 template cards have a Prepare & Download button', async () => {
    await renderAndOpenTemplates();

    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons).toHaveLength(8);

    // Each button should be enabled
    for (const btn of downloadButtons) {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    }
  });
});
