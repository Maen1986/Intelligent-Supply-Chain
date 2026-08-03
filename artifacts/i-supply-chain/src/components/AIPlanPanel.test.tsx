/**
 * AIPlanPanel — component tests
 *
 * Confirms every visual state and interactive control for both
 * authenticated and unauthenticated users:
 *
 *   Unauthenticated + idle → sign-in prompt, no Generate button
 *   Authenticated + idle   → Generate button (enabled / disabled)
 *   Loading                → spinner shown, button hidden
 *   Result panel           → AI plan with parsed content, Copy / Regenerate / Collapse / Close
 *   Error state            → alert with message; Retry shown only when authenticated
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AIPlanPanel } from './AIPlanPanel';

/* ── Auth mock — default: authenticated ──────────────────────────────────── */
const mockUseAuth = vi.fn(() => ({ isAuthenticated: true }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

/* ── helpers ──────────────────────────────────────────────────────────────── */

function noop() {}

interface Overrides {
  loading?: boolean;
  result?: string | null;
  error?: string | null;
  onGenerate?: () => void;
  onReset?: () => void;
  buttonLabel?: string;
  isAr?: boolean;
  disabled?: boolean;
  rateLimited?: boolean;
  retryAfterSeconds?: number | null;
}

function renderPanel(overrides: Overrides = {}) {
  return render(
    <AIPlanPanel
      loading={overrides.loading ?? false}
      result={overrides.result ?? null}
      error={overrides.error ?? null}
      onGenerate={overrides.onGenerate ?? noop}
      onReset={overrides.onReset ?? noop}
      buttonLabel={overrides.buttonLabel ?? 'Generate Plan ✨'}
      isAr={overrides.isAr ?? false}
      disabled={overrides.disabled}
      rateLimited={overrides.rateLimited}
      retryAfterSeconds={overrides.retryAfterSeconds}
    />,
  );
}

const MOCK_RESULT = `## Supplier Development Plan\n- Action 1 [HIGH]\n- Action 2 [MEDIUM]\n\n### Priority: Delivery`;

beforeEach(() => {
  cleanup();
  mockUseAuth.mockReturnValue({ isAuthenticated: true });
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Unauthenticated state
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — unauthenticated state', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
  });

  it('shows a sign-in prompt instead of the Generate button', () => {
    renderPanel();
    expect(screen.getByText(/Sign in to generate an AI plan/i)).toBeInTheDocument();
  });

  it('does not render the Generate button when not signed in', () => {
    renderPanel({ buttonLabel: 'Generate Plan ✨' });
    expect(screen.queryByRole('button', { name: /Generate Plan/i })).toBeNull();
  });

  it('shows the Arabic sign-in prompt when isAr=true', () => {
    renderPanel({ isAr: true });
    expect(screen.getByText(/سجِّل دخولك لتوليد خطة/)).toBeInTheDocument();
  });

  it('does not show a Retry button in the error state when not authenticated', () => {
    renderPanel({ error: 'Something went wrong' });
    expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
  });

  it('still shows the Dismiss button in the error state even when not authenticated', () => {
    renderPanel({ error: 'Something went wrong' });
    const buttons = screen.getAllByRole('button');
    const dismiss = buttons.find(b => b.textContent?.trim() === '✕');
    expect(dismiss).toBeDefined();
  });

  it('does not show a Regenerate button on the result panel when not authenticated', () => {
    renderPanel({ result: MOCK_RESULT });
    expect(screen.queryByTitle('Regenerate')).toBeNull();
  });

  it('still shows Copy, Collapse, and Close on the result panel when not authenticated', () => {
    renderPanel({ result: MOCK_RESULT });
    expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    expect(screen.getByTitle('Collapse')).toBeInTheDocument();
    expect(screen.getByTitle('Close')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Authenticated idle state
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — idle state (authenticated)', () => {
  it('renders the generate button with the supplied label', () => {
    renderPanel({ buttonLabel: 'Generate Supplier Plan ✨' });
    expect(screen.getByRole('button', { name: /Generate Supplier Plan/i })).toBeInTheDocument();
  });

  it('generate button is enabled by default', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /Generate Plan/i })).not.toBeDisabled();
  });

  it('generate button is disabled when disabled=true', () => {
    renderPanel({ disabled: true });
    expect(screen.getByRole('button', { name: /Generate Plan/i })).toBeDisabled();
  });

  it('clicking the generate button calls onGenerate', () => {
    const onGenerate = vi.fn();
    renderPanel({ onGenerate });
    fireEvent.click(screen.getByRole('button', { name: /Generate Plan/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('does not render spinner or result panel in idle state', () => {
    renderPanel();
    expect(screen.queryByText(/Generating/i)).toBeNull();
    expect(screen.queryByText('AI-Generated Plan')).toBeNull();
  });

  it('renders the button label in Arabic when isAr=true', () => {
    renderPanel({ buttonLabel: 'توليد الخطة ✨', isAr: true });
    expect(screen.getByRole('button', { name: /توليد الخطة/i })).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. Loading state
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — loading state', () => {
  it('shows the generating spinner text', () => {
    renderPanel({ loading: true });
    expect(screen.getByText(/Generating/i)).toBeInTheDocument();
  });

  it('hides the generate button while loading', () => {
    renderPanel({ loading: true });
    expect(screen.queryByRole('button', { name: /Generate Plan/i })).toBeNull();
  });

  it('shows Arabic spinner text when isAr=true', () => {
    renderPanel({ loading: true, isAr: true });
    expect(screen.getByText(/جارٍ التوليد/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. Result state — panel header and content rendering
══════════════════════════════════════════════════════════════════════════ */

/* ── helpers for RTL / Arabic assertions ─────────────────────────────────── */

/** Find the scrollable content div that carries dir="rtl" or dir="ltr" */
function getContentDiv(container: HTMLElement) {
  return container.querySelector('[dir]');
}

describe('AIPlanPanel — result panel', () => {
  it('shows the AI-Generated Plan panel header', () => {
    renderPanel({ result: MOCK_RESULT });
    expect(screen.getByText('AI-Generated Plan')).toBeInTheDocument();
  });

  it('renders ## headings as section titles', () => {
    renderPanel({ result: MOCK_RESULT });
    expect(screen.getByText('Supplier Development Plan')).toBeInTheDocument();
  });

  it('renders ### headings as sub-section titles', () => {
    renderPanel({ result: MOCK_RESULT });
    expect(screen.getByText('Priority: Delivery')).toBeInTheDocument();
  });

  it('renders bullet points', () => {
    renderPanel({ result: '## Plan\n- Action 1\n- Action 2' });
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('renders priority badge text', () => {
    renderPanel({ result: '- Task [HIGH]' });
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('renders numbered list items', () => {
    renderPanel({ result: '1. First step\n2. Second step' });
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
  });

  it('hides the idle generate button when result is shown', () => {
    renderPanel({ result: MOCK_RESULT, buttonLabel: 'Generate Plan ✨' });
    const buttons = screen.getAllByRole('button');
    expect(buttons.find(b => b.textContent?.includes('Generate Plan ✨'))).toBeUndefined();
  });

  it('shows the Arabic panel header when isAr=true', () => {
    renderPanel({ result: MOCK_RESULT, isAr: true });
    expect(screen.getByText('الخطة المُولَّدة بالذكاء الاصطناعي')).toBeInTheDocument();
  });

  it('result content area has dir="rtl" when isAr=true', () => {
    const { container } = renderPanel({ result: MOCK_RESULT, isAr: true });
    expect(getContentDiv(container)?.getAttribute('dir')).toBe('rtl');
  });

  it('result content area has dir="ltr" when isAr=false', () => {
    const { container } = renderPanel({ result: MOCK_RESULT, isAr: false });
    expect(getContentDiv(container)?.getAttribute('dir')).toBe('ltr');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4b. Arabic priority badge translations
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — Arabic priority badges', () => {
  it('renders [عالية] badge text (high priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [عالية]', isAr: true });
    expect(screen.getByText('عالية')).toBeInTheDocument();
  });

  it('renders [متوسطة] badge text (medium priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [متوسطة]', isAr: true });
    expect(screen.getByText('متوسطة')).toBeInTheDocument();
  });

  it('renders [منخفضة] badge text (low priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [منخفضة]', isAr: true });
    expect(screen.getByText('منخفضة')).toBeInTheDocument();
  });

  it('renders all three Arabic priority badges in a multi-action plan', () => {
    renderPanel({
      result: '## خطة\n- بند عاجل [عالية]\n- بند متوسط [متوسطة]\n- بند منخفض [منخفضة]',
      isAr: true,
    });
    expect(screen.getByText('عالية')).toBeInTheDocument();
    expect(screen.getByText('متوسطة')).toBeInTheDocument();
    expect(screen.getByText('منخفضة')).toBeInTheDocument();
  });

  it('renders [أولوية عالية] badge text (long-form high priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [أولوية عالية]', isAr: true });
    expect(screen.getByText('أولوية عالية')).toBeInTheDocument();
  });

  it('renders [أولوية متوسطة] badge text (long-form medium priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [أولوية متوسطة]', isAr: true });
    expect(screen.getByText('أولوية متوسطة')).toBeInTheDocument();
  });

  it('renders [أولوية منخفضة] badge text (long-form low priority)', () => {
    renderPanel({ result: '- إجراء مطلوب [أولوية منخفضة]', isAr: true });
    expect(screen.getByText('أولوية منخفضة')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. Result panel controls: Copy, Regenerate, Collapse/Expand, Close
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — result panel controls (authenticated)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it('Copy button writes result text to clipboard', async () => {
    renderPanel({ result: MOCK_RESULT });
    fireEvent.click(screen.getByTitle('Copy to clipboard'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_RESULT);
    });
  });

  it('Copy button writes the raw markdown, not rendered HTML', async () => {
    const raw = '## Plan\n- **Bold action** [HIGH]\n- Normal action';
    renderPanel({ result: raw });
    fireEvent.click(screen.getByTitle('Copy to clipboard'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(raw);
    });
  });

  it('Copy button delivers the full raw string for a long multi-section plan (##, ###, -, 1.)', async () => {
    const longPlan = [
      '## Supplier Development Plan',
      '',
      '### Section 1: Quality Improvement',
      '- Conduct quarterly audits [HIGH]',
      '- Share ISO 9001 checklist with supplier [MEDIUM]',
      '- Schedule on-site review within 30 days [LOW]',
      '',
      '### Section 2: Delivery Performance',
      '1. Agree on lead-time targets by end of month',
      '2. Implement weekly shipment tracking [HIGH]',
      '3. Escalate chronic delays to procurement director',
      '',
      '## Phase 2: Strategic Alignment',
      '',
      '### Long-term Goals',
      '- **Joint roadmap** for capacity expansion [MEDIUM]',
      '- Annual business review with C-suite',
      '',
      '1. Draft partnership agreement',
      '2. Review after 6 months',
    ].join('\n');

    renderPanel({ result: longPlan });
    fireEvent.click(screen.getByTitle('Copy to clipboard'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longPlan);
    });
  });

  it('Regenerate button calls onGenerate', () => {
    const onGenerate = vi.fn();
    renderPanel({ result: MOCK_RESULT, onGenerate });
    fireEvent.click(screen.getByTitle('Regenerate'));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('Collapse button hides the result content', () => {
    renderPanel({ result: 'Some plan content here' });
    expect(screen.getByText('Some plan content here')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Collapse'));
    expect(screen.queryByText('Some plan content here')).toBeNull();
  });

  it('Expand button reveals content again after collapse', () => {
    renderPanel({ result: 'Visible content' });
    fireEvent.click(screen.getByTitle('Collapse'));
    expect(screen.queryByText('Visible content')).toBeNull();
    fireEvent.click(screen.getByTitle('Expand'));
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('Copy button still works when panel is collapsed', async () => {
    renderPanel({ result: MOCK_RESULT });
    fireEvent.click(screen.getByTitle('Collapse'));
    fireEvent.click(screen.getByTitle('Copy to clipboard'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_RESULT);
    });
  });

  it('Copy button writes the exact raw Arabic string (isAr=true, multi-section with priority badges)', async () => {
    const arabicPlan = [
      '## خطة تطوير المورد',
      '',
      '### القسم الأول: تحسين الجودة',
      '- إجراء مراجعات ربع سنوية [عالية]',
      '- مشاركة قائمة ISO 9001 مع المورد [متوسطة]',
      '- جدولة زيارة ميدانية خلال 30 يومًا [منخفضة]',
      '',
      '### القسم الثاني: أداء التسليم',
      '1. الاتفاق على مواعيد التسليم بنهاية الشهر',
      '2. تطبيق تتبع الشحنات الأسبوعي [عالية]',
      '3. تصعيد التأخيرات المتكررة إلى مدير المشتريات',
    ].join('\n');

    renderPanel({ result: arabicPlan, isAr: true });
    fireEvent.click(screen.getByTitle('نسخ إلى الحافظة'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(arabicPlan);
    });
  });

  it('Copy button writes the exact raw Arabic string when the panel is collapsed', async () => {
    const arabicPlan = [
      '## خطة تطوير المورد',
      '',
      '- بند عاجل [عالية]',
      '- بند متوسط [متوسطة]',
      '- بند منخفض [منخفضة]',
    ].join('\n');

    renderPanel({ result: arabicPlan, isAr: true });
    fireEvent.click(screen.getByTitle('طيّ'));
    fireEvent.click(screen.getByTitle('نسخ إلى الحافظة'));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(arabicPlan);
    });
  });

  it('Close button calls onReset', () => {
    const onReset = vi.fn();
    renderPanel({ result: MOCK_RESULT, onReset });
    fireEvent.click(screen.getByTitle('Close'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. Error state
══════════════════════════════════════════════════════════════════════════ */
describe('AIPlanPanel — error state (authenticated)', () => {
  it('shows the error message text', () => {
    renderPanel({ error: 'The AI service is unavailable. Please try again shortly.' });
    expect(
      screen.getByText('The AI service is unavailable. Please try again shortly.'),
    ).toBeInTheDocument();
  });

  it('shows a Retry button in the error state', () => {
    renderPanel({ error: 'Something went wrong' });
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('Retry button calls onGenerate', () => {
    const onGenerate = vi.fn();
    renderPanel({ error: 'Network failure', onGenerate });
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('Dismiss (✕) button in error state calls onReset', () => {
    const onReset = vi.fn();
    renderPanel({ error: 'Failed', onReset });
    const dismissBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '✕');
    expect(dismissBtn).toBeDefined();
    fireEvent.click(dismissBtn!);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not show the generate button when in error state', () => {
    renderPanel({ error: 'Failed', buttonLabel: 'Generate Plan ✨' });
    expect(screen.queryByRole('button', { name: /Generate Plan ✨/i })).toBeNull();
  });

  it('shows Arabic Retry label when isAr=true', () => {
    renderPanel({ error: 'خطأ', isAr: true });
    expect(screen.getByRole('button', { name: /إعادة المحاولة/i })).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 872 — amber rate-limit banner appears instead of red error when
   the AI plan limit is hit (rateLimited=true)
══════════════════════════════════════════════════════════════════════════ */

describe('AIPlanPanel — amber rate-limit banner (Task 872)', () => {
  it('shows the amber banner when rateLimited=true, not the red error panel', () => {
    renderPanel({ rateLimited: true, error: 'limit', retryAfterSeconds: 3600 });

    // Amber banner with role="status" must be present
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByText((txt) => txt.includes('AI plan limit reached') && txt.includes('min')),
    ).toBeInTheDocument();

    // Red error panel must NOT be present (no AlertCircle / Retry button)
    expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
  });

  it('shows "please try again later" fallback when retryAfterSeconds is 0', () => {
    renderPanel({ rateLimited: true, error: 'limit', retryAfterSeconds: 0 });

    expect(
      screen.getByText((txt) => txt.includes('AI plan limit reached') && txt.includes('later')),
    ).toBeInTheDocument();
  });

  it('shows "please try again later" fallback when retryAfterSeconds is null', () => {
    renderPanel({ rateLimited: true, error: 'limit', retryAfterSeconds: null });

    expect(
      screen.getByText((txt) => txt.includes('AI plan limit reached') && txt.includes('later')),
    ).toBeInTheDocument();
  });

  it('shows the red error panel (not amber) when rateLimited is false', () => {
    renderPanel({ rateLimited: false, error: 'Network error' });

    // Red error panel renders; amber rate-limit banner must not
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('dismiss button in amber banner calls onReset', () => {
    const onReset = vi.fn();
    renderPanel({ rateLimited: true, error: 'limit', retryAfterSeconds: 120, onReset });

    const dismissBtn = screen.getAllByRole('button').find(b => b.textContent?.trim() === '✕');
    fireEvent.click(dismissBtn!);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('shows Arabic rate-limit text when isAr=true', () => {
    renderPanel({ rateLimited: true, error: 'limit', retryAfterSeconds: 3600, isAr: true });

    expect(
      screen.getByText((txt) => txt.includes('تجاوزت الحد المسموح') && txt.includes('دقيقة')),
    ).toBeInTheDocument();
  });
});
