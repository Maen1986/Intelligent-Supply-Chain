// One-off generator for seo/routes.json (kept for transparency/regeneration).
// Headings and summaries are copied VERBATIM from the live pages (captured 22 Oct 2026);
// titles/descriptions are written to fit search-result limits (title <=60, description <=155).
import { writeFileSync } from 'node:fs';
const S = 'I Supply Chain';
const r = (path, title, description, h1, summary, priority = '0.7', changefreq = 'monthly', group = 'page') =>
  ({ path, title, description, h1, summary, priority, changefreq, group });
const routes = [
  r('/', `${S} — AI Supply Chain Consultancy for the GCC`,
    'AI-powered supply chain consultancy for Saudi Arabia, the GCC and worldwide: executive briefings, diagnostics, benchmarking and risk assessment.',
    'Your Intelligent Supply Chain Consultant — Anytime, Anywhere.',
    'We help organizations build resilient, sustainable, and efficient supply chains through intelligent AI consultancy and professional human expertise.', '1.0', 'weekly', 'home'),
  r('/about', `About Us | ${S}`,
    'A boutique supply chain consultancy for the GCC and worldwide, founded by Ma\'in Alhaqash MCIPS CPSM MSc MIPP. Our values, approach and certifications.',
    'About I Supply Chain',
    'A boutique supply chain consultancy built for the GCC and worldwide — combining global expertise with deep regional intelligence.', '0.8'),
  r('/insights', `Supply Chain Insights | ${S}`,
    'Expert perspectives on supply chain strategy, procurement, risk and the evolving GCC business landscape, including Vision 2030 supply chains.',
    'Insights',
    'Expert perspectives on supply chain strategy, procurement, risk, and the evolving GCC business landscape.', '0.7', 'weekly'),
  r('/csr', `Free Supply Chain Diagnostic for Startups | ${S}`,
    'Free supply chain support for startups and small businesses: our contribution to stronger, more resilient communities.',
    'CSR Free Diagnostic',
    'Free supply chain support for startups and small businesses — our contribution to stronger, more resilient communities.'),
  r('/case-studies', `Illustrative Engagement Scenarios | ${S}`,
    'Illustrative examples of how ISC frameworks apply to realistic GCC supply chain challenges, with outcomes grounded in industry benchmarks.',
    'Illustrative Engagement Scenarios',
    'Illustrative examples of how ISC\'s frameworks apply to realistic GCC supply chain challenges, with outcomes grounded in industry benchmarks.'),
  r('/consultant', `Book a Supply Chain Consultation | ${S}`,
    'Schedule a confidential session directly with Ma\'in Alhaqash. Appointment requests are confirmed within 24 hours.',
    'Book a Consultation',
    'Schedule a confidential session directly with Ma\'in Alhaqash — confirmed within 24 hours.', '0.8'),
  r('/lean-six-sigma', `Lean Six Sigma & Quality Excellence | ${S}`,
    'Eliminate waste, reduce variation and build quality into every supply chain process, across the GCC and worldwide.',
    'Lean, Six Sigma & Quality Excellence',
    'Eliminate waste, reduce variation, and build quality into every supply chain process — from strategy to operational execution across the GCC and worldwide.'),
  r('/risk-management', `Supply Chain Risk Management | ${S}`,
    'ISO 31000-aligned identification, assessment and mitigation of supply chain risks across the GCC and worldwide.',
    'Supply Chain Risk Management',
    'Proactive, ISO 31000-aligned identification, assessment, and mitigation of supply chain risks — protecting revenue, operations, and reputation across the GCC and worldwide.'),
  r('/governance-compliance', `Procurement Governance & Compliance | ${S}`,
    'A 4-layer governance model, from policy architecture to board-level oversight, across the GCC and global regulatory landscape.',
    'Governance & Compliance Framework',
    'Structured governance that protects, enables, and creates value — from policy architecture to board-level oversight — across the GCC and global regulatory landscape.'),
  r('/legal', `Legal, Copyright & IP Notice | ${S}`,
    'Intellectual property, copyright and usage notice for the I Supply Chain platform, methodologies and AI tools.',
    'Legal, Copyright & IP Notice',
    'All intellectual property, methodologies, AI tools, frameworks and content on this platform are exclusively owned by I Supply Chain.', '0.3', 'yearly', 'legal'),
  r('/data-sources', `Data Sources & Methodology | ${S}`,
    'The authoritative data sources, scoring methodology and benchmark revision history behind the ISC KPI platform.',
    'Data Sources & Methodology',
    'Full documentation of the authoritative data sources, scoring methodology, and benchmark revision history behind the ISC KPI platform.', '0.4', 'monthly', 'legal'),
];
const sol = (slug, title, description, h1, summary) =>
  routes.push(r(`/solutions/${slug}`, `${title} | ${S}`, description, h1, summary, '0.8', 'monthly', 'solution'));
sol('supply-chain-strategy', 'Supply Chain Strategy', 'End-to-end supply chain design aligned to your business objectives and Vision 2030, using SCOR, network design and S&OP frameworks.', 'Supply Chain Strategy', 'End-to-end supply chain design aligned to your business objectives and Vision 2030.');
sol('procurement-excellence', 'Procurement Excellence', 'Strategic sourcing, supplier transformation and procurement capability that delivers measurable savings, using CIPS category management and Kraljic.', 'Procurement Excellence', 'Strategic sourcing, supplier transformation, and procurement capability that delivers measurable savings.');
sol('contract-lifecycle-management', 'Contract Lifecycle Management', 'Contract authoring to renewal: CLM that protects value, ensures compliance and eliminates leakage across the GCC and worldwide.', 'Contract Lifecycle Management', 'From contract authoring to renewal — full CLM that protects value, ensures compliance, and eliminates leakage across the GCC and worldwide.');
sol('supplier-relationship-governance', 'Supplier Relationship & Governance', 'Structured SRM that moves you from transactional buying to strategic partnerships that drive performance, resilience and mutual value.', 'Supplier Relationship & Governance', 'From transactional buying to strategic partnerships — structured SRM that drives performance, resilience, and mutual value across your supplier base.');
sol('risk-management-solution', 'Supply Chain Risk Management Solution', 'Proactive, ISO 31000-aligned supply chain risk identification, assessment and mitigation, with risk registers and continuity plans.', 'Risk Management', 'Proactive, ISO 31000-aligned supply chain risk identification, assessment, and mitigation.');
sol('sustainability-esg', 'Sustainability & ESG', 'ESG integration, Scope 3 measurement, circular procurement and Saudi Net Zero alignment for supply chains.', 'Sustainability & ESG', 'ESG integration, Scope 3 measurement, circular procurement, and Saudi Net Zero alignment.');
sol('resiliency', 'Supply Chain Resiliency', 'Build supply chains that absorb disruption and recover fast, designed for the GCC\'s geopolitical and logistical realities.', 'Resiliency', 'Build supply chains that absorb disruption, recover fast, and emerge stronger — battle-tested on the GCC\'s unique geopolitical and logistical realities, and built to scale worldwide.');
sol('digital-transformation', 'Supply Chain Digital Transformation', 'Technology enablement, ERP optimisation and digital supply chain maturity roadmaps.', 'Digital Transformation', 'Technology enablement, ERP optimisation, and digital supply chain maturity roadmaps.');
sol('value-engineering', 'Value Engineering', 'Systematic function analysis that removes non-value-added cost without compromising quality, performance or compliance, for GCC capital projects.', 'Value Engineering', 'Systematic function analysis that eliminates non-value-added cost without compromising quality, performance, or compliance — critical for GCC capital projects.');
sol('lean-agile-supply-chain', 'Lean & Agile Supply Chain', 'Waste elimination, flow optimisation and agile response models that cut lead times and reduce inventory.', 'Lean & Agile Supply Chain', 'Waste elimination, flow optimisation, and agile response models that cut lead times and reduce inventory.');
sol('process-improvement-policy', 'Process Improvement & Policy', 'Lean, Six Sigma and structured policy design that standardises operations and meets Saudi and GCC regulatory requirements.', 'Process Improvement & Policy', 'Lean, Six Sigma, and structured policy design that eliminates waste, standardises operations, and ensures compliance with Saudi and GCC regulatory requirements.');
sol('training-capability-building', 'Training & Capability Building', 'CIPS-aligned procurement and supply chain learning programmes for GCC teams, delivered in Arabic and English.', 'Training & Capability Building', 'CIPS-aligned procurement and supply chain learning programmes — designed for the GCC workforce and adaptable for teams worldwide, delivered in Arabic and English, and built to stick.');
const ind = (slug, name, summary, short) =>
  routes.push(r(`/industry/${slug}`, `${short || name} Supply Chain | ${S}`,
    `Supply chain and procurement consulting for ${short || name} organisations in Saudi Arabia and the GCC, aligned to CIPS and ISO standards.`,
    name, summary, '0.6', 'monthly', 'industry'));
ind('manufacturing', 'Manufacturing', 'Saudi Arabia\'s manufacturing sector is undergoing a historic transformation under Vision 2030, with the National Industrial Development and Logistics Programme (NIDLP) targeting a tripling of GDP contribution.');
ind('energy', 'Energy & Oil', 'The GCC energy sector — anchored by Saudi Aramco, SABIC, and the Kingdom\'s Vision 2030 energy diversification agenda — operates the world\'s most complex and high-stakes supply chains.');
ind('government', 'Government & Public Sector', 'Saudi government procurement is governed by the Government Tenders and Procurement Law (Royal Decree M/128 2019) and administered through the NCAR (National Centre for Competitive Procurement).', 'Government', 'Government');
ind('pharma', 'Pharmaceutical & Healthcare Products', 'Securing medicine supply chains for the Kingdom\'s health ambitions.', 'Pharma', 'Pharma');
ind('retail', 'Retail & FMCG', 'Demand-driven supply chains for the Kingdom\'s growing consumer market.');
ind('logistics', 'Logistics & Distribution', 'Building the distribution backbone for the Kingdom\'s trade ambitions.', 'Logistics', 'Logistics');
ind('marine', 'Marine & Port Operations', 'Saudi Arabia\'s Red Sea and Arabian Gulf coastlines host some of the world\'s busiest maritime corridors.', 'Marine & Port', 'Marine & Port');
ind('construction', 'Construction & EPC', 'Saudi Arabia is executing the largest construction programme in human history — NEOM, The Line, Diriyah Gate, Qiddiya, Red Sea Project — alongside Vision 2030 social infrastructure.');
ind('healthcare', 'Healthcare', 'Resilient health supply chains for the Kingdom\'s care transformation.');
ind('tech', 'Technology & ICT', 'Saudi Arabia\'s ICT sector — driven by Vision 2030 digital economy targets and NEOM\'s technology ambitions — is one of the world\'s fastest-growing.');

const site = {
  name: 'I Supply Chain',
  url: 'https://iscsupplychain.com',
  legalNote: 'Single source for sitemap, per-route <head>, JSON-LD and the client-side SeoManager.',
  description: 'AI-powered supply chain consultancy for Saudi Arabia, the GCC and worldwide, with executive briefings, benchmarking, savings modelling and risk assessment.',
  telephone: '+966549479722',
  founder: "Ma'in Alhaqash",
  areaServed: ['Saudi Arabia', 'GCC', 'Worldwide'],
  logoPath: '/brand/logo.png',
};
// Real client routes that must stay OUT of search results (tools, accounts, admin).
const privatePaths = [
  '/diagnostic', '/intelligence', '/maturity', '/report-generator', '/login', '/command-center', '/kraljic',
  '/problem-map', '/industry-benchmark', '/decision-lab', '/admin', '/admin/leads', '/admin/integrations',
  '/admin/automations', '/admin/evidence-review', '/admin/platform-impact', '/account', '/my-assessments',
  '/action-tracker', '/brief', '/workbench', '/decision-memory', '/supplier-dependency',
  '/supplier-recovery-portfolio', '/supplier-copq', '/raci-matrix', '/pre-qualification-asl', '/onboarding',
  '/periodic-evaluation', '/blacklist', '/offboarding', '/lcgpa-readiness', '/local-content-icv',
  '/freezone-routing', '/gcc-seasonal-calendar', '/roi-waterfall', '/customer-voice',
];
writeFileSync(new URL('./routes.json', import.meta.url), JSON.stringify({ site, routes, privatePaths }, null, 2) + '\n');
console.log('routes:', routes.length, 'private:', privatePaths.length);
