/**
 * TemplatesPlatformFilter.integration.test.tsx
 *
 * Confirms that a brand-new platform value arriving from the
 * /admin/automations/templates API automatically appears as a filter pill
 * in TemplatesTab, and that clicking that pill narrows the visible cards to
 * only that platform's templates.
 *
 * Strategy: mock global.fetch so the component receives a controlled API
 * response that includes a "powerautomate" template alongside existing ones.
 * No server or Playwright needed.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { TemplatesTab } from '../AdminAutomations';

/* ── Explicit cleanup so DOM doesn't leak between tests ──────────────────── */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* ── Fixture data ─────────────────────────────────────────────────────────── */

const baseTemplate = {
  filename: 'fake.json',
  downloadPath: '/n8n-templates/fake.json',
  category: 'Alerts',
  setupTimeMinutes: 10,
  nodes: ['Webhook'],
  nameAr: '',
  descriptionAr: '',
  triggerEvent: 'kpi.threshold_breach',
};

const MOCK_TEMPLATES = [
  {
    ...baseTemplate,
    id: 'n8n-kpi-breach',
    platform: 'n8n',
    name: 'N8N KPI Breach',
    description: 'An n8n template.',
  },
  {
    ...baseTemplate,
    id: 'make-kpi-breach',
    platform: 'make',
    name: 'Make KPI Breach',
    description: 'A Make.com template.',
  },
  {
    ...baseTemplate,
    id: 'powerautomate-kpi-breach',
    platform: 'powerautomate',
    name: 'Power Automate KPI Breach',
    description: 'A Power Automate template.',
  },
];

/* ── Fetch mock helper ────────────────────────────────────────────────────── */

function mockFetchWithTemplates(templates: typeof MOCK_TEMPLATES) {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({ ok: true, templates }),
  } as unknown as Response);
}

/* ── Helper: find pill buttons inside the platform filter bar ────────────── */

function getPillBar() {
  // The platform filter label "Platform:" precedes the pills
  const label = screen.getByText(/^Platform:$/);
  // Walk up to the flex container that holds all pill buttons
  return label.parentElement!;
}

function getPillButton(name: RegExp | string) {
  return within(getPillBar()).getByRole('button', { name });
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('TemplatesTab — dynamic platform pill from API response', () => {
  it('renders a "powerautomate" pill button when the API returns a template with that platform', async () => {
    mockFetchWithTemplates(MOCK_TEMPLATES);

    render(<TemplatesTab ar={false} />);

    await waitFor(() => {
      expect(getPillButton(/powerautomate/i)).toBeInTheDocument();
    });

    const pill = getPillButton(/powerautomate/i);
    expect(pill.tagName).toBe('BUTTON');
  });

  it('clicking the "powerautomate" pill shows only the powerautomate template card', async () => {
    mockFetchWithTemplates(MOCK_TEMPLATES);

    const { container } = render(<TemplatesTab ar={false} />);

    await waitFor(() => {
      expect(getPillButton(/powerautomate/i)).toBeInTheDocument();
    });

    // Before clicking: all three template names are present in the card list
    const cardArea = container.querySelector('.space-y-3:last-child')!;
    expect(within(cardArea as HTMLElement).getByText('N8N KPI Breach')).toBeInTheDocument();
    expect(within(cardArea as HTMLElement).getByText('Make KPI Breach')).toBeInTheDocument();
    expect(within(cardArea as HTMLElement).getByText('Power Automate KPI Breach')).toBeInTheDocument();

    // Click the powerautomate pill
    fireEvent.click(getPillButton(/powerautomate/i));

    // After clicking: only the powerautomate card remains
    expect(within(cardArea as HTMLElement).getByText('Power Automate KPI Breach')).toBeInTheDocument();
    expect(within(cardArea as HTMLElement).queryByText('N8N KPI Breach')).not.toBeInTheDocument();
    expect(within(cardArea as HTMLElement).queryByText('Make KPI Breach')).not.toBeInTheDocument();
  });

  it('counter text updates to "1 / 3 templates" after clicking the powerautomate pill', async () => {
    mockFetchWithTemplates(MOCK_TEMPLATES);

    render(<TemplatesTab ar={false} />);

    await waitFor(() => {
      expect(getPillButton(/powerautomate/i)).toBeInTheDocument();
    });

    fireEvent.click(getPillButton(/powerautomate/i));

    expect(screen.getByText('1 / 3 templates')).toBeInTheDocument();
  });

  it('switching back to All restores all three template cards', async () => {
    mockFetchWithTemplates(MOCK_TEMPLATES);

    const { container } = render(<TemplatesTab ar={false} />);

    await waitFor(() => {
      expect(getPillButton(/powerautomate/i)).toBeInTheDocument();
    });

    // Narrow to powerautomate
    fireEvent.click(getPillButton(/powerautomate/i));

    const cardArea = container.querySelector('.space-y-3:last-child')!;
    expect(within(cardArea as HTMLElement).queryByText('N8N KPI Breach')).not.toBeInTheDocument();

    // Switch back to All
    fireEvent.click(getPillButton(/^All$/i));

    expect(within(cardArea as HTMLElement).getByText('N8N KPI Breach')).toBeInTheDocument();
    expect(within(cardArea as HTMLElement).getByText('Make KPI Breach')).toBeInTheDocument();
    expect(within(cardArea as HTMLElement).getByText('Power Automate KPI Breach')).toBeInTheDocument();
  });

  it('produces a pill for every distinct platform the API returns', async () => {
    mockFetchWithTemplates(MOCK_TEMPLATES);

    render(<TemplatesTab ar={false} />);

    await waitFor(() => {
      expect(getPillButton(/^All$/i)).toBeInTheDocument();
    });

    // The component maps platform keys to display labels via PLATFORM_LABEL:
    //   n8n → "n8n", make → "Make.com", zapier → "Zapier", unknown → raw key
    // We check the pill bar contains one button per distinct platform (plus All).
    const pillBar = getPillBar();
    const pillButtons = within(pillBar).getAllByRole('button');

    // One "All" pill + one pill per distinct platform
    const uniquePlatforms = [...new Set(MOCK_TEMPLATES.map(t => t.platform))];
    expect(pillButtons).toHaveLength(1 + uniquePlatforms.length);

    // The "powerautomate" platform has no PLATFORM_LABEL entry so it renders as raw "powerautomate"
    expect(getPillButton(/powerautomate/i)).toBeInTheDocument();
    // "n8n" renders as "n8n" and "make" renders as "Make.com"
    expect(getPillButton(/^n8n$/i)).toBeInTheDocument();
    expect(getPillButton(/^make\.com$/i)).toBeInTheDocument();
  });
});
