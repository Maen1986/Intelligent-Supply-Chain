import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Factory, Zap, Building2, Pill, ShoppingCart, Truck, Anchor, HardHat, Heart, Cpu,
  AlertTriangle, CheckCircle, ChevronRight, ArrowRight, BookOpen,
  ArrowUpCircle, CircleDot, ArrowDownCircle,
} from 'lucide-react';

interface Stream {
  type: 'upstream' | 'midstream' | 'downstream';
  name: string;
  color: string;
  standards: string[];
  processes: string[];
  flow: string[];
  challenges: string[];
  solution: string;
}

interface IndustryInfo {
  name: string;
  tagline: string;
  intro: string;
  icon: React.ElementType;
  heroColor: string;
  streams: Stream[];
  cases: { client: string; challenge: string; result: string }[];
}

const STREAM_LABELS = {
  upstream: { label: 'UPSTREAM', icon: ArrowUpCircle, bg: '#082C6B', desc: 'Sourcing, Procurement & Supplier Management' },
  midstream: { label: 'MIDSTREAM', icon: CircleDot, bg: '#0B3D91', desc: 'Operations, Planning & Internal Processes' },
  downstream: { label: 'DOWNSTREAM', icon: ArrowDownCircle, bg: '#C9A84C', desc: 'Distribution, Delivery & Customer Fulfilment' },
};

const industryData: Record<string, IndustryInfo> = {

  manufacturing: {
    name: "Manufacturing",
    tagline: "Building the industrial backbone of Saudi Vision 2030",
    intro: "Saudi Arabia's manufacturing sector is undergoing a historic transformation under Vision 2030, with the National Industrial Development and Logistics Programme (NIDLP) targeting a tripling of GDP contribution. CIPS Global Standard, APICS SCOR Model, and ISO 9001:2015 provide the professional framework to manage the complexity of raw-material procurement, Iktva localisation mandates, and lean production across FMCG, steel, chemicals, and automotive manufacturing sub-sectors.",
    icon: Factory,
    heroColor: "#1a4fa8",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Sourcing, Procurement & Supplier Management",
        color: "#082C6B",
        standards: ["CIPS Category Management Standard", "CPSM Module 1: Supporting Organisational Goals", "APICS SCOR Source Domain (S1–S3)", "ISO 20400:2017 Sustainable Procurement", "Saudi NCAR Procurement Competition Law"],
        processes: [
          "Spend analysis & category strategy development (CIPS Category Cube)",
          "Strategic sourcing: RFI, RFQ, RFP & e-auctions aligned to CIPS 5-Rights framework",
          "Supplier pre-qualification, AVL management & Iktva localisation scoring",
          "TCO modelling & should-cost analysis (ISM CPSM Negotiation Module)",
          "Contract formation, award & SLA establishment (IACCM best-practice clauses)",
          "Supplier relationship management (SRM) — segmentation & joint improvement plans",
        ],
        flow: ["Spend Analysis", "Category Strategy", "RFx & Sourcing", "Evaluation & Award", "Contract & SRM"],
        challenges: [
          "Single-source dependencies on European/Asian raw-material suppliers expose manufacturers to SCOR risk tier R1 (supply disruption) — CIPS Risk Management Standard recommends dual-source strategies with a maximum 70:30 split for critical categories.",
          "Iktva localisation mandates (NIDLP requiring progressive local content increases) demand a structured supplier development programme most manufacturers lack — CIPS Supplier Development Model Level 3 is the applicable framework.",
          "Commodity price volatility (steel +40%, aluminium +35% in recent cycles) makes fixed-price contracting unsustainable — CPSM Module 2 covers price adjustment mechanisms including CPI-linked formulae and index-based contract provisions.",
        ],
        solution: "ISC applies the CIPS Category Management 7-Step Model and CPSM strategic sourcing methodology to design dual-source strategies, Iktva supplier development programmes, and index-linked contract frameworks — typically delivering 15–25% total cost reduction whilst achieving full localisation compliance.",
      },
      {
        type: 'midstream',
        name: "Midstream — Operations, Planning & Quality Management",
        color: "#0B3D91",
        standards: ["APICS CPIM Module 3: Managing Inventory", "APICS CPIM Module 4: Strategic Management of Resources", "APICS SCOR Make Domain (M1–M3)", "ISO 9001:2015 Quality Management Systems", "APICS S&OP Best Practices"],
        processes: [
          "Demand planning & Master Production Schedule (MPS) development",
          "Material Requirements Planning (MRP) — APICS CPIM Planning & Control",
          "Inventory optimisation: ABC/XYZ classification & safety-stock modelling",
          "MRO management: criticality classification, min-max policies & consignment",
          "Production quality gates: in-process inspection aligned to ISO 9001 Clause 8.5",
          "Capacity planning & constraint management (Theory of Constraints — Goldratt)",
        ],
        flow: ["Demand Forecast", "MPS / MRP Run", "Work Orders", "Production & QC", "Stock Receipt"],
        challenges: [
          "Expedited purchasing averaging 25–40% of all POs signals a broken S&OP process — APICS recommends a consensus-driven demand review cycle with a 12-week rolling horizon to eliminate reactive procurement.",
          "MRO storerooms with 30–40% slow-moving or obsolete stock (a common GCC benchmark finding) indicate absence of ABC criticality classification — APICS CPIM Module 3 provides the VED/ABC/XYZ framework for rationalisation.",
          "Production downtime caused by quality escapes not detected at incoming inspection costs SAR 50K–500K per hour — ISO 9001:2015 Clause 8.4 (Control of Externally Provided Processes) requires supplier-specific quality plans and incoming inspection criteria.",
        ],
        solution: "ISC deploys integrated S&OP programmes aligned with APICS best practices, implements ISO 9001-compliant quality management systems, and conducts MRO rationalisation using criticality-based stocking policies — reducing expedited purchasing by 60% and unplanned downtime by 40%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Distribution, Warehousing & Customer Fulfilment",
        color: "#C9A84C",
        standards: ["CSCMP Supply Chain Management Principles", "APICS SCOR Deliver Domain (D1–D4)", "APICS CSCP Module 5: Implementing Supply Chain strategies", "WERC Warehouse Management Best Practices", "GS1 Traceability Standard"],
        processes: [
          "Network design: warehouse footprint, DC locations & last-mile coverage modelling",
          "Order management & customer order fulfilment (SCOR D1 — Make-to-Stock Deliver)",
          "Warehouse management: slotting, pick-pack-ship & labour productivity metrics",
          "Carrier management: tender, SLA setting & freight invoice audit",
          "Returns management & reverse logistics (APICS SCOR Return domain SR/DR)",
          "Supply chain visibility: track-and-trace, GS1 barcode & RFID implementation",
        ],
        flow: ["Customer Order", "ATP Check", "Pick & Pack", "QC & Despatch", "POD & OTIF Reporting"],
        challenges: [
          "OTIF (On-Time-In-Full) performance below 92% — the CSCMP global benchmark — signals warehouse slotting and carrier management deficiencies. WERC data shows top-quartile performers achieve 98.5%+ OTIF through velocity-based slotting and dedicated carrier SLAs.",
          "Distribution network designed pre-Vision 2030 is sub-optimal for new economic zones (NEOM, KAEC, Qiddiya) — APICS CSCP network modelling frameworks recommend re-baseline every 3–5 years or after major demand pattern shifts.",
          "Returns rates of 8–15% in B2C manufacturing erode margins and damage brand loyalty — APICS SCOR Return domain benchmarks best-in-class reverse logistics cycle time at under 5 days, vs. industry averages of 15–21 days in the GCC.",
        ],
        solution: "ISC applies APICS SCOR Deliver domain benchmarks and CSCMP network design principles to redesign distribution footprints, consolidate carrier bases, and implement OTIF dashboards — achieving 98%+ OTIF rates and a 20–30% reduction in distribution cost-per-unit.",
      },
    ],
    cases: [
      { client: "Jordanian Steel Manufacturer", challenge: "Raw material costs 22% above benchmark; single-source dependencies; no CIPS category management framework", result: "$15M annual savings; dual-source strategy deployed; CIPS-aligned category management implemented across 8 spend categories" },
      { client: "Saudi FMCG Producer", challenge: "Iktva at 23% vs. 35% mandatory target; no supplier development programme; NIDLP compliance audit risk", result: "Iktva raised to 41% in 18 months; 12 local suppliers developed; NIDLP audit passed with zero major findings" },
    ],
  },

  energy: {
    name: "Energy & Oil",
    tagline: "Optimising supply chains for the Kingdom's energy transition",
    intro: "The GCC energy sector — anchored by Saudi Aramco, SABIC, and the Kingdom's Vision 2030 energy diversification agenda — operates the world's most complex and high-stakes supply chains. CIPS Procurement Standards, APICS CPIM, and Aramco's own SQSP (Supplier Quality Standards Programme) define the professional framework. As the Kingdom expands into renewables, green hydrogen, and petrochemicals, supply chain strategies must evolve under ISM CPSM and ISO 14001:2015 sustainability obligations.",
    icon: Zap,
    heroColor: "#1a5c3a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — CAPEX Procurement & Supplier Qualification",
        color: "#1a5c3a",
        standards: ["CIPS Major Projects & Programme Procurement Standard", "CPSM Module 2: Supply Management Strategy", "Aramco IK.SQSP Supplier Qualification", "ASME / API Vendor Qualification Standards", "ISO 44001:2017 Collaborative Business Relationships"],
        processes: [
          "Major equipment sourcing: compressors, turbines, heat exchangers — long-lead strategy",
          "LSTK (Lump Sum Turn Key) tender strategy & contract risk allocation (IACCM EPC framework)",
          "Material take-off (MTO) generation & long-lead item procurement scheduling",
          "Vendor inspection programme: ITP development, factory acceptance testing (FAT)",
          "Aramco SQSP pre-qualification: IK.SQSP-01 through IK.SQSP-07 compliance",
          "Local content programme management: Aramco Iktva & NIDLP compliance scoring",
        ],
        flow: ["Project MTO", "Long-Lead Strategy", "Vendor Pre-Qual", "RFQ / Tender", "FAT & Delivery"],
        challenges: [
          "Long-lead equipment (18–36 month delivery windows) requires CAPEX commitment before final engineering is complete — CIPS recommends a letter-of-intent (LOI) framework with conditional commitment clauses aligned to Engineering milestones to manage scope risk.",
          "LSTK contractor risk transfer is frequently mis-structured — IACCM research shows 60% of EPC disputes arise from ambiguous delay liquidated damages (DLD) and supply chain risk-sharing clauses; CIPSM Contract Management Standard provides the correct drafting framework.",
          "Vendor qualification for safety-critical equipment (pressure vessels per ASME VIII, valves per API 6A/6D) requires 12–18 months — most Saudi operators have no pre-qualified vendor shortlists, creating critical-path schedule risk on CAPEX projects.",
        ],
        solution: "ISC provides CAPEX supply chain advisory aligned with CIPS Major Projects Standard and Aramco SQSP requirements — long-lead procurement strategies, LSTK contract structuring with IACCM-aligned risk provisions, and pre-qualified vendor databases — reducing CAPEX procurement cycle time by 30%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Asset Management, MRO & Turnaround Planning",
        color: "#2d7a4f",
        standards: ["APICS CPIM Module 3: Managing Inventory (MRO focus)", "ISO 55001:2014 Asset Management Systems", "SMRP (Society for Maintenance & Reliability Professionals) Metrics", "APICS SCOR Make Domain", "PAS 55 Asset Management"],
        processes: [
          "Spare parts criticality classification: ABC/VED/XYZ matrix per APICS CPIM",
          "Storeroom rationalisation: slow-moving & obsolete (SLOB) identification & disposal",
          "Min-max & reorder point optimisation using SMRP equipment criticality matrix",
          "Turnaround (TAR) supply chain planning: pre-staging, kitting & critical-path material scheduling",
          "ISO 55001-aligned asset management plan: lifecycle costing & replacement modelling",
          "OEM vs. independent repair/overhaul (MRO) cost benchmarking",
        ],
        flow: ["Asset Criticality", "MRO Classification", "Stocking Policy", "TAR Pre-Staging", "Consumption Tracking"],
        challenges: [
          "MRO inventory worth SAR 200M–2B with 30–40% slow-moving or obsolete stock — ISO 55001 requires life-cycle cost analysis justifying stocking decisions; without it, organisations over-stock non-critical items while under-stocking genuine critical spares.",
          "TAR planning gaps cause 40–60% cost premiums on last-minute expedited procurement — SMRP Best Practice Guide recommends a 52-week TAR supply chain plan with 85% materials pre-committed 6 months before execution.",
          "OEM sole-source maintenance contracts are routinely priced 25–40% above independent MRO benchmarks — CIPSM strategic sourcing methodology for maintenance services includes market testing, reverse auctions, and performance-based contracting.",
        ],
        solution: "ISC conducts full MRO rationalisation using the APICS CPIM criticality framework and SMRP metrics, designs TAR supply chain playbooks aligned with world-class turnaround standards, and implements ISO 55001-compliant asset management plans — typically freeing 20–35% of inventory value and reducing TAR cost by 15–25%.",
      },
      {
        type: 'downstream',
        name: "Downstream — ESG, Offtake & Sustainability Reporting",
        color: "#C9A84C",
        standards: ["ISO 14001:2015 Environmental Management", "ISO 20400:2017 Sustainable Procurement", "CIPS Ethical & Sustainable Procurement Standard", "GRI (Global Reporting Initiative) Standards", "TCFD Climate-Related Financial Disclosures"],
        processes: [
          "Scope 3 supply chain emissions mapping (GHG Protocol Category 1–3 methodology)",
          "Supplier ESG assessment & scoring (CIPS Sustainability Index)",
          "Responsible sourcing policy development (ISO 20400 implementation)",
          "Carbon reduction programme: low-carbon procurement specifications & supplier engagement",
          "ESG supply chain reporting: CDP A-List submission, GRI 308/414 compliance",
          "Product offtake contract management: price risk, volume commitment & destination clauses",
        ],
        flow: ["Emissions Baseline", "Supplier ESG Audit", "Reduction Targets", "CDP Submission", "Annual Board Report"],
        challenges: [
          "Scope 3 supply chain emissions represent 60–80% of total carbon footprint but are largely unmeasured — GHG Protocol Scope 3 Standard Category 1 (Purchased Goods & Services) requires supplier-level primary data, which most Saudi energy companies cannot yet produce.",
          "International institutional investors (BlackRock, Vanguard, sovereign funds) are requiring TCFD-aligned supply chain disclosures as a condition of capital allocation — organisations without structured ESG supply chain programmes face direct cost-of-capital impact.",
          "Iktva local content obligations and ESG supplier diversity standards are sometimes in tension — ISO 20400 provides the balanced framework for integrating local content, SME development, and environmental requirements into a single sustainable procurement policy.",
        ],
        solution: "ISC builds ISO 14001 and ISO 20400-aligned sustainable procurement frameworks, delivers GRI and CDP supply chain reporting programmes, and integrates ESG metrics into supplier scorecards — enabling access to ESG-conscious capital and unlocking green financing at 50–150bps premium savings.",
      },
    ],
    cases: [
      { client: "Saudi Energy Services Company", challenge: "No ESG supply chain metrics; failing international tender qualification on ISO 20400 criteria; CDP not submitted", result: "CDP A- score achieved; 28% supply chain carbon reduction; 3 international tenders qualified; ISO 14001 certified" },
      { client: "GCC Petrochemical Operator", challenge: "MRO inventory SAR 1.2B with 38% SLOB; unplanned downtime 12% of production hours; no ISO 55001 programme", result: "SAR 290M inventory rationalised; downtime reduced to 4.5%; ISO 55001 implementation roadmap completed" },
    ],
  },

  government: {
    name: "Government & Public Sector",
    tagline: "Modernising public procurement for Vision 2030 compliance",
    intro: "Saudi government procurement is governed by the Government Tenders and Procurement Law (Royal Decree M/128 2019) and administered through the NCAR (National Centre for Competitive Procurement). With Vision 2030 placing national procurement at the centre of economic transformation — Iktva, SME engagement, Etimad digital procurement — public sector supply chain leaders require the CIPS Public Sector Procurement Standard, CPSM ethics module, and OECD Procurement Integrity principles to deliver compliant, transparent, and value-driven procurement.",
    icon: Building2,
    heroColor: "#4a1a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Strategic Procurement, Policy & Tendering",
        color: "#4a1a6b",
        standards: ["CIPS Public Sector Procurement Standard", "OECD Principles for Integrity in Public Procurement", "Saudi Government Tenders & Procurement Law (M/128)", "NCAR Procurement Competition Guidelines", "ISO 37001:2016 Anti-Bribery Management"],
        processes: [
          "Annual procurement planning & spend mapping against approved budgets (NCAR framework)",
          "Category management strategy: consolidation of fragmented departmental spend",
          "Tender document development: TOR, technical specifications & evaluation criteria aligned to NCAR",
          "Framework agreement strategy: multi-supplier, multi-year agreements to reduce transaction cost",
          "SME & Iktva development programme aligned to Vision 2030 SME Authority targets",
          "Procurement policy drafting: delegation of authority matrices & approval workflows",
        ],
        flow: ["Procurement Plan", "Spend Analysis", "Tender Development", "Evaluation & Award", "Framework Agreement"],
        challenges: [
          "Reactive, uncoordinated procurement across departments eliminates volume leverage — CIPS research shows centralised category management in public sector organisations delivers 15–25% savings vs. fragmented departmental procurement.",
          "Compliance with Saudi Procurement Competition Law requires documented justification for sole-source awards — NCAR audit findings show 35–50% of sole-source awards in non-compliant government entities lack adequate documentation, creating financial audit exposure.",
          "Resistance from departmental budget-holders to centralised procurement models is the most common implementation challenge — OECD Procurement Integrity Principle 8 (Stakeholder Engagement) provides the structured change management approach for public sector transformation.",
        ],
        solution: "ISC designs NCAR-compliant centralised procurement models and category management frameworks aligned with the CIPS Public Sector Standard — delivering 15–25% cost savings on consolidated spend, zero NCAR audit findings, and full Vision 2030 SME / Iktva compliance documentation.",
      },
      {
        type: 'midstream',
        name: "Midstream — Contract Management, PO Lifecycle & Governance",
        color: "#6b2d9e",
        standards: ["IACCM Contract Management Standard", "CIPS Contract Management Guide", "ISO 37001:2016 Anti-Bribery Management", "Saudi e-Government Etimad Platform Requirements", "World Bank Public Procurement Assessment Framework"],
        processes: [
          "Contract lifecycle management (CLM): drafting, review, approval workflow & register",
          "Etimad platform integration: e-tendering, digital contracting & PO management",
          "Supplier performance management: KPI dashboards, quarterly reviews & incentive mechanisms",
          "Contract variation management: scope change control, budget impact assessment & approval",
          "ZATCA compliance: e-invoicing (FATOORAH Phase 2), VAT on government procurement",
          "Audit-readiness: procurement file completeness, documentation standards & NCAR evidence",
        ],
        flow: ["Contract Drafting", "Legal Review", "Etimad Registration", "Award & PO Issue", "Performance Monitoring"],
        challenges: [
          "Government entities manage thousands of contracts without a CLM system — IACCM research shows unmanaged contracts result in 9.2% value leakage through missed renewal savings, unclaimed liquidated damages, and scope creep.",
          "ZATCA Phase 2 e-invoicing requirements mandate that all government procurement is processed through FATOORAH-compliant systems — non-compliance risks VAT penalties of SAR 1,000 per non-compliant transaction.",
          "Supplier performance management is informal in most government entities — without KPI-linked contract mechanisms, poorly-performing contractors automatically renew because no documented grounds for termination exist.",
        ],
        solution: "ISC implements full CLM programmes aligned with IACCM standards and Etimad platform requirements — contract templates, KPI frameworks, ZATCA compliance, and audit-readiness documentation — recovering 9% average contract value leakage and achieving zero NCAR/MOF audit findings.",
      },
      {
        type: 'downstream',
        name: "Downstream — Service Delivery, Audit Readiness & Beneficiary Reporting",
        color: "#C9A84C",
        standards: ["CIPS Post-Award Contract Management Standard", "ISO 9001:2015 Clause 8.7 (Nonconforming Outputs)", "Saudi Vision 2030 KPI Reporting Framework", "World Bank Service Delivery Assessment", "GCC Data & Analytics for Public Sector Procurement"],
        processes: [
          "Service delivery monitoring: milestone verification, site inspection & acceptance protocols",
          "Beneficiary satisfaction measurement: survey design, data collection & reporting",
          "KPI dashboard design: spend-vs-budget, Iktva %, PO cycle time, supplier performance",
          "Audit-readiness programme: NCAR/MOF file review, gap analysis & evidence packing",
          "Procurement analytics: Power BI dashboard development for Ministry-level reporting",
          "Lessons learned & continuous improvement: CIPS PDCA cycle for procurement process",
        ],
        flow: ["Delivery Milestone", "Site Acceptance", "KPI Capture", "Dashboard Reporting", "Audit Evidence Pack"],
        challenges: [
          "Government service delivery is frequently accepted without documented quality verification — ISO 9001 Clause 8.6 requires documented evidence of conformity to acceptance criteria before delivery sign-off; without it, warranty claims become unenforceable.",
          "Vision 2030 programme offices require granular Iktva, SME, and spend-efficiency KPI data that most procurement systems cannot produce — NCAR reporting requirements mandate quarterly data submissions that take weeks of manual effort to compile.",
          "Procurement audit findings carry personal liability implications under Saudi Anti-Corruption Law (NAZAHA) — CIPS recommends a structured procurement audit-readiness programme run 6 months before any scheduled review.",
        ],
        solution: "ISC designs government-grade KPI reporting frameworks and Power BI dashboards aligned with NCAR reporting requirements, implements ISO 9001-compliant service acceptance protocols, and runs audit-readiness programmes — achieving 100% NCAR compliance and delivering Vision 2030 reporting packs on time.",
      },
    ],
    cases: [
      { client: "GCC Government Procurement Authority", challenge: "Manual supplier onboarding; 0% Iktva visibility; non-compliant contracts; NCAR audit imminent", result: "Full NCAR compliance; 100% Iktva tracking; 60% faster onboarding; 35 contract templates standardised; zero audit findings" },
      { client: "Saudi Ministry Procurement Directorate", challenge: "SAR 2.4B fragmented spend across 12 departments; no category management; Etimad not integrated", result: "Category management programme live; SAR 380M Year-1 savings identified; Etimad fully integrated" },
    ],
  },

  pharma: {
    name: "Pharmaceutical & Healthcare Products",
    tagline: "Securing medicine supply chains for the Kingdom's health ambitions",
    intro: "Saudi Arabia's pharmaceutical market exceeds SAR 30B annually, governed by SFDA regulations with strict cold-chain, GDP (Good Distribution Practice), and traceability requirements. Vision 2030 targets 40% local pharmaceutical manufacturing by 2030. CIPS Healthcare Procurement Standard, WHO Good Distribution Practice 2010, PIC/S GDP Guidelines, and APICS inventory management frameworks define professional best practice for this zero-tolerance supply chain sector.",
    icon: Pill,
    heroColor: "#1a6b4a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Procurement, Supplier Qualification & Regulatory Import",
        color: "#1a6b4a",
        standards: ["CIPS Healthcare Procurement Standard", "WHO Good Distribution Practice (GDP) 2010", "PIC/S GDP Guidelines PE 011-1", "SFDA Import Registration Requirements", "ICH Q10 Pharmaceutical Quality System"],
        processes: [
          "SFDA product registration management: dossier submission, variation tracking & expiry monitoring",
          "GDP supplier qualification: site audits, quality agreements & GMP certificate verification",
          "Cold-chain import logistics: temperature-controlled shipment specifications (2°C–8°C, -20°C, -80°C)",
          "Customs clearance: SFDA import permit management, health certificate coordination",
          "Dual-source procurement strategy: primary + secondary supplier per WHO Essential Medicines guidance",
          "Trading terms management: reference pricing compliance, SFDA price-controlled product procurement",
        ],
        flow: ["SFDA Registration", "Supplier GDP Audit", "Import Permit", "Cold-Chain Shipment", "GDP Receipt Verification"],
        challenges: [
          "SFDA registration timelines (12–24 months) create stock-out risk as products awaiting registration cannot be imported commercially — ICH Q10 recommends a 24-month forward registration pipeline managed against sales forecast to maintain product availability.",
          "Cold-chain failures (temperature excursions in last-mile distribution) cause SAR 200M+ in product wastage annually across KSA — PIC/S GDP requires continuous temperature monitoring from manufacturer warehouse to pharmacy; most Saudi distributors only monitor at fixed warehousing points.",
          "Single-country API sourcing (India/China for 60%+ of global supply) was exposed as catastrophic during COVID-19 supply disruptions — WHO Essential Medicines Programme recommends a maximum 70% reliance on any single source country for critical medicines.",
        ],
        solution: "ISC implements WHO GDP-aligned multi-source procurement strategies, designs SFDA import pipeline management systems, and audits cold-chain infrastructure against PIC/S GDP PE 011-1 — reducing temperature excursion incidents by 85% and eliminating SFDA non-compliance risk.",
      },
      {
        type: 'midstream',
        name: "Midstream — Pharmacy Operations, Inventory & Formulary Management",
        color: "#2d8a5e",
        standards: ["APICS CPIM Module 3: Managing Inventory (Healthcare)", "American Society of Health-System Pharmacists (ASHP) Guidelines", "WHO Model Formulary Management Standard", "VEN/ABC Analysis (WHO Essential Medicines methodology)", "Joint Commission International (JCI) Supply Chain Standards"],
        processes: [
          "Hospital formulary management: DTC committee governance, VEN/ABC/XYZ analysis",
          "Demand forecasting: statistical models + physician consumption analysis (APICS IBF methodology)",
          "Reorder point & safety-stock optimisation: Days-on-Hand (DOH) target setting by category",
          "Expiry management: FEFO (First Expiry First Out) compliance, near-expiry redistribution",
          "Consignment & VMI programme management: negotiation, risk transfer & performance monitoring",
          "Controlled drug management: SFDA Schedule 1–5 procurement, storage & consumption recording",
        ],
        flow: ["Formulary Review", "VEN/ABC Analysis", "DOH Targets", "VMI / PO Replenishment", "FEFO Dispensing"],
        challenges: [
          "Saudi hospital pharmacies carry an average 5.4 months of inventory vs. the JCI-recommended 2–2.5 months — ASHP Medication Management Standard requires pharmacy inventory reviews every 6 months using VEN/ABC analysis to right-size stocking levels by therapeutic category.",
          "Expiry wastage averaging 3–7% of pharmacy inventory value is preventable through FEFO inventory management and near-expiry return programmes — WHO GDP guidelines require documented FEFO procedures and monthly near-expiry stock reports.",
          "Antimicrobial stewardship (AMS) requirements under Saudi MoH Circular 2023 demand real-time antibiotic consumption data — this requires a pharmaceutical supply chain information system integrated with the hospital HIS, which most Saudi hospitals lack.",
        ],
        solution: "ISC builds JCI-compliant hospital pharmacy supply chain systems including VEN/ABC formulary management, ASHP-aligned demand forecasting, FEFO inventory controls, and VMI programmes with key suppliers — reducing pharmacy inventory from 5.4 to 2.8 months DOH and cutting wastage from 5% to under 1%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Distribution, GDP Compliance & Traceability",
        color: "#C9A84C",
        standards: ["PIC/S GDP Guidelines PE 011-1", "GS1 Healthcare Traceability Standard", "SFDA Track & Trace System (Salama)", "WHO Pre-qualification Programme for Distribution", "ISO 9001:2015 Healthcare Distribution"],
        processes: [
          "Pharmaceutical distribution network design: primary DC to hospital/pharmacy last-mile",
          "SFDA Salama track-and-trace compliance: serialisation, aggregation & verification scanning",
          "GDP transport qualification: lane validation, vehicle temperature monitoring & excursion response",
          "Hospital/pharmacy delivery: scheduled route planning, cold-chain integrity documentation",
          "Return goods management: SFDA-compliant recall procedures, suspect product quarantine",
          "Supplier performance scorecards: OTIF, order accuracy, temperature compliance & GDP audit findings",
        ],
        flow: ["Distribution Order", "GDP Despatch Check", "Cold-Chain Transport", "Pharmacy Delivery", "Salama Scan & POD"],
        challenges: [
          "SFDA Salama track-and-trace serialisation requirements are now mandatory for all pharmaceutical products in Saudi Arabia — distributors without serialisation infrastructure face SAR 1M+ fines and supply licence revocation.",
          "GDP transport lane qualification (required for cold-chain products by PIC/S GDP PE 011-1 Section 9) is absent in most Saudi pharmaceutical distributors — a single undocumented temperature excursion during transport can invalidate an entire cold-chain shipment.",
          "Hospital pharmaceutical recalls (averaging 3–4 SFDA Class II recalls per year in KSA) require 24-hour product traceability to the patient level — without GS1 Healthcare serialisation, hospitals cannot comply with SFDA recall notification requirements.",
        ],
        solution: "ISC designs SFDA Salama-compliant pharmaceutical distribution systems, implements GS1 Healthcare traceability programmes, and qualifies cold-chain transport lanes to PIC/S GDP standard — achieving 100% SFDA traceability compliance and eliminating all temperature excursion incidents.",
      },
    ],
    cases: [
      { client: "Leading Saudi Pharmaceutical Group", challenge: "47 unqualified suppliers; no GDP audit programme; SFDA import delays averaging 45 days; 30-day payment disputes", result: "GDP audit programme implemented; import delays cut to 12 days; 23% procurement cost reduction; 94% on-time payment rate" },
      { client: "GCC Hospital Network (12 facilities)", challenge: "5.4 months inventory DOH; 5.2% expiry waste; 12 simultaneous critical medicine stock-outs; JCI non-conformance", result: "2.8 months DOH; 1.1% wastage; zero critical stock-outs for 18 months; JCI supply chain standard achieved" },
    ],
  },

  retail: {
    name: "Retail & FMCG",
    tagline: "Demand-driven supply chains for the Kingdom's growing consumer market",
    intro: "Saudi Arabia's retail sector — the largest in MENA at SAR 500B+ — is being reshaped by e-commerce growth (35% YoY), Vision 2030 lifestyle changes, and global FMCG players entering the market. CIPS Category Management Standard, APICS IBF demand forecasting methodologies, ECR (Efficient Consumer Response) best practices, and GS1 supply chain standards define the professional framework for demand-driven, omnichannel supply chain excellence in GCC retail.",
    icon: ShoppingCart,
    heroColor: "#6b1a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Category Management, Supplier Management & Trading Terms",
        color: "#6b1a1a",
        standards: ["CIPS Category Management 7-Step Model", "ECR Europe Category Management Best Practices", "CPSM Module 1: Supply Management Strategy", "GS1 Product Information Management Standard", "CIPS Supplier Relationship Management Framework"],
        processes: [
          "Category strategy development: shopper insights, market data & CIPS Category Cube",
          "Supplier segmentation: strategic / preferred / transactional tiers (Kraljic Matrix)",
          "Joint Business Planning (JBP): annual volume commitments, promotional funding & NPD pipeline",
          "Trading terms negotiation: listing fees, rebates, promotional support & payment terms",
          "GS1 product data synchronisation: GTIN registration, product data quality & item master management",
          "Private label supplier development: product brief, factory audit & quality specification",
        ],
        flow: ["Category Review", "Supplier Segmentation", "JBP Agreement", "Trading Terms", "Category Performance Review"],
        challenges: [
          "Supermarket chains managing 1,000–3,000 suppliers allocate equal management time to all — CIPS Supplier Segmentation Model and Kraljic Matrix analysis typically reveal that 80% of value comes from 15–20% of suppliers; re-allocating management effort generates 10–15% additional margin.",
          "Trading terms negotiations are transactional rather than value-creating — ECR Europe Best Practices show that retailers implementing structured JBP with top 20 suppliers achieve 8–12% category growth vs. 2–3% for non-JBP managed categories.",
          "Private label remains underdeveloped in GCC retail (8% penetration vs. 35–40% in UK/Germany) — CIPS Private Label Procurement Guide provides the sourcing and quality specification framework to develop margin-accretive own-brand ranges.",
        ],
        solution: "ISC implements CIPS Category Management methodology and ECR-aligned JBP frameworks with top suppliers — reallocating management effort via Kraljic Matrix, building JBP programmes with 20 strategic suppliers, and launching private label development — delivering 3–5% margin improvement.",
      },
      {
        type: 'midstream',
        name: "Midstream — Demand Planning, S&OP & Inventory Management",
        color: "#8b2020",
        standards: ["APICS IBF (Institute of Business Forecasting) Best Practices", "APICS CPIM Module 3: Managing Inventory", "ECR Efficient Replenishment Standard", "APICS S&OP Process Design", "GS1 Demand Signal Repository Standard"],
        processes: [
          "Statistical demand forecasting: time-series, causal & machine-learning models (APICS IBF Level 3)",
          "Ramadan / Hajj / seasonal demand surge planning: uplift factors & promotional stock pre-build",
          "S&OP cycle management: demand review, supply review & executive consensus meeting",
          "DC inventory management: ABC velocity analysis, safety-stock modelling & reorder optimisation",
          "Promotion management: promotional volume planning, cannibalism modelling & post-promo analysis",
          "Waste management: perishables DOH targets, markdown triggers & supplier return programmes",
        ],
        flow: ["POS Data Capture", "Statistical Forecast", "S&OP Consensus", "Replenishment Order", "DC to Store"],
        challenges: [
          "Ramadan demand surges of 200–400% on specific categories cause simultaneous out-of-stocks and overstock — APICS IBF recommends category-specific seasonal adjustment factors built from 3-year POS history, not ad-hoc buyer estimates.",
          "Siloed buying and logistics functions mean promotional volumes are not integrated into replenishment plans — ECR Efficient Replenishment Standard requires a unified promotional demand management process that spans buying, supply chain, and logistics.",
          "Perishables wastage of 8–15% driven by LIFO (instead of FEFO) store rotation is preventable — GS1 Traceability Standard with shelf-life data in the barcode enables automated FEFO rotation in DC and store, reducing wastage to 2–4%.",
        ],
        solution: "ISC implements APICS IBF-aligned demand planning systems with Ramadan/seasonal adjustment factors, designs ECR-compliant S&OP cycles integrating buying and logistics, and implements GS1-enabled FEFO systems — reducing forecast error by 30%, out-of-stocks by 50%, and perishables wastage by 60%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Omnichannel Fulfilment, Last-Mile & Returns",
        color: "#C9A84C",
        standards: ["APICS SCOR Deliver Domain (D1–D4)", "CSCMP Last-Mile Delivery Best Practices", "WERC Omnichannel Fulfilment Metrics", "GS1 E-commerce Traceability Standard", "APICS SCOR Return Domain (SR/DR)"],
        processes: [
          "Omnichannel OMS: unified inventory across stores, DC, and e-commerce (WERC DF-KPI-6)",
          "DC fulfilment: B2B store replenishment, B2C e-commerce pick-pack-ship & click-and-collect",
          "Last-mile carrier management: carrier KPI framework, route optimisation & SLA governance",
          "E-commerce delivery: same-day / next-day SLA commitment, dynamic routing & customer notifications",
          "Returns management: APICS SCOR DR (Defective Return) process — authorisation, receipt, credit & disposal",
          "Supply chain visibility: end-to-end order tracking, carrier API integration & customer communications",
        ],
        flow: ["Order Capture (OMS)", "ATP & Channel Allocation", "DC Pick & Pack", "Carrier Handoff", "POD & Returns Processing"],
        challenges: [
          "Separate online and offline inventory systems cause simultaneous overselling online and dead stock in stores — WERC recommends a single unified inventory view (UII) across all channels as the foundational omnichannel capability, before any other digital investment.",
          "Last-mile delivery cost averaging SAR 22–35 per order makes e-commerce structurally loss-making below SAR 150 order values — CSCMP route optimisation benchmarks show top-quartile operators achieve SAR 14–18 per delivery through dynamic route clustering.",
          "High return rates (12–20% in fashion/electronics) with no reverse logistics infrastructure create unrecovered inventory value — APICS SCOR Return domain benchmarks show best-in-class retailers process returns within 5 days vs. GCC average of 21 days, recovering 40% more inventory value.",
        ],
        solution: "ISC designs unified omnichannel OMS architectures aligned with WERC standards, implements CSCMP-benchmarked last-mile carrier frameworks, and builds APICS SCOR Return-compliant reverse logistics programmes — reducing last-mile cost by 25–35% and return processing cost by 40%.",
      },
    ],
    cases: [
      { client: "Saudi Regional Retail Chain (120+ Stores)", challenge: "15–20% OOS during peaks; SAR 4.5M overstock write-offs; no S&OP; APICS IBF assessment score 38%", result: "67% OOS reduction; 31% inventory cost reduction; SAR 4.5M working capital released; APICS IBF score raised to 74%" },
      { client: "Saudi FMCG Distributor", challenge: "Forecast error 38%; expedited POs 28%; no ECR Efficient Replenishment; carrier SLA at 76%", result: "Forecast error 14%; expedited POs 6%; carrier SLA 97.2%; SAR 1.8M annual logistics savings" },
    ],
  },

  logistics: {
    name: "Logistics & Distribution",
    tagline: "Building the distribution backbone for the Kingdom's trade ambitions",
    intro: "Saudi Arabia's National Transport and Logistics Strategy targets a top-10 global logistics ranking by 2030, with SAR 100B+ invested in logistics infrastructure. CSCMP Supply Chain Management Principles, APICS CSCP, the Logistics Management Institute (LMI) network design methodology, and ISO 9001:2015 for logistics service providers define the professional standards framework for world-class 3PL and logistics operations in the Kingdom.",
    icon: Truck,
    heroColor: "#6b4a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Fleet & Equipment Procurement, Fuel & Carrier Contracts",
        color: "#6b4a1a",
        standards: ["CIPS Fleet Category Management Standard", "CPSM Module 2: Supplier Selection & Management", "CSCMP Freight Procurement Best Practices", "ISO 14001:2015 Fleet Environmental Management", "IACCM Carrier Contract Standard"],
        processes: [
          "Fleet procurement strategy: buy vs. lease vs. outsource (TCO modelling per CIPS Fleet Guide)",
          "Vehicle specification & tender: LCV/HCV, refrigerated, flatbed — technical spec development",
          "Fuel management: bulk fuel contracts, fuel card procurement & consumption benchmarking",
          "Carrier and 3PL tender: RFQ design, rate card negotiation & IACCM-aligned SLA contracts",
          "Equipment & racking procurement: MHE tender, WMS hardware & IoT device sourcing",
          "Tyre, maintenance & MRO contracts: lifecycle costing, service level agreements & pooling",
        ],
        flow: ["Fleet Strategy", "TCO Analysis", "Tender & Award", "Carrier Contract", "Performance Review"],
        challenges: [
          "Fleet ownership without TCO analysis is a common error — CIPS Fleet Procurement Guide shows lease-vs-buy TCO analysis consistently favours operating lease for urban LCVs but ownership for long-haul HCV fleets; incorrect decisions inflate total fleet cost by 15–20%.",
          "Fuel represents 30–40% of logistics operating cost and is procured transactionally by most Saudi 3PLs — CSCMP recommends a structured bulk fuel tender with price-cap options and volume rebates, reducing fuel cost by 8–12% vs. spot purchasing.",
          "Carrier fragmentation (managing 10–20 logistics providers with no master contract framework) creates inconsistent SLAs and no volume leverage — IACCM research shows that rationalising to 3–5 preferred carriers with volume-committed contracts reduces freight cost by 15–22%.",
        ],
        solution: "ISC conducts CIPS-aligned fleet TCO analysis, runs CSCMP-framework carrier tenders, and designs IACCM-compliant carrier contracts with volume commitments, KPI-linked pricing, and penalty mechanisms — typically reducing procurement-controllable logistics cost by 18–25%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Network Design, Warehouse Operations & Technology",
        color: "#8b6320",
        standards: ["APICS CSCP Module 3: Supply Chain Design", "WERC Annual DC Metrics Survey (KPI benchmarks)", "LMI Network Optimisation Methodology", "ISO 9001:2015 Clause 8 (Operations)", "APICS SCOR Plan & Source Domains"],
        processes: [
          "Logistics network optimisation: gravity modelling, node-count analysis & scenario planning (APICS CSCP)",
          "Warehouse slotting: velocity-based, ergonomic & weight-profile slotting (WERC best practice)",
          "WMS selection, implementation & go-live: functional gap analysis, vendor evaluation & UAT",
          "Labour productivity measurement: WERC KPIs — picks/hour, lines/hour, cost/unit shipped",
          "Route planning & TMS: dynamic routing, multi-drop optimisation & real-time visibility",
          "Lean warehouse process design: 5S, value stream mapping & waste elimination (Shingo Prize methodology)",
        ],
        flow: ["Network Baseline", "Gravity Model", "Footprint Decision", "WMS Go-Live", "WERC KPI Monitoring"],
        challenges: [
          "Fleet utilisation averaging 58–65% across Saudi 3PLs is significantly below the WERC benchmark of 80–85% — indicating poor route planning, imbalanced load scheduling, and absence of a TMS; closing this gap alone reduces cost-per-pallet by 15–20%.",
          "Manual, paper-based warehouse operations with pick accuracy of 92–95% vs. the WERC WMS-enabled benchmark of 99.5%+ create customer SLA breaches and rework cost — WERC data shows WMS investment has a median payback of 14 months in operations above 50 picks/hour.",
          "Network footprints designed pre-2020 are no longer optimal — new Vision 2030 economic zones (NEOM, KAEC, Diriyah) have shifted demand gravity centres significantly; APICS CSCP recommends a full network re-baseline every 3–5 years or after >15% demand pattern change.",
        ],
        solution: "ISC delivers APICS CSCP-aligned network optimisation studies, WERC-benchmarked warehouse operational improvements, and WMS implementation programmes — increasing fleet utilisation to 79%+, pick accuracy to 99.4%, and delivering 20–30% labour cost reduction.",
      },
      {
        type: 'downstream',
        name: "Downstream — Customer SLA Management, Last-Mile & Risk",
        color: "#C9A84C",
        standards: ["CSCMP OTIF (On-Time In-Full) Measurement Standard", "APICS SCOR Deliver Metrics (RL.2.1–RL.2.4)", "ISO 22301:2019 Business Continuity Management", "IACCM Service Contract KPI Framework", "CSCMP Risk Management in Logistics"],
        processes: [
          "Customer SLA design: OTIF, order-to-delivery lead time & damage-rate commitments",
          "SCOR Deliver metrics dashboard: RL.2.1 (Perfect Order Fulfilment), AM.2.1 (Cash-to-Cash)",
          "Last-mile delivery management: proof of delivery (POD), customer notification & exception handling",
          "Business continuity planning (BCP): ISO 22301 risk register, recovery time objectives & testing",
          "Logistics risk management: single-source dependencies, cyber risk, weather & geopolitical mapping",
          "Customer dispute management: IACCM SLA measurement, penalty administration & root-cause analysis",
        ],
        flow: ["Customer Order", "Despatch & Route", "Last-Mile Delivery", "POD Capture", "SCOR KPI Reporting"],
        challenges: [
          "Most Saudi 3PLs cannot report APICS SCOR Perfect Order Fulfilment (RL.2.1) — the industry gold-standard metric — because they track delivery separately from order accuracy, completeness, and documentation; world-class operators achieve 97%+ POF.",
          "Single-source dependencies on key technology systems (WMS, TMS) without BCP create catastrophic operational risk — ISO 22301 requires documented RTO (Recovery Time Objective) and RPO (Recovery Point Objective) for all critical systems, with annual tested rehearsal.",
          "Cyber-attack risk on logistics management systems (WMS, TMS, EDI) is growing but unaddressed — the 2021 Transnet ransomware attack (South Africa) shut a major port operator for 7 days; CSCMP recommends cyber risk as a Tier-1 supply chain risk from 2024.",
        ],
        solution: "ISC implements APICS SCOR Perfect Order Fulfilment measurement frameworks, designs ISO 22301-aligned BCP programmes for logistics operations, and deploys CSCMP risk management methodologies — reducing annual penalty exposure by SAR 2–5M and achieving 97%+ POF performance.",
      },
    ],
    cases: [
      { client: "International Logistics Operator (GCC)", challenge: "12 single-source critical suppliers; 1 insolvency caused SAR 900K in penalties; no BCP; SCOR score below 50th percentile", result: "Zero single-source dependencies; 48hr RTO for all critical systems; SCOR POF raised to 96.8%; SAR 2.1M avoided penalties" },
      { client: "Saudi 3PL (8 Warehouses)", challenge: "Fleet utilisation 58%; manual WMS; pick accuracy 93.2%; WERC benchmarked at bottom quartile", result: "Fleet utilisation 79%; pick accuracy 99.4%; WERC KPIs at 3rd quartile; SAR 3.2M annual cost reduction" },
    ],
  },

  marine: {
    name: "Marine & Port Operations",
    tagline: "Optimising supply chains at the Kingdom's maritime gateways",
    intro: "Saudi Arabia's Red Sea and Arabian Gulf coastlines host some of the world's busiest maritime corridors. Jeddah Islamic Port, King Abdulaziz Port (Dammam), and Yanbu handle over 300M tonnes annually. The BIMCO (Baltic and International Maritime Council) standard terms, CIPS Marine Procurement Standard, IMPA (International Marine Purchasing Association) guidelines, and ISO 9001:2015 for port services define the professional procurement and supply chain framework for maritime operations.",
    icon: Anchor,
    heroColor: "#1a4a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Marine Procurement, Chandlery & Bunker Management",
        color: "#1a4a6b",
        standards: ["IMPA (International Marine Purchasing Association) Guidelines", "CIPS Marine Procurement Standard", "BIMCO Standard Bunker Contract Terms", "ISO 8217:2017 Marine Fuel Quality Standard", "CPSM Module 2: Supplier Selection (Marine Context)"],
        processes: [
          "Ship chandlery consolidation: IMPA-coded catalogue management, consolidated procurement & rebate structures",
          "Bunker fuel procurement: ISO 8217-compliant specification, spot vs. contract strategy & price hedging",
          "Marine spare parts sourcing: OEM vs. approved equivalent strategy, criticality classification & lead-time management",
          "Dry-dock supply management: BOQ development, shipyard tender & pre-staging strategy",
          "Port services procurement: pilotage, towage, mooring & agency contract negotiation",
          "Safety & SOLAS compliance procurement: PPE, fire-fighting equipment & LSA (Life-Saving Appliances)",
        ],
        flow: ["Vessel Schedule", "Provisions Planning", "IMPA-Coded PO", "Consolidated Delivery", "Master Sign-off"],
        challenges: [
          "Decentralised chandlery procurement (vessel masters negotiating independently) eliminates corporate volume leverage — IMPA data shows that centralised, catalogue-managed chandlery procurement delivers 18–25% lower cost vs. vessel-level purchasing.",
          "Bunker fuel represents 30–50% of vessel operating cost; without price hedging strategies aligned with BIMCO standard contract terms, operators are fully exposed to commodity price swings of 40–80% annually — significantly exceeding budget tolerance.",
          "Marine spare parts procurement without criticality classification (ISO 55001-aligned) leads to simultaneous over-stocking of low-criticality items and under-stocking of mission-critical spares — causing costly vessel off-hire events averaging $15,000–$50,000 per day.",
        ],
        solution: "ISC designs IMPA-aligned consolidated marine procurement programmes, implements BIMCO-compliant bunker hedging strategies, and conducts ISO 55001-based spare parts criticality classification — reducing vessel supply cost by 15–25% and eliminating supply-caused demurrage.",
      },
      {
        type: 'midstream',
        name: "Midstream — Port Operations, Terminal Management & Equipment",
        color: "#2d6b8a",
        standards: ["IAPH (International Association of Ports & Harbours) Standards", "ISO 28000:2022 Supply Chain Security", "APICS SCOR Plan Domain (Port context)", "Lloyd's Register Port Operations Standard", "PIANC Guidelines for Port Maintenance"],
        processes: [
          "Terminal throughput planning: berth allocation, vessel scheduling & crane gang planning",
          "Yard management: container stacking optimisation, RTG utilisation & dwell-time management",
          "Port equipment MRO: quay crane, RTG & reach stacker criticality-based maintenance",
          "Port Community System (PCS) integration: customs, freight forwarder & terminal data exchange",
          "Cargo tracking & visibility: RFID, IoT sensor management & port operational dashboards",
          "Hinterland connectivity: inland depot network, rail integration & last-mile freight management",
        ],
        flow: ["Vessel ETA Signal", "Berth Allocation", "Discharge Planning", "Yard Allocation", "Gate Release & POD"],
        challenges: [
          "Quay crane and RTG downtime directly impacts terminal throughput — PIANC guidelines require a proactive MRO programme with MTBF (Mean Time Between Failures) targets; best-in-class terminals achieve less than 3% equipment downtime vs. GCC averages of 8–14%.",
          "Port Community System gaps between customs, terminal operators, and freight forwarders create documentation delays averaging 12–24 hours per consignment — ISO 28000 Supply Chain Security standard provides the data exchange framework to eliminate these delays.",
          "Container dwell time in Saudi ports averages 4–6 days vs. world-class benchmarks of 2 days — IAPH performance indicators show dwell time reduction directly correlates with yard capacity utilisation, reducing the need for costly yard expansion.",
        ],
        solution: "ISC delivers PIANC and IAPH-aligned port supply chain optimisation programmes — equipment MRO criticality management, PCS integration advisory, and ISO 28000-compliant supply chain security — increasing terminal throughput by 15–20% and reducing container dwell time to under 2.5 days.",
      },
      {
        type: 'downstream',
        name: "Downstream — Free Zone Management, Trade Facilitation & Cargo Release",
        color: "#C9A84C",
        standards: ["WCO (World Customs Organisation) Supply Chain Security Framework", "ZATCA Customs Compliance (Saudi context)", "ISO 28000:2022 Supply Chain Security", "AEO (Authorised Economic Operator) Programme Standards", "CIPS Trade & International Procurement Standard"],
        processes: [
          "Free zone supply chain structuring: FZ vs. customs warehouse vs. bonded zone selection",
          "AEO (Authorised Economic Operator) certification: ZATCA AEO programme application & maintenance",
          "Re-export and transshipment supply chain design: origin documentation, certificate management",
          "Trade finance: letter of credit structuring, supply chain finance (SCF) & invoice discounting",
          "Customs classification & valuation: HS code management, duty optimisation & ZATCA compliance",
          "Import/export documentation: commercial invoice, packing list, COO & SFDA/SABER certificate management",
        ],
        flow: ["Trade Route Analysis", "Free Zone Setup", "AEO Registration", "Customs Clearance", "Cargo Release & POD"],
        challenges: [
          "Saudi free zone regulations are complex and frequently updated — ZATCA enforcement of the GCC Common Customs Law creates significant compliance risk; WCO AEO programme participation reduces customs inspection rates by 60–80% and average clearance time from 4 days to under 8 hours.",
          "Supply chain finance penetration in GCC trade is significantly below international benchmarks — CIPS Supply Chain Finance Guide shows SCF programmes reduce working capital requirements by 30–40 days on payables and 15–25 days on receivables.",
          "Trade document management (LC, COO, SABER certificates) is largely manual in Saudi importers — electronic document management aligned with CIPS International Procurement Standard reduces trade documentation errors by 75% and customs query rates by 60%.",
        ],
        solution: "ISC provides ZATCA-aligned free zone supply chain structuring and AEO programme support, implements supply chain finance programmes per CIPS SCF Guide, and digitises trade documentation management — unlocking full duty-deferral benefits and reducing customs clearance time by 80%.",
      },
    ],
    cases: [
      { client: "Red Sea Shipping Operator", challenge: "Decentralised chandlery; no bunker hedging; demurrage averaging $28,000 per vessel call; IMPA non-compliant", result: "IMPA-aligned consolidated procurement; bunker hedging implemented; demurrage eliminated; 19% vessel supply cost reduction" },
      { client: "Saudi Port Terminal Operator", challenge: "Equipment downtime 14% of operating hours; no PIANC maintenance programme; MRO spend 35% above benchmark", result: "Downtime 5.2%; PIANC-aligned MRO programme; SAR 8.5M annual MRO cost reduction" },
    ],
  },

  construction: {
    name: "Construction & EPC",
    tagline: "Supply chains for the Kingdom's giga-project era",
    intro: "Saudi Arabia is executing the largest construction programme in human history — NEOM, The Line, Diriyah Gate, Qiddiya, Red Sea Project — alongside Vision 2030 social infrastructure. With SAR 1.4 trillion in active projects, construction supply chains require CIPS Major Projects & Programme Procurement Standard, CIOB (Chartered Institute of Building) supply chain management guidelines, APICS project supply chain management, and the NEC4 (New Engineering Contract) supply chain risk framework.",
    icon: HardHat,
    heroColor: "#6b3a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Material Procurement, Subcontractor Sourcing & BOQ Management",
        color: "#6b3a1a",
        standards: ["CIPS Major Projects & Programme Procurement Standard", "CIOB Supply Chain Management in Construction", "FIDIC / NEC4 Procurement Clauses", "CPSM Module 3: Contract & Risk Management", "ISO 20400:2017 Sustainable Construction Procurement"],
        processes: [
          "BOQ extraction & procurement scheduling: material take-off aligned to design milestones",
          "Bulk material strategic sourcing: steel, cement, aggregates — long-lead pre-commitment strategy",
          "Subcontractor pre-qualification: financial health, safety record (ISO 45001), technical capability",
          "Subcontractor tender: scope of works, NEC4/FIDIC subcontract form selection & risk allocation",
          "Import procurement: international material sourcing, logistics coordination & customs clearance",
          "Sustainable procurement: LEED/BREEAM material specification, recycled content & carbon impact",
        ],
        flow: ["Design Milestone", "BOQ Extraction", "Long-Lead Pre-Commit", "Subcontract Award", "Pre-Delivery Inspection"],
        challenges: [
          "Saudi construction demand is creating severe supply shortages in structural steel and MEP equipment — CIPS Major Projects Standard recommends a 6-month horizon procurement schedule with pre-commitment letters for lead times exceeding 12 weeks; most Saudi contractors start procurement 30–60 days after materials were needed on-site.",
          "Subcontractor pre-qualification without financial health screening is a common risk — CIOB Supply Chain guidance shows 40–60% of sub-contractor failures on large projects have identifiable financial distress signals 6 months before insolvency; CIPS Supplier Financial Risk Assessment provides the screening framework.",
          "Sustainable procurement obligations under LEED V4 (mandatory for many Vision 2030 projects) require material carbon data and recycled content documentation — ISO 20400 Sustainable Procurement provides the supplier engagement framework for construction materials.",
        ],
        solution: "ISC implements CIPS Major Projects-aligned procurement scheduling with BOQ-integrated material management, conducts CIOB-standard subcontractor pre-qualification with financial health monitoring, and delivers ISO 20400-compliant sustainable procurement frameworks — reducing supply-caused schedule delays by 70%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Site Logistics, Material Management & Subcontractor Governance",
        color: "#8a4f20",
        standards: ["CIOB Site Logistics Management Guide", "APICS Project Supply Chain Management", "ISO 45001:2018 Occupational Health & Safety (Site)", "Lean Construction Institute (LCI) Principles", "CIPS Contract Administration Standard"],
        processes: [
          "Site logistics plan: traffic management, unloading zones, storage layout & access scheduling",
          "Material tracking: RFID/barcode material management system, delivery scheduling & gate control",
          "Just-in-time delivery: pull-based material delivery aligned to construction programme",
          "Subcontractor management: weekly look-ahead scheduling, constraint removal & payment governance",
          "Equipment hire management: utilisation tracking, hire rate benchmarking & return scheduling",
          "ISO 45001-compliant safety inspection: material handling, lifting operations & COSHH compliance",
        ],
        flow: ["JIT Delivery Schedule", "Gate Receipt & RFID", "Site Warehouse", "Issue to Works", "Material Reconciliation"],
        challenges: [
          "Large construction sites (5–15 km2) waste 15–25% of labour hours on material searching — Lean Construction Institute research shows pull-based JIT delivery systems with site-level material tracking reduce labour waste to under 5% and improve productivity by 20%.",
          "Equipment hire idle time averaging 35–45% on Saudi mega-projects represents direct profit erosion — CIOB Site Logistics Guide recommends a hire utilisation tracking system with 75% minimum utilisation trigger for return decisions.",
          "Subcontractor payment governance failures — main contractors delaying payment by 90+ days — cascade into Tier-2 and Tier-3 supply chain failures; NEC4 contract Option Y(UK)2 and equivalent FIDIC provisions mandate payment within 21 days; structured payment governance prevents £/SAR millions in supply chain disruption.",
        ],
        solution: "ISC implements LCI-aligned JIT delivery systems with RFID material tracking, deploys hire utilisation management programmes, and establishes NEC4-compliant subcontractor payment governance — recovering 3–5% of total project cost and eliminating supply chain-caused schedule delays.",
      },
      {
        type: 'downstream',
        name: "Downstream — Commercial Recovery, Handover & Defects Liability Management",
        color: "#C9A84C",
        standards: ["IACCM Contract Management & Commercial Recovery Standard", "FIDIC Red/Yellow/Silver Book Claims Provisions", "NEC4 Compensation Event Management", "CIPS Post-Award Contract Management Guide", "ISO 10005:2018 Quality Plans (Handover context)"],
        processes: [
          "Variation order (VO) management: NEC4/FIDIC Compensation Event tracking, quantification & submission",
          "Extension of time (EOT) claims: delay analysis methodology (TIA/Windows), supporting documentation",
          "Retention money management: retention release milestones, bond alternatives & cashflow management",
          "Practical completion & handover: defect punch-list management & ISO 10005 quality plan evidence",
          "Defects liability period (DLP): supply chain readiness for reactive maintenance, parts pre-stocking",
          "Final account settlement: Scott Schedules, conciliation & FIDIC/NEC dispute avoidance board",
        ],
        flow: ["VO Identification", "Compensation Event Notice", "Quantification & Submission", "Employer Assessment", "Final Account"],
        challenges: [
          "VO entitlement on Saudi projects averages 15–35% of contract value — yet most contractors fail to capture 40–60% of legitimate NEC4/FIDIC Compensation Events due to poor contractual notice compliance and inadequate commercial management systems.",
          "DLP supply chain planning is absent in most contractors — reactive maintenance during DLP requires material procurement, logistics, and labour mobilisation within 24–72 hours; without pre-positioned DLP supply chain agreements, contractors pay 30–50% premiums on emergency procurement.",
          "Final account settlement disputes lasting 24–48 months are common on Saudi mega-projects — IACCM data shows that contractors with structured contemporary record-keeping (daily site diaries, photographic evidence, resource records) settle final accounts 18 months faster and recover 25% more entitlement.",
        ],
        solution: "ISC provides FIDIC/NEC4-aligned commercial and supply chain advisory — VO capture programmes, DLP supply chain planning, and IACCM-standard final account management — recovering 5–15% of unclaimed contract entitlement and avoiding 18–24 months of dispute.",
      },
    ],
    cases: [
      { client: "Major Saudi EPC Contractor", challenge: "Material shortages causing 18-week schedule delay; SAR 42M VO entitlement untracked; no NEC4 CE log", result: "Bulk pre-commitment strategy eliminated material delays; SAR 42M VO recovered; NEC4 CE management system deployed" },
      { client: "Vision 2030 Giga-Project Subcontractor", challenge: "Equipment hire utilisation 41%; material losses SAR 3.2M; no site logistics plan; CIOB non-compliant", result: "Utilisation 73%; material loss 0.8%; CIOB-compliant logistics plan; SAR 5.1M net annual saving" },
    ],
  },

  healthcare: {
    name: "Healthcare",
    tagline: "Resilient health supply chains for the Kingdom's care transformation",
    intro: "Saudi Arabia's Health Sector Transformation Programme under Vision 2030 is privatising hospitals, expanding primary care networks, and digitalising clinical pathways. With MoH managing 2,500+ facilities and the private sector growing at 12% annually, healthcare supply chains require CIPS Healthcare Procurement Standard, NHS CIPS Supply Chain Management framework, JCI (Joint Commission International) supply chain standards, and ISO 9001:2015 for healthcare service providers.",
    icon: Heart,
    heroColor: "#6b1a2d",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Medical Device Procurement, Tendering & Supplier Qualification",
        color: "#6b1a2d",
        standards: ["CIPS Healthcare Procurement Standard", "SFDA Medical Device Regulation (MDR)", "NHS Supply Chain Category Management Framework", "ISO 13485:2016 Medical Devices Quality Management", "JCI Supply Chain Standard — Medical Equipment"],
        processes: [
          "Medical device category management: NHS-aligned category strategies for surgical consumables, imaging & diagnostics",
          "SFDA MDR pre-qualification: regulatory approval status verification & import documentation",
          "Physician preference item (PPI) value analysis: clinical equivalence assessment & total cost modelling",
          "MOH/NHC tender management: technical specification development, evaluation matrix & award",
          "ISO 13485-compliant supplier qualification: QMS certification, vigilance record & audit",
          "Consignment & VMI programme design: capital equipment, implants & high-value consumables",
        ],
        flow: ["Clinical Requirement", "Formulary Committee", "SFDA Verification", "Tender Development", "Contract & Consignment"],
        challenges: [
          "Physician Preference Items (PPIs — implants, surgical instruments) drive 35–45% of consumable spend but are procured on clinical preference rather than value — NHS Supply Chain PPI Value Analysis programme shows structured equivalence reviews deliver 15–22% cost reduction without clinical compromise.",
          "SFDA MDR registration timelines create procurement gaps — ISO 13485 requires a documented supplier qualification process that verifies MDR registration status before any procurement commitment, to prevent SAR 500K+ compliance exposures from unregistered device procurement.",
          "Medical device tendering without properly designed technical specifications leads to either non-comparable bids (if over-specified to a single brand) or poor clinical outcomes (if under-specified) — CIPS Healthcare Standard requires technical specifications written to clinical outcome, not brand.",
        ],
        solution: "ISC implements NHS-aligned PPI value analysis programmes, designs SFDA MDR-compliant supplier qualification processes, and develops outcome-based medical device tender specifications — reducing medical supply cost by 15–22% while maintaining full JCI supply chain compliance.",
      },
      {
        type: 'midstream',
        name: "Midstream — Pharmacy, Formulary Management & Clinical Supply Operations",
        color: "#8b2040",
        standards: ["ASHP (American Society of Health-System Pharmacists) Medication Management Guidelines", "WHO Model Formulary Management Standard", "JCI Medication Management & Use (MMU) Standards", "APICS CPIM Inventory Management (Healthcare)", "Saudi MoH Antimicrobial Stewardship Programme"],
        processes: [
          "Hospital formulary governance: DTC committee, VEN/ABC/XYZ analysis & therapeutic substitution protocol",
          "Medicines demand forecasting: consumption-based statistical model (APICS IBF Level 2 Healthcare)",
          "Inventory optimisation: Days-on-Hand targets per VEN category (V=7 days, E=14 days, N=30 days)",
          "Cold-chain medicines management: biologics & vaccines — JCI MMU.3 compliance & excursion SOP",
          "AMS programme supply chain: antibiotic restriction formulary, de-escalation protocols",
          "Biomedical equipment management: lifecycle planning, PPM scheduling & ISO 13485 calibration",
        ],
        flow: ["Formulary Governance", "VEN/ABC Analysis", "DOH Targets", "Automated Replenishment", "FEFO Dispensing"],
        challenges: [
          "Saudi hospital pharmacies carry 5.4 months average inventory (vs. JCI-recommended 2–2.5 months) — ASHP recommends formulary-level DOH target setting using VEN classification: Vital items 7 days, Essential 14 days, Non-essential 30 days; this alone reduces pharmacy working capital by 40–50%.",
          "Biologics and specialty medicines (40–60% of pharmacy spend) require continuous cold-chain management that most Saudi hospitals handle informally — JCI MMU.3 requires documented cold-chain procedures with excursion response protocols and continuous temperature monitoring logs.",
          "Saudi MoH AMS circular 2023 mandates real-time antibiotic consumption reporting linked to microbiology data — ASHP AMS implementation requires a pharmacy information system integrated with HIS and microbiology LIS, which 70%+ of Saudi hospitals lack.",
        ],
        solution: "ISC builds ASHP and JCI-compliant hospital pharmacy supply chain systems with VEN-based formulary management, automated DOH-based replenishment, JCI MMU-compliant cold-chain management, and AMS-ready pharmacy information architecture — reducing inventory from 5.4 to 2.8 months and wastage from 5% to under 1%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Clinical Logistics, FM Services & Biomedical Governance",
        color: "#C9A84C",
        standards: ["CIPS Healthcare Facilities Management Procurement Standard", "EFPIA (European Fed. of Pharmaceutical Industries) Supply Chain Principles", "ISO 9001:2015 Healthcare Service Provider Clause 8.5", "IHTSDO Clinical Terminology Standards (for supply chain coding)", "JCI Environment of Care (EC) Standards"],
        processes: [
          "Point-of-care (POC) supply delivery: ward-level kanban, pneumatic tube pharmacy & robot dispensing",
          "FM procurement governance: catering, linen, housekeeping & security — KPI-linked contracts",
          "Biomedical equipment maintenance: OEM vs. independent service provider benchmarking & tender",
          "Capital equipment replacement planning: ISO 55001 lifecycle costing & replacement schedule",
          "Infection control supply chain: PPE, sterilisation consumables & critical shortage protocol (ECDC framework)",
          "Vendor performance scorecards: OTIF, quality incidents, SFDA/JCI findings & response time",
        ],
        flow: ["Ward Requisition", "POC Delivery (Kanban)", "FM Service Delivery", "Biomedical Maintenance", "Vendor KPI Review"],
        challenges: [
          "FM contracts in Saudi hospitals are over-specified and under-managed — CIPS Healthcare FM Guide shows that KPI-free automatic renewal contracts deliver 20–30% below-benchmark service quality and 15–25% above-benchmark cost vs. competitively tendered, KPI-linked alternatives.",
          "Biomedical maintenance sole-sourced to OEMs at 25–40% premium over independent service providers (ISPs) — JCI EC standards require documented maintenance schedules but do not mandate OEM servicing; CIPS benchmarking shows ISP-managed biomedical programmes cost 22–35% less.",
          "Capital equipment replacement is reactive rather than planned — ISO 55001 asset lifecycle cost modelling shows that planned replacement programmes reduce emergency procurement (at 30–50% premium) and eliminate the patient safety risk of equipment failure during clinical use.",
        ],
        solution: "ISC conducts CIPS Healthcare FM procurement reviews introducing competitive tendering and KPI frameworks, benchmarks biomedical maintenance against ISP alternatives, and implements ISO 55001 capital replacement plans — saving 20–30% on non-clinical procurement and eliminating equipment safety risks.",
      },
    ],
    cases: [
      { client: "GCC Hospital Network (12 facilities)", challenge: "5.4 months pharmacy DOH; 5.2% expiry waste; 12 critical stock-outs; JCI MMU non-conformance; ASHP assessment: bottom quartile", result: "2.8 months DOH; 1.1% wastage; zero stock-outs 18 months; JCI MMU achieved; ASHP assessment: 3rd quartile" },
      { client: "Private Saudi Hospital Group", challenge: "Biomedical maintenance SAR 18M/yr; OEM sole-source; 23% equipment past optimal lifecycle; ISO 55001 absent", result: "SAR 4.8M annual saving; ISO 55001 replacement programme; ISP programme implemented; zero patient safety incidents" },
    ],
  },

  tech: {
    name: "Technology & ICT",
    tagline: "Supply chains for the Kingdom's digital economy ambitions",
    intro: "Saudi Arabia's ICT sector — driven by Vision 2030 digital economy targets and NEOM's technology ambitions — is one of the world's fastest-growing. From hyperscale data centres to smart city infrastructure, technology supply chains require CIPS IT Procurement Standard, APICS SCOR digital transformation methodology, ISO/IEC 20000-1:2018 IT Service Management, and ITIL 4 supply chain principles to manage global hardware shortages, software licensing complexity, and IT vendor risk.",
    icon: Cpu,
    heroColor: "#1a3a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Hardware Procurement, Software Licensing & Vendor Management",
        color: "#1a3a6b",
        standards: ["CIPS IT Category Management Standard", "CPSM Module 2: Strategic Sourcing (Technology)", "BSA (Business Software Alliance) Software Asset Management Guide", "ISO/IEC 19770-1:2017 Software Asset Management", "IACCM IT Contract Management Standard"],
        processes: [
          "IT hardware category management: server, network, end-user devices & data centre — rolling 18-month pipeline",
          "Software licence optimisation: ISO/IEC 19770-1 SAM programme, true-up management & EA negotiation",
          "Cloud procurement strategy: OPEX vs. CAPEX, multi-cloud governance & FinOps framework",
          "IT vendor qualification: financial health, cybersecurity posture, SLA track record & reference checks",
          "IACCM-aligned IT contract management: SLA design, IP ownership, data ownership & exit provisions",
          "Shadow IT governance: procurement policy enforcement, approved tool catalogue & exception process",
        ],
        flow: ["18-Month IT Forecast", "Category Strategy", "Vendor Qualification", "Contract Negotiation", "Asset Registration"],
        challenges: [
          "Global semiconductor shortages have extended server and networking equipment lead times to 40–80 weeks — CIPS IT Procurement Standard recommends an 18-month rolling hardware procurement forecast with pre-commitment framework agreements to avoid critical-path infrastructure delays.",
          "Software licence overspend of 25–35% is endemic — ISO/IEC 19770-1 Software Asset Management programme implementation requires a complete licence inventory, consumption reconciliation against entitlement, and elimination of unused subscriptions; this alone delivers 25–35% immediate savings.",
          "SaaS sprawl averaging 100–200 applications per Saudi enterprise (30–40% redundant) — CIPS IT Category Management Standard requires a unified SaaS governance process including a master subscription register, business justification review, and annual rationalisation cycle.",
        ],
        solution: "ISC implements ISO/IEC 19770-1 SAM programmes and CIPS IT category management with rolling hardware forecasts — eliminating 25–35% software overspend within 90 days, rationalising SaaS estates by 30–40%, and preventing hardware supply failures through 18-month pipeline procurement.",
      },
      {
        type: 'midstream',
        name: "Midstream — IT Asset Management, Deployment & Cloud Governance",
        color: "#2d508a",
        standards: ["ITIL 4 Service Management (Asset & Configuration Management)", "FinOps Foundation Cloud Financial Management Standard", "ISO/IEC 27001:2022 Information Security Management", "APICS SCOR Digital Supply Chain Framework", "Gartner IT Asset Management Maturity Model"],
        processes: [
          "IT asset lifecycle management: procurement, deployment, maintenance, refresh & secure disposal",
          "ITIL 4 CMDB (Configuration Management Database): asset discovery, dependency mapping & change tracking",
          "Cloud FinOps governance: reserved instances, rightsizing, tag-based cost allocation & showback/chargeback",
          "IT security supply chain: ISO/IEC 27001-aligned vendor security assessments & TPRM programme",
          "Software deployment management: licence-compliant distribution, configuration management & patch governance",
          "IT project supply chain: hardware delivery scheduling, staging, configuration & deployment logistics",
        ],
        flow: ["IT Procurement", "Asset Registration (CMDB)", "Deployment & Config", "Lifecycle Monitoring", "Refresh / Disposal"],
        challenges: [
          "Cloud costs growing 40–80% annually without FinOps governance represent the fastest-growing uncontrolled cost in most Saudi technology organisations — FinOps Foundation data shows that organisations implementing FinOps reduce cloud waste by 30% in the first 90 days through reservation coverage and rightsizing alone.",
          "Unmanaged CMDB means IT teams cannot accurately answer 'what hardware do we have, where is it, and when does it need replacing?' — Gartner shows IT asset management maturity below Level 3 (out of 5) correlates with 20–30% excess inventory and 15–20% over-licencing.",
          "Third-party vendor cyber risk is the fastest-growing attack vector — ISO/IEC 27001:2022 requires a documented Third-Party Risk Management (TPRM) programme with security assessments for all vendors with access to organisational systems.",
        ],
        solution: "ISC implements ITIL 4 CMDB programmes, FinOps Foundation-aligned cloud governance, and ISO/IEC 27001-compliant TPRM programmes — reducing cloud waste by 30%, eliminating hardware over-procurement by 20%, and mitigating third-party cyber supply chain risk.",
      },
      {
        type: 'downstream',
        name: "Downstream — IT Service Management, Vendor Governance & Cybersecurity Supply Chain",
        color: "#C9A84C",
        standards: ["ISO/IEC 20000-1:2018 IT Service Management", "ITIL 4 Supplier Management Practice", "NCSC (National Cyber Security Centre UK / NCA Saudi) Supply Chain Security", "IACCM IT Outsourcing Contract Standard", "CIS Controls v8 Supply Chain Security"],
        processes: [
          "IT service provider governance: ISO/IEC 20000-1 supplier management practice & quarterly reviews",
          "Outsourcing contract management: SLA measurement, penalty administration & service improvement plans",
          "Cybersecurity vendor management: CIS Controls v8 SC-03 assessment, penetration test review & patching SLA",
          "Service desk supply chain: hardware break-fix vendor management, parts availability & SLA compliance",
          "Vendor consolidation: rationalise 15–30 security vendors to integrated platform approach (CIPS)",
          "Exit management: data migration, knowledge transfer, parallel running & transition supply chain plan",
        ],
        flow: ["Service Request", "ISO 20000 SLA Gate", "Vendor Dispatch", "KPI Measurement", "Governance Review"],
        challenges: [
          "IT outsourcing contracts in Saudi Arabia commonly lack enforceable SLA measurement methodologies — IACCM IT Outsourcing Standard shows that SLAs without agreed measurement tools and independent data sources are 40% less likely to trigger penalty payments, regardless of service failure.",
          "Cybersecurity vendor proliferation (15–30 security vendors) creates coverage gaps and management overload — CIS Controls v8 recommends a platform-based consolidation to 5–8 integrated security vendors; Gartner data shows consolidation reduces security management cost by 25–40%.",
          "IT supplier exit management is consistently underplanned — ITIL 4 Supplier Management Practice requires a documented exit management clause in every IT outsourcing contract, including knowledge transfer milestones, data repatriation timelines, and transition supply chain planning.",
        ],
        solution: "ISC designs ISO/IEC 20000-1-compliant IT service governance frameworks with IACCM-aligned outsourcing contracts, implements CIS Controls v8-based cybersecurity vendor consolidation strategies, and delivers ITIL 4 exit management programmes — reducing IT service management cost by 15–20% and closing all critical cyber supply chain gaps.",
      },
    ],
    cases: [
      { client: "Saudi Government Technology Entity", challenge: "Software licence overspend SAR 22M/yr; 180 SaaS apps (45% underutilised); ISO 19770 not implemented; no SAM programme", result: "SAR 8.4M annual saving; 110 SaaS apps (down from 180); ISO/IEC 19770-1 Level 2 achieved" },
      { client: "GCC Telecom Operator", challenge: "Hardware lead-time surprises (18+ months); no 18-month pipeline; FinOps absent; cloud costs growing 65% YoY", result: "18-month rolling IT procurement plan; SAR 12M hardware savings; cloud waste reduced 32%; FinOps Level 2 achieved" },
    ],
  },

};

function ProcessFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <span className="px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-xs font-semibold text-primary shadow-sm whitespace-nowrap">
            {step}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StandardsPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/6 border border-primary/15 rounded-full text-[11px] font-semibold text-primary/80 whitespace-nowrap">
      <BookOpen className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

function StreamCard({ stream, index }: { stream: Stream; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const meta = STREAM_LABELS[stream.type];
  const MetaIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
            style={{ background: meta.bg }}>
            <MetaIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                style={{ background: meta.bg }}>
                {meta.label}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">{meta.desc}</span>
            </div>
            <h3 className="text-base font-extrabold text-primary leading-tight">{stream.name}</h3>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-border">
          {/* Professional Standards */}
          <div className="pt-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Professional Standards Applied</h4>
            <div className="flex flex-wrap gap-2">
              {stream.standards.map(s => <StandardsPill key={s} label={s} />)}
            </div>
          </div>

          {/* Processes */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Key Processes & Activities</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {stream.processes.map((p, i) => (
                <div key={p} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 text-white mt-0.5"
                    style={{ background: stream.color }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/80">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Process Flow */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Process Flow</h4>
            <div className="bg-primary/3 rounded-xl p-4 border border-primary/10">
              <ProcessFlow steps={stream.flow} />
            </div>
          </div>

          {/* Challenges */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Industry Challenges</h4>
            <div className="space-y-3">
              {stream.challenges.map((c, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50/60 rounded-xl p-4 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ISC Solution */}
          <div className="bg-[#C9A84C]/8 rounded-xl p-4 border border-[#C9A84C]/25 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-1">ISC Solution</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{stream.solution}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function IndustryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const info = industryData[slug];

  if (!info) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-primary mb-4">Industry Not Found</h1>
        <p className="text-muted-foreground mb-6">We could not find content for that industry.</p>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  const Icon = info.icon;

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full py-20 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${info.heroColor} 0%, #082C6B 60%, #0B3D91 100%)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.4) 0%, transparent 60%)' }} />
        <div className="relative z-10 container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">Industry Focus</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">{info.name}</h1>
          <p className="text-white/80 text-lg max-w-3xl">{info.tagline}</p>
        </div>
      </div>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-foreground/80 text-lg leading-relaxed border-l-4 border-[#C9A84C] pl-6"
          >
            {info.intro}
          </motion.p>
        </div>
      </section>

      {/* Stream Legend */}
      <section className="py-6 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(STREAM_LABELS) as [string, typeof STREAM_LABELS[keyof typeof STREAM_LABELS]][]).map(([key, meta]) => {
              const MIcon = meta.icon;
              return (
                <div key={key} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-border shadow-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ background: meta.bg }}>
                    <MIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: meta.bg }}>{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{meta.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Streams */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Supply Chain Architecture</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-2">Upstream · Midstream · Downstream</h2>
            <p className="text-muted-foreground mt-2 text-sm">Aligned with CIPS, CPSM, APICS SCOR, ISO, and industry-specific professional standards</p>
          </motion.div>
          <div className="space-y-6">
            {info.streams.map((stream, si) => (
              <StreamCard key={stream.name} stream={stream} index={si} />
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Proven Results</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-2">{info.name} Case Studies</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {info.cases.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: info.heroColor + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: info.heroColor }} />
                  </div>
                  <h3 className="font-bold text-primary leading-tight">{c.client}</h3>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Challenge</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{c.challenge}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-widest mb-1">Result</p>
                  <p className="text-sm text-green-800 font-medium leading-relaxed">{c.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/case-studies">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                View All Case Studies <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#082C6B]">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Ready to Transform Your {info.name} Supply Chain?
          </h2>
          <p className="text-white/70 text-lg">
            Book a confidential consultation with Ma'in Alhaqash MCIPS · CPSM · MSc — tailored specifically to your industry's upstream, midstream, and downstream challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold px-8">
                Book a Consultation <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/maturity">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">
                Start Maturity Assessment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
