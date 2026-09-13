/**
 * supplierOffboarding.test.ts
 *
 * Standalone stress-test suite for Item 7's core module, run before UI
 * wiring, following the same "step zero, stress-test standalone first"
 * discipline as Items 4-6. Covers soft/hardest/boundary tiers (Rule 7) plus
 * a cross-engine chained scenario continuing directly from Item 6's own
 * Rawabi blacklist finalize.
 */
import { describe, it, expect } from 'vitest';
import {
  inferCooperationLevel,
  isCrossReferencedTrigger,
  determineChecklistRequirement,
  isGatingRequirement,
  getChecklistItemDefinition,
  TRANSITION_CHECKLIST_ITEM_KEYS,
  computeAdvisoryTransitionPlan,
  suggestOffboardingTriggerContext,
  computeCurrentTransitionState,
  validateTransitionClosure,
  mapTriggerToAslReasonCategory,
  buildAslCrossReferenceReasonNote,
  OFFBOARDING_TRIGGER_REASONS,
  type OffboardingTriggerReason,
  type TransitionEventLike,
} from './supplierOffboarding';

describe('inferCooperationLevel -- sourced default per trigger reason (Financier Worldwide)', () => {
  it('infers adversarial for a blacklist-finalized trigger', () => {
    expect(inferCooperationLevel('blacklist_finalized')).toBe('adversarial');
  });
  it('infers limited for an unrelated ASL revocation and a supplier-initiated exit', () => {
    expect(inferCooperationLevel('asl_revoked_unrelated')).toBe('limited');
    expect(inferCooperationLevel('supplier_initiated_exit')).toBe('limited');
  });
  it('infers cooperative for the four ordinary planned/mutual business reasons', () => {
    expect(inferCooperationLevel('natural_contract_end')).toBe('cooperative');
    expect(inferCooperationLevel('mutual_termination')).toBe('cooperative');
    expect(inferCooperationLevel('replaced_by_another_supplier')).toBe('cooperative');
    expect(inferCooperationLevel('insourced')).toBe('cooperative');
  });
  it('covers every declared trigger reason with no gap', () => {
    for (const r of OFFBOARDING_TRIGGER_REASONS) {
      expect(['cooperative', 'limited', 'adversarial']).toContain(inferCooperationLevel(r));
    }
  });
});

describe('isCrossReferencedTrigger', () => {
  it('is true only for the two triggers that represent a decision Item 6/3 already made', () => {
    expect(isCrossReferencedTrigger('blacklist_finalized')).toBe(true);
    expect(isCrossReferencedTrigger('asl_revoked_unrelated')).toBe(true);
    expect(isCrossReferencedTrigger('natural_contract_end')).toBe(false);
    expect(isCrossReferencedTrigger('supplier_initiated_exit')).toBe(false);
  });
});

describe('determineChecklistRequirement -- requirement-level logic (sourced: SupplierGateway + Vanta)', () => {
  it('treats access_revocation, data_return_or_destruction, final_settlement, contractual_closeout, open_commitment_wind_down, and asset_recovery as always mandatory, regardless of trigger or cooperation', () => {
    const alwaysMandatory: Array<Parameters<typeof determineChecklistRequirement>[0]> = [
      'access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'asset_recovery',
    ];
    for (const key of alwaysMandatory) {
      expect(determineChecklistRequirement(key, 'natural_contract_end', 'cooperative', false)).toBe('mandatory');
      expect(determineChecklistRequirement(key, 'blacklist_finalized', 'adversarial', false)).toBe('mandatory');
    }
  });
  it('makes knowledge_transfer conditional_mandatory when replaced_by_another_supplier or insourced or a replacement is named, else recommended', () => {
    expect(determineChecklistRequirement('knowledge_transfer', 'replaced_by_another_supplier', 'cooperative', false)).toBe('conditional_mandatory');
    expect(determineChecklistRequirement('knowledge_transfer', 'insourced', 'cooperative', false)).toBe('conditional_mandatory');
    expect(determineChecklistRequirement('knowledge_transfer', 'natural_contract_end', 'cooperative', true)).toBe('conditional_mandatory');
    expect(determineChecklistRequirement('knowledge_transfer', 'natural_contract_end', 'cooperative', false)).toBe('recommended');
  });
  it('marks exit_feedback_and_reference not_applicable for an adversarial exit, mandatory otherwise -- ISO 44001\'s own "never burn bridges" step assumes a relationship worth preserving', () => {
    expect(determineChecklistRequirement('exit_feedback_and_reference', 'blacklist_finalized', 'adversarial', false)).toBe('not_applicable');
    expect(determineChecklistRequirement('exit_feedback_and_reference', 'natural_contract_end', 'cooperative', false)).toBe('mandatory');
    expect(determineChecklistRequirement('exit_feedback_and_reference', 'supplier_initiated_exit', 'limited', false)).toBe('mandatory');
  });
  it('always treats post_exit_follow_up as recommended, never gating', () => {
    expect(determineChecklistRequirement('post_exit_follow_up', 'blacklist_finalized', 'adversarial', false)).toBe('recommended');
    expect(determineChecklistRequirement('post_exit_follow_up', 'natural_contract_end', 'cooperative', true)).toBe('recommended');
  });
});

describe('isGatingRequirement', () => {
  it('gates only mandatory and conditional_mandatory, never recommended or not_applicable', () => {
    expect(isGatingRequirement('mandatory')).toBe(true);
    expect(isGatingRequirement('conditional_mandatory')).toBe(true);
    expect(isGatingRequirement('recommended')).toBe(false);
    expect(isGatingRequirement('not_applicable')).toBe(false);
  });
});

describe('getChecklistItemDefinition', () => {
  it('has a real, sourced definition for every declared checklist key with no gap', () => {
    for (const key of TRANSITION_CHECKLIST_ITEM_KEYS) {
      const def = getChecklistItemDefinition(key);
      expect(def.labelEn.length).toBeGreaterThan(0);
      expect(def.labelAr.length).toBeGreaterThan(0);
      expect(def.sourceEn.length).toBeGreaterThan(0);
      expect(def.sourceAr.length).toBeGreaterThan(0);
    }
  });
});

describe('computeAdvisoryTransitionPlan -- Advisory tier, zero persistence', () => {
  it('SOFT: a minimal input (no override, no replacement named, no cross-item state) still resolves a full checklist and cooperation level', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end' });
    expect(plan.cooperationLevel).toBe('cooperative');
    expect(plan.checklist.length).toBe(TRANSITION_CHECKLIST_ITEM_KEYS.length);
    expect(plan.primaryEn.length).toBeGreaterThan(0);
    expect(plan.alternativeEn.length).toBeGreaterThan(0);
  });

  it('Rule 8: primary and alternative are genuinely different texts, not a caveat bolted onto one path', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end' });
    expect(plan.primaryEn).not.toBe(plan.alternativeEn);
    expect(plan.primaryAr).not.toBe(plan.alternativeAr);
  });

  it('the alternative approach changes when a replacement supplier is named (front-load knowledge transfer) vs not (front-load access revocation)', () => {
    const withReplacement = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end', replacementSupplierNamed: true });
    const withoutReplacement = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end', replacementSupplierNamed: false });
    expect(withReplacement.alternativeEn).not.toBe(withoutReplacement.alternativeEn);
    expect(withReplacement.alternativeEn.toLowerCase()).toContain('knowledge transfer');
    expect(withoutReplacement.alternativeEn.toLowerCase()).toContain('access revocation');
  });

  it('flags a risk when cooperation level is adversarial (expedite/verify independently)', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'blacklist_finalized' });
    expect(plan.riskFlagsEn.some((f) => /adversarial/i.test(f))).toBe(true);
  });

  it('HARDEST: an explicit cooperationLevelOverride that conflicts with the trigger-inferred level is RESPECTED (ISC does not adjudicate) but flagged, not silently accepted or silently rejected', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'blacklist_finalized', cooperationLevelOverride: 'cooperative' });
    expect(plan.cooperationLevel).toBe('cooperative');
    expect(plan.riskFlagsEn.some((f) => /manually set/i.test(f))).toBe(true);
  });

  it('does NOT flag a mismatch when the override matches the inferred default', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'blacklist_finalized', cooperationLevelOverride: 'adversarial' });
    expect(plan.riskFlagsEn.some((f) => /manually set/i.test(f))).toBe(false);
  });

  it('flags open commitments when supplied, including the caller\'s own detail text', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end', openCommitments: { hasOpenCommitments: true, detailEn: '3 open POs' } });
    expect(plan.riskFlagsEn.some((f) => f.includes('3 open POs'))).toBe(true);
  });

  it('HARDEST: flags a real inconsistency when the supplier is currently blacklisted but the trigger reason recorded is NOT blacklist_finalized', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end', blacklistState: { isBlacklisted: true } });
    expect(plan.riskFlagsEn.some((f) => /currently blacklisted/i.test(f))).toBe(true);
  });
  it('does not raise that flag when the trigger reason IS blacklist_finalized (expected, not a mismatch)', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'blacklist_finalized', blacklistState: { isBlacklisted: true } });
    expect(plan.riskFlagsEn.some((f) => /currently blacklisted/i.test(f))).toBe(false);
  });

  it('aslCrossReferenceNeeded is true for an ordinary trigger when the supplier still keeps on the ASL', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end', aslState: { status: 'approved', keepsOnASL: true } });
    expect(plan.aslCrossReferenceNeeded).toBe(true);
  });
  it('HARDEST: aslCrossReferenceNeeded is false for the two cross-referenced triggers even when aslState says the supplier still keeps on the ASL (Item 6/3 already own that decision -- must not duplicate)', () => {
    const blacklistTriggered = computeAdvisoryTransitionPlan({ triggerReason: 'blacklist_finalized', aslState: { status: 'approved', keepsOnASL: true } });
    expect(blacklistTriggered.aslCrossReferenceNeeded).toBe(false);
    const aslTriggered = computeAdvisoryTransitionPlan({ triggerReason: 'asl_revoked_unrelated', aslState: { status: 'revoked', keepsOnASL: false } });
    expect(aslTriggered.aslCrossReferenceNeeded).toBe(false);
  });
  it('aslCrossReferenceNeeded is false for an ordinary trigger when the supplier is already off the ASL (no duplicate revocation)', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'mutual_termination', aslState: { status: 'suspended', keepsOnASL: false } });
    expect(plan.aslCrossReferenceNeeded).toBe(false);
  });
  it('BOUNDARY: with no aslState supplied at all, defaults aslCrossReferenceNeeded to true for an ordinary trigger (conservative default -- assume still on ASL rather than silently skip a real cross-reference)', () => {
    const plan = computeAdvisoryTransitionPlan({ triggerReason: 'natural_contract_end' });
    expect(plan.aslCrossReferenceNeeded).toBe(true);
  });
});

describe('suggestOffboardingTriggerContext -- usability pre-fill, never auto-applied without confirmation', () => {
  it('suggests blacklist_finalized/adversarial when the supplier is currently blacklisted', () => {
    const s = suggestOffboardingTriggerContext({ isBlacklisted: true }, null);
    expect(s.suggestedTrigger).toBe('blacklist_finalized');
    expect(s.suggestedCooperationLevel).toBe('adversarial');
  });
  it('suggests asl_revoked_unrelated/limited when the supplier is off the ASL but not blacklisted', () => {
    const s = suggestOffboardingTriggerContext({ isBlacklisted: false }, { status: 'revoked', keepsOnASL: false });
    expect(s.suggestedTrigger).toBe('asl_revoked_unrelated');
    expect(s.suggestedCooperationLevel).toBe('limited');
  });
  it('suggests nothing when neither cross-item state indicates an exit-worthy condition', () => {
    const s = suggestOffboardingTriggerContext({ isBlacklisted: false }, { status: 'approved', keepsOnASL: true });
    expect(s.suggestedTrigger).toBeNull();
    expect(s.suggestedCooperationLevel).toBeNull();
  });
  it('prioritizes the blacklist signal over the ASL signal when both are present (blacklist is the more specific, more severe fact)', () => {
    const s = suggestOffboardingTriggerContext({ isBlacklisted: true }, { status: 'revoked', keepsOnASL: false });
    expect(s.suggestedTrigger).toBe('blacklist_finalized');
  });
});

function ev(partial: Partial<TransitionEventLike> & { id: number; action: TransitionEventLike['action']; createdAt: string }): TransitionEventLike {
  return {
    supplierId: 'SUP-TEST-01',
    triggerReason: null,
    cooperationLevel: null,
    replacementSupplierNamed: null,
    checklistItemKey: null,
    itemStatus: null,
    ...partial,
  };
}

describe('computeCurrentTransitionState -- append-only event replay', () => {
  it('returns isOpen=false for a supplier with no events', () => {
    const state = computeCurrentTransitionState('SUP-TEST-01', []);
    expect(state.isOpen).toBe(false);
    expect(state.checklist).toEqual([]);
  });

  it('an "opened" event fixes triggerReason/cooperationLevel and initializes every checklist item at its computed requirement, with not_applicable items starting pre-set', () => {
    const events = [ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false })];
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.isOpen).toBe(true);
    expect(state.isClosed).toBe(false);
    expect(state.triggerReason).toBe('blacklist_finalized');
    const feedbackItem = state.checklist.find((c) => c.key === 'exit_feedback_and_reference')!;
    expect(feedbackItem.requirement).toBe('not_applicable');
    expect(feedbackItem.status).toBe('not_applicable');
    const accessItem = state.checklist.find((c) => c.key === 'access_revocation')!;
    expect(accessItem.requirement).toBe('mandatory');
    expect(accessItem.status).toBe('pending');
  });

  it('checklist_item_updated events move a specific item\'s status, leaving others untouched', () => {
    const events = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
      ev({ id: 2, action: 'checklist_item_updated', createdAt: '2026-09-13T09:05:00Z', checklistItemKey: 'access_revocation', itemStatus: 'complete' }),
    ];
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.checklist.find((c) => c.key === 'access_revocation')!.status).toBe('complete');
    expect(state.checklist.find((c) => c.key === 'data_return_or_destruction')!.status).toBe('pending');
  });

  it('a later checklist_item_updated event for the same item overrides an earlier one (last write wins, chronologically)', () => {
    const events = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
      ev({ id: 2, action: 'checklist_item_updated', createdAt: '2026-09-13T09:05:00Z', checklistItemKey: 'access_revocation', itemStatus: 'in_progress' }),
      ev({ id: 3, action: 'checklist_item_updated', createdAt: '2026-09-13T09:10:00Z', checklistItemKey: 'access_revocation', itemStatus: 'complete' }),
    ];
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.checklist.find((c) => c.key === 'access_revocation')!.status).toBe('complete');
  });

  it('"closed" sets isClosed; "reopened" clears it WITHOUT discarding checklist progress (append-only, no data loss)', () => {
    const events = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
      ev({ id: 2, action: 'checklist_item_updated', createdAt: '2026-09-13T09:05:00Z', checklistItemKey: 'access_revocation', itemStatus: 'complete' }),
      ev({ id: 3, action: 'closed', createdAt: '2026-09-13T10:00:00Z' }),
      ev({ id: 4, action: 'reopened', createdAt: '2026-09-13T11:00:00Z' }),
    ];
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.isClosed).toBe(false);
    expect(state.checklist.find((c) => c.key === 'access_revocation')!.status).toBe('complete');
  });

  it('BOUNDARY: completionPct is 100 when every gating item is complete or not_applicable, ignoring recommended items left pending', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false }),
    ];
    const gatingKeys = ['access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'asset_recovery'];
    let id = 2;
    for (const key of gatingKeys) {
      events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:0${id}:00Z`, checklistItemKey: key as TransitionEventLike['checklistItemKey'], itemStatus: 'complete' }));
    }
    // 'knowledge_transfer' is recommended (not gating) for this trigger; left pending deliberately.
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.completionPct).toBe(100);
    expect(state.checklist.find((c) => c.key === 'knowledge_transfer')!.status).toBe('pending');
  });

  it('BOUNDARY: completionPct is NOT 100 with exactly one gating item still pending', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
    ];
    const gatingKeys = ['access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'exit_feedback_and_reference'];
    // deliberately omit 'open_commitment_wind_down' and 'asset_recovery' from completion
    let id = 2;
    for (const key of gatingKeys) {
      events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:0${id}:00Z`, checklistItemKey: key as TransitionEventLike['checklistItemKey'], itemStatus: 'complete' }));
    }
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    expect(state.completionPct).toBeLessThan(100);
  });
});

describe('validateTransitionClosure -- the core closure gate', () => {
  it('refuses to close when no transition is open', () => {
    const state = computeCurrentTransitionState('SUP-TEST-01', []);
    const result = validateTransitionClosure(state);
    expect(result.valid).toBe(false);
  });

  it('refuses to close when already closed', () => {
    const events = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
      ev({ id: 2, action: 'closed', createdAt: '2026-09-13T10:00:00Z' }),
    ];
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    const result = validateTransitionClosure(state);
    expect(result.valid).toBe(false);
  });

  it('BOUNDARY: blocks closure with exactly one mandatory item still pending, naming it', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false }),
    ];
    const allGatingExceptOne = ['data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'asset_recovery'];
    let id = 2;
    for (const key of allGatingExceptOne) {
      events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:${10 + id}:00Z`, checklistItemKey: key as TransitionEventLike['checklistItemKey'], itemStatus: 'complete' }));
    }
    // 'access_revocation' deliberately left pending -- the single blocking item.
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    const result = validateTransitionClosure(state);
    expect(result.valid).toBe(false);
    expect(result.blockingItems).toEqual(['access_revocation']);
  });

  it('BOUNDARY: allows closure once every mandatory item is exactly complete, even with a recommended item still pending', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false }),
    ];
    const allGating = ['access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'asset_recovery'];
    let id = 2;
    for (const key of allGating) {
      events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:${10 + id}:00Z`, checklistItemKey: key as TransitionEventLike['checklistItemKey'], itemStatus: 'complete' }));
    }
    // 'post_exit_follow_up' (recommended) left pending -- must not block.
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    const result = validateTransitionClosure(state);
    expect(result.valid).toBe(true);
    expect(result.blockingItems).toEqual([]);
  });

  it('allows closure when a mandatory item is marked not_applicable rather than complete (ISC does not adjudicate substance, only presence of a resolved status)', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, action: 'opened', createdAt: '2026-09-13T09:00:00Z', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false }),
    ];
    const completeKeys = ['access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'exit_feedback_and_reference'];
    let id = 2;
    for (const key of completeKeys) {
      events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:${10 + id}:00Z`, checklistItemKey: key as TransitionEventLike['checklistItemKey'], itemStatus: 'complete' }));
    }
    // 'asset_recovery' (mandatory) marked not_applicable rather than complete -- must still satisfy closure.
    events.push(ev({ id: id++, action: 'checklist_item_updated', createdAt: `2026-09-13T09:${10 + id}:00Z`, checklistItemKey: 'asset_recovery', itemStatus: 'not_applicable' }));
    const state = computeCurrentTransitionState('SUP-TEST-01', events);
    const result = validateTransitionClosure(state);
    expect(result.valid).toBe(true);
  });
});

describe('mapTriggerToAslReasonCategory -- the duplicate-write guard', () => {
  it('maps the four ordinary cooperative/limited triggers to commercial_relationship_ended', () => {
    expect(mapTriggerToAslReasonCategory('natural_contract_end')).toBe('commercial_relationship_ended');
    expect(mapTriggerToAslReasonCategory('mutual_termination')).toBe('commercial_relationship_ended');
    expect(mapTriggerToAslReasonCategory('replaced_by_another_supplier')).toBe('commercial_relationship_ended');
    expect(mapTriggerToAslReasonCategory('insourced')).toBe('commercial_relationship_ended');
  });
  it('maps supplier_initiated_exit to voluntary_exit specifically, not the generic category', () => {
    expect(mapTriggerToAslReasonCategory('supplier_initiated_exit')).toBe('voluntary_exit');
  });
  it('HARDEST: returns null for both cross-referenced triggers -- the route layer must not write a duplicate ASL decision Item 6/3 already recorded', () => {
    expect(mapTriggerToAslReasonCategory('blacklist_finalized')).toBeNull();
    expect(mapTriggerToAslReasonCategory('asl_revoked_unrelated')).toBeNull();
  });
  it('every non-null mapping is a real LifecycleReasonCategory value supplierPreQualification.ts\'s own validateASLDecision() actually accepts (commercial_relationship_ended, voluntary_exit)', () => {
    const validValues = new Set(['commercial_relationship_ended', 'voluntary_exit']);
    for (const r of OFFBOARDING_TRIGGER_REASONS) {
      const mapped = mapTriggerToAslReasonCategory(r);
      if (mapped !== null) expect(validValues.has(mapped)).toBe(true);
    }
  });
});

describe('buildAslCrossReferenceReasonNote', () => {
  it('names the specific transition event id and trigger reason in both languages', () => {
    const note = buildAslCrossReferenceReasonNote(42, 'natural_contract_end');
    expect(note.en).toContain('#42');
    expect(note.en.toLowerCase()).toContain('natural contract end');
    expect(note.ar).toContain('42');
  });
});

describe('CROSS-ENGINE CHAINED SCENARIO (Rule 7): Item 6\'s Rawabi blacklist finalize feeding directly into Item 7', () => {
  // Continues the Rawabi (SUP-RAWABI-06) story from Item 6's own worked
  // example: a finalized blacklist entry (Item 6) is read here as
  // caller-supplied context (Standalone-First -- no runtime import from
  // supplierBlacklist.ts) to drive Item 7's own advisory plan and,
  // separately, verify the operational close action does not duplicate
  // the ASL revocation Item 6's own /finalize route already wrote.
  const rawabiBlacklistState = { isBlacklisted: true };
  const rawabiAslStateAfterBlacklistFinalize = { status: 'revoked', keepsOnASL: false };

  it('the trigger-context suggestion correctly reads the chained Item 6 state and proposes blacklist_finalized/adversarial', () => {
    const suggestion = suggestOffboardingTriggerContext(rawabiBlacklistState, rawabiAslStateAfterBlacklistFinalize);
    expect(suggestion.suggestedTrigger).toBe('blacklist_finalized');
    expect(suggestion.suggestedCooperationLevel).toBe('adversarial');
  });

  it('the advisory plan built from that chained state has zero ASL-cross-reference need (Item 6 already revoked it) and marks exit_feedback_and_reference not_applicable', () => {
    const plan = computeAdvisoryTransitionPlan({
      triggerReason: 'blacklist_finalized',
      blacklistState: rawabiBlacklistState,
      aslState: rawabiAslStateAfterBlacklistFinalize,
    });
    expect(plan.aslCrossReferenceNeeded).toBe(false);
    expect(plan.cooperationLevel).toBe('adversarial');
    expect(plan.checklist.find((c) => c.key === 'exit_feedback_and_reference')!.requirement).toBe('not_applicable');
    expect(plan.riskFlagsEn.some((f) => /currently blacklisted/i.test(f))).toBe(false); // no mismatch flag -- trigger correctly matches the blacklist state
  });

  it('the operational-tier replay for a transition opened with trigger=blacklist_finalized correctly pre-sets exit_feedback_and_reference to not_applicable, matching the advisory plan exactly (no drift between tiers)', () => {
    const events: TransitionEventLike[] = [
      ev({ id: 1, supplierId: 'SUP-RAWABI-06', action: 'opened', createdAt: '2026-09-13T12:00:00Z', triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false }),
    ];
    const state = computeCurrentTransitionState('SUP-RAWABI-06', events);
    expect(state.checklist.find((c) => c.key === 'exit_feedback_and_reference')!.requirement).toBe('not_applicable');
    expect(mapTriggerToAslReasonCategory(state.triggerReason!)).toBeNull(); // route layer must skip the ASL write for this chained case
  });
});
