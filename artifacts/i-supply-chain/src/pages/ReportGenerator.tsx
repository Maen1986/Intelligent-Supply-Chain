import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { API_BASE } from '@/lib/apiBase';
import { MATURITY_DRAFT_KEY } from './Maturity';
import {
  FileText, Sparkles, Loader2, Download, ChevronRight, ChevronLeft,
  Building2, Users2, BarChart3, AlertCircle, CheckCircle2, RotateCcw,
  Target, TrendingUp, Calendar, BookOpen,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */

interface SegmentScore { id: string; title: string; score: number; level: string; gccAvg?: number; globalAvg?: number; bestClass?: number; }
interface RemedyItem   { segmentTitle: string; action: string; framework?: string; measurableTarget?: string; effort?: string; }
interface Remedies     { executiveSummary?: string; days30?: RemedyItem[]; days60?: RemedyItem[]; days90?: RemedyItem[]; estimatedImpact?: string; }

interface MaturitySnapshot {
  overallScore:   number;
  overallLevel:   string;
  segmentScores:  SegmentScore[];
  remedies?:      Remedies;
  intakeData?:    { industry: string; companySize: string };
}

interface ReportData {
  reportTitle:    string;
  reportSubtitle: string;
  executiveSummary:       { headline: string; body: string };
  companyContext:         { headline: string; body: string };
  maturityAnalysis:       { headline: string; body: string; keyStrengths: string[]; criticalGaps: string[]; benchmarkInsight: string };
  gapAnalysis:            { headline: string; body: string; priorityGaps: Array<{ rank: number; area: string; currentState: string; targetState: string; rootCause: string; businessImpact: string; interdependencies: string }> };
  strategicRecommendations: Array<{ title: string; priority: string; description: string; framework: string; timeframe: string; expectedOutcome: string; kpis: string[]; implementationSteps: string[] }>;
  implementationRoadmap:  { headline: string; overview: string; phase1: PhaseData; phase2: PhaseData; phase3: PhaseData };
  investmentProjection:   { headline: string; body: string; scenarios: Array<{ name: string; assumption: string; year1SavingsRange: string; keyDrivers: string[]; roi: string }> };
  conclusion:             { headline: string; body: string; immediateNextSteps: string[] };
}

interface PhaseData { title: string; objective: string; activities: string[]; milestones: string[]; resources: string; risks: string[]; }

type Phase = 'form' | 'generating' | 'ready';

/* ═══════════════════════════════════════════════════════════════════════════
   PRINT LAYOUT
═══════════════════════════════════════════════════════════════════════════ */

function Section({ title, children, breakBefore = true }: { title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <div style={{ breakBefore: breakBefore ? 'page' : 'auto', pageBreakBefore: breakBefore ? 'always' : 'auto' } as React.CSSProperties}>
      <div style={{ borderBottom: '3px solid #082C6B', marginBottom: '16px', paddingBottom: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#082C6B', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PrintP({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: '11px', lineHeight: '1.7', color: '#1a1a1a', margin: '0 0 10px', ...style }}>{children}</p>;
}

function BulletList({ items, color = '#082C6B' }: { items: string[]; color?: string }) {
  return (
    <ul style={{ margin: '0 0 10px', paddingLeft: '18px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '11px', lineHeight: '1.6', color: '#1a1a1a', marginBottom: '4px' }}>
          <span style={{ color }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PrintCard({ children, accent = '#082C6B' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ border: `1px solid ${accent}30`, borderLeft: `4px solid ${accent}`, borderRadius: '4px', padding: '12px 16px', marginBottom: '14px', background: `${accent}06` }}>
      {children}
    </div>
  );
}

function ReportPrintLayout({ report, contactInfo, maturity, generatedAt }: {
  report: ReportData;
  contactInfo: { name: string; company: string; industry: string; companySize: string };
  maturity: MaturitySnapshot | null;
  generatedAt: string;
}) {
  const date = new Date(generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="report-print-root" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', color: '#1a1a1a' }}>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; }
          @page { size: A4; margin: 15mm 18mm; }
          body > *:not(#report-print-root) { display: none !important; }
          #report-print-root { display: block !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          #report-print-root { display: none; }
        }
      `}</style>

      {/* ── Cover Page ── */}
      <div style={{ minHeight: '270mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', breakAfter: 'page', pageBreakAfter: 'always' } as React.CSSProperties}>
        <div style={{ background: '#082C6B', color: '#fff', padding: '40px 48px 32px', borderRadius: '0 0 8px 8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#C9A84C', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>I Supply Chain · ISC</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>Ma'in Alhaqash MCIPS · CPSM · MSc · MIPP</div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.2 }}>{report.reportTitle}</h1>
          <p style={{ fontSize: '15px', color: '#C9A84C', fontWeight: 600, margin: 0 }}>{report.reportSubtitle}</p>
        </div>

        <div style={{ padding: '40px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Prepared For</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#082C6B' }}>{contactInfo.name}</div>
              <div style={{ fontSize: '13px', color: '#444' }}>{contactInfo.company}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{contactInfo.industry} · {contactInfo.companySize}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Report Details</div>
              <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px' }}>Date: {date}</div>
              <div style={{ fontSize: '12px', color: '#444', marginBottom: '4px' }}>Package: SME Growth Programme</div>
              <div style={{ fontSize: '12px', color: '#444' }}>Confidential — For Client Use Only</div>
            </div>
          </div>

          {maturity && (
            <div style={{ background: '#f5f8ff', border: '1px solid #dde4f0', borderRadius: '6px', padding: '20px 24px', marginBottom: '32px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Assessment Summary</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#082C6B' }}>{maturity.overallScore.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>Overall Score / 5.0</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#082C6B', marginBottom: '8px' }}>Maturity Level: {maturity.overallLevel}</div>
                  <div style={{ fontSize: '11px', color: '#444' }}>{maturity.segmentScores.length} segments assessed · {maturity.intakeData?.industry ?? 'General'} sector</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: '2px solid #C9A84C', paddingTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#888' }}>
              This report was prepared exclusively for {contactInfo.company} by Ma'in Alhaqash MCIPS · CPSM · MSc · MIPP, I Supply Chain.
              All content is confidential and proprietary. © {new Date().getFullYear()} I Supply Chain. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <div style={{ breakAfter: 'page', pageBreakAfter: 'always', padding: '0 0 40px' } as React.CSSProperties}>
        <Section title="Table of Contents" breakBefore={false}>
          {[
            '1. Executive Summary',
            '2. Company & Industry Context',
            '3. Maturity Assessment Analysis',
            '4. Gap Analysis & Root Cause Assessment',
            '5. Strategic Recommendations',
            '6. 6-Month Implementation Roadmap',
            '7. Investment & Return Projection',
            '8. Conclusion & Next Steps',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #dde4f0' }}>
              <span style={{ fontSize: '12px', color: '#082C6B', fontWeight: 600 }}>{item}</span>
            </div>
          ))}
        </Section>
      </div>

      {/* ── 1. Executive Summary ── */}
      <Section title={`1. ${report.executiveSummary.headline}`}>
        {report.executiveSummary.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
      </Section>

      {/* ── 2. Company Context ── */}
      <Section title={`2. ${report.companyContext.headline}`}>
        {report.companyContext.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
      </Section>

      {/* ── 3. Maturity Analysis ── */}
      <Section title={`3. ${report.maturityAnalysis.headline}`}>
        {maturity && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {maturity.segmentScores.slice(0, 8).map((s) => (
              <div key={s.id} style={{ background: '#f5f8ff', border: '1px solid #dde4f0', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#082C6B' }}>{s.score.toFixed(1)}</div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{s.title}</div>
                <div style={{ fontSize: '9px', color: '#888' }}>{s.level}</div>
              </div>
            ))}
          </div>
        )}
        {report.maturityAnalysis.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <PrintCard accent="#22C55E">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', marginBottom: '8px' }}>Key Strengths</div>
            <BulletList items={report.maturityAnalysis.keyStrengths} color="#16A34A" />
          </PrintCard>
          <PrintCard accent="#EF4444">
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>Critical Gaps</div>
            <BulletList items={report.maturityAnalysis.criticalGaps} color="#DC2626" />
          </PrintCard>
        </div>
        <PrintCard>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#082C6B', marginBottom: '6px' }}>Benchmark Insight</div>
          {report.maturityAnalysis.benchmarkInsight.split('\n\n').map((para, i) => (
            <PrintP key={i} style={{ margin: '0 0 6px' }}>{para}</PrintP>
          ))}
        </PrintCard>
      </Section>

      {/* ── 4. Gap Analysis ── */}
      <Section title={`4. ${report.gapAnalysis.headline}`}>
        {report.gapAnalysis.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
        {report.gapAnalysis.priorityGaps.map((gap, i) => (
          <PrintCard key={i} accent="#F97316">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{gap.rank}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#082C6B' }}>{gap.area}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
              <div><span style={{ fontWeight: 700, color: '#444' }}>Current: </span>{gap.currentState}</div>
              <div><span style={{ fontWeight: 700, color: '#444' }}>Target: </span>{gap.targetState}</div>
              <div><span style={{ fontWeight: 700, color: '#444' }}>Root Cause: </span>{gap.rootCause}</div>
              <div><span style={{ fontWeight: 700, color: '#C9A84C' }}>Impact: </span>{gap.businessImpact}</div>
            </div>
            {gap.interdependencies && (
              <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', borderTop: '1px solid #dde4f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 700 }}>Interdependencies: </span>{gap.interdependencies}
              </div>
            )}
          </PrintCard>
        ))}
      </Section>

      {/* ── 5. Strategic Recommendations ── */}
      <Section title="5. Strategic Recommendations">
        {report.strategicRecommendations.map((rec, i) => (
          <div key={i} style={{ marginBottom: '20px', breakInside: 'avoid', pageBreakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#082C6B', color: '#fff', padding: '10px 16px', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Recommendation {i + 1}: {rec.title}</span>
              <span style={{ fontSize: '10px', background: '#C9A84C', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{rec.priority}</span>
            </div>
            <div style={{ border: '1px solid #dde4f0', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '12px 16px' }}>
              {rec.description.split('\n\n').map((para, pi) => <PrintP key={pi}>{para}</PrintP>)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>Framework</div>
                  <div style={{ fontSize: '10px', color: '#444', background: '#f5f8ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dde4f0' }}>{rec.framework}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>Expected Outcome</div>
                  <div style={{ fontSize: '10px', color: '#444' }}>{rec.expectedOutcome}</div>
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>KPIs to Track</div>
                <BulletList items={rec.kpis} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>Implementation Steps</div>
                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                  {rec.implementationSteps.map((step, si) => (
                    <li key={si} style={{ fontSize: '10px', color: '#444', marginBottom: '3px' }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ))}
      </Section>

      {/* ── 6. Implementation Roadmap ── */}
      <Section title={`6. ${report.implementationRoadmap.headline}`}>
        {report.implementationRoadmap.overview.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
        {([
          { data: report.implementationRoadmap.phase1, color: '#EF4444' },
          { data: report.implementationRoadmap.phase2, color: '#F97316' },
          { data: report.implementationRoadmap.phase3, color: '#0B3D91' },
        ] as { data: PhaseData; color: string }[]).map(({ data, color }, pi) => (
          <PrintCard key={pi} accent={color}>
            <div style={{ fontSize: '12px', fontWeight: 800, color, marginBottom: '6px' }}>{data.title}</div>
            <PrintP style={{ margin: '0 0 8px' }}><strong>Objective:</strong> {data.objective}</PrintP>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>Activities</div>
                <BulletList items={data.activities} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', marginBottom: '4px' }}>Milestones</div>
                <BulletList items={data.milestones} color={color} />
              </div>
            </div>
            {data.risks?.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>Risks to Manage</div>
                <BulletList items={data.risks} color="#DC2626" />
              </div>
            )}
          </PrintCard>
        ))}
      </Section>

      {/* ── 7. Investment & Return Projection ── */}
      <Section title={`7. ${report.investmentProjection.headline}`}>
        {report.investmentProjection.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
          {report.investmentProjection.scenarios.map((sc, i) => {
            const colors = ['#94A3B8', '#082C6B', '#C9A84C'];
            return (
              <div key={i} style={{ border: `2px solid ${colors[i]}`, borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: colors[i], color: '#fff', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>{sc.name}</div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: colors[i], textAlign: 'center', marginBottom: '6px' }}>{sc.year1SavingsRange}</div>
                  <div style={{ fontSize: '10px', color: '#082C6B', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>ROI: {sc.roi}</div>
                  <div style={{ fontSize: '10px', color: '#444', fontStyle: 'italic', marginBottom: '8px' }}>{sc.assumption}</div>
                  <BulletList items={sc.keyDrivers} color={colors[i]} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 8. Conclusion ── */}
      <Section title={`8. ${report.conclusion.headline}`}>
        {report.conclusion.body.split('\n\n').map((para, i) => (
          <PrintP key={i}>{para}</PrintP>
        ))}
        <PrintCard accent="#C9A84C">
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#C9A84C', marginBottom: '8px' }}>Immediate Next Steps — This Week</div>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            {report.conclusion.immediateNextSteps.map((step, i) => (
              <li key={i} style={{ fontSize: '11px', color: '#1a1a1a', marginBottom: '6px', fontWeight: 600 }}>{step}</li>
            ))}
          </ol>
        </PrintCard>
        <div style={{ marginTop: '32px', borderTop: '2px solid #082C6B', paddingTop: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#082C6B' }}>I Supply Chain — Ma'in Alhaqash MCIPS · CPSM · MSc · MIPP</div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>+966 549 479 722 · www.isupplychain.com</div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
            This report is confidential and prepared exclusively for {contactInfo.company}.
            © {new Date().getFullYear()} I Supply Chain. All Rights Reserved.
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export function ReportGenerator() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('form');
  const [error,  setError]  = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [generatedAt, setGeneratedAt] = useState('');

  /* ── Contact form state ── */
  const [name,        setName]        = useState(user?.fullName    ?? '');
  const [email,       setEmail]       = useState(user?.email       ?? '');
  const [company,     setCompany]     = useState(user?.company     ?? '');
  const [industry,    setIndustry]    = useState('');
  const [companySize, setCompanySize] = useState('');

  /* ── Maturity snapshot from localStorage ── */
  const [maturity, setMaturity] = useState<MaturitySnapshot | null>(null);
  const [maturityLoaded, setMaturityLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
      if (!raw) { setMaturityLoaded(true); return; }
      const draft = JSON.parse(raw) as { answers?: Record<string,number>; intakeData?: { industry: string; companySize: string } };
      if (draft.intakeData?.industry) setIndustry(draft.intakeData.industry);
      if (draft.intakeData?.companySize) setCompanySize(draft.intakeData.companySize);
      // We'll just store the intakeData for now - full scores computed server-side from answers isn't available client-side here
      // but we CAN read any remedies that were saved, and show a summary
    } catch { /* ignore */ }
    setMaturityLoaded(true);
  }, []);

  /* If user session loads after mount, pre-fill form */
  useEffect(() => {
    if (user) {
      if (!name)    setName(user.fullName  ?? '');
      if (!email)   setEmail(user.email   ?? '');
      if (!company) setCompany(user.company ?? '');
    }
  }, [user]);

  const canGenerate = name.trim() && company.trim() && industry.trim() && companySize.trim();

  const handleGenerate = async () => {
    setError(null);
    setPhase('generating');
    try {
      const resp = await fetch(`${API_BASE}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'sme_growth',
          contactInfo: { name: name.trim(), email: email.trim(), company: company.trim(), industry, companySize },
          maturityData: maturity ?? undefined,
          language: ar ? 'ar' : 'en',
        }),
      });
      if (resp.status === 401) {
        throw new Error('Please sign in again to generate your report');
      }
      if (!resp.ok) {
        const data = await resp.json() as { error?: string };
        throw new Error(data.error ?? `HTTP ${resp.status}`);
      }
      const data = await resp.json() as { ok: boolean; report: ReportData; generatedAt: string };
      if (!data.ok || !data.report) throw new Error('No report returned');
      setReport(data.report);
      setGeneratedAt(data.generatedAt);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setPhase('form');
    }
  };

  const handlePrint = () => window.print();

  const INDUSTRY_OPTIONS = [
    'Manufacturing', 'Energy & Oil', 'Government & Public Sector', 'Pharmaceutical',
    'Retail & FMCG', 'Logistics & Distribution', 'Marine & Port Operations',
    'Construction & EPC', 'Healthcare', 'Technology & ICT', 'Other',
  ];

  const SIZE_OPTIONS = [
    { value: 'sme_50_250',    label: 'SME — 50–250 employees' },
    { value: 'mid_250_1000',  label: 'Mid-Market — 250–1,000 employees' },
    { value: 'large_1000',    label: 'Large — 1,000–5,000 employees' },
    { value: 'enterprise',    label: 'Enterprise — 5,000+ employees' },
    { value: 'government',    label: 'Government / SOE' },
  ];

  return (
    <>
      {/* Screen UI — hidden when printing */}
      <div className="no-print w-full">
        {/* Hero */}
        <div className="bg-[#082C6B] text-white">
          <div className="container mx-auto px-4 py-14 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-accent font-bold text-sm uppercase tracking-widest">SME Growth Programme</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
              30-Page Supply Chain Strategy Report
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              A board-ready strategy report tailored to your organisation's actual data — executive summary, gap analysis, benchmarks, recommendations, and a 6-month implementation roadmap.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <AnimatePresence mode="wait">

            {/* ── FORM PHASE ── */}
            {phase === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {error && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Generation failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-primary text-lg">Your Details</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name *', value: name, setter: setName, placeholder: 'e.g. Ahmed Al-Rashidi' },
                      { label: 'Work Email', value: email, setter: setEmail, placeholder: 'you@company.com' },
                      { label: 'Company / Organisation *', value: company, setter: setCompany, placeholder: 'e.g. Saudi Logistics Co.' },
                    ].map(field => (
                      <div key={field.label} className={field.label.includes('Company') ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">{field.label}</label>
                        <input
                          value={field.value}
                          onChange={e => field.setter(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Industry & Size */}
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Users2 className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-primary text-lg">Organisation Profile</h2>
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Industry Sector *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRY_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => setIndustry(opt)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 text-left transition-all
                            ${industry === opt ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:border-primary/40'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-2">Organisation Size *</label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {SIZE_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setCompanySize(opt.value)}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 text-left transition-all
                            ${companySize === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:border-primary/40'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Maturity data note */}
                {maturityLoaded && (
                  <div className={`mb-6 rounded-xl border px-4 py-3.5 flex items-start gap-3 ${maturity ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                    {maturity
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      : <BarChart3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                    <div>
                      <p className={`font-semibold text-sm ${maturity ? 'text-green-700' : 'text-amber-700'}`}>
                        {maturity
                          ? `Maturity assessment data loaded (Score: ${maturity.overallScore.toFixed(1)}/5.0 — ${maturity.overallLevel})`
                          : 'No completed maturity assessment found'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {maturity
                          ? 'The report will be fully calibrated to your actual assessment results.'
                          : <>Complete the <Link href="/maturity" className="underline text-primary">Maturity Assessment</Link> first for a data-driven report, or generate a sector-calibrated report now.</>}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-muted rounded-2xl p-5 mb-8">
                  <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    What you'll receive
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {[
                      'Executive summary calibrated to your maturity score',
                      'GCC benchmark comparison across all segments',
                      'Root-cause gap analysis with SAR-quantified impact',
                      '5–7 strategic recommendations with named frameworks',
                      '6-month phased implementation roadmap',
                      'Investment scenarios with Year-1 SAR projections',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link href="/maturity">
                    <Button variant="outline" className="gap-2">
                      <ChevronLeft className="w-4 h-4" />
                      Back to Assessment
                    </Button>
                  </Link>
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 min-w-[200px]">
                    <Sparkles className="w-4 h-4" />
                    Generate My Report
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── GENERATING PHASE ── */}
            {phase === 'generating' && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Loader2 className="w-14 h-14 text-accent animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-extrabold text-primary mb-3">Generating Your Strategy Report</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Ma'in Alhaqash's AI engine is authoring your fully tailored 30-page report — analysing your maturity data, GCC benchmarks, and strategic options.
                </p>
                <div className="max-w-sm mx-auto space-y-3">
                  {[
                    'Analysing maturity scores vs GCC benchmarks…',
                    'Identifying root causes and capability gaps…',
                    'Authoring strategic recommendations…',
                    'Building 6-month implementation roadmap…',
                    'Projecting SAR investment scenarios…',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-8">This takes 30–60 seconds — please keep this tab open.</p>
              </motion.div>
            )}

            {/* ── READY PHASE ── */}
            {phase === 'ready' && report && (
              <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-700">Your strategy report is ready</p>
                    <p className="text-sm text-green-600 mt-0.5">
                      Click "Download PDF" to save your report. Your browser's print dialog will open — select "Save as PDF" as the destination.
                    </p>
                  </div>
                </div>

                {/* Report preview cards */}
                <div className="space-y-4 mb-8">
                  <div className="bg-[#082C6B] text-white rounded-2xl p-6">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Executive Summary</p>
                    <h2 className="text-lg font-extrabold mb-3">{report.executiveSummary.headline}</h2>
                    <p className="text-white/75 text-sm leading-relaxed line-clamp-4">
                      {report.executiveSummary.body.split('\n\n')[0]}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-border rounded-2xl p-5">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Strategic Recommendations</p>
                      <div className="space-y-2">
                        {report.strategicRecommendations.slice(0, 4).map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                            <p className="text-sm font-semibold text-foreground">{r.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-border rounded-2xl p-5">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Investment Scenarios</p>
                      <div className="space-y-2">
                        {report.investmentProjection.scenarios.map((sc, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{sc.name}</span>
                            <span className="text-sm font-bold text-primary">{sc.year1SavingsRange}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-5">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">6-Month Roadmap</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { data: report.implementationRoadmap.phase1, color: 'bg-red-100 text-red-700' },
                        { data: report.implementationRoadmap.phase2, color: 'bg-orange-100 text-orange-700' },
                        { data: report.implementationRoadmap.phase3, color: 'bg-blue-100 text-blue-700' },
                      ].map(({ data, color }, i) => (
                        <div key={i} className="text-center">
                          <p className={`text-xs font-bold rounded-full px-2 py-1 mb-2 ${color}`}>{data.title.split('—')[0].trim()}</p>
                          <p className="text-xs text-muted-foreground">{data.objective}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Button variant="outline" onClick={() => { setPhase('form'); setReport(null); }} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Regenerate
                  </Button>
                  <div className="flex gap-3">
                    <Link href="/consultant">
                      <Button variant="outline" className="gap-2 border-primary text-primary">
                        <Calendar className="w-4 h-4" />
                        Book Strategy Session
                      </Button>
                    </Link>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 px-8">
                      <Download className="w-5 h-5" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Print Layout — invisible on screen, renders on print */}
      {report && (
        <ReportPrintLayout
          report={report}
          contactInfo={{ name, company, industry, companySize }}
          maturity={maturity}
          generatedAt={generatedAt}
        />
      )}
    </>
  );
}
