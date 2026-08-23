/**
 * commandCenterVitalSigns — QA pass for #159 (23 Aug 2026)
 *
 * getPriorityVitalSigns()/toggleVitalSignPriority() had zero test coverage
 * at build time. This checks the actual persistence contract the
 * CommandCenter UI depends on.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getPriorityVitalSigns, toggleVitalSignPriority } from './commandCenterVitalSigns';

beforeEach(() => {
  localStorage.clear();
});

describe('commandCenterVitalSigns — #159 priority QA', () => {
  it('returns an empty list when nothing has been prioritized', () => {
    expect(getPriorityVitalSigns()).toEqual([]);
  });

  it('adds a key on first toggle and persists it', () => {
    const result = toggleVitalSignPriority('risk');
    expect(result).toEqual(['risk']);
    expect(getPriorityVitalSigns()).toEqual(['risk']);
  });

  it('removes a key on second toggle (true toggle behaviour)', () => {
    toggleVitalSignPriority('risk');
    const result = toggleVitalSignPriority('risk');
    expect(result).toEqual([]);
    expect(getPriorityVitalSigns()).toEqual([]);
  });

  it('supports multiple simultaneous priorities, preserving insertion order', () => {
    toggleVitalSignPriority('savings');
    toggleVitalSignPriority('risk');
    toggleVitalSignPriority('briefing');
    expect(getPriorityVitalSigns()).toEqual(['savings', 'risk', 'briefing']);
  });

  it('ignores corrupted localStorage content rather than throwing', () => {
    localStorage.setItem('isc-cc-vitals-priority-v1', '{not valid json');
    expect(getPriorityVitalSigns()).toEqual([]);
  });

  it('filters out any unrecognised keys from a tampered/legacy value', () => {
    localStorage.setItem('isc-cc-vitals-priority-v1', JSON.stringify(['risk', 'not-a-real-key', 'savings']));
    expect(getPriorityVitalSigns()).toEqual(['risk', 'savings']);
  });
});
