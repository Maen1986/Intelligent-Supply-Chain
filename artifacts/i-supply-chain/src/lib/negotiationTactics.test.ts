import { describe, expect, it } from 'vitest';
import {
  NAMED_NEGOTIATION_TACTICS,
  recommendClientTactics,
  recommendWatchForTactics,
  buildNegotiationTeam,
  recommendNegotiationLevels,
  STANDARD_NEGOTIATION_TEAM,
} from '@/lib/negotiationTactics';
import type { KraljicQuadrant } from '@/lib/kraljicScoring';

const QUADRANTS: KraljicQuadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];

describe('NAMED_NEGOTIATION_TACTICS -- real, sourced tactic library', () => {
  it('has at least 20 named tactics (the "tens" the client asked for)', () => {
    expect(NAMED_NEGOTIATION_TACTICS.length).toBeGreaterThanOrEqual(20);
  });

  it('includes every explicitly user-named tactic', () => {
    const ids = NAMED_NEGOTIATION_TACTICS.map((t) => t.id);
    expect(ids).toContain('good-cop-bad-cop');
    expect(ids).toContain('salami-slicing');
    expect(ids).toContain('prisoners-dilemma-tit-for-tat');
  });

  it('every tactic has substantive, non-empty when/where/how/followUp/desiredResult/counterTactic in both languages', () => {
    NAMED_NEGOTIATION_TACTICS.forEach((t) => {
      for (const field of [t.whatItIs, t.when, t.where, t.how, t.desiredResult, t.followUp, t.counterTactic] as const) {
        expect(field.en.length).toBeGreaterThan(15);
        expect(field.ar.length).toBeGreaterThan(10);
      }
      expect(t.suitableQuadrants.length).toBeGreaterThan(0);
      expect(t.source.length).toBeGreaterThan(5);
      expect(['low', 'moderate', 'high']).toContain(t.ethicalRisk);
    });
  });

  it('has unique ids', () => {
    const ids = NAMED_NEGOTIATION_TACTICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('flags deceptive tactics (good cop/bad cop, bogey, snow job, bluffing) as moderate/high risk, never low', () => {
    const deceptive = ['good-cop-bad-cop', 'bogey', 'bluffing-puffing-lying', 'personal-insults', 'threats-and-warnings'];
    deceptive.forEach((id) => {
      const t = NAMED_NEGOTIATION_TACTICS.find((x) => x.id === id)!;
      expect(t).toBeDefined();
      expect(t.ethicalRisk).not.toBe('low');
    });
  });

  it('flags principled Voss/game-theory techniques as low risk', () => {
    const principled = ['ackerman-model', 'calibrated-questions-tactical-empathy', 'prisoners-dilemma-tit-for-tat'];
    principled.forEach((id) => {
      const t = NAMED_NEGOTIATION_TACTICS.find((x) => x.id === id)!;
      expect(t.ethicalRisk).toBe('low');
    });
  });
});

describe('recommendClientTactics / recommendWatchForTactics', () => {
  QUADRANTS.forEach((q) => {
    it(`${q}: client tactics are all low-risk and quadrant-suitable`, () => {
      const tactics = recommendClientTactics(q);
      tactics.forEach((t) => {
        expect(t.ethicalRisk).toBe('low');
        expect(t.suitableQuadrants).toContain(q);
      });
    });

    it(`${q}: watch-for tactics are all moderate/high risk and quadrant-suitable, each with a counter-tactic`, () => {
      const tactics = recommendWatchForTactics(q);
      tactics.forEach((t) => {
        expect(t.ethicalRisk).not.toBe('low');
        expect(t.suitableQuadrants).toContain(q);
        expect(t.counterTactic.en.length).toBeGreaterThan(15);
      });
    });
  });

  it('client and watch-for lists never overlap for the same quadrant', () => {
    QUADRANTS.forEach((q) => {
      const client = new Set(recommendClientTactics(q).map((t) => t.id));
      const watch = new Set(recommendWatchForTactics(q).map((t) => t.id));
      const overlap = [...client].filter((id) => watch.has(id));
      expect(overlap).toEqual([]);
    });
  });

  it('chicken-game-brinkmanship is never recommended to the client and never suitable for strategic', () => {
    const chicken = NAMED_NEGOTIATION_TACTICS.find((t) => t.id === 'chicken-game-brinkmanship')!;
    expect(chicken.suitableQuadrants).not.toContain('strategic');
    QUADRANTS.forEach((q) => {
      expect(recommendClientTactics(q).map((t) => t.id)).not.toContain('chicken-game-brinkmanship');
    });
  });
});

describe('buildNegotiationTeam', () => {
  it('strategic and bottleneck get the full 6-role team', () => {
    expect(buildNegotiationTeam('strategic')).toEqual(STANDARD_NEGOTIATION_TEAM);
    expect(buildNegotiationTeam('bottleneck')).toEqual(STANDARD_NEGOTIATION_TEAM);
    expect(STANDARD_NEGOTIATION_TEAM.length).toBe(6);
  });

  it('leverage and non-critical get a lean 2-role team', () => {
    expect(buildNegotiationTeam('leverage').length).toBe(2);
    expect(buildNegotiationTeam('non-critical').length).toBe(2);
  });
});

describe('recommendNegotiationLevels', () => {
  it('strategic and bottleneck get the real 3-level structure', () => {
    expect(recommendNegotiationLevels('strategic').length).toBe(3);
    expect(recommendNegotiationLevels('bottleneck').length).toBe(3);
    expect(recommendNegotiationLevels('strategic').map((l) => l.level)).toEqual([1, 2, 3]);
  });

  it('leverage and non-critical get a single, honestly-labeled round -- not a fabricated multi-level structure', () => {
    const leverageLevels = recommendNegotiationLevels('leverage');
    expect(leverageLevels.length).toBe(1);
    expect(leverageLevels[0].purpose.en.toLowerCase()).toContain('does not warrant');
  });
});
