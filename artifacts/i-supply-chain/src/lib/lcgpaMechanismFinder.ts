// Which LCGPA mechanisms may apply to a contract (contract type x value).
// Source: practitioner booklet describing LCGPA's five mechanisms (single source for the mapping -- the buyer's tender documents decide).
// The Mandatory List itself is an official LCGPA list; the booklet is used only for the type/value mapping.
export type SaContractType = 'supply' | 'services-works' | 'mixed';
export const SA_HIGH_VALUE_THRESHOLD_SAR = 25_000_000;

export interface MechanismHit { program: 'sa-mandatory-list' | 'sa-price-preference' | 'sa-sme-preference' | 'sa-contract-minimum' | 'sa-financial-evaluation-weight'; applies: boolean }

export function findMechanisms(type: SaContractType, valueSar: number): MechanismHit[] {
  const high = valueSar >= SA_HIGH_VALUE_THRESHOLD_SAR;
  // Mixed contract: the supply component follows the supply rules and the services/works component follows the services rules,
  // so every mechanism of either side is flagged; the tender documents say how the value is split.
  if (type === 'mixed') {
    return [
      { program: 'sa-mandatory-list', applies: true },
      { program: 'sa-price-preference', applies: true },
      { program: 'sa-sme-preference', applies: !high },
      { program: 'sa-contract-minimum', applies: high },
      { program: 'sa-financial-evaluation-weight', applies: high },
    ];
  }
  return [
    { program: 'sa-mandatory-list', applies: true },
    { program: 'sa-price-preference', applies: true },
    { program: 'sa-sme-preference', applies: type !== 'supply' && !high },
    { program: 'sa-contract-minimum', applies: type !== 'supply' && high },
    { program: 'sa-financial-evaluation-weight', applies: type !== 'supply' && high },
  ];
}
