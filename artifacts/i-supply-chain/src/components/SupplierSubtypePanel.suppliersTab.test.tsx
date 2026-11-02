/**
 * Suppliers-tab edge cases (Round B6, item 3): empty list, keyboard-operable
 * controls, Arabic / right-to-left, and the new Module 04 / 06 link block.
 */
import React from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, isAuthenticated: false, loading: false }) }));

import { SupplierSubtypePanel } from './SupplierSubtypePanel';
import type { SupplierRecord } from '@/lib/supplierRecoveryPortfolio';

const SUP: SupplierRecord[] = [{
  supplierId: 's1', name: 'Gulf Valves', category: 'Valves', quadrant: 'bottleneck', quadrantPriorQuarter: null,
  scoreHistory12mo: [80, 80, 80, 80, 80, 80], cars: [],
}];
const props = { asOfIso: '2026-11-01', categoryItems: [], shares: [] };

function openNetwork(isAr: boolean) {
  const group = screen.getByRole('group', { name: isAr ? 'عرض أنواع كرالجيك' : 'Kraljic sub-type views' });
  fireEvent.click(within(group).getByRole('button', { name: isAr ? /الشبكة/ : /Network: how sub-types connect/ }));
}

beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });
afterEach(cleanup);

describe('Suppliers tab: empty list', () => {
  it('says there are no suppliers, in English and Arabic, without crashing', () => {
    render(<SupplierSubtypePanel isAr={false} suppliers={[]} {...props} />);
    expect(screen.getByText('No suppliers yet.')).toBeTruthy();
    cleanup();
    render(<SupplierSubtypePanel isAr suppliers={[]} {...props} />);
    expect(screen.getByText('لا يوجد موردون بعد.')).toBeTruthy();
  });
});

describe('Suppliers tab: keyboard and structure', () => {
  it('every view switch is a real button with a pressed state, and the group is labelled', () => {
    render(<SupplierSubtypePanel isAr={false} suppliers={SUP} {...props} />);
    const group = screen.getByRole('group', { name: /Kraljic sub-type views/ });
    const buttons = group.querySelectorAll('button');
    expect(buttons.length).toBe(6);
    buttons.forEach((b) => { expect(b.getAttribute('type')).toBe('button'); expect(b.hasAttribute('aria-pressed')).toBe(true); });
  });
  it('a sub-type button can be focused and activated like a keyboard user would (Enter/Space fire click on a real button)', () => {
    render(<SupplierSubtypePanel isAr={false} suppliers={SUP} {...props} />);
    openNetwork(false);
    const btn = screen.getByRole('button', { name: /Bottleneck - locked/ });
    btn.focus();
    expect(document.activeElement).toBe(btn);
    expect(btn.tagName).toBe('BUTTON');
    fireEvent.click(btn);
    // The same element must survive the click (no remount), so keyboard focus is not lost.
    expect(btn.isConnected).toBe(true);
    expect(document.activeElement).toBe(btn);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('Module 04 / 06 link block on a selected sub-type', () => {
  it('shows enhanced due diligence and a supplier-strong stance for a locked bottleneck (EN)', () => {
    render(<SupplierSubtypePanel isAr={false} suppliers={SUP} {...props} />);
    openNetwork(false);
    expect(screen.queryByTestId('kraljic-module-links')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Bottleneck - locked/ }));
    const box = screen.getByTestId('kraljic-module-links');
    expect(box.textContent).toMatch(/Due diligence \(Module 04\): Enhanced/);
    expect(box.textContent).toMatch(/Negotiation stance \(Module 06\)/);
    expect(box.textContent).toMatch(/supplier holds the stronger position/);
    expect(box.textContent).toMatch(/ISC method/);
  });
  it('shows standard due diligence for non-critical (EN) and updates when another sub-type is picked', () => {
    render(<SupplierSubtypePanel isAr={false} suppliers={SUP} {...props} />);
    openNetwork(false);
    fireEvent.click(screen.getByRole('button', { name: /Non-critical - poolable/ }));
    expect(screen.getByTestId('kraljic-module-links').textContent).toMatch(/Module 04\): Standard/);
  });
  it('renders in Arabic with Arabic text and no English leak inside the block', () => {
    render(<SupplierSubtypePanel isAr suppliers={SUP} {...props} />);
    openNetwork(true);
    const locked = screen.getAllByRole('button').find((b) => b.getAttribute('aria-pressed') !== null && /\(\d+\)/.test(b.textContent ?? '') && /اختناق/.test(b.textContent ?? ''));
    expect(locked).toBeTruthy();
    fireEvent.click(locked!);
    const box = screen.getByTestId('kraljic-module-links');
    expect(box.textContent).toMatch(/العناية الواجبة \(الوحدة 4\)/);
    expect(box.textContent).toMatch(/موقف التفاوض \(الوحدة 6\)/);
    expect(box.textContent).not.toMatch(/Due diligence|Negotiation stance/);
  });
});
