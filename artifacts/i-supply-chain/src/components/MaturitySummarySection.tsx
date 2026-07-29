/**
 * MaturitySummarySection
 *
 * Print-ready (inline-styles only) bilingual (EN/AR) maturity summary component.
 * Used inside ReportPrintLayout in ReportGenerator.tsx.
 *
 * Renders:
 *  • Overall score + bilingual level badge
 *  • Static SVG radar chart (pure SVG, no Recharts — avoids JS dimension issue in print)
 *  • Top-3 weakest segments with GCC gap note
 *  • Coverage indicator (bilingual)
 *  • 30/60/90 roadmap compact 3-column table (bilingual + RTL)
 */

import React from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Shared types (kept local so this component has no circular imports)
───────────────────────────────────────────────────────────────────────────── */

export interface MSSSegmentScore {
  id: string;
  title: string;
  titleAr?: string;
  score: number;
  level: string;
  levelAr?: string;
  gccAvg?: number;
  bestClass?: number;
}

export interface MSSRemedyItem {
  segmentTitle: string;
  action: string;
  framework?: string;
  effort?: string;
}

export interface MSSRemedies {
  days30?: MSSRemedyItem[];
  days60?: MSSRemedyItem[];
  days90?: MSSRemedyItem[];
}

export interface MSSContext {
  overallScore: number;
  overallLevel: string;
  overallLevelAr?: string;
  segmentScores: MSSSegmentScore[];
  remedies?: MSSRemedies;
  coveragePct?: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Colour helpers — mirrors MATURITY_LEVELS in maturityScoring.ts
───────────────────────────────────────────────────────────────────────────── */

function levelColour(score: number): string {
  if (score >= 4.5) return '#0B3D91'; // Optimised
  if (score >= 3.5) return '#22C55E'; // Managed
  if (score >= 2.5) return '#EAB308'; // Defined
  if (score >= 1.5) return '#F97316'; // Aware
  return '#EF4444';                   // Reactive
}

/* ─────────────────────────────────────────────────────────────────────────────
   Static SVG Radar
───────────────────────────────────────────────────────────────────────────── */

interface RadarProps {
  segments: MSSSegmentScore[];
  size?: number;
  isAr?: boolean;
}

function StaticRadar({ segments, size = 200, isAr }: RadarProps) {
  const N = segments.length;
  if (N < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const R  = (size / 2) * 0.68; // inner polygon radius (leaves room for labels)
  const LR = (size / 2) * 0.90; // label radius

  const angleOf = (i: number) => (2 * Math.PI * i / N) - Math.PI / 2;

  const polar = (i: number, radius: number) => {
    const a = angleOf(i);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const toPoints = (radiusFn: (i: number) => number) =>
    segments.map((_, i) => {
      const p = polar(i, radiusFn(i));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  // Grid rings at 1/5, 2/5, 3/5, 4/5, 5/5 of R
  const gridRings = [1, 2, 3, 4, 5].map(lv => toPoints(() => (lv / 5) * R));

  // Score polygon
  const scorePoints = toPoints(i => (Math.max(0, Math.min(5, segments[i].score)) / 5) * R);

  // GCC polygon (use gccAvg if present, else 2.3 global default)
  const gccPoints = toPoints(i => ((segments[i].gccAvg ?? 2.3) / 5) * R);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden="true"
    >
      {/* Grid rings */}
      {gridRings.map((pts, lv) => (
        <polygon key={lv} points={pts} fill="none" stroke="#dde4f0" strokeWidth={lv === 4 ? 1 : 0.6} />
      ))}

      {/* Axes */}
      {segments.map((_, i) => {
        const p = polar(i, R);
        return (
          <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
            stroke="#dde4f0" strokeWidth="0.6" />
        );
      })}

      {/* GCC median */}
      <polygon points={gccPoints}
        fill="none"
        stroke="#C9A84C"
        strokeWidth={1}
        strokeDasharray="3,2"
        opacity={0.85}
      />

      {/* Score polygon */}
      <polygon points={scorePoints}
        fill="#082C6B"
        fillOpacity={0.22}
        stroke="#082C6B"
        strokeWidth={1.6}
      />

      {/* Score dots */}
      {segments.map((seg, i) => {
        const r = (Math.max(0, Math.min(5, seg.score)) / 5) * R;
        const p = polar(i, r);
        return (
          <circle key={i}
            cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5"
            fill="#082C6B" stroke="#fff" strokeWidth="0.8"
          />
        );
      })}

      {/* Labels */}
      {segments.map((seg, i) => {
        const lp = polar(i, LR);
        const label = (isAr ? (seg.titleAr ?? seg.title) : seg.title);
        const short = label.length > 9 ? label.slice(0, 7) + '…' : label;
        // Nudge anchor based on quadrant
        const angle = angleOf(i) * (180 / Math.PI);
        const anchor = angle > -20 && angle < 200 ? 'middle' : 'middle';
        return (
          <text key={i}
            x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            fontSize="7.5"
            fontWeight="600"
            fill="#082C6B"
            textAnchor={anchor}
            dominantBaseline="middle"
          >
            {short}
          </text>
        );
      })}

      {/* Legend dots */}
      <circle cx={cx - 22} cy={size - 10} r="3" fill="#082C6B" opacity={0.3} stroke="#082C6B" strokeWidth="1" />
      <text x={cx - 15} y={size - 10} fontSize="6.5" fill="#444" dominantBaseline="middle">
        {isAr ? 'نتيجتك' : 'Your Score'}
      </text>
      <circle cx={cx + 22} cy={size - 10} r="3" fill="#C9A84C" opacity={0} stroke="#C9A84C" strokeWidth="1" strokeDasharray="2,1" />
      <text x={cx + 29} y={size - 10} fontSize="6.5" fill="#444" dominantBaseline="middle">
        {isAr ? 'وسيط الخليج' : 'GCC Median'}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */

interface MaturitySummarySectionProps {
  maturity: MSSContext;
  isAr?: boolean;
}

export function MaturitySummarySection({ maturity, isAr = false }: MaturitySummarySectionProps) {
  const { overallScore, overallLevel, overallLevelAr, segmentScores, remedies, coveragePct } = maturity;

  // Top-3 weakest
  const weakest = [...segmentScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // 30/60/90 phases
  const phases = [
    {
      days: 30,
      label: isAr ? 'أول 30 يومًا' : 'Days 0–30',
      color: '#EF4444',
      bg: '#FEF2F2',
      items: remedies?.days30?.slice(0, 2) ?? [],
    },
    {
      days: 60,
      label: isAr ? '31–60 يومًا' : 'Days 31–60',
      color: '#F97316',
      bg: '#FFF7ED',
      items: remedies?.days60?.slice(0, 2) ?? [],
    },
    {
      days: 90,
      label: isAr ? '61–90 يومًا' : 'Days 61–90',
      color: '#0B3D91',
      bg: '#EFF6FF',
      items: remedies?.days90?.slice(0, 2) ?? [],
    },
  ];

  // Show roadmap whenever the remedies object is present, even if some phases are empty.
  // Empty phases render an explicit "No actions" placeholder rather than disappearing silently.
  const hasRoadmap = remedies != null && (
    Array.isArray(remedies.days30) || Array.isArray(remedies.days60) || Array.isArray(remedies.days90)
  );

  const levelColor = levelColour(overallScore);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Arial, sans-serif' }}
      data-testid="maturity-summary-section"
    >

      {/* ── Score header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        background: '#f5f8ff',
        border: '1px solid #dde4f0',
        borderRadius: '6px',
        padding: '14px 18px',
        marginBottom: '14px',
      }}>
        {/* Score circle */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: `3px solid ${levelColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#082C6B', lineHeight: 1 }}>
              {overallScore.toFixed(1)}
            </span>
            <span style={{ fontSize: '7px', color: '#888', lineHeight: 1 }}>/5.0</span>
          </div>
        </div>

        {/* Level + coverage */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: levelColor + '18',
            border: `1px solid ${levelColor}55`,
            color: levelColor,
            borderRadius: '100px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '6px',
          }}
            data-testid="mss-level-badge"
          >
            {isAr ? (overallLevelAr ?? overallLevel) : overallLevel}
          </div>

          <div style={{ fontSize: '10px', color: '#444' }}>
            <span style={{ fontWeight: 600 }}>{segmentScores.length}</span>
            {isAr ? ' مجالاً مُقيَّمًا' : ' segments assessed'}
            {coveragePct != null && (
              <>
                {' · '}
                <span style={{ fontWeight: 600, color: coveragePct >= 80 ? '#22C55E' : '#F97316' }}>
                  {coveragePct.toFixed(0)}%
                </span>
                {' '}
                {isAr ? 'تغطية المجالات الفرعية' : 'sub-segment coverage'}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column body: Radar | Weakest segments ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '16px',
        marginBottom: '14px',
        alignItems: 'start',
      }}>

        {/* Left: radar */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <StaticRadar segments={segmentScores} size={200} isAr={isAr} />
        </div>

        {/* Right: top-3 weakest */}
        <div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#082C6B',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            {isAr ? 'أولويات التحسين الثلاث' : 'Top 3 Improvement Priorities'}
          </div>

          {weakest.map((seg, rank) => {
            const gccGap = seg.gccAvg != null ? seg.score - seg.gccAvg : null;
            const bestGap = seg.bestClass != null ? seg.score - seg.bestClass : null;
            const col = levelColour(seg.score);
            return (
              <div key={seg.id} style={{
                border: `1px solid ${col}30`,
                borderLeft: `3px solid ${col}`,
                borderRadius: '4px',
                padding: '7px 10px',
                marginBottom: '8px',
                background: col + '08',
              }}
                data-testid={`mss-weak-segment-${rank}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: col, color: '#fff', fontSize: '9px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{rank + 1}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B' }}>
                      {isAr ? (seg.titleAr ?? seg.title) : seg.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: col }}>{seg.score.toFixed(2)}</span>
                </div>

                {/* Gap notes */}
                <div style={{ fontSize: '9px', color: '#666', marginTop: '3px', display: 'flex', gap: '10px' }}>
                  <span>
                    {isAr ? 'المستوى:' : 'Level:'}{' '}
                    <strong style={{ color: col }}>{isAr ? (seg.levelAr ?? seg.level) : seg.level}</strong>
                  </span>
                  {gccGap != null && (
                    <span>
                      {isAr ? 'فجوة الخليج:' : 'GCC gap:'}{' '}
                      <strong style={{ color: gccGap >= 0 ? '#22C55E' : '#EF4444' }}>
                        {gccGap >= 0 ? '+' : ''}{gccGap.toFixed(1)}
                      </strong>
                    </span>
                  )}
                  {bestGap != null && (
                    <span style={{ color: '#888' }}>
                      {isAr ? 'الهدف:' : 'To best-in-class:'}{' '}
                      <strong>{bestGap.toFixed(1)}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Coverage bar (if available) ── */}
      {coveragePct != null && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          padding: '8px 12px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
          data-testid="mss-coverage"
        >
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            {isAr ? 'تغطية المجالات الفرعية' : 'Sub-Segment Coverage'}
          </div>
          <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, coveragePct)}%`,
              background: coveragePct >= 80 ? '#22C55E' : coveragePct >= 50 ? '#F97316' : '#EF4444',
              borderRadius: '4px',
            }} />
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#082C6B', whiteSpace: 'nowrap' }}>
            {coveragePct.toFixed(0)}%
          </div>
        </div>
      )}

      {/* ── 30/60/90 Roadmap table ── */}
      {hasRoadmap && (
        <div data-testid="mss-roadmap">
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#082C6B',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
          }}>
            {isAr ? 'خارطة طريق 30 / 60 / 90 يومًا' : '30 / 60 / 90-Day Roadmap Snapshot'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {phases.map(phase => (
              <div key={phase.days} style={{
                background: phase.bg,
                border: `1px solid ${phase.color}30`,
                borderTop: `2px solid ${phase.color}`,
                borderRadius: '4px',
                padding: '8px',
              }}>
                {/* Phase header */}
                <div style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: phase.color,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {phase.label}
                </div>

                {/* Actions */}
                {phase.items.length === 0 ? (
                  <div style={{ fontSize: '9px', color: '#999', fontStyle: 'italic' }}>
                    {isAr ? 'لا توجد إجراءات' : 'No actions'}
                  </div>
                ) : (
                  phase.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: phase.color, color: '#fff',
                          fontSize: '7px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: '1px',
                        }}>{idx + 1}</span>
                        <span style={{ fontSize: '8.5px', color: '#1a1a1a', lineHeight: 1.4, flex: 1 }}>
                          {item.action}
                        </span>
                      </div>
                      {item.framework && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '2px',
                          marginInlineStart: '16px',
                          fontSize: '7px',
                          background: '#082C6B18',
                          color: '#082C6B',
                          borderRadius: '3px',
                          padding: '1px 4px',
                          fontWeight: 600,
                        }}>
                          {item.framework}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
