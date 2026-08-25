// src/components/ContractReviewReport.tsx
//
// Module 09 Part B.6 -- "The Contract Assurance Chain," Review v1's UI.
// Owner instruction (25 Aug 2026, verbatim): "our review services must be
// much different and better than other competitors and best in class
// companies in the methodology, way of recommendation and assurance,
// options, level of logic, causality... the design must be attractive,
// unique and UI friendly."
//
// Design response, mapped to isc-ai-output-standards:
// - #7 (hard constraint): 4 independently-colored dimension bars, NEVER
//   summed into one score -- most competitor tools show a single risk
//   number that hides which specific thing needs attention.
// - #11 Question-Driven Content Structure: dimensions answer "how am I
//   doing overall"; findings answer "why," each expanding into a real
//   6-step causal chain, not a bare risk flag.
// - #12 Visual Primitive Vocabulary: causal chains reuse ProblemChainFlow's
//   established icon-in-circle + connector-line vocabulary (platform
//   visual consistency, not a one-off pattern for this module alone).
// - #6 generalized: every finding carries an honest 3-tier assurance badge
//   (Reference-Verified / Self-Declared-Consistent / Needs-Counsel).
// - #2 "Why Not?": every finding's "Consider also" box names the strongest
//   reason a client might reasonably not act on the recommendation.
// - Options, never a bare verdict: comparison cards render only where
//   clmReviewEngine.ts attached a real, sourced Module 02 variant list --
//   never fabricated (Decision Record 8.7).
import { useState } from 'react';
import {
  buildReviewReport, ASSURANCE_META,
  type ReviewReportInput, type ReviewFinding, type DimensionState, type AssuranceTier,
} from '@/lib/clmReviewEngine';
import {
  ChevronDown, ChevronUp, Search, Layers, AlertTriangle, Wrench, TrendingUp, ShieldCheck,
  ClipboardCheck, Scale, Sparkles, ScanSearch,
} from 'lucide-react';

const DIMENSION_STATUS_COLOR: Record<DimensionState['status'], string> = {
  strong: '#10b981',
  attention: '#d97706',
  'not-yet-assessed': '#94a3b8',
  'not-applicable': '#cbd5e1',
};

const CHAIN_STEP_ICONS = [Search, Layers, AlertTriangle, Wrench, TrendingUp, ShieldCheck];

const ASSURANCE_ICON: Record<AssuranceTier, typeof ShieldCheck> = {
  'reference-verified': ShieldCheck,
  'self-declared-consistent': ClipboardCheck,
  'needs-counsel': Scale,
};

const ASSURANCE_COLOR: Record<AssuranceTier, { bg: string; text: string }> = {
  'reference-verified': { bg: '#dcfce7', text: '#15803d' },
  'self-declared-consistent': { bg: '#e0e7ff', text: '#4338ca' },
  'needs-counsel': { bg: '#fef3c7', text: '#92400e' },
};

function AssuranceBadge({ tier, isAr }: { tier: AssuranceTier; isAr: boolean }) {
  const Icon = ASSURANCE_ICON[tier];
  const color = ASSURANCE_COLOR[tier];
  const meta = ASSURANCE_META[tier];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
      style={{ background: color.bg, color: color.text }}
      title={isAr ? meta.descAr : meta.descEn}
    >
      <Icon className="w-2.5 h-2.5" />
      {isAr ? meta.labelAr : meta.labelEn}
    </span>
  );
}

function CausalChain({ finding, isAr }: { finding: ReviewFinding; isAr: boolean }) {
  return (
    <div className="space-y-0 pt-2">
      {finding.causalChain.map((step, i) => {
        const Icon = CHAIN_STEP_ICONS[i] ?? Search;
        const isLast = i === finding.causalChain.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <span className="w-7 h-7 rounded-full bg-[#082C6B] text-white flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              {!isLast && <span className="w-px flex-1 min-h-[12px] bg-border mt-1" />}
            </div>
            <div className="pb-3 min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#C9A84C]">{isAr ? step.stepAr : step.stepEn}</p>
              <p className="text-sm text-foreground leading-relaxed">{isAr ? step.textAr : step.textEn}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FindingCard({ finding, isAr, isOpen, onToggle }: {
  finding: ReviewFinding; isAr: boolean; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button type="button" onClick={onToggle} className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors text-left">
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className="text-xs font-bold text-slate-700 truncate">{isAr ? finding.titleAr : finding.titleEn}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {finding.assuranceTiers.map(t => <AssuranceBadge key={t} tier={t} isAr={isAr} />)}
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 italic pt-2">{isAr ? `المصدر: ${finding.sourceAr}` : `Source: ${finding.sourceEn}`}</p>

          <CausalChain finding={finding} isAr={isAr} />

          {finding.options && finding.options.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C9A84C]" />
                {isAr ? 'بدائل حقيقية موثقة، لا حكم واحد' : 'Real Named Alternatives, Not One Verdict'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {finding.options.map(opt => (
                  <div key={opt.id} className="border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50">
                    <p className="text-[11px] font-semibold text-slate-700">{isAr ? opt.labelAr : opt.labelEn}</p>
                    {(opt.descEn || opt.descAr) && <p className="text-[10px] text-slate-500 mt-0.5">{isAr ? opt.descAr : opt.descEn}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex gap-2">
            <ScanSearch className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">{isAr ? 'اعتبروا أيضاً' : 'Consider Also'}</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">{isAr ? finding.considerAlsoAr : finding.considerAlsoEn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ContractReviewReport({ input, isAr }: { input: ReviewReportInput; isAr: boolean }) {
  const report = buildReviewReport(input);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(report.findings.length > 0 ? [report.findings[0].id] : []));
  const toggle = (id: string) => setOpenIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-800">{isAr ? 'سلسلة ضمان العقد' : 'The Contract Assurance Chain'}</p>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#082C6B]/10 text-[#082C6B]">
            {isAr ? 'مستشار ملازم للمستشار القانوني' : 'Counsel-Adjacent Advisor'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
          {isAr
            ? 'أربعة أبعاد مستقلة، لا رقم واحد مركّب -- كل نتيجة تحمل سلسلة سببية كاملة وبديلاً حقيقياً حيثما توفر، ومستوى ثقة صريح، وأقوى حجة مضادة لها.'
            : 'Four independent dimensions, never one composite score -- every finding carries a full causal chain, a real alternative where one genuinely exists, an honest confidence tier, and its own strongest counter-argument.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {report.dimensions.map(dim => {
          const color = DIMENSION_STATUS_COLOR[dim.status];
          return (
            <div key={dim.dimension} className="border border-slate-200 rounded-lg px-2.5 py-2" title={isAr ? dim.noteAr : dim.noteEn}>
              <p className="text-[10px] font-bold text-slate-600 truncate">{isAr ? dim.labelAr : dim.labelEn}</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full transition-all" style={{ width: dim.status === 'not-applicable' || dim.status === 'not-yet-assessed' ? '100%' : '100%', background: color, opacity: dim.status === 'not-yet-assessed' ? 0.35 : 1 }} />
              </div>
              <p className="text-[9px] mt-1 leading-snug" style={{ color }}>
                {dim.status === 'strong' ? (isAr ? 'قوي' : 'Strong')
                  : dim.status === 'attention' ? (isAr ? 'يستحق الانتباه' : 'Worth Attention')
                  : dim.status === 'not-applicable' ? (isAr ? 'لا ينطبق' : 'Not Applicable')
                  : (isAr ? 'لم يُقيَّم بعد' : 'Not Yet Assessed')}
              </p>
            </div>
          );
        })}
      </div>

      {report.findings.length === 0 ? (
        <div className="border border-slate-200 rounded-xl px-3 py-4 text-center bg-slate-50">
          <p className="text-xs text-slate-500">
            {isAr
              ? 'لا توجد نتائج مسجَّلة حتى الآن، بناءً على ما تم تحديده أعلاه. هذا لا يعني خلو العقد من المخاطر -- إنه انعكاس لما تم إدخاله فقط.'
              : 'No findings on record yet, based on what\'s entered above. This does not mean the contract is risk-free -- it reflects only what has been entered so far.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {report.findings.map(f => (
            <FindingCard key={f.id} finding={f} isAr={isAr} isOpen={openIds.has(f.id)} onToggle={() => toggle(f.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
