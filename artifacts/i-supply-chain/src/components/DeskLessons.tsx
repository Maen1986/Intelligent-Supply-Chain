// src/components/DeskLessons.tsx
//
// Negotiation Desk: "Close this negotiation and record the lesson" and "Your past experience"
// (Lessons and Experience Engine, Phase 1, registry #809, spec v3).
// Private to the signed-in user's own saved cases. Nothing is shared or pooled.
// Arabic text: written and reviewed by the author only, NOT certified by a native reader.
import React, { useState } from 'react';
import { OUTCOMES, WHYS, FIELD_MAX, makeLesson, findPastExperience, type Lesson, type LessonOutcome, type LessonWhy, type CaseLike } from '@/lib/deskLessons';

const box = 'w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 focus:border-[#082C6B]';

export function CloseOutPanel({ lesson, lastPrice, isAr, onSave }: { lesson?: Lesson; lastPrice: string; isAr: boolean; onSave: (l: Lesson | undefined) => void }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [outcome, setOutcome] = useState<LessonOutcome | ''>(lesson?.outcome ?? '');
  const [expected, setExpected] = useState(lesson?.expected ?? '');
  const [happened, setHappened] = useState(lesson?.happened ?? '');
  const [why, setWhy] = useState<LessonWhy>(lesson?.why ?? 'other');
  const [whyNote, setWhyNote] = useState(lesson?.whyNote ?? '');
  const [repeat, setRepeat] = useState(lesson?.repeat ?? '');
  const [change, setChange] = useState(lesson?.change ?? '');
  const [msg, setMsg] = useState('');
  const save = () => {
    const l = makeLesson({ outcome, expected, happened, why, whyNote, repeat, change }, new Date().toISOString());
    if (!l) { setMsg(t('Pick an outcome and write at least one of: what happened, what to repeat, what to change.', 'اختر النتيجة واكتب واحدا على الأقل مما يلي: ماذا حدث، ما تكرره، ما تغيّره.')); return; }
    onSave(l);
    setMsg(t('Lesson saved on this case. It stays private to your account.', 'تم حفظ الدرس في هذه الحالة. يبقى خاصا بحسابك.'));
  };
  const remove = () => {
    onSave(undefined);
    setOutcome(''); setExpected(''); setHappened(''); setWhy('other'); setWhyNote(''); setRepeat(''); setChange('');
    setMsg(t('Lesson removed from this case.', 'تمت إزالة الدرس من هذه الحالة.'));
  };
  return (
    <section aria-label={t('Close this negotiation', 'إغلاق هذه المفاوضة')} className="no-print border border-slate-200 rounded-xl p-4 mt-3 bg-slate-50/60">
      <p className="text-xs font-bold text-slate-700">{t('Close this negotiation and record the lesson', 'إغلاق هذه المفاوضة وتسجيل الدرس')}</p>
      <p className="text-[11px] text-slate-600 mt-1">{t('Four short questions. Your answers stay private to your account and appear next time you negotiate with the same supplier.', 'أربعة أسئلة قصيرة. تبقى إجاباتك خاصة بحسابك وتظهر في المرة القادمة التي تتفاوض فيها مع المورّد نفسه.')}</p>
      <label className="block text-xs font-semibold text-slate-600 mt-3">{t('1. What did you expect? (optional)', '1. ماذا كنت تتوقع؟ (اختياري)')}
        <input className={`${box} mt-1`} maxLength={FIELD_MAX} value={expected} onChange={e => setExpected(e.target.value)}
          placeholder={lastPrice ? t(`Last price in this case: ${lastPrice}`, `آخر سعر في هذه الحالة: ${lastPrice}`) : ''} /></label>
      <fieldset className="mt-3">
        <legend className="text-xs font-semibold text-slate-600">{t('2. What happened?', '2. ماذا حدث؟')}</legend>
        <div className="mt-1 space-y-1">
          {OUTCOMES.map(o => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="lesson-outcome" value={o.id} checked={outcome === o.id} onChange={() => setOutcome(o.id)} />{isAr ? o.ar : o.en}
            </label>
          ))}
        </div>
        <input className={`${box} mt-2`} maxLength={FIELD_MAX} value={happened} onChange={e => setHappened(e.target.value)}
          aria-label={t('What happened, in your words', 'ماذا حدث، بكلماتك')} placeholder={t('In your words (optional if you wrote below)', 'بكلماتك (اختياري إن كتبت أدناه)')} />
      </fieldset>
      <label className="block text-xs font-semibold text-slate-600 mt-3">{t('3. Why was it different from what you expected?', '3. لماذا اختلف عما توقعت؟')}
        <select className={`${box} mt-1`} value={why} onChange={e => setWhy(e.target.value as LessonWhy)}>
          {WHYS.map(w => <option key={w.id} value={w.id}>{isAr ? w.ar : w.en}</option>)}
        </select></label>
      <input className={`${box} mt-2`} maxLength={FIELD_MAX} value={whyNote} onChange={e => setWhyNote(e.target.value)}
        aria-label={t('Note on why (private)', 'ملاحظة عن السبب (خاصة)')} placeholder={t('Note (optional, private)', 'ملاحظة (اختيارية، خاصة)')} />
      <label className="block text-xs font-semibold text-slate-600 mt-3">{t('4. Next time: what will you repeat?', '4. في المرة القادمة: ماذا ستكرر؟')}
        <input className={`${box} mt-1`} maxLength={FIELD_MAX} value={repeat} onChange={e => setRepeat(e.target.value)} /></label>
      <label className="block text-xs font-semibold text-slate-600 mt-2">{t('What will you change?', 'ماذا ستغيّر؟')}
        <input className={`${box} mt-1`} maxLength={FIELD_MAX} value={change} onChange={e => setChange(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <button type="button" onClick={save} className="text-xs font-bold text-white bg-[#082C6B] rounded-lg px-3 py-2">{t('Save lesson', 'حفظ الدرس')}</button>
        {lesson && <button type="button" onClick={remove} className="text-xs font-semibold text-slate-600 underline px-2">{t('Remove lesson', 'إزالة الدرس')}</button>}
        {msg && <span role="status" className="text-[11px] text-slate-700">{msg}</span>}
      </div>
      <p className="text-[11px] text-slate-600 mt-2">{t('Recorded by you (client-reported). It shows what happened, not proof that the approach caused it.', 'مسجّل من قِبلك (مُبلَّغ من العميل). يعرض ما حدث، وليس دليلا على أن الأسلوب هو السبب.')}</p>
    </section>
  );
}

type SavedLike = { clientKey: string; name: string; data: CaseLike };

function PastCard({ c, label, isAr }: { c: SavedLike; label: string; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const l = c.data.lesson as Lesson;
  const outcome = OUTCOMES.find(o => o.id === l.outcome);
  const why = WHYS.find(w => w.id === l.why);
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white">
      <p className="text-[11px] font-bold text-slate-600">{label} · {c.name || c.data.supplier} · {l.closedAt.slice(0, 10)}</p>
      <p className="text-sm mt-1"><span className="font-semibold">{outcome ? (isAr ? outcome.ar : outcome.en) : ''}</span>{why ? ` · ${isAr ? why.ar : why.en}` : ''}</p>
      {l.happened && <p className="text-sm text-slate-700 mt-1">{l.happened}</p>}
      {l.repeat && <p className="text-sm mt-1"><span className="font-semibold">{t('Repeat: ', 'كرر: ')}</span>{l.repeat}</p>}
      {l.change && <p className="text-sm mt-1"><span className="font-semibold">{t('Change: ', 'غيّر: ')}</span>{l.change}</p>}
    </div>
  );
}

export function PastExperience({ supplier, quadrant, others, isAr }: { supplier: string; quadrant: string; others: SavedLike[]; isAr: boolean }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  if (!supplier.trim()) return null;
  const { primary, alternative } = findPastExperience({ supplier, quadrant }, others);
  return (
    <section aria-label={t('Your past experience', 'خبرتك السابقة')} className="mt-3 border border-emerald-200 bg-emerald-50/40 rounded-xl p-3">
      <p className="text-xs font-bold text-emerald-900">{t('Your past experience', 'خبرتك السابقة')}</p>
      <p className="text-[11px] text-slate-600">{t('Your own record (client-reported), private to your account. It shows what happened, not proof that the approach caused it.', 'سجلك الخاص (مُبلَّغ من العميل)، خاص بحسابك. يعرض ما حدث، وليس دليلا على أن الأسلوب هو السبب.')}</p>
      {!primary && !alternative && <p className="text-sm text-slate-700 mt-2">{t('No recorded lessons for this supplier yet. Close a negotiation on the last step to start your record.', 'لا توجد دروس مسجلة لهذا المورّد بعد. أغلق مفاوضة في الخطوة الأخيرة لتبدأ سجلك.')}</p>}
      <div className="grid gap-2 mt-2">
        {primary && <PastCard c={primary} isAr={isAr} label={t('Same supplier', 'المورّد نفسه')} />}
        {alternative && <PastCard c={alternative} isAr={isAr} label={t('Same type of purchase, different supplier', 'نوع الشراء نفسه، مورّد مختلف')} />}
      </div>
    </section>
  );
}
