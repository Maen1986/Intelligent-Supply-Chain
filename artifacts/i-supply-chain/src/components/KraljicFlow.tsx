/**
 * Process flow and matrix illustration for the Kraljic module (Round B4).
 * FlowSteps: the five-step way of working, each step opens its tab.
 * MatrixIllustration: the 2x2 with the main published moves as arrows.
 * Both are plain SVG/HTML, keyboard reachable, and RTL-safe (the matrix is
 * forced left-to-right because its axes are spatial, not textual).
 */
import { CIPS_QUADRANT_LABEL } from '@/lib/kraljicCipsWording';

type Mode = 'suppliers' | 'score' | 'network' | 'report';

export function FlowSteps({ isAr, mode, onGo }: { isAr: boolean; mode: Mode; onGo: (m: Mode) => void }) {
  const steps: Array<{ n: number; go: Mode | null; en: string; ar: string; subEn: string; subAr: string }> = [
    { n: 1, go: 'score', en: 'Score', ar: 'قيّم', subEn: 'CIPS seven-step method', subAr: 'طريقة CIPS ذات الخطوات السبع' },
    { n: 2, go: 'suppliers', en: 'Place', ar: 'صنّف', subEn: 'Quadrant and sub-type', subAr: 'الربع والنوع الفرعي' },
    { n: 3, go: 'suppliers', en: 'Act', ar: 'نفّذ', subEn: 'Recommended plan and alternative', subAr: 'الخطة الموصى بها وبديلها' },
    { n: 4, go: 'suppliers', en: 'Review', ar: 'راجع', subEn: 'Position check: hold, watch or move', subAr: 'فحص الموقع: أبقِ أو راقب أو انتقل' },
    { n: 5, go: 'network', en: 'Move', ar: 'انتقل', subEn: 'Route through the network', subAr: 'المسار عبر الشبكة' },
  ];
  const active = mode === 'score' ? 1 : mode === 'network' ? 5 : mode === 'report' ? 0 : 2;
  return (
    <nav aria-label={isAr ? 'مراحل العمل' : 'How the work flows'} className="print:hidden">
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {steps.map((s) => (
          <li key={s.n} className="relative">
            <button type="button" onClick={() => s.go && onGo(s.go)}
              aria-current={active === s.n ? 'step' : undefined}
              className={`w-full h-full rounded-xl border p-1.5 sm:p-2.5 min-h-[56px] flex flex-col items-center text-center sm:items-start sm:text-start gap-1 ${active === s.n ? 'border-[#082C6B] bg-[#EEF2FF]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${active === s.n ? 'bg-[#082C6B] text-white' : 'bg-slate-100 text-slate-700'}`} dir="ltr">{s.n}</span>
              <span className="block">
                <span className="block text-[11px] sm:text-[12px] font-bold text-slate-800">{isAr ? s.ar : s.en}</span>
                <span className="hidden sm:block text-[10px] text-slate-600 leading-tight">{isAr ? s.subAr : s.subEn}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function MatrixIllustration({ isAr }: { isAr: boolean }) {
  const L = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  const q = CIPS_QUADRANT_LABEL;
  const moves = isAr
    ? { a: 'تبسيط المواصفة أو إعادة التوريد', b: 'تجميع الطلب', c: 'استثناء: شراكة', d: 'إعادة التوريد' }
    : { a: 'Loosen spec or re-source', b: 'Pool demand', c: 'Exception: partner', d: 'Re-source' };
  const axisX = isAr ? 'خطر الإمداد ←' : 'Supply risk →';
  const axisY = isAr ? 'أثر التكلفة ↑' : 'Cost impact ↑';
  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-3" dir="ltr">
      <svg viewBox="0 0 360 250" role="img" className="w-full h-auto max-w-[520px] mx-auto"
        aria-label={isAr ? 'رسم توضيحي لمصفوفة Kraljic مع أهم الانتقالات' : 'Illustration of the Kraljic matrix with the main moves'}>
        <defs>
          <marker id="kfArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#082C6B" /></marker>
        </defs>
        {/* quadrants */}
        <rect x="30" y="10" width="150" height="100" rx="8" fill="#ECFDF5" stroke="#059669" />
        <rect x="180" y="10" width="150" height="100" rx="8" fill="#EEF2FF" stroke="#6366f1" />
        <rect x="30" y="110" width="150" height="100" rx="8" fill="#F9FAFB" stroke="#9ca3af" />
        <rect x="180" y="110" width="150" height="100" rx="8" fill="#FFFBEB" stroke="#d97706" />
        <g fontFamily="inherit" fontSize="11" fontWeight="700" fill="#1e293b" textAnchor="middle">
          <text x="105" y="30">{L(q.leverage)}</text>
          <text x="255" y="30">{L(q.strategic)}</text>
          <text x="105" y="130">{L(q['non-critical'])}</text>
          <text x="255" y="130">{L(q.bottleneck)}</text>
        </g>
        {/* moves */}
        <g stroke="#082C6B" strokeWidth="1.8" fill="none" markerEnd="url(#kfArrow)">
          <path d="M255 150 H112" />{/* bottleneck -> routine */}
          <path d="M70 118 V62" />{/* routine -> leverage */}
          <path d="M148 62 H232" strokeDasharray="4 3" />{/* leverage -> critical (exception) */}
          <path d="M255 60 C255 80 190 82 150 82" strokeDasharray="4 3" />{/* critical -> leverage re-source */}
        </g>
        <g fontSize="10" fill="#082C6B" textAnchor="middle" fontFamily="inherit">
          <text x="182" y="168">{moves.a}</text>
          <text x="102" y="104">{moves.b}</text>
          <text x="190" y="56">{moves.c}</text>
          <text x="258" y="96">{moves.d}</text>
        </g>
        <text x="180" y="236" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="inherit">{axisX}</text>
        <text x="12" y="110" fontSize="10" fill="#64748b" fontFamily="inherit" transform="rotate(-90 12 110)" textAnchor="middle">{axisY}</text>
      </svg>
      <figcaption className="text-[11px] text-slate-600 mt-2" dir={isAr ? 'rtl' : 'ltr'}>
        {isAr
          ? 'الخطوط المتصلة انتقالات موثّقة في الأدبيات (Gelderman & van Weele 2003). المتقطعة استثنائية. لا يوجد انتقال مباشر من الاختناق إلى النفوذ: يخفض انخفاض خطر الإمداد البند نحو «غير حرج».'
          : 'Solid arrows are moves documented in the literature (Gelderman & van Weele, 2003). Dashed arrows are exceptional. There is no direct Bottleneck-to-Leverage move: falling supply risk takes the item toward Routine.'}
      </figcaption>
    </figure>
  );
}
