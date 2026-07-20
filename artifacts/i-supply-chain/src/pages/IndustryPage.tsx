import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Factory, Zap, Building2, Pill, ShoppingCart, Truck, Anchor, HardHat, Heart, Cpu,
  AlertTriangle, CheckCircle, ChevronRight, ArrowRight,
} from 'lucide-react';

interface Stream {
  name: string;
  color: string;
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

const industryData: Record<string, IndustryInfo> = {
  manufacturing: {
    name: "Manufacturing",
    tagline: "Building the industrial backbone of Saudi Vision 2030",
    intro: "Saudi Arabia's manufacturing sector is undergoing a historic transformation under Vision 2030, with the National Industrial Development and Logistics Program (NIDLP) targeting a tripling of the sector's GDP contribution. Supply chains here must balance global sourcing with Iktva localisation mandates, manage complex raw-material procurement, and sustain lean production lines against volatile commodity prices.",
    icon: Factory,
    heroColor: "#1a4fa8",
    streams: [
      {
        name: "Inbound / Procurement Stream",
        color: "#082C6B",
        processes: [
          "Raw material sourcing & category management",
          "Supplier qualification & AVL management",
          "Purchase order management & expediting",
          "Inbound logistics & customs clearance",
        ],
        flow: ["Demand Signal", "RFQ / Tender", "Supplier Selection", "PO Issue", "Inbound Receipt"],
        challenges: [
          "Heavy reliance on single-source international suppliers creates severe disruption risk when geopolitical or logistics shocks occur.",
          "Iktva localisation mandates require progressive local content increases, but qualified local suppliers are limited in many categories.",
          "Commodity price volatility (steel, aluminium, chemicals) makes budget forecasting and long-term contracting extremely difficult.",
        ],
        solution: "ISC designs dual-source strategies and local supplier development programmes that simultaneously meet Iktva targets and reduce total landed cost by 15-25%.",
      },
      {
        name: "Production / Operations Stream",
        color: "#0B3D91",
        processes: [
          "Production scheduling & capacity planning",
          "Material requirements planning (MRP)",
          "Work-in-progress tracking & quality gates",
          "Maintenance, Repair & Overhaul (MRO) management",
        ],
        flow: ["Sales Forecast", "Master Production Schedule", "MRP Run", "Work Orders", "Production Output"],
        challenges: [
          "Unplanned downtime caused by poor MRO inventory management leads to production stoppages costing SAR 50K-500K per hour.",
          "Disconnected ERP and production systems create data silos -- demand signals take days to translate into procurement actions.",
          "High rate of expedited purchasing (25-40% of POs) due to inaccurate demand forecasting inflates procurement costs by 18-30%.",
        ],
        solution: "ISC implements integrated S&OP processes and MRO optimisation programmes that reduce expedited purchasing by 60% and unplanned downtime by 40%.",
      },
      {
        name: "Outbound / Distribution Stream",
        color: "#C9A84C",
        processes: [
          "Finished goods warehousing & slotting",
          "Order fulfilment & picking accuracy",
          "Last-mile delivery & carrier management",
          "Returns management & reverse logistics",
        ],
        flow: ["Customer Order", "Pick & Pack", "Quality Check", "Dispatch", "Last-Mile Delivery"],
        challenges: [
          "Seasonal demand surges cause warehouse overflow and stock misallocations across distribution centres.",
          "Carrier fragmentation (10-20 logistics providers) creates inconsistent service levels and no unified tracking visibility.",
          "High return rates (8-15%) in B2C manufacturing due to quality escapes not caught at production QC gates.",
        ],
        solution: "ISC redesigns distribution network footprints, consolidates carrier bases, and implements vendor-managed inventory (VMI) arrangements that cut distribution cost by 20%.",
      },
    ],
    cases: [
      {
        client: "Jordanian Steel Manufacturer",
        challenge: "Raw material costs 22% above market benchmark; no strategic sourcing programme",
        result: "$15M in annual savings through supplier consolidation and long-term framework agreements",
      },
      {
        client: "Saudi FMCG Producer",
        challenge: "Iktva compliance at 23% vs. 35% mandatory target; no local supplier development",
        result: "Local supplier development programme raised Iktva to 41% within 18 months",
      },
    ],
  },

  energy: {
    name: "Energy & Oil",
    tagline: "Optimising supply chains for the Kingdom's energy transition",
    intro: "The energy sector in the GCC -- anchored by Saudi Aramco, SABIC, and the Kingdom's national energy companies -- operates the world's most complex and high-stakes supply chains. Procurement decisions worth billions of dollars are made under strict regulatory scrutiny, with zero tolerance for supply failure. As the Kingdom diversifies into renewables and petrochemicals, supply chain strategies must evolve in parallel.",
    icon: Zap,
    heroColor: "#1a5c3a",
    streams: [
      {
        name: "Capital Projects & CAPEX Procurement Stream",
        color: "#1a5c3a",
        processes: [
          "Major equipment sourcing & LSTK tendering",
          "Engineering, Procurement & Construction (EPC) management",
          "Material take-off (MTO) and long-lead item management",
          "Vendor inspection & factory acceptance testing (FAT)",
        ],
        flow: ["Project Scope", "MTO Generation", "Long-Lead Sourcing", "Vendor Inspection", "Site Delivery"],
        challenges: [
          "Long-lead equipment (compressors, turbines, heat exchangers) with 18-36 month delivery windows requires advanced commitment without final engineering -- creating expensive scope changes.",
          "LSTK contractor risk transfer is complex; contract terms frequently lack adequate supply chain risk-sharing clauses, leading to disputes on delays.",
          "Vendor qualification for safety-critical equipment (pressure vessels, valves) requires extensive ASME/API compliance -- most regional suppliers cannot meet this bar.",
        ],
        solution: "ISC provides CAPEX supply chain advisory including long-lead procurement strategies, LSTK contract structuring, and vendor qualification programmes aligned with Aramco IK.SQSP requirements.",
      },
      {
        name: "Operations & Maintenance (O&M) Stream",
        color: "#2d7a4f",
        processes: [
          "Spare parts cataloguing & criticality classification",
          "Storeroom management & min-max optimisation",
          "Shutdown / turnaround (TAR) material pre-staging",
          "Repair & refurbishment vendor management",
        ],
        flow: ["Asset Register", "Criticality Analysis", "Stocking Policy", "Min-Max Setting", "Auto-Replenishment"],
        challenges: [
          "Spare parts inventory worth SAR 200M-2B sitting in storerooms, with 30-40% classified as slow-moving or obsolete -- billions in working capital locked up.",
          "Turnaround (TAR) planning gaps cause last-minute expedited procurement at 40-60% cost premiums with critical schedule risk.",
          "Poor parts standardisation across multiple OEM brands increases stocking complexity and reduces economies of scale in procurement.",
        ],
        solution: "ISC conducts full MRO rationalisation -- criticality-based stocking policies, dead-stock disposal programmes, and TAR supply chain playbooks -- typically freeing 20-35% of inventory value.",
      },
      {
        name: "ESG & Sustainable Procurement Stream",
        color: "#C9A84C",
        processes: [
          "Carbon footprint mapping across Tier-1 and Tier-2 suppliers",
          "ESG supplier assessment and scoring",
          "Responsible sourcing policy development",
          "Sustainability reporting (CDP, GRI, TCFD alignment)",
        ],
        flow: ["Baseline Carbon Audit", "Supplier ESG Scoring", "Improvement Plans", "Annual Assessment", "CDP Reporting"],
        challenges: [
          "International investors and JV partners increasingly require ESG supply chain data that Saudi energy companies are not yet equipped to produce.",
          "Scope 3 emissions (supply chain) represent 60-80% of total carbon footprint but are largely unmeasured and unmanaged.",
          "Supplier diversity and local content obligations under Iktva must be balanced with ESG standards -- sometimes in tension.",
        ],
        solution: "ISC builds end-to-end sustainable procurement frameworks aligned with international standards (UN Global Compact, CDP) while maintaining full Iktva compliance -- enabling access to ESG-conscious capital.",
      },
    ],
    cases: [
      {
        client: "Saudi Energy Services Company",
        challenge: "No ESG metrics; failing international tender qualification on sustainability criteria",
        result: "28% supply chain carbon reduction; qualified for 3 international tenders; CDP A- score achieved",
      },
      {
        client: "GCC Petrochemical Operator",
        challenge: "MRO inventory SAR 1.2B with 38% slow-moving; unplanned downtime at 12% of production hours",
        result: "SAR 290M inventory rationalised; unplanned downtime reduced to 4.5%",
      },
    ],
  },

  government: {
    name: "Government & Public Sector",
    tagline: "Modernising public procurement for Vision 2030 compliance",
    intro: "Saudi government procurement is governed by the Government Tenders and Procurement Law, administered by the Ministry of Finance. With Vision 2030 placing national procurement at the centre of economic transformation -- through Iktva, SME engagement, and digital government -- public sector supply chain leaders face unprecedented reform demands while managing billions in annual spend.",
    icon: Building2,
    heroColor: "#4a1a6b",
    streams: [
      {
        name: "Strategic Procurement & Policy Stream",
        color: "#4a1a6b",
        processes: [
          "Annual procurement planning and budget alignment",
          "Procurement policy design and delegation matrices",
          "Framework agreement strategy and category management",
          "Iktva and SME localisation programme management",
        ],
        flow: ["Budget Approval", "Procurement Plan", "Category Strategy", "Framework Agreements", "Annual Review"],
        challenges: [
          "Reactive, uncoordinated procurement across departments eliminates volume leverage and creates duplicated contracts costing 20-30% more than consolidated spend.",
          "Compliance with Iktva local content requirements demands supplier development infrastructure that most government entities lack.",
          "Resistance to change within procurement teams accustomed to administrative rather than strategic procurement roles.",
        ],
        solution: "ISC designs centralised procurement models and category management frameworks that reduce maverick spending, increase Iktva compliance, and deliver 15-25% cost savings on consolidated spend.",
      },
      {
        name: "Vendor Management & Contract Stream",
        color: "#6b2d9e",
        processes: [
          "Supplier registration, qualification and approved vendor lists",
          "Contract development, review and standardisation",
          "Contract lifecycle management (CLM) system implementation",
          "Supplier performance management and KPI dashboards",
        ],
        flow: ["Supplier Registration", "Qualification Audit", "AVL Approval", "Contract Award", "KPI Monitoring"],
        challenges: [
          "Government entities operate with thousands of unqualified vendors -- creating audit exposure, fraud risk, and service delivery failures.",
          "Contracts are often awarded without performance metrics, making accountability impossible and renewals politically rather than performance-driven.",
          "Manual, paper-based contract management creates document loss, missed renewal dates, and inability to conduct portfolio-level analysis.",
        ],
        solution: "ISC implements end-to-end supplier governance frameworks -- from registration through performance management -- aligned with NCAR and ZATCA supplier compliance requirements.",
      },
      {
        name: "Digital Procurement Transformation Stream",
        color: "#C9A84C",
        processes: [
          "E-procurement system selection and implementation (Etimad, SAP Ariba, Oracle)",
          "Spend analytics and reporting dashboards",
          "Procurement process re-engineering and automation",
          "Change management and procurement capability building",
        ],
        flow: ["As-Is Assessment", "System Selection", "Process Design", "Go-Live & Training", "Optimisation"],
        challenges: [
          "Legacy procurement systems cannot support the Etimad platform requirements mandated for government procurement above SAR 100K.",
          "Procurement staff capacity gap: most teams lack digital literacy for e-procurement platforms, analytics tools, and data governance.",
          "Data quality is poor -- spend data is incomplete, incorrectly coded, and distributed across incompatible systems.",
        ],
        solution: "ISC delivers end-to-end digital procurement transformation programmes -- from system selection through go-live -- with embedded change management that ensures adoption, not just installation.",
      },
    ],
    cases: [
      {
        client: "GCC Government Procurement Authority",
        challenge: "Manual supplier onboarding; 0% Iktva compliance visibility; non-compliant contracts",
        result: "100% Iktva regulatory compliance; 60% reduction in supplier onboarding time; 35 contract templates standardised",
      },
      {
        client: "Saudi Ministry Entity",
        challenge: "SAR 2.4B uncoordinated spend across 12 departments; no spend visibility",
        result: "Category management programme delivered SAR 380M in identified savings in Year 1",
      },
    ],
  },

  pharma: {
    name: "Pharmaceutical & Healthcare",
    tagline: "Securing medicine supply chains for the Kingdom's health ambitions",
    intro: "Saudi Arabia's pharmaceutical market -- worth SAR 30B+ annually and growing at 8% -- is governed by SFDA regulations with strict cold-chain, traceability, and good distribution practice (GDP) requirements. Vision 2030's target to localise 40% of pharmaceutical manufacturing by 2030 is reshaping supply chains from import-dependent to locally resilient.",
    icon: Pill,
    heroColor: "#1a6b4a",
    streams: [
      {
        name: "Inbound / Import & Regulatory Stream",
        color: "#1a6b4a",
        processes: [
          "SFDA import registration and product dossier management",
          "Supplier qualification under GDP and GMP standards",
          "Cold-chain import logistics management",
          "Customs clearance and regulatory documentation",
        ],
        flow: ["SFDA Registration", "Supplier Audit", "Import Order", "Cold-Chain Transport", "GDP Verification"],
        challenges: [
          "SFDA registration timelines (12-24 months) create stock-out risk as products awaiting registration cannot be imported commercially.",
          "Cold-chain failures in last-mile distribution (2C-8C products) are estimated to cause SAR 200M+ in product wastage annually across the Kingdom.",
          "Single-country sourcing dependencies (primarily European and Indian APIs) expose the entire supply chain to geopolitical and logistics disruption.",
        ],
        solution: "ISC develops multi-source procurement strategies and cold-chain audit programmes that reduce temperature excursion incidents and ensure regulatory compliance from origin to patient.",
      },
      {
        name: "Hospital / Pharmacy Supply Chain Stream",
        color: "#2d8a5e",
        processes: [
          "Hospital formulary management and ABC/VEN analysis",
          "Demand forecasting and reorder point optimisation",
          "Pharmacy inventory management and expiry control",
          "Consignment and VMI arrangement management",
        ],
        flow: ["Prescription Data", "Demand Forecast", "Reorder Trigger", "Supplier Dispatch", "Pharmacy Receipt"],
        challenges: [
          "Hospital pharmacies routinely carry 4-8 months of inventory while simultaneously experiencing stock-outs on high-demand medicines -- a dual failure of forecasting and stock policy.",
          "Expiry-related wastage averages 3-7% of pharmaceutical inventory value in GCC hospitals -- representing millions in avoidable losses annually.",
          "Formulary rationalisation is politically sensitive; physicians resist generic substitution even when clinically equivalent.",
        ],
        solution: "ISC implements ABC/VEN-driven formulary management, demand-driven replenishment policies, and VMI pilots with key suppliers that reduce inventory value by 30% while eliminating stock-outs on critical medicines.",
      },
      {
        name: "Supplier Governance & Compliance Stream",
        color: "#C9A84C",
        processes: [
          "Supplier performance scorecard design and quarterly reviews",
          "Tender management and price benchmarking",
          "Contract management with price adjustment mechanisms",
          "Pharmacovigilance and supply disruption reporting",
        ],
        flow: ["Supplier Register", "Quarterly KPI Review", "Contract Renewal", "Benchmark Analysis", "SFDA Reporting"],
        challenges: [
          "Pharmaceutical companies lack standardised supplier scorecards aligned with SFDA GDP requirements -- making performance management informal and legally exposed.",
          "Reference pricing mandated by SFDA creates procurement complexity: companies cannot freely renegotiate without regulatory implications.",
          "Invoice disputes and payment delays (averaging 60-90 days) damage relationships with critical suppliers and risk supply continuity.",
        ],
        solution: "ISC designs SFDA-compliant supplier governance frameworks and contract management systems that reduce payment disputes by 80% and deliver 15-20% cost reductions through structured benchmarking.",
      },
    ],
    cases: [
      {
        client: "Leading Saudi Pharmaceutical Group",
        challenge: "47 unqualified suppliers; no performance scorecard; 30-45 day payment disputes",
        result: "23% procurement cost reduction; 47 to 18 suppliers rationalised; 94% on-time payment rate",
      },
      {
        client: "GCC Hospital Network",
        challenge: "6-month average inventory; 5.2% expiry wastage; simultaneous stock-outs on 12 critical medicines",
        result: "Inventory reduced to 2.8 months; wastage cut to 1.1%; zero stock-outs for 18 months post-implementation",
      },
    ],
  },

  retail: {
    name: "Retail & FMCG",
    tagline: "Demand-driven supply chains for the Kingdom's growing consumer market",
    intro: "Saudi Arabia's retail sector -- the largest in the MENA region at SAR 500B+ -- is experiencing rapid transformation through e-commerce growth (35% YoY), Vision 2030 lifestyle changes, and global FMCG players entering the market. Supply chain agility, demand sensing, and last-mile excellence are now as critical as product quality and pricing.",
    icon: ShoppingCart,
    heroColor: "#6b1a1a",
    streams: [
      {
        name: "Demand Planning & Replenishment Stream",
        color: "#6b1a1a",
        processes: [
          "Statistical demand forecasting and market intelligence",
          "S&OP cycle management and consensus planning",
          "Safety stock and reorder point optimisation",
          "Promotion and seasonality demand management",
        ],
        flow: ["POS Data", "Statistical Forecast", "S&OP Review", "Replenishment Order", "Store Delivery"],
        challenges: [
          "Ramadan and Hajj demand surges create 200-400% volume spikes in specific categories -- traditional linear forecasting models fail completely.",
          "Siloed buying and logistics functions mean promotional volumes are not communicated to replenishment teams until days before execution.",
          "Perishables waste rates of 8-15% in food retail driven by poor demand forecasting and last-in-first-out stock rotation practices.",
        ],
        solution: "ISC implements advanced S&OP processes incorporating Ramadan/seasonal adjustment factors, typically reducing forecast error by 30% and out-of-stock events by 50%.",
      },
      {
        name: "Supplier & Category Management Stream",
        color: "#8b2020",
        processes: [
          "Category strategy development and supplier rationalisation",
          "Joint business planning with key suppliers",
          "Trading terms and promotional funding management",
          "Ethical sourcing and private label supplier development",
        ],
        flow: ["Category Review", "Supplier Shortlist", "JBP Negotiation", "Trading Terms", "Performance Review"],
        challenges: [
          "Supermarket chains in KSA work with 1,000-3,000 suppliers; 80% of volume comes from 15-20% of suppliers -- but all receive equal management attention.",
          "Trading terms negotiations are transactional rather than collaborative -- suppliers withhold innovations and share better terms with competing customers.",
          "Private label development is immature in GCC retail -- leaving significant margin improvement opportunities unexploited.",
        ],
        solution: "ISC designs tiered supplier management models and joint business planning frameworks that reallocate effort to value-creating relationships and unlock 3-5% margin improvement.",
      },
      {
        name: "Omnichannel Fulfilment & Logistics Stream",
        color: "#C9A84C",
        processes: [
          "Warehouse network design and slotting optimisation",
          "Omnichannel order management system (OMS) design",
          "Last-mile delivery network and carrier management",
          "Return management and reverse logistics",
        ],
        flow: ["Order Receipt", "WMS Pick & Pack", "Quality Gate", "Carrier Dispatch", "Customer Delivery"],
        challenges: [
          "Online and offline inventory is managed in separate systems -- causing overselling online and stock misallocations between channels.",
          "Last-mile delivery cost in KSA averages SAR 22-35 per order; without route optimisation, e-commerce margins are structurally negative below SAR 150 order values.",
          "High return rates (12-20% in fashion/electronics) with no reverse logistics infrastructure create operational chaos and unrecovered inventory value.",
        ],
        solution: "ISC designs unified omnichannel fulfilment architectures and carrier management frameworks that reduce last-mile cost by 25-35% and return processing cost by 40%.",
      },
    ],
    cases: [
      {
        client: "Regional Retail Chain (120+ Stores)",
        challenge: "15-20% out-of-stock during peaks; SAR 4.5M in overstock write-offs",
        result: "67% reduction in out-of-stock; 31% inventory cost reduction; SAR 4.5M working capital released",
      },
      {
        client: "Saudi FMCG Distributor",
        challenge: "Forecast error at 38%; expedited orders representing 28% of POs",
        result: "Forecast error reduced to 14%; expedited POs down to 6%; SAR 1.8M annual logistics savings",
      },
    ],
  },

  logistics: {
    name: "Logistics & Distribution",
    tagline: "Building the distribution backbone for the Kingdom's trade ambitions",
    intro: "Saudi Arabia's National Transport and Logistics Strategy targets the Kingdom becoming a global logistics hub -- ranked among the top 10 globally by 2030. With SAR 100B+ invested in logistics infrastructure (NEOM, King Salman Park, mega-logistics zones), operators face extraordinary growth opportunity and mounting competitive pressure on cost and service excellence.",
    icon: Truck,
    heroColor: "#6b4a1a",
    streams: [
      {
        name: "Network Design & Capacity Stream",
        color: "#6b4a1a",
        processes: [
          "Logistics network modelling and optimisation",
          "Warehouse location strategy and footprint design",
          "Fleet and capacity planning",
          "Cross-docking and consolidation centre strategy",
        ],
        flow: ["Demand Data", "Network Model", "Location Analysis", "Footprint Decision", "Implementation"],
        challenges: [
          "Many operators designed their logistics networks 10-15 years ago; the rapid growth of new economic zones has made existing footprints sub-optimal.",
          "Warehouse rentals in prime logistics zones (KAEC, Riyadh Industrial City) have increased 35-50% since 2020, forcing operators to trade off location quality vs. cost.",
          "Fleet utilisation averages 58-65% across Saudi 3PLs -- significantly below the 80-85% benchmark -- inflating cost-per-pallet and eroding margins.",
        ],
        solution: "ISC conducts network optimisation studies using gravity modelling and scenario analysis, identifying 15-25% cost reduction opportunities through footprint rationalisation and fleet utilisation improvement.",
      },
      {
        name: "Operations Excellence Stream",
        color: "#8b6320",
        processes: [
          "Warehouse management system (WMS) implementation",
          "Labour productivity measurement and improvement",
          "Pick, pack and despatch process optimisation",
          "SLA management and customer KPI reporting",
        ],
        flow: ["Inbound Receipt", "Put-Away", "Storage", "Pick & Pack", "Despatch & POD"],
        challenges: [
          "Manual, paper-based warehouse operations remain common -- with pick accuracy rates of 92-95% vs. the WMS-enabled benchmark of 99.5%+.",
          "Labour productivity in Saudi warehousing is typically 40-60% below UAE benchmarks, partly due to workforce skill gaps and high turnover.",
          "Operations teams spend 2-4 hours daily compiling manual KPI reports instead of managing operations.",
        ],
        solution: "ISC deploys WMS implementation programmes and lean warehouse process redesigns that increase pick accuracy to 99%+, reduce labour cost by 20-30%, and automate all customer KPI reporting.",
      },
      {
        name: "Risk & Business Continuity Stream",
        color: "#C9A84C",
        processes: [
          "Supply chain risk mapping and criticality assessment",
          "Dual-source and contingency contracting strategies",
          "Business continuity plan (BCP) development",
          "Crisis response playbook and supplier insurance review",
        ],
        flow: ["Risk Register", "Criticality Scoring", "Mitigation Design", "BCP Documentation", "Annual Testing"],
        challenges: [
          "Single-source dependencies on key equipment suppliers create catastrophic exposure to supplier insolvency or production shutdown.",
          "Most Saudi 3PLs have no documented business continuity plan -- discovered only when a crisis (fire, flood, system failure) occurs.",
          "Cyber-attack risk on logistics management systems (TMS, WMS) is growing but unaddressed in most risk frameworks.",
        ],
        solution: "ISC delivers comprehensive supply chain risk programmes -- dual-source strategies, BCP documentation, and cyber-resilience frameworks -- reducing annual penalty exposure by SAR 2-5M per operator.",
      },
    ],
    cases: [
      {
        client: "International Logistics Operator",
        challenge: "12 single-source critical suppliers; one insolvency caused SAR 900K in client penalties",
        result: "Zero single-source dependencies; 48hr maximum recovery objective; SAR 2.1M avoided penalty exposure",
      },
      {
        client: "Saudi 3PL (8 Warehouses)",
        challenge: "Fleet utilisation at 58%; manual WMS; pick accuracy 93.2%",
        result: "Fleet utilisation to 79%; pick accuracy 99.4%; SAR 3.2M annual cost reduction",
      },
    ],
  },

  marine: {
    name: "Marine & Port Operations",
    tagline: "Optimising supply chains at the Kingdom's maritime gateways",
    intro: "Saudi Arabia's Red Sea and Arabian Gulf coastlines host some of the world's busiest maritime corridors. Jeddah Islamic Port, King Abdulaziz Port (Dammam), and Yanbu Industrial Port together handle over 300M tonnes annually. Port Authority reforms under Vision 2030 are transforming these gateways into integrated logistics hubs -- creating entirely new supply chain operating models.",
    icon: Anchor,
    heroColor: "#1a4a6b",
    streams: [
      {
        name: "Port Procurement & Vessel Supply Stream",
        color: "#1a4a6b",
        processes: [
          "Ship chandlery and provisions procurement",
          "Bunker fuel procurement and hedging strategy",
          "Port services and pilotage contract management",
          "Marine spare parts and dry-dock supply management",
        ],
        flow: ["Vessel Schedule", "Provision Planning", "Supplier Dispatch", "Port Delivery", "Master Sign-off"],
        challenges: [
          "Bunker fuel represents 30-50% of vessel operating cost; without hedging strategies, operators are fully exposed to commodity price swings of 40-80% annually.",
          "Ship chandlery procurement is highly fragmented -- vessel masters often negotiate independently, eliminating corporate volume leverage.",
          "Port turnaround time is extended by supply chain failures: provisions arriving late, spares delayed at customs, causing demurrage costs of $10,000-$50,000 per day.",
        ],
        solution: "ISC designs consolidated marine procurement programmes with bunker hedging strategies and chandlery framework agreements that reduce vessel supply cost by 15-25% and eliminate supply-caused demurrage.",
      },
      {
        name: "Port Operations & Logistics Stream",
        color: "#2d6b8a",
        processes: [
          "Container terminal throughput planning",
          "Yard management and berth scheduling optimisation",
          "Equipment maintenance supply chain (cranes, RTGs, trailers)",
          "Hinterland connectivity and last-mile freight management",
        ],
        flow: ["Vessel ETA", "Berth Allocation", "Discharge Plan", "Yard Storage", "Gate Release"],
        challenges: [
          "Equipment downtime (quay cranes, RTGs) directly impacts terminal throughput -- yet MRO supply chains for port equipment are typically unoptimised.",
          "Port community system (PCS) integration gaps between terminal operators, customs, and freight forwarders create documentation delays averaging 12-24 hours per consignment.",
          "Trucking capacity shortfalls during peak periods (Ramadan pre-stocking, Hajj season) cause yard congestion and vessel waiting time.",
        ],
        solution: "ISC delivers port supply chain optimisation programmes -- from equipment MRO rationalisation to PCS integration advisory -- that increase terminal throughput by 15-20% and reduce container dwell time.",
      },
      {
        name: "Free Zone & Trade Facilitation Stream",
        color: "#C9A84C",
        processes: [
          "Free zone setup and trade facilitation strategy",
          "Customs compliance and ATA carnet management",
          "Re-export and transshipment supply chain design",
          "Trade finance and letter of credit management",
        ],
        flow: ["Trade Route Analysis", "FZ Registration", "Customs Setup", "Transshipment Flow", "Revenue Reporting"],
        challenges: [
          "Free zone regulations across Jeddah, Dammam, and Yanbu are complex and frequently updated -- non-compliance attracts significant fines and operating license risk.",
          "Many manufacturers waste the value of free-zone status by failing to structurally separate their FZ and domestic operations supply chains.",
          "Trade finance costs in the GCC average 15-25% higher than European benchmarks due to lack of supply chain financing structures.",
        ],
        solution: "ISC provides free zone supply chain structuring and trade facilitation advisory that unlocks full duty-deferral benefits, reduces customs compliance risk, and introduces supply chain finance programmes.",
      },
    ],
    cases: [
      {
        client: "Red Sea Shipping Operator",
        challenge: "Fragmented chandlery procurement; demurrage averaging $28,000 per vessel call due to supply delays",
        result: "Consolidated procurement framework; demurrage eliminated; 19% vessel supply cost reduction",
      },
      {
        client: "Saudi Port Terminal Operator",
        challenge: "Equipment downtime at 14% of operating hours; MRO spend 35% over benchmark",
        result: "Downtime reduced to 5.2%; MRO cost reduced SAR 8.5M annually through criticality-based stocking",
      },
    ],
  },

  construction: {
    name: "Construction & EPC",
    tagline: "Supply chains for the Kingdom's giga-project era",
    intro: "Saudi Arabia is executing the largest construction programme in human history -- NEOM, The Line, Diriyah Gate, Qiddiya, Red Sea Project -- alongside Vision 2030 social infrastructure delivery. With SAR 1.4 trillion in active projects, construction supply chains face unprecedented scale, complexity, and speed-to-delivery pressure. Material shortages, subcontractor failures, and logistics bottlenecks are the most common causes of project delays.",
    icon: HardHat,
    heroColor: "#6b3a1a",
    streams: [
      {
        name: "Material Procurement & Supply Stream",
        color: "#6b3a1a",
        processes: [
          "Bill of quantities (BOQ) procurement planning",
          "Strategic sourcing for bulk materials (steel, cement, aggregates)",
          "Subcontractor pre-qualification and management",
          "Site delivery scheduling and just-in-time logistics",
        ],
        flow: ["BOQ Extraction", "Material Schedule", "Supplier Sourcing", "Delivery Schedule", "Site Receipt"],
        challenges: [
          "Saudi construction demand is creating severe supply shortages in structural steel and MEP equipment -- with lead times of 6-18 months for key items.",
          "BOQ-to-procurement timeline gaps mean purchasing teams start procurement 30-60 days after materials were needed on-site.",
          "Subcontractor financial fragility: 40-60% of subcontractors on major KSA projects experience cash flow crises that threaten schedule.",
        ],
        solution: "ISC implements construction supply chain command centres with BOQ-integrated procurement scheduling, bulk material pre-commitment strategies, and subcontractor financial health monitoring.",
      },
      {
        name: "Site Logistics & Inventory Stream",
        color: "#8a4f20",
        processes: [
          "Site layout and materials storage planning",
          "Inbound logistics coordination and traffic management",
          "Material tracking and inventory control on-site",
          "Equipment and plant hire management",
        ],
        flow: ["Delivery Schedule", "Gate Registration", "Material Receipt", "Site Warehouse", "Issue to Works"],
        challenges: [
          "Large construction sites (5-15 km2) waste 15-25% of labour time on material searching and retrieval due to poor site storage organisation.",
          "Equipment hire idle time averages 35-45% on Saudi mega-projects -- companies pay for equipment that sits unused while urgently needed elsewhere.",
          "Theft and loss of construction materials on-site averages 3-8% of material value -- a multi-million riyal problem on large projects.",
        ],
        solution: "ISC implements site logistics management programmes with RFID-based material tracking, optimised hire fleet utilisation, and security-integrated materials management -- recovering 3-5% of total project cost.",
      },
      {
        name: "Contract & Supplier Governance Stream",
        color: "#C9A84C",
        processes: [
          "EPC contract structure and risk allocation review",
          "Variation order (VO) management and commercial recovery",
          "Subcontractor payment governance and cash flow management",
          "Close-out and defects liability period supply chain management",
        ],
        flow: ["Contract Award", "Performance Baseline", "Progress Monitoring", "VO Management", "Close-Out"],
        challenges: [
          "Variation orders (VOs) on Saudi construction projects average 15-35% of contract value -- yet most contractors lack commercial management systems to capture all entitlement.",
          "Main contractor payment delays cascade through subcontractor chains -- a 90-day payment delay to a main contractor typically creates a 120-150 day delay to Tier-2 subcontractors.",
          "Contract close-out is poorly managed: defect rectification supply chains are unplanned, creating years of post-completion disputes.",
        ],
        solution: "ISC provides EPC commercial and supply chain advisory -- VO capture programmes, subcontractor payment governance, and close-out supply chain planning -- recovering 5-15% of contract value in unclaimed entitlements.",
      },
    ],
    cases: [
      {
        client: "Major Saudi EPC Contractor",
        challenge: "Material shortages causing 18-week schedule delay; VO entitlement not tracked",
        result: "Bulk pre-commitment strategy eliminated material delays; SAR 42M VO entitlement recovered",
      },
      {
        client: "Giga-Project Subcontractor",
        challenge: "Equipment hire utilisation at 41%; site material losses estimated SAR 3.2M",
        result: "Utilisation raised to 73%; material loss reduced to 0.8%; SAR 5.1M net annual saving",
      },
    ],
  },

  healthcare: {
    name: "Healthcare",
    tagline: "Resilient health supply chains for the Kingdom's care transformation",
    intro: "Saudi Arabia's healthcare sector is undergoing transformation under Vision 2030's Health Sector Transformation Programme -- privatising hospitals, expanding primary care, and digitalising clinical pathways. With MoH managing 2,500+ facilities and the private sector growing at 12% annually, healthcare supply chains must balance cost efficiency, regulatory compliance, and zero-tolerance for supply failure.",
    icon: Heart,
    heroColor: "#6b1a2d",
    streams: [
      {
        name: "Medical Supply & Procurement Stream",
        color: "#6b1a2d",
        processes: [
          "Medical device and consumable category management",
          "Tender management (MOH, NHC procurement rounds)",
          "Supplier qualification under SFDA MDR",
          "Consignment and VMI inventory programme management",
        ],
        flow: ["Clinical Requirement", "Formulary Committee", "Tender Specification", "Supplier Award", "Consignment Setup"],
        challenges: [
          "Clinical demand data is poor -- requisitions are made on instinct rather than consumption analysis, creating both over-stocking and stock-out conditions simultaneously.",
          "Medical device procurement is highly influenced by physician preference; clinically equivalent lower-cost alternatives are routinely rejected without value analysis.",
          "SFDA Medical Device Registration (MDR) timelines create import gaps -- products need 12-18 months registration before commercial importation.",
        ],
        solution: "ISC implements value-based procurement frameworks and physician engagement programmes that reduce medical supply cost by 15-22% while improving service levels and maintaining full SFDA compliance.",
      },
      {
        name: "Pharmacy & Medicines Management Stream",
        color: "#8b2040",
        processes: [
          "Hospital formulary management and DTC committee support",
          "Medicines procurement and tender management",
          "Cold-chain medicine management (biologics, vaccines)",
          "Expiry management and controlled drug compliance",
        ],
        flow: ["Formulary Review", "Consumption Analysis", "Reorder Calculation", "Procurement Order", "Pharmacy Receipt"],
        challenges: [
          "Saudi hospital pharmacies carry an average of 5.4 months of medicines inventory -- more than double the optimal 2-2.5 months -- consuming 15-20% of working capital unnecessarily.",
          "Biologics and specialty medicines (representing 40-60% of pharmacy spend) require sophisticated cold-chain management that most hospitals manage informally.",
          "Antimicrobial stewardship requirements (MoH circular 2023) demand medicines consumption analysis capabilities most pharmacies do not have.",
        ],
        solution: "ISC builds end-to-end hospital pharmacy supply chain systems -- from formulary management to cold-chain compliance -- reducing inventory value by 30-40% and wastage from 5% to under 1%.",
      },
      {
        name: "Hospital Operations & Facilities Stream",
        color: "#C9A84C",
        processes: [
          "Facilities management procurement and contract governance",
          "Linen, catering and housekeeping supply management",
          "Capital equipment lifecycle and replacement planning",
          "Biomedical engineering supply chain and maintenance contracts",
        ],
        flow: ["Asset Register", "Maintenance Schedule", "Parts Requisition", "Vendor Service", "Asset Update"],
        challenges: [
          "Facilities management (FM) contracts in Saudi hospitals are routinely over-specified and under-managed -- with no KPI dashboards, no penalty mechanisms, and automatic renewals.",
          "Biomedical equipment maintenance contracts are sole-sourced to OEMs at 25-40% above independent service provider benchmarks.",
          "Capital equipment replacement planning is done reactively -- hospitals replace equipment only when it fails, rather than based on lifecycle cost modelling.",
        ],
        solution: "ISC conducts facilities and biomedical supply chain reviews that introduce competitive FM tendering, independent biomedical maintenance programmes, and capital replacement planning -- saving 20-30% on non-clinical procurement.",
      },
    ],
    cases: [
      {
        client: "GCC Hospital Network (12 facilities)",
        challenge: "5.4 months pharmacy inventory; 5.2% expiry waste; simultaneous stock-outs on 12 critical drugs",
        result: "Inventory at 2.8 months; wastage 1.1%; zero critical stock-outs for 18 months",
      },
      {
        client: "Private Saudi Hospital Group",
        challenge: "Biomedical maintenance costs SAR 18M/yr; no competitive tendering; 23% of equipment past optimal replacement",
        result: "SAR 4.8M annual saving; replacement programme funded by contract savings",
      },
    ],
  },

  tech: {
    name: "Technology & ICT",
    tagline: "Supply chains for the Kingdom's digital economy ambitions",
    intro: "Saudi Arabia's ICT sector -- driven by Vision 2030's digital economy targets and NEOM's technology ambitions -- is one of the fastest-growing in the world. From hyperscale data centres to smart city infrastructure, technology supply chains must manage complex global hardware sourcing, software licensing, and rapid deployment timelines against a backdrop of US-China trade tensions affecting semiconductor availability.",
    icon: Cpu,
    heroColor: "#1a3a6b",
    streams: [
      {
        name: "Hardware & Infrastructure Procurement Stream",
        color: "#1a3a6b",
        processes: [
          "IT hardware category management and vendor management",
          "Data centre infrastructure and cooling procurement",
          "Network equipment and cabling supply management",
          "End-user devices and peripherals lifecycle management",
        ],
        flow: ["Tech Requirement", "Specification", "Vendor Selection", "Hardware Delivery", "Asset Tagging"],
        challenges: [
          "Global semiconductor shortages have extended lead times for servers and networking equipment to 40-80 weeks -- traditional just-in-time procurement models are broken.",
          "Technology refresh cycles (3-5 years) are compressing; organisations that plan hardware procurement reactively are consistently behind on capacity and performance.",
          "Shadow IT procurement (departments buying hardware without IT governance) creates cybersecurity risk and inflates total cost by 25-40% versus centralised procurement.",
        ],
        solution: "ISC implements IT category management programmes with rolling 18-month hardware procurement forecasts, vendor consolidation strategies, and shadow IT governance -- reducing hardware cost by 20-30%.",
      },
      {
        name: "Software & Licensing Management Stream",
        color: "#2d508a",
        processes: [
          "Software asset management (SAM) and licence optimisation",
          "SaaS contract management and renewal management",
          "Cloud cost governance (FinOps)",
          "Vendor consolidation and enterprise agreement negotiation",
        ],
        flow: ["Software Audit", "Licence Analysis", "Optimisation Plan", "Contract Negotiation", "Renewal Calendar"],
        challenges: [
          "Saudi organisations overspend on software licences by an estimated 25-35% on average -- buying more than they use and missing enterprise agreement volume thresholds.",
          "SaaS sprawl: the average Saudi enterprise runs 100-200 SaaS applications, with 30-40% redundant or underutilised -- representing millions in annual wasted subscription cost.",
          "Cloud cost governance is absent in most organisations -- teams provision cloud resources without FinOps controls, with costs growing 40-80% annually with no budget approval.",
        ],
        solution: "ISC conducts software asset management audits and cloud FinOps programmes that eliminate 25-35% of software spend within 90 days without any service reduction.",
      },
      {
        name: "IT Service & Vendor Management Stream",
        color: "#C9A84C",
        processes: [
          "IT outsourcing contract design and governance",
          "Managed service provider (MSP) performance management",
          "Cybersecurity vendor management and contract compliance",
          "IT service level agreement (SLA) monitoring and reporting",
        ],
        flow: ["Service Requirement", "RFP Design", "Vendor Selection", "SLA Governance", "Performance Review"],
        challenges: [
          "IT outsourcing contracts in Saudi Arabia are commonly under-specified: SLAs lack clear measurement methodologies, remedies are inadequate, and exit provisions are insufficient.",
          "Cybersecurity vendor proliferation: organisations manage 15-30 security vendors with no integration, creating coverage gaps and management overload.",
          "IT service provider relationships are transactional rather than strategic -- leading to poor innovation, slow problem resolution, and race-to-the-bottom renewal negotiations.",
        ],
        solution: "ISC designs IT sourcing strategies and vendor governance frameworks that consolidate the vendor base, strengthen SLA terms with meaningful remedies, and improve service quality while reducing IT outsourcing cost by 15-20%.",
      },
    ],
    cases: [
      {
        client: "Saudi Government Technology Entity",
        challenge: "Software licence overspend estimated SAR 22M/yr; 180 SaaS applications, 45% underutilised",
        result: "SAR 8.4M annual software saving; SaaS estate rationalised to 110 applications",
      },
      {
        client: "GCC Telecom Operator",
        challenge: "Hardware procurement reactive; 18-month lead-time surprises; IT category unmanaged",
        result: "18-month rolling procurement plan implemented; SAR 12M hardware cost reduction; zero critical outages from supply failure",
      },
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

function StreamCard({ stream, index }: { stream: Stream; index: number }) {
  const [open, setOpen] = useState(index === 0);
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
          <div className="w-2 h-10 rounded-full shrink-0" style={{ background: stream.color }} />
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Stream {index + 1}</span>
            <h3 className="text-lg font-extrabold text-primary leading-tight">{stream.name}</h3>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-border">
          <div className="pt-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Key Processes</h4>
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

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Process Flow</h4>
            <div className="bg-primary/3 rounded-xl p-4 border border-primary/10">
              <ProcessFlow steps={stream.flow} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Pain Points & Challenges</h4>
            <div className="space-y-3">
              {stream.challenges.map((c, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50/60 rounded-xl p-4 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>

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

      {/* 3 Streams */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Supply Chain Architecture</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-2">3 Supply Chain Streams</h2>
            <p className="text-muted-foreground mt-2">Click each stream to explore processes, flows, and challenges</p>
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
            Book a confidential consultation with Ma'in Alhaqash -- tailored specifically to your industry's supply chain challenges.
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
