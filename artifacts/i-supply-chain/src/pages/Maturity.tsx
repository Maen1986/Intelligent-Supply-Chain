import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Award, AlertTriangle,
  CheckCircle2, TrendingUp, Download, RotateCcw, Star,
  GitBranch, ShoppingCart, FileText, Users, Shield, Leaf, Cpu, RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — 8 segments × 5 questions each
═══════════════════════════════════════════════════════════════════════════ */

const SCALE_LABELS = [
  { value: 1, short: 'Reactive',  desc: 'Ad-hoc, no defined process' },
  { value: 2, short: 'Aware',     desc: 'Basic awareness, inconsistent' },
  { value: 3, short: 'Defined',   desc: 'Standardised & documented' },
  { value: 4, short: 'Managed',   desc: 'Measured & data-driven' },
  { value: 5, short: 'Optimised', desc: 'Continuous improvement, best-in-class' },
];

interface Question {
  q: string;
  anchors: [string, string]; // [level-1 description, level-5 description]
}

interface Segment {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  color: string;
  questions: Question[];
  benchmarks: { gcc: number; global: number; best: number };
  recommendations: Record<string, string>; // maturity level → recommendation text
}

const SEGMENTS: Segment[] = [
  {
    id: 'strategy',
    title: 'Supply Chain Strategy & Design',
    shortTitle: 'Strategy',
    icon: GitBranch,
    color: '#0B3D91',
    benchmarks: { gcc: 2.4, global: 2.9, best: 4.6 },
    questions: [
      {
        q: 'How well-defined and documented is your supply chain strategy, including its alignment to corporate goals and a 3–5 year roadmap?',
        anchors: ['No formal strategy; decisions are made reactively based on immediate pressures.', 'A comprehensive, board-approved supply chain strategy exists, is reviewed annually, and drives capital allocation decisions.'],
      },
      {
        q: 'How regularly do you conduct end-to-end supply chain network design reviews, including footprint, transportation lanes, and distribution models?',
        anchors: ['Supply chain network has never been formally mapped or optimised.', 'Network design reviews are conducted bi-annually using digital twin modelling and scenario analysis.'],
      },
      {
        q: 'How mature is your Sales & Operations Planning (S&OP) or Integrated Business Planning (IBP) process across finance, sales, operations, and supply chain?',
        anchors: ['No S&OP process; demand and supply plans are siloed within individual departments.', 'A fully integrated IBP process runs monthly, with executive engagement and real-time demand sensing feeding into decisions.'],
      },
      {
        q: 'How effectively do you use scenario planning and supply chain simulation to evaluate strategic options (e.g., nearshoring, new markets, disruptions)?',
        anchors: ['No scenario planning is conducted; major decisions rely on intuition and past experience.', 'Advanced simulation tools model multiple scenarios with quantified risk and opportunity outcomes before every major decision.'],
      },
      {
        q: 'How well are supply chain KPIs defined, cascaded to teams, and tracked against targets with clear ownership and accountability?',
        anchors: ['No KPIs are defined for supply chain performance; there is no formal measurement framework.', 'A comprehensive KPI framework is cascaded across all levels, reviewed in weekly operational meetings, and linked to incentive structures.'],
      },
    ],
    recommendations: {
      Reactive: 'Immediate priority: commission a current-state supply chain mapping exercise and develop a 3-year strategic roadmap. Engage a senior supply chain advisor to facilitate the process.',
      Aware: 'Formalise your S&OP process and establish a small set of headline KPIs. Conduct a network design review within the next 6 months.',
      Defined: 'Elevate S&OP to IBP by integrating financial planning. Introduce scenario planning tools and annual network design reviews with quantified outcomes.',
      Managed: 'Implement advanced analytics and digital twin capabilities for network modelling. Link supply chain strategy metrics directly to executive compensation.',
      Optimised: 'Benchmark against global peers and identify where you can leverage your supply chain as a competitive differentiator and a source of revenue growth.',
    },
  },
  {
    id: 'procurement',
    title: 'Procurement & Strategic Sourcing',
    shortTitle: 'Procurement',
    icon: ShoppingCart,
    color: '#C9A84C',
    benchmarks: { gcc: 2.6, global: 3.1, best: 4.5 },
    questions: [
      {
        q: 'How structured and consistently applied is your category management approach across all direct and indirect spend categories?',
        anchors: ['No category management; all spend categories are managed reactively with identical tactical approaches.', 'All spend is managed through structured category plans with market intelligence, multi-year strategies, and dedicated category managers.'],
      },
      {
        q: 'How consistently do you apply formal strategic sourcing methodology (RFQ, RFP, e-auctions, multi-criteria evaluation) when selecting or renewing suppliers?',
        anchors: ['Supplier selection is informal and based on relationships or convenience; no defined sourcing process exists.', 'All significant spend decisions follow a rigorous multi-stage sourcing process with documented criteria, competitive tension, and audit trails.'],
      },
      {
        q: 'How advanced and frequently refreshed is your spend analysis capability — including spend classification, maverick spend detection, and savings opportunity identification?',
        anchors: ['Spend data is not centrally available or analysed; the organisation does not know what it buys from whom or at what price.', 'Real-time spend analytics classify 95%+ of spend, automatically flag maverick purchasing, and surface savings opportunities monthly.'],
      },
      {
        q: 'How effectively do you apply Total Cost of Ownership (TCO) analysis — including quality, logistics, risk, and lifecycle costs — in sourcing decisions rather than purchase price alone?',
        anchors: ['All sourcing decisions are based on unit price only; hidden and lifecycle costs are not considered.', 'TCO models are applied to all strategic categories, and sourcing decisions routinely demonstrate 10–25% additional value beyond purchase price.'],
      },
      {
        q: 'How effectively does your procurement function operate against defined savings targets, track realised savings, and demonstrate value delivered to the business?',
        anchors: ['Procurement has no savings targets and does not track or report cost savings or value delivered.', 'Procurement operates a rigorous savings pipeline, distinguishes hard and soft savings, validates with finance, and reports monthly against an annual target.'],
      },
    ],
    recommendations: {
      Reactive: 'Urgently implement a spend analysis exercise across all categories. Establish a basic sourcing policy and define a minimum procurement process for competitive tendering above a threshold.',
      Aware: 'Implement category management for your top 5 spend categories by value. Build a savings tracking mechanism and begin applying TCO in all strategic sourcing decisions.',
      Defined: 'Extend category management to all significant spend. Introduce e-sourcing tools for competitive tendering and automate spend classification with analytics software.',
      Managed: 'Deploy advanced analytics and AI-powered spend intelligence. Implement a procurement performance scorecard tied to business outcomes beyond cost savings.',
      Optimised: 'Shift procurement\'s value proposition from cost to value creation — innovation sourcing, supply chain sustainability, and supplier-led R&D should be priority activities.',
    },
  },
  {
    id: 'contracts',
    title: 'Contract Lifecycle Management',
    shortTitle: 'CLM',
    icon: FileText,
    color: '#0B6E4F',
    benchmarks: { gcc: 2.0, global: 2.7, best: 4.4 },
    questions: [
      {
        q: 'How effectively do you manage the full contract lifecycle — from initiation and drafting through approval, execution, and obligation tracking to renewal or expiry?',
        anchors: ['Contracts are drafted ad-hoc with no standard templates, no approval workflow, and no post-signature tracking.', 'A fully automated CLM platform manages the complete lifecycle with AI-assisted drafting, e-signature, obligation tracking, and renewal alerts.'],
      },
      {
        q: 'Do you have a centralised, searchable contract repository with metadata tagging, milestone alerts, and role-based access for all active contracts?',
        anchors: ['Contracts are stored in personal email folders or physical filing cabinets; there is no central repository.', 'A structured digital repository holds 100% of contracts with automated expiry alerts, obligation calendars, and full-text search capability.'],
      },
      {
        q: 'How consistently are contract obligations, SLAs, and performance KPIs tracked and enforced post-signature, and how quickly are breaches identified and escalated?',
        anchors: ['Contract terms are largely forgotten once signed; supplier SLAs and obligations are not actively monitored.', 'All obligations are tracked in real time against supplier performance data, with automated alerts on any breach and a defined escalation process.'],
      },
      {
        q: 'How structured is your contract negotiation process, including use of a commercial playbook, fallback positions, red-line authority, and lessons learned capture?',
        anchors: ['Negotiation is conducted informally based on individual style; no playbook, authority matrix, or structured approach exists.', 'A commercial negotiation playbook with pre-approved fallback positions and red-line authority is used on all material contracts, with outcomes captured centrally.'],
      },
      {
        q: 'How proactively do you manage contract renewals, renegotiations, and exits — including market testing, benchmarking, and leveraging competitive tension at renewal?',
        anchors: ['Most contracts auto-renew on existing terms without review; procurement is not involved in renewals until a crisis arises.', 'A rolling 12-month renewal pipeline is managed, with every renewal involving market benchmarking, competitive tension, and commercial negotiation.'],
      },
    ],
    recommendations: {
      Reactive: 'Implement a basic contract register immediately. Define standard contract templates for your most common agreement types and establish minimum approval workflows.',
      Aware: 'Deploy a CLM system (even a basic one) to centralise contracts and automate expiry alerts. Train procurement and legal on contract fundamentals and negotiation basics.',
      Defined: 'Activate full obligation tracking and SLA monitoring. Build a commercial negotiation playbook and implement a structured renewal pipeline management process.',
      Managed: 'Implement AI-powered contract analytics for risk identification, obligation extraction, and spend commitment tracking. Integrate CLM with ERP for spend commitments.',
      Optimised: 'Deploy predictive contract risk scoring and leverage contract data as a strategic intelligence source for sourcing decisions and supplier performance management.',
    },
  },
  {
    id: 'suppliers',
    title: 'Supplier Relationship Management',
    shortTitle: 'SRM',
    icon: Users,
    color: '#7B2D8B',
    benchmarks: { gcc: 2.2, global: 2.8, best: 4.5 },
    questions: [
      {
        q: 'How formalised is your supplier segmentation model — distinguishing strategic, preferred, approved, and transactional suppliers by criticality and spend?',
        anchors: ['All suppliers are treated identically regardless of spend, strategic importance, or risk profile.', 'All suppliers are formally segmented using a multi-factor model (spend, risk, strategic importance), with differentiated management approaches for each tier.'],
      },
      {
        q: 'How regularly do you conduct structured, two-way supplier performance reviews using defined scorecards covering quality, delivery, commercial, and relationship dimensions?',
        anchors: ['Supplier performance is never formally reviewed; issues are only addressed when they escalate into crises.', 'Strategic suppliers receive quarterly formal performance reviews with balanced scorecards, executive sponsorship, and defined improvement action plans.'],
      },
      {
        q: 'How actively do you invest in supplier development — including training, capability-building, technology access, and collaborative problem-solving — to improve supplier performance?',
        anchors: ['No investment is made in supplier development; the organisation expects suppliers to self-improve without support.', 'A funded supplier development programme actively builds strategic supplier capability, with measured improvement in performance and innovation output.'],
      },
      {
        q: 'How effectively do you collaborate with strategic suppliers on innovation, joint product development, cost reduction, and shared value creation beyond transactional buying?',
        anchors: ['Supplier relationships are purely transactional; innovation and collaboration are not actively pursued with any supplier.', 'Strategic suppliers participate in joint innovation sessions, are early-involved in NPD processes, and contribute measurable innovation value annually.'],
      },
      {
        q: 'How mature is your supplier onboarding, qualification, and exit process — including financial vetting, ESG compliance, capability assessment, and risk scoring?',
        anchors: ['Supplier onboarding is informal; new suppliers are added to the system without any formal qualification or risk assessment.', 'A rigorous qualification process including financial health, ESG compliance, capacity, and risk scoring gates all new supplier approvals; exit protocols are equally structured.'],
      },
    ],
    recommendations: {
      Reactive: 'Define your top 20 suppliers by spend and risk. Introduce a basic supplier scorecard for these and schedule quarterly reviews. Formalize supplier qualification for new additions.',
      Aware: 'Implement a three-tier supplier segmentation model. Develop scorecards for strategic and preferred suppliers, and begin investing in at least 2–3 strategic supplier development initiatives.',
      Defined: 'Build a formal SRM programme with dedicated relationship managers for strategic suppliers. Introduce joint business plans for top 10 suppliers and an innovation forum.',
      Managed: 'Deploy a digital SRM platform with real-time performance dashboards. Expand supplier collaboration to joint cost modelling, demand visibility sharing, and co-innovation.',
      Optimised: 'Position your supply base as a strategic competitive asset. Lead supplier innovation ecosystems and co-invest in supplier capability as a growth strategy.',
    },
  },
  {
    id: 'risk',
    title: 'Supply Chain Risk Management',
    shortTitle: 'Risk',
    icon: Shield,
    color: '#B91C1C',
    benchmarks: { gcc: 2.1, global: 2.7, best: 4.3 },
    questions: [
      {
        q: 'How comprehensively have you mapped supply chain risks at tier 1 and tier 2 supplier level, including concentration, single-source, and geographic risk?',
        anchors: ['No formal risk mapping has been conducted; the organisation has limited visibility of its supply chain below tier-1 suppliers.', 'A live risk map covers all critical suppliers to tier-2, with quantified risk scores, concentration analysis, and geographic disruption modelling.'],
      },
      {
        q: 'How actively do you monitor supply chain risks in real time — including supplier financial health, geopolitical events, ESG risk signals, and capacity constraints?',
        anchors: ['Risk monitoring is entirely reactive; the organisation only becomes aware of supplier risk when a disruption has already occurred.', 'An AI-powered risk monitoring platform continuously scans supplier financial data, news feeds, ESG signals, and geopolitical risk indices, generating proactive alerts.'],
      },
      {
        q: 'How robust are your business continuity and supply chain resilience plans, including documented alternative sourcing options, inventory buffers, and recovery time objectives?',
        anchors: ['No business continuity plans exist for supply chain; there are no documented recovery options for a major supplier failure.', 'Comprehensive BCPs exist for all critical supply chain risks, are tested annually, and include pre-qualified alternative suppliers with documented activation protocols.'],
      },
      {
        q: 'How effectively do you apply dual-sourcing or multi-sourcing strategies for critical categories, and how regularly do you validate the independence and capability of contingency sources?',
        anchors: ['Many critical categories have a single source of supply with no validated alternative; single-source dependency is not tracked or managed.', 'All critical categories operate on a dual or multi-source model with pre-negotiated contingency pricing, validated capacity, and a quarterly independence audit.'],
      },
      {
        q: 'How regularly do you conduct supply chain risk exercises, stress tests, or tabletop simulations — and how quickly are findings translated into plan updates and mitigations?',
        anchors: ['Risk plans have never been tested; the organisation has never conducted a supply chain stress test or disruption simulation exercise.', 'Annual supply chain stress-test exercises simulate specific disruption scenarios, with findings reviewed at board level and translated into plan updates within 30 days.'],
      },
    ],
    recommendations: {
      Reactive: 'Immediately map all single-source dependencies in critical categories. Develop a basic business continuity framework and identify at least one alternative source per critical item.',
      Aware: 'Implement a structured risk register for supply chain risks. Begin dual-sourcing the top 5 highest-risk single-source categories and qualify contingency suppliers.',
      Defined: 'Deploy a supplier risk monitoring tool (Resilinc, riskmethods, or similar). Formalise BCPs for all critical categories and conduct your first tabletop simulation exercise.',
      Managed: 'Implement real-time AI-powered risk monitoring. Extend dual-sourcing to all critical categories and begin tier-2 supply chain risk mapping with key strategic suppliers.',
      Optimised: 'Leverage predictive analytics to anticipate disruptions before they occur. Build supply chain resilience as a competitive differentiator communicated to customers.',
    },
  },
  {
    id: 'sustainability',
    title: 'Sustainability & ESG',
    shortTitle: 'ESG',
    icon: Leaf,
    color: '#15803D',
    benchmarks: { gcc: 1.8, global: 2.5, best: 4.2 },
    questions: [
      {
        q: 'How comprehensively have you assessed and measured Scope 3 (supply chain) greenhouse gas emissions, including methodology, data quality, and coverage of spend categories?',
        anchors: ['Scope 3 emissions have not been measured or estimated; the organisation has no visibility of its supply chain carbon footprint.', 'Scope 3 emissions are measured to >80% spend coverage using a recognised methodology (GHG Protocol), disclosed publicly, and reduced through an active supplier programme.'],
      },
      {
        q: 'How systematically are ESG and sustainability criteria integrated into your supplier selection, evaluation, and sourcing decisions?',
        anchors: ['ESG is not a factor in any supplier selection or sourcing decision; cost and quality are the only evaluation criteria.', 'ESG criteria carry a defined weighting (typically 15–25%) in all supplier evaluations, and ESG performance influences supplier tiering and contract awards.'],
      },
      {
        q: 'How actively do you require, verify, and support supplier ESG compliance — including codes of conduct, audit programmes, and supplier capacity-building?',
        anchors: ['No ESG requirements are placed on suppliers; no code of conduct, audit, or disclosure requirement exists.', 'All suppliers above a spend threshold sign a mandatory ESG code of conduct, are audited against it, and high-risk suppliers receive active improvement support.'],
      },
      {
        q: 'How mature is your circular procurement practice — including specifications for recycled content, take-back requirements, product lifecycle design, and waste reduction?',
        anchors: ['Circular economy principles have no influence on procurement specifications or supplier requirements; linearity is assumed in all purchasing decisions.', 'Circular procurement criteria are embedded in category strategies, with minimum recycled content specified, take-back requirements contractualised, and waste KPIs tracked.'],
      },
      {
        q: 'How transparently and comprehensively do you report supply chain sustainability performance to internal and external stakeholders, including customers, regulators, and investors?',
        anchors: ['No supply chain sustainability reporting is produced; ESG performance is not tracked or disclosed.', 'An annual supply chain sustainability report is published against a recognised framework (GRI, SASB, TCFD), aligned to regulatory requirements, and independently assured.'],
      },
    ],
    recommendations: {
      Reactive: 'Start with a Scope 3 emissions estimation using a spend-based methodology. Introduce a basic supplier ESG questionnaire for your top 20 suppliers by spend.',
      Aware: 'Adopt a Supplier Code of Conduct covering human rights, environment, and governance. Begin integrating ESG criteria (10% weighting minimum) into sourcing evaluations.',
      Defined: 'Implement a supplier ESG audit programme for high-risk suppliers. Set quantified Scope 3 reduction targets and align to Saudi CMA ESG disclosure requirements if listed.',
      Managed: 'Deploy a supplier sustainability platform for real-time ESG data collection. Develop a circular procurement policy and integrate ESG KPIs into supplier scorecards.',
      Optimised: 'Lead supply chain ESG transparency with externally assured reporting. Use ESG leadership as a competitive advantage in public sector and international tender qualification.',
    },
  },
  {
    id: 'digital',
    title: 'Digital Transformation & Technology',
    shortTitle: 'Digital',
    icon: Cpu,
    color: '#5B21B6',
    benchmarks: { gcc: 2.3, global: 3.0, best: 4.6 },
    questions: [
      {
        q: 'How fully digitised is your procure-to-pay (P2P) process — from purchase requisition through purchase order, goods receipt, invoice, and payment?',
        anchors: ['The P2P process is largely manual (paper, email, spreadsheets); there is no e-procurement system in use.', 'The P2P process is fully automated with e-catalogues, 3-way matching, automated invoice processing, and real-time spend visibility — achieving >95% touchless processing.'],
      },
      {
        q: 'How effectively do you use data analytics, dashboards, and business intelligence tools to support procurement and supply chain decision-making?',
        anchors: ['Reporting is manual and infrequent; decisions are made without access to reliable data and rely primarily on intuition or spreadsheets.', 'Real-time dashboards provide category managers and supply chain leaders with live KPI visibility; predictive analytics drive proactive decisions.'],
      },
      {
        q: 'How advanced is your use of AI and machine learning — including demand forecasting, supplier risk scoring, spend classification, anomaly detection, or generative AI for drafting?',
        anchors: ['No AI or machine learning tools are in use in procurement or supply chain; there is no active exploration of AI capabilities.', 'Multiple AI applications are live and driving measurable value: ML demand forecasting, AI supplier risk scoring, GenAI for RFQ drafting, and NLP contract review.'],
      },
      {
        q: 'How well-integrated are your supply chain and procurement technology systems (ERP, SRM, CLM, WMS, TMS) — and how reliably do they share data to support end-to-end visibility?',
        anchors: ['Systems are fragmented silos with no integration; data must be manually exported and reconciled across platforms.', 'A unified data architecture integrates all supply chain and procurement systems with real-time data sharing, single-source-of-truth reporting, and no manual reconciliation.'],
      },
      {
        q: 'How well does your technology roadmap support your supply chain strategy — with defined investments, clear business cases, and governance for prioritisation?',
        anchors: ['No technology roadmap exists for supply chain or procurement; technology decisions are reactive and driven by vendor relationships rather than strategy.', 'A 3-year technology roadmap is aligned to the supply chain strategy, approved at executive level, funded, and governed by a cross-functional steering committee.'],
      },
    ],
    recommendations: {
      Reactive: 'Deploy a basic e-procurement system as an immediate priority. Eliminate spreadsheet-based P2P processes and establish a central spend data repository.',
      Aware: 'Implement a spend analytics platform and build basic procurement dashboards. Develop a technology roadmap aligned to your procurement and supply chain strategy.',
      Defined: 'Integrate key systems (ERP, procurement, CLM) and deploy automated invoice processing. Begin piloting AI tools for demand forecasting or spend classification.',
      Managed: 'Expand AI/ML adoption to supplier risk monitoring and generative AI for RFQ drafting. Work toward a unified data platform for end-to-end supply chain visibility.',
      Optimised: 'Leverage agentic AI for autonomous procurement tasks in tail spend categories. Build proprietary data assets and analytics capabilities as a competitive differentiator.',
    },
  },
  {
    id: 'operations',
    title: 'Operational Excellence & Resiliency',
    shortTitle: 'Operations',
    icon: RefreshCw,
    color: '#0369A1',
    benchmarks: { gcc: 2.5, global: 3.0, best: 4.4 },
    questions: [
      {
        q: 'How effectively do you measure and actively manage inventory optimisation — including inventory turnover, safety stock logic, obsolescence, and working capital impact?',
        anchors: ['Inventory levels are not actively managed; ordering is based on habit or intuition with no formal inventory policy or stock optimisation model.', 'Inventory is managed dynamically using statistical safety stock models, with turnover targets by category, automated replenishment, and monthly obsolescence review.'],
      },
      {
        q: 'How mature is your demand forecasting capability — in terms of accuracy, method, granularity, and the integration of demand signals from sales, marketing, and customers?',
        anchors: ['Demand forecasting does not exist; orders are placed reactively when stock-outs occur or managers request replenishment.', 'Demand forecasting uses ML models incorporating internal sales history, external signals, and point-of-sale data, achieving forecast accuracy above 85% at SKU level.'],
      },
      {
        q: 'How well do you manage logistics performance — including carrier/3PL governance, on-time delivery measurement, cost-per-shipment analysis, and contract compliance?',
        anchors: ['Logistics performance is not measured; carrier selection is informal and there is no 3PL governance or performance management framework.', 'All logistics carriers and 3PLs are governed through formal SLA agreements with monthly KPI reviews, cost benchmarking, and defined corrective action processes.'],
      },
      {
        q: 'How effectively do you apply lean and continuous improvement principles — including waste identification, process standardisation, and cross-functional improvement projects — to supply chain operations?',
        anchors: ['Lean and continuous improvement are not practised; processes are rarely reviewed or improved and inefficiency is tolerated as normal.', 'A culture of continuous improvement is embedded: kaizen events run quarterly, process owners drive waste elimination, and improvement outcomes are tracked and shared company-wide.'],
      },
      {
        q: 'How resilient is your supply chain to disruption — measured by documented recovery time objectives, tested recovery plans, and proven ability to maintain service during adverse events?',
        anchors: ['The supply chain has no documented Recovery Time Objectives; disruptions lead to significant, prolonged service failures with no structured response.', 'Recovery Time Objectives are defined for all critical supply chain processes, tested annually, and the organisation has demonstrated the ability to maintain >95% service during past disruption events.'],
      },
    ],
    recommendations: {
      Reactive: 'Implement a basic inventory policy with minimum/maximum levels for all stock items. Introduce a simple demand planning process and start tracking on-time delivery from suppliers.',
      Aware: 'Deploy statistical safety stock modelling for your top 20% of SKUs. Introduce 3PL SLAs and begin monthly logistics performance reviews.',
      Defined: 'Implement formal demand sensing with customer input integration. Apply lean principles to your top 3 supply chain processes and establish recovery time objectives for critical flows.',
      Managed: 'Deploy ML-driven demand forecasting and automated replenishment. Implement a structured continuous improvement programme with cross-functional ownership.',
      Optimised: 'Operate a demand-driven supply chain with real-time customer signal integration. Build resilience metrics into executive reporting and customer SLA commitments.',
    },
  },
];

const MATURITY_LEVELS = [
  { label: 'Reactive',  min: 1.0, max: 1.9, color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  { label: 'Aware',    min: 2.0, max: 2.9, color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  { label: 'Defined',  min: 3.0, max: 3.9, color: '#EAB308', bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  { label: 'Managed',  min: 4.0, max: 4.4, color: '#22C55E', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  { label: 'Optimised',min: 4.5, max: 5.0, color: '#0B3D91', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
];

function getLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUESTIONNAIRE COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

type Phase = 'intro' | 'questions' | 'results';

export function Maturity() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [segIdx, setSegIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const scrollUp = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const totalQuestions = SEGMENTS.length * 5;
  const answeredCount = Object.keys(answers).length;
  const progress = answeredCount / totalQuestions;

  const setAnswer = (seg: number, q: number, val: number) => {
    setAnswers(prev => ({ ...prev, [`${seg}-${q}`]: val }));
  };

  const segScore = (seg: number) => {
    const vals = [0, 1, 2, 3, 4].map(q => answers[`${seg}-${q}`] ?? 0);
    const filled = vals.filter(v => v > 0);
    return filled.length === 5 ? filled.reduce((a, b) => a + b, 0) / 5 : null;
  };

  const currentSegComplete = () => [0, 1, 2, 3, 4].every(q => answers[`${segIdx}-${q}`]);

  const allComplete = SEGMENTS.every((_, i) => segScore(i) !== null);

  const handleNext = () => {
    if (segIdx < SEGMENTS.length - 1) {
      setSegIdx(s => s + 1);
      scrollUp();
    } else {
      setPhase('results');
      scrollUp();
    }
  };

  const handleBack = () => {
    if (segIdx > 0) {
      setSegIdx(s => s - 1);
      scrollUp();
    } else {
      setPhase('intro');
      scrollUp();
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSegIdx(0);
    setPhase('intro');
    scrollUp();
  };

  // Results data
  const radarData = SEGMENTS.map((seg, i) => ({
    segment: seg.shortTitle,
    'Your Score': +(segScore(i) ?? 0).toFixed(2),
    'GCC Average': seg.benchmarks.gcc,
    'Global Average': seg.benchmarks.global,
    'Best-in-Class': seg.benchmarks.best,
  }));

  const overallScore = SEGMENTS.reduce((sum, _, i) => sum + (segScore(i) ?? 0), 0) / SEGMENTS.length;
  const overallLevel = getLevel(overallScore);

  /* ── INTRO ─────────────────────────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <div ref={topRef} className="w-full">
        {/* Hero */}
        <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 280 }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
          <div className="relative z-10 container mx-auto px-4 py-16 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span className="text-accent font-bold text-sm uppercase tracking-widest">Maturity Diagnostic Model</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
              Supply Chain &amp; Procurement<br />Maturity Assessment
            </h1>
            <p className="text-white/75 text-base md:text-lg leading-relaxed">
              A structured 40-question diagnostic across 8 critical segments. Receive a benchmarked maturity score comparing your organisation to GCC peers, global averages, and best-in-class performers — with tailored recommendations.
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '8 Segments', sub: 'Full supply chain scope' },
                { label: '40 Questions', sub: '5 per segment' },
                { label: '3 Benchmarks', sub: 'GCC · Global · Best-in-Class' },
                { label: '~15 Minutes', sub: 'Complete assessment' },
              ].map(item => (
                <div key={item.label} className="text-center p-4 rounded-xl bg-muted">
                  <p className="text-2xl font-extrabold text-primary">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segments overview */}
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <h2 className="text-xl font-bold text-primary mb-6 text-center">What This Assessment Covers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {SEGMENTS.map((seg, i) => (
              <div key={seg.id} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl shadow-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                  <seg.icon className="w-4.5 h-4.5" style={{ color: seg.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary leading-tight">{seg.shortTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{seg.questions.length} questions</p>
                </div>
              </div>
            ))}
          </div>

          {/* Maturity scale legend */}
          <div className="bg-muted rounded-2xl p-6 mb-10">
            <h3 className="font-bold text-primary mb-4 text-center text-sm uppercase tracking-widest">Maturity Scale</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {MATURITY_LEVELS.map(l => (
                <div key={l.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${l.bg} ${l.border}`}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className={`text-sm font-bold ${l.text}`}>{l.label}</span>
                  <span className="text-xs text-muted-foreground">({l.min}–{l.max})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => { setPhase('questions'); scrollUp(); }}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-10 min-h-[52px] text-base shadow-lg"
            >
              Start Assessment <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <p className="text-muted-foreground text-sm mt-3">No account required · Results displayed instantly · Confidential</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── QUESTIONS ─────────────────────────────────────────────────────────── */
  if (phase === 'questions') {
    const seg = SEGMENTS[segIdx];
    const segComplete = currentSegComplete();

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen" style={{ scrollMarginTop: 80 }}>
        {/* Top progress bar */}
        <div className="sticky top-20 z-30 bg-white border-b border-border shadow-sm">
          <div className="h-1.5 bg-muted">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '20' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Segment {segIdx + 1} of {SEGMENTS.length}</p>
                <p className="font-bold text-primary text-sm">{seg.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold text-primary">{answeredCount}</span>/{totalQuestions} answered
            </div>
          </div>
          {/* Segment indicators */}
          <div className="container mx-auto px-4 pb-2.5 flex gap-1.5">
            {SEGMENTS.map((s, i) => {
              const score = segScore(i);
              const done = score !== null;
              const active = i === segIdx;
              return (
                <div
                  key={s.id}
                  title={s.shortTitle}
                  className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                    active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-25'
                  }`}
                  style={{ backgroundColor: active ? seg.color : done ? '#22C55E' : '#CBD5E1' }}
                  onClick={() => { setSegIdx(i); scrollUp(); }}
                />
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={segIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Segment header */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                  <seg.icon className="w-7 h-7" style={{ color: seg.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Segment {segIdx + 1}</p>
                  <h2 className="text-xl font-extrabold text-primary">{seg.title}</h2>
                </div>
              </div>

              {/* Questions */}
              {seg.questions.map((question, qi) => {
                const val = answers[`${segIdx}-${qi}`];
                return (
                  <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-4">
                    <div className="flex items-start gap-3 mb-5">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{qi + 1}</span>
                      <p className="font-semibold text-foreground text-sm leading-relaxed">{question.q}</p>
                    </div>

                    {/* Anchor descriptions */}
                    <div className="grid grid-cols-2 gap-3 mb-5 text-xs text-muted-foreground">
                      <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <p className="font-bold text-red-600 mb-1">Level 1 — Reactive</p>
                        <p>{question.anchors[0]}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="font-bold text-blue-700 mb-1">Level 5 — Optimised</p>
                        <p>{question.anchors[1]}</p>
                      </div>
                    </div>

                    {/* Scale buttons */}
                    <div className="flex gap-2">
                      {SCALE_LABELS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setAnswer(segIdx, qi, s.value)}
                          className={`flex-1 rounded-xl py-3 flex flex-col items-center gap-1 border-2 transition-all duration-200 ${
                            val === s.value
                              ? 'border-primary bg-primary text-white shadow-md scale-105'
                              : 'border-border bg-white hover:border-primary/50 hover:bg-primary/5'
                          }`}
                        >
                          <span className="text-lg font-extrabold leading-none">{s.value}</span>
                          <span className={`text-xs font-semibold leading-tight text-center hidden sm:block ${val === s.value ? 'text-white/90' : 'text-muted-foreground'}`}>{s.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 gap-4">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  {segIdx === 0 ? 'Intro' : 'Previous'}
                </Button>

                <div className="text-center">
                  {!segComplete && (
                    <p className="text-xs text-muted-foreground">Answer all 5 questions to continue</p>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!segComplete}
                  className={`gap-2 ${segIdx === SEGMENTS.length - 1 ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-white font-bold`}
                >
                  {segIdx === SEGMENTS.length - 1 ? (
                    <><Award className="w-4 h-4" /> View Results</>
                  ) : (
                    <>Next Segment <ChevronRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ── RESULTS ───────────────────────────────────────────────────────────── */
  return (
    <div ref={topRef} className="w-full">
      {/* Results hero */}
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Your Maturity Results</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Supply Chain &amp; Procurement Maturity Report</h1>
          <p className="text-white/70">Benchmarked against GCC peers, global averages, and best-in-class organisations.</p>

          {/* Overall score pill */}
          <div className="mt-8 inline-flex items-center gap-6 bg-white/10 rounded-3xl px-8 py-5 border border-white/20">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Overall Maturity Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold text-white">{overallScore.toFixed(1)}</span>
                <span className="text-white/50 text-xl">/5.0</span>
              </div>
            </div>
            <div className={`px-5 py-2 rounded-full text-lg font-extrabold ${overallLevel.bg} ${overallLevel.text} border-2 ${overallLevel.border}`}>
              {overallLevel.label}
            </div>
          </div>

          {/* Benchmark comparison strip */}
          <div className="mt-5 flex justify-center gap-6 flex-wrap text-sm">
            {[
              { label: 'vs GCC Average', value: (overallScore - 2.3).toFixed(1), positive: overallScore >= 2.3 },
              { label: 'vs Global Average', value: (overallScore - 2.8).toFixed(1), positive: overallScore >= 2.8 },
              { label: 'vs Best-in-Class', value: (overallScore - 4.4).toFixed(1), positive: overallScore >= 4.4 },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span className="text-white/60">{b.label}</span>
                <span className={`font-bold ${b.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {b.positive ? '+' : ''}{b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">Maturity Radar — 8-Segment Benchmark Comparison</h2>
          <p className="text-muted-foreground text-sm mb-6">Your scores plotted against GCC average, global average, and best-in-class benchmarks across all segments.</p>
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12, fontWeight: 600, fill: '#1E3A5F' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickCount={6} />
                <Radar name="Best-in-Class" dataKey="Best-in-Class" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
                <Radar name="Global Average" dataKey="Global Average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name="GCC Average" dataKey="GCC Average" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name="Your Score" dataKey="Your Score" stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.2} strokeWidth={2.5} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment bar chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">Segment Score Breakdown</h2>
          <p className="text-muted-foreground text-sm mb-6">Your score per segment compared to GCC average, global average, and best-in-class.</p>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="segment" tick={{ fontSize: 11, fontWeight: 600, fill: '#1E3A5F' }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Your Score" fill="#0B3D91" radius={[4, 4, 0, 0]} />
                <Bar dataKey="GCC Average" fill="#22C55E" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar dataKey="Global Average" fill="#94A3B8" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="Best-in-Class" fill="#C9A84C" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary">Full Benchmark Comparison</h2>
            <p className="text-muted-foreground text-sm mt-1">Segment-by-segment comparison across all four reference points.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3 font-bold text-primary">Segment</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">Your Score</th>
                  <th className="px-4 py-3 font-bold text-center text-green-700">GCC Avg</th>
                  <th className="px-4 py-3 font-bold text-center text-slate-600">Global Avg</th>
                  <th className="px-4 py-3 font-bold text-center" style={{ color: '#C9A84C' }}>Best-in-Class</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">Level</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map((seg, i) => {
                  const score = segScore(i) ?? 0;
                  const level = getLevel(score);
                  const vsGcc = score - seg.benchmarks.gcc;
                  const vsBest = score - seg.benchmarks.best;
                  return (
                    <tr key={seg.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                            <seg.icon className="w-3.5 h-3.5" style={{ color: seg.color }} />
                          </div>
                          <span className="font-semibold text-foreground">{seg.shortTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-extrabold text-primary text-base">{score.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-muted-foreground">{seg.benchmarks.gcc}</span>
                        <span className={`ml-1.5 text-xs font-bold ${vsGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {vsGcc >= 0 ? '+' : ''}{vsGcc.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-muted-foreground">{seg.benchmarks.global}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span style={{ color: '#C9A84C' }} className="font-medium">{seg.benchmarks.best}</span>
                        <span className="ml-1.5 text-xs font-bold text-muted-foreground">
                          ({vsBest.toFixed(1)})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>
                          {level.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td className="px-5 py-3.5 font-extrabold text-primary">Overall Average</td>
                  <td className="px-4 py-3.5 text-center font-extrabold text-primary text-base">{overallScore.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.30</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.84</td>
                  <td className="px-4 py-3.5 text-center font-semibold" style={{ color: '#C9A84C' }}>4.44</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${overallLevel.bg} ${overallLevel.text} border ${overallLevel.border}`}>
                      {overallLevel.label}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Per-segment recommendations */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-2">Segment-Level Recommendations</h2>
          <p className="text-muted-foreground text-sm mb-6">Tailored guidance for each segment based on your maturity level, from Ma'in Alhaqash MCIPS · CPSM.</p>
          <div className="grid md:grid-cols-2 gap-5">
            {SEGMENTS.map((seg, i) => {
              const score = segScore(i) ?? 0;
              const level = getLevel(score);
              const rec = seg.recommendations[level.label];
              const gapToBest = seg.benchmarks.best - score;
              const gapToGcc = score - seg.benchmarks.gcc;
              return (
                <div key={seg.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${level.border}`}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                      <seg.icon className="w-5 h-5" style={{ color: seg.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-sm">{seg.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-extrabold">{score.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">/5.0</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{level.label}</span>
                      </div>
                    </div>
                    {/* Mini score bar */}
                    <div className="flex-shrink-0 w-20">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(score / 5) * 100}%`, backgroundColor: level.color }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                        <span>0</span><span>5</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex gap-3 mb-3">
                      <span className={`text-xs font-bold ${gapToGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gapToGcc >= 0 ? '↑' : '↓'} {Math.abs(gapToGcc).toFixed(1)} vs GCC avg
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        ↑ {gapToBest.toFixed(1)} to best-in-class
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority action summary */}
        <div className="bg-[#082C6B] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">Priority Action Plan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {/* Lowest 3 segments */}
            {[...SEGMENTS]
              .map((seg, i) => ({ seg, i, score: segScore(i) ?? 0 }))
              .sort((a, b) => a.score - b.score)
              .slice(0, 3)
              .map((item, rank) => (
                <div key={item.seg.id} className="bg-white/10 rounded-2xl p-5 border border-white/15">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">{rank + 1}</span>
                    <span className="text-xs font-bold text-accent uppercase tracking-widest">Priority {rank + 1}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{item.seg.title}</h3>
                  <p className="text-white/60 text-xs">Score: {item.score.toFixed(2)} / 5.0 · {getLevel(item.score).label}</p>
                </div>
              ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                Discuss Results with Ma'in <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary font-bold px-8"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
