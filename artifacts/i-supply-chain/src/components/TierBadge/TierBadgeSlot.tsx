// TierBadgeSlot.tsx -- optional wiring wrapper for the X-01 confidence tier badge.
//
// Why this exists: pages can render the badge "behind the existing data". When the data row carries no tier
// record at all (undefined or null, which is every row today: no API returns one yet), the slot renders NOTHING,
// so the page is byte-for-byte the same as before. When a record IS present, it is passed to TierBadge, which
// validates it and shows INSUFFICIENT_DATA (Tier 3 label, prompt and the reason line) if it is incomplete.
//
// This is NOT the evidence-tier badge. components/ConfidenceTierBadge.tsx (self_reported / ai_evaluated /
// consultant_validated) is a different concept and is untouched. Keep both; this one is TierBadge (spec X-01).
import { TierBadge } from './TierBadge';
import type { TierRecord } from './tierRecord';
import type { Lang } from './tierStrings';

export type TierRecordInput = TierRecord & { tier?: 1 | 2 | 3 | 'na' | null };

export interface TierBadgeSlotProps {
  record: TierRecordInput | null | undefined;
  lang: Lang;
  className?: string;
}

export function TierBadgeSlot({ record, lang, className }: TierBadgeSlotProps) {
  if (record === null || record === undefined || typeof record !== 'object') return null;
  return (
    <TierBadge
      tier={record.tier}
      basis={record.basis}
      confirmedBy={record.confirmedBy}
      confirmedOn={record.confirmedOn}
      source={record.source}
      sourceOpenedOn={record.sourceOpenedOn}
      possibleAnswers={record.possibleAnswers}
      lang={lang}
      className={className}
    />
  );
}

export default TierBadgeSlot;
