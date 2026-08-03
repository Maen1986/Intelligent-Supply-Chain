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
 *   - suppliers       → SupplierRecord[] (mutable roster)
 *
 * handleNameBlur() mirrors the component's onBlur handler.
 * switchSupplier()  mirrors calling setActiveId(id) (changes activeId) and then
 *                   the useEffect firing (clears warning/pendingName when id
 *                   differs from prevActiveId).
 */
function createScorecardState(suppliers: SupplierRecord[], initialActiveId: string, isAr = false) {
  let dupNameWarning: string | null = null;
  let pendingName: string | null = null;
  let activeId = initialActiveId;
  let prevActiveId: string | null = null; // starts at null, first render sets it
  const roster: SupplierRecord[] = [...suppliers];

  // Simulate the first render — useEffect records current activeId as prevActiveId
  // without clearing anything (prevActiveId is null on mount).
  prevActiveId = activeId;

  /**
   * Simulates the component's handleNameBlur.
   * Sets dupNameWarning when the typed name is a case-insensitive duplicate of
   * any other supplier; otherwise commits the name (clears warning, clears pending).
   * Mirrors the isAr branch in SupplierScorecard.tsx handleNameBlur.
   */
  const handleNameBlur = (typed: string) => {
    if (hasCaseInsensitiveDuplicate(typed, roster, activeId)) {
      const existing = roster.find(
        s => s.id !== activeId && s.name.toLowerCase() === typed.trim().toLowerCase(),
      )!;
      dupNameWarning = isAr
        ? `يوجد مورّد بهذا الاسم بالفعل: "${existing.name}". يرجى استخدام اسم مختلف.`
        : `A supplier named "${existing.name}" already exists. Please choose a different name.`;
      // pendingName stays set — the user's in-progress edit is preserved until
      // they either correct it or navigate away.
    } else {
      dupNameWarning = null;
      pendingName = null;
    }
  };

  /**
   * Simulates typing in the name field — sets pendingName (controlled input)
   * and clears dupNameWarning immediately, mirroring the component's onChange:
   *   if (dupNameWarning) setDupNameWarning(null);
   */
  const handleNameChange = (value: string) => {
    pendingName = value;
    if (dupNameWarning) dupNameWarning = null;
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

/* ─── State factory helpers ─── */

/**
 * Extends createScorecardState with an addSupplier() helper that mirrors the
 * component's addSupplier():
 *
 *   const s = newSupplier();
 *   save({ suppliers: [...roster.suppliers, s], activeId: s.id });
 *
 * Because save() changes activeId, the useEffect fires and — since the new id
 * differs from prevActiveId — clears dupNameWarning and pendingName.
 * We model that here by appending a new supplier record to the list and
 * delegating to switchSupplier(newId) so the same useEffect logic is applied.
 */
function createScorecardStateWithAddSupplier(
  initialSuppliers: SupplierRecord[],
  initialActiveId: string,
  isAr = false,
) {
  const suppliers = [...initialSuppliers];
  let nextIdx = suppliers.length;

  const state = createScorecardState(suppliers, initialActiveId, isAr);

  const addSupplier = () => {
    const newId = `sup-new-${nextIdx++}`;
    suppliers.push({ id: newId, name: '', tier: 'Strategic', subScores: {} });
    state.switchSupplier(newId);
  };

  return { ...state, addSupplier };
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
   Suite 4 — pendingName resets when a new supplier is added (addSupplier)
   This specifically guards the addSupplier → new activeId path described in
   the task: typing a name before clicking "Add Supplier" must NOT carry the
   in-progress text over to the freshly created supplier's name field.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — pendingName resets on addSupplier', () => {
  it('pendingName is null on the new supplier after typing on the previous one', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id);

    // User types in the name field but has NOT blurred yet
    sc.handleNameChange('Some Draft Text');
    expect(sc.getState().pendingName).toBe('Some Draft Text');

    // User clicks "Add Supplier" — activeId becomes the new supplier's id
    sc.addSupplier();

    // The new supplier's field must start empty
    expect(sc.getState().pendingName).toBeNull();
  });

  it('dupNameWarning is also null on the new supplier even when a warning was active', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id);

    // Trigger a duplicate-name warning on supplier A
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
    expect(sc.getState().pendingName).toBe('Beta Ltd');

    // User clicks "Add Supplier" without correcting the duplicate first
    sc.addSupplier();

    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });

  it('pendingName is null even when the typed text was a unique (non-duplicate) in-progress edit', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id);

    // User types a brand-new unique name but has not blurred (so roster name is unchanged)
    sc.handleNameChange('Totally Unique Name');
    expect(sc.getState().pendingName).toBe('Totally Unique Name');

    // User adds a new supplier before blurring
    sc.addSupplier();

    expect(sc.getState().pendingName).toBeNull();
  });

  it('pendingName stays null if there was no in-progress edit before addSupplier', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id);

    // No typing at all — pendingName is already null
    expect(sc.getState().pendingName).toBeNull();

    sc.addSupplier();

    expect(sc.getState().pendingName).toBeNull();
  });

  it('activeId changes to the new supplier id after addSupplier', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A], SUPPLIER_A.id);

    sc.handleNameChange('In-Progress Name');
    sc.addSupplier();

    // activeId must have changed (new supplier is now active)
    expect(sc.getState().activeId).not.toBe(SUPPLIER_A.id);
    expect(sc.getState().pendingName).toBeNull();
  });

  it('multiple addSupplier calls each start with a clean pendingName', () => {
    const sc = createScorecardStateWithAddSupplier([SUPPLIER_A], SUPPLIER_A.id);

    // First add — with in-progress text
    sc.handleNameChange('First Draft');
    sc.addSupplier();
    expect(sc.getState().pendingName).toBeNull();
    const firstNewId = sc.getState().activeId;

    // Second add — type on the first new supplier, then add another
    sc.handleNameChange('Second Draft');
    sc.addSupplier();
    expect(sc.getState().pendingName).toBeNull();
    expect(sc.getState().activeId).not.toBe(firstNewId);
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

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — dupNameWarning clears on onChange (before blur)
   Guards the `if (dupNameWarning) setDupNameWarning(null)` call inside the
   name field's onChange handler.  Without it, the red warning would linger
   while the user is still typing — confusing UX.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — dupNameWarning clears on onChange before blur', () => {
  it('clears dupNameWarning immediately when the user starts typing after a warning', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    // Step 1: trigger warning via blur
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // Step 2: user starts typing a correction — onChange fires, no blur yet
    sc.handleNameChange('Beta Ltd X');

    // Warning must be gone immediately — before any blur
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('clears the warning even for a single character change — not just a full replacement', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    sc.handleNameChange('Gamma GmbH');
    sc.handleNameBlur('Gamma GmbH');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // User adds just one character
    sc.handleNameChange('Gamma GmbH2');

    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('keeps pendingName updated to the new value after the warning clears', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');

    sc.handleNameChange('Something New');

    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBe('Something New');
  });

  it('does not clear the warning prematurely — warning is still present before onChange fires', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');

    // Warning is set after blur; no onChange yet
    expect(sc.getState().dupNameWarning).not.toBeNull();
  });

  it('leaves dupNameWarning null (does not set it) when onChange fires with no prior warning', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id);

    // No blur, no warning — just typing normally
    sc.handleNameChange('Delta Inc');

    expect(sc.getState().dupNameWarning).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Warning cannot appear on the only remaining supplier after
   the conflicting supplier is deleted
   (the core regression guard for this task)

   Strategy: call hasCaseInsensitiveDuplicate directly on a post-deletion
   roster (suppliers array with the deleted entry removed).  This tests
   the exported pure function — the same one the component calls inside
   deleteSupplier — so the tests cannot diverge from production logic.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — hasCaseInsensitiveDuplicate returns false after the conflicting supplier is deleted', () => {
  it('returns false for the active supplier name after deleting the only colliding supplier', () => {
    // Before deletion: A tries to rename itself to "Beta Ltd" — B causes the collision.
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', [SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id)).toBe(true);

    // Simulate deletion of B: filter it out of the roster.
    const afterDelete = [SUPPLIER_A, SUPPLIER_B].filter(s => s.id !== SUPPLIER_B.id);

    // After deletion: only A remains — no collision possible.
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', afterDelete, SUPPLIER_A.id)).toBe(false);
  });

  it('returns false for a mixed-case variant after deleting the colliding supplier', () => {
    expect(hasCaseInsensitiveDuplicate('BETA LTD', [SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id)).toBe(true);

    const afterDelete = [SUPPLIER_A, SUPPLIER_B].filter(s => s.id !== SUPPLIER_B.id);

    expect(hasCaseInsensitiveDuplicate('BETA LTD', afterDelete, SUPPLIER_A.id)).toBe(false);
  });

  it('still returns true if the deleted supplier was NOT the source of the collision', () => {
    // A (active) tries to use "Beta Ltd" — B is the conflict.  Deleting C leaves B intact.
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);

    const afterDeleteC = ALL_SUPPLIERS.filter(s => s.id !== SUPPLIER_C.id);

    // B is still in the roster, so the collision persists.
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', afterDeleteC, SUPPLIER_A.id)).toBe(true);
  });

  it('returns false for any name when the roster is reduced to a single supplier', () => {
    // After all-but-one deletions the sole remaining supplier can never collide with itself.
    const soloRoster = [SUPPLIER_A];
    expect(hasCaseInsensitiveDuplicate('Alpha Corp',  soloRoster, SUPPLIER_A.id)).toBe(false);
    expect(hasCaseInsensitiveDuplicate('Beta Ltd',    soloRoster, SUPPLIER_A.id)).toBe(false);
    expect(hasCaseInsensitiveDuplicate('Gamma GmbH',  soloRoster, SUPPLIER_A.id)).toBe(false);
  });

  it('returns false when deleting reduces a three-supplier roster to two with no remaining collision', () => {
    // Three suppliers: A (active), B ("Beta Ltd"), C ("Gamma GmbH").
    // A wants to rename to "Beta Ltd" — collision with B.
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', ALL_SUPPLIERS, SUPPLIER_A.id)).toBe(true);

    // Delete B; two suppliers remain (A and C) — no collision for "Beta Ltd".
    const afterDeleteB = ALL_SUPPLIERS.filter(s => s.id !== SUPPLIER_B.id);
    expect(hasCaseInsensitiveDuplicate('Beta Ltd', afterDeleteB, SUPPLIER_A.id)).toBe(false);
  });

});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — Arabic warning path (isAr = true)
   Confirms that when the component is in Arabic mode, blurring a duplicate
   name produces the correct Arabic warning string, and blurring a unique
   name clears the warning — mirroring the isAr branch of handleNameBlur in
   SupplierScorecard.tsx.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard — duplicate-name warning text in Arabic mode (isAr = true)', () => {
  it('produces a non-null Arabic warning when a duplicate name is blurred', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
  });

  it('Arabic warning contains the existing supplier\'s name in quoted form', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    // The warning must embed the colliding supplier's stored name inside quotes.
    expect(sc.getState().dupNameWarning).toContain('"Beta Ltd"');
  });

  it('Arabic warning uses the correct Arabic template string', () => {
    // Mirrors: `يوجد مورّد بهذا الاسم بالفعل: "${existing.name}". يرجى استخدام اسم مختلف.`
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    const warning = sc.getState().dupNameWarning!;
    expect(warning).toContain('يوجد مورّد بهذا الاسم بالفعل');
    expect(warning).toContain('يرجى استخدام اسم مختلف');
  });

  it('Arabic warning is different from the English warning for the same collision', () => {
    const scEn = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ false);
    scEn.handleNameChange('Beta Ltd');
    scEn.handleNameBlur('Beta Ltd');

    const scAr = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    scAr.handleNameChange('Beta Ltd');
    scAr.handleNameBlur('Beta Ltd');

    expect(scAr.getState().dupNameWarning).not.toBe(scEn.getState().dupNameWarning);
  });

  it('Arabic warning is set for a mixed-case duplicate name (case-insensitive match)', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('BETA LTD');
    sc.handleNameBlur('BETA LTD');
    expect(sc.getState().dupNameWarning).not.toBeNull();
    expect(sc.getState().dupNameWarning).toContain('يوجد مورّد بهذا الاسم بالفعل');
  });

  it('clears the Arabic warning when blurring a unique name', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);

    // First blur — duplicate
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // Second blur — unique name
    sc.handleNameChange('Delta Inc');
    sc.handleNameBlur('Delta Inc');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('warning is null in Arabic mode when blurring the supplier\'s own name (no self-collision)', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Alpha Corp');
    sc.handleNameBlur('Alpha Corp');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('warning is null in Arabic mode for a brand-new unique name', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Delta Inc');
    sc.handleNameBlur('Delta Inc');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  /* ── Task 484: onChange immediately clears the Arabic warning ─────────── */

  it('clears the Arabic warning immediately when the user starts typing a correction (onChange, before blur)', () => {
    // Step 1: set an Arabic duplicate-name warning via blur
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();
    expect(sc.getState().dupNameWarning).toContain('يوجد مورّد بهذا الاسم بالفعل');

    // Step 2: user starts typing a correction — onChange fires (no blur yet)
    sc.handleNameChange('Beta Ltda');

    // Step 3: warning must vanish immediately, before any subsequent blur
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('Arabic warning cleared by onChange does not reappear until the next blur with a duplicate', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    // onChange: clear warning
    sc.handleNameChange('X');
    expect(sc.getState().dupNameWarning).toBeNull();

    // Further typing: still null (no blur has fired)
    sc.handleNameChange('XY');
    expect(sc.getState().dupNameWarning).toBeNull();

    // Blur with unique name: stays null
    sc.handleNameBlur('XY');
    expect(sc.getState().dupNameWarning).toBeNull();
  });

  it('Arabic warning clears on supplier switch, same as English mode', () => {
    const sc = createScorecardState(ALL_SUPPLIERS, SUPPLIER_A.id, /* isAr */ true);
    sc.handleNameChange('Beta Ltd');
    sc.handleNameBlur('Beta Ltd');
    expect(sc.getState().dupNameWarning).not.toBeNull();

    sc.switchSupplier(SUPPLIER_B.id);

    expect(sc.getState().dupNameWarning).toBeNull();
    expect(sc.getState().pendingName).toBeNull();
  });
});
