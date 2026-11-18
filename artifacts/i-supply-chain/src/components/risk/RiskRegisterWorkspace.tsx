import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement } from 'react';
import { AlertTriangle, CalendarClock, CircleDashed, Plus, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  RegisterConflict, daysUntil, missingForPublish,
  type RegisterRisk, type RiskRegisterClient,
} from '@/lib/riskRegisterTypes';

/**
 * E4 RM-04 register screen, round 2 (backlog #893). Option B of the design note:
 * attention first. The first thing a reader sees is what is stuck (no owner, review
 * overdue, still a draft), each as a plain count that doubles as a filter. Then the list.
 *
 * What this screen refuses to do (card RM-04 v7, never-show list): no composite score, no
 * "top risks" ranking, no money total, no rating of any risk. It records what people say.
 * Evidence stage, ratings, money and controls are later releases, so none are shown and
 * none are implied. Arabic is built here but stays switched off until proofreading (#887).
 */
interface Props {
  client: RiskRegisterClient;
  isAr: boolean;
  /** Injected so tests and screenshots are reproducible. YYYY-MM-DD. */
  today: string;
}

type Filter = 'all' | 'unowned' | 'overdue' | 'draft';
type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; rows: RegisterRisk[] };

export function RiskRegisterWorkspace({ client, isAr, today }: Props) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    try { setLoad({ state: 'ready', rows: await client.list() }); } catch { setLoad({ state: 'error' }); }
  }, [client]);
  useEffect(() => { void refresh(); }, [refresh]);

  const rows = load.state === 'ready' ? load.rows : [];
  const counts = useMemo(() => ({
    unowned: rows.filter((r) => !r.ownerName).length,
    overdue: rows.filter((r) => r.reviewDate && daysUntil(r.reviewDate, today) < 0).length,
    draft: rows.filter((r) => r.status === 'draft').length,
  }), [rows, today]);
  const shown = rows.filter((r) =>
    filter === 'all' ? true
    : filter === 'unowned' ? !r.ownerName
    : filter === 'overdue' ? !!r.reviewDate && daysUntil(r.reviewDate, today) < 0
    : r.status === 'draft');
  const open = rows.find((r) => r.id === openId) ?? null;

  const chips: Array<{ key: Exclude<Filter, 'all'>; n: number; icon: ReactElement; en: string; ar: string }> = [
    { key: 'unowned', n: counts.unowned, icon: <UserX aria-hidden className="size-4" />, en: 'have no owner', ar: 'بلا مالك' },
    { key: 'overdue', n: counts.overdue, icon: <CalendarClock aria-hidden className="size-4" />, en: 'review overdue', ar: 'مراجعتها متأخرة' },
    { key: 'draft', n: counts.draft, icon: <CircleDashed aria-hidden className="size-4" />, en: 'still drafts', ar: 'ما زالت مسودات' },
  ];

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} aria-labelledby="rrw-title" data-testid="risk-register" className="space-y-5">
      <header className="space-y-1">
        <h2 id="rrw-title" className="text-2xl font-bold text-primary">{t('Risk register', 'سجل المخاطر')}</h2>
        <p className="max-w-prose text-muted-foreground">
          {t('This register records what you and your team say. A risk is not rated or scored here unless it says so.',
             'يسجّل هذا السجل ما تقوله أنت وفريقك. لا يُقيَّم أي خطر ولا تُعطى له درجة هنا ما لم يُذكر ذلك صراحةً.')}
        </p>
      </header>

      {load.state === 'loading' && <p role="status" className="text-muted-foreground">{t('Loading the register…', 'جارٍ تحميل السجل…')}</p>}

      {load.state === 'error' && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-card p-4">
          <p className="font-semibold">{t('The register could not be loaded.', 'تعذّر تحميل السجل.')}</p>
          <p className="text-sm text-muted-foreground">{t('Nothing was lost. Check your connection and try again.', 'لم يضع شيء. تحقّق من اتصالك وأعد المحاولة.')}</p>
          <Button className="mt-3 min-h-[44px]" onClick={() => { setLoad({ state: 'loading' }); void refresh(); }}>{t('Try again', 'أعد المحاولة')}</Button>
        </div>
      )}

      {load.state === 'ready' && (
        <>
          {rows.length === 0 ? (
            <div data-testid="empty-state" className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
              <p className="text-lg font-semibold">{t('No risks yet.', 'لا توجد مخاطر بعد.')}</p>
              <p className="mx-auto mt-1 max-w-prose text-muted-foreground">
                {t('Add the first one. It takes about a minute: say what could happen, who owns it, and when you will look at it again.',
                   'أضِف أول خطر. يستغرق نحو دقيقة: قل ما قد يحدث، ومن يملكه، ومتى ستعود إليه.')}
              </p>
              <Button ref={addRef} className="mt-4 min-h-[44px]" onClick={() => setAdding(true)}><Plus aria-hidden className="size-4 me-2" />{t('Add the first risk', 'أضِف أول خطر')}</Button>
            </div>
          ) : (
            <>
              <div role="group" aria-label={t('What needs attention', 'ما يحتاج إلى انتباه')} className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c.key} type="button" data-testid={`chip-${c.key}`} aria-pressed={filter === c.key}
                    onClick={() => setFilter(filter === c.key ? 'all' : c.key)}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${filter === c.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted'}`}
                  >
                    {c.icon}<span><bdi className="font-bold">{c.n}</bdi> {t(c.en, c.ar)}</span>
                  </button>
                ))}
                <Button ref={addRef} className="ms-auto min-h-[44px]" onClick={() => setAdding(true)}><Plus aria-hidden className="size-4 me-2" />{t('Add a risk', 'أضِف خطرًا')}</Button>
              </div>

              <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="shown-count">
                {filter === 'all'
                  ? t(`${rows.length} risks in the register.`, `${rows.length} خطرًا في السجل.`)
                  : t(`Showing ${shown.length} of ${rows.length}.`, `يُعرض ${shown.length} من ${rows.length}.`)}
              </p>

              {shown.length === 0 ? (
                <p data-testid="filter-empty" className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
                  {t('Nothing here. Every risk passes this check.', 'لا شيء هنا. كل الأخطار تجتاز هذا الفحص.')}{' '}
                  <button type="button" className="underline min-h-[44px]" onClick={() => setFilter('all')}>{t('Show all', 'عرض الكل')}</button>
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border bg-card" data-testid="risk-list">
                  {shown.map((r) => <RiskRow key={r.id} r={r} today={today} isAr={isAr} onOpen={() => setOpenId(r.id)} />)}
                </ul>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">
            {t('Evidence stage, ratings, money and controls arrive in later releases. None are shown, so none are implied.',
               'مرحلة الدليل والتقييمات والمبالغ والضوابط تأتي في إصدارات لاحقة. لا شيء منها معروض، فلا شيء منها مُشار إليه ضمنًا.')}
          </p>
        </>
      )}

      <AddRiskSheet open={adding} onOpenChange={setAdding} client={client} isAr={isAr}
        onCreated={async () => { setAdding(false); await refresh(); }} />
      <RecordSheet risk={open} onClose={() => setOpenId(null)} client={client} isAr={isAr} today={today} onChanged={refresh} />
    </section>
  );
}

function RiskRow({ r, today, isAr, onOpen }: { r: RegisterRisk; today: string; isAr: boolean; onOpen: () => void }) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const d = r.reviewDate ? daysUntil(r.reviewDate, today) : null;
  const review = d === null ? t('No review date', 'بلا تاريخ مراجعة')
    : d < 0 ? t(`Review overdue by ${-d} days`, `مراجعتها متأخرة ${-d} يومًا`)
    : d === 0 ? t('Review due today', 'المراجعة اليوم')
    : t(`Review in ${d} days`, `المراجعة بعد ${d} يومًا`);
  return (
    <li>
      <button type="button" onClick={onOpen} data-testid="risk-row"
        className="flex min-h-[44px] w-full flex-col gap-1 p-4 text-start hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <span className="flex flex-wrap items-center gap-2">
          <bdi className="font-mono text-sm font-bold text-primary">{r.riskRef}</bdi>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.status === 'draft' ? t('Draft', 'مسودة') : t('Open', 'مفتوح')}</span>
        </span>
        <span className="font-medium">{r.event || t('(no description yet)', '(بلا وصف بعد)')}</span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {!r.ownerName && <AlertTriangle aria-hidden className="size-4 text-destructive" />}
            {r.ownerName ? <>{t('Owner:', 'المالك:')} <bdi>{r.ownerName}</bdi></> : <strong className="text-foreground">{t('No owner yet', 'بلا مالك بعد')}</strong>}
          </span>
          <span className={`inline-flex items-center gap-1 ${d !== null && d < 0 ? 'text-foreground font-semibold' : ''}`}>
            {d !== null && d < 0 && <AlertTriangle aria-hidden className="size-4 text-destructive" />}{review}
          </span>
        </span>
      </button>
    </li>
  );
}

function AddRiskSheet({ open, onOpenChange, client, isAr, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; client: RiskRegisterClient; isAr: boolean; onCreated: () => Promise<void>;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const id = useId();
  const [f, setF] = useState({ event: '', cause: '', consequence: '', ownerName: '', reviewDate: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const keyRef = useRef<string>('');
  useEffect(() => { if (open) { setF({ event: '', cause: '', consequence: '', ownerName: '', reviewDate: '' }); setErr(null); keyRef.current = `new-${Date.now()}-${Math.random().toString(36).slice(2)}`; } }, [open]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.event.trim()) { setErr(t('Say what could happen first.', 'قل أولًا ما الذي قد يحدث.')); return; }
    setBusy(true); setErr(null);
    try {
      // The same key is reused on retry, so a double press or a retry never creates two risks.
      await client.create({ event: f.event.trim(), cause: f.cause.trim(), consequence: f.consequence.trim(), ownerName: f.ownerName.trim() || null, reviewDate: f.reviewDate || null }, keyRef.current);
      await onCreated();
    } catch { setErr(t('Not saved. Your text is still here. Try again.', 'لم يُحفظ. نصّك ما زال هنا. أعد المحاولة.')); } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isAr ? 'left' : 'right'} dir={isAr ? 'rtl' : 'ltr'} className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-start sm:text-start">
          <SheetTitle>{t('Add a risk', 'إضافة خطر')}</SheetTitle>
          <SheetDescription>{t('Describe the risk in a sentence. Everything else can wait; it is saved as a draft.', 'صف الخطر في جملة واحدة. كل ما عدا ذلك يمكن أن ينتظر؛ يُحفظ كمسودة.')}</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <div className="space-y-1">
            <Label htmlFor={`${id}-e`}>{t('What could happen?', 'ما الذي قد يحدث؟')} <span aria-hidden>*</span></Label>
            <Textarea id={`${id}-e`} required aria-required="true" aria-describedby={err ? `${id}-err` : undefined} value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })} rows={3} data-testid="f-event" />
          </div>
          <details className="group rounded-lg border border-border" data-testid="more-details">
            <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-medium text-primary">
              {t('Add details (optional)', 'إضافة تفاصيل (اختياري)')}
            </summary>
            <div className="space-y-4 border-t border-border p-3">
          <div className="space-y-1"><Label htmlFor={`${id}-c`}>{t('Why might it happen?', 'لماذا قد يحدث؟')}</Label>
            <Textarea id={`${id}-c`} value={f.cause} onChange={(e) => setF({ ...f, cause: e.target.value })} rows={2} data-testid="f-cause" /></div>
          <div className="space-y-1"><Label htmlFor={`${id}-q`}>{t('What would it cause?', 'ما الذي سيترتب عليه؟')}</Label>
            <Textarea id={`${id}-q`} value={f.consequence} onChange={(e) => setF({ ...f, consequence: e.target.value })} rows={2} data-testid="f-consequence" /></div>
          <div className="space-y-1"><Label htmlFor={`${id}-o`}>{t('Who owns it?', 'من المالك؟')}</Label>
            <Input id={`${id}-o`} className="min-h-[44px]" value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} data-testid="f-owner" />
            <p className="text-xs text-muted-foreground">{t('Leave empty if nobody owns it yet. It will show as "No owner yet".', 'اتركه فارغًا إن لم يكن له مالك بعد. سيظهر "بلا مالك بعد".')}</p></div>
          <div className="space-y-1"><Label htmlFor={`${id}-d`}>{t('When will you look at it again?', 'متى ستعود إليه؟')}</Label>
            <Input id={`${id}-d`} type="date" className="min-h-[44px]" value={f.reviewDate} onChange={(e) => setF({ ...f, reviewDate: e.target.value })} data-testid="f-review" /></div>
            </div>
          </details>
          {err && <p id={`${id}-err`} role="alert" className="text-sm font-medium text-destructive" data-testid="form-error">{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="min-h-[44px]" disabled={busy} data-testid="f-save">{busy ? t('Saving…', 'جارٍ الحفظ…') : t('Save as draft', 'احفظ كمسودة')}</Button>
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => onOpenChange(false)}>{t('Cancel', 'إلغاء')}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RecordSheet({ risk, onClose, client, isAr, today, onChanged }: {
  risk: RegisterRisk | null; onClose: () => void; client: RiskRegisterClient; isAr: boolean; today: string; onChanged: () => Promise<void>;
}) {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const id = useId();
  const [f, setF] = useState({ event: '', cause: '', consequence: '', ownerName: '', reviewDate: '' });
  const [version, setVersion] = useState(0);
  const [conflict, setConflict] = useState<RegisterRisk | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (risk) { setF({ event: risk.event, cause: risk.cause, consequence: risk.consequence, ownerName: risk.ownerName ?? '', reviewDate: risk.reviewDate ?? '' }); setVersion(risk.rowVersion); setConflict(null); setMsg(null); }
  }, [risk?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!risk) return <Sheet open={false} onOpenChange={() => undefined}><SheetContent aria-describedby={undefined}><SheetTitle>{' '}</SheetTitle></SheetContent></Sheet>;

  const patch = { event: f.event.trim(), cause: f.cause.trim(), consequence: f.consequence.trim(), ownerName: f.ownerName.trim() || null, reviewDate: f.reviewDate || null };
  const dirty = patch.event !== risk.event || patch.cause !== risk.cause || patch.consequence !== risk.consequence
    || patch.ownerName !== risk.ownerName || patch.reviewDate !== risk.reviewDate;
  const missing = missingForPublish({ event: patch.event, ownerName: patch.ownerName, reviewDate: patch.reviewDate });
  const missingText = missing.map((m) => m === 'event' ? t('a description', 'وصف') : m === 'owner' ? t('an owner', 'مالك') : t('a review date', 'تاريخ مراجعة')).join(isAr ? ' و' : ', ');

  const run = async (fn: () => Promise<RegisterRisk>, okEn: string, okAr: string) => {
    setBusy(true); setMsg(null);
    try { const saved = await fn(); setVersion(saved.rowVersion); setConflict(null); setMsg(t(okEn, okAr)); await onChanged(); }
    catch (e) {
      if (e instanceof RegisterConflict) setConflict(e.current);
      else setMsg(t('Not saved. Your changes are still here. Try again.', 'لم يُحفظ. تغييراتك ما زالت هنا. أعد المحاولة.'));
    } finally { setBusy(false); }
  };
  const reload = () => { if (conflict) { setF({ event: conflict.event, cause: conflict.cause, consequence: conflict.consequence, ownerName: conflict.ownerName ?? '', reviewDate: conflict.reviewDate ?? '' }); setVersion(conflict.rowVersion); setConflict(null); setMsg(null); void onChanged(); } };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side={isAr ? 'left' : 'right'} dir={isAr ? 'rtl' : 'ltr'} className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-start sm:text-start">
          <SheetTitle><bdi className="font-mono">{risk.riskRef}</bdi> · {risk.status === 'draft' ? t('Draft', 'مسودة') : t('Open', 'مفتوح')}</SheetTitle>
          <SheetDescription data-testid="version-line">{t(`Version ${version}. Every save is kept as a new version; nothing is overwritten.`, `الإصدار ${version}. كل حفظ يُحتفظ به كإصدار جديد؛ لا يُكتب فوق شيء.`)}</SheetDescription>
        </SheetHeader>

        {conflict && (
          <div role="alert" data-testid="conflict" className="mt-4 space-y-2 rounded-lg border border-destructive/50 bg-card p-3">
            <p className="font-semibold">{t('Someone saved this risk before you.', 'حفظ شخص آخر هذا الخطر قبلك.')}</p>
            <p className="text-sm text-muted-foreground">{t(`It is now at version ${conflict.rowVersion}. Your edits are not lost: they are still in the boxes below. Load their version, then re-apply what you changed.`,
              `أصبح الآن في الإصدار ${conflict.rowVersion}. تعديلاتك لم تضِع: ما زالت في الخانات أدناه. حمّل نسختهم ثم أعد تطبيق ما غيّرته.`)}</p>
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={reload} data-testid="conflict-reload">{t('Load their version', 'حمّل نسختهم')}</Button>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="space-y-1"><Label htmlFor={`${id}-e`}>{t('What could happen?', 'ما الذي قد يحدث؟')}</Label>
            <Textarea id={`${id}-e`} rows={3} value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })} data-testid="r-event" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor={`${id}-o`}>{t('Owner', 'المالك')}</Label>
            <Input id={`${id}-o`} className="min-h-[44px]" value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} data-testid="r-owner" /></div>
          <div className="space-y-1"><Label htmlFor={`${id}-d`}>{t('Next review', 'المراجعة القادمة')}</Label>
            <Input id={`${id}-d`} type="date" className="min-h-[44px]" value={f.reviewDate} onChange={(e) => setF({ ...f, reviewDate: e.target.value })} data-testid="r-review" />
            {f.reviewDate && daysUntil(f.reviewDate, today) < 0 && <p className="text-sm font-medium">{t('This date has passed. Set the next review.', 'مضى هذا التاريخ. حدّد المراجعة القادمة.')}</p>}</div>

          </div>
          <details className="rounded-lg border border-border" open={Boolean(f.cause || f.consequence) || undefined} data-testid="record-more">
            <summary className="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-medium text-primary">{t('Cause and consequence', 'السبب والأثر')}</summary>
            <div className="space-y-4 border-t border-border p-3">
          <div className="space-y-1"><Label htmlFor={`${id}-c`}>{t('Why might it happen?', 'لماذا قد يحدث؟')}</Label>
            <Textarea id={`${id}-c`} rows={2} value={f.cause} onChange={(e) => setF({ ...f, cause: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor={`${id}-q`}>{t('What would it cause?', 'ما الذي سيترتب عليه؟')}</Label>
            <Textarea id={`${id}-q`} rows={2} value={f.consequence} onChange={(e) => setF({ ...f, consequence: e.target.value })} /></div>
            </div>
          </details>

          {msg && <p role="status" className="text-sm font-medium" data-testid="save-msg">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-[44px]" disabled={!dirty || busy} onClick={() => run(() => client.update(risk.id, version, patch), 'Saved as a new version.', 'حُفظ كإصدار جديد.')} data-testid="r-save">{t('Save changes', 'احفظ التغييرات')}</Button>
            {risk.status === 'draft' && (
              <Button variant="outline" className="min-h-[44px]" disabled={missing.length > 0 || dirty || busy} aria-describedby={`${id}-gate`}
                onClick={() => run(() => client.publish(risk.id, version), 'Published. It is now open.', 'نُشر. أصبح مفتوحًا.')} data-testid="r-publish">{t('Publish', 'انشر')}</Button>
            )}
          </div>
          {risk.status === 'draft' && (
            <p id={`${id}-gate`} className="text-sm text-muted-foreground" data-testid="gate-text">
              {dirty ? t('Save your changes first, then publish.', 'احفظ تغييراتك أولًا ثم انشر.')
                : missing.length ? t(`To publish, add ${missingText}.`, `للنشر، أضِف ${missingText}.`)
                : t('Ready to publish.', 'جاهز للنشر.')}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
