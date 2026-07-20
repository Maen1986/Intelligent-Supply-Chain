import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Award,
  TrendingUp, RotateCcw,
  GitBranch, ShoppingCart, FileText, Users, Shield, Leaf, Cpu, RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   DATA MODEL
═══════════════════════════════════════════════════════════════════════════ */

const SCALE_LABELS = [
  { value: 1, short: 'Reactive',   color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { value: 2, short: 'Aware',      color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { value: 3, short: 'Defined',    color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A' },
  { value: 4, short: 'Managed',    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 5, short: 'Optimised',  color: '#0B3D91', bg: '#EFF6FF', border: '#BFDBFE' },
];

interface Question {
  q: string;
  /** Criteria for levels 1–5 (index 0 = level 1) */
  levels: [string, string, string, string, string];
}

interface Segment {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  color: string;
  questions: Question[];
  benchmarks: { gcc: number; global: number; best: number };
  recommendations: Record<string, string>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENTS — 8 × 5 questions, each question with 5 explicit level criteria
═══════════════════════════════════════════════════════════════════════════ */

const SEGMENTS: Segment[] = [
  /* ── 1. STRATEGY ───────────────────────────────────────────────────────── */
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
        levels: [
          'No formal strategy exists. Decisions are made reactively based on immediate operational pressures with no documented direction.',
          'A basic supply chain direction exists but is informal, undocumented, and not explicitly linked to corporate objectives.',
          'A documented supply chain strategy exists, is aligned to corporate goals, and is communicated to key stakeholders.',
          'The strategy is formally approved, reviewed annually, tracked against KPIs, and adjusted based on performance data and market changes.',
          'A board-approved, comprehensive supply chain strategy drives capital allocation decisions, is reviewed annually, and is a core input to corporate planning cycles.',
        ],
      },
      {
        q: 'How regularly do you conduct end-to-end supply chain network design reviews, including footprint, transportation lanes, and distribution models?',
        levels: [
          'The supply chain network has never been formally mapped or evaluated for optimisation opportunities.',
          'Informal reviews occur reactively when problems arise; no structured methodology, tools, or defined scope is applied.',
          'Periodic network reviews are conducted with defined scope, though infrequently (every 3–5 years) and without advanced modelling tools.',
          'Annual network design reviews use quantitative modelling to evaluate trade-offs across cost, service level, and risk dimensions.',
          'Bi-annual reviews use digital twin modelling and multi-scenario simulation to continuously optimise the end-to-end network footprint.',
        ],
      },
      {
        q: 'How mature is your Sales & Operations Planning (S&OP) or Integrated Business Planning (IBP) process across finance, sales, operations, and supply chain?',
        levels: [
          'No S&OP process exists. Demand and supply plans are siloed within individual departments with no cross-functional alignment.',
          'Basic S&OP meetings occur but attendance is inconsistent, inputs are unreliable, and outputs are rarely translated into operational actions.',
          'A monthly S&OP cycle is established with defined inputs from sales, operations, and supply chain and consistent meeting cadence.',
          'S&OP includes financial reconciliation, executive review, and consistently drives near-term operational and procurement decisions.',
          'A fully integrated IBP process runs monthly with executive engagement, real-time demand sensing, and direct linkage to financial forecasting and capital allocation.',
        ],
      },
      {
        q: 'How effectively do you use scenario planning and supply chain simulation to evaluate strategic options (e.g., nearshoring, new markets, disruptions)?',
        levels: [
          'No scenario planning is conducted. Major strategic decisions rely entirely on intuition and past experience.',
          'Informal "what-if" discussions occur but are undocumented, inconsistent, and not used to formally drive decisions.',
          'Basic scenario planning is applied to major decisions using spreadsheet-based analysis with limited variables modelled.',
          'Structured scenario planning with quantified financial and operational outcomes is embedded in annual strategic planning cycles.',
          'Advanced simulation tools model multiple scenarios with quantified risk and opportunity outcomes before every major strategic supply chain decision.',
        ],
      },
      {
        q: 'How well are supply chain KPIs defined, cascaded to teams, and tracked against targets with clear ownership and accountability?',
        levels: [
          'No KPIs are defined for supply chain performance. There is no formal measurement framework or performance reporting.',
          'A few high-level metrics exist but are inconsistently tracked, rarely reviewed in structured forums, and not linked to accountability.',
          'A defined set of supply chain KPIs is tracked regularly and reported to management monthly with basic ownership assigned.',
          'KPIs are cascaded to team level with clearly assigned owners, reviewed in weekly/monthly cadences, and trigger action when breached.',
          'A comprehensive KPI framework is cascaded across all levels, reviewed in weekly operational meetings, and linked to individual performance incentives and rewards.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Immediate priority: commission a current-state supply chain mapping exercise and develop a 3-year strategic roadmap. Engage a senior supply chain advisor to facilitate the process.',
      Aware:     'Formalise your S&OP process and establish a small set of headline KPIs. Conduct a network design review within the next 6 months.',
      Defined:   'Elevate S&OP to IBP by integrating financial planning. Introduce scenario planning tools and annual network design reviews with quantified outcomes.',
      Managed:   'Implement advanced analytics and digital twin capabilities for network modelling. Link supply chain strategy metrics directly to executive compensation.',
      Optimised: 'Benchmark against global peers and identify where you can leverage your supply chain as a competitive differentiator and a source of revenue growth.',
    },
  },

  /* ── 2. PROCUREMENT ─────────────────────────────────────────────────────── */
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
        levels: [
          'No category management exists. All spend categories are managed reactively using identical, tactical approaches regardless of strategic value.',
          'A few high-spend categories are managed with basic plans, but the approach is inconsistent, informal, and lacks market intelligence.',
          'Category management is applied to major spend areas with documented strategies, defined ownership, and basic supplier analysis.',
          'Category plans cover all significant spend, are updated annually, and include market intelligence, strategic objectives, and supplier segmentation.',
          'All spend is managed through structured category plans with market intelligence, multi-year strategies, dedicated category managers, and regular stakeholder governance.',
        ],
      },
      {
        q: 'How consistently do you apply formal strategic sourcing methodology (RFQ, RFP, e-auctions, multi-criteria evaluation) when selecting or renewing suppliers?',
        levels: [
          'Supplier selection is informal and based on existing relationships or convenience. No defined sourcing process or evaluation criteria exists.',
          'Competitive quotes are sought for some purchases but the process is inconsistent, undocumented, and lacks formal evaluation criteria.',
          'A defined sourcing process with RFQ/RFP templates and multi-criteria evaluation is applied to major spend decisions.',
          'Strategic sourcing methodology is consistently applied to all significant spend, with documented award decisions and structured post-award reviews.',
          'All significant spend decisions follow a rigorous multi-stage sourcing process with documented criteria, competitive tension, audit trails, and lessons-learned capture.',
        ],
      },
      {
        q: 'How advanced and frequently refreshed is your spend analysis capability — including spend classification, maverick spend detection, and savings opportunity identification?',
        levels: [
          'Spend data is not centrally available or analysed. The organisation does not know what it buys, from whom, or at what price.',
          'Basic spend reports are produced periodically but data quality is poor, classification is incomplete, and insights are rarely acted upon.',
          'Spend analysis is conducted at least quarterly, covering the majority of spend with reasonable classification accuracy and basic trend reporting.',
          'Spend analytics are automated and run monthly, classifying 80%+ of spend, identifying maverick purchasing, and surfacing top savings opportunities.',
          'Real-time spend analytics classify 95%+ of spend, automatically flag maverick purchasing, and surface savings opportunities continuously for all category managers.',
        ],
      },
      {
        q: 'How effectively do you apply Total Cost of Ownership (TCO) analysis — including quality, logistics, risk, and lifecycle costs — in sourcing decisions rather than purchase price alone?',
        levels: [
          'All sourcing decisions are based on unit purchase price only. Hidden costs, quality implications, and lifecycle costs are never considered.',
          'Some consideration of additional costs (e.g., logistics or import duties) is made informally, but no structured TCO model or methodology is applied.',
          'TCO analysis is applied to strategic categories using a defined model that accounts for quality, logistics, risk, and total lifecycle costs.',
          'TCO is consistently applied across all significant sourcing decisions, with documented models reviewed in governance and reported to stakeholders.',
          'TCO models are applied to all strategic categories, and sourcing decisions routinely demonstrate 10–25% additional value beyond purchase price alone.',
        ],
      },
      {
        q: 'How effectively does your procurement function operate against defined savings targets, track realised savings, and demonstrate value delivered to the business?',
        levels: [
          'Procurement has no savings targets and does not track, validate, or report cost savings or value delivered to the business.',
          'Savings are recorded informally for some projects but methodology is inconsistent, finance does not validate, and reporting is ad-hoc.',
          'A savings tracking process exists, distinguishes cost avoidance from hard savings, and is reported to management quarterly.',
          'Savings are tracked rigorously against annual targets, validated by finance, clearly categorised, and reported to leadership monthly.',
          'Procurement operates a rigorous savings pipeline, distinguishes hard and soft savings, validates with finance, and reports monthly against a board-approved annual target.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Urgently implement a spend analysis exercise across all categories. Establish a basic sourcing policy and define a minimum procurement process for competitive tendering above a value threshold.',
      Aware:     'Implement category management for your top 5 spend categories. Build a savings tracking mechanism and begin applying TCO in all strategic sourcing decisions.',
      Defined:   'Extend category management to all significant spend. Introduce e-sourcing tools for competitive tendering and automate spend classification with analytics software.',
      Managed:   'Deploy advanced analytics and AI-powered spend intelligence. Implement a procurement performance scorecard tied to business outcomes beyond cost savings.',
      Optimised: 'Shift procurement\'s value proposition from cost to value creation — innovation sourcing, supply chain sustainability, and supplier-led R&D should be priority activities.',
    },
  },

  /* ── 3. CLM ─────────────────────────────────────────────────────────────── */
  {
    id: 'contracts',
    title: 'Contract Lifecycle Management',
    shortTitle: 'CLM',
    icon: FileText,
    color: '#0B6E4F',
    benchmarks: { gcc: 2.0, global: 2.7, best: 4.4 },
    questions: [
      {
        q: 'How effectively do you manage the full contract lifecycle — from initiation and drafting through approval, execution, obligation tracking, and renewal or expiry?',
        levels: [
          'Contracts are drafted ad-hoc with no standard templates, no defined approval workflow, and no post-signature tracking or obligation management.',
          'Standard templates exist for some common contract types but approval processes are informal and post-signature tracking is largely absent.',
          'A defined contract process covers initiation, approval, and basic post-signature tracking for material contracts with clear roles assigned.',
          'A structured CLM process manages the full lifecycle with defined roles, approval thresholds, obligation registers, and milestone tracking.',
          'A fully automated CLM platform manages the complete lifecycle with AI-assisted drafting, e-signature, real-time obligation tracking, and automated renewal alerts.',
        ],
      },
      {
        q: 'Do you have a centralised, searchable contract repository with metadata tagging, milestone alerts, and role-based access for all active contracts?',
        levels: [
          'Contracts are stored in personal email folders or physical filing cabinets. There is no central repository or consistent filing system.',
          'A shared folder or basic digital storage exists but is incomplete, inconsistently used, unsearchable, and lacks access controls.',
          'A centralised digital repository holds most active contracts with basic metadata, controlled access, and manual expiry reminders.',
          'A structured repository holds all contracts with expiry alerts, obligation calendars, reliable full-text search, and role-based access controls.',
          'A structured digital repository holds 100% of contracts with automated expiry alerts, obligation calendars, full-text search, and role-based access — zero contracts in personal storage.',
        ],
      },
      {
        q: 'How consistently are contract obligations, SLAs, and performance KPIs tracked and enforced post-signature, and how quickly are breaches identified and escalated?',
        levels: [
          'Contract terms are largely forgotten once signed. Supplier SLAs and obligations are never monitored and breaches go undetected until a crisis occurs.',
          'Key obligations are noted at contract signing but monitoring relies on manual follow-up and is inconsistent across contracts and teams.',
          'A basic obligation tracking process monitors major SLAs and generates alerts for approaching milestones or known contract breaches.',
          'All material obligations are tracked systematically, with defined escalation paths, monthly compliance reporting, and documented breach resolution.',
          'All obligations are tracked in real time against supplier performance data, with automated alerts on any breach and a defined multi-level escalation process.',
        ],
      },
      {
        q: 'How structured is your contract negotiation process, including use of a commercial playbook, fallback positions, red-line authority, and lessons learned capture?',
        levels: [
          'Negotiation is conducted informally based on individual style and personal judgement. No playbook, authority matrix, or structured framework exists.',
          'Some negotiation guidance exists but is not consistently applied, outcomes are not documented, and lessons learned are not captured systematically.',
          'A basic negotiation framework with pre-approved positions and defined authority thresholds is used for material contracts.',
          'A commercial playbook with fallback positions and red-line authority is consistently applied to significant contracts, and outcomes are centrally documented.',
          'A commercial negotiation playbook with pre-approved fallback positions and red-line authority is used on all material contracts, with outcomes and lessons learned captured centrally and applied to future negotiations.',
        ],
      },
      {
        q: 'How proactively do you manage contract renewals, renegotiations, and exits — including market testing, benchmarking, and leveraging competitive tension at renewal?',
        levels: [
          'Most contracts auto-renew on existing terms without review. Procurement is not involved until a crisis or significant problem has already arisen.',
          'Some renewals are reviewed but without consistent lead time, structured market benchmarking, or deliberate competitive tension.',
          'A renewals list is maintained with defined review lead times, and major renewals are subject to market testing and some negotiation.',
          'A rolling renewal pipeline is actively managed with structured benchmarking, formal negotiation, and competitive tension applied to all significant contracts.',
          'A rolling 12-month renewal pipeline ensures every contract involving significant spend undergoes market benchmarking, competitive tension, and formal commercial negotiation before renewal.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Implement a basic contract register immediately. Define standard contract templates for your most common agreement types and establish minimum approval workflows.',
      Aware:     'Deploy a CLM system to centralise contracts and automate expiry alerts. Train procurement and legal on contract fundamentals and negotiation basics.',
      Defined:   'Activate full obligation tracking and SLA monitoring. Build a commercial negotiation playbook and implement a structured renewal pipeline management process.',
      Managed:   'Implement AI-powered contract analytics for risk identification, obligation extraction, and spend commitment tracking. Integrate CLM with ERP for spend commitments.',
      Optimised: 'Deploy predictive contract risk scoring and leverage contract data as a strategic intelligence source for sourcing decisions and supplier performance management.',
    },
  },

  /* ── 4. SRM ─────────────────────────────────────────────────────────────── */
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
        levels: [
          'All suppliers are treated identically regardless of spend, strategic importance, or risk profile. No segmentation model exists.',
          'Informal differentiation exists (e.g., key suppliers are known informally) but no structured segmentation criteria or documented model has been applied.',
          'A basic segmentation model (strategic / preferred / transactional) is defined and applied to major suppliers with differentiated management approaches.',
          'All suppliers above defined spend or risk thresholds are formally segmented using multi-factor criteria, with clearly differentiated governance for each tier.',
          'All suppliers are formally segmented using a multi-factor model (spend, risk, strategic importance) with differentiated management programmes, governance cadences, and investment levels for each tier.',
        ],
      },
      {
        q: 'How regularly do you conduct structured, two-way supplier performance reviews using defined scorecards covering quality, delivery, commercial, and relationship dimensions?',
        levels: [
          'Supplier performance is never formally reviewed. Issues are only addressed reactively when they escalate into operational crises.',
          'Informal feedback is given to suppliers occasionally but without structured scorecards, defined review cycles, or documented outcomes.',
          'Structured performance reviews occur at least annually for strategic suppliers using defined metrics covering quality, delivery, and commercial performance.',
          'Quarterly performance reviews with balanced scorecards are conducted for strategic and preferred suppliers, with improvement action plans tracked to closure.',
          'Strategic suppliers receive quarterly formal performance reviews with balanced scorecards, executive sponsorship, defined improvement action plans, and tracked outcomes shared with the supplier.',
        ],
      },
      {
        q: 'How actively do you invest in supplier development — including training, capability-building, technology access, and collaborative problem-solving — to improve supplier performance?',
        levels: [
          'No investment is made in supplier development. The organisation expects suppliers to self-improve without any support or structured engagement.',
          'Occasional ad-hoc support is provided to struggling suppliers but there is no structured programme, budget allocation, or measured outcomes.',
          'A basic supplier development programme exists for strategic suppliers with targeted capability-building initiatives and defined objectives.',
          'A funded supplier development programme covers all strategic suppliers with defined objectives, investment commitments, and measured performance improvement outcomes.',
          'A funded supplier development programme actively builds strategic supplier capability across multiple dimensions, with measured improvement in performance and innovation output tracked annually.',
        ],
      },
      {
        q: 'How effectively do you collaborate with strategic suppliers on innovation, joint product development, cost reduction, and shared value creation beyond transactional buying?',
        levels: [
          'Supplier relationships are purely transactional. Innovation and collaboration are not actively pursued with any supplier in any category.',
          'Collaboration occurs informally with a few suppliers based on individual relationships, but it is not systematically managed or measured.',
          'Collaborative initiatives are defined for strategic suppliers, including occasional joint problem-solving and structured cost reduction projects.',
          'Joint business plans with strategic suppliers include formal innovation objectives, shared investment commitments, and annual performance reviews with quantified outcomes.',
          'Strategic suppliers participate in joint innovation sessions, are involved early in NPD processes, and contribute measurable innovation value — tracked and reported annually.',
        ],
      },
      {
        q: 'How mature is your supplier onboarding, qualification, and exit process — including financial vetting, ESG compliance, capability assessment, and risk scoring?',
        levels: [
          'Supplier onboarding is entirely informal. New suppliers are added to the system without any formal qualification, vetting, or risk assessment.',
          'A basic qualification checklist exists but is inconsistently applied and does not systematically cover ESG compliance or financial risk.',
          'A structured onboarding process covers legal, financial, and quality requirements for all new suppliers above a defined spend threshold.',
          'All new suppliers complete a comprehensive qualification covering financial health, ESG compliance, operational capacity, and risk scoring before approval.',
          'A rigorous, gated qualification process covering financial health, ESG compliance, capacity, and risk scoring governs all new supplier approvals. Exit protocols are equally structured and documented.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Define your top 20 suppliers by spend and risk. Introduce a basic supplier scorecard and schedule quarterly reviews. Formalise supplier qualification for all new additions.',
      Aware:     'Implement a three-tier supplier segmentation model. Develop scorecards for strategic and preferred suppliers and begin investing in 2–3 strategic supplier development initiatives.',
      Defined:   'Build a formal SRM programme with dedicated relationship managers for strategic suppliers. Introduce joint business plans for top 10 suppliers and an innovation forum.',
      Managed:   'Deploy a digital SRM platform with real-time performance dashboards. Expand supplier collaboration to joint cost modelling, demand visibility sharing, and co-innovation.',
      Optimised: 'Position your supply base as a strategic competitive asset. Lead supplier innovation ecosystems and co-invest in supplier capability as a growth strategy.',
    },
  },

  /* ── 5. RISK ────────────────────────────────────────────────────────────── */
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
        levels: [
          'No formal risk mapping has been conducted. The organisation has little to no visibility of supply chain risk below its tier-1 suppliers.',
          'A basic list of key suppliers exists but risk exposure, concentration, geographic risk, and single-source dependencies are not formally assessed.',
          'A risk map covers critical tier-1 suppliers with identified risk types and basic concentration analysis, though tier-2 visibility is limited.',
          'Risk mapping covers all critical suppliers at tier-1 and most at tier-2, with quantified risk scores, concentration analysis, and geographic heat mapping.',
          'A live risk map covers all critical suppliers to tier-2, with quantified risk scores, concentration analysis, geographic disruption modelling, and automated refresh of underlying data.',
        ],
      },
      {
        q: 'How actively do you monitor supply chain risks in real time — including supplier financial health, geopolitical events, ESG risk signals, and capacity constraints?',
        levels: [
          'Risk monitoring is entirely reactive. The organisation only becomes aware of supplier risk after a disruption has already occurred and caused impact.',
          'Occasional manual checks (e.g., ad-hoc news searches) are made for a handful of key suppliers but there is no systematic monitoring programme.',
          'Key risk indicators are tracked periodically for critical suppliers using manual processes, available financial data, and industry news sources.',
          'A risk monitoring tool provides alerts on supplier financial health, news events, and capacity changes for all critical and strategic suppliers.',
          'An AI-powered risk monitoring platform continuously scans supplier financial data, news feeds, ESG signals, and geopolitical risk indices — generating proactive, prioritised alerts.',
        ],
      },
      {
        q: 'How robust are your business continuity and supply chain resilience plans, including documented alternative sourcing options, inventory buffers, and recovery time objectives?',
        levels: [
          'No business continuity plans exist for supply chain. There are no documented recovery options for a major supplier failure or disruption event.',
          'Some informal workarounds for common disruptions are known but are not documented, tested, and responsibility for activation is unclear.',
          'Business continuity plans exist for the most critical supply chain risks, are documented, and reviewed annually though not yet tested through simulation.',
          'BCPs cover all critical categories, include identified and qualified alternative suppliers, defined inventory buffer policies, and are reviewed at least annually.',
          'Comprehensive BCPs exist for all critical supply chain risks, tested annually through live simulations, with pre-qualified alternative suppliers and documented activation protocols.',
        ],
      },
      {
        q: 'How effectively do you apply dual-sourcing or multi-sourcing strategies for critical categories, and how regularly do you validate the independence and capability of contingency sources?',
        levels: [
          'Many critical categories have a single source of supply with no validated alternative. Single-source dependency is not tracked or actively managed.',
          'Some dual-sourcing exists for the most critical items, but alternatives are often unqualified, have untested capacity, and are not maintained as live options.',
          'Dual-sourcing is in place for the highest-risk categories, with qualified alternatives, documented contingency pricing, and periodic capacity validation.',
          'All critical categories operate on a dual or multi-source model with pre-qualified capacity and sourcing independence validated through annual supplier audits.',
          'All critical categories operate on a dual or multi-source model with pre-negotiated contingency pricing, validated capacity, and a quarterly independence audit to confirm alternatives remain credible.',
        ],
      },
      {
        q: 'How regularly do you conduct supply chain risk exercises, stress tests, or tabletop simulations — and how quickly are findings translated into plan updates and mitigations?',
        levels: [
          'Risk plans have never been tested. The organisation has never conducted a supply chain stress test, tabletop simulation, or disruption exercise.',
          'Informal discussions about risk scenarios occur occasionally but are not structured, documented, assigned to owners, or formally actioned.',
          'A structured tabletop exercise or formal risk review is conducted annually, with findings documented and used to update contingency plans.',
          'Annual stress-test exercises simulate specific disruption scenarios, with executive review and findings translated into actionable plan updates within 60 days.',
          'Annual supply chain stress-test exercises simulate multiple disruption scenarios, are reviewed at board level, and findings are translated into specific plan updates within 30 days.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Immediately map all single-source dependencies in critical categories. Develop a basic business continuity framework and identify at least one alternative source per critical item.',
      Aware:     'Implement a structured risk register for supply chain risks. Begin dual-sourcing the top 5 highest-risk single-source categories and qualify contingency suppliers.',
      Defined:   'Deploy a supplier risk monitoring tool. Formalise BCPs for all critical categories and conduct your first tabletop simulation exercise.',
      Managed:   'Implement real-time AI-powered risk monitoring. Extend dual-sourcing to all critical categories and begin tier-2 supply chain risk mapping with strategic suppliers.',
      Optimised: 'Leverage predictive analytics to anticipate disruptions before they occur. Build supply chain resilience as a competitive differentiator communicated to customers.',
    },
  },

  /* ── 6. ESG ─────────────────────────────────────────────────────────────── */
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
        levels: [
          'Scope 3 emissions have not been measured or estimated. The organisation has no visibility of its supply chain carbon footprint.',
          'A basic Scope 3 estimate has been made using a spend-based methodology but coverage is limited and data quality is poor.',
          'Scope 3 emissions are measured for major spend categories using a recognised methodology with reasonable data quality and coverage.',
          'Scope 3 emissions are measured to 70%+ spend coverage, disclosed internally, and a quantified reduction target has been set and communicated.',
          'Scope 3 emissions are measured to >80% spend coverage using GHG Protocol methodology, publicly disclosed, and actively reduced through a structured supplier engagement programme.',
        ],
      },
      {
        q: 'How systematically are ESG and sustainability criteria integrated into your supplier selection, evaluation, and sourcing decisions?',
        levels: [
          'ESG is not a factor in any supplier selection or sourcing decision. Cost and quality are the only evaluation criteria applied.',
          'ESG is referenced in supplier questionnaires or communications but carries no formal weighting in evaluation scoring or award decisions.',
          'ESG criteria are included in supplier evaluations with a defined minimum weighting applied to major sourcing decisions.',
          'ESG performance influences supplier tiering and contract renewal decisions across all significant spend categories.',
          'ESG criteria carry a defined weighting (15–25%) in all supplier evaluations, and ESG performance directly influences supplier tiering and contract award decisions.',
        ],
      },
      {
        q: 'How actively do you require, verify, and support supplier ESG compliance — including codes of conduct, audit programmes, and supplier capacity-building?',
        levels: [
          'No ESG requirements are placed on suppliers. No code of conduct, audit programme, or disclosure requirement of any kind exists.',
          'A supplier code of conduct exists but is not consistently distributed, enforced, audited, or used to drive supplier management decisions.',
          'All significant suppliers are required to sign a code of conduct, with self-assessment questionnaires used to monitor basic compliance.',
          'ESG compliance requirements are contractualised and high-risk suppliers are subject to third-party audits with documented corrective action plans.',
          'All suppliers above a spend threshold sign a mandatory ESG code of conduct, are audited against it, and high-risk suppliers receive structured improvement support and follow-up.',
        ],
      },
      {
        q: 'How mature is your circular procurement practice — including specifications for recycled content, take-back requirements, product lifecycle design, and waste reduction?',
        levels: [
          'Circular economy principles have no influence on procurement specifications, supplier requirements, or purchasing decisions of any kind.',
          'Awareness of circular procurement exists within the team but no formal policies, specifications, or supplier requirements have been implemented.',
          'Circular procurement criteria (e.g., minimum recycled content) are applied to a limited number of categories or pilot projects.',
          'Circular procurement is embedded in category strategies for most major spend areas, with measurable KPIs tracked and reported.',
          'Circular procurement criteria are embedded in all category strategies, with minimum recycled content specified, take-back requirements contractualised, and waste KPIs tracked and published.',
        ],
      },
      {
        q: 'How transparently and comprehensively do you report supply chain sustainability performance to internal and external stakeholders, including customers, regulators, and investors?',
        levels: [
          'No supply chain sustainability reporting is produced. ESG performance is not tracked, measured, or disclosed to any stakeholder.',
          'Basic internal ESG data is collected but it is not structured, not verified, and not reported against any recognised framework.',
          'Internal sustainability reporting covering key supply chain metrics is produced annually, though not yet externally disclosed or independently assured.',
          'Supply chain sustainability performance is reported publicly against a recognised framework (GRI or equivalent), with key metrics disclosed to investors and regulators.',
          'An annual supply chain sustainability report is published against GRI, SASB, or TCFD, aligned to regulatory requirements, independently assured, and shared proactively with all key stakeholders.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Start with a Scope 3 emissions estimation using spend-based methodology. Introduce a basic supplier ESG questionnaire for your top 20 suppliers by spend.',
      Aware:     'Adopt a Supplier Code of Conduct covering human rights, environment, and governance. Begin integrating ESG criteria (10% weighting minimum) into sourcing evaluations.',
      Defined:   'Implement a supplier ESG audit programme for high-risk suppliers. Set quantified Scope 3 reduction targets and align to Saudi CMA ESG disclosure requirements.',
      Managed:   'Deploy a supplier sustainability platform for real-time ESG data collection. Develop a circular procurement policy and integrate ESG KPIs into supplier scorecards.',
      Optimised: 'Lead supply chain ESG transparency with externally assured reporting. Use ESG leadership as a competitive advantage in public sector and international tender qualification.',
    },
  },

  /* ── 7. DIGITAL ─────────────────────────────────────────────────────────── */
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
        levels: [
          'The P2P process is largely manual (paper, email, spreadsheets). There is no e-procurement system and no digital workflow in use.',
          'Some steps are partially digitised (e.g., electronic POs) but the overall process requires significant manual intervention and data re-entry.',
          'An e-procurement system is in use for most purchase types with basic workflow automation and reasonable spend visibility.',
          'The P2P process is largely automated with e-catalogues, 3-way matching, and automated invoice processing achieving 70%+ touchless processing rates.',
          'The P2P process is fully automated with e-catalogues, 3-way matching, automated invoice processing, and real-time spend visibility — achieving >95% touchless processing.',
        ],
      },
      {
        q: 'How effectively do you use data analytics, dashboards, and business intelligence tools to support procurement and supply chain decision-making?',
        levels: [
          'Reporting is manual and infrequent. Decisions are made without reliable data and rely primarily on intuition, experience, or spreadsheets.',
          'Basic reports are produced periodically but are manually compiled, often out of date, and not consistently used in structured decision-making.',
          'Standard procurement and supply chain dashboards are available and used regularly for performance monitoring and management reporting.',
          'Real-time dashboards provide category managers and supply chain leaders with live KPI visibility updated daily or more frequently, driving proactive actions.',
          'Real-time dashboards provide live KPI visibility to all relevant roles; predictive analytics surface issues and opportunities before they materialise in operational outcomes.',
        ],
      },
      {
        q: 'How advanced is your use of AI and machine learning — including demand forecasting, supplier risk scoring, spend classification, anomaly detection, or generative AI for drafting?',
        levels: [
          'No AI or machine learning tools are in use in procurement or supply chain. There is no active exploration or roadmap for AI adoption.',
          'AI/ML is being explored or piloted in one area but no live applications are delivering measurable, sustained value to the business.',
          'One or two AI applications are live (e.g., automated spend classification or basic demand forecasting) and delivering measurable improvement.',
          'Multiple AI applications are live across procurement and supply chain, with clear ROI demonstrated against baselines and a defined roadmap for expansion.',
          'Multiple AI applications drive measurable value: ML demand forecasting, AI supplier risk scoring, GenAI for RFQ drafting, and NLP contract review are all live and integrated.',
        ],
      },
      {
        q: 'How well-integrated are your supply chain and procurement technology systems (ERP, SRM, CLM, WMS, TMS) — and how reliably do they share data to support end-to-end visibility?',
        levels: [
          'Systems are completely fragmented silos with no integration. Data must be manually exported and reconciled across platforms on a regular basis.',
          'Some point-to-point integrations exist between key systems but data flows are incomplete, unreliable, and require frequent manual intervention.',
          'Core systems (ERP and procurement) share data through basic integration, enabling consolidated reporting for key processes.',
          'Most supply chain and procurement systems are integrated with automated data sharing and near-real-time reporting available across functions.',
          'A unified data architecture integrates all supply chain and procurement systems with real-time data sharing, single-source-of-truth reporting, and zero manual reconciliation required.',
        ],
      },
      {
        q: 'How well does your technology roadmap support your supply chain strategy — with defined investments, clear business cases, and governance for prioritisation?',
        levels: [
          'No technology roadmap exists for supply chain or procurement. Technology decisions are reactive and driven by vendor relationships rather than strategy.',
          'An informal technology wish-list exists but has no approved business case, allocated budget, or governance framework to prioritise investment.',
          'A technology roadmap is documented, aligned to the supply chain strategy, and reviewed at least annually by management.',
          'A funded technology roadmap with approved business cases is governed by a cross-functional steering committee and actively tracked against milestones.',
          'A 3-year technology roadmap aligned to the supply chain strategy is approved at executive level, fully funded, and governed by a cross-functional steering committee with quarterly progress reviews.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Deploy a basic e-procurement system as an immediate priority. Eliminate spreadsheet-based P2P processes and establish a central spend data repository.',
      Aware:     'Implement a spend analytics platform and build basic procurement dashboards. Develop a technology roadmap aligned to your procurement and supply chain strategy.',
      Defined:   'Integrate key systems (ERP, procurement, CLM) and deploy automated invoice processing. Begin piloting AI tools for demand forecasting or spend classification.',
      Managed:   'Expand AI/ML adoption to supplier risk monitoring and generative AI for RFQ drafting. Work toward a unified data platform for end-to-end supply chain visibility.',
      Optimised: 'Leverage agentic AI for autonomous procurement tasks in tail spend categories. Build proprietary data assets and analytics capabilities as a competitive differentiator.',
    },
  },

  /* ── 8. OPERATIONS ──────────────────────────────────────────────────────── */
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
        levels: [
          'Inventory levels are not actively managed. Ordering is based on habit or intuition with no formal inventory policy or stock optimisation model.',
          'Basic inventory targets (min/max levels) exist for some items but are not validated against actual demand patterns or regularly reviewed.',
          'A formal inventory policy defines safety stock levels for key SKUs, with regular stock reviews and defined replenishment triggers in place.',
          'Statistical safety stock models are applied to all significant SKUs, with regular turnover reviews, automated replenishment for fast-movers, and obsolescence tracked.',
          'Inventory is managed dynamically using statistical safety stock models, with turnover targets by category, automated replenishment, and monthly obsolescence reviews linked to write-off decisions.',
        ],
      },
      {
        q: 'How mature is your demand forecasting capability — in terms of accuracy, method, granularity, and integration of demand signals from sales, marketing, and customers?',
        levels: [
          'Demand forecasting does not exist. Orders are placed reactively when stock-outs occur or managers manually request replenishment.',
          'Basic forecasting is performed using historical sales averages or simple trending, without input from sales, marketing, or customers.',
          'A formal demand planning process runs monthly, incorporating sales input and historical data with defined forecast accuracy targets.',
          'Demand forecasting uses statistical models integrating multiple internal demand signals, with accuracy measured, reviewed, and continuously improved.',
          'Demand forecasting uses ML models incorporating internal sales history, external market signals, and point-of-sale data, achieving forecast accuracy above 85% at SKU level.',
        ],
      },
      {
        q: 'How well do you manage logistics performance — including carrier/3PL governance, on-time delivery measurement, cost-per-shipment analysis, and contract compliance?',
        levels: [
          'Logistics performance is not measured. Carrier selection is informal and there is no 3PL governance or performance management framework of any kind.',
          'Some KPIs (e.g., on-time delivery) are tracked informally for primary carriers, but reviews are infrequent, undocumented, and not linked to consequences.',
          'Formal SLA agreements exist for key logistics providers, with defined KPIs tracked and reviewed at least quarterly against contracted terms.',
          'All logistics carriers and 3PLs are governed through SLA agreements with monthly performance reviews, cost benchmarking, and documented corrective action processes.',
          'All logistics carriers and 3PLs are governed through formal SLA agreements with monthly KPI reviews, market rate benchmarking, and defined corrective action and exit protocols.',
        ],
      },
      {
        q: 'How effectively do you apply lean and continuous improvement principles — including waste identification, process standardisation, and cross-functional improvement projects — to supply chain operations?',
        levels: [
          'Lean and continuous improvement are not practised. Processes are rarely reviewed, inefficiency is tolerated, and no structured improvement programme exists.',
          'Awareness of lean principles exists within the team and some localised improvements are made, but these are individual initiatives without structure or tracking.',
          'A continuous improvement programme exists with defined processes, cross-functional participation, and tracked outcomes reported to management.',
          'Kaizen events and structured improvement projects are conducted regularly, with process owners driving waste elimination and results reported to senior management.',
          'A culture of continuous improvement is embedded: kaizen events run quarterly, process owners drive waste elimination, and improvement outcomes are tracked and shared company-wide.',
        ],
      },
      {
        q: 'How resilient is your supply chain to disruption — measured by documented recovery time objectives, tested recovery plans, and proven ability to maintain service during adverse events?',
        levels: [
          'The supply chain has no documented Recovery Time Objectives. Disruptions lead to significant, prolonged service failures with no structured response protocol.',
          'Some informal workarounds for common disruptions are known but not documented, not tested, and their effectiveness has not been validated.',
          'Recovery Time Objectives are defined for critical supply chain processes and basic recovery plans are documented and assigned to owners.',
          'Recovery plans for all critical processes are documented, reviewed annually, and the organisation has demonstrated effective response to at least one significant real disruption.',
          'Recovery Time Objectives are defined for all critical supply chain processes, tested annually through live exercises, and the organisation has demonstrated >95% service maintenance during past disruption events.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Implement a basic inventory policy with minimum/maximum levels for all stock items. Introduce a simple demand planning process and start tracking on-time delivery from suppliers.',
      Aware:     'Deploy statistical safety stock modelling for your top 20% of SKUs. Introduce 3PL SLAs and begin monthly logistics performance reviews.',
      Defined:   'Implement formal demand sensing with customer input integration. Apply lean principles to your top 3 supply chain processes and establish recovery time objectives for critical flows.',
      Managed:   'Deploy ML-driven demand forecasting and automated replenishment. Implement a structured continuous improvement programme with cross-functional ownership.',
      Optimised: 'Operate a demand-driven supply chain with real-time customer signal integration. Build resilience metrics into executive reporting and customer SLA commitments.',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MATURITY LEVELS
═══════════════════════════════════════════════════════════════════════════ */

const MATURITY_LEVELS = [
  { label: 'Reactive',   min: 1.0, max: 1.9, color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  { label: 'Aware',      min: 2.0, max: 2.9, color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  { label: 'Defined',    min: 3.0, max: 3.9, color: '#EAB308', bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  { label: 'Managed',    min: 4.0, max: 4.4, color: '#22C55E', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  { label: 'Optimised',  min: 4.5, max: 5.0, color: '#0B3D91', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
];

function getLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

type Phase = 'intro' | 'questions' | 'results';

export function Maturity() {
  const [phase, setPhase]     = useState<Phase>('intro');
  const [segIdx, setSegIdx]   = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const scrollUp = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const totalQuestions = SEGMENTS.length * 5;
  const answeredCount  = Object.keys(answers).length;
  const progress       = answeredCount / totalQuestions;

  const setAnswer = (seg: number, q: number, val: number) => {
    setAnswers(prev => ({ ...prev, [`${seg}-${q}`]: val }));
  };

  const segScore = (seg: number) => {
    const vals   = [0, 1, 2, 3, 4].map(q => answers[`${seg}-${q}`] ?? 0);
    const filled = vals.filter(v => v > 0);
    return filled.length === 5 ? filled.reduce((a, b) => a + b, 0) / 5 : null;
  };

  const currentSegComplete = () => [0, 1, 2, 3, 4].every(q => answers[`${segIdx}-${q}`]);

  const handleNext = () => {
    if (segIdx < SEGMENTS.length - 1) { setSegIdx(s => s + 1); scrollUp(); }
    else { setPhase('results'); scrollUp(); }
  };
  const handleBack = () => {
    if (segIdx > 0) { setSegIdx(s => s - 1); scrollUp(); }
    else { setPhase('intro'); scrollUp(); }
  };
  const handleReset = () => { setAnswers({}); setSegIdx(0); setPhase('intro'); scrollUp(); };

  const radarData = SEGMENTS.map((seg, i) => ({
    segment: seg.shortTitle,
    'Your Score':    +(segScore(i) ?? 0).toFixed(2),
    'GCC Average':   seg.benchmarks.gcc,
    'Global Average':seg.benchmarks.global,
    'Best-in-Class': seg.benchmarks.best,
  }));

  const overallScore = SEGMENTS.reduce((sum, _, i) => sum + (segScore(i) ?? 0), 0) / SEGMENTS.length;
  const overallLevel = getLevel(overallScore);

  /* ── INTRO ─────────────────────────────────────────────────────────────── */
  if (phase === 'intro') return (
    <div ref={topRef} className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 280 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Maturity Diagnostic Model</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Supply Chain &amp; Procurement<br />Maturity Assessment
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">
            A structured 40-question diagnostic across 8 critical segments. Each question presents five clearly described maturity levels — select the one that most accurately describes your organisation today.
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '8 Segments',    sub: 'Full supply chain scope' },
              { label: '40 Questions',  sub: '5 per segment' },
              { label: '5 Levels Each', sub: 'Explicit criteria per level' },
              { label: '~15 Minutes',   sub: 'Complete assessment' },
            ].map(item => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-muted">
                <p className="text-2xl font-extrabold text-primary">{item.label}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">What This Assessment Covers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {SEGMENTS.map(seg => (
            <div key={seg.id} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-primary leading-tight">{seg.shortTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{seg.questions.length} questions · 5 levels each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Maturity scale */}
        <div className="bg-muted rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-primary mb-4 text-center text-sm uppercase tracking-widest">5-Level Maturity Scale</h3>
          <div className="grid sm:grid-cols-5 gap-3">
            {SCALE_LABELS.map(s => (
              <div key={s.value} className="rounded-xl p-3 border text-center" style={{ backgroundColor: s.bg, borderColor: s.border }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-extrabold text-white text-sm" style={{ backgroundColor: s.color }}>{s.value}</div>
                <p className="font-bold text-sm" style={{ color: s.color }}>{s.short}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => { setPhase('questions'); scrollUp(); }}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-10 min-h-[52px] text-base shadow-lg">
            Start Assessment <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-muted-foreground text-sm mt-3">No account required · Results displayed instantly · Confidential</p>
        </div>
      </div>
    </div>
  );

  /* ── QUESTIONS ─────────────────────────────────────────────────────────── */
  if (phase === 'questions') {
    const seg        = SEGMENTS[segIdx];
    const segComplete = currentSegComplete();

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen" style={{ scrollMarginTop: 80 }}>
        {/* Sticky progress header */}
        <div className="sticky top-20 z-30 bg-white border-b border-border shadow-sm">
          <div className="h-1.5 bg-muted">
            <motion.div className="h-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
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
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">{answeredCount}</span>/{totalQuestions} answered
            </div>
          </div>
          <div className="container mx-auto px-4 pb-2.5 flex gap-1.5">
            {SEGMENTS.map((s, i) => {
              const done   = segScore(i) !== null;
              const active = i === segIdx;
              return (
                <div key={s.id} title={s.shortTitle}
                  className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-25'}`}
                  style={{ backgroundColor: active ? seg.color : done ? '#22C55E' : '#CBD5E1' }}
                  onClick={() => { setSegIdx(i); scrollUp(); }}
                />
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={segIdx}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

              {/* Segment header */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6 flex items-center gap-4">
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
                  <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
                    {/* Question text */}
                    <div className="flex items-start gap-3 p-5 pb-4 border-b border-border">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{qi + 1}</span>
                      <p className="font-semibold text-foreground text-sm leading-relaxed">{question.q}</p>
                    </div>

                    {/* Level rows — the core UI */}
                    <div className="divide-y divide-border">
                      {SCALE_LABELS.map((s, li) => {
                        const selected = val === s.value;
                        return (
                          <button
                            key={s.value}
                            onClick={() => setAnswer(segIdx, qi, s.value)}
                            className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-all duration-150 group
                              ${selected ? 'ring-2 ring-inset' : 'hover:bg-muted/60'}`}
                            style={selected ? { backgroundColor: s.bg, ringColor: s.color } : {}}
                          >
                            {/* Level badge */}
                            <div className="shrink-0 flex flex-col items-center gap-1 w-16">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-base transition-all
                                ${selected ? 'text-white scale-110 shadow-md' : 'text-white/80'}`}
                                style={{ backgroundColor: selected ? s.color : s.color + 'AA' }}>
                                {s.value}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight text-center transition-colors
                                ${selected ? '' : 'text-muted-foreground group-hover:text-foreground'}`}
                                style={selected ? { color: s.color } : {}}>
                                {s.short}
                              </span>
                            </div>

                            {/* Criteria text */}
                            <p className={`text-sm leading-relaxed pt-1 flex-1 transition-colors
                              ${selected ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {question.levels[li]}
                            </p>

                            {/* Selection indicator */}
                            <div className={`shrink-0 mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                              ${selected ? 'border-current' : 'border-border group-hover:border-muted-foreground'}`}
                              style={selected ? { borderColor: s.color } : {}}>
                              {selected && (
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected confirmation */}
                    {val && (
                      <div className="px-5 py-2.5 flex items-center gap-2 border-t border-border" style={{ backgroundColor: SCALE_LABELS[val - 1].bg }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SCALE_LABELS[val - 1].color }} />
                        <p className="text-xs font-semibold" style={{ color: SCALE_LABELS[val - 1].color }}>
                          Selected: Level {val} — {SCALE_LABELS[val - 1].short}
                        </p>
                      </div>
                    )}
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
                <Button onClick={handleNext} disabled={!segComplete}
                  className={`gap-2 ${segIdx === SEGMENTS.length - 1 ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-white font-bold`}>
                  {segIdx === SEGMENTS.length - 1
                    ? <><Award className="w-4 h-4" /> View Results</>
                    : <>Next Segment <ChevronRight className="w-4 h-4" /></>}
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
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Your Maturity Results</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Supply Chain &amp; Procurement Maturity Report</h1>
          <p className="text-white/70">Benchmarked against GCC peers, global averages, and best-in-class organisations.</p>

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

          <div className="mt-5 flex justify-center gap-6 flex-wrap text-sm">
            {[
              { label: 'vs GCC Average',    value: (overallScore - 2.3).toFixed(1), positive: overallScore >= 2.3 },
              { label: 'vs Global Average', value: (overallScore - 2.8).toFixed(1), positive: overallScore >= 2.8 },
              { label: 'vs Best-in-Class',  value: (overallScore - 4.4).toFixed(1), positive: overallScore >= 4.4 },
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

        {/* Radar */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">Maturity Radar — 8-Segment Benchmark Comparison</h2>
          <p className="text-muted-foreground text-sm mb-6">Your scores plotted against GCC average, global average, and best-in-class benchmarks.</p>
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12, fontWeight: 600, fill: '#1E3A5F' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickCount={6} />
                <Radar name="Best-in-Class"  dataKey="Best-in-Class"  stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
                <Radar name="Global Average" dataKey="Global Average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name="GCC Average"    dataKey="GCC Average"    stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name="Your Score"     dataKey="Your Score"     stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.2}  strokeWidth={2.5} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
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
                <Bar dataKey="Your Score"     fill="#0B3D91" radius={[4,4,0,0]} />
                <Bar dataKey="GCC Average"    fill="#22C55E" radius={[4,4,0,0]} opacity={0.7} />
                <Bar dataKey="Global Average" fill="#94A3B8" radius={[4,4,0,0]} opacity={0.6} />
                <Bar dataKey="Best-in-Class"  fill="#C9A84C" radius={[4,4,0,0]} opacity={0.5} />
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
                  const score  = segScore(i) ?? 0;
                  const level  = getLevel(score);
                  const vsGcc  = score - seg.benchmarks.gcc;
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
                      <td className="px-4 py-3.5 text-center"><span className="font-extrabold text-primary text-base">{score.toFixed(2)}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-muted-foreground">{seg.benchmarks.gcc}</span>
                        <span className={`ml-1.5 text-xs font-bold ${vsGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>{vsGcc >= 0 ? '+' : ''}{vsGcc.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground">{seg.benchmarks.global}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span style={{ color: '#C9A84C' }} className="font-medium">{seg.benchmarks.best}</span>
                        <span className="ml-1.5 text-xs font-bold text-muted-foreground">({vsBest.toFixed(1)})</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{level.label}</span>
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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${overallLevel.bg} ${overallLevel.text} border ${overallLevel.border}`}>{overallLevel.label}</span>
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
              const score    = segScore(i) ?? 0;
              const level    = getLevel(score);
              const rec      = seg.recommendations[level.label];
              const gapToBest = seg.benchmarks.best - score;
              const gapToGcc  = score - seg.benchmarks.gcc;
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
                    <div className="flex-shrink-0 w-20">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: level.color }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>0</span><span>5</span></div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex gap-3 mb-3">
                      <span className={`text-xs font-bold ${gapToGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gapToGcc >= 0 ? '↑' : '↓'} {Math.abs(gapToGcc).toFixed(1)} vs GCC avg
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">↑ {gapToBest.toFixed(1)} to best-in-class</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority action plan */}
        <div className="bg-[#082C6B] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">Priority Action Plan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
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
            <Button size="lg" variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary font-bold px-8"
              onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
