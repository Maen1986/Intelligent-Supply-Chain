/**
 * SavedPlansSection — displays all server-persisted AI plans for the
 * authenticated user. Rendered inside AccountSettings.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { API_BASE } from '@/lib/apiBase';
import { Sparkles, ChevronDown, ChevronUp, Trash2, Loader2, FileText, ArrowUpRight } from 'lucide-react';

interface PlanEntry {
  toolKey: string;
  text:    string;
  savedAt: string;
}

/* Human-readable label for known tool keys */
const TOOL_LABELS: Record<string, { en: string; ar: string }> = {
  'maturity':            { en: 'Maturity Assessment',       ar: 'تقييم النضج'             },
  'procurement-catmgmt': { en: 'Procurement & Cat. Mgmt',   ar: 'المشتريات وإدارة الفئات' },
  'risk-register':       { en: 'Risk Register',             ar: 'سجل المخاطر'             },
  'clm-portfolio':       { en: 'Contract Portfolio',        ar: 'محفظة العقود'            },
  'training':            { en: 'Training Plan',             ar: 'خطة التدريب'             },
  'kpi':                 { en: 'KPI Dashboard',             ar: 'لوحة مؤشرات الأداء'      },
  'kraljic':             { en: 'Kraljic Matrix',            ar: 'مصفوفة كرالجيتش'         },
};

function toolLabel(key: string, isAr: boolean): string {
  const entry = TOOL_LABELS[key];
  if (entry) return isAr ? entry.ar : entry.en;
  // scorecard-<id>
  if (key.startsWith('scorecard-')) return isAr ? 'بطاقة تقييم المورّد' : 'Supplier Scorecard';
  // isc-challenge-ai-<slug>-<index>
  if (key.startsWith('isc-challenge-ai-')) return isAr ? 'خطة عمل التحدي' : 'Challenge Action Plan';
  // isc-tool-<slug>-… etc.
  if (key.startsWith('isc-tool-')) return isAr ? 'أداة سلسلة الإمداد' : 'Supply-Chain Tool';
  return key;
}

/* Route for each known static tool key */
const TOOL_ROUTES: Record<string, string> = {
  'maturity':            '/maturity',
  'procurement-catmgmt': '/solutions/procurement-excellence',
  'risk-register':       '/risk-management',
  'clm-portfolio':       '/solutions/contract-lifecycle-management',
  'training':            '/solutions/training-capability-building',
  'kpi':                 '/command-center',
  'kraljic':             '/kraljic',
};

/**
 * Returns the SPA route for a given toolKey, or null if no route is known.
 *
 * Handles:
 *  - The 7 static tool keys (see TOOL_ROUTES above)
 *  - scorecard-<supplierId>  → supplier relationship governance solution page
 *  - isc-challenge-ai-<slug>-<index>  → /solutions/<slug>
 */
function toolRoute(key: string): string | null {
  if (TOOL_ROUTES[key]) return TOOL_ROUTES[key];
  if (key.startsWith('scorecard-')) return '/solutions/supplier-relationship-governance';
  // isc-challenge-ai-<slug>-<challengeIndex>: extract slug by stripping prefix + trailing -<digits>
  const challengeMatch = key.match(/^isc-challenge-ai-(.+)-\d+$/);
  if (challengeMatch) return `/solutions/${challengeMatch[1]}`;
  return null;
}

interface Props {
  isAr: boolean;
}

export function SavedPlansSection({ isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;

  const [plans,    setPlans]    = useState<PlanEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  /* Fetch all plans once on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/plans`, { credentials: 'include' });
        const data = await res.json() as { ok: boolean; plans?: PlanEntry[] };
        if (!cancelled && data.ok && data.plans) setPlans(data.plans);
      } catch {
        // Non-fatal — section stays empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleExpand = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (toolKey: string) => {
    setDeleting(prev => new Set(prev).add(toolKey));
    // Optimistic removal — update UI immediately before the network round-trip
    setPlans(prev => prev.filter(p => p.toolKey !== toolKey));
    setExpanded(prev => { const n = new Set(prev); n.delete(toolKey); return n; });
    try {
      await fetch(`${API_BASE}/plans/${encodeURIComponent(toolKey)}`, {
        method:      'DELETE',
        credentials: 'include',
      });
    } finally {
      setDeleting(prev => { const n = new Set(prev); n.delete(toolKey); return n; });
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('Saved AI Plans', 'خطط الذكاء الاصطناعي المحفوظة')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('All plans generated across your toolkit tools.', 'جميع الخطط المُولَّدة عبر أدوات مجموعتك.')}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          {t('Loading plans…', 'جارٍ تحميل الخطط…')}
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
          <FileText className="w-9 h-9 opacity-30" />
          <p className="text-sm">
            {t(
              'No plans saved yet. Generate a plan from any toolkit tool to see it here.',
              'لا توجد خطط محفوظة بعد. أنشئ خطة من أي أداة في المجموعة لتظهر هنا.',
            )}
          </p>
        </div>
      )}

      {/* Plan list */}
      {!loading && plans.length > 0 && (
        <ul className="space-y-3">
          {plans.map(plan => {
            const isExpanded  = expanded.has(plan.toolKey);
            const isDeleting  = deleting.has(plan.toolKey);
            const dateLabel   = new Date(plan.savedAt).toLocaleDateString(
              isAr ? 'ar-SA' : 'en-GB',
              { year: 'numeric', month: 'short', day: 'numeric' },
            );
            // Brief excerpt — first 120 non-empty chars
            const excerpt = plan.text.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim().slice(0, 120);

            return (
              <li
                key={plan.toolKey}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {toolLabel(plan.toolKey, isAr)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('Saved', 'حُفظت')} {dateLabel}
                    </p>
                    {!isExpanded && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                        {excerpt}{excerpt.length === 120 ? '…' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Go to tool */}
                    {(() => {
                      const route = toolRoute(plan.toolKey);
                      return route ? (
                        <Link
                          href={route}
                          className="flex items-center gap-1 text-xs font-medium text-primary/80 hover:text-primary hover:underline underline-offset-2 px-1.5 py-1 rounded transition-colors"
                          title={t('Go to tool', 'الانتقال إلى الأداة')}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          {t('Go to tool', 'الانتقال إلى الأداة')}
                        </Link>
                      ) : null;
                    })()}

                    {/* View / Collapse */}
                    <button
                      onClick={() => toggleExpand(plan.toolKey)}
                      className="flex items-center gap-1 text-xs font-bold text-primary underline underline-offset-2 hover:opacity-70 px-1.5 py-1 rounded"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded
                        ? <><ChevronUp   className="w-3.5 h-3.5" />{t('Collapse', 'طيّ')}</>
                        : <><ChevronDown className="w-3.5 h-3.5" />{t('View', 'عرض')}</>}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(plan.toolKey)}
                      disabled={isDeleting}
                      className="p-1.5 rounded hover:text-red-500 hover:bg-red-50 transition-colors text-muted-foreground disabled:opacity-40"
                      title={t('Delete plan', 'حذف الخطة')}
                    >
                      {isDeleting
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2  className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className={`px-5 py-4 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-96 overflow-y-auto border-t border-border bg-white ${isAr ? 'text-right' : ''}`}
                    dir={isAr ? 'rtl' : 'ltr'}
                  >
                    {plan.text}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
