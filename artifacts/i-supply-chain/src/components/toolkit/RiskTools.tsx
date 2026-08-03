/**
 * Supply Chain Risk Management Toolkit — World-Class Solution
 *
 * Five integrated modules grounded in ISO 31000, CIPS Risk Management Standard, APICS/ASCM Supply Chain Resiliency, and CSCMP supply chain risk research:
 * 1. KRI Monitor      — live key risk indicator dashboard with RAG thresholds
 * 2. Risk Register    — full risk table with L×I scoring and color-coded severity
 * 3. Risk Heat Map    — 5×5 visual matrix with risk items plotted by likelihood × impact
 * 4. Mitigation Plans — per-risk action tracking with owner, due date, and status
 * 5. BCP Templates    — downloadable business continuity & contingency templates
 * 6. AI Risk Brief    — AI-generated risk assessment and response strategy
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp,
  FileDown, Sparkles, Shield, Activity, Info, CheckCircle } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';

/** Stable server-side key for the Risk Register AI plan slot. */
export const RISK_TOOL_KEY = 'risk-register' as const;
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { toast } from 'sonner';

interface RiskToolsProps { isAr: boolean; }

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskCategory = 'supply' | 'demand' | 'operational' | 'financial' | 'geopolitical' | 'regulatory' | 'cyber' | 'environmental';
type RiskStatus    = 'open' | 'in-progress' | 'closed' | 'accepted';
type MitigationStatus = 'not-started' | 'in-progress' | 'completed';

interface RiskItem {
  id: string;
  category: RiskCategory;
  description: string;
  driver: string;
  affectedArea: string;
  likelihood: 1|2|3|4|5;
  impact: 1|2|3|4|5;
  velocity: 'slow' | 'medium' | 'fast';
  mitigationAction: string;
  owner: string;
  dueDate: string;
  status: RiskStatus;
  mitigationStatus: MitigationStatus;
  residualLikelihood: 1|2|3|4|5;
  residualImpact: 1|2|3|4|5;
}

interface KRIRow { id: string; value: string; }

// ─── Risk scoring ─────────────────────────────────────────────────────────────

const riskScore = (r: RiskItem) => r.likelihood * r.impact;
const residualScore = (r: RiskItem) => r.residualLikelihood * r.residualImpact;

function riskLevel(score: number): { label: string; labelAr: string; color: string; bg: string; border: string } {
  if (score >= 20) return { label: 'Critical',      labelAr: 'حرج',         color: '#7f1d1d', bg: '#fee2e2', border: '#ef4444' };
  if (score >= 12) return { label: 'High',           labelAr: 'مرتفع',       color: '#92400e', bg: '#fef3c7', border: '#d97706' };
  if (score >= 6)  return { label: 'Medium',         labelAr: 'متوسط',       color: '#854d0e', bg: '#fefce8', border: '#eab308' };
  return              { label: 'Low',            labelAr: 'منخفض',      color: '#065f46', bg: '#d1fae5', border: '#10b981' };
}

// ─── KRI definitions ──────────────────────────────────────────────────────────

const KRI_DEFS = [
  { id: 'concentration', label: 'Supplier Concentration', labelAr: 'تركّز الموردين', unit: '%', unitAr: '%', amber: 50, red: 70, higherIsBetter: false, desc: '% of total spend with single largest supplier', descAr: '% الإنفاق الكلي مع أكبر مورّد واحد' },
  { id: 'dio',           label: 'Days Inventory Outstanding', labelAr: 'أيام المخزون القائم', unit: 'days', unitAr: 'أيام', amber: 45, red: 60, higherIsBetter: false, desc: 'Average days of inventory held across all locations', descAr: 'متوسط أيام الاحتفاظ بالمخزون عبر جميع المواقع' },
  { id: 'ltvariance',    label: 'Lead Time Variance', labelAr: 'تباين مهلة التوريد', unit: '%', unitAr: '%', amber: 20, red: 40, higherIsBetter: false, desc: '% variance vs planned supplier lead time', descAr: '% التباين مقابل مهلة التوريد المخطّطة' },
  { id: 'geo',           label: 'Geopolitical Exposure', labelAr: 'التعرّض الجيوسياسي', unit: '/100', unitAr: '/100', amber: 45, red: 65, higherIsBetter: false, desc: 'Composite score of supply chain exposure to high-risk geographies', descAr: 'درجة مركّبة للتعرّض الجغرافي عالي الخطورة' },
  { id: 'otif',          label: 'Strategic Supplier OTIF', labelAr: 'OTIF الموردين الاستراتيجيين', unit: '%', unitAr: '%', amber: 80, red: 65, higherIsBetter: true, desc: 'On-time in-full delivery rate across strategic suppliers', descAr: 'معدّل التسليم في الوقت وبالكامل للموردين الاستراتيجيين' },
  { id: 'singlesource',  label: 'Single-Source Spend', labelAr: 'إنفاق المصدر الواحد', unit: '%', unitAr: '%', amber: 25, red: 40, higherIsBetter: false, desc: '% of total spend that has only one qualified supplier', descAr: '% الإنفاق الذي لديه مورّد مؤهّل واحد فقط' },
  { id: 'bcpcover',      label: 'BCP Coverage', labelAr: 'تغطية خطة الاستمرارية', unit: '%', unitAr: '%', amber: 50, red: 30, higherIsBetter: true, desc: '% of critical supply items covered by a tested BCP', descAr: '% العناصر الحرجة المشمولة بخطة استمرارية أعمال مختبرة' },
];

function kriStatus(def: typeof KRI_DEFS[0], value: number): 'green' | 'amber' | 'red' {
  if (def.higherIsBetter) { return value >= def.amber ? 'green' : value >= def.red ? 'amber' : 'red'; }
  return value <= def.amber ? 'green' : value <= def.red ? 'amber' : 'red';
}

const STATUS_STYLE = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800' };
const STATUS_LABEL = { green: { en: 'On Track', ar: 'على المسار' }, amber: { en: 'Watch', ar: 'مراقبة' }, red: { en: 'Alert', ar: 'تنبيه' } };

const RISK_CATEGORIES: { id: RiskCategory; label: string; labelAr: string; icon: string }[] = [
  { id: 'supply',        label: 'Supply Risk',         labelAr: 'مخاطر التوريد',      icon: '📦' },
  { id: 'demand',        label: 'Demand Risk',         labelAr: 'مخاطر الطلب',        icon: '📈' },
  { id: 'operational',   label: 'Operational Risk',    labelAr: 'مخاطر تشغيلية',      icon: '⚙️' },
  { id: 'financial',     label: 'Financial Risk',      labelAr: 'مخاطر مالية',        icon: '💰' },
  { id: 'geopolitical',  label: 'Geopolitical Risk',   labelAr: 'مخاطر جيوسياسية',   icon: '🌍' },
  { id: 'regulatory',    label: 'Regulatory Risk',     labelAr: 'مخاطر تنظيمية',      icon: '📜' },
  { id: 'cyber',         label: 'Cyber / Digital Risk', labelAr: 'مخاطر رقمية',       icon: '🔒' },
  { id: 'environmental', label: 'Environmental Risk',  labelAr: 'مخاطر بيئية',        icon: '🌱' },
];

const VELOCITY_LABELS = { slow: { en: 'Slow', ar: 'بطيء' }, medium: { en: 'Medium', ar: 'متوسط' }, fast: { en: 'Fast', ar: 'سريع' } };

function nid() { return Math.random().toString(36).slice(2, 10); }

function defaultRisk(): RiskItem {
  return {
    id: nid(), category: 'supply', description: '', driver: '', affectedArea: '',
    likelihood: 3, impact: 3, velocity: 'medium',
    mitigationAction: '', owner: '', dueDate: '', status: 'open', mitigationStatus: 'not-started',
    residualLikelihood: 2, residualImpact: 2,
  };
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const SK_RISKS   = 'isc-tool-risk-register-v2';
const SK_KRI     = 'isc-tool-risk-kri-v2';
const SK_ALERTS  = 'isc-tool-risk-alerts';

// ─── Supplier Alert Config types & defaults ───────────────────────────────────

interface AlertCfg { otif: string; defect: string; financial: string; }

const DEFAULT_ALERTS: AlertCfg[] = [
  { otif: '90', defect: '1000', financial: '70' },
  { otif: '85', defect: '2000', financial: '55' },
  { otif: '80', defect: '3000', financial: '40' },
];

const ALERT_TIERS = [
  { label: 'Strategic',     labelAr: 'استراتيجي', color: '#082C6B' },
  { label: 'Preferred',     labelAr: 'مفضّل',     color: '#C9A84C' },
  { label: 'Transactional', labelAr: 'معاملاتي',  color: '#64748b' },
];

const ALERT_COLS: { field: keyof AlertCfg; label: string; labelAr: string; unit: string; unitAr: string; min: number; max: number }[] = [
  { field: 'otif',      label: 'OTIF Threshold',      labelAr: 'حد OTIF',              unit: '%',   unitAr: '%',    min: 0,   max: 100  },
  { field: 'defect',    label: 'Defect Rate Threshold', labelAr: 'حد معدّل العيوب',     unit: 'ppm', unitAr: 'ppm',  min: 0,   max: 99999 },
  { field: 'financial', label: 'Financial Score',       labelAr: 'درجة الأداء المالي',  unit: '/100', unitAr: '/100', min: 0,   max: 100  },
];

// ─── Print zone helper ────────────────────────────────────────────────────────

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

// ─── BCP Templates ────────────────────────────────────────────────────────────

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const BCP_TEMPLATE = `--------------------------------------------------------------------------------
SUPPLY CHAIN BUSINESS CONTINUITY PLAN (BCP) — TEMPLATE
I Supply Chain | Risk Management Toolkit
ISO 22301-Aligned | Version 1.0
--------------------------------------------------------------------------------

DOCUMENT CONTROL
────────────────
Organisation:       [Your Organisation]
Plan Owner:         [Name / Title]
Last Reviewed:      [DD/MM/YYYY]
Next Review Due:    [DD/MM/YYYY]
Classification:     [Confidential / Internal]

────────────────────────────────────────────────────────────────────────────────
SECTION 1 — PURPOSE & SCOPE
────────────────────────────────────────────────────────────────────────────────
This BCP provides the framework to maintain critical supply chain operations
during a disruption event, minimise operational and financial impact, and
restore normal operations within defined Recovery Time Objectives (RTOs).

Scope covers: [Define: categories, geographies, business units in scope]
Out of scope: [Define clearly]

────────────────────────────────────────────────────────────────────────────────
SECTION 2 — CRITICAL SUPPLY ITEMS & RTO / RPO
────────────────────────────────────────────────────────────────────────────────
Item / Category       | Criticality | Max Tolerable | RTO     | RPO    | Backup Supplier
─────────────────────────────────────────────────────────────────────────────
[Item 1]              | Critical    | 24 hours      | 48 hrs  | 2 hrs  | [Name]
[Item 2]              | High        | 72 hours      | 5 days  | 1 day  | [Name]
[Item 3]              | Medium      | 7 days        | 10 days | 3 days | [Name]

RTO = Recovery Time Objective (time to restore supply)
RPO = Recovery Point Objective (acceptable data/order backlog loss)

────────────────────────────────────────────────────────────────────────────────
SECTION 3 — RISK SCENARIOS & RESPONSE PROTOCOLS
────────────────────────────────────────────────────────────────────────────────

3.1 SUPPLIER FAILURE / INSOLVENCY
Trigger:      Supplier unable to deliver for > [X] days, or enters insolvency
Response:
  Hour 0–4:   Activate backup supplier (pre-agreed contingency order)
  Hour 4–24:  Draw down safety stock; notify internal stakeholders
  Day 2–5:    Issue emergency RFQ to qualified alternatives; qualify fast
  Day 5+:     Transition volume; formal contract with alternative supplier
Owner:        [Category Manager / SCM Director]
Escalation:   [CPO] if RTO cannot be met within 48 hours

3.2 PORT / LOGISTICS DISRUPTION
Trigger:      Port closure, shipping lane blockage, customs hold > [X] days
Response:
  Hour 0–4:   Identify alternative routing / port (pre-mapped)
  Hour 4–48:  Redirect in-transit shipments; expedite air freight if critical
  Day 2–7:    Increase safety stock orders from alternative origins
  Day 7+:     Re-evaluate sourcing geography for affected categories
Owner:        [Logistics Manager]

3.3 GEOPOLITICAL EVENT / SANCTIONS
Trigger:      New sanctions, border closure, export controls affecting supply
Response:
  Day 0–1:    Legal / compliance review of all affected supplier contracts
  Day 1–5:    Identify non-sanctioned alternative suppliers
  Day 5–30:   Transition supply to compliant sources
Owner:        [Legal / CPO]

3.4 CYBER / ERP OUTAGE
Trigger:      ERP unavailable for > [X] hours affecting procurement / PO processing
Response:
  Hour 0–2:   Activate manual PO processing fallback (paper-based templates)
  Hour 2–24:  Notify key suppliers of potential order delays
  Day 2+:     Prioritise critical reorders; backlog reconciliation on recovery
Owner:        [IT Director / SCM Operations Manager]

3.5 COMMODITY PRICE SHOCK
Trigger:      Key commodity price increases > [X]% in [X] days
Response:
  Day 0–3:    Review all open contracts — trigger price review clauses
  Day 3–14:   Activate demand-side levers: specification substitution, reduced consumption
  Day 14+:    Renegotiate long-term contracts; explore hedging if applicable
Owner:        [Category Manager / CFO]

────────────────────────────────────────────────────────────────────────────────
SECTION 4 — COMMUNICATION PLAN
────────────────────────────────────────────────────────────────────────────────
Internal Stakeholders:
  SCM Team:         [Notify within X hours via Teams / WhatsApp group]
  Operations:       [Notify within X hours — production schedule impact]
  Finance:          [Notify within X hours — cost impact estimate]
  Executive:        [Notify within 24 hours if RTO threatened]

External Stakeholders:
  Key Suppliers:    [Notify within X hours — capacity and lead time implications]
  Key Customers:    [Notify if delivery risk > [X] days — agree mitigation]
  Logistics:        [Notify within X hours for routing alternatives]

────────────────────────────────────────────────────────────────────────────────
SECTION 5 — TESTING & MAINTENANCE
────────────────────────────────────────────────────────────────────────────────
• Tabletop exercise: Annually (simulate 2 scenarios per year)
• Backup supplier qualification: Confirm capability every 6 months
• Contact list review: Quarterly
• Full document review: Annually or after any major supply disruption

--------------------------------------------------------------------------------
END OF BCP TEMPLATE — Complete all [bracketed] fields before use.
--------------------------------------------------------------------------------`;

const RISK_CSV_TEMPLATE =
  'ID,Category,Description,Risk Driver,Affected Area,Likelihood (1-5),Impact (1-5),Risk Score,Velocity,Mitigation Action,Owner,Due Date,Status,Residual Likelihood,Residual Impact\n' +
  'R001,supply,Single-source dependency on key component,No alternative qualified supplier,Production,4,5,20,fast,Qualify alternative supplier within 90 days,Category Manager,2025-09-30,open,2,3\n' +
  'R002,geopolitical,Port disruption — Red Sea routing,Geopolitical instability,Logistics,3,4,12,medium,Pre-identify alternative routing via Suez/Cape; maintain 45-day buffer stock,Logistics Manager,2025-08-15,in-progress,2,3\n' +
  'R003,financial,Commodity price volatility — polymer resins,Global supply-demand imbalance,COGS,3,3,9,fast,Index pricing clauses in contracts; quarterly price review windows,Procurement,2025-07-31,open,2,2\n';

const CONTINGENCY_SUPPLIER_CSV =
  'Category,Primary Supplier,Primary Supplier Contact,Alternative Supplier 1,Alt-1 Contact,Alt-1 Lead Time (days),Alt-1 Capacity (units/month),Qualification Status,Last Audit Date\n' +
  'Packaging — Primary,Al Faisaliah Packaging,+966 xxx,Gulf Pack Co,+971 xxx,14,50000,Qualified,2025-01-15\n' +
  'MRO — Critical Spares,OEM Direct,xxx,Arabian Technical,+966 xxx,45,N/A,Qualified,2024-11-20\n' +
  'IT Hardware,Cisco Systems,xxx,HP Enterprise,xxx,30,N/A,Pre-qualified,2025-03-01\n';

const RISK_TEMPLATES = [
  { id: 'register',     icon: '📋', label: 'Risk Register CSV Template',    labelAr: 'نموذج سجل المخاطر CSV',    desc: 'Pre-formatted CSV for uploading risk data into this tool.', descAr: 'نموذج CSV لرفع بيانات المخاطر إلى هذه الأداة.', fn: () => downloadCsv('risk-register-template.csv', RISK_CSV_TEMPLATE) },
  { id: 'bcp',          icon: '🛡️', label: 'BCP Template',                 labelAr: 'نموذج خطة استمرارية الأعمال', desc: 'ISO 22301-aligned Business Continuity Plan with 5 disruption scenarios pre-populated.', descAr: 'خطة استمرارية أعمال متوافقة مع ISO 22301 مع 5 سيناريوهات مسبقة التعبئة.', fn: () => downloadText('bcp-template.txt', BCP_TEMPLATE) },
  { id: 'contingency',  icon: '⚡', label: 'Contingency Supplier Register', labelAr: 'سجل الموردين الاحتياطيين',  desc: 'Track backup suppliers for each critical category with qualification status.', descAr: 'تتبّع الموردين الاحتياطيين لكل فئة حرجة مع حالة التأهيل.', fn: () => downloadCsv('contingency-suppliers.csv', CONTINGENCY_SUPPLIER_CSV) },
  { id: 'fmea',         icon: '🔬', label: 'FMEA Worksheet',               labelAr: 'ورقة عمل تحليل FMEA',      desc: 'Failure Mode and Effects Analysis template for critical supply processes — grounded in ISO 31000 risk assessment principles and APICS/ASCM supply chain resiliency methodology.', descAr: 'قالب تحليل أوضاع الفشل وتأثيراتها للعمليات الحرجة — مستند إلى مبادئ ISO 31000 ومنهجية APICS/ASCM للمرونة في سلسلة التوريد.', fn: () => downloadCsv('fmea-template.csv', 'Process Step,Potential Failure Mode,Potential Effect,Severity (1-10),Potential Cause,Occurrence (1-10),Current Controls,Detection (1-10),RPN (S×O×D),Recommended Action,Owner,Target Date\nSupplier order processing,Late PO issuance,Production stoppage,9,Manual process error,5,ERP workflow,3,135,Automate PO trigger via ERP,IT/Procurement,Q3 2025\nInbound inspection,Missed defective batch,Customer return,8,Insufficient sampling plan,4,Sampling per AQL,4,128,Implement automated optical inspection,Quality,Q4 2025\n') },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'kri' | 'register' | 'heatmap' | 'mitigation' | 'templates' | 'ai' | 'alert-config';

// ─── Main Component ───────────────────────────────────────────────────────────

export function RiskToolsSection({ isAr }: RiskToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('kri');

  // Supplier Alert Config state
  const [alertCfg, setAlertCfg] = useState<AlertCfg[]>(() => loadJson(SK_ALERTS, DEFAULT_ALERTS));
  const updateAlert = (tierIdx: number, field: keyof AlertCfg, val: string) => {
    const next = alertCfg.map((r, i) => i === tierIdx ? { ...r, [field]: val } : r);
    setAlertCfg(next);
    safeSetItem(SK_ALERTS, JSON.stringify(next));
  };
  const resetAlerts = () => { setAlertCfg(DEFAULT_ALERTS); safeSetItem(SK_ALERTS, JSON.stringify(DEFAULT_ALERTS)); };

  // KRI state
  const [kriValues, setKriValues] = useState<Record<string, string>>(() => loadJson(SK_KRI, {}));
  const updateKri = (id: string, val: string) => {
    const next = { ...kriValues, [id]: val };
    setKriValues(next); safeSetItem(SK_KRI, JSON.stringify(next));
  };

  // Risk register state
  const [risks, setRisks] = useState<RiskItem[]>(() => loadJson(SK_RISKS, []));
  const saveRisks = (r: RiskItem[]) => { setRisks(r); safeSetItem(SK_RISKS, JSON.stringify(r)); };
  const updateRisk = (id: string, field: keyof RiskItem, value: string | number) =>
    saveRisks(risks.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRisk = () => saveRisks([...risks, defaultRisk()]);
  const removeRisk = (id: string) => saveRisks(risks.filter(r => r.id !== id));

  // CSV import for the register (Task #358)
  const importFileRef = useRef<HTMLInputElement>(null);
  const [riskImportLog, setRiskImportLog] = useState<string | null>(null);

  const handleRiskCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so re-uploading the same file fires onChange again
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (rawLines.length < 2) {
        setRiskImportLog(isAr ? '✗ فشل الاستيراد: الملف فارغ.' : '✗ Import failed: file is empty.');
        return;
      }
      const headers = rawLines[0].split(',').map(h => h.trim());
      const VALID_CATEGORIES = ['supply','demand','operational','financial','geopolitical','regulatory','cyber','environmental'];
      const VALID_STATUSES   = ['open','in-progress','closed','accepted'];
      const VALID_VELOCITIES = ['slow','medium','fast'];
      const clamp15 = (v: number): 1|2|3|4|5 => (isNaN(v) ? 3 : Math.max(1, Math.min(5, v))) as 1|2|3|4|5;

      let imported = 0, skipped = 0;
      const newRisks: RiskItem[] = [];

      for (let i = 1; i < rawLines.length; i++) {
        const vals = rawLines[i].split(',');
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = (vals[j] ?? '').trim(); });

        const desc = row['Description']?.trim();
        if (!desc) { skipped++; continue; }

        const cat = row['Category']?.toLowerCase() as RiskCategory;
        const vel = row['Velocity']?.toLowerCase();
        const sts = row['Status']?.toLowerCase();

        newRisks.push({
          id:                  row['ID']?.trim() || nid(),
          category:            VALID_CATEGORIES.includes(cat) ? cat : 'supply',
          description:         desc,
          driver:              row['Risk Driver'] ?? '',
          affectedArea:        row['Affected Area'] ?? '',
          likelihood:          clamp15(parseInt(row['Likelihood (1-5)'] ?? '3', 10)),
          impact:              clamp15(parseInt(row['Impact (1-5)'] ?? '3', 10)),
          velocity:            VALID_VELOCITIES.includes(vel) ? (vel as 'slow'|'medium'|'fast') : 'medium',
          mitigationAction:    row['Mitigation Action'] ?? '',
          owner:               row['Owner'] ?? '',
          dueDate:             row['Due Date'] ?? '',
          status:              VALID_STATUSES.includes(sts) ? (sts as RiskStatus) : 'open',
          mitigationStatus:    'not-started',
          residualLikelihood:  clamp15(parseInt(row['Residual Likelihood'] ?? '2', 10)),
          residualImpact:      clamp15(parseInt(row['Residual Impact'] ?? '2', 10)),
        });
        imported++;
      }

      saveRisks([...risks, ...newRisks]);
      setRiskImportLog(
        isAr
          ? `✓ تم استيراد ${imported} مخاطرة(ات).${skipped > 0 ? ` تخطّي ${skipped}.` : ''}`
          : `✓ Imported ${imported} risk(s).${skipped > 0 ? ` ${skipped} skipped.` : ''}`,
      );
    };
    reader.readAsText(file);
  };

  // Expanded rows in register
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpandedRisks(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  // Heat map cell click filter
  const [heatFilter, setHeatFilter] = useState<{ l: number; i: number } | null>(null);

  // Derived
  const kriAlerts = useMemo(() =>
    KRI_DEFS.filter(d => { const v = parseFloat(kriValues[d.id] ?? ''); return !isNaN(v) && kriStatus(d, v) === 'red'; }),
    [kriValues]);

  const criticalRisks  = useMemo(() => risks.filter(r => riskScore(r) >= 20), [risks]);
  const highRisks      = useMemo(() => risks.filter(r => riskScore(r) >= 12 && riskScore(r) < 20), [risks]);
  const openRisks      = useMemo(() => risks.filter(r => r.status === 'open' || r.status === 'in-progress'), [risks]);
  const overdueRisks   = useMemo(() => risks.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.mitigationStatus !== 'completed'), [risks]);

  // AI prompt
  const buildPrompt = useCallback(() => {
    const kriSummary = KRI_DEFS.map(d => {
      const v = kriValues[d.id]; if (!v) return null;
      return `${d.label}: ${v}${d.unit} — ${kriStatus(d, parseFloat(v)).toUpperCase()}`;
    }).filter(Boolean).join('\n');

    const riskSummary = risks.map(r =>
      `[${riskLevel(riskScore(r)).label.toUpperCase()}] ${r.description} (L:${r.likelihood} × I:${r.impact} = ${riskScore(r)}) — ${r.category} — Owner: ${r.owner || 'Unassigned'} — Status: ${r.status}`
    ).join('\n');

    return [
      '## Supply Chain Risk Assessment Report',
      `Total risks tracked: ${risks.length} | Critical: ${criticalRisks.length} | High: ${highRisks.length} | Open: ${openRisks.length} | Overdue: ${overdueRisks.length}`,
      '',
      kriSummary ? '## Key Risk Indicators (KRIs)\n' + kriSummary : '',
      '',
      risks.length ? '## Risk Register Summary\n' + riskSummary : '',
      '',
      '## Your Task',
      'Generate a 4–6 paragraph executive supply chain risk assessment:',
      '1. Overall risk posture: portfolio severity, concentration of risks by category',
      '2. Critical and High risks: call out each by name with context and urgency',
      '3. KRI analysis: interpret the dashboard — what the numbers signal about supply health',
      '4. Mitigation gap analysis: which risks are inadequately mitigated or overdue',
      '5. 90-day risk response plan: prioritised actions [CRITICAL] / [HIGH] / [MEDIUM]',
      '6. Resilience recommendations: structural improvements to reduce systemic supply chain fragility',
    ].filter(Boolean).join('\n');
  }, [risks, kriValues, criticalRisks, highRisks, openRisks, overdueRisks]);

  const aiPlan = useAIPlan(buildPrompt, isAr, RISK_TOOL_KEY, risks.length > 0 || Object.values(kriValues).some(v => v));

  const tabs: { id: Tab; icon: string; label: string; labelAr: string }[] = [
    { id: 'kri',          icon: '🚨', label: 'KRI Monitor',      labelAr: 'مؤشرات المخاطر'      },
    { id: 'register',     icon: '📋', label: 'Risk Register',    labelAr: 'سجل المخاطر'          },
    { id: 'heatmap',      icon: '🗺️', label: 'Heat Map',         labelAr: 'خريطة الحرارة'        },
    { id: 'mitigation',   icon: '🛡️', label: 'Mitigation Plans', labelAr: 'خطط التخفيف'          },
    { id: 'templates',    icon: '📥', label: 'BCP & Templates',  labelAr: 'القوالب والاستمرارية'  },
    { id: 'alert-config', icon: '🔔', label: 'Supplier Alerts',  labelAr: 'تنبيهات الموردين'     },
    { id: 'ai',           icon: '✨', label: 'AI Risk Brief',    labelAr: 'تقرير المخاطر AI'     },
  ];

  const tabListRef = useRef<HTMLDivElement>(null);
  const handleTabKey = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % tabs.length
      : (idx - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    (tabListRef.current?.querySelectorAll('[role="tab"]')[next] as HTMLElement | undefined)?.focus();
  }, [tabs]);

  return (
    <div className="print-zone-kri space-y-4">
      {/* Print-only header */}
      <div className="hidden">
        {isAr ? 'مؤشرات المخاطر الرئيسية' : 'Key Risk Indicator Dashboard'}
      </div>
      <div className="hidden">
        {isAr ? `تاريخ التصدير: ${new Date().toLocaleDateString()}` : `Exported: ${new Date().toLocaleDateString()}`}
      </div>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{isAr ? 'إدارة مخاطر سلسلة التوريد' : 'Supply Chain Risk Management'}</p>
        {activeTab !== 'alert-config' && (
          <button
            onClick={() => { document.body.setAttribute('data-print', 'kri'); window.addEventListener('afterprint', () => document.body.removeAttribute('data-print'), { once: true }); window.print(); }}
            className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold text-white bg-[#082C6B] hover:opacity-90 transition-colors">
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        )}
      </div>
      {/* Tab bar */}
      <div role="tablist" ref={tabListRef} className="flex gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 overflow-x-auto">
        {tabs.map((t, idx) => (
          <button key={t.id}
            id={`${t.id}-tab`}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`${t.id}-panel`}
            tabIndex={activeTab === t.id ? 0 : -1}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKey(e, idx)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-[#082C6B] text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}>
            <span>{t.icon}</span><span className="hidden sm:inline">{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: KRI Monitor ── */}
      {activeTab === 'kri' && (
        <div role="tabpanel" id="kri-panel" aria-labelledby="kri-tab" className="space-y-4">
          {kriAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 font-semibold">
                {isAr ? `${kriAlerts.length} مؤشر في مستوى الإنذار` : `${kriAlerts.length} KRI${kriAlerts.length > 1 ? 's' : ''} in ALERT status`}: {kriAlerts.map(d => isAr ? d.labelAr : d.label).join(', ')}
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {KRI_DEFS.map(def => {
              const raw = kriValues[def.id] ?? '';
              const val = parseFloat(raw);
              const status = isNaN(val) ? null : kriStatus(def, val);
              return (
                <div key={def.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-slate-800">{isAr ? def.labelAr : def.label}</p>
                        {status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                            {isAr ? STATUS_LABEL[status].ar : STATUS_LABEL[status].en}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? def.descAr : def.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-[10px] text-slate-400">
                          {isAr ? 'إنذار:' : 'Alert:'} ≥{def.higherIsBetter ? `below ${def.red}` : def.red}{def.unit} · {isAr ? 'مراقبة:' : 'Watch:'} {def.higherIsBetter ? `below ${def.amber}` : `>${def.amber}`}{def.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="number" value={raw} onChange={e => updateKri(def.id, e.target.value)}
                        placeholder="—" className="w-20 text-sm font-bold text-center border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#082C6B]"
                        style={{ borderColor: status ? (status === 'green' ? '#10b981' : status === 'amber' ? '#d97706' : '#ef4444') : '#e5e7eb' }} />
                      <span className="text-xs text-slate-400">{isAr ? def.unitAr : def.unit}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {!isNaN(val) && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${Math.min(100, def.higherIsBetter ? val : Math.max(0, 100 - ((val / (def.red * 1.5)) * 100)))}%`,
                          background: status === 'green' ? '#10b981' : status === 'amber' ? '#d97706' : '#ef4444',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: Risk Register ── */}
      {activeTab === 'register' && (
        <div role="tabpanel" id="register-panel" aria-labelledby="register-tab" className="space-y-3">
          {/* Summary */}
          {risks.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: isAr ? 'إجمالي المخاطر' : 'Total Risks', value: risks.length, color: '#082C6B' },
                { label: isAr ? 'حرجة' : 'Critical', value: criticalRisks.length, color: '#dc2626' },
                { label: isAr ? 'مرتفعة' : 'High', value: highRisks.length, color: '#d97706' },
                { label: isAr ? 'متأخرة' : 'Overdue', value: overdueRisks.length, color: overdueRisks.length > 0 ? '#dc2626' : '#059669' },
              ].map(c => (
                <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                  <p className="text-[11px] text-slate-500">{c.label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {risks.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{isAr ? 'أضف أول خطر باستخدام الزر أدناه، أو حمّل نموذج CSV من تبويب القوالب.' : 'Add your first risk using the button below, or download the CSV template from the Templates tab.'}</p>
            </div>
          )}

          {/* Risk rows */}
          <div className="space-y-2">
            {risks.sort((a, b) => riskScore(b) - riskScore(a)).map(risk => {
              const score = riskScore(risk);
              const level = riskLevel(score);
              const isOpen = expandedRisks.has(risk.id);
              const catMeta = RISK_CATEGORIES.find(c => c.id === risk.category);
              return (
                <div key={risk.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-2" style={{ borderColor: level.border }}>
                  <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={() => toggleExpand(risk.id)}>
                    <span className="text-lg shrink-0 mt-0.5">{catMeta?.icon ?? '⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: level.bg, color: level.color }}>{isAr ? riskLevel(score).labelAr : riskLevel(score).label} · {score}/25</span>
                        <span className="text-[10px] text-slate-400">{isAr ? catMeta?.labelAr : catMeta?.label}</span>
                        {risk.status === 'open' && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{isAr ? 'مفتوح' : 'OPEN'}</span>}
                        {risk.status === 'in-progress' && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">{isAr ? 'قيد التنفيذ' : 'IN PROGRESS'}</span>}
                        {risk.status === 'closed' && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">{isAr ? 'مغلق' : 'CLOSED'}</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{risk.description || (isAr ? '(وصف المخاطرة)' : '(Risk description)')}</p>
                      {risk.owner && <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'المسؤول:' : 'Owner:'} {risk.owner} {risk.dueDate ? `· ${isAr ? 'الموعد:' : 'Due:'} ${risk.dueDate}` : ''}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-slate-400">L×I</p>
                        <p className="text-lg font-black" style={{ color: level.color }}>{score}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeRisk(risk.id); }} className="text-slate-300 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'وصف المخاطرة' : 'Risk Description'}</label>
                        <textarea value={risk.description} onChange={e => updateRisk(risk.id, 'description', e.target.value)} rows={2} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#082C6B]" placeholder={isAr ? 'صف المخاطرة بوضوح' : 'Describe the risk clearly'} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'المحرّك / السبب الجذري' : 'Driver / Root Cause'}</label>
                        <textarea value={risk.driver} onChange={e => updateRisk(risk.id, 'driver', e.target.value)} rows={2} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#082C6B]" placeholder={isAr ? 'ما الذي يسبب هذه المخاطرة؟' : 'What causes this risk?'} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الفئة' : 'Category'}</label>
                        <select value={risk.category} onChange={e => updateRisk(risk.id, 'category', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          {RISK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {isAr ? c.labelAr : c.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'السرعة' : 'Velocity'}</label>
                        <select value={risk.velocity} onChange={e => updateRisk(risk.id, 'velocity', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          {(['slow','medium','fast'] as const).map(v => <option key={v} value={v}>{isAr ? VELOCITY_LABELS[v].ar : VELOCITY_LABELS[v].en}</option>)}
                        </select>
                      </div>
                      {/* L×I Sliders */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الاحتمالية (1–5)' : 'Likelihood (1–5)'}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1} max={5} value={risk.likelihood} onChange={e => updateRisk(risk.id, 'likelihood', parseInt(e.target.value))} className="flex-1" style={{ accentColor: level.color }} />
                          <span className="font-black text-lg w-6 text-center" style={{ color: level.color }}>{risk.likelihood}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الأثر (1–5)' : 'Impact (1–5)'}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1} max={5} value={risk.impact} onChange={e => updateRisk(risk.id, 'impact', parseInt(e.target.value))} className="flex-1" style={{ accentColor: level.color }} />
                          <span className="font-black text-lg w-6 text-center" style={{ color: level.color }}>{risk.impact}</span>
                        </div>
                      </div>
                      <div className="col-span-full space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'إجراء التخفيف' : 'Mitigation Action'}</label>
                        <textarea value={risk.mitigationAction} onChange={e => updateRisk(risk.id, 'mitigationAction', e.target.value)} rows={2} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#082C6B]" placeholder={isAr ? 'ما الإجراء لتقليل هذه المخاطرة؟' : 'What action will reduce this risk?'} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'المسؤول' : 'Owner'}</label>
                        <input value={risk.owner} onChange={e => updateRisk(risk.id, 'owner', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" placeholder={isAr ? 'الاسم / المنصب' : 'Name / Title'} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الموعد النهائي' : 'Due Date'}</label>
                        <input type="date" value={risk.dueDate} onChange={e => updateRisk(risk.id, 'dueDate', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B]" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</label>
                        <select value={risk.status} onChange={e => updateRisk(risk.id, 'status', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="open">{isAr ? 'مفتوح' : 'Open'}</option>
                          <option value="in-progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                          <option value="closed">{isAr ? 'مغلق' : 'Closed'}</option>
                          <option value="accepted">{isAr ? 'مقبول' : 'Accepted'}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{isAr ? 'حالة التخفيف' : 'Mitigation Status'}</label>
                        <select value={risk.mitigationStatus} onChange={e => updateRisk(risk.id, 'mitigationStatus', e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#082C6B] bg-white">
                          <option value="not-started">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
                          <option value="in-progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                          <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                        </select>
                      </div>
                      {/* Residual risk */}
                      <div className="col-span-full border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{isAr ? 'المخاطرة المتبقية (بعد التخفيف)' : 'Residual Risk (After Mitigation)'}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400">{isAr ? 'الاحتمالية المتبقية' : 'Residual Likelihood'}</label>
                            <div className="flex items-center gap-2 mt-1">
                              <input type="range" min={1} max={5} value={risk.residualLikelihood} onChange={e => updateRisk(risk.id, 'residualLikelihood', parseInt(e.target.value))} className="flex-1" style={{ accentColor: '#059669' }} />
                              <span className="font-bold text-emerald-600 w-4">{risk.residualLikelihood}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">{isAr ? 'الأثر المتبقي' : 'Residual Impact'}</label>
                            <div className="flex items-center gap-2 mt-1">
                              <input type="range" min={1} max={5} value={risk.residualImpact} onChange={e => updateRisk(risk.id, 'residualImpact', parseInt(e.target.value))} className="flex-1" style={{ accentColor: '#059669' }} />
                              <span className="font-bold text-emerald-600 w-4">{risk.residualImpact}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500">{isAr ? 'الدرجة المتبقية:' : 'Residual Score:'}</span>
                          <span className="font-black text-base" style={{ color: riskLevel(residualScore(risk)).color }}>{residualScore(risk)}/25 ({isAr ? riskLevel(residualScore(risk)).labelAr : riskLevel(residualScore(risk)).label})</span>
                          <span className="text-xs text-emerald-600 font-semibold">↓ {isAr ? 'تخفيض' : 'reduction'}: {Math.max(0, score - residualScore(risk))} {isAr ? 'نقطة' : 'pts'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={addRisk} className="flex items-center gap-2 text-sm text-[#082C6B] font-semibold border border-[#082C6B] rounded-xl px-4 py-2 hover:bg-[#082C6B]/5 transition-colors">
              <Plus className="w-4 h-4" />{isAr ? 'إضافة مخاطرة' : 'Add Risk'}
            </button>
            {/* CSV bulk-import (Task #358) */}
            <input
              ref={importFileRef}
              type="file"
              accept=".csv"
              aria-label={isAr ? 'استيراد ملف CSV للمخاطر' : 'Import risks CSV file'}
              className="hidden"
              onChange={handleRiskCsvImport}
            />
            <button
              onClick={() => importFileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-emerald-700 font-semibold border border-emerald-300 rounded-xl px-4 py-2 hover:bg-emerald-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />{isAr ? 'استيراد CSV' : 'Import CSV'}
            </button>
          </div>
          {riskImportLog && (
            <div className={`flex items-center justify-between gap-2 text-xs rounded-xl px-3 py-2 ${riskImportLog.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <span>{riskImportLog}</span>
              <button onClick={() => setRiskImportLog(null)} className="opacity-60 hover:opacity-100 font-bold">✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Heat Map ── */}
      {activeTab === 'heatmap' && (
        <div role="tabpanel" id="heatmap-panel" aria-labelledby="heatmap-tab" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-1">{isAr ? 'خريطة حرارة المخاطر (5×5)' : 'Risk Heat Map (5×5)'}</h3>
            <p className="text-[11px] text-slate-400 mb-4">{isAr ? 'المحور الأفقي = الأثر، المحور الرأسي = الاحتمالية. انقر على خلية لتصفية السجل.' : 'X-axis = Impact · Y-axis = Likelihood. Click a cell to filter the register.'}</p>

            {/* Heat map grid */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-[320px]">
                {/* Impact axis label */}
                <div className="flex items-center gap-2 mb-2 ml-10">
                  <p className="text-[11px] font-bold text-slate-500 flex-1 text-center">{isAr ? '← الأثر (1–5) →' : '← Impact (1–5) →'}</p>
                </div>
                <div className="flex">
                  {/* Likelihood axis label */}
                  <div className="flex flex-col items-center justify-center w-8 shrink-0">
                    <p className="text-[11px] font-bold text-slate-500" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                  </div>
                  {/* Grid */}
                  <div className="flex-1">
                    {/* Column headers */}
                    <div className="grid grid-cols-5 mb-1">
                      {[1,2,3,4,5].map(i => <div key={i} className="text-center text-[11px] font-bold text-slate-400">{i}</div>)}
                    </div>
                    {[5,4,3,2,1].map(l => (
                      <div key={l} className="grid grid-cols-5 gap-1 mb-1">
                        {[1,2,3,4,5].map(i => {
                          const score = l * i;
                          const cellRisks = risks.filter(r => r.likelihood === l && r.impact === i);
                          const bg = score >= 20 ? '#fca5a5' : score >= 12 ? '#fcd34d' : score >= 6 ? '#fef08a' : '#bbf7d0';
                          const isSelected = heatFilter?.l === l && heatFilter?.i === i;
                          return (
                            <div key={i} onClick={() => setHeatFilter(isSelected ? null : { l, i })}
                              className={`h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${isSelected ? 'border-[#082C6B] shadow-md scale-105' : 'border-transparent hover:border-slate-300'}`}
                              style={{ background: bg }}>
                              <span className="text-[10px] font-black text-slate-600">{score}</span>
                              {cellRisks.length > 0 && (
                                <span className="text-[9px] font-bold bg-[#082C6B] text-white rounded-full w-4 h-4 flex items-center justify-center mt-0.5">{cellRisks.length}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {/* Row labels */}
                    <div className="flex justify-between mt-1 px-0.5">
                      {[1,2,3,4,5].map(n => <span key={n} className="text-[11px] text-slate-400 flex-1 text-center">{n}</span>)}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex gap-3 mt-3 flex-wrap">
                  {[{ label: isAr ? 'حرج (20–25)' : 'Critical (20-25)', bg: '#fca5a5' }, { label: isAr ? 'مرتفع (12–19)' : 'High (12-19)', bg: '#fcd34d' }, { label: isAr ? 'متوسط (6–11)' : 'Medium (6-11)', bg: '#fef08a' }, { label: isAr ? 'منخفض (1–5)' : 'Low (1-5)', bg: '#bbf7d0' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <div className="w-4 h-4 rounded" style={{ background: l.bg }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtered risks */}
            {heatFilter && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-600 mb-2">
                  {isAr ? `مخاطر في الخلية L${heatFilter.l}×I${heatFilter.i} (الدرجة: ${heatFilter.l * heatFilter.i}):` : `Risks at L${heatFilter.l}×I${heatFilter.i} (score: ${heatFilter.l * heatFilter.i}):`}
                </p>
                {risks.filter(r => r.likelihood === heatFilter.l && r.impact === heatFilter.i).length === 0
                  ? <p className="text-xs text-slate-400">{isAr ? 'لا توجد مخاطر في هذه الخلية.' : 'No risks in this cell.'}</p>
                  : risks.filter(r => r.likelihood === heatFilter.l && r.impact === heatFilter.i).map(r => (
                    <div key={r.id} className="text-xs text-slate-700 py-1 border-b border-slate-50 last:border-0">
                      <span className="font-semibold">{r.description || '(untitled)'}</span>
                      {r.owner && <span className="text-slate-400 ml-2">— {r.owner}</span>}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Mitigation Plans ── */}
      {activeTab === 'mitigation' && (
        <div role="tabpanel" id="mitigation-panel" aria-labelledby="mitigation-tab" className="space-y-3">
          {risks.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">{isAr ? 'أضف مخاطر في سجل المخاطر أولاً' : 'Add risks in the Risk Register first'}</p>
            </div>
          ) : (
            <>
              {overdueRisks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-semibold">
                    {isAr ? `${overdueRisks.length} إجراء تخفيف متأخر` : `${overdueRisks.length} overdue mitigation action${overdueRisks.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              {risks.sort((a, b) => riskScore(b) - riskScore(a)).map(risk => {
                const score = riskScore(risk);
                const level = riskLevel(score);
                const isOverdue = risk.dueDate && new Date(risk.dueDate) < new Date() && risk.mitigationStatus !== 'completed';
                const catMeta = RISK_CATEGORIES.find(c => c.id === risk.category);
                return (
                  <div key={risk.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{catMeta?.icon ?? '⚠️'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: level.bg, color: level.color }}>{isAr ? level.labelAr : level.label} {score}/25</span>
                          {isOverdue && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{isAr ? 'متأخر!' : 'OVERDUE!'}</span>}
                          {risk.mitigationStatus === 'completed' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" />{isAr ? 'مكتمل' : 'Complete'}</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-800 mt-1">{risk.description || (isAr ? '(وصف المخاطرة)' : '(Risk description)')}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-600"><span className="font-semibold">{isAr ? 'الإجراء:' : 'Action:'}</span> {risk.mitigationAction || <span className="text-slate-400 italic">{isAr ? 'لم يُحدَّد بعد' : 'Not defined yet'}</span>}</p>
                          <div className="flex gap-4 text-xs text-slate-500">
                            {risk.owner && <span><span className="font-semibold">{isAr ? 'المسؤول:' : 'Owner:'}</span> {risk.owner}</span>}
                            {risk.dueDate && <span className={isOverdue ? 'text-red-600 font-bold' : ''}><span className="font-semibold">{isAr ? 'الموعد:' : 'Due:'}</span> {risk.dueDate}</span>}
                          </div>
                          {/* Mitigation progress selector */}
                          <div className="flex gap-2 mt-2">
                            {(['not-started', 'in-progress', 'completed'] as MitigationStatus[]).map(s => (
                              <button key={s} onClick={() => updateRisk(risk.id, 'mitigationStatus', s)}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${risk.mitigationStatus === s ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                {s === 'not-started' ? (isAr ? 'لم يبدأ' : 'Not Started') : s === 'in-progress' ? (isAr ? 'قيد التنفيذ' : 'In Progress') : (isAr ? 'مكتمل' : 'Completed')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right hidden sm:block">
                        <p className="text-[10px] text-slate-400">{isAr ? 'متبقي' : 'Residual'}</p>
                        <p className="text-lg font-black" style={{ color: riskLevel(residualScore(risk)).color }}>{residualScore(risk)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── TAB 5: Templates ── */}
      {activeTab === 'templates' && (
        <div role="tabpanel" id="templates-panel" aria-labelledby="templates-tab" className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'قوالب متوافقة مع ISO 31000 وISO 22301 جاهزة للتحميل والتخصيص.' : 'ISO 31000 and ISO 22301-aligned templates ready to download and customise.'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RISK_TEMPLATES.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{isAr ? t.labelAr : t.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? t.descAr : t.desc}</p>
                  <button onClick={() => { t.fn(); toast.success(isAr ? 'جاري التحميل…' : 'Downloading…'); }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-[#082C6B] font-semibold hover:opacity-80">
                    <FileDown className="w-3.5 h-3.5" />{isAr ? 'تحميل' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: Supplier Alert Config ── */}
      {activeTab === 'alert-config' && (
        <div role="tabpanel" id="alert-config-panel" aria-labelledby="alert-config-tab" className="space-y-4">
          {/* Export PDF button — hidden when printing */}
          <div className="flex justify-end print-hide">
            <button
              onClick={() => printZone('alert-config')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#082C6B] text-white px-3 py-1.5 rounded-xl hover:bg-[#082C6B]/90 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              {isAr ? 'تصدير PDF' : 'Export PDF'}
            </button>
          </div>

          {/* Print zone — wraps all visible content */}
          <div className="print-zone-alert-config bg-white border border-slate-200 rounded-2xl shadow-sm">

            {/* Print-only header */}
            <div className="hidden alert-cfg-print-header px-5 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">{isAr ? 'إعداد تنبيهات الموردين' : 'Supplier Alert Configuration'}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'حدود تشغيل تنبيهات أداء الموردين' : 'Threshold values that trigger supplier performance alerts'}</p>
            </div>

            {/* Card header — visible on screen */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 print-hide">
              <h3 className="font-bold text-slate-800 text-sm">{isAr ? 'إعداد تنبيهات الموردين' : 'Supplier Alert Configuration'}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? 'عيّن حدود التنبيه لكل شريحة من شرائح الموردين' : 'Set alert thresholds for each supplier tier. Values outside these bounds trigger an alert.'}</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto px-5 py-4">
              <table className="w-full border-collapse text-sm" aria-label={isAr ? 'إعداد تنبيهات الموردين' : 'Supplier alert thresholds by tier'}>
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="text-left py-2 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">
                      {isAr ? 'الشريحة' : 'Tier'}
                    </th>
                    {ALERT_COLS.map(col => (
                      <th key={col.field} scope="col" className="text-center py-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div>{isAr ? col.labelAr : col.label}</div>
                        <div className="text-[10px] font-normal text-slate-400 normal-case tracking-normal mt-0.5">
                          ({isAr ? col.unitAr : col.unit})
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALERT_TIERS.map((tier, tierIdx) => (
                    <tr key={tier.label} className="border-b border-slate-100 last:border-0">
                      <th scope="row" className="py-3 pr-4 text-left font-normal">
                        <span className="text-xs font-bold" style={{ color: tier.color }}>
                          {isAr ? tier.labelAr : tier.label}
                        </span>
                      </th>
                      {ALERT_COLS.map(col => {
                        const val = alertCfg[tierIdx]?.[col.field] ?? '';
                        const tierName = isAr ? tier.labelAr : tier.label;
                        const colName  = isAr ? col.labelAr : col.label;
                        const unitName = isAr ? col.unitAr   : col.unit;
                        return (
                          <td key={col.field} className="py-3 px-3">
                            {/*
                             * Print-safe number cell:
                             * – <input> is shown on screen for editing.
                             * – <span class="alert-cfg-val"> mirrors the live value.
                             * – In @media print inside .print-zone-alert-config the CSS
                             *   hides the input (opacity:0) and shows the span, so
                             *   Firefox and older Safari always render the number.
                             */}
                            <div className="relative inline-flex items-center justify-center w-full">
                              <input
                                type="number"
                                min={col.min}
                                max={col.max}
                                value={val}
                                onChange={e => updateAlert(tierIdx, col.field, e.target.value)}
                                aria-label={`${tierName} — ${colName} (${unitName})`}
                                className="alert-cfg-input w-full text-center text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#082C6B] focus:border-[#082C6B]"
                              />
                              {/* Print-only value overlay — hidden on screen via CSS */}
                              <span
                                className="alert-cfg-val absolute inset-0 flex items-center justify-center text-sm font-bold"
                                aria-hidden="true"
                              >
                                {val || '—'}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="px-5 pb-4 flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAr
                  ? 'يتم تشغيل التنبيه عندما يكون الأداء الفعلي أقل من حدّ الشريحة المقابلة.'
                  : 'An alert fires when actual supplier performance falls below the threshold for its tier.'}
              </p>
              <button
                onClick={resetAlerts}
                className="print-hide flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 whitespace-nowrap transition-colors"
              >
                {isAr ? 'إعادة التعيين' : 'Reset to defaults'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: AI Risk Brief ── */}
      {activeTab === 'ai' && (
        <div role="tabpanel" id="ai-panel" aria-labelledby="ai-tab">
        <AIPlanPanel
          loading={aiPlan.loading} result={aiPlan.result} error={aiPlan.error}
          onGenerate={aiPlan.generate} onReset={aiPlan.reset}
          savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
          rateLimited={aiPlan.rateLimited}
          retryAfterSeconds={aiPlan.retryAfterSeconds}
          saveError={aiPlan.saveError}
          onDismissSaveError={aiPlan.dismissSaveError}
          buttonLabel={isAr ? 'توليد تقرير المخاطر ✨' : 'Generate Risk Assessment ✨'}
          isAr={isAr} toolKey="risk-register"
          disabled={risks.length === 0 && !Object.values(kriValues).some(v => v)}
        />
        </div>
      )}
    </div>
  );
}
