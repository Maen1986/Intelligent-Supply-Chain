import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent, within } from '@testing-library/react';
import { RiskRegisterWorkspace } from '../RiskRegisterWorkspace';
import { createMemoryClient } from '@/lib/riskRegisterMemoryClient';
import { daysUntil, missingForPublish, type RegisterRisk } from '@/lib/riskRegisterTypes';

afterEach(() => cleanup());
const TODAY = '2026-11-18';
const ARABIC = /[؀-ۿ]/;
const mk = (n: number, o: Partial<RegisterRisk> = {}): RegisterRisk => ({
  id: n, riskRef: `R-${String(n).padStart(4, '0')}`, rowVersion: 1, status: 'open',
  event: `Event ${n}`, cause: '', consequence: '', ownerName: 'L. Said', reviewDate: '2027-01-15', ...o,
});
const seed = [
  mk(1, { ownerName: null }),                                  // unowned
  mk(2, { reviewDate: '2026-11-01' }),                          // overdue by 17 days
  mk(3, { status: 'draft', ownerName: null, reviewDate: null }), // draft, unowned, no date
  mk(4),                                                        // clean
];

describe('register helpers', () => {
  it('daysUntil counts whole days, negative when overdue', () => {
    expect(daysUntil('2026-11-18', TODAY)).toBe(0);
    expect(daysUntil('2026-11-01', TODAY)).toBe(-17);
    expect(daysUntil('2026-12-31', TODAY)).toBe(43);
  });
  it('missingForPublish lists what a draft still needs', () => {
    expect(missingForPublish({ event: '', ownerName: null, reviewDate: null })).toEqual(['event', 'owner', 'reviewDate']);
    expect(missingForPublish({ event: 'x', ownerName: ' ', reviewDate: '2027-01-01' })).toEqual(['owner']);
    expect(missingForPublish({ event: 'x', ownerName: 'A', reviewDate: '2027-01-01' })).toEqual([]);
  });
});

describe('RiskRegisterWorkspace (round 2)', () => {
  it('empty register shows one clear next step, no counts', async () => {
    render(<RiskRegisterWorkspace client={createMemoryClient([])} isAr={false} today={TODAY} />);
    expect(await screen.findByTestId('empty-state')).toBeTruthy();
    expect(screen.getByRole('button', { name: /add the first risk/i })).toBeTruthy();
    expect(screen.queryByTestId('chip-unowned')).toBeNull();
  });

  it('attention chips are plain counts that filter the list', async () => {
    render(<RiskRegisterWorkspace client={createMemoryClient(seed)} isAr={false} today={TODAY} />);
    await screen.findByTestId('risk-list');
    expect(screen.getByTestId('chip-unowned').textContent).toContain('2 have no owner');
    expect(screen.getByTestId('chip-overdue').textContent).toContain('1 review overdue');
    expect(screen.getByTestId('chip-draft').textContent).toContain('1 still drafts');
    fireEvent.click(screen.getByTestId('chip-unowned'));
    expect(screen.getByTestId('chip-unowned').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByTestId('risk-row')).toHaveLength(2);
    expect(screen.getByTestId('shown-count').textContent).toBe('Showing 2 of 4.');
    fireEvent.click(screen.getByTestId('chip-unowned')); // toggles off
    expect(screen.getAllByTestId('risk-row')).toHaveLength(4);
  });

  it('rows say what is wrong in words, not only colour', async () => {
    render(<RiskRegisterWorkspace client={createMemoryClient(seed)} isAr={false} today={TODAY} />);
    await screen.findByTestId('risk-list');
    const text = screen.getByTestId('risk-list').textContent!;
    expect(text).toContain('No owner yet');
    expect(text).toContain('Review overdue by 17 days');
    expect(text).toContain('No review date');
  });

  it('never shows a score, rank, rating or money total (never-show list)', async () => {
    const { container } = render(<RiskRegisterWorkspace client={createMemoryClient(seed)} isAr={false} today={TODAY} />);
    await screen.findByTestId('risk-list');
    for (const w of [/\bscore\b(?! it)/i, /top \d+/i, /\brank/i, /\bheat ?map/i, /\btotal\b/i, /SAR|USD|\$/]) {
      // the honesty sentence mentions "scored" and "ratings" on purpose; the checks above exclude only that wording
      const t = container.textContent!.replace(/is not rated or scored here/, '').replace(/ratings, money/, '');
      expect(t).not.toMatch(w);
    }
  });

  it('adds a risk: only the first box is required, empty event is refused with a plain message', async () => {
    const client = createMemoryClient([]);
    render(<RiskRegisterWorkspace client={client} isAr={false} today={TODAY} />);
    fireEvent.click(await screen.findByRole('button', { name: /add the first risk/i }));
    fireEvent.click(await screen.findByTestId('f-save'));
    expect((await screen.findByTestId('form-error')).textContent).toBe('Say what could happen first.');
    expect((client as any)._rows).toHaveLength(0);
    fireEvent.change(screen.getByTestId('f-event'), { target: { value: 'Port strike delays inbound stock' } });
    fireEvent.click(screen.getByTestId('f-save'));
    await waitFor(() => expect(screen.getAllByTestId('risk-row')).toHaveLength(1));
    expect(screen.getByTestId('risk-list').textContent).toContain('R-0001');
    expect(screen.getByTestId('risk-list').textContent).toContain('No owner yet');
    expect(screen.getByTestId('risk-list').textContent).toContain('Draft');
  });

  it('a double press on Save never creates two risks (same idempotency key)', async () => {
    const client = createMemoryClient([]);
    render(<RiskRegisterWorkspace client={client} isAr={false} today={TODAY} />);
    fireEvent.click(await screen.findByRole('button', { name: /add the first risk/i }));
    fireEvent.change(await screen.findByTestId('f-event'), { target: { value: 'Supplier fails audit' } });
    const save = screen.getByTestId('f-save');
    fireEvent.click(save); fireEvent.click(save);
    await waitFor(() => expect(screen.getAllByTestId('risk-row')).toHaveLength(1));
    expect((client as any)._rows).toHaveLength(1);
  });

  it('record: publish is explained, then enabled once owner and date exist, after saving', async () => {
    const client = createMemoryClient([mk(3, { status: 'draft', ownerName: null, reviewDate: null })]);
    render(<RiskRegisterWorkspace client={client} isAr={false} today={TODAY} />);
    fireEvent.click(await screen.findByTestId('risk-row'));
    expect((await screen.findByTestId('gate-text')).textContent).toBe('To publish, add an owner, a review date.');
    expect((screen.getByTestId('r-publish') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId('r-owner'), { target: { value: 'L. Said' } });
    fireEvent.change(screen.getByTestId('r-review'), { target: { value: '2027-02-01' } });
    expect(screen.getByTestId('gate-text').textContent).toBe('Save your changes first, then publish.');
    fireEvent.click(screen.getByTestId('r-save'));
    await waitFor(() => expect(screen.getByTestId('save-msg').textContent).toBe('Saved as a new version.'));
    expect(screen.getByTestId('version-line').textContent).toContain('Version 2');
    expect(screen.getByTestId('gate-text').textContent).toBe('Ready to publish.');
    fireEvent.click(screen.getByTestId('r-publish'));
    await waitFor(() => expect(screen.getByTestId('save-msg').textContent).toBe('Published. It is now open.'));
  });

  it('a conflict keeps the person\'s edits and offers the other version, no silent overwrite', async () => {
    const client = createMemoryClient([mk(1, { ownerName: 'A. Khan' })]);
    render(<RiskRegisterWorkspace client={client} isAr={false} today={TODAY} />);
    fireEvent.click(await screen.findByTestId('risk-row'));
    await screen.findByTestId('r-owner');
    fireEvent.change(screen.getByTestId('r-owner'), { target: { value: 'My edit' } });
    (client as any)._bump(1, { ownerName: 'Their edit' });  // someone else saves first
    fireEvent.click(screen.getByTestId('r-save'));
    const box = await screen.findByTestId('conflict');
    expect(box.textContent).toContain('Someone saved this risk before you.');
    expect((screen.getByTestId('r-owner') as HTMLInputElement).value).toBe('My edit'); // edits kept
    expect((client as any)._rows[0].ownerName).toBe('Their edit'); // nothing overwritten
    fireEvent.click(within(box).getByTestId('conflict-reload'));
    await waitFor(() => expect((screen.getByTestId('r-owner') as HTMLInputElement).value).toBe('Their edit'));
  });

  it('load failure shows what happened and a retry', async () => {
    const bad = { ...createMemoryClient([]), list: async () => { throw new Error('x'); } } as any;
    render(<RiskRegisterWorkspace client={bad} isAr={false} today={TODAY} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('could not be loaded');
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('Arabic: right-to-left, real Arabic strings, Latin refs isolated, same structure', async () => {
    const { container } = render(<RiskRegisterWorkspace client={createMemoryClient(seed)} isAr={true} today={TODAY} />);
    await screen.findByTestId('risk-list');
    expect(screen.getByTestId('risk-register').getAttribute('dir')).toBe('rtl');
    expect(screen.getByTestId('chip-unowned').textContent).toMatch(ARABIC);
    expect(screen.getByTestId('chip-unowned').textContent).toContain('2');
    expect(screen.getByTestId('risk-list').textContent).toContain('بلا مالك بعد');
    expect(screen.getByTestId('risk-list').textContent).toContain('مراجعتها متأخرة 17 يومًا');
    expect(container.querySelectorAll('bdi').length).toBeGreaterThan(4); // refs and counts isolated
    expect(container.textContent).not.toMatch(/No owner yet|Add a risk/); // no English leaks
  });

  it('every control has an accessible name and touch targets are at least 44px by class', async () => {
    const { container } = render(<RiskRegisterWorkspace client={createMemoryClient(seed)} isAr={false} today={TODAY} />);
    await screen.findByTestId('risk-list');
    for (const b of Array.from(container.querySelectorAll('button'))) {
      expect((b.textContent || b.getAttribute('aria-label') || '').trim().length, b.outerHTML).toBeGreaterThan(0);
      expect(b.className).toMatch(/min-h-\[44px\]/);
    }
  });
});
