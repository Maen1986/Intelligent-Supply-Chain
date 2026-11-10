// userEventLite.ts -- minimal stand-in for the subset of @testing-library/user-event that TierBadge.test.tsx uses
// (setup, click, tab, keyboard with {Enter} {Escape} and plain characters).
//
// Why it exists: @testing-library/user-event is NOT a dependency of this repo (not in package.json, not in
// pnpm-lock.yaml). Adding it would change package.json and the lockfile, which this additive change does not do.
// It is built on fireEvent from @testing-library/react (already a dev dependency), so every call runs inside act().
// If the repo later adds @testing-library/user-event, delete this file and import it in the test instead.
import { fireEvent } from '@testing-library/react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE));
}

function target(): Element {
  return document.activeElement ?? document.body;
}

function tokens(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length;) {
    if (s[i] === '{') { const j = s.indexOf('}', i); out.push(s.slice(i + 1, j)); i = j + 1; } else { out.push(s[i]); i += 1; }
  }
  return out;
}

async function click(el: Element): Promise<void> {
  const focusTarget = (el as HTMLElement).closest?.(FOCUSABLE) as HTMLElement | null;
  fireEvent.pointerDown(el); fireEvent.mouseDown(el);
  if (focusTarget) focusTarget.focus();
  fireEvent.pointerUp(el); fireEvent.mouseUp(el);
  fireEvent.click(el);
}

async function tab(opts: { shift?: boolean } = {}): Promise<void> {
  const from = target();
  const notPrevented = fireEvent.keyDown(from, { key: 'Tab', code: 'Tab', shiftKey: !!opts.shift });
  if (notPrevented) {
    const list = focusables();
    const cur = document.activeElement as HTMLElement | null;
    let idx = cur ? list.indexOf(cur) : -1;
    if (idx === -1 && cur && cur !== document.body) {
      // active element is not in the tab order (e.g. tabindex="-1" dialog): continue from its document position
      const after = list.findIndex((e) => cur.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
      idx = opts.shift ? (after === -1 ? list.length : after) : after - 1;
    }
    const next = opts.shift ? (idx <= 0 ? list[list.length - 1] : list[idx - 1]) : list[(idx + 1) % list.length];
    next?.focus();
  }
  fireEvent.keyUp(document.activeElement ?? document.body, { key: 'Tab', code: 'Tab', shiftKey: !!opts.shift });
}

async function keyboard(text: string): Promise<void> {
  for (const tk of tokens(text)) {
    const key = tk;
    const code = key === ' ' ? 'Space' : key;
    const el = target();
    const notPrevented = fireEvent.keyDown(el, { key, code });
    if (notPrevented && key === 'Enter' && el instanceof HTMLButtonElement) fireEvent.click(el);
    fireEvent.keyUp(target(), { key, code });
    if (key === ' ' && el instanceof HTMLButtonElement) fireEvent.click(el); // Space activates a button on keyup
  }
}

export default {
  setup() { return { click, tab, keyboard }; },
};
