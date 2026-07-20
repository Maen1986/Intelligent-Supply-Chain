export interface DiagnosticReport {
  businessSize: string;
  region: string;
  industry: string;
  focusArea: string;
  challenge?: string;
  executiveSummary: string;
  diagnosis: string[];
  rootCauses: string[];
  recommendations: string[];
  kpis: string[];
  risks: { risk: string; mitigation: string }[];
  roadmap: {
    phase1: { title: string; timeframe: string; actions: string[] };
    phase2: { title: string; timeframe: string; actions: string[] };
    phase3: { title: string; timeframe: string; actions: string[] };
  };
  regionalAlignment?: string;
}

const summaryTemplates: Record<string, string> = {
  Startup: "As an early-stage {industry} organization, your supply chain foundation is at a critical formative stage. Decisions made now regarding procurement structure, supplier selection, and process governance will define your operational DNA for years to come. This diagnostic identifies your most pressing vulnerabilities and provides a prioritized roadmap for building a resilient, scalable supply chain from the ground up.",
  SME: "Your {industry} organization is navigating the critical transition from reactive operations to proactive supply chain management. This diagnostic identifies key structural gaps in your {focusArea} capability and outlines targeted interventions to accelerate maturity without over-engineering for your current scale.",
  "Mid-Market": "As a mid-market {industry} organization, supply chain complexity has outpaced the systems and processes originally designed to manage it. This diagnostic surfaces the structural misalignments in your {focusArea} function and prescribes a staged transformation that delivers near-term efficiency gains while building long-term capability.",
  Enterprise: "Your enterprise-scale {industry} supply chain operates across a complex network of suppliers, geographies, and regulatory environments. This diagnostic examines systemic vulnerabilities in your {focusArea} function and provides a transformation roadmap calibrated to your organizational scale and risk tolerance.",
  "Government Entity": "As a government entity in the {industry} sector, your procurement and supply chain operations must balance operational efficiency with public accountability, compliance requirements, and national development objectives. This diagnostic identifies structural gaps and aligns recommendations with applicable regulatory and policy frameworks."
};

const diagnosisDict: Record<string, string[]> = {
  "Supply Chain Strategy": [
    "Reactive rather than proactive supply chain management, driven by firefighting rather than strategic planning",
    "Insufficient end-to-end visibility across the supply network, creating blind spots in inventory and demand",
    "Misalignment between supply chain capabilities and broader organizational growth strategy",
    "Fragmented decision-making authority with no single owner of supply chain performance"
  ],
  "Procurement": [
    "Decentralized purchasing with limited spend visibility across categories and business units",
    "Over-reliance on incumbent suppliers without periodic competitive benchmarking",
    "Procurement function perceived as an administrative cost center rather than a strategic value driver",
    "Inconsistent contract terms and pricing across similar supplier categories"
  ],
  "CLM": [
    "Contracts stored in disparate systems with no centralized repository or expiry tracking",
    "Manual contract review processes creating bottlenecks and increasing legal risk exposure",
    "Limited post-award contract performance monitoring, leading to value leakage",
    "No standardized contract templates, resulting in inconsistent terms and negotiation inefficiency"
  ],
  "Supplier Governance": [
    "Supplier performance measured sporadically and without standardized KPI frameworks",
    "Overconcentration of spend in single-source suppliers creating supply continuity risk",
    "No formal supplier development or tiering program to optimize the supplier base",
    "Reactive supplier relationship management driven by crises rather than partnership strategy"
  ],
  "Risk Management": [
    "Risk identification is informal and undocumented, with no structured risk register",
    "Limited business continuity planning for critical supply disruptions",
    "Geographic concentration risk in sourcing, particularly relevant post-pandemic",
    "No early warning indicators or supply chain monitoring dashboard in place"
  ],
  "Sustainability": [
    "ESG criteria absent from supplier qualification and evaluation processes",
    "Limited carbon footprint visibility across Scope 3 supply chain emissions",
    "No formal sustainable procurement policy or supplier code of conduct",
    "Reputational and regulatory risk from uninvestigated supply chain labor practices"
  ],
  "Resiliency": [
    "Single-source dependencies in critical material categories with no approved alternates",
    "Inventory buffers and safety stock levels not calibrated to supply chain risk profile",
    "Limited dual-sourcing or regional sourcing strategies to offset global disruption risk",
    "No supply chain stress-testing or scenario planning process"
  ],
  "Digital Transformation": [
    "Core supply chain processes still managed via spreadsheets and email, limiting scalability",
    "Disconnected ERP, procurement, and logistics systems creating data silos",
    "Limited real-time data availability for decision-making in procurement and inventory",
    "Resistance to technology adoption without a clear digital transformation roadmap"
  ],
  "Organizational Design": [
    "Supply chain and procurement functions structurally siloed, limiting strategic integration",
    "Talent gaps in analytical and digital skills within the supply chain team",
    "Role ambiguity between procurement, logistics, and operations functions",
    "No formal capability development or succession planning for supply chain leadership"
  ],
  "Government Compliance": [
    "Incomplete alignment of procurement processes with applicable public procurement regulations",
    "Nationalization (Saudization/Iktva/Jordan Buy) targets not yet integrated into supplier selection criteria",
    "Audit readiness gaps in documentation and approval trail for public procurement",
    "Insufficient familiarity with government contract terms and dispute resolution mechanisms"
  ]
};

const rootCausesDict: Record<string, string[]> = {
  Startup: ["Early-stage resource constraints limiting investment in process infrastructure", "Founder-led procurement decisions without institutional process documentation", "Absence of dedicated supply chain or procurement function", "Reactive growth prioritization over operational foundation-building"],
  SME: ["Operational processes inherited from startup phase not re-engineered for scale", "Limited internal expertise to design and implement structured supply chain frameworks", "Technology investment deferred due to competing growth priorities", "No formal performance measurement system to identify and escalate problems"],
  "Mid-Market": ["Complexity has grown faster than the governance structures designed to manage it", "Patchwork of legacy systems and manual workarounds accumulated over growth years", "Fragmented organizational accountability for end-to-end supply chain performance", "Strategic intent exists but execution roadmaps lack specificity and ownership"],
  Enterprise: ["Organizational complexity and matrix structures slowing decision-making and change", "Technology debt from legacy ERP implementations limiting agility", "Competing functional priorities deprioritizing supply chain transformation investment", "Change management challenges in driving adoption across large, distributed teams"],
  "Government Entity": ["Rigid procurement regulations limiting flexibility and speed of response", "Politically complex supplier ecosystem balancing compliance with national content requirements", "Budget cycle constraints misaligned with supply chain investment timelines", "Limited private-sector expertise in government procurement leadership roles"]
};

const recommendationsDict: Record<string, string[]> = {
  "Supply Chain Strategy": ["Conduct a full supply chain network design review to map current-state flows and identify structural inefficiencies", "Establish a Supply Chain Centre of Excellence (CoE) with clear ownership and executive sponsorship", "Implement a supply chain maturity assessment (SCMM) to benchmark current capability against industry peers", "Build an integrated Sales & Operations Planning (S&OP) process connecting demand signals to supply decisions", "Define and deploy a 3-year supply chain roadmap with measurable milestones and quarterly review cadence"],
  "Procurement": ["Consolidate spend data from all business units into a single procurement analytics platform", "Implement a category management framework prioritizing the top 80% of spend by value", "Establish formal supplier qualification criteria and a pre-approved vendor list", "Introduce competitive tendering thresholds and a documented sourcing decision framework", "Reposition procurement as a strategic function reporting to CFO or COO level"],
  "CLM": ["Deploy a Contract Lifecycle Management (CLM) platform — even a lightweight tool — to centralize all contracts", "Implement automated contract expiry alerts with 90/60/30-day notification workflows", "Standardize contract templates by category with pre-approved legal clause libraries", "Establish quarterly contract performance reviews with key suppliers", "Define contract approval authority matrix and integrate with procurement governance"],
  "Supplier Governance": ["Design and implement a formal Supplier Performance Management (SPM) framework with quarterly scorecards", "Conduct a supplier rationalization exercise to reduce tail spend and consolidate the approved vendor list", "Establish a strategic supplier tiering program (Tier 1/2/3) with differentiated engagement models", "Introduce Supplier Days or quarterly business reviews with strategic partners", "Develop a supplier development program to improve capability in critical supply categories"],
  "Risk Management": ["Build a formal supply chain risk register covering demand, supply, operational, and external risk categories", "Conduct a single-source dependency analysis and implement dual-sourcing for critical items within 6 months", "Develop supply chain business continuity plans (BCP) for top-10 risk scenarios", "Implement basic supply chain monitoring dashboards with leading indicators", "Stress-test the supply chain with tabletop exercises covering disruption scenarios"],
  "Sustainability": ["Develop a Sustainable Procurement Policy and embed ESG criteria into supplier qualification scoring", "Commission a Scope 3 emissions baseline assessment for the top supply chain tiers", "Implement a Supplier Code of Conduct covering labor standards, environmental practices, and anti-corruption", "Set measurable ESG KPIs for the procurement function aligned to organizational sustainability commitments", "Engage top-10 strategic suppliers in joint sustainability improvement programs"],
  "Resiliency": ["Map critical single-source dependencies and initiate dual or multi-source qualification programs immediately", "Review and recalibrate safety stock levels based on supply lead time variability and demand uncertainty", "Develop regional sourcing alternatives for top-10 critical material categories", "Implement supply chain scenario planning as part of the annual strategic planning cycle", "Establish a Supply Chain Risk Committee meeting quarterly to review resilience posture"],
  "Digital Transformation": ["Conduct a digital maturity assessment to establish current-state baseline and prioritize investment areas", "Standardize core supply chain data on a single ERP or digital platform as the foundation for analytics", "Implement supplier portal technology to streamline purchase orders, invoicing, and performance tracking", "Deploy basic supply chain analytics dashboards covering procurement spend, inventory, and on-time delivery", "Develop a phased digital transformation roadmap: data foundation → process automation → advanced analytics"],
  "Organizational Design": ["Conduct an organizational design review to eliminate structural silos between procurement, logistics, and operations", "Define a RACI matrix for supply chain decision rights across functions and business units", "Invest in targeted supply chain talent development — analytics, negotiation, and digital skills", "Establish a Supply Chain leadership forum to align functional priorities and resolve inter-departmental conflicts", "Build a succession plan for critical supply chain roles to reduce key-person dependency"],
  "Government Compliance": ["Conduct a comprehensive procurement compliance audit against applicable public procurement regulations", "Integrate national content (Saudization/IKTVA/local content) requirements into supplier qualification and RFP evaluation criteria", "Implement document management processes to ensure full audit trail for all procurement decisions", "Train procurement team on applicable government procurement law and recent regulatory updates", "Establish a compliance calendar covering tender publication timelines, reporting obligations, and regulatory submissions"]
};

const kpisDict: Record<string, string[]> = {
  "Supply Chain Strategy": ["Perfect Order Rate: Target >95%", "Supply Chain Cost as % of Revenue: Target reduction of 15% over 18 months", "Forecast Accuracy: Target >85%", "Inventory Turns: Benchmark vs. industry median", "Supplier On-Time Delivery: Target >92%", "Supply Chain Maturity Score: Quarterly improvement tracking"],
  "Procurement": ["Procurement Cost Savings: Target 8-12% of addressable spend in Year 1", "Supplier Lead Time: Reduction of 20% within 12 months", "Contract Compliance Rate: Target >90% of purchases under contract", "Purchase Order Cycle Time: Target <3 business days", "Spend Under Management: Target >80% of total spend", "Supplier Quality Defect Rate: Target <2%"],
  "CLM": ["Contract Cycle Time (draft to signature): Target <10 business days", "Contract Renewal Rate: Target >85% of strategic contracts renewed on time", "Contract Value at Risk (expired/non-compliant): Target <5% of portfolio", "Post-Award Compliance Rate: Target >90%", "Savings Captured vs. Contract Terms: Quarterly variance reporting"],
  "Supplier Governance": ["Supplier On-Time Delivery: Target >92%", "Supplier Quality Acceptance Rate: Target >98%", "Supplier Scorecard Completion Rate: Target 100% quarterly", "Single-Source Dependency Ratio: Target reduction to <20% of spend", "Strategic Supplier Satisfaction Score: Annual survey, target >4/5", "Supplier Incident Response Time: Target <24 hours for critical issues"],
  "Risk Management": ["Supply Chain Risk Register Coverage: Target 100% of critical categories", "Business Continuity Plan (BCP) Coverage: Target 100% of Tier 1 risks", "Single-Source Exposure: Target <20% of total spend", "Supply Chain Disruption Recovery Time: Target <72 hours for non-critical, <24 hours for critical", "Risk Mitigation Action Completion Rate: Target >80% on time"],
  "Sustainability": ["Supplier ESG Audit Coverage: Target 100% of Tier 1 suppliers annually", "Scope 3 Emissions Baseline: Established within 12 months", "Sustainable Procurement Spend %: Target 30% of addressable spend within 2 years", "Supplier Code of Conduct Acceptance Rate: Target 100%", "ESG Non-Compliance Incidents: Target zero Tier 1 incidents"],
  "Resiliency": ["Single-Source Dependency Ratio: Target reduction to <20% of critical spend", "Safety Stock Coverage Days: Calibrated to lead time + demand variability", "Alternate Supplier Qualification Rate: Target 2+ approved sources for all critical items", "Supply Disruption Incident Rate: Track and target quarter-on-quarter reduction", "BCP Test Completion Rate: Target 100% of critical scenarios tested annually"],
  "Digital Transformation": ["ERP/System Data Quality Score: Target >95%", "Process Automation Rate: % of manual processes automated, target 40% in Year 1", "Supply Chain Visibility Coverage: % of spend with real-time tracking capability", "Report Generation Time: Reduction from manual to automated, target >70% time saving", "Digital Tool Adoption Rate: % of team actively using new tools, target >80%"],
  "Organizational Design": ["Role Clarity Index (internal survey): Target >80% clarity on supply chain roles", "Cross-Functional SLA Compliance: Target >90%", "Talent Retention Rate: Supply chain team, target >85%", "Training Hours per FTE: Target >40 hours/year", "Supply Chain Leadership Succession Coverage: Target 100% of critical roles"],
  "Government Compliance": ["Procurement Compliance Rate: Target 100% of regulated tenders compliant", "National Content Compliance: Meeting applicable Saudization/IKTVA/local content targets", "Audit Finding Rate: Target <5 findings per annual audit", "Tender Publication Lead Time: 100% compliance with mandatory notice periods", "Documentation Completeness Rate: Target 100% for all procurement decisions"]
};

const risksPool = [
  { risk: "Single point of failure in critical supply", mitigation: "Develop and qualify secondary suppliers within 6 months." },
  { risk: "Poor contract visibility leading to auto-renewals", mitigation: "Implement contract repository with 60-day expiry alerts." },
  { risk: "Misaligned KPIs between departments", mitigation: "Establish shared supply chain scorecards visible to executive team." },
  { risk: "Resistance to new digital tools", mitigation: "Appoint cross-functional champions and phase rollout with robust training." }
];

export function generateReport(params: {
  businessSize: string;
  region: string;
  industry: string;
  focusArea: string;
  challenge?: string;
}): DiagnosticReport {
  
  const summaryTpl = summaryTemplates[params.businessSize] || summaryTemplates["SME"];
  const executiveSummary = summaryTpl
    .replace('{industry}', params.industry)
    .replace('{focusArea}', params.focusArea);

  const diagnosis = diagnosisDict[params.focusArea] || diagnosisDict["Supply Chain Strategy"];
  const rootCauses = rootCausesDict[params.businessSize] || rootCausesDict["SME"];
  const recommendations = recommendationsDict[params.focusArea] || recommendationsDict["Supply Chain Strategy"];
  const kpis = kpisDict[params.focusArea] || kpisDict["Supply Chain Strategy"];

  const risks = risksPool.slice(0, 3); // Just pick 3 generic risks for now

  let roadmap = {
    phase1: { title: "Phase 1: Quick Wins & Assessment", timeframe: "0-3 months", actions: ["Conduct spend analysis across all categories", "Identify and address top 3 procurement risk areas", "Standardize purchase order and approval process"] },
    phase2: { title: "Phase 2: Structural Improvement", timeframe: "3-12 months", actions: ["Implement category management across top spend categories", "Launch formal supplier performance scorecards", "Establish procurement policy and approval authority matrix"] },
    phase3: { title: "Phase 3: Strategic Transformation", timeframe: "12-24 months", actions: ["Integrate procurement into strategic planning cycle", "Implement ERP procurement module", "Launch strategic supplier partnership program"] }
  };

  if (params.businessSize === 'Startup') {
    roadmap = {
      phase1: { title: "Phase 1: Establish Foundations", timeframe: "0-3 months", actions: ["Document current procurement process end-to-end", "Select and onboard 3-5 strategic suppliers with formal agreements", "Implement basic contract template library", "Establish a spend tracking mechanism"] },
      phase2: { title: "Phase 2: Build Core Capability", timeframe: "3-9 months", actions: ["Implement lightweight procurement system or cloud ERP module", "Launch supplier performance tracking (monthly reviews)", "Develop supplier qualification checklist", "Introduce category management for top 3 spend categories"] },
      phase3: { title: "Phase 3: Scale and Optimize", timeframe: "9-18 months", actions: ["Implement full CLM system", "Expand to formal S&OP process", "Deploy supply chain analytics dashboard", "Pursue supply chain certification or external advisory engagement"] }
    };
  } else if (params.businessSize === 'Enterprise') {
    roadmap = {
      phase1: { title: "Phase 1: Mobilize & Assess", timeframe: "0-6 months", actions: ["Form Supply Chain Transformation Office with executive sponsorship", "Conduct enterprise-wide supply chain diagnostic and benchmarking", "Identify top-10 value creation opportunities with business case", "Establish baseline metrics and measurement framework"] },
      phase2: { title: "Phase 2: Transform Core Processes", timeframe: "6-24 months", actions: ["Deploy enterprise CLM and procurement platform", "Implement global category management and strategic sourcing program", "Launch supplier rationalization and strategic partnership program", "Build integrated S&OP process with digital enablement"] },
      phase3: { title: "Phase 3: Sustain & Scale", timeframe: "24-48 months", actions: ["Embed AI and advanced analytics across supply chain decision-making", "Achieve industry-leading maturity benchmarks in all core processes", "Establish supply chain as a measurable source of competitive advantage", "Build continuous improvement culture with internal Center of Excellence"] }
    };
  } else if (params.businessSize === 'Government Entity') {
    roadmap = {
      phase1: { title: "Phase 1: Compliance & Assessment", timeframe: "0-3 months", actions: ["Conduct procurement compliance audit and gap analysis", "Map current processes against applicable regulatory requirements", "Identify and remediate any critical compliance gaps immediately", "Establish procurement documentation and audit trail standards"] },
      phase2: { title: "Phase 2: Governance & Efficiency", timeframe: "3-18 months", actions: ["Implement e-procurement system aligned with government standards", "Integrate national content requirements into all RFP and evaluation processes", "Launch supplier governance framework with government-specific KPIs", "Develop procurement team capability in public sector procurement law"] },
      phase3: { title: "Phase 3: Strategic Value & Vision 2030 Alignment", timeframe: "18-36 months", actions: ["Align procurement strategy with national development plan objectives", "Implement strategic sourcing for government priority categories", "Build supplier development program supporting national champions", "Position procurement function as enabler of national economic objectives"] }
    };
  } else if (params.businessSize === 'Mid-Market') {
    roadmap = {
      phase1: { title: "Phase 1: Diagnostic & Quick Wins", timeframe: "0-6 months", actions: ["Commission cross-functional supply chain assessment", "Implement quick-win cost reduction initiatives targeting 5% savings", "Establish supply chain governance structure and RACI", "Standardize supplier performance measurement"] },
      phase2: { title: "Phase 2: Core Transformation", timeframe: "6-18 months", actions: ["Deploy integrated procurement and CLM platform", "Implement full category management across all spend categories", "Launch supplier development program for Tier 1 suppliers", "Build supply chain analytics and reporting capability"] },
      phase3: { title: "Phase 3: Advanced Capability", timeframe: "18-36 months", actions: ["Implement predictive analytics for demand and supply planning", "Achieve supply chain digital transformation milestones", "Develop center-of-excellence model for ongoing capability building", "Position supply chain as measurable competitive differentiator"] }
    };
  }

  let regionalAlignment = undefined;
  if (params.region === 'Saudi Arabia') {
    regionalAlignment = "This assessment is contextualized within Saudi Arabia's Vision 2030 economic transformation agenda. Key implications for your supply chain and procurement function include: alignment with Saudization (Nitaqat) workforce localization requirements in procurement and logistics roles; compliance with IKTVA (In-Kingdom Total Value Add) local content mandates for government and energy sector supply chains; opportunity to leverage the Public Investment Fund (PIF) supply chain development ecosystem; and alignment with Saudi Green Initiative sustainability commitments. Procurement processes should be structured for G-Cloud and ETIMAD compliance where applicable.";
  } else if (params.region === 'Jordan') {
    regionalAlignment = "This assessment is contextualized within Jordan's Economic Modernization Vision (EMV) and applicable regulatory frameworks. Key implications include: alignment with Buy Jordan policy and local content requirements in government procurement; compliance with Jordan's Public Procurement Law and Tender Directorate requirements; opportunity to leverage Jordan's strategic position as a regional logistics and manufacturing hub (JAFZA, Aqaba SEZ); and integration with Jordan's national Digital Economy agenda.";
  } else if (params.region === 'Other GCC') {
    regionalAlignment = "This assessment is contextualized within the GCC's collective economic diversification agenda and applicable national frameworks (UAE: Operation 300bn / National Procurement Policy; Qatar: National Vision 2030 / TAWTEEN; Kuwait: New Kuwait Vision 2035; Bahrain: Bahrain Economic Vision 2030; Oman: Oman Vision 2040). Key implications include: alignment with national content and Emiratization/Qatarization/Omanization requirements; compliance with applicable government procurement regulations; and opportunity to leverage GCC free trade zones and regional logistics networks.";
  }

  return {
    ...params,
    executiveSummary,
    diagnosis,
    rootCauses,
    recommendations,
    kpis,
    risks,
    roadmap,
    regionalAlignment
  };
}
