import { describe, it, expect } from 'vitest';
import { MOF_CONTRACT_MODELS, classForModel } from './mofContractModels';
import { findMechanisms } from './lcgpaMechanismFinder';
describe('MOF contract models (Decision 1118)', () => {
  it('has 19 contract models + 3 framework agreements, unique ids, bilingual names', () => {
    expect(MOF_CONTRACT_MODELS.filter(m => !m.framework)).toHaveLength(19);
    expect(MOF_CONTRACT_MODELS.filter(m => m.framework)).toHaveLength(3);
    expect(new Set(MOF_CONTRACT_MODELS.map(m => m.id)).size).toBe(MOF_CONTRACT_MODELS.length);
    MOF_CONTRACT_MODELS.forEach(m => { expect(m.ar.length).toBeGreaterThan(2); expect(m.en.length).toBeGreaterThan(2); });
  });
  it('maps to finder classes: supply gets no SME preference, services below 25M does', () => {
    expect(classForModel('medicines')).toBe('supply');
    expect(classForModel('nope')).toBeUndefined();
    const sme = (id: string, v: number) => findMechanisms(classForModel(id)!, v).find(h => h.program === 'sa-sme-preference')!.applies;
    expect(sme('general-supply', 1e6)).toBe(false);
    expect(sme('consulting', 1e6)).toBe(true);
    expect(sme('it', 1e6)).toBe(true);
    expect(sme('consulting', 25e6)).toBe(false);
  });
});
