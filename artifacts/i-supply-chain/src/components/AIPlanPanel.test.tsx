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
