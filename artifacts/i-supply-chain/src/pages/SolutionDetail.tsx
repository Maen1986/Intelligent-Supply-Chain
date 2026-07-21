import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Target, TrendingUp, Shield, Leaf, Zap, BarChart3,
  GitBranch, BookOpen, Users, Rocket, Award, CheckCircle,
  ChevronRight, ArrowLeft, AlertTriangle, Globe, Cpu,
  FileText, ClipboardList, Star, Clock, DollarSign,
  Factory, Activity, Building2, Layers, RefreshCw,
} from 'lucide-react';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

interface Framework { name: string; desc: string; tools: string[]; standard: string; }
interface KPIMetric { name: string; target: string; benchmark: string; unit: string; }
interface KPICategory { category: string; metrics: KPIMetric[]; }
interface QuickProject { title: string; duration: string; impact: string; }
interface IndustryProject { industry: string; quickWins: string[]; projects: QuickProject[]; }
interface Challenge { challenge: string; impact: string; solution: string; framework: string; }
interface Achievement { title: string; client: string; industry: string; result: string; timeframe: string; }
interface SolutionData {
  slug: string; title: string; tagline: string; description: string;
  icon: React.ElementType; color: string; bgGrad: string;
  frameworks: { strategic: Framework[]; tactical: Framework[]; operational: Framework[]; };
  kpis: KPICategory[];
  projects: IndustryProject[];
  challenges: Challenge[];
  achievements: Achievement[];
}

const SOLUTIONS: SolutionData[] = [
  {
    slug: 'supply-chain-strategy', title: 'Supply Chain Strategy', icon: Target, color: 'text-blue-600', bgGrad: 'from-blue-600 to-blue-800',
    tagline: 'End-to-end supply chain design aligned to your business objectives and Vision 2030.',
    description: 'A robust supply chain strategy defines how your organisation plans, sources, makes, delivers, and returns — aligned to corporate objectives and competitive requirements. ISC deploys APICS SCOR, network design, and S&OP frameworks to build strategies that are resilient, cost-effective, and built for the GCC growth trajectory.',
    frameworks: {
      strategic: [
        { name: 'APICS SCOR Model', desc: 'Supply Chain Operations Reference framework covering Plan-Source-Make-Deliver-Return-Enable at executive level.', tools: ['Process benchmarking', 'Performance metrics', 'Best-practice gap analysis'], standard: 'APICS SCOR 12.0' },
        { name: 'Supply Chain Network Design', desc: 'Mathematical optimisation of facility locations, inventory positioning, and transport modes.', tools: ['Scenario modelling', 'Cost-to-serve analysis', 'Risk-adjusted network scoring'], standard: 'Gartner / MIT CTL' },
        { name: 'S&OP / IBP Framework', desc: 'Integrated Business Planning aligning demand, supply, finance, and product strategy in monthly cadence.', tools: ['Consensus demand planning', 'Supply review process', 'Financial reconciliation'], standard: 'Oliver Wight Class A' },
      ],
      tactical: [
        { name: 'Make-Buy-Partner Analysis', desc: 'Systematic evaluation of internal vs external production and sourcing decisions by category.', tools: ['TCO modelling', 'Core competency mapping', 'Strategic sourcing matrix'], standard: 'CIPS / McKinsey' },
        { name: 'SCOR Level 2 Process Mapping', desc: 'Detailed process blueprint mapping all supply chain sub-processes against SCOR best-practice.', tools: ['Process diagrams', 'RACI assignment', 'KPI cascade'], standard: 'APICS SCOR' },
        { name: 'SKU Rationalisation', desc: 'Elimination of low-velocity, high-complexity SKUs to reduce supply chain cost and complexity.', tools: ['ABC-XYZ analysis', 'Profitability by SKU', 'Portfolio review'], standard: 'Lean / CSCMP' },
      ],
      operational: [
        { name: 'KPI Cascade & Dashboard Design', desc: 'Translating strategic objectives into operational KPIs visible to every team in real time.', tools: ['Balanced Scorecard', 'Power BI dashboards', 'Daily management boards'], standard: 'Kaplan & Norton BSC' },
        { name: 'SLA & SOP Framework', desc: 'Documented service level agreements and standard operating procedures for all supply chain processes.', tools: ['SLA templates', 'SOP authoring', 'Escalation matrices'], standard: 'ISO 9001 / CIPS' },
      ],
    },
    kpis: [
      { category: 'Delivery & Service', metrics: [
        { name: 'Perfect Order Rate', target: '>95%', benchmark: '91%', unit: '%' },
        { name: 'On-Time In-Full (OTIF)', target: '>92%', benchmark: '88%', unit: '%' },
        { name: 'Customer Satisfaction Score', target: '>4.3/5', benchmark: '3.9/5', unit: '/5' },
      ]},
      { category: 'Cost & Efficiency', metrics: [
        { name: 'Supply Chain Cost as % Revenue', target: '<8%', benchmark: '11%', unit: '%' },
        { name: 'Cash-to-Cash Cycle Time', target: '<28 days', benchmark: '42 days', unit: 'days' },
        { name: 'Inventory Turns', target: '>10/yr', benchmark: '7/yr', unit: 'turns/yr' },
      ]},
      { category: 'Agility & Resilience', metrics: [
        { name: 'Forecast Accuracy', target: '>85%', benchmark: '72%', unit: '%' },
        { name: 'Supply Flexibility Index', target: '>0.80', benchmark: '0.65', unit: 'index' },
        { name: 'Recovery Time (disruption)', target: '<72h', benchmark: '5–7 days', unit: 'hours' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', quickWins: ['Map current SCOR processes (2 days)', 'Identify top 5 cost drivers from spend data', 'Baseline OTIF from ERP data'], projects: [{ title: 'Supply Chain Strategy Redesign', duration: '12 weeks', impact: '15–22% cost reduction' }, { title: 'S&OP Implementation', duration: '8 weeks', impact: '18% forecast accuracy improvement' }] },
      { industry: 'Energy', quickWins: ['Turnaround supply chain mapping', 'MRO inventory baseline audit', 'Logistics corridor cost analysis'], projects: [{ title: 'Shutdown Planning Optimisation', duration: '10 weeks', impact: '25% shutdown cost reduction' }, { title: 'Local Content Strategy (Iktva)', duration: '16 weeks', impact: 'Iktva score +12 points' }] },
      { industry: 'Government', quickWins: ['GTPL compliance gap assessment', 'Contract expiry calendar build', 'Spend category mapping'], projects: [{ title: 'National Procurement Strategy', duration: '20 weeks', impact: 'SAR 50M+ addressable savings' }, { title: 'Vision 2030 SC Alignment', duration: '12 weeks', impact: 'Iktva / local content roadmap' }] },
      { industry: 'Pharma', quickWins: ['Cold chain map (GDP compliance)', 'Supplier OTIF baseline', 'SFDA audit readiness check'], projects: [{ title: 'Pharma SC Network Design', duration: '14 weeks', impact: '18% logistics cost saving' }, { title: 'Demand Planning Enhancement', duration: '8 weeks', impact: 'Stockout rate -60%' }] },
    ],
    challenges: [
      { challenge: 'Siloed functional planning — demand, supply, finance not aligned', impact: 'Bullwhip effect, excess inventory, and missed service targets', solution: 'Deploy Integrated Business Planning (IBP) with monthly cross-functional rhythm and single agreed demand signal', framework: 'Oliver Wight IBP / APICS S&OP' },
      { challenge: 'No SCOR baseline — cannot measure supply chain performance objectively', impact: 'Decisions driven by opinion rather than data; benchmarking impossible', solution: 'Run SCOR diagnostic to establish baseline KPIs and compare against GCC industry peers', framework: 'APICS SCOR 12.0' },
      { challenge: 'Supply chain strategy disconnected from corporate strategy', impact: 'Investment misaligned; supply chain reactive rather than enabling growth', solution: 'Cascade corporate objectives into supply chain strategy using Balanced Scorecard and SCOR alignment workshops', framework: 'BSC / Ansoff / Porter' },
      { challenge: 'Over-reliance on single supplier or logistics corridor', impact: 'High disruption risk — Red Sea, COVID-19, port closures expose concentration', solution: 'Dual-source strategy, network re-design, and supply risk segmentation', framework: 'ISO 31000 / APICS SCOR-DS' },
      { challenge: 'ERP data quality prevents meaningful analytics', impact: 'Forecasting, inventory, and supplier KPIs unreliable', solution: 'Data governance programme: master data cleanse, field mapping, and dashboard rebuild in Power BI', framework: 'ISO 8000 Data Quality' },
    ],
    achievements: [
      { title: 'Perfect Order Rate lifted from 78% → 95%', client: 'Saudi petrochemical distributor', industry: 'Energy', result: 'Full SCOR Level 2 redesign, S&OP deployed, inventory cut by 22%', timeframe: '16 weeks' },
      { title: 'SAR 34M supply chain cost reduction', client: 'Government procurement entity', industry: 'Government', result: 'Network redesign, supplier rationalisation, policy governance rebuild', timeframe: '6 months' },
      { title: 'Iktva score 31% → 48% in 12 months', client: 'GCC energy contractor', industry: 'Energy', result: 'Local content strategy, supplier development programme, IKTVA reporting system', timeframe: '12 months' },
    ],
  },
  {
    slug: 'procurement-excellence', title: 'Procurement Excellence', icon: Award, color: 'text-amber-600', bgGrad: 'from-amber-600 to-amber-800',
    tagline: 'Strategic sourcing, supplier transformation, and procurement capability that delivers measurable savings.',
    description: 'Procurement Excellence transforms procurement from a transactional function to a strategic value driver. ISC deploys CIPS Category Management, Kraljic segmentation, and strategic sourcing methodologies to identify, capture, and sustain savings while building governance and resilience.',
    frameworks: {
      strategic: [
        { name: 'CIPS Category Management', desc: '7-step category management process: define scope, profile category, create strategy, generate options, select strategy, implement, review.', tools: ['Category profile', 'Spend analysis', 'Market intelligence', 'Category strategy'], standard: 'CIPS Level 6' },
        { name: 'Spend Portfolio Matrix', desc: 'Strategic mapping of all spend categories by business impact and supply market complexity.', tools: ['Spend segmentation', 'Strategic sourcing matrix', 'Category prioritisation'], standard: 'Kearney Purchasing Chessboard' },
        { name: 'Make-vs-Buy Strategic Decision', desc: 'Structured framework to evaluate which activities to retain internally versus outsource.', tools: ['TCO modelling', 'Core competency mapping', 'Risk-adjusted analysis'], standard: 'CIPS / Deloitte' },
      ],
      tactical: [
        { name: 'Kraljic Supplier Segmentation', desc: 'Segment all suppliers by spend impact (high/low) and supply risk (high/low) to define relationship and negotiation strategies.', tools: ['Supplier mapping', 'Category risk scoring', 'Portfolio optimisation'], standard: 'Harvard Business Review / CIPS' },
        { name: 'Strategic Sourcing (5-Step)', desc: 'Structured sourcing process: market analysis → RFI/RFQ → evaluation → negotiation → award/contract.', tools: ['RFx templates', 'Supplier scoring matrix', 'Negotiation planner'], standard: 'CIPS / APICS' },
        { name: 'SLA & KPI Framework', desc: 'Define, negotiate, and govern service level agreements with all key suppliers.', tools: ['SLA library', 'KPI scorecard', 'Penalty/incentive design'], standard: 'IACCM / CIPS' },
      ],
      operational: [
        { name: 'Purchase-to-Pay (P2P) Optimisation', desc: 'Streamline the end-to-end P2P process: requisition → approval → PO → receipt → invoice → payment.', tools: ['P2P workflow design', '3-way match', 'Exception management'], standard: 'APICS / SAP Best Practice' },
        { name: 'Catalogue & Contract Management', desc: 'Deploy approved product catalogues and contract-backed pricing to eliminate maverick spend.', tools: ['Catalogue design', 'Contracted price management', 'Compliance monitoring'], standard: 'CIPS / Ariba' },
      ],
    },
    kpis: [
      { category: 'Cost Performance', metrics: [
        { name: 'Procurement Savings (% of spend)', target: '8–15%', benchmark: '6.2%', unit: '%' },
        { name: 'Cost Avoidance', target: '>5%', benchmark: '3.1%', unit: '% of spend' },
        { name: 'Total Cost of Ownership Reduction', target: '>10%', benchmark: '7%', unit: '%' },
      ]},
      { category: 'Speed & Efficiency', metrics: [
        { name: 'Procurement Cycle Time', target: '<10 days', benchmark: '18 days', unit: 'days' },
        { name: 'PO Approval Cycle Time', target: '<2 days', benchmark: '5.5 days', unit: 'days' },
        { name: 'Time-to-Contract (from RFQ)', target: '<28 days', benchmark: '47 days', unit: 'days' },
      ]},
      { category: 'Compliance & Quality', metrics: [
        { name: 'PO Compliance Rate', target: '>92%', benchmark: '78%', unit: '%' },
        { name: 'Supplier OTIF', target: '>94%', benchmark: '86%', unit: '%' },
        { name: 'Contract Coverage of Spend', target: '>88%', benchmark: '66%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', quickWins: ['Standardise MRO spec sheets & consolidate to 3 suppliers', 'Implement 3-way PO match in ERP', 'Create approved supplier list for top 20 categories'], projects: [{ title: 'Strategic Sourcing Programme', duration: '12 weeks', impact: '12–18% spend savings' }, { title: 'Supplier Consolidation', duration: '8 weeks', impact: '25% supplier base reduction' }] },
      { industry: 'Energy', quickWins: ['Map all sole-source contracts — flag risk', 'Renegotiate top 5 spend contracts', 'Issue Supplier Code of Conduct'], projects: [{ title: 'Category Management Rollout', duration: '16 weeks', impact: 'SAR 8–15M savings pipeline' }, { title: 'Local Content (Iktva) Programme', duration: '20 weeks', impact: 'Iktva score +10–15 points' }] },
      { industry: 'Government', quickWins: ['GTPL compliance audit', 'Prequalification vendor list refresh', 'Tender evaluation template standardisation'], projects: [{ title: 'Government Procurement Transformation', duration: '20 weeks', impact: 'SAR 20M+ addressable savings' }, { title: 'e-Procurement Platform Deployment', duration: '16 weeks', impact: '40% cycle time reduction' }] },
      { industry: 'Retail & FMCG', quickWins: ['Supplier OTIF baseline report', 'Top 10 product categories spend analysis', 'Renegotiate payment terms to +15 days'], projects: [{ title: 'FMCG Procurement Strategy', duration: '10 weeks', impact: '10% COGS reduction' }, { title: 'Demand-Driven Procurement', duration: '8 weeks', impact: '30% inventory reduction' }] },
    ],
    challenges: [
      { challenge: 'No strategic sourcing process — all procurement is reactive/spot-buying', impact: '20–35% overspend vs contracted rates; no leverage with suppliers', solution: 'Deploy 5-step strategic sourcing process with category-by-category rollout, starting with top 5 spend categories', framework: 'CIPS Strategic Sourcing' },
      { challenge: 'Procurement team viewed as "purchase order clerks" — no influence at strategy table', impact: 'Value not captured; procurement becomes order-taking rather than value creation', solution: 'Capability building programme + senior stakeholder engagement + quick-win delivery to build credibility', framework: 'CIPS Procurement Leadership' },
      { challenge: 'High maverick spend — purchases made outside procurement process', impact: 'Contract leakage, compliance risk, inflated costs', solution: 'P2P policy enforcement, catalogue deployment, approval workflow automation, spend analytics monitoring', framework: 'CIPS Policy Framework' },
      { challenge: 'Supplier quality and OTIF failures disrupting operations', impact: 'Production downtime, customer dissatisfaction, emergency expediting costs', solution: 'Supplier scorecard programme with quarterly business reviews, corrective action plans, and escalation thresholds', framework: 'CIPS SRM / ISO 9001' },
      { challenge: 'No TCO visibility — buying on price only', impact: 'Lowest-price supplier delivers highest total cost when quality, rework, and logistics are included', solution: 'TCO modelling for all strategic categories; integrate quality, logistics, and relationship costs into bid evaluation', framework: 'CIPS TCO / Kearney' },
    ],
    achievements: [
      { title: 'Procurement cycle cut from 28 → 9 days', client: 'Saudi petrochemical company', industry: 'Energy', result: 'P2P redesign, ERP workflow automation, approval matrix restructure', timeframe: '14 weeks' },
      { title: '$4.2M savings in 14 months', client: 'Jordanian manufacturing group', industry: 'Manufacturing', result: 'Category management deployed across 8 categories, 3-year strategic contracts negotiated', timeframe: '14 months' },
      { title: 'Iktva compliance achieved — contract awarded', client: 'Saudi energy contractor (EPC)', industry: 'Energy', result: 'Local supplier development programme, Iktva reporting system, strategic sourcing aligned to IKTVA targets', timeframe: '12 months' },
    ],
  },
  {
    slug: 'risk-management-solution', title: 'Risk Management', icon: Shield, color: 'text-red-600', bgGrad: 'from-red-600 to-red-800',
    tagline: 'Proactive, ISO 31000-aligned supply chain risk identification, assessment, and mitigation.',
    description: 'Supply chain risk management protects revenue, reputation, and operational continuity. ISC deploys ISO 31000:2018, APICS SCOR risk dimension, and FMEA frameworks to build proactive risk registers, heat maps, and business continuity plans that keep your supply chain operational under stress.',
    frameworks: {
      strategic: [
        { name: 'ISO 31000:2018 Risk Framework', desc: 'International standard for enterprise risk management — principles, framework, and process aligned to supply chain operations.', tools: ['Risk appetite statement', 'Risk governance structure', 'Board risk reporting'], standard: 'ISO 31000:2018' },
        { name: 'APICS SCOR Risk Dimension', desc: 'Supply chain risk assessment embedded within the SCOR model — risk by plan/source/make/deliver process.', tools: ['SCOR risk mapping', 'Disruption scenario analysis', 'Recovery strategy design'], standard: 'APICS SCOR 12.0' },
        { name: 'Enterprise Supply Chain Risk Register', desc: 'Board-level risk register covering strategic, operational, financial, compliance, and reputational supply chain risks.', tools: ['Risk identification workshops', 'Risk heat map', 'Quarterly risk review'], standard: 'ISO 31000 / CIPS' },
      ],
      tactical: [
        { name: 'Dual/Multi-Source Strategy', desc: 'For every critical category: qualify and pre-negotiate with secondary suppliers before the primary supplier fails.', tools: ['Criticality assessment', 'Alternate supplier qualification', 'Split-award contracts'], standard: 'CIPS Procurement Risk' },
        { name: 'FMEA (Failure Mode & Effects Analysis)', desc: 'Structured analysis of potential failure points in supply chain processes and their effects on operations.', tools: ['FMEA worksheet', 'RPN scoring (Severity × Occurrence × Detection)', 'Control plan'], standard: 'AIAG FMEA / IEC 60812' },
        { name: 'Business Continuity Planning (BCP)', desc: 'Documented plans for supply chain recovery from major disruptions — covering alternate sourcing, logistics, and communication.', tools: ['BCP template', 'Incident response RACI', 'Recovery milestone tracker'], standard: 'ISO 22301' },
      ],
      operational: [
        { name: 'Supplier Risk Scoring', desc: 'Continuous risk assessment of all strategic suppliers across financial health, geographic risk, ESG, and operational capability.', tools: ['Supplier risk scorecard', 'Financial health monitoring', 'ESG screening'], standard: 'CIPS SRM / Dun & Bradstreet' },
        { name: 'Daily Risk Monitoring & Incident Response', desc: 'Real-time monitoring of supply chain risk signals with defined escalation and response protocols.', tools: ['Risk dashboard (KRIs)', 'Incident log', 'Escalation matrix'], standard: 'ISO 31000 / SAP Risk' },
      ],
    },
    kpis: [
      { category: 'Risk Coverage', metrics: [
        { name: 'Supplier Risk Coverage (% assessed)', target: '>90%', benchmark: '62%', unit: '%' },
        { name: 'Tier-1 Dual-Source Coverage', target: '>70%', benchmark: '45%', unit: '%' },
        { name: 'BCP Test Completion (annual)', target: '100%', benchmark: '58%', unit: '%' },
      ]},
      { category: 'Response Performance', metrics: [
        { name: 'Risk Incident Response Time', target: '<48 hours', benchmark: '5.2 days', unit: 'hours' },
        { name: 'Recovery Time Objective (RTO)', target: '<72 hours', benchmark: 'Not defined', unit: 'hours' },
        { name: 'Disruption Cost as % Revenue', target: '<0.5%', benchmark: '1.8%', unit: '%' },
      ]},
      { category: 'Governance', metrics: [
        { name: 'Risk Register Review Frequency', target: 'Quarterly', benchmark: 'Annual/ad hoc', unit: 'cadence' },
        { name: 'Risk Owner Assignment', target: '100%', benchmark: '71%', unit: '%' },
        { name: 'Critical Risk Mitigation Implementation', target: '>85%', benchmark: '52%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Energy', quickWins: ['Map all sole-source suppliers for critical MRO', 'Run supplier financial health check on top 20 vendors', 'Activate BCP review for Red Sea logistics corridor'], projects: [{ title: 'Supply Chain Risk Register Build', duration: '6 weeks', impact: 'Full visibility of top 25 risks with owners' }, { title: 'Dual-Source Programme — Critical Items', duration: '12 weeks', impact: 'Single-source dependency reduced 40%' }] },
      { industry: 'Pharma', quickWins: ['GDP compliance audit on cold chain logistics', 'SFDA supplier qualification status review', 'API sole-source risk flag'], projects: [{ title: 'Pharma BCP — Supply Risk', duration: '10 weeks', impact: 'ISO 22301 aligned BCP for critical APIs' }, { title: 'Multi-Source Strategy (Active Ingredients)', duration: '16 weeks', impact: '60% reduction in supply risk exposure' }] },
      { industry: 'Manufacturing', quickWins: ['FMEA on production supply inputs', 'Safety stock recalculation for top 20 components', 'Supplier risk score baseline'], projects: [{ title: 'Production Supply Risk Mitigation', duration: '10 weeks', impact: 'Production downtime risk reduced 35%' }, { title: 'Supply Chain Stress Test', duration: '4 weeks', impact: 'Disruption scenario playbook' }] },
      { industry: 'Government', quickWins: ['Compliance risk assessment (GTPL)', 'Contract risk flag — expiring >SAR 1M', 'Supplier financial risk screen'], projects: [{ title: 'Government SC Risk Framework', duration: '12 weeks', impact: 'ISO 31000 risk register + quarterly review' }, { title: 'Regulatory Compliance Programme', duration: '8 weeks', impact: 'GTPL audit readiness score >90%' }] },
    ],
    challenges: [
      { challenge: 'Risk is reactive — disruptions discovered only when operations stop', impact: 'Revenue loss, emergency spend, customer penalties averaging 6–8% annual revenue', solution: 'Deploy real-time risk monitoring with KRI dashboards, supplier alerts, and structured weekly risk review meetings', framework: 'ISO 31000 / APICS SCOR' },
      { challenge: 'No visibility beyond Tier-1 suppliers — Tier-2/3 blind spots', impact: 'Sub-tier disruptions cascade to operations without warning (e.g. 2021 semiconductor shortage)', solution: 'Supplier mapping exercise, Tier-2 disclosure requirements in contracts, and digital supply chain mapping tools', framework: 'CIPS Supply Chain Mapping' },
      { challenge: 'Risk register exists but is not actively managed or reviewed', impact: 'Outdated risks, no owner accountability, governance failure', solution: 'Assign risk owners, implement quarterly review cadence, integrate into management reporting, automate escalation alerts', framework: 'ISO 31000 Risk Governance' },
      { challenge: 'Single-source dependency for critical components/services', impact: 'Any disruption to that supplier = supply chain failure with no alternative', solution: 'Dual-source qualification programme, split-award contracts, pre-negotiated standby supplier agreements', framework: 'CIPS Risk & Resiliency' },
      { challenge: 'No formal BCP — business continuity undocumented', impact: 'Crisis response chaotic, recovery prolonged, reputational damage amplified', solution: 'ISO 22301 aligned BCP covering alternate sourcing, logistics, communication, and recovery milestones — tested annually', framework: 'ISO 22301' },
    ],
    achievements: [
      { title: 'Supply chain disruption cost reduced by 65%', client: 'GCC energy contractor', industry: 'Energy', result: 'Risk register, dual-source programme, BCP — all 3 activated during 2024 Red Sea crisis with zero production impact', timeframe: '18 months to deploy' },
      { title: 'Single-source dependencies reduced from 34 → 9 categories', client: 'Saudi manufacturing group', industry: 'Manufacturing', result: 'Dual-source qualification across 25 critical component categories', timeframe: '12 weeks' },
      { title: 'ISO 22301 BCP certification achieved', client: 'Jordanian pharmaceutical company', industry: 'Pharma', result: 'Full BCP development, crisis team training, tabletop exercise, and first external audit pass', timeframe: '20 weeks' },
    ],
  },
  {
    slug: 'lean-agile-supply-chain', title: 'Lean & Agile Supply Chain', icon: Zap, color: 'text-purple-600', bgGrad: 'from-purple-600 to-purple-800',
    tagline: 'Waste elimination, flow optimisation, and agile response models that cut lead times and reduce inventory.',
    description: 'Lean eliminates waste. Agile absorbs variability. Together they build supply chains that are both efficient and responsive. ISC deploys Value Stream Mapping, Kanban, Pull systems, and Agile S&OP to deliver measurable lead-time reduction, inventory optimisation, and throughput improvement.',
    frameworks: {
      strategic: [
        { name: 'Lean Enterprise Design', desc: 'Design supply chain flows with zero-waste architecture — eliminating all 8 wastes across the end-to-end value stream.', tools: ['Enterprise value stream map', 'Flow efficiency analysis', 'Waste taxonomy'], standard: 'Toyota Production System / Lean Enterprise Institute' },
        { name: 'Theory of Constraints (Goldratt)', desc: 'Identify and exploit the system constraint — the single bottleneck limiting throughput — before optimising anywhere else.', tools: ['Constraint identification', 'Drum-Buffer-Rope scheduling', 'Throughput accounting'], standard: 'Theory of Constraints / APICS' },
        { name: 'Demand-Driven Material Requirements Planning (DDMRP)', desc: 'Position decoupling points based on variability and lead time to create demand-driven, pull-based flow.', tools: ['Buffer positioning', 'Dynamic buffer sizing', 'Demand-driven planning'], standard: 'Demand Driven Institute' },
      ],
      tactical: [
        { name: 'Value Stream Mapping (VSM)', desc: 'Current-state and future-state mapping of every step in the supply chain from order to delivery, quantifying waste at each step.', tools: ['VSM current state', 'Process time vs lead time analysis', 'Future state design'], standard: 'Lean Enterprise Institute' },
        { name: 'Pull System Design (Kanban/JIT)', desc: 'Replace push-based planning with signal-driven replenishment — right product, right time, right quantity.', tools: ['Kanban design', 'Supermarket sizing', 'Replenishment signal design'], standard: 'Toyota / APICS Lean' },
        { name: 'Agile S&OP (Rolling Horizon)', desc: 'Short-cycle demand and supply planning review — monthly for strategy, weekly for execution — responsive to real market signals.', tools: ['Rolling forecast', 'Weekly supply review', 'Scenario planning'], standard: 'Oliver Wight / Gartner' },
      ],
      operational: [
        { name: '5S / 6S Workplace Organisation', desc: 'Sort, Set in order, Shine, Standardise, Sustain (+ Safety) — creating visual, efficient workplaces that sustain improvements.', tools: ['5S audit', 'Red-tag events', 'Visual standard documentation'], standard: 'Toyota / Lean Enterprise' },
        { name: 'Kaizen & Continuous Improvement', desc: 'Structured rapid-improvement events (3–5 days) targeting specific waste-producing processes for rapid transformation.', tools: ['Kaizen event facilitiation', 'A3 problem-solving', 'Improvement tracking board'], standard: 'Imai / Lean Enterprise' },
      ],
    },
    kpis: [
      { category: 'Lead Time & Flow', metrics: [
        { name: 'End-to-End Lead Time Reduction', target: '>35%', benchmark: '18%', unit: '%' },
        { name: 'Process Cycle Efficiency', target: '>35%', benchmark: '22%', unit: '%' },
        { name: 'Order-to-Cash Cycle', target: '<18 days', benchmark: '32 days', unit: 'days' },
      ]},
      { category: 'Inventory', metrics: [
        { name: 'Inventory Turns', target: '>12/yr', benchmark: '7.5/yr', unit: 'turns/yr' },
        { name: 'WIP Reduction', target: '>40%', benchmark: '15%', unit: '%' },
        { name: 'Obsolete Inventory as % Total', target: '<3%', benchmark: '9%', unit: '%' },
      ]},
      { category: 'Productivity & Quality', metrics: [
        { name: 'OEE (Overall Equipment Effectiveness)', target: '>80%', benchmark: '68%', unit: '%' },
        { name: 'First-Pass Yield', target: '>97%', benchmark: '91%', unit: '%' },
        { name: 'Takt Time Adherence', target: '>92%', benchmark: '78%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', quickWins: ['VSM of top 2 production lines in 3 days', '5S workshop in main warehouse', 'Kanban for top 20 MRO items'], projects: [{ title: 'Lean Transformation Programme', duration: '14 weeks', impact: '30% lead time reduction, 20% inventory cut' }, { title: 'Kaizen Blitz — Assembly Line', duration: '1 week/event', impact: '15% OEE improvement per event' }] },
      { industry: 'Logistics', quickWins: ['Dock scheduling visual board', 'Route efficiency quick analysis', 'Returns processing flow map'], projects: [{ title: 'Lean Warehouse Design', duration: '10 weeks', impact: '25% pick-pack efficiency gain' }, { title: 'Last-Mile Delivery Optimisation', duration: '8 weeks', impact: '18% delivery cost reduction' }] },
      { industry: 'Healthcare', quickWins: ['Theatre supply VSM', 'Inventory count — high-cost consumables', 'Par-level optimisation for wards'], projects: [{ title: 'Hospital Supply Chain Lean', duration: '12 weeks', impact: '35% supply cost reduction' }, { title: 'Demand-Driven Pharmacy Replenishment', duration: '8 weeks', impact: 'Stockout rate -70%' }] },
      { industry: 'Retail', quickWins: ['Replenishment signal audit', 'Slow-moving stock analysis', 'DC receiving process VSM'], projects: [{ title: 'Agile Replenishment Model', duration: '10 weeks', impact: '28% inventory reduction' }, { title: 'Omnichannel Flow Optimisation', duration: '12 weeks', impact: '20% OTIF improvement' }] },
    ],
    challenges: [
      { challenge: 'Push planning creates bullwhip — overstock at the front, stockouts downstream', impact: 'Excess inventory costs + service failures co-exist; classic bullwhip effect', solution: 'VSM to expose demand signal distortion, then deploy pull-based Kanban/DDMRP with demand sensing', framework: 'DDMRP / Lean Pull' },
      { challenge: 'Lean tools deployed in isolation (5S only) without flow transformation', impact: 'Clean warehouse, same lead time — surface improvement without systemic change', solution: 'Start with enterprise VSM before deploying any tools — flow transformation must precede point improvements', framework: 'Lean Enterprise Institute' },
      { challenge: 'Cultural resistance — "we\'ve always done it this way" blocks change', impact: 'Improvement initiatives stall after pilot; no spread or sustainability', solution: 'Kaizen leadership engagement, quick-win delivery builds credibility, standard work embeds habits, visual management sustains', framework: 'Kotter 8-step / Lean Culture' },
      { challenge: 'Agile demand requires fast procurement response — current cycle too slow', impact: 'Cannot respond to market opportunities; competitors out-supply ISC clients', solution: 'Agile procurement model — pre-qualified supplier panels, pre-negotiated price bands, delegated approval authority for demand spikes', framework: 'CIPS Agile Procurement' },
      { challenge: 'OEE not measured — maintenance and downtime impact on supply not visible', impact: 'Capacity planning inaccurate; promised delivery dates missed due to unplanned downtime', solution: 'OEE baseline measurement programme, SMED on major changeovers, planned maintenance calendar integration', framework: 'JIPM TPM / Lean' },
    ],
    achievements: [
      { title: 'Lead time reduced 38% in 14 weeks', client: 'Saudi manufacturing company', industry: 'Manufacturing', result: 'VSM, Pull system design, Kanban for 85 SKUs, Kaizen events on 3 production lines', timeframe: '14 weeks' },
      { title: 'Inventory turns increased from 5.2 → 11.8', client: 'GCC retail chain', industry: 'Retail', result: 'Agile replenishment model, demand-driven ordering, slow-mover elimination', timeframe: '6 months' },
      { title: 'Hospital supply cost reduced 32%', client: 'Jordanian private hospital', industry: 'Healthcare', result: 'Par-level optimisation, Kanban for theatres, pharmacy demand-driven replenishment', timeframe: '12 weeks' },
    ],
  },
  {
    slug: 'sustainability-esg', title: 'Sustainability & ESG', icon: Leaf, color: 'text-emerald-600', bgGrad: 'from-emerald-600 to-emerald-800',
    tagline: 'ESG integration, Scope 3 measurement, circular procurement, and Saudi Net Zero alignment.',
    description: 'Supply chain sustainability is now a regulatory requirement, investor expectation, and competitive differentiator. ISC deploys ISO 20400, GRI Standards, and Science-Based Targets frameworks to embed ESG into procurement decisions, measure Scope 3 emissions, and build circular supply chains aligned to Saudi Vision 2030 and global standards.',
    frameworks: {
      strategic: [
        { name: 'Science-Based Targets (SBTi)', desc: 'Align supply chain emissions reduction targets to the 1.5°C Paris Agreement pathway — with sector-specific decarbonisation roadmaps.', tools: ['Emissions baseline (Scope 1/2/3)', 'Target setting methodology', 'Annual disclosure report'], standard: 'SBTi / CDP' },
        { name: 'GRI Sustainability Reporting Standards', desc: 'Globally recognised framework for ESG disclosure — supply chain GRI 308 (supplier environmental) and 414 (supplier social assessment).', tools: ['GRI index', 'Supply chain ESG data collection', 'Materiality assessment'], standard: 'GRI Standards 2021' },
        { name: 'ISO 20400 Sustainable Procurement', desc: 'International standard defining how to integrate sustainability into procurement processes and decisions.', tools: ['Sustainable procurement policy', 'ESG supplier assessment', 'Circular economy integration'], standard: 'ISO 20400:2017' },
      ],
      tactical: [
        { name: 'Scope 3 Supply Chain Inventory', desc: 'Measure and manage Category 1 (purchased goods/services), 4 (upstream transport), and 11 (use of sold products) Scope 3 emissions.', tools: ['Spend-based emission factors', 'Activity-based modelling', 'Supplier-specific data collection'], standard: 'GHG Protocol / SBTi' },
        { name: 'Sustainable Supplier Assessment', desc: 'ESG risk scoring and development for all strategic suppliers across environmental, social, and governance dimensions.', tools: ['ESG supplier questionnaire', 'On-site audit checklist', 'Improvement action plan'], standard: 'ISO 20400 / CIPS Ethics' },
        { name: 'Circular Procurement Framework', desc: 'Design procurement specifications to require recycled content, take-back programmes, and extended product life.', tools: ['Circular criteria library', 'Material passport requirements', 'Lifecycle cost modelling'], standard: 'Ellen MacArthur Foundation' },
      ],
      operational: [
        { name: 'Carbon Data Collection per PO', desc: 'Embed supplier emissions data collection at purchase order level — enabling product-level carbon footprint calculation.', tools: ['PO-level carbon fields (ERP)', 'Supplier data portal', 'Carbon dashboard'], standard: 'GHG Protocol' },
        { name: 'ESG Scorecard in Supplier Reviews', desc: 'Integrate ESG performance (carbon, labour, governance) into quarterly supplier review scorecards alongside commercial KPIs.', tools: ['ESG scorecard template', 'QBR ESG section', 'Improvement action tracker'], standard: 'CIPS Ethical & Sustainable' },
      ],
    },
    kpis: [
      { category: 'Carbon & Environment', metrics: [
        { name: 'Scope 3 Emission Coverage', target: '>75%', benchmark: '38%', unit: '% of supply spend' },
        { name: 'Carbon per SAR of Spend', target: 'Year-on-year reduction', benchmark: 'Not measured', unit: 'kgCO2e/SAR' },
        { name: 'Recycled/Sustainable Content', target: '>25%', benchmark: '8%', unit: '% of spend' },
      ]},
      { category: 'Supplier ESG', metrics: [
        { name: 'ESG-Assessed Strategic Suppliers', target: '>90%', benchmark: '31%', unit: '%' },
        { name: 'Supplier ESG Score (avg)', target: '>75/100', benchmark: '54/100', unit: '/100' },
        { name: 'High ESG-Risk Suppliers with Plans', target: '100%', benchmark: '22%', unit: '%' },
      ]},
      { category: 'Circular Economy', metrics: [
        { name: 'Circular Procurement Spend', target: '>15%', benchmark: '3%', unit: '%' },
        { name: 'Packaging Recyclability', target: '>80%', benchmark: '45%', unit: '%' },
        { name: 'Waste Diverted from Landfill', target: '>70%', benchmark: '41%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Energy', quickWins: ['Scope 3 Category 1 spend-based estimate', 'ESG supplier questionnaire to top 30 vendors', 'Green procurement policy draft'], projects: [{ title: 'Scope 3 Inventory & Reduction Roadmap', duration: '16 weeks', impact: 'Scope 3 measurement to CDP standards' }, { title: 'Sustainable Supplier Programme', duration: '12 weeks', impact: '85% of strategic suppliers ESG-assessed' }] },
      { industry: 'Government', quickWins: ['Green procurement criteria added to top 3 tender templates', 'Vision 2030 ESG alignment review', 'Supplier CoC issued with ESG clauses'], projects: [{ title: 'Government Sustainable Procurement Policy', duration: '10 weeks', impact: 'ISO 20400 aligned policy' }, { title: 'National ESG Supplier Development', duration: '24 weeks', impact: 'Iktva + ESG integrated framework' }] },
      { industry: 'Manufacturing', quickWins: ['Waste-to-landfill baseline audit', 'Top 5 input materials carbon factor', 'Packaging recyclability audit'], projects: [{ title: 'Circular Procurement Design', duration: '12 weeks', impact: '20% packaging recyclability increase' }, { title: 'SBTi Supply Chain Target Setting', duration: '16 weeks', impact: 'Science-based Scope 3 target approved' }] },
      { industry: 'Pharma', quickWins: ['GDP cold chain carbon mapping', 'SFDA ESG compliance review', 'API supplier ESG assessment'], projects: [{ title: 'Pharma ESG Procurement Framework', duration: '14 weeks', impact: 'GRI 308+414 disclosure ready' }, { title: 'Green Cold Chain Programme', duration: '10 weeks', impact: '25% cold chain carbon reduction' }] },
    ],
    challenges: [
      { challenge: 'Scope 3 data collection from suppliers is voluntary and inconsistent', impact: 'ESG reporting inaccurate; regulatory disclosure risk under EU CSDDD and Saudi CMA ESG rules', solution: 'Contractual Scope 3 data requirements, spend-based interim estimates, supplier portal for data submission, and phased enhanced data collection from Tier-1', framework: 'GHG Protocol / SBTi' },
      { challenge: 'ESG requirements perceived as cost-adding, not value-creating', impact: 'Resistance from procurement and operations teams; ESG initiative stalls', solution: 'Quantify ESG ROI: risk reduction value, access to green financing, contract wins from ESG-demanding customers, regulatory fine avoidance', framework: 'ISO 20400 Business Case' },
      { challenge: 'Saudi regulatory ESG landscape evolving rapidly — hard to track', impact: 'Compliance gaps; tender disqualification; investor concern', solution: 'ISC regulatory monitoring service — monthly ESG regulatory brief, impact assessment, and policy update', framework: 'Saudi CMA / Vision 2030' },
      { challenge: 'No circular economy design capability in procurement team', impact: 'Specifications written for linear supply chains; circular options not evaluated', solution: 'Circular procurement training, circular specification library, and product-level lifecycle cost assessment for top categories', framework: 'Ellen MacArthur / ISO 20400' },
      { challenge: 'Sustainability targets set centrally but not cascaded to procurement decisions', impact: 'ESG strategy stays at board level; does not change daily sourcing or supplier behaviour', solution: 'Cascade ESG KPIs into supplier scorecards, buyer performance reviews, and category strategy documentation', framework: 'CIPS Sustainable Procurement' },
    ],
    achievements: [
      { title: 'Scope 3 measured, CDP disclosure submitted', client: 'Saudi listed energy company', industry: 'Energy', result: 'Full Scope 3 Category 1+4 inventory, spend-based + activity-based, CDP B-score', timeframe: '20 weeks' },
      { title: '100% strategic suppliers ESG-assessed', client: 'GCC pharmaceutical group', industry: 'Pharma', result: 'ESG questionnaire, on-site audits, corrective action plans, scorecard integration', timeframe: '12 months' },
      { title: 'Green procurement policy — government tender win', client: 'Jordanian government supplier', industry: 'Government', result: 'ISO 20400 policy, circular specs, ESG supplier programme helped win SAR 28M tender', timeframe: '8 months' },
    ],
  },
  {
    slug: 'digital-transformation', title: 'Digital Transformation', icon: Cpu, color: 'text-indigo-600', bgGrad: 'from-indigo-600 to-indigo-800',
    tagline: 'Technology enablement, ERP optimisation, and digital supply chain maturity roadmaps.',
    description: 'Digital transformation in supply chain is not about technology — it is about using technology to enable better processes, better decisions, and better outcomes. ISC deploys digital maturity assessments, technology roadmaps, and hands-on ERP implementation support across SAP MM/SCM, SAP Ariba, Microsoft Dynamics 365, IFS, and Odoo.',
    frameworks: {
      strategic: [
        { name: 'Digital Supply Chain Maturity Model', desc: '5-level maturity model assessing digitisation across plan, source, make, deliver — from manual/paper-based to fully autonomous.', tools: ['Maturity diagnostic', 'Technology gap analysis', 'Digital roadmap (3-year)'], standard: 'Gartner / Deloitte Digital' },
        { name: 'Technology Architecture Design', desc: 'End-to-end technology stack design: ERP backbone, procurement platform, analytics layer, IoT/track-and-trace, and AI/ML overlay.', tools: ['Architecture blueprint', 'Build-vs-buy analysis', 'Integration design'], standard: 'Gartner / McKinsey' },
        { name: 'Change Management Framework', desc: 'Digital transformation succeeds through people adoption, not just system deployment. ISC deploys structured change management.', tools: ['Stakeholder analysis', 'Change impact assessment', 'Training plan'], standard: 'Prosci ADKAR / Kotter' },
      ],
      tactical: [
        { name: 'ERP Optimisation (SAP / Dynamics / IFS / Odoo)', desc: 'Configuration, process re-alignment, and master data management for existing ERP systems to unlock value from underused modules.', tools: ['Process-ERP gap analysis', 'Configuration review', 'Master data cleanse'], standard: 'SAP Best Practice / Microsoft' },
        { name: 'e-Procurement Platform Deployment', desc: 'Procurement platform selection, configuration, supplier onboarding, and go-live support for SAP Ariba, Coupa, Jaggaer, or Zycus.', tools: ['Platform selection framework', 'Supplier onboarding plan', 'Adoption dashboard'], standard: 'Gartner Procurement Technology' },
        { name: 'Supply Chain Analytics & Power BI', desc: 'Design and build procurement and supply chain KPI dashboards connected to ERP data — enabling real-time decision-making.', tools: ['KPI framework', 'Power BI development', 'Data governance'], standard: 'Microsoft / CIPS' },
      ],
      operational: [
        { name: 'System Training & Hyper-Care', desc: 'Role-based system training, go-live support, and post-implementation performance monitoring for all deployed platforms.', tools: ['Training material', 'Job aids', 'Hyper-care help desk'], standard: 'Prosci / WalkMe' },
        { name: 'Integration Testing & Data Migration', desc: 'Structured data migration, integration testing, and cutover management to ensure clean system go-lives.', tools: ['Data mapping', 'Migration scripts', 'UAT test scripts'], standard: 'PRINCE2 / SAP Activate' },
      ],
    },
    kpis: [
      { category: 'Adoption & Coverage', metrics: [
        { name: 'e-Procurement Adoption Rate', target: '>85%', benchmark: '61%', unit: '%' },
        { name: 'Straight-Through PO Processing', target: '>70%', benchmark: '42%', unit: '%' },
        { name: 'ERP Data Accuracy Score', target: '>92%', benchmark: '74%', unit: '%' },
      ]},
      { category: 'Efficiency Gains', metrics: [
        { name: 'PO Processing Cost Reduction', target: '>40%', benchmark: '21%', unit: '%' },
        { name: 'Invoice Processing Time', target: '<2 days', benchmark: '8.5 days', unit: 'days' },
        { name: 'Manual Touchpoints Eliminated', target: '>60%', benchmark: '25%', unit: '%' },
      ]},
      { category: 'Insights & Analytics', metrics: [
        { name: 'Real-Time KPI Dashboard Coverage', target: '100%', benchmark: '35%', unit: '% of KPIs' },
        { name: 'Forecast Accuracy (AI-enhanced)', target: '>87%', benchmark: '72%', unit: '%' },
        { name: 'Spend Visibility (% classified)', target: '>95%', benchmark: '68%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', quickWins: ['ERP utilisation audit — identify unused modules', 'Spend data extraction and classification', 'Power BI procurement dashboard (4 weeks)'], projects: [{ title: 'SAP MM/SCM Optimisation', duration: '14 weeks', impact: '35% manual process reduction' }, { title: 'Procurement Analytics Dashboard', duration: '6 weeks', impact: 'Real-time spend & supplier KPI visibility' }] },
      { industry: 'Government', quickWins: ['ZATCA e-invoicing readiness check', 'Current procurement technology audit', 'Tender management workflow map'], projects: [{ title: 'e-Procurement Platform Deployment', duration: '20 weeks', impact: '40% cycle time reduction, 100% audit trail' }, { title: 'Supply Chain Visibility Dashboard', duration: '10 weeks', impact: 'Real-time procurement KPIs for leadership' }] },
      { industry: 'Energy', quickWins: ['SAP MM master data quality audit', 'MRO catalogue build (top 200 items)', 'Supplier portal readiness assessment'], projects: [{ title: 'SAP Ariba Deployment', duration: '24 weeks', impact: 'Fully digitised source-to-pay process' }, { title: 'Maintenance Materials Optimisation', duration: '12 weeks', impact: '18% MRO inventory reduction via catalogue' }] },
      { industry: 'Retail', quickWins: ['Demand planning tool assessment', 'Inventory management module review', 'Omnichannel flow data mapping'], projects: [{ title: 'Odoo/Dynamics SC Module', duration: '16 weeks', impact: 'Integrated POS-to-replenishment flow' }, { title: 'AI Demand Sensing Deployment', duration: '12 weeks', impact: '15% forecast accuracy improvement' }] },
    ],
    challenges: [
      { challenge: 'ERP deployed but only 40% of modules used — investment not realised', impact: 'Manual workarounds persist; duplicate data entry; KPIs not available in real time', solution: 'ERP optimisation programme: process-to-system mapping, configuration review, master data cleanse, and user re-training', framework: 'SAP Activate / Microsoft Sure Step' },
      { challenge: 'Technology selected before process designed — system amplifies broken process', impact: 'Digital transformation delivers digital chaos — same problems, faster', solution: 'Process-first principle: design future-state process, then configure technology to support it — not the reverse', framework: 'ISC Digital Transformation Principle' },
      { challenge: 'Low user adoption after go-live — system not used as designed', impact: 'ROI not achieved; business reverts to spreadsheets and workarounds within 6 months', solution: 'Prosci ADKAR change management, role-based training, hyper-care support, and adoption monitoring dashboard', framework: 'Prosci ADKAR' },
      { challenge: 'Data quality prevents meaningful analytics — "garbage in, garbage out"', impact: 'Management decisions based on unreliable data; dashboards distrust', solution: 'Master data governance programme: data ownership, cleanse, validation rules, and ongoing data quality monitoring', framework: 'ISO 8000 / DAMA' },
      { challenge: 'Integration between systems is manual — islands of automation', impact: 'Re-keying between ERP, procurement platform, and finance creates errors and delays', solution: 'Integration architecture design with API-based connections between ERP, e-procurement, logistics, and finance systems', framework: 'Enterprise Architecture / SAP Integration' },
    ],
    achievements: [
      { title: 'SAP Ariba deployed — 40% cycle time reduction', client: 'Saudi energy company', industry: 'Energy', result: 'Full source-to-pay digitisation, 500+ suppliers onboarded, zero-paper procurement', timeframe: '24 weeks' },
      { title: 'Power BI dashboard — real-time procurement KPIs', client: 'Jordanian government ministry', industry: 'Government', result: 'ERP-connected spend, supplier, and contract dashboards in leadership and operational views', timeframe: '8 weeks' },
      { title: 'Odoo SCM implementation — integrated operations', client: 'GCC retail chain', industry: 'Retail', result: 'POS-to-warehouse-to-replenishment fully integrated, manual PO entry eliminated', timeframe: '16 weeks' },
    ],
  },
];

// remaining solutions as stubs with basic structure
const REMAINING_SLUGS = [
  'contract-lifecycle-management', 'supplier-relationship-governance', 'resiliency',
  'value-engineering', 'process-improvement-policy', 'training-capability-building',
];

const TABS = ['Overview', 'Frameworks', 'KPIs', 'Projects & Quick Wins', 'Challenges', 'Achievements'];

export function SolutionDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const [activeTab, setActiveTab] = useState(0);
  const [frameworkLevel, setFrameworkLevel] = useState<'strategic' | 'tactical' | 'operational'>('strategic');
  const [industryIdx, setIndustryIdx] = useState(0);
  const [openChallenge, setOpenChallenge] = useState<number | null>(0);

  const sol = SOLUTIONS.find(s => s.slug === slug);

  if (!sol) {
    const isKnown = REMAINING_SLUGS.includes(slug);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
        <Shield className="w-16 h-16 text-primary/30" />
        <h1 className="text-2xl font-bold text-primary">
          {isKnown ? 'Full detail page coming soon' : 'Solution not found'}
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          {isKnown
            ? "We're building the deep-dive content for this solution. In the meantime, book a consultation to discuss how we can help."
            : 'The solution you are looking for could not be found.'}
        </p>
        <div className="flex gap-3">
          <Link href="/#solutions"><Button variant="outline">← All Solutions</Button></Link>
          <Link href="/consultant"><Button className="bg-primary text-white">Book Consultation</Button></Link>
        </div>
      </div>
    );
  }

  const Icon = sol.icon;
  const fwLevel = sol.frameworks[frameworkLevel];
  const industryData = sol.projects[industryIdx] ?? sol.projects[0];

  return (
    <div className="w-full">
      {/* Hero */}
      <div className={`relative w-full overflow-hidden bg-gradient-to-br ${sol.bgGrad} py-14 px-4`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <Link href="/#solutions">
            <span className="flex items-center gap-1 text-white/60 text-sm mb-5 hover:text-white transition-colors cursor-pointer w-fit">
              <ArrowLeft className="w-4 h-4" /> All Solutions
            </span>
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{sol.title}</h1>
              <p className="text-white/75 text-lg max-w-2xl">{sol.tagline}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">Book a Consultation</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">Free AI Diagnostic</Button></Link>
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary mb-3">{sol.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">{sol.description}</p>
              <div className="space-y-3">
                {sol.achievements.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">{a.title}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[{ label: 'Avg Savings', val: '12–18%' }, { label: 'Avg Lead Time ↓', val: '35%' }, { label: 'Clients Served', val: '40+' }].map(s => (
                  <div key={s.label} className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.08} className="bg-[#082C6B] rounded-2xl p-7 text-white">
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-3">ISC Approach</p>
              <h3 className="font-bold text-lg mb-4">How we deliver {sol.title}</h3>
              <ol className="space-y-3">
                {['Diagnostic — current-state assessment vs global benchmark', 'Strategy — tailored framework selection and phased roadmap', 'Implementation — hands-on deployment with your team', 'Measurement — KPI dashboard and performance verification', 'Governance — ongoing review cadence and improvement cycle'].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-5 border-t border-white/15">
                <p className="text-xs text-white/60">Ma'in Alhaqash — MCIPS · CPSM · MSc · 20+ years · BP · Maersk · Saudi Government</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 1 — FRAMEWORKS */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Frameworks by Level</h2>
                <p className="text-muted-foreground mt-1">Board, management, and operational frameworks — from strategy to day-to-day execution.</p>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['strategic', 'tactical', 'operational'] as const).map(lvl => (
                  <button key={lvl} onClick={() => setFrameworkLevel(lvl)}
                    className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${frameworkLevel === lvl ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted'}`}>
                    {lvl === 'strategic' ? 'L1 Strategic' : lvl === 'tactical' ? 'L2 Tactical' : 'L3 Operational'}
                  </button>
                ))}
              </div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {fwLevel.map((fw, i) => (
                <Reveal key={fw.name} delay={i * 0.07}>
                  <div className="bg-white border border-border rounded-2xl p-6 h-full flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-primary text-lg leading-snug">{fw.name}</h3>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15 shrink-0 ml-3">{fw.standard}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{fw.desc}</p>
                    <div className="mt-auto">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Key Tools</p>
                      <div className="flex flex-wrap gap-2">
                        {fw.tools.map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-muted border border-border rounded-2xl p-6">
              <p className="text-sm font-bold text-primary mb-2">How ISC selects the right framework level</p>
              <p className="text-sm text-muted-foreground">Every engagement starts with a diagnostic to determine which level is most relevant. Early-stage organisations benefit from L3 operational tools first; mature organisations need L1 strategic redesign. ISC deploys frameworks in context — never as a one-size-fits-all programme.</p>
            </Reveal>
          </div>
        )}

        {/* TAB 2 — KPIs */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">KPI Framework</h2>
              <p className="text-muted-foreground mt-1">Targets derived from GCC industry benchmarks, CIPS standards, and Ma'in's engagement data across 40+ organisations.</p>
            </Reveal>
            {sol.kpis.map((cat, ci) => (
              <Reveal key={cat.category} delay={ci * 0.06}>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />{cat.category}</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {cat.metrics.map((m, mi) => (
                      <div key={mi} className="bg-muted rounded-xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{m.name}</p>
                        <p className="text-2xl font-extrabold text-[#C9A84C] mb-1">{m.target}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">Benchmark: {m.benchmark}</span>
                          <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal className="bg-[#082C6B] rounded-2xl p-6 text-white">
              <p className="font-bold mb-2">Suggested Dashboard: {sol.title}</p>
              <p className="text-white/70 text-sm mb-3">ISC recommends a 3-layer dashboard: Board (monthly, 5–6 headline KPIs), Management (weekly, 12–15 category KPIs), Operational (daily, process-level metrics). Built in Power BI, connected to ERP data.</p>
              <Link href="/consultant"><span className="text-[#C9A84C] text-sm font-semibold cursor-pointer hover:underline">Request dashboard design →</span></Link>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — PROJECTS & QUICK WINS */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Projects & Quick Wins</h2>
                <p className="text-muted-foreground mt-1">Industry-specific programmes and 30-day quick wins to start generating value immediately.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sol.projects.map((p, i) => (
                  <button key={p.industry} onClick={() => setIndustryIdx(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${industryIdx === i ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
                    {p.industry}
                  </button>
                ))}
              </div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="bg-white border border-border rounded-2xl p-6 h-full shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#C9A84C]" />
                    <h3 className="font-bold text-primary">30-Day Quick Wins</h3>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Fast Value</span>
                  </div>
                  <ul className="space-y-3">
                    {industryData.quickWins.map((w, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={0.07}>
                <div className="bg-white border border-border rounded-2xl p-6 h-full shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Rocket className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary">Suggested Projects</h3>
                  </div>
                  <div className="space-y-4">
                    {industryData.projects.map((p, i) => (
                      <div key={i} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-primary text-sm leading-snug">{p.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shrink-0">{p.duration}</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> {p.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        )}

        {/* TAB 4 — CHALLENGES */}
        {activeTab === 4 && (
          <div className="space-y-5">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Challenges & How to Overcome Them</h2>
              <p className="text-muted-foreground mt-1">The most common barriers ISC encounters — and the proven approaches to resolving them.</p>
            </Reveal>
            {sol.challenges.map((c, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenChallenge(openChallenge === i ? null : i)}>
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-primary">{c.challenge}</p>
                      <p className="text-xs text-red-600 font-medium mt-1">Impact: {c.impact}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openChallenge === i ? 'rotate-90' : ''}`} />
                  </button>
                  {openChallenge === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                      <div className="p-5 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">ISC Solution Approach</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{c.solution}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-accent">{c.framework}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* TAB 5 — ACHIEVEMENTS */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Real-World Achievements</h2>
              <p className="text-muted-foreground mt-1">Delivered by Ma'in Alhaqash MCIPS CPSM across GCC, Jordan, and international engagements.</p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {sol.achievements.map((a, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="bg-gradient-to-br from-[#082C6B] to-[#0B3D91] rounded-2xl p-7 text-white flex flex-col h-full">
                    <Star className="w-6 h-6 text-[#C9A84C] mb-4" />
                    <p className="text-2xl font-extrabold text-[#C9A84C] mb-3 leading-tight">{a.title}</p>
                    <p className="text-white/75 text-sm leading-relaxed flex-1">{a.result}</p>
                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
                      <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" />{a.industry}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.timeframe}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-2xl p-8 text-white text-center mt-4">
              <Award className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Ready to achieve similar results?</h3>
              <p className="text-white/70 mb-5 text-sm">Book a confidential 45-minute consultation with Ma'in to discuss your specific situation.</p>
              <Link href="/consultant">
                <Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold px-8">Book Consultation</Button>
              </Link>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
