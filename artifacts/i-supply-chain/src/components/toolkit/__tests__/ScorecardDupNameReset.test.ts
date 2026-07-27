/**
 * Scorecard duplicate-name warning reset tests
 *
 * Verifies that when the active supplier changes, `dupNameWarning` and
 * `pendingName` are cleared — matching the useEffect in SupplierScorecard
 * (lines 546–554) that calls setDupNameWarning(null) and setPendingName(null)
 * whenever prevActiveId !== active.id.
 *
 * The tests model the component's state as plain JS variables and simulate
 * the same conditional logic, keeping the suite dependency-free (no DOM,
 * no React renderer, no network stubs needed).
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { hasCaseInsensitiveDuplicate } from '../SupplierScorecard';

/* ─── Types (mirrors SupplierRecord in SupplierScorecard.tsx) ─── */
interface SupplierRecord {
  id: string;
  name: string;
  tier: string;
  subScores: Record<string, Record<string, string>>;
}

/* ─── Minimal state model that mirrors the component ─── */

/**
 * Simulates the subset of SupplierScorecard state that is relevant for
 * duplicate-name warning resets:
 *
 *   - dupNameWarning  → string | null
 *   - pendingName     → string | null
 *   - activeId        → string (from roster.activeId)
 *   - prevActiveId    → string | null (tracks what prevActiveIdRef.current holds)
 *
 * handleNameBlur() mirrors the component's onBlur handler.
 * switchSupplier()  mirrors calling setActiveId(id) (changes activeId) and then
 *                   the useEffect firing (clears warning/pendingName when id
 *                   differs from prevActiveId).
 */
function createScorecardState(suppliers: SupplierRecord[], initialActiveId: string) {
  let dupNameWarning: string | null = null;
  let pendingName: string | null = null;
  let activeId = initialActiveId;
  let prevActiveId: string | null = null; // starts at null, first render sets it

  // Simulate the first render — useEffect records current activeId as prevActiveId
  // without clearing anything (prevActiveId is null on mount).
  prevActiveId = activeId;

  /**
   * Simulates the component's handleNameBlur.
   * Sets dupNameWarning when the typed name is a case-insensitive duplicate of
   * any other supplier; otherwise commits the name (clears warning, clears pending).
   */
  const handleNameBlur = (typed: string) => {
    if (hasCaseInsensitiveDuplicate(typed, suppliers, activeId)) {
      const existing = suppliers.find(
        s => s.id !== activeId && s.name.toLowerCase() === typed.trim().toLowerCase(),
      )!;
      dupNameWarning = `A supplier named "${existing.name}" already exists. Please choose a different name.`;
      // pendingName stays set — the user's in-progress edit is preserved until
      // they either correct it or navigate away.
    } else {
      dupNameWarning = null;
      pendingName = null;
    }
  };

  /**
   * Simulates typing in the name field — sets pendingName (controlled input).
   */
  const handleNameChange = (value: string) => {
    pendingName = value;
  };

  /**
   * Simulates switching to a different supplier (setActiveId + useEffect).
   * The useEffect fires after the state update; here we apply it inline.
   */
  const switchSupplier = (newId: string) => {
    const prevId = activeId;
    activeId = newId;

    // Mirrors the useEffect:
    //   if (active?.id && prevActiveIdRef.current !== null && prevActiveIdRef.current !== active.id)
    if (activeId && prevId !== null && prevId !== activeId) {
      // resetPlan() — not tracked here
      dupNameWarning = null;
      pendingName = null;
    }
    prevActiveId = activeId;
  };

  return {
    getState: () => ({ dupNameWarning, pendingName, activeId, prevActiveId }),
    handleNameBlur,
    handleNameChange,
    switchSupplier,
  };
}

/* ─── Fixtures ─── */

const SUPPLIER_A: SupplierRecord = {
  id: 'sup-a',
  name: 'Alpha Corp',
  tier: 'Strategic',
  subScores: {},
};

const SUPPLIER_B: SupplierRecord = {
  id: 'sup-b',
  name: 'Beta Ltd',
  tier: 'Preferred',
  subScores: {},
};

const SUPPLIER_C: SupplierRecord = {
  id: 'sup-c',
  name: 'Gamma GmbH',
  tier: 'Transactional',
  subScores: {},
};

const ALL_SUPPLIERS = [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C];

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — Warning is set correctly on blur with a duplicate name
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — duplicate-name warning is set on blur', () => {
  it('sets dupNameWarning when the typed name matches another supplier (exact case)', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
    expect(sc.getState().dupNameWarning).toContain('"Beta Ltd"');
  });

  it('sets dupNameWarning when the typed name matches another supplier (different case)', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('beta ltd');
    sc.handleNameBlur('beta ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
  });

  it('preserves pendingName when a duplicate is detected (so the field keeps the user input)', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    // pendingName is not cleared on duplicate — the user should be able to correct it
    expect(sc.getState().pendingName).toBe('Beta Ltd');
  });

  it('does NOT set dupNameWarning for the supplier\'s own name', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Alpha Corp');
    sc.handleNameBlur('Alpha Corp');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('does NOT set dupNameWarning for a unique name', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Delta Inc');
    sc.handleNameBlur('Delta Inc');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('clears dupNameWarning when the user corrects to a unique name', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    // First blur — duplicate
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
    // Second blur — unique name
    sc.handleNameChange('Delta Inc');
    sc.handleNameBlur('Delta Inc');
    expect(sc.getState().dupNameWarning).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Warning and pendingName clear when the active supplier changes
   (the core behaviour this task exists to guard)
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — dupNameWarning and pendingName reset on supplier switch', () => {
  it('clears dupNameWarning after switching to a different supplier', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    // Step 1: trigger warning
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // Step 2: switch supplier
    sc.switchSupplier(SUPPLIER_B.id);

    // Step 3: assert cleared
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('clears pendingName after switching to a different supplier', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    // Step 1: trigger warning (pendingName keeps the in-progress text)
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().pendingName).not.toBeNull();

    // Step 2: switch supplier
    sc.switchSupplier(SUPPLIER_B.id);

    // Step 3: assert cleared
    expect(sc.getState().pendingName).toBeNull();
  });

  it('clears both dupNameWarning and pendingName in a single switch', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    const before = sc.getState();
    expect(before.dupNameWarning).not.toBeNull();
    expect(before.pendingName).not.toBeNull();

    sc.switchSupplier(SUPPLIER_C.id);

    const after = sc.getState();
    expect(after.dupNameWarning).toBeNull();
    expect(after.pendingName).toBeNull();
  });

  it('clears warning even when switching to a third (unrelated) supplier', () => {
    // Warning was triggered on supplier A; we switch to supplier C (not B)
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');

    sc.switchSupplier(SUPPLIER_C.id);

    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });

  it('clears warning when switching back to the first supplier after a round trip', () => {
    // A → B (clears) → A (clears again, proving the ref is updated each time)
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');

    sc.switchSupplier(SUPPLIER_B.id);
    expect(sc.getState().dupNameWarning).toBeNull();

    // On supplier B, set another warning
    sc.handleNameChange('Gamma GmbH');
    sc.handleNameBlur('Gamma GmbH');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // Switch back to A
    sc.switchSupplier(SUPPLIER_A.id);
    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });

  it('does NOT clear the warning if the active id does not actually change', () => {
    // Calling switchSupplier with the same id should not fire the clear branch
    // (mirrors the useEffect guard: prevActiveId !== active.id)
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // "Switch" to the same supplier — no change
    sc.switchSupplier(SUPPLIER_A.id);

    // Warning should remain because the id did not change
    expect(sc.getState().dupNameWarning).not.toBeNull();
    expect(sc.getState().pendingName).not.toBeNull();
  });

  it('warning is already null when no duplicate was entered before switching', () => {
    // No error state → switch → state is still clean
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.switchSupplier(SUPPLIER_B.id);
    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });

  it('clears warning immediately on switch — not only after a subsequent blur', () => {
    // Verifies that the cleanup is triggered by the supplier switch, not by
    // the next handleNameBlur call on the new supplier.
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');

    sc.switchSupplier(SUPPLIER_C.id);

    // At this point no blur has occurred on supplier C yet — warning must be gone.
    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — hasCaseInsensitiveDuplicate helper (edge cases)
   Confirms the predicate that gates warning creation behaves correctly.
══════════════════════════════════════════════════════════════════════════ */

describe('hasCaseInsensitiveDuplicate', () => {
  beforeEach(() => localStorage.clear());

  it('returns true for an exact case match against another supplier', () => {
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);
  });

  it('returns true for a mixed-case variant of another supplier name', () => {
    expect(hasCaseInsensitiveDuplicate('BETA LTD', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);
    expect(hasCaseInsensitiveDuplicate('beta ltd', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);
  });

  it('returns false for the excluded supplier\'s own name', () => {
    expect(hasCaseInsensitiveDuplicate('Alpha Corp', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(false);
  });

  it('returns false for a unique name not present in the roster', () => {
    expect(hasCaseInsensitiveDuplicate('Delta Inc', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(hasCaseInsensitiveDuplicate('', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(hasCaseInsensitiveDuplicate('   ', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(false);
  });

  it('trims whitespace before comparing', () => {
    expect(hasCaseInsensitiveDuplicate('  Beta Ltd  ', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);
  });

  it('returns false when the roster has only one supplier (no other to collide with)', () => {
    expect(hasCaseInsensitiveDuplicate('Alpha Corp', [SUPPLIER_A], SUPPLIER_A.id)).toBe(false);
  });
});
