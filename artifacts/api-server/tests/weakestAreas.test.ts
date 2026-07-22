import { describe, it, expect } from 'vitest';
import { rankWeakest } from '../../i-supply-chain/src/lib/weakestAreas';

type Item = { name: string; score: number };
const score = (i: Item) => i.score;

describe('rankWeakest', () => {
  it('sorts ascending by score (weakest first)', () => {
    const items: Item[] = [
      { name: 'a', score: 3 },
      { name: 'b', score: 1 },
      { name: 'c', score: 2 },
    ];
    expect(rankWeakest(items, score, 3).map((i) => i.name)).toEqual(['b', 'c', 'a']);
  });

  it('keeps original order for ties (stable sort)', () => {
    const items: Item[] = [
      { name: 'first', score: 2 },
      { name: 'second', score: 2 },
      { name: 'third', score: 1 },
      { name: 'fourth', score: 2 },
    ];
    expect(rankWeakest(items, score, 4).map((i) => i.name)).toEqual([
      'third',
      'first',
      'second',
      'fourth',
    ]);
  });

  it('respects the count limit', () => {
    const items: Item[] = [
      { name: 'a', score: 5 },
      { name: 'b', score: 1 },
      { name: 'c', score: 3 },
      { name: 'd', score: 2 },
    ];
    expect(rankWeakest(items, score, 2).map((i) => i.name)).toEqual(['b', 'd']);
  });

  it('returns all items when count exceeds length, and does not mutate input', () => {
    const items: Item[] = [
      { name: 'a', score: 2 },
      { name: 'b', score: 1 },
    ];
    const copy = [...items];
    expect(rankWeakest(items, score, 10)).toHaveLength(2);
    expect(items).toEqual(copy);
    expect(rankWeakest([], score, 3)).toEqual([]);
  });
});
