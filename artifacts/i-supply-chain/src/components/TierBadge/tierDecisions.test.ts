import { describe, it, expect } from 'vitest';
import { TIER_STRINGS } from './tierStrings';

// Owner decisions 9-10 Nov 2026 (delegated, settled).
describe('owner decision (a): INSUFFICIENT_DATA reason line', () => {
  it('English text is exact', () => {
    expect(TIER_STRINGS.insufficient.en).toBe('Insufficient data to confirm a confidence tier.');
  });
  it('Arabic text is exact', () => {
    expect(TIER_STRINGS.insufficient.ar).toBe('بيانات غير كافية للتأكد من مستوى الثقة.');
  });
});

describe('owner decision (b): Arabic term for V level = Glossary v8 G-367', () => {
  it('Arabic is مستوى التحقق من المصدر and is not the evidence-ladder term', () => {
    expect(TIER_STRINGS.vlevel_label.en).toBe('V level');
    expect(TIER_STRINGS.vlevel_label.ar).toBe('مستوى التحقق من المصدر');
    expect(TIER_STRINGS.vlevel_label.ar).not.toContain('الدليل');
  });
});
