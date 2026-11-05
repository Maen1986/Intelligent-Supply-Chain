import { describe, it, expect } from 'vitest';
import { recommendClientTactics, recommendWatchForTactics } from '@/lib/negotiationTactics';

describe('Negotiation Desk ethics gate (honesty fix, 5 Nov 2026)', () => {
  it('never offers extreme-anchor or flinch as tactics to use, in any quadrant', () => {
    for (const q of ['leverage', 'strategic', 'bottleneck', 'non-critical'] as const) {
      const ids = recommendClientTactics(q).map(t => t.id);
      expect(ids).not.toContain('extreme-anchor');
      expect(ids).not.toContain('flinch');
    }
  });
  it('lists extreme-anchor and flinch to watch for where they fit', () => {
    expect(recommendWatchForTactics('leverage').map(t => t.id)).toContain('extreme-anchor');
    expect(recommendWatchForTactics('bottleneck').map(t => t.id)).toContain('flinch');
  });
  it('no longer carries the unsourced 15-30% figure', () => {
    const all = JSON.stringify(recommendWatchForTactics('leverage'));
    expect(all).not.toMatch(/15-30%/);
  });
});
