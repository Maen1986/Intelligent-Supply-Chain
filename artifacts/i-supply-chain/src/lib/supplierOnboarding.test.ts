import { describe, it, expect } from 'vitest';
import {
  canStartOnboarding,
  generateOnboardingChecklist,
  computeCurrentOnboardingState,
  computeAllCurrentOnboardingStates,
  validateStepCompletion,
  detectStalledOnboarding,
  computeGraduationReadiness,
  applicableSteps,
  ONBOARDING_STEP_CATALOG,
  ONBOARDING_SIGNOFF_RACI_GUIDANCE,
  type ASLGateSnapshotLike,
  type OnboardingStepEventLike,
  type OnboardingChecklistResult,
} from './supplierOnboarding';

const APPROVED_GATE: ASLGateSnapshotLike = { supplierId: 'SUP-RAWABI-01', onASL: true, status: 'approved' };
const SUSPENDED_GATE: ASLGateSnapshotLike = { supplierId: 'SUP-RAWABI-01', onASL: false, status: 'suspended' };

function ev(partial: Partial<OnboardingStepEventLike> & { stepKey: string; action: 'completed' | 'reopened'; createdAt: string }): OnboardingStepEventLike {
  return {
    id: partial.id ?? Math.random(),
    supplierId: partial.supplierId ?? 'SUP-RAWABI-01',
    stepKey: partial.stepKey,
    action: partial.action,
    actorUserId: partial.actorUserId ?? 1,
    note: partial.note ?? null,
    verificationChannelNote: partial.verificationChannelNote ?? null,
    firstPaymentHoldAcknowledged: partial.firstPaymentHoldAcknowledged ?? null,
    createdAt: partial.createdAt,
  };
}

describe('canStartOnboarding / gating on ASL approval', () => {
  it('refuses with no gate supplied at all', () => {
    const r = canStartOnboarding(null);
    expect(r.allowed).toBe(false);
  });
  it('refuses a supplier that is not onASL', () => {
    const r = canStartOnboarding(SUSPENDED_GATE);
    expect(r.allowed).toBe(false);
    expect(r.reasonEn).toMatch(/suspended/);
  });
  it('allows a supplier that is onASL', () => {
    const r = canStartOnboarding(APPROVED_GATE);
    expect(r.allowed).toBe(true);
  });
});

describe('generateOnboardingChecklist -- Advisory tier', () => {
  it('BOUNDARY: zero-step / gated=false result carries no steps when ASL gate refuses', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-X', aslGate: SUSPENDED_GATE });
    expect(result.gated).toBe(false);
    expect(result.steps).toHaveLength(0);
    expect(result.requiredStepCount).toBe(0);
  });

  it('SOFT: generates the full catalog for an approved supplier with ESG not applicable (omits ESG step)', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, esgApplicable: false });
    expect(result.gated).toBe(true);
    expect(result.steps.find((s) => s.key === 'esg_questionnaire_completed')).toBeUndefined();
    expect(result.requiredStepCount).toBe(applicableSteps(false).filter((s) => s.required).length);
  });

  it('includes ESG step when applicable, and prefills the escalation-contacts step from a Module 03 hint without auto-completing it', () => {
    const result = generateOnboardingChecklist({
      supplierId: 'SUP-RAWABI-01',
      aslGate: APPROVED_GATE,
      esgApplicable: true,
      contactHint: { contactNameKnown: 'Fahad Al-Otaibi', contactPhoneKnown: '+966-5xxxxxxx', evidenceStageKnown: 'OBSERVED' },
    });
    expect(result.steps.find((s) => s.key === 'esg_questionnaire_completed')).toBeDefined();
    const contactStep = result.steps.find((s) => s.key === 'escalation_contacts_confirmed')!;
    expect(contactStep.prefillHintEn).toMatch(/Fahad Al-Otaibi/);
    expect(contactStep.prefillHintEn).toMatch(/OBSERVED/);
  });

  it('SOFT: with no Module 03 hint supplied, the escalation-contacts step has no prefill (never fabricated)', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE });
    const contactStep = result.steps.find((s) => s.key === 'escalation_contacts_confirmed')!;
    expect(contactStep.prefillHintEn).toBeNull();
  });
});

describe('generateOnboardingChecklist -- Advisory tier RACI guidance (named, not enforced)', () => {
  it('surfaces the sourced Accountable/Responsible archetype guidance on a gated=true result', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE });
    expect(result.signoffGuidance).toEqual(ONBOARDING_SIGNOFF_RACI_GUIDANCE);
    expect(result.signoffGuidance!.accountableArchetypeEn).toBe('Supplier Relationship Manager');
    expect(result.signoffGuidance!.noteEn).toMatch(/guidance/i);
  });

  it('BOUNDARY: signoffGuidance is null on a gated=false result -- nothing to assign a role for yet', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-X', aslGate: SUSPENDED_GATE });
    expect(result.signoffGuidance).toBeNull();
  });
});

describe('generateOnboardingChecklist -- Advisory tier degrades honestly under adversarial input (a light tier still needs to fail safely, not just when nothing is persisted)', () => {
  it('HARDEST: a malformed ASL status string (garbage, not one of the known decision types) combined with onASL=true still gates the checklist through -- onASL is the authoritative field, status is informational only', () => {
    const weirdGate: ASLGateSnapshotLike = { supplierId: 'SUP-WEIRD', onASL: true, status: 'not_a_real_decision_type_at_all' };
    const result = generateOnboardingChecklist({ supplierId: 'SUP-WEIRD', aslGate: weirdGate });
    expect(result.gated).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('HARDEST: an empty-string supplierId on an otherwise-approved gate does not crash checklist generation', () => {
    const emptyIdGate: ASLGateSnapshotLike = { supplierId: '', onASL: true, status: 'approved' };
    const result = generateOnboardingChecklist({ supplierId: '', aslGate: emptyIdGate });
    expect(result.gated).toBe(true);
  });

  it('SOFT: a Module 03 contact hint with only a partial field (email known, name/phone unknown) still prefills honestly with only what is known', () => {
    const result = generateOnboardingChecklist({
      supplierId: 'SUP-RAWABI-01',
      aslGate: APPROVED_GATE,
      contactHint: { contactEmailKnown: 'ops@rawabi-example.com' },
    });
    const contactStep = result.steps.find((s) => s.key === 'escalation_contacts_confirmed')!;
    expect(contactStep.prefillHintEn).toMatch(/ops@rawabi-example\.com/);
    expect(contactStep.prefillHintEn).not.toMatch(/undefined/);
  });

  it('SOFT: an empty-object Module 03 contact hint (no fields known at all) behaves identically to no hint being supplied', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, contactHint: {} });
    const contactStep = result.steps.find((s) => s.key === 'escalation_contacts_confirmed')!;
    expect(contactStep.prefillHintEn).toBeNull();
  });

  it('esgApplicable left undefined defaults to false (never silently includes a step the caller did not confirm applies)', () => {
    const result = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE });
    expect(result.steps.find((s) => s.key === 'esg_questionnaire_completed')).toBeUndefined();
  });
});

describe('computeCurrentOnboardingState -- replay logic', () => {
  const checklist: OnboardingChecklistResult = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, esgApplicable: false });
  const requiredKeys = checklist.steps.filter((s) => s.required).map((s) => s.key);

  it('BOUNDARY: zero events -> not complete, no last activity', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    expect(state.isComplete).toBe(false);
    expect(state.lastActivityAt).toBeNull();
    expect(state.completedRequiredCount).toBe(0);
  });

  it('BOUNDARY: completing every required step except the very last one leaves isComplete false; the last one flips it true', () => {
    const allButLast = requiredKeys.slice(0, -1);
    const events = allButLast.map((k, i) => ev({ stepKey: k, action: 'completed', createdAt: `2026-09-0${(i % 9) + 1}T00:00:00Z` }));
    const partial = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(partial.isComplete).toBe(false);
    const finalEvent = ev({ stepKey: requiredKeys[requiredKeys.length - 1], action: 'completed', createdAt: '2026-09-09T00:00:00Z' });
    const complete = computeCurrentOnboardingState('SUP-RAWABI-01', [...events, finalEvent], checklist);
    expect(complete.isComplete).toBe(true);
    expect(complete.completedRequiredCount).toBe(requiredKeys.length);
  });

  it('BOUNDARY: same-day start-and-complete -- all required steps completed on the same createdAt date', () => {
    const events = requiredKeys.map((k) => ev({ stepKey: k, action: 'completed', createdAt: '2026-09-05T09:00:00Z' }));
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(state.isComplete).toBe(true);
    expect(state.lastActivityAt).toBe('2026-09-05T09:00:00Z');
  });

  it('HARDEST: an event for a step that does not exist in this checklist is ignored, not crashed on', () => {
    const events = [ev({ stepKey: 'not_a_real_step', action: 'completed', createdAt: '2026-09-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(state.completedStepKeys).toHaveLength(0);
    expect(state.isComplete).toBe(false);
  });

  it('HARDEST: duplicate completion events for the same step are deduplicated by the set-based replay (idempotent), not double-counted', () => {
    const events = [
      ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-09-01T00:00:00Z' }),
      ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-09-02T00:00:00Z' }),
    ];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(state.completedStepKeys.filter((k) => k === 'nda_signed')).toHaveLength(1);
  });

  it('SOFT: a supplier re-entering onboarding after a prior failed attempt -- reopened then re-completed', () => {
    const events = [
      ev({ stepKey: 'contract_executed', action: 'completed', createdAt: '2026-08-01T00:00:00Z' }),
      ev({ stepKey: 'contract_executed', action: 'reopened', createdAt: '2026-08-15T00:00:00Z', note: 'Contract renegotiated' }),
      ev({ stepKey: 'contract_executed', action: 'completed', createdAt: '2026-08-20T00:00:00Z' }),
    ];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(state.completedStepKeys).toContain('contract_executed');
    expect(state.events).toHaveLength(3); // full history preserved, nothing deleted
  });

  it('HARDEST: Accountable holder reassigned mid-onboarding does not affect replay -- state only cares about step keys and actions, not who acted', () => {
    const events = [
      ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-01T00:00:00Z', actorUserId: 5 }),
      ev({ stepKey: 'insurance_certificate_collected', action: 'completed', createdAt: '2026-08-10T00:00:00Z', actorUserId: 99 }),
    ];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    expect(state.completedStepKeys).toEqual(expect.arrayContaining(['nda_signed', 'insurance_certificate_collected']));
  });

  it('computeAllCurrentOnboardingStates handles multiple suppliers with distinct checklists', () => {
    const checklistA = generateOnboardingChecklist({ supplierId: 'SUP-A', aslGate: { supplierId: 'SUP-A', onASL: true, status: 'approved' } });
    const checklistB = generateOnboardingChecklist({ supplierId: 'SUP-B', aslGate: { supplierId: 'SUP-B', onASL: true, status: 'approved' } });
    const events = [
      ev({ supplierId: 'SUP-A', stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-01T00:00:00Z' }),
      ev({ supplierId: 'SUP-B', stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-02T00:00:00Z' }),
    ];
    const map = new Map([['SUP-A', checklistA], ['SUP-B', checklistB]]);
    const states = computeAllCurrentOnboardingStates(events, map);
    expect(states).toHaveLength(2);
  });
});

describe('validateStepCompletion', () => {
  const checklist = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, esgApplicable: false });

  it('HARDEST: refuses a completion for a supplier that was never actually ASL-approved (gated=false checklist)', () => {
    const ungatedChecklist = generateOnboardingChecklist({ supplierId: 'SUP-X', aslGate: SUSPENDED_GATE });
    const state = computeCurrentOnboardingState('SUP-X', [], ungatedChecklist);
    const result = validateStepCompletion('nda_signed', ungatedChecklist, state);
    expect(result.valid).toBe(false);
  });

  it('HARDEST: refuses a completion event for a step that does not exist in the checklist definition', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    const result = validateStepCompletion('made_up_step', checklist, state);
    expect(result.valid).toBe(false);
    expect(result.errorsEn[0]).toMatch(/not a step/);
  });

  it('HARDEST: refuses a duplicate completion for an already-completed step', () => {
    const events = [ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const result = validateStepCompletion('nda_signed', checklist, state);
    expect(result.valid).toBe(false);
    expect(result.errorsEn[0]).toMatch(/already marked complete/);
  });

  it('BOUNDARY: refuses banking_details_verified before banking_details_submitted (ordered dependency)', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    const result = validateStepCompletion('banking_details_verified', checklist, state, { verificationChannelNote: 'Called +966-5xx on file', firstPaymentHoldAcknowledged: true });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.join(' ')).toMatch(/requires these steps/);
  });

  it('refuses banking_details_verified with no independent verification channel supplied', () => {
    const events = [ev({ stepKey: 'banking_details_submitted', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const result = validateStepCompletion('banking_details_verified', checklist, state, { firstPaymentHoldAcknowledged: true });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.join(' ')).toMatch(/verification channel/);
  });

  it('refuses banking_details_verified without the first-payment-hold acknowledgement', () => {
    const events = [ev({ stepKey: 'banking_details_submitted', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const result = validateStepCompletion('banking_details_verified', checklist, state, { verificationChannelNote: 'Called +966-5xx on file' });
    expect(result.valid).toBe(false);
    expect(result.errorsEn.join(' ')).toMatch(/first-payment-hold/i);
  });

  it('POSITIVE CONTROL: accepts banking_details_verified with dependency satisfied, a verification channel, and the hold acknowledged', () => {
    const events = [ev({ stepKey: 'banking_details_submitted', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const result = validateStepCompletion('banking_details_verified', checklist, state, { verificationChannelNote: 'Called +966-5xx already on file', firstPaymentHoldAcknowledged: true });
    expect(result.valid).toBe(true);
  });

  it('SOFT: a plain step with a note but no special-handling requirements validates fine', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    const result = validateStepCompletion('escalation_contacts_confirmed', checklist, state);
    expect(result.valid).toBe(true);
  });
});

describe('detectStalledOnboarding', () => {
  const checklist = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, esgApplicable: false });

  it('not stalled when already complete', () => {
    const requiredKeys = checklist.steps.filter((s) => s.required).map((s) => s.key);
    const events = requiredKeys.map((k) => ev({ stepKey: k, action: 'completed', createdAt: '2026-08-01T00:00:00Z' }));
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-20'));
    expect(alert.stalled).toBe(false);
  });

  it('HARDEST (QA-caught fix, 12 Sep 2026): zero activity at all is surfaced as notStarted, NOT as a false-positive stalled alarm -- a record approved moments ago must not read the same as one neglected for weeks', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-20'));
    expect(alert.stalled).toBe(false);
    expect(alert.notStarted).toBe(true);
    expect(alert.daysSinceLastActivity).toBeNull();
    expect(alert.messageEn).toMatch(/not been started/);
  });

  it('BOUNDARY: exactly at the threshold (14 days) counts as stalled', () => {
    const events = [ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-09-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-15T00:00:00Z'), 14);
    expect(alert.daysSinceLastActivity).toBe(14);
    expect(alert.stalled).toBe(true);
  });

  it('BOUNDARY: one day under the threshold is not stalled', () => {
    const events = [ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-09-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-14T00:00:00Z'), 14);
    expect(alert.daysSinceLastActivity).toBe(13);
    expect(alert.stalled).toBe(false);
  });

  it('a stalled alert (with some prior activity) names both a primary recommendation and a strong alternative', () => {
    const events = [ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-20'), 14);
    expect(alert.messageEn).toMatch(/primary recommendation/);
    expect(alert.messageEn).toMatch(/strong alternative/);
  });

  it('a genuinely-stalled record (some activity, then quiet past the threshold) is distinguishable from a not-started one', () => {
    const events = [ev({ stepKey: 'nda_signed', action: 'completed', createdAt: '2026-08-01T00:00:00Z' })];
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const alert = detectStalledOnboarding(state, new Date('2026-09-20'), 14);
    expect(alert.stalled).toBe(true);
    expect(alert.notStarted).toBe(false);
  });
});

describe('computeGraduationReadiness', () => {
  const checklist = generateOnboardingChecklist({ supplierId: 'SUP-RAWABI-01', aslGate: APPROVED_GATE, esgApplicable: false });

  it('not ready when incomplete', () => {
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', [], checklist);
    const readiness = computeGraduationReadiness(state);
    expect(readiness.readyToGraduate).toBe(false);
  });

  it('POSITIVE CONTROL: ready once every required step is complete', () => {
    const requiredKeys = checklist.steps.filter((s) => s.required).map((s) => s.key);
    const events = requiredKeys.map((k, i) => ev({ stepKey: k, action: 'completed', createdAt: `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00Z` }));
    const state = computeCurrentOnboardingState('SUP-RAWABI-01', events, checklist);
    const readiness = computeGraduationReadiness(state);
    expect(readiness.readyToGraduate).toBe(true);
  });
});

describe('catalog integrity', () => {
  it('every step has both EN and AR label/why-it-matters/source text (bilingual by default, Rule 5)', () => {
    for (const step of ONBOARDING_STEP_CATALOG) {
      expect(step.labelEn.length).toBeGreaterThan(0);
      expect(step.labelAr.length).toBeGreaterThan(0);
      expect(step.whyItMattersEn.length).toBeGreaterThan(0);
      expect(step.whyItMattersAr.length).toBeGreaterThan(0);
      expect(step.sourceEn.length).toBeGreaterThan(0);
      expect(step.sourceAr.length).toBeGreaterThan(0);
    }
  });

  it('banking_details_verified is the only step requiring independent verification', () => {
    const flagged = ONBOARDING_STEP_CATALOG.filter((s) => s.requiresIndependentVerification);
    expect(flagged.map((s) => s.key)).toEqual(['banking_details_verified']);
  });
});
