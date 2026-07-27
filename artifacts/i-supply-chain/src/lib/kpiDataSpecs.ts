/**
 * KPI Data Specifications — I Supply Chain
 *
 * For each KPI, defines:
 *   • inputs  — raw operational data the client must provide
 *   • calculate — derives the KPI value from those inputs
 *   • formula — human-readable formula string
 *   • methodology — what this KPI measures and why
 *   • dataSource — where to find each input in the client's systems
 *
 * Used by KPIDashboard to generate professional data-collection CSV
 * templates and to auto-calculate KPI values on import.
 */

export interface KpiInputField {
  /** Short key used as the row label in the CSV */
  id: string;
  /** Column label shown in the template */
  label: string;
  /** Unit shown in the Unit column */
  unit: string;
  /** Tells the client where to pull this number from */
  dataSource: string;
  /** Example value shown in the template */
  example: number;
}

export interface KpiDataSpec {
  /** Must match the id in KPI_FRAMEWORKS */
  kpiId: string;
  /** What this KPI fundamentally measures */
  methodology: string;
  /** Human-readable calculation formula */
  formula: string;
  /** Additional calculation notes shown in template */
  notes: string;
  /** Raw data inputs the client must fill in */
  inputs: KpiInputField[];
  /**
   * Calculate the KPI value from the user's inputs.
   * Returns NaN if required inputs are missing or invalid.
   */
  calculate: (vals: Record<string, number>) => number;
}

// ─── Helper ────────────────────────────────────────────────────────────────
function safe(v: number | undefined): number {
  return v !== undefined && isFinite(v) ? v : NaN;
}
function pct(numerator: number, denominator: number): number {
  if (!denominator) return NaN;
  return Math.round((numerator / denominator) * 1000) / 10;
}
function avg(total: number, count: number): number {
  if (!count) return NaN;
  return Math.round((total / count) * 10) / 10;
}
/** DPMO → Sigma level (approximation, accurate ±0.1σ for DPMO 3.4–1,000,000) */
function dpmoToSigma(dpmo: number): number {
  if (dpmo <= 0) return 6.0;
  if (dpmo >= 1_000_000) return 0;
  const s = 0.8406 + Math.sqrt(29.37 - 2.221 * Math.log(dpmo));
  return Math.round(s * 10) / 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLY CHAIN STRATEGY
// ═══════════════════════════════════════════════════════════════════════════
const SUPPLY_CHAIN_STRATEGY: KpiDataSpec[] = [
  {
    kpiId: 'por',
    methodology: 'Perfect Order Rate measures the % of customer orders fulfilled correctly across four simultaneous conditions: delivered on time, in full, damage-free, and with accurate documentation. A single failure in any condition disqualifies the order.',
    formula: 'POR% = (Perfect Orders ÷ Total Orders Shipped) × 100',
    notes: 'An order is "perfect" only if ALL 4 conditions are met simultaneously. Count each order once — not each line.',
    inputs: [
      { id: 'total_orders', label: 'Total customer orders shipped in the period', unit: 'orders', dataSource: 'ERP / OMS order fulfilment report — count distinct order numbers dispatched', example: 1200 },
      { id: 'perfect_orders', label: 'Orders meeting ALL 4 criteria simultaneously (on-time + in-full + damage-free + correct documentation)', unit: 'orders', dataSource: 'Cross-reference: (1) delivery date ≤ committed date in TMS, (2) zero shortage lines in WMS, (3) no damage claim in returns log, (4) no invoice/doc discrepancy in AP log', example: 1098 },
    ],
    calculate: ({ total_orders, perfect_orders }) =>
      pct(safe(perfect_orders), safe(total_orders)),
  },
  {
    kpiId: 'otif',
    methodology: 'On-Time In-Full measures the % of supplier or customer deliveries that arrive both by the committed date AND at 100% of the ordered quantity. It is the primary measure of fulfilment reliability used by retailers such as Walmart and Amazon.',
    formula: 'OTIF% = (Deliveries On-Time AND In-Full ÷ Total Deliveries Dispatched) × 100',
    notes: 'Both conditions must be met on the SAME delivery. A shipment that arrives on time but short 5 units is NOT OTIF. Use agreed delivery window (e.g. ±0 days or ±1 day) per your contract.',
    inputs: [
      { id: 'total_deliveries', label: 'Total delivery lines / shipments dispatched in the period', unit: 'deliveries', dataSource: 'WMS despatch report or TMS shipment log — one row per distinct shipment event', example: 850 },
      { id: 'otif_deliveries', label: 'Deliveries received On-Time AND In-Full (both conditions met on same shipment)', unit: 'deliveries', dataSource: 'POD confirmed date ≤ promised date (TMS) AND GRN quantity = PO quantity (WMS/ERP). Must match both fields on the same record.', example: 782 },
    ],
    calculate: ({ total_deliveries, otif_deliveries }) =>
      pct(safe(otif_deliveries), safe(total_deliveries)),
  },
  {
    kpiId: 'sccost',
    methodology: 'Supply Chain Cost as % of Revenue quantifies the total operating cost of the supply chain relative to the revenue it supports. Includes all logistics, warehousing, inventory carrying, order management, and supply chain administration costs.',
    formula: 'SC Cost % = (Total SC Costs ÷ Total Revenue) × 100',
    notes: 'Include: inbound freight, outbound freight, warehousing & storage, inventory carrying cost (typically 20–30% of avg inventory value/yr), order processing, SC IT, and SC headcount. Exclude: cost of goods purchased.',
    inputs: [
      { id: 'transport_cost', label: 'Transportation costs (inbound + outbound freight, last-mile)', unit: 'SAR', dataSource: 'Finance / accounts payable — freight invoice total for the period', example: 1_200_000 },
      { id: 'warehouse_cost', label: 'Warehousing & storage costs (rent, utilities, handling labour)', unit: 'SAR', dataSource: 'Finance — warehouse P&L or cost centre report', example: 800_000 },
      { id: 'inventory_carry', label: 'Inventory carrying cost (avg inventory value × 25%/yr, pro-rated to period)', unit: 'SAR', dataSource: 'Finance — (avg inventory value × carrying rate) ÷ 12 × months in period', example: 600_000 },
      { id: 'sc_admin_cost', label: 'SC administration & IT costs (SC staff, systems, order processing)', unit: 'SAR', dataSource: 'Finance — SC headcount cost + SC systems cost for the period', example: 400_000 },
      { id: 'total_revenue', label: 'Total company revenue for the same period', unit: 'SAR', dataSource: 'Finance — P&L top-line revenue for the period', example: 37_500_000 },
    ],
    calculate: ({ transport_cost, warehouse_cost, inventory_carry, sc_admin_cost, total_revenue }) => {
      const totalCost = safe(transport_cost) + safe(warehouse_cost) + safe(inventory_carry) + safe(sc_admin_cost);
      return pct(totalCost, safe(total_revenue));
    },
  },
  {
    kpiId: 'c2c',
    methodology: 'Cash-to-Cash Cycle Days measures how many days elapse between paying suppliers for inventory and collecting payment from customers. It is the primary measure of working capital efficiency in the supply chain. Lower is better — negative C2C means you collect before you pay.',
    formula: 'C2C = DIO + DSO − DPO\n  DIO (Days Inventory Outstanding) = (Avg Inventory ÷ COGS) × 365\n  DSO (Days Sales Outstanding) = (Avg Accounts Receivable ÷ Revenue) × 365\n  DPO (Days Payable Outstanding) = (Avg Accounts Payable ÷ Cost of Purchases) × 365',
    notes: 'Use the same period length for all inputs (monthly, quarterly, or annual). Avg = (opening balance + closing balance) ÷ 2.',
    inputs: [
      { id: 'avg_inventory', label: 'Average inventory value (opening + closing ÷ 2) for the period', unit: 'SAR', dataSource: 'Balance sheet / ERP inventory report — average of start and end values', example: 4_500_000 },
      { id: 'cogs', label: 'Cost of Goods Sold (COGS) for the period', unit: 'SAR', dataSource: 'P&L — cost of sales line', example: 22_000_000 },
      { id: 'avg_ar', label: 'Average Accounts Receivable (opening + closing ÷ 2)', unit: 'SAR', dataSource: 'Balance sheet — trade receivables average', example: 3_200_000 },
      { id: 'revenue', label: 'Total Revenue for the period', unit: 'SAR', dataSource: 'P&L top line', example: 37_500_000 },
      { id: 'avg_ap', label: 'Average Accounts Payable to suppliers (opening + closing ÷ 2)', unit: 'SAR', dataSource: 'Balance sheet — trade payables average', example: 2_100_000 },
      { id: 'cost_of_purchases', label: 'Total cost of purchases / goods bought in the period', unit: 'SAR', dataSource: 'Procurement spend report / ERP PO total for the period', example: 18_000_000 },
    ],
    calculate: ({ avg_inventory, cogs, avg_ar, revenue, avg_ap, cost_of_purchases }) => {
      const dio = cogs > 0 ? (avg_inventory / cogs) * 365 : NaN;
      const dso = revenue > 0 ? (avg_ar / revenue) * 365 : NaN;
      const dpo = cost_of_purchases > 0 ? (avg_ap / cost_of_purchases) * 365 : NaN;
      const c2c = dio + dso - dpo;
      return Math.round(c2c * 10) / 10;
    },
  },
  {
    kpiId: 'fa',
    methodology: 'Forecast Accuracy measures how close demand forecasts were to actual demand, expressed as 1 − MAPE (Mean Absolute Percentage Error). Higher is better — 100% = perfect forecast. Measured at SKU or category level over the period.',
    formula: 'FA% = (1 − MAPE) × 100\n  MAPE = Σ|Actual − Forecast| ÷ Σ Actual',
    notes: 'Aggregate absolute errors across all SKUs and periods. Exclude zero-actual periods from MAPE (division by zero). Use the same time bucket (weekly or monthly) for all SKUs.',
    inputs: [
      { id: 'sum_actuals', label: 'Sum of actual demand across all SKUs and periods in scope', unit: 'units', dataSource: 'ERP / inventory system — actual sales or consumption by SKU by period', example: 48_000 },
      { id: 'sum_abs_errors', label: 'Sum of |Actual − Forecast| across all SKUs and periods (absolute errors, always positive)', unit: 'units', dataSource: 'Demand planning system or spreadsheet: for each SKU-period, abs(actual − forecast), then sum all', example: 8_160 },
    ],
    calculate: ({ sum_actuals, sum_abs_errors }) => {
      if (!sum_actuals) return NaN;
      const mape = sum_abs_errors / sum_actuals;
      return Math.round((1 - mape) * 1000) / 10;
    },
  },
  {
    kpiId: 'turns',
    methodology: 'Inventory Turns per Year measures how many times inventory is fully sold and replenished in a 12-month period. Higher turns mean less capital tied up in stock and lower carrying costs. World-class varies by industry: FMCG >20, manufacturing 8–15, spare parts 4–6.',
    formula: 'Inventory Turns = Annual COGS ÷ Average Inventory Value',
    notes: 'Use COGS (cost price), not revenue (selling price). If annualising a shorter period: annualised COGS = period COGS × (12 ÷ months in period).',
    inputs: [
      { id: 'annual_cogs', label: 'Annual Cost of Goods Sold (or annualised COGS)', unit: 'SAR', dataSource: 'P&L — cost of sales for 12 months (or scale shorter period to annual)', example: 22_000_000 },
      { id: 'avg_inventory_val', label: 'Average inventory value (monthly average over the year, or opening+closing ÷ 2)', unit: 'SAR', dataSource: 'ERP / WMS — monthly inventory valuation report, averaged across 12 months', example: 2_200_000 },
    ],
    calculate: ({ annual_cogs, avg_inventory_val }) =>
      avg_inventory_val > 0 ? Math.round((annual_cogs / avg_inventory_val) * 10) / 10 : NaN,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROCUREMENT EXCELLENCE
// ═══════════════════════════════════════════════════════════════════════════
const PROCUREMENT_EXCELLENCE: KpiDataSpec[] = [
  {
    kpiId: 'savings',
    methodology: 'Procurement Savings % measures hard cost savings delivered through category management, negotiation, and strategic sourcing — expressed as % of managed spend. Includes: price reductions, specification optimisation, demand management, and consolidation. Excludes inflation avoidance and soft savings.',
    formula: 'Savings % = (Hard Savings Delivered ÷ Managed Spend) × 100',
    notes: 'Hard savings = verified, budget-released reduction in spend vs prior-year price or baseline. Get finance sign-off on each saving to ensure credibility.',
    inputs: [
      { id: 'hard_savings', label: 'Verified hard savings delivered in the period (finance-approved)', unit: 'SAR', dataSource: 'Savings tracker / category manager log — finance-validated, budget-released savings only', example: 1_800_000 },
      { id: 'managed_spend', label: 'Total addressable managed spend in scope for the period', unit: 'SAR', dataSource: 'AP spend cube / procurement analytics — PO spend on categories managed by procurement team', example: 22_000_000 },
    ],
    calculate: ({ hard_savings, managed_spend }) => pct(safe(hard_savings), safe(managed_spend)),
  },
  {
    kpiId: 'pocycle',
    methodology: 'PO Cycle Time measures end-to-end elapsed time (calendar days) from approved purchase requisition to issued purchase order. Shorter cycle times reduce supply interruptions and improve supplier relationships.',
    formula: 'PO Cycle Time = Total Elapsed Days (PR approval → PO issue) ÷ Number of POs',
    notes: 'Measure from PR approval timestamp to PO creation timestamp in ERP. Exclude PR creation time (before approval). Segment by PO type (standard, emergency, contract) for richer insight.',
    inputs: [
      { id: 'total_po_days', label: 'Sum of elapsed days (PR approval to PO issued) across all POs in the period', unit: 'days', dataSource: 'ERP workflow timestamps — sum of (PO_created_date − PR_approved_date) for all POs', example: 3_850 },
      { id: 'total_pos', label: 'Total number of POs issued in the period', unit: 'POs', dataSource: 'ERP — count of POs created in the period', example: 440 },
    ],
    calculate: ({ total_po_days, total_pos }) => avg(safe(total_po_days), safe(total_pos)),
  },
  {
    kpiId: 'pocomp',
    methodology: 'PO Compliance Rate measures the % of purchase orders raised against an active, approved contract or approved supplier vs total POs. Non-compliant POs bypass controls and create legal and financial risk.',
    formula: 'PO Compliance % = (Compliant POs ÷ Total POs) × 100',
    notes: 'Compliant = PO references an active contract OR supplier is on the Approved Supplier List (ASL) with a valid price agreement. Exclude petty cash and emergency POs under SAR 5,000 if policy allows.',
    inputs: [
      { id: 'total_pos_comp', label: 'Total POs issued in the period', unit: 'POs', dataSource: 'ERP — all purchase orders created', example: 440 },
      { id: 'compliant_pos', label: 'POs raised against an active contract or approved supplier agreement', unit: 'POs', dataSource: 'ERP — POs with valid contract reference number OR supplier flagged as ASL-approved', example: 405 },
    ],
    calculate: ({ total_pos_comp, compliant_pos }) => pct(safe(compliant_pos), safe(total_pos_comp)),
  },
  {
    kpiId: 'sotif',
    methodology: 'Supplier OTIF measures your suppliers\' delivery performance: what % of inbound purchase orders are received on time AND in full. This is your mirror of your customers\' OTIF — a direct measure of supply risk.',
    formula: 'Supplier OTIF% = (PO Lines Received On-Time AND In-Full ÷ Total PO Lines Due) × 100',
    notes: 'On-Time: actual GRN date ≤ confirmed delivery date on PO. In-Full: received qty = ordered qty (100%). Measure at PO line level, not PO header. Track by supplier for supplier scorecards.',
    inputs: [
      { id: 'total_po_lines', label: 'Total PO lines due for delivery in the period', unit: 'PO lines', dataSource: 'ERP purchasing module — all PO lines with expected delivery date in the period', example: 1_200 },
      { id: 'otif_po_lines', label: 'PO lines received On-Time AND In-Full (GRN date ≤ PO delivery date AND received qty = ordered qty)', unit: 'PO lines', dataSource: 'ERP GRN records matched against PO — filter: GRN_date ≤ PO_delivery_date AND GRN_qty = PO_qty', example: 1_128 },
    ],
    calculate: ({ total_po_lines, otif_po_lines }) => pct(safe(otif_po_lines), safe(total_po_lines)),
  },
  {
    kpiId: 'ccov',
    methodology: 'Contract Coverage % measures the proportion of total procurement spend that is covered by active, signed contracts. High coverage reduces maverick spend, ensures price certainty, and strengthens legal protection.',
    formula: 'Contract Coverage % = (Spend Under Active Contract ÷ Total Addressable Spend) × 100',
    notes: 'Active contract = signed, within validity dates, and has remaining value. Exclude one-time emergency purchases from denominator if they are structurally uncontractable.',
    inputs: [
      { id: 'contracted_spend', label: 'Total spend placed against active contracts in the period', unit: 'SAR', dataSource: 'ERP / contract management system — PO spend linked to a valid contract number', example: 17_600_000 },
      { id: 'total_addressable_spend', label: 'Total addressable procurement spend in the period', unit: 'SAR', dataSource: 'AP spend cube — all supplier payments / PO spend (exclude one-time emergency / petty cash per policy)', example: 22_000_000 },
    ],
    calculate: ({ contracted_spend, total_addressable_spend }) => pct(safe(contracted_spend), safe(total_addressable_spend)),
  },
  {
    kpiId: 'ttc',
    methodology: 'Time-to-Contract measures the average elapsed days from issuing an RFQ / tender to a fully executed, signed contract. Long cycle times delay savings, extend supply risk windows, and reflect process inefficiency.',
    formula: 'Time-to-Contract = Σ Days (RFQ issue → Contract signed) ÷ Number of Contracts',
    notes: 'Include bid period, evaluation, negotiation, and legal review. Segment by contract value band (high-value contracts are naturally longer). Track by category and contract manager.',
    inputs: [
      { id: 'total_contract_days', label: 'Sum of elapsed days from RFQ issue to contract signature across all contracts closed in the period', unit: 'days', dataSource: 'Contract management system or sourcing tool — timestamp: RFQ_issued to contract_signed', example: 1_680 },
      { id: 'total_contracts', label: 'Number of contracts fully executed in the period', unit: 'contracts', dataSource: 'Contract register — count of contracts with execution date in the period', example: 60 },
    ],
    calculate: ({ total_contract_days, total_contracts }) => avg(safe(total_contract_days), safe(total_contracts)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEAN SIX SIGMA
// ═══════════════════════════════════════════════════════════════════════════
const LEAN_SIX_SIGMA: KpiDataSpec[] = [
  {
    kpiId: 'pce',
    methodology: 'Process Cycle Efficiency (PCE) measures value-added time as a % of total end-to-end lead time. In most supply chain processes PCE is 5–15%; world-class targets >25%. Everything outside value-added time is waste to be eliminated.',
    formula: 'PCE% = (Value-Added Time ÷ Total Lead Time) × 100',
    notes: 'Value-added time = activities that physically transform the product or directly serve the customer\'s need. Map the process using a Value Stream Map (VSM) to identify each activity type. Use the SAME units (minutes or hours) for both inputs.',
    inputs: [
      { id: 'value_added_time', label: 'Total value-added time per unit / transaction (from VSM)', unit: 'minutes', dataSource: 'Value Stream Map — sum of processing times for value-adding steps only (not wait, transport, inspection)', example: 42 },
      { id: 'total_lead_time', label: 'Total end-to-end lead time per unit / transaction (door-to-door)', unit: 'minutes', dataSource: 'Value Stream Map — elapsed time from process trigger (e.g. order received) to completion (e.g. order shipped)', example: 380 },
    ],
    calculate: ({ value_added_time, total_lead_time }) => pct(safe(value_added_time), safe(total_lead_time)),
  },
  {
    kpiId: 'sigma',
    methodology: 'Sigma Level converts Defects Per Million Opportunities (DPMO) into a sigma scale that is independent of process complexity. A 3σ process produces ~66,807 DPMO; 6σ = 3.4 DPMO (virtually defect-free). Most manufacturing targets 4σ–5σ.',
    formula: 'DPMO = (Defects ÷ (Units × Opportunities per Unit)) × 1,000,000\nSigma ≈ 0.8406 + √(29.37 − 2.221 × ln(DPMO))',
    notes: 'Opportunity = one chance for a defect to occur (e.g. each field on a form, each weld on a part). Define defect and opportunity consistently before measuring. Include a 1.5σ long-term shift in the formula above (standard practice).',
    inputs: [
      { id: 'defects', label: 'Total defects observed in the period', unit: 'defects', dataSource: 'Quality management system / inspection records — count of non-conformances', example: 230 },
      { id: 'units_produced', label: 'Total units / transactions produced or processed', unit: 'units', dataSource: 'Production / operations report for the period', example: 5_000 },
      { id: 'opps_per_unit', label: 'Number of defect opportunities per unit / transaction', unit: 'opportunities', dataSource: 'Process FMEA or VSM — count distinct failure modes possible per unit', example: 10 },
    ],
    calculate: ({ defects, units_produced, opps_per_unit }) => {
      const totalOpps = safe(units_produced) * safe(opps_per_unit);
      if (!totalOpps) return NaN;
      const dpmo = (safe(defects) / totalOpps) * 1_000_000;
      return dpmoToSigma(dpmo);
    },
  },
  {
    kpiId: 'ftr',
    methodology: 'First-Time-Right (FTR) Rate measures the % of process outputs completed correctly on the first attempt, without rework, correction, or re-inspection. Rework is pure waste: it consumes capacity, extends lead time, and hides root causes.',
    formula: 'FTR% = (Units / Transactions Correct First Time ÷ Total Units Processed) × 100',
    notes: 'A unit fails FTR if it requires any rework, correction, re-inspection, or customer return — even if the final product is acceptable. Count at the FIRST inspection / quality gate only.',
    inputs: [
      { id: 'total_units_ftr', label: 'Total units / transactions processed in the period', unit: 'units', dataSource: 'Production / operations system — all work orders or transactions started', example: 2_000 },
      { id: 'first_time_right', label: 'Units / transactions that passed all checks on the first attempt (no rework or correction)', unit: 'units', dataSource: 'Quality system — units with zero rework or correction events in their work history', example: 1_840 },
    ],
    calculate: ({ total_units_ftr, first_time_right }) => pct(safe(first_time_right), safe(total_units_ftr)),
  },
  {
    kpiId: 'ltr',
    methodology: 'Lead Time Reduction % measures the improvement in end-to-end process lead time vs a pre-lean / pre-improvement baseline. It is the primary outcome measure for a lean transformation or kaizen event.',
    formula: 'Lead Time Reduction% = ((Baseline Lead Time − Current Lead Time) ÷ Baseline Lead Time) × 100',
    notes: 'Baseline = lead time measured BEFORE the improvement project, from the initial Value Stream Map. Current = lead time at the end of the measurement period using the same process boundaries.',
    inputs: [
      { id: 'baseline_lt', label: 'Baseline end-to-end lead time BEFORE improvement (from initial VSM)', unit: 'hours', dataSource: 'Original Value Stream Map or pre-project time study', example: 72 },
      { id: 'current_lt', label: 'Current end-to-end lead time AFTER improvement (measured same way)', unit: 'hours', dataSource: 'Updated VSM or post-project time study using identical process boundaries', example: 28 },
    ],
    calculate: ({ baseline_lt, current_lt }) => {
      if (!baseline_lt) return NaN;
      return Math.round(((baseline_lt - current_lt) / baseline_lt) * 1000) / 10;
    },
  },
  {
    kpiId: 'copq',
    methodology: 'Cost of Poor Quality (COPQ) % captures all costs incurred because processes are not perfect: internal failures (scrap, rework), external failures (returns, warranty, recalls), appraisal (inspection, testing), and prevention (training, process control). Target <2% of revenue.',
    formula: 'COPQ% = (Total COPQ ÷ Total Revenue) × 100\nTotal COPQ = Internal Failures + External Failures + Appraisal Costs + Prevention Costs',
    notes: 'Most companies under-report COPQ by 50–90% because they only count visible defect costs. Include hidden costs: expediting due to quality holds, customer support time, management time on complaints.',
    inputs: [
      { id: 'internal_failures', label: 'Internal failure costs (scrap, rework, re-inspection, production delays from quality issues)', unit: 'SAR', dataSource: 'Quality / production records — scrap write-offs + rework labour + lost production time', example: 180_000 },
      { id: 'external_failures', label: 'External failure costs (customer returns, warranty claims, recalls, customer compensation)', unit: 'SAR', dataSource: 'Finance / customer service — warranty claims paid + returns processing + penalties', example: 120_000 },
      { id: 'appraisal_costs', label: 'Appraisal costs (inspection, testing, quality audits, calibration)', unit: 'SAR', dataSource: 'Finance / quality department — lab costs, inspector headcount, testing equipment', example: 60_000 },
      { id: 'copq_revenue', label: 'Total company revenue for the same period', unit: 'SAR', dataSource: 'P&L top-line revenue', example: 37_500_000 },
    ],
    calculate: ({ internal_failures, external_failures, appraisal_costs, copq_revenue }) => {
      const total = safe(internal_failures) + safe(external_failures) + safe(appraisal_costs);
      return pct(total, safe(copq_revenue));
    },
  },
  {
    kpiId: 'kaizen',
    methodology: 'Kaizen Events per Quarter counts the number of structured, facilitated rapid-improvement events (typically 3–5 days) conducted in the quarter. It is a leading indicator of continuous improvement culture and activity level.',
    formula: 'Kaizen Events = Direct count of completed structured improvement events in the quarter',
    notes: 'Count only completed events with: a defined scope, a cross-functional team, a structured A3 or DMAIC report, and measurable outcomes documented. Exclude informal suggestions or individual projects.',
    inputs: [
      { id: 'kaizen_events', label: 'Number of completed structured Kaizen / rapid-improvement events in the quarter', unit: 'events', dataSource: 'CI programme register — events with completion date in the quarter and A3/DMAIC report filed', example: 7 },
    ],
    calculate: ({ kaizen_events }) => safe(kaizen_events),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DIGITAL TRANSFORMATION
// ═══════════════════════════════════════════════════════════════════════════
const DIGITAL_TRANSFORMATION: KpiDataSpec[] = [
  {
    kpiId: 'erpu',
    methodology: 'ERP Module Utilisation measures what % of licensed ERP modules are actively being used to manage business processes — as opposed to being purchased but bypassed with spreadsheets or legacy systems.',
    formula: 'ERP Utilisation% = (Modules Actively Used ÷ Total Licensed Modules) × 100',
    notes: 'Define "actively used" as: module has had >X transactions/users in the last 30 days (set a threshold appropriate to your business). Modules with zero activity for 90+ days = not utilised.',
    inputs: [
      { id: 'modules_licensed', label: 'Total ERP modules licensed / contracted', unit: 'modules', dataSource: 'ERP vendor contract / system admin licence report', example: 18 },
      { id: 'modules_active', label: 'ERP modules with active usage in the last 30 days (above minimum activity threshold)', unit: 'modules', dataSource: 'ERP system admin usage report — modules with transaction count > 0 in last 30 days', example: 14 },
    ],
    calculate: ({ modules_licensed, modules_active }) => pct(safe(modules_active), safe(modules_licensed)),
  },
  {
    kpiId: 'auto',
    methodology: 'Process Automation Rate measures the % of defined procurement / supply chain processes that are fully automated end-to-end — requiring no manual intervention from trigger to completion.',
    formula: 'Automation Rate% = (Fully Automated Processes ÷ Total Defined Processes) × 100',
    notes: 'Define your process inventory first (e.g. 30 procurement sub-processes). A process is "fully automated" if it triggers, executes, and completes without human touch. Partially automated processes count as manual.',
    inputs: [
      { id: 'total_processes', label: 'Total number of defined supply chain / procurement processes in scope', unit: 'processes', dataSource: 'Process register / BPM system — all documented process variants', example: 35 },
      { id: 'automated_processes', label: 'Processes that are fully automated end-to-end (zero manual steps from trigger to close)', unit: 'processes', dataSource: 'IT / BPM system — processes with 100% STP (straight-through processing) rate', example: 22 },
    ],
    calculate: ({ total_processes, automated_processes }) => pct(safe(automated_processes), safe(total_processes)),
  },
  {
    kpiId: 'stp',
    methodology: 'Straight-Through PO Rate measures the % of purchase orders that are created, approved, sent to supplier, and goods-receipt matched without any manual intervention. High STP = high process maturity.',
    formula: 'STP Rate% = (Straight-Through POs ÷ Total POs Processed) × 100',
    notes: 'A PO is straight-through if: auto-created from MRP/contract, auto-approved within DoA rules, auto-sent to supplier via EDI/portal, and auto-3-way-matched on GRN. Any exception handling = NOT straight-through.',
    inputs: [
      { id: 'total_pos_stp', label: 'Total POs processed in the period', unit: 'POs', dataSource: 'ERP — all purchase orders created', example: 440 },
      { id: 'stp_pos', label: 'POs completed without any manual touch (auto-created, auto-approved, auto-matched)', unit: 'POs', dataSource: 'ERP workflow log — POs with zero manual intervention flags from creation to 3-way match', example: 308 },
    ],
    calculate: ({ total_pos_stp, stp_pos }) => pct(safe(stp_pos), safe(total_pos_stp)),
  },
  {
    kpiId: 'da',
    methodology: 'Data Accuracy Rate measures the % of master data records (supplier, item, pricing, contract) that are complete, correct, and current — without duplicates, missing fields, or stale information.',
    formula: 'Data Accuracy% = (Clean Records ÷ Total Records Audited) × 100',
    notes: 'Conduct a random sample audit of master data records (minimum 200 records per category). A record "fails" if any mandatory field is blank, incorrect, or >90 days stale. Report by data domain (supplier, item, price).',
    inputs: [
      { id: 'records_audited', label: 'Total master data records audited in the sample', unit: 'records', dataSource: 'Random sample from ERP master data — supplier master + item master + contract pricing', example: 500 },
      { id: 'clean_records', label: 'Records that are 100% complete, correct, and current (no mandatory field blank, incorrect, or stale)', unit: 'records', dataSource: 'Data audit worksheet — records passing all data quality checks', example: 468 },
    ],
    calculate: ({ records_audited, clean_records }) => pct(safe(clean_records), safe(records_audited)),
  },
  {
    kpiId: 'dar',
    methodology: 'Digital Adoption Rate measures the % of supply chain / procurement staff who are actively and regularly using the designated digital tools as part of their normal workflow — not just trained, but actually using them.',
    formula: 'Digital Adoption% = (Active Digital Tool Users ÷ Total Staff in Scope) × 100',
    notes: '"Active" = logged in and performed meaningful transactions at least once per week for the past 4 weeks. Include all tools in scope: ERP, supplier portal, e-sourcing, contract management, analytics platforms.',
    inputs: [
      { id: 'total_staff_digital', label: 'Total supply chain / procurement staff who should be using digital tools', unit: 'people', dataSource: 'HR system — headcount in scope roles', example: 85 },
      { id: 'active_digital_users', label: 'Staff with active usage in ALL designated tools in the last 4 weeks (logged in + meaningful transactions weekly)', unit: 'people', dataSource: 'IT / tool admin reports — users with login + transaction count per tool, filtered to last 4 weeks', example: 72 },
    ],
    calculate: ({ total_staff_digital, active_digital_users }) => pct(safe(active_digital_users), safe(total_staff_digital)),
  },
  {
    kpiId: 'mpr',
    methodology: 'Manual Process Reduction % measures the reduction in manual process steps (forms, approvals, data entries, phone calls) vs the pre-digitalisation baseline. It quantifies how much bureaucratic waste has been eliminated.',
    formula: 'Manual Process Reduction% = ((Baseline Manual Steps − Current Manual Steps) ÷ Baseline Manual Steps) × 100',
    notes: 'Count from your pre-digital process map (As-Is VSM). Current state = count manual steps in the same processes today. Include: manual approvals, spreadsheet entries, email-based handoffs, phone confirmations.',
    inputs: [
      { id: 'baseline_manual_steps', label: 'Number of manual process steps BEFORE digitalisation (from As-Is process map)', unit: 'steps', dataSource: 'Pre-project process documentation / As-Is VSM step count', example: 145 },
      { id: 'current_manual_steps', label: 'Number of manual process steps currently (from To-Be / current state map)', unit: 'steps', dataSource: 'Current process audit — count remaining manual steps in same processes', example: 52 },
    ],
    calculate: ({ baseline_manual_steps, current_manual_steps }) => {
      if (!baseline_manual_steps) return NaN;
      return Math.round(((baseline_manual_steps - current_manual_steps) / baseline_manual_steps) * 1000) / 10;
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SUSTAINABILITY & ESG
// ═══════════════════════════════════════════════════════════════════════════
const SUSTAINABILITY_ESG: KpiDataSpec[] = [
  {
    kpiId: 'esga',
    methodology: 'Supplier ESG Audit Coverage % measures the proportion of strategic / critical suppliers who have completed a formal ESG (Environmental, Social, Governance) audit within the required cycle (typically annual or biennial).',
    formula: 'ESG Audit Coverage% = (Strategic Suppliers with Completed Audit ÷ Total Strategic Suppliers) × 100',
    notes: 'Define your Supplier Tier segmentation first (strategic = top 20% by spend or criticality). A completed audit = third-party or self-assessment questionnaire reviewed and scored by your ESG team within the cycle.',
    inputs: [
      { id: 'total_strategic_suppliers', label: 'Total number of strategic / critical suppliers in scope for ESG audit', unit: 'suppliers', dataSource: 'Supplier database — Tier 1 / strategic segment as defined in your supplier segmentation model', example: 120 },
      { id: 'audited_suppliers', label: 'Strategic suppliers with a completed ESG audit within the required cycle', unit: 'suppliers', dataSource: 'Supplier risk / ESG platform — suppliers with audit completion date within the last 12/24 months', example: 102 },
    ],
    calculate: ({ total_strategic_suppliers, audited_suppliers }) => pct(safe(audited_suppliers), safe(total_strategic_suppliers)),
  },
  {
    kpiId: 's3',
    methodology: 'Scope 3 Coverage % measures the proportion of your supply chain\'s Scope 3 GHG emissions that have been quantified and reported. Scope 3 = all indirect emissions in the value chain (purchased goods, logistics, waste, use of product).',
    formula: 'Scope 3 Coverage% = (Scope 3 Emission Sources Measured ÷ Total Identified Scope 3 Sources) × 100',
    notes: 'Start with a Scope 3 materiality assessment to identify your top emission categories. Use GHG Protocol Corporate Value Chain Standard. Even spend-based estimates count as "measured" for coverage purposes.',
    inputs: [
      { id: 'total_s3_sources', label: 'Total Scope 3 emission categories identified as material for your business (per GHG Protocol Categories 1–15)', unit: 'categories', dataSource: 'Scope 3 materiality assessment — categories with >1% of estimated total emissions', example: 12 },
      { id: 'measured_s3_sources', label: 'Scope 3 categories with quantified emissions data (spend-based, activity-based, or supplier-specific)', unit: 'categories', dataSource: 'Sustainability/ESG report — categories where you have a tCO2e figure, even if estimate', example: 9 },
    ],
    calculate: ({ total_s3_sources, measured_s3_sources }) => pct(safe(measured_s3_sources), safe(total_s3_sources)),
  },
  {
    kpiId: 'lc',
    methodology: 'Local Content / Iktva % measures the proportion of procurement spend directed to locally-produced goods, services, and Saudi/GCC-based suppliers. Iktva is Saudi Aramco\'s In-Kingdom Total Value Add programme — a mandatory framework for oil & gas suppliers in Saudi Arabia.',
    formula: 'Local Content% = (Local/In-Kingdom Spend ÷ Total Addressable Spend) × 100',
    notes: 'For Iktva: use the official Iktva scorecard methodology. For general local content: define "local" as: manufactured in-country, or supplier HQ in-country with >50% local employment. Get supplier declarations where needed.',
    inputs: [
      { id: 'local_spend', label: 'Spend with locally-produced goods / in-kingdom services in the period', unit: 'SAR', dataSource: 'Procurement analytics — PO spend filtered to suppliers classified as local/in-kingdom in supplier master', example: 8_800_000 },
      { id: 'total_spend_lc', label: 'Total addressable procurement spend in the period', unit: 'SAR', dataSource: 'AP spend cube — all supplier spend', example: 22_000_000 },
    ],
    calculate: ({ local_spend, total_spend_lc }) => pct(safe(local_spend), safe(total_spend_lc)),
  },
  {
    kpiId: 'ss',
    methodology: 'Sustainable Spend % measures the proportion of procurement spend with suppliers who meet a defined minimum ESG standard — certified, audited, or self-declared compliant with your ESG supplier code of conduct.',
    formula: 'Sustainable Spend% = (Spend with ESG-Compliant Suppliers ÷ Total Addressable Spend) × 100',
    notes: 'ESG-compliant = supplier has: (a) completed your ESG audit with a passing score, OR (b) holds a recognised certification (ISO 14001, SA8000, EcoVadis Gold+), OR (c) signed and been verified against your Supplier Code of Conduct.',
    inputs: [
      { id: 'esg_compliant_spend', label: 'Spend with suppliers classified as ESG-compliant (per your defined criteria)', unit: 'SAR', dataSource: 'Procurement analytics — PO spend filtered to suppliers with ESG-compliant status in supplier database', example: 7_700_000 },
      { id: 'total_spend_ss', label: 'Total addressable procurement spend', unit: 'SAR', dataSource: 'AP spend cube', example: 22_000_000 },
    ],
    calculate: ({ esg_compliant_spend, total_spend_ss }) => pct(safe(esg_compliant_spend), safe(total_spend_ss)),
  },
  {
    kpiId: 'cr',
    methodology: 'Carbon Reduction YoY % measures the year-on-year reduction in total supply chain GHG emissions (Scope 1 + 2 + material Scope 3). It is the outcome measure of your decarbonisation programme.',
    formula: 'Carbon Reduction YoY% = ((Prior Year tCO2e − Current Year tCO2e) ÷ Prior Year tCO2e) × 100',
    notes: 'Normalise for revenue growth if applicable (use carbon intensity = tCO2e/SAR revenue). Ensure you are comparing like-for-like boundaries. Report market-based and location-based separately for Scope 2.',
    inputs: [
      { id: 'prior_year_co2', label: 'Total supply chain GHG emissions in the PRIOR year (tCO2e) — same scope boundary', unit: 'tCO2e', dataSource: 'Prior ESG/sustainability report — verified Scope 1+2+material Scope 3 total', example: 12_400 },
      { id: 'current_year_co2', label: 'Total supply chain GHG emissions in the CURRENT year (tCO2e) — same scope boundary', unit: 'tCO2e', dataSource: 'Current ESG/sustainability data — same scope and methodology as prior year', example: 10_540 },
    ],
    calculate: ({ prior_year_co2, current_year_co2 }) => {
      if (!prior_year_co2) return NaN;
      return Math.round(((prior_year_co2 - current_year_co2) / prior_year_co2) * 1000) / 10;
    },
  },
  {
    kpiId: 'esgs',
    methodology: 'ESG-Compliant Suppliers % measures the proportion of all active suppliers (not just strategic) who meet your minimum ESG standards — building a sustainable supply base at scale.',
    formula: 'ESG-Compliant Suppliers% = (Suppliers Meeting Minimum ESG Standard ÷ Total Active Suppliers) × 100',
    notes: 'Minimum standard should be defined in your Supplier Code of Conduct. Start with top-spend suppliers. Use a phased approach: strategic tier first (target 100%), then preferred tier, then approved tier.',
    inputs: [
      { id: 'total_active_suppliers', label: 'Total number of active suppliers in your supply base (with a PO in the last 12 months)', unit: 'suppliers', dataSource: 'Supplier master / ERP — suppliers with at least 1 PO in the last 12 months', example: 380 },
      { id: 'esg_compliant_suppliers', label: 'Suppliers meeting your minimum ESG standard (audited/certified/verified)', unit: 'suppliers', dataSource: 'Supplier ESG database — suppliers with passing ESG assessment status', example: 285 },
    ],
    calculate: ({ total_active_suppliers, esg_compliant_suppliers }) => pct(safe(esg_compliant_suppliers), safe(total_active_suppliers)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════
const GOVERNANCE_COMPLIANCE: KpiDataSpec[] = [
  {
    kpiId: 'pcr',
    methodology: 'Policy Compliance Rate measures the % of procurement transactions that comply with your procurement policy — correct approvals, right sourcing route, proper documentation, within DoA.',
    formula: 'Policy Compliance% = (Compliant Transactions ÷ Total Transactions Reviewed) × 100',
    notes: 'Based on internal audit sample or automated ERP controls. Define non-compliance: missing approval, incorrect sourcing (no tender for high-value), wrong DoA level, or incomplete documentation.',
    inputs: [
      { id: 'total_transactions_pcr', label: 'Total procurement transactions reviewed / audited in the period', unit: 'transactions', dataSource: 'Internal audit sample or ERP automated control review — sample of POs, contracts, payments', example: 300 },
      { id: 'compliant_transactions', label: 'Transactions fully compliant with procurement policy', unit: 'transactions', dataSource: 'Audit findings — transactions with zero policy violations across all checks', example: 267 },
    ],
    calculate: ({ total_transactions_pcr, compliant_transactions }) => pct(safe(compliant_transactions), safe(total_transactions_pcr)),
  },
  {
    kpiId: 'aud',
    methodology: 'Audit Score measures the organisation\'s performance in the most recent formal internal or external procurement / supply chain audit. Scores reflect control effectiveness, process adherence, and governance maturity.',
    formula: 'Audit Score = Score awarded by auditor on the /100 scale used in the most recent formal audit',
    notes: 'Use the score from your most recent formal audit (internal audit, external certifier, regulator, or client). If multiple audits, use the most critical (lowest score or most recent strategic scope).',
    inputs: [
      { id: 'audit_score', label: 'Score from most recent formal internal or external audit (/100)', unit: '/100', dataSource: 'Audit report — final composite score from internal audit team or external auditor', example: 82 },
    ],
    calculate: ({ audit_score }) => safe(audit_score),
  },
  {
    kpiId: 'cco',
    methodology: 'Contract Coverage % for governance measures the proportion of total procurement spend placed under active, managed contracts — reducing exposure to uncontrolled pricing, quality, and delivery risk.',
    formula: 'Contract Coverage% = (Spend Under Active Contract ÷ Total Spend) × 100',
    notes: 'Same methodology as procurement excellence contract coverage. In governance context, also check: contracts are within validity dates, value not exceeded, and renewals are being tracked proactively.',
    inputs: [
      { id: 'contracted_spend_gov', label: 'Spend placed against active, valid contracts in the period', unit: 'SAR', dataSource: 'ERP / contract management system — POs with valid contract number', example: 18_700_000 },
      { id: 'total_spend_gov', label: 'Total procurement spend in the period', unit: 'SAR', dataSource: 'AP total payments / ERP PO spend', example: 22_000_000 },
    ],
    calculate: ({ contracted_spend_gov, total_spend_gov }) => pct(safe(contracted_spend_gov), safe(total_spend_gov)),
  },
  {
    kpiId: 'mav',
    methodology: 'Maverick Spend % captures procurement spend that bypasses approved channels: no PO, no contract, wrong supplier, or no competitive sourcing where required. It is a direct measure of governance leakage and financial risk.',
    formula: 'Maverick Spend% = (Spend Outside Approved Channels ÷ Total Spend) × 100',
    notes: 'Identify from: invoices with no PO, POs raised after goods received (post-commitment POs), spend with non-ASL suppliers above threshold, and single-source awards without documented justification.',
    inputs: [
      { id: 'maverick_spend', label: 'Total spend outside approved procurement channels in the period', unit: 'SAR', dataSource: 'AP analysis: invoices with no PO + POs raised post-commitment + non-ASL supplier spend above threshold', example: 880_000 },
      { id: 'total_spend_mav', label: 'Total procurement spend in the period', unit: 'SAR', dataSource: 'AP total payments / ERP PO spend', example: 22_000_000 },
    ],
    calculate: ({ maverick_spend, total_spend_mav }) => pct(safe(maverick_spend), safe(total_spend_mav)),
  },
  {
    kpiId: 'doa',
    methodology: 'Delegation of Authority (DoA) Violations per Quarter counts transactions where approvals were granted by someone below the required authority level — a serious control failure that creates legal and financial risk.',
    formula: 'DoA Violations = Direct count of violations identified in the quarter',
    notes: 'Violations include: approved by wrong role, value exceeded DoA threshold, emergency use of lower authority without proper exception, and approval by conflicted party (supplier relationship).',
    inputs: [
      { id: 'doa_violations', label: 'Number of DoA violations identified in the quarter (through audit, system controls, or self-reporting)', unit: 'violations', dataSource: 'Internal audit report + ERP exception report + compliance incident log for the quarter', example: 2 },
    ],
    calculate: ({ doa_violations }) => safe(doa_violations),
  },
  {
    kpiId: 'asa',
    methodology: 'Approved Supplier Adherence measures the % of purchases made from the Approved Supplier List (ASL) — ensuring procurement only uses pre-qualified, risk-assessed suppliers who meet quality, financial, and compliance requirements.',
    formula: 'ASL Adherence% = (Spend with ASL Suppliers ÷ Total Spend) × 100',
    notes: 'ASL suppliers = formally approved through your supplier qualification process (financial check, quality audit, HSE review, sanctions screening). Track both by spend value and transaction count.',
    inputs: [
      { id: 'asl_spend', label: 'Spend with suppliers on the current Approved Supplier List', unit: 'SAR', dataSource: 'ERP — PO spend filtered to suppliers with "ASL Approved" status in supplier master', example: 20_900_000 },
      { id: 'total_spend_asa', label: 'Total procurement spend in the period', unit: 'SAR', dataSource: 'AP total / ERP PO spend', example: 22_000_000 },
    ],
    calculate: ({ asl_spend, total_spend_asa }) => pct(safe(asl_spend), safe(total_spend_asa)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT LIFECYCLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
const CONTRACT_LIFECYCLE: KpiDataSpec[] = [
  {
    kpiId: 'cact',
    methodology: 'Contract Authoring Time measures the average calendar days from scope finalisation to a complete, ready-to-negotiate first draft. Long authoring times create revenue delays, extend supply risk windows, and frustrate business stakeholders.',
    formula: 'Authoring Time = Σ Days (Scope Signed Off → First Draft Complete) ÷ Number of Contracts',
    notes: 'Measure from when legal/procurement receives a signed-off scope document to when the first draft is approved for negotiation. Exclude the period before scope sign-off (requirements gathering).',
    inputs: [
      { id: 'total_authoring_days', label: 'Sum of days from scope sign-off to first draft completion across all contracts in the period', unit: 'days', dataSource: 'Contract management system — timestamp: scope_approved to first_draft_sent', example: 350 },
      { id: 'total_contracts_auth', label: 'Number of contracts where first draft was completed in the period', unit: 'contracts', dataSource: 'Contract management system — count of contracts reaching first-draft stage in period', example: 48 },
    ],
    calculate: ({ total_authoring_days, total_contracts_auth }) => avg(safe(total_authoring_days), safe(total_contracts_auth)),
  },
  {
    kpiId: 'neg',
    methodology: 'Negotiation Cycle Time measures the average calendar days from sending the first draft to both parties reaching agreed commercial and legal terms. Long negotiation cycles indicate unclear positions, excessive redlines, or misaligned expectations.',
    formula: 'Negotiation Cycle = Σ Days (First Draft Sent → Terms Agreed) ÷ Number of Contracts',
    notes: 'Measure from first draft sent to counterparty to the date both parties confirm agreed terms (before final execution/signing). High variation by contract type is normal — segment by value band.',
    inputs: [
      { id: 'total_neg_days', label: 'Sum of days from first draft sent to terms agreed across all contracts negotiated in the period', unit: 'days', dataSource: 'Contract system — timestamp: first_draft_sent to terms_agreed email/status', example: 720 },
      { id: 'total_contracts_neg', label: 'Number of contracts where terms were agreed in the period', unit: 'contracts', dataSource: 'Contract management system — count of contracts reaching terms-agreed status', example: 48 },
    ],
    calculate: ({ total_neg_days, total_contracts_neg }) => avg(safe(total_neg_days), safe(total_contracts_neg)),
  },
  {
    kpiId: 'ccomp',
    methodology: 'Contract Compliance Rate measures the % of contracts that meet all applicable regulatory, legal, and corporate governance requirements — including mandatory clauses, approved templates, and sign-off by required parties.',
    formula: 'Contract Compliance% = (Compliant Contracts ÷ Total Contracts Reviewed) × 100',
    notes: 'Compliance checklist typically covers: correct template used, mandatory clauses present (GDPR, anti-bribery, sanctions, IP, liability caps), correct signatory, proper DoA approval, and filing in contract repository.',
    inputs: [
      { id: 'total_contracts_comp', label: 'Total contracts reviewed / audited for compliance in the period', unit: 'contracts', dataSource: 'Contract audit sample — random selection from contracts executed in period', example: 80 },
      { id: 'compliant_contracts', label: 'Contracts fully compliant with all regulatory and corporate governance requirements', unit: 'contracts', dataSource: 'Contract compliance audit — contracts passing all checklist items', example: 74 },
    ],
    calculate: ({ total_contracts_comp, compliant_contracts }) => pct(safe(compliant_contracts), safe(total_contracts_comp)),
  },
  {
    kpiId: 'ren',
    methodology: 'On-Time Renewal Rate measures the % of expiring contracts that are renewed (or a replacement signed) before the current contract expires — avoiding costly emergency sourcing, supply gaps, and loss of negotiated terms.',
    formula: 'On-Time Renewal% = (Contracts Renewed Before Expiry ÷ Total Contracts Due for Renewal) × 100',
    notes: 'Target is 100%. Any contract that expires before renewal = a governance failure. Track 90/60/30-day renewal alerts. Include contracts that are intentionally not renewed as "completed" (not a failure).',
    inputs: [
      { id: 'contracts_due_renewal', label: 'Total contracts that expired or were due for renewal in the period', unit: 'contracts', dataSource: 'Contract register — contracts with expiry date in the period', example: 42 },
      { id: 'contracts_renewed_otif', label: 'Contracts renewed or replaced before the expiry date', unit: 'contracts', dataSource: 'Contract management system — renewals/replacements with effective date ≤ prior contract expiry date', example: 38 },
    ],
    calculate: ({ contracts_due_renewal, contracts_renewed_otif }) => pct(safe(contracts_renewed_otif), safe(contracts_due_renewal)),
  },
  {
    kpiId: 'vl',
    methodology: 'Value Leakage % quantifies contract value that is lost through under-enforcement, non-compliance, or supplier underperformance — money that was contractually secured but not realised in practice.',
    formula: 'Value Leakage% = (Unrecovered Leakage Value ÷ Total Contract Value Under Management) × 100',
    notes: 'Leakage sources: uninvoiced rebates/credits, unapplied SLA penalties, volume discounts not claimed, price escalation accepted beyond contract terms, and scope creep absorbed without change order.',
    inputs: [
      { id: 'value_leakage', label: 'Total estimated value leakage from unrecovered credits, penalties, rebates, and overcharges in the period', unit: 'SAR', dataSource: 'Contract management / finance reconciliation — rebates unclaimed + penalties not enforced + overcharges identified', example: 440_000 },
      { id: 'total_contract_value', label: 'Total contract value under active management in the period', unit: 'SAR', dataSource: 'Contract register — sum of annual contract values for all active contracts', example: 22_000_000 },
    ],
    calculate: ({ value_leakage, total_contract_value }) => pct(safe(value_leakage), safe(total_contract_value)),
  },
  {
    kpiId: 'slab',
    methodology: 'SLA Breach Rate % measures the proportion of contractual service level obligations breached by suppliers in the period. Every breach represents a supplier underperformance that should trigger a penalty or corrective action.',
    formula: 'SLA Breach Rate% = (SLA Obligations Breached ÷ Total SLA Obligations Measured) × 100',
    notes: 'Count at obligation level (each SLA clause = one obligation). Include all contracted KPIs: delivery, quality, response time, uptime, etc. Track actual enforcement rate separately (breaches vs penalties enforced).',
    inputs: [
      { id: 'total_sla_obligations', label: 'Total SLA obligations measured across all active contracts in the period', unit: 'SLA obligations', dataSource: 'Contract management system — count of SLA metrics tracked across all active contracts in the period', example: 280 },
      { id: 'sla_breaches', label: 'SLA obligations where supplier performance was below the contractual threshold', unit: 'breaches', dataSource: 'Supplier performance reports — SLA metrics where actual < contractual threshold', example: 17 },
    ],
    calculate: ({ total_sla_obligations, sla_breaches }) => pct(safe(sla_breaches), safe(total_sla_obligations)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SUPPLIER RELATIONSHIP GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════
const SUPPLIER_RELATIONSHIP: KpiDataSpec[] = [
  {
    kpiId: 'sotif2',
    methodology: 'Supplier OTIF % for relationship governance — same calculation as procurement OTIF but viewed through the lens of strategic relationship performance and scorecard reporting.',
    formula: 'Supplier OTIF% = (Deliveries On-Time AND In-Full ÷ Total Deliveries) × 100',
    notes: 'Used in monthly supplier scorecards. Track by supplier, by category, and by criticality tier. Trend over time is more valuable than a single point — look for deterioration patterns.',
    inputs: [
      { id: 'total_del_srg', label: 'Total supplier deliveries in the period', unit: 'deliveries', dataSource: 'ERP / WMS GRN records for the period', example: 850 },
      { id: 'otif_del_srg', label: 'Deliveries received On-Time AND In-Full', unit: 'deliveries', dataSource: 'GRN date ≤ PO delivery date AND received qty = ordered qty', example: 799 },
    ],
    calculate: ({ total_del_srg, otif_del_srg }) => pct(safe(otif_del_srg), safe(total_del_srg)),
  },
  {
    kpiId: 'ppm',
    methodology: 'Defect Rate in PPM (Parts Per Million) measures supplier quality performance: how many defective units are received per million units delivered. PPM is the global standard for precision manufacturing and high-volume supply.',
    formula: 'PPM = (Defective Units Received ÷ Total Units Received) × 1,000,000',
    notes: 'Count defects at first incoming inspection (before any rework). Include all non-conformances: wrong specification, damage, missing components, incorrect labelling. Track by supplier and by part number.',
    inputs: [
      { id: 'defective_units', label: 'Total defective / non-conforming units identified at incoming inspection in the period', unit: 'units', dataSource: 'Quality / inspection records — units rejected or non-conforming at goods-in inspection', example: 230 },
      { id: 'total_units_received', label: 'Total units received from suppliers in the period', unit: 'units', dataSource: 'WMS / ERP GRN quantity total for the period', example: 460_000 },
    ],
    calculate: ({ defective_units, total_units_received }) => {
      if (!total_units_received) return NaN;
      return Math.round((defective_units / total_units_received) * 1_000_000);
    },
  },
  {
    kpiId: 'ss2',
    methodology: 'Single-Source Dependency % measures the proportion of critical spend or critical categories where you have only one qualified supplier — a direct indicator of supply chain resilience risk.',
    formula: 'Single-Source Dependency% = (Critical Spend with Single-Source Suppliers ÷ Total Critical Spend) × 100',
    notes: 'Define "critical": high spend AND/OR high supply risk AND/OR long lead time AND/OR limited substitutability. Single-source = only one qualified, approved supplier exists for that item/category.',
    inputs: [
      { id: 'total_critical_spend', label: 'Total spend in categories classified as critical / high-risk', unit: 'SAR', dataSource: 'Spend analysis filtered to categories with criticality rating = high in your supplier risk register', example: 8_800_000 },
      { id: 'single_source_spend', label: 'Critical spend where only ONE qualified supplier exists for the category', unit: 'SAR', dataSource: 'Sourcing category data — critical categories with supplier count = 1 in approved supplier list', example: 2_640_000 },
    ],
    calculate: ({ total_critical_spend, single_source_spend }) => pct(safe(single_source_spend), safe(total_critical_spend)),
  },
  {
    kpiId: 'jbp',
    methodology: 'Joint Business Plan (JBP) Coverage measures the % of strategic-tier suppliers who have an active, mutually agreed Joint Business Plan — defining shared growth targets, innovation pipelines, and performance commitments.',
    formula: 'JBP Coverage% = (Strategic Suppliers with Active JBP ÷ Total Strategic Suppliers) × 100',
    notes: 'A JBP must contain: 12-month shared objectives, measurable KPI commitments, innovation / NPD pipeline, and be signed by both parties. A letter of intent or SLA alone does not constitute a JBP.',
    inputs: [
      { id: 'total_strategic_sup_jbp', label: 'Total number of strategic-tier suppliers (your top segment by value + criticality)', unit: 'suppliers', dataSource: 'Supplier segmentation model — suppliers classified as strategic / preferred tier 1', example: 25 },
      { id: 'jbp_suppliers', label: 'Strategic suppliers with a signed, active Joint Business Plan covering the current year', unit: 'suppliers', dataSource: 'SRM platform or contract register — JBPs with start date ≤ today and end date ≥ today + 90 days', example: 22 },
    ],
    calculate: ({ total_strategic_sup_jbp, jbp_suppliers }) => pct(safe(jbp_suppliers), safe(total_strategic_sup_jbp)),
  },
  {
    kpiId: 'esga2',
    methodology: 'ESG Audit Coverage for strategic suppliers — same methodology as sustainability ESG audit coverage but applied specifically in the context of supplier relationship governance scorecards.',
    formula: 'ESG Audit Coverage% = (Audited Strategic Suppliers ÷ Total Strategic Suppliers) × 100',
    notes: 'Strategic tier should be 100% covered. Use a risk-based approach for preferred and approved tiers. Escalate suppliers failing ESG audits to executive-level review.',
    inputs: [
      { id: 'total_strategic_srg', label: 'Total strategic-tier suppliers', unit: 'suppliers', dataSource: 'Supplier segmentation model', example: 25 },
      { id: 'esg_audited_srg', label: 'Strategic suppliers with completed ESG audit within the last 12 months', unit: 'suppliers', dataSource: 'Supplier ESG / risk platform — audit completion records', example: 23 },
    ],
    calculate: ({ total_strategic_srg, esg_audited_srg }) => pct(safe(esg_audited_srg), safe(total_strategic_srg)),
  },
  {
    kpiId: 'sc2',
    methodology: 'On-Time Scorecard Review % measures the % of scheduled supplier scorecard review meetings that take place on time — a proxy for relationship management discipline and strategic supplier engagement.',
    formula: 'Scorecard Review% = (On-Time Reviews Completed ÷ Total Reviews Scheduled) × 100',
    notes: 'Define cadence by tier: monthly (strategic), quarterly (preferred), semi-annual (approved). "On-time" = completed within ±5 business days of scheduled date. Must be a two-way meeting, not a one-way report.',
    inputs: [
      { id: 'reviews_scheduled', label: 'Total supplier scorecard reviews scheduled in the period', unit: 'reviews', dataSource: 'SRM programme calendar — all reviews scheduled for the period by tier', example: 48 },
      { id: 'reviews_on_time', label: 'Reviews completed within ±5 business days of the scheduled date', unit: 'reviews', dataSource: 'Meeting records / SRM platform — reviews with completion date within tolerance', example: 44 },
    ],
    calculate: ({ reviews_scheduled, reviews_on_time }) => pct(safe(reviews_on_time), safe(reviews_scheduled)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// RESILIENCY
// ═══════════════════════════════════════════════════════════════════════════
const RESILIENCY: KpiDataSpec[] = [
  {
    kpiId: 'rtoa',
    methodology: 'RTO (Recovery Time Objective) Attainment % measures the proportion of supply chain disruption events where operations were restored within the pre-defined RTO in your Business Continuity Plan (BCP).',
    formula: 'RTO Attainment% = (Disruptions Recovered Within RTO ÷ Total Disruptions) × 100',
    notes: 'Each business process / supply chain function should have a defined RTO in the BCP. Track every disruption event: supplier failure, logistics breakdown, system outage, facility issue. Include near-misses.',
    inputs: [
      { id: 'total_disruptions', label: 'Total supply chain disruption events in the period requiring BCP activation or significant management intervention', unit: 'events', dataSource: 'Incident log / BCP activation records for the period', example: 12 },
      { id: 'disruptions_within_rto', label: 'Disruptions where operations were fully restored within the defined RTO', unit: 'events', dataSource: 'BCP debrief records — events where actual recovery time ≤ RTO defined in BCP', example: 10 },
    ],
    calculate: ({ total_disruptions, disruptions_within_rto }) => pct(safe(disruptions_within_rto), safe(total_disruptions)),
  },
  {
    kpiId: 'mttr',
    methodology: 'Mean Time to Recover (MTTR) measures the average hours from when a supply chain disruption is confirmed to when full operational capability is restored. It is the primary operational resilience outcome measure.',
    formula: 'MTTR = Σ Recovery Hours Across All Disruptions ÷ Number of Disruptions',
    notes: 'Recovery = return to ≥95% of pre-disruption service level. Include all hours including nights and weekends (calendar hours, not working hours). Segment by disruption type (supplier, logistics, IT, facility).',
    inputs: [
      { id: 'total_recovery_hours', label: 'Sum of recovery hours across all disruption events in the period', unit: 'hours', dataSource: 'Incident logs — sum of (disruption_resolved_timestamp − disruption_confirmed_timestamp) for each event', example: 504 },
      { id: 'total_disruptions_mttr', label: 'Total number of disruption events in the period', unit: 'events', dataSource: 'Incident log — count of disruption events', example: 8 },
    ],
    calculate: ({ total_recovery_hours, total_disruptions_mttr }) => avg(safe(total_recovery_hours), safe(total_disruptions_mttr)),
  },
  {
    kpiId: 'dsc',
    methodology: 'Dual-Source Coverage % measures the proportion of critical items / categories that have at least two qualified, approved, and capable second sources — enabling rapid switching in a supply disruption.',
    formula: 'Dual-Source Coverage% = (Critical Items with ≥2 Qualified Sources ÷ Total Critical Items) × 100',
    notes: 'A "qualified second source" must have: passed your supplier qualification process, received at least one test order, and demonstrated production capability. A shortlisted-but-not-approved supplier does not count.',
    inputs: [
      { id: 'total_critical_items', label: 'Total critical items / part numbers / categories requiring dual-source coverage', unit: 'items', dataSource: 'Critical item register — items classified as critical in your supply risk assessment (high impact × high probability)', example: 180 },
      { id: 'dual_source_items', label: 'Critical items with ≥2 qualified, approved, and capable suppliers on the ASL', unit: 'items', dataSource: 'ASL / supplier qualification records — critical items with ≥2 approved suppliers with demonstrated capability', example: 153 },
    ],
    calculate: ({ total_critical_items, dual_source_items }) => pct(safe(dual_source_items), safe(total_critical_items)),
  },
  {
    kpiId: 'buf',
    methodology: 'Buffer Stock in Days of Supply measures how many days of forward demand can be covered by current safety stock for critical items — the most direct measure of supply interruption protection.',
    formula: 'Buffer Stock (days) = Total Buffer Stock Value ÷ (Annual COGS ÷ 365)\n  Or: Average Buffer Inventory Units ÷ Average Daily Demand Units',
    notes: 'Calculate for critical items only. Target varies by lead time and supply risk: long lead time + single source = higher buffer target. Review quarterly as demand and lead times change.',
    inputs: [
      { id: 'buffer_stock_value', label: 'Total value of safety / buffer stock held for critical items', unit: 'SAR', dataSource: 'WMS / ERP inventory report — stock classified as safety stock or buffer stock for critical items', example: 1_800_000 },
      { id: 'critical_daily_cogs', label: 'Average daily COGS for the critical items in scope', unit: 'SAR/day', dataSource: 'Finance / ERP — annual COGS for critical items ÷ 365', example: 60_000 },
    ],
    calculate: ({ buffer_stock_value, critical_daily_cogs }) => {
      if (!critical_daily_cogs) return NaN;
      return Math.round((buffer_stock_value / critical_daily_cogs) * 10) / 10;
    },
  },
  {
    kpiId: 'sld',
    methodology: 'Service Level During Disruption measures the customer service level maintained during a declared supply chain disruption — the ultimate test of resilience. It shows whether your BCP actually protects the customer.',
    formula: 'Service Level During Disruption% = (Orders Fulfilled During Disruption ÷ Orders Demanded During Disruption) × 100',
    notes: 'Measure only during declared disruption periods. Compare against your normal service level. Gap = resilience shortfall. Analyse which product categories and customers were most affected.',
    inputs: [
      { id: 'orders_demanded_disruption', label: 'Total customer orders demanded during the disruption period', unit: 'orders', dataSource: 'OMS / ERP — all orders placed by customers during the disruption window', example: 320 },
      { id: 'orders_fulfilled_disruption', label: 'Customer orders successfully fulfilled (shipped and received) during the disruption', unit: 'orders', dataSource: 'WMS / OMS — orders with confirmed shipment during the disruption window', example: 272 },
    ],
    calculate: ({ orders_demanded_disruption, orders_fulfilled_disruption }) => pct(safe(orders_fulfilled_disruption), safe(orders_demanded_disruption)),
  },
  {
    kpiId: 'rar',
    methodology: 'Revenue at Risk % quantifies the proportion of annual revenue that is exposed to potential supply chain disruption — based on your risk register scenarios and their probability-weighted impact.',
    formula: 'Revenue at Risk% = (Probability-Weighted Revenue Exposure ÷ Total Annual Revenue) × 100',
    notes: 'Use your top 5–10 risk scenarios from the risk register. For each: estimate revenue impact if disruption occurs × probability of occurrence = expected loss. Sum across scenarios = total expected revenue at risk.',
    inputs: [
      { id: 'prob_weighted_exposure', label: 'Sum of probability-weighted revenue exposure across top supply chain risk scenarios (impact × probability for each)', unit: 'SAR', dataSource: 'Risk register — for each scenario: revenue_impact × annual_probability. Sum all scenarios.', example: 1_125_000 },
      { id: 'annual_revenue_rar', label: 'Total annual revenue', unit: 'SAR', dataSource: 'Finance — annual P&L revenue', example: 37_500_000 },
    ],
    calculate: ({ prob_weighted_exposure, annual_revenue_rar }) => pct(safe(prob_weighted_exposure), safe(annual_revenue_rar)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// VALUE ENGINEERING
// ═══════════════════════════════════════════════════════════════════════════
const VALUE_ENGINEERING: KpiDataSpec[] = [
  {
    kpiId: 'ves',
    methodology: 'VE Savings % of Spend measures the hard savings realised through value engineering — redesigning specifications, materials, processes, or logistics to achieve the same or better function at lower cost.',
    formula: 'VE Savings% = (Verified VE Savings ÷ Addressable Spend in Scope) × 100',
    notes: 'VE savings must be: finance-verified, specification-approved (no quality compromise), and budget-released. Separate from procurement negotiation savings. Track by project, by category manager.',
    inputs: [
      { id: 've_savings', label: 'Total verified VE savings delivered in the period (finance and engineering approved)', unit: 'SAR', dataSource: 'VE project tracker — savings with engineering sign-off AND finance budget release confirmation', example: 2_200_000 },
      { id: 've_addressable_spend', label: 'Total addressable spend in scope for VE programme', unit: 'SAR', dataSource: 'Spend analysis — categories included in the VE programme scope', example: 22_000_000 },
    ],
    calculate: ({ ve_savings, ve_addressable_spend }) => pct(safe(ve_savings), safe(ve_addressable_spend)),
  },
  {
    kpiId: 'scv',
    methodology: 'Should-Cost Variance % measures how far actual paid prices deviate from the engineering-derived should-cost model — the theoretical optimum cost if the supplier is operating efficiently with a fair margin.',
    formula: 'Should-Cost Variance% = (Actual Cost − Should Cost) ÷ Should Cost × 100',
    notes: 'Positive variance = overpaying vs theoretical cost (negotiation opportunity). Negative variance = paying below should cost (risk of quality compromise or hidden costs). Build should-cost models for top 20% of spend by value.',
    inputs: [
      { id: 'actual_cost_total', label: 'Total actual spend on items with should-cost models in the period', unit: 'SAR', dataSource: 'AP / ERP — actual invoiced amounts for items with engineering should-cost models', example: 8_800_000 },
      { id: 'should_cost_total', label: 'Total should-cost for the same items and volumes', unit: 'SAR', dataSource: 'Engineering / cost modelling team — should-cost models × actual volumes purchased', example: 8_360_000 },
    ],
    calculate: ({ actual_cost_total, should_cost_total }) => {
      if (!should_cost_total) return NaN;
      return Math.round(((actual_cost_total - should_cost_total) / should_cost_total) * 1000) / 10;
    },
  },
  {
    kpiId: 'iir',
    methodology: 'Idea-to-Implementation Rate measures the conversion rate from VE idea generation to successful implementation — a measure of programme execution effectiveness and the ability to turn concepts into real savings.',
    formula: 'Implementation Rate% = (VE Ideas Successfully Implemented ÷ Total VE Ideas Approved for Development) × 100',
    notes: 'Ideas go through: generation → screening → approval → feasibility → implementation → verification. Measure the final step (implemented and savings verified) vs approved ideas. Low rates indicate execution bottlenecks.',
    inputs: [
      { id: 'ideas_approved', label: 'Total VE ideas approved for development / feasibility study in the period', unit: 'ideas', dataSource: 'VE programme register — ideas with formal approval to proceed to feasibility', example: 80 },
      { id: 'ideas_implemented', label: 'VE ideas successfully implemented with verified savings in the period', unit: 'ideas', dataSource: 'VE project tracker — projects with implementation complete and savings verified', example: 51 },
    ],
    calculate: ({ ideas_approved, ideas_implemented }) => pct(safe(ideas_implemented), safe(ideas_approved)),
  },
  {
    kpiId: 'spc',
    methodology: 'Specification Compliance % ensures that VE outcomes do not compromise function or quality — measuring the % of VE-implemented changes where the product/service fully meets the original performance specification.',
    formula: 'Specification Compliance% = (VE Implementations Passing Specification ÷ Total VE Implementations) × 100',
    notes: 'Test against the original specification, not the modified one. Failures include: field complaints, quality rejections, performance shortfalls, or customer-reported issues attributable to the VE change.',
    inputs: [
      { id: 've_implementations', label: 'Total VE changes implemented and tested in the period', unit: 'implementations', dataSource: 'VE project tracker — projects with implementation complete and specification test conducted', example: 45 },
      { id: 've_spec_compliant', label: 'VE implementations where the product/service fully meets the original specification', unit: 'implementations', dataSource: 'Quality / engineering — implementations with zero specification failures in the verification period', example: 43 },
    ],
    calculate: ({ ve_implementations, ve_spec_compliant }) => pct(safe(ve_spec_compliant), safe(ve_implementations)),
  },
  {
    kpiId: 'tis',
    methodology: 'Time to Savings Realisation measures the average days from VE idea approval to when verified savings first appear in the financial accounts — the speed of converting ideas into bottom-line impact.',
    formula: 'Time to Savings = Σ Days (Idea Approved → Savings Verified in Finance) ÷ Number of Projects',
    notes: 'Bottlenecks typically appear at: engineering approval, supplier qualification, tooling lead time, and production changeover. Track by phase to identify where the pipeline is slowest.',
    inputs: [
      { id: 'total_tis_days', label: 'Sum of days from idea approval to finance verification of savings across all completed VE projects in the period', unit: 'days', dataSource: 'VE project tracker — timestamp: idea_approved to finance_savings_verified for each completed project', example: 4_725 },
      { id: 'total_ve_projects', label: 'Number of VE projects reaching savings verification in the period', unit: 'projects', dataSource: 'VE project tracker — projects with finance savings verification date in the period', example: 51 },
    ],
    calculate: ({ total_tis_days, total_ve_projects }) => avg(safe(total_tis_days), safe(total_ve_projects)),
  },
  {
    kpiId: 'ssat',
    methodology: 'Stakeholder Satisfaction measures how satisfied internal stakeholders (engineering, operations, quality, finance) are with VE outcomes — assessing whether savings were achieved without compromising the stakeholder experience.',
    formula: 'Satisfaction = Average rating from post-VE stakeholder survey (/5 scale)',
    notes: 'Survey stakeholders 90 days after implementation. Include: engineering, quality, operations, finance, and customer-facing teams. 5-point Likert scale. Low scores often indicate quality compromises or process disruptions.',
    inputs: [
      { id: 'total_satisfaction_score', label: 'Sum of all stakeholder satisfaction ratings collected (each rated /5)', unit: 'points', dataSource: 'Post-VE satisfaction survey responses — sum of all individual ratings', example: 378 },
      { id: 'total_respondents', label: 'Number of stakeholders who completed the satisfaction survey', unit: 'respondents', dataSource: 'Survey response count', example: 90 },
    ],
    calculate: ({ total_satisfaction_score, total_respondents }) => {
      if (!total_respondents) return NaN;
      return Math.round((total_satisfaction_score / total_respondents) * 10) / 10;
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS IMPROVEMENT & POLICY
// ═══════════════════════════════════════════════════════════════════════════
const PROCESS_IMPROVEMENT: KpiDataSpec[] = [
  {
    kpiId: 'pce2',
    methodology: 'Process Cycle Efficiency — same methodology as Lean Six Sigma PCE. Value-added time as % of total lead time across your improved processes.',
    formula: 'PCE% = (Value-Added Time ÷ Total Lead Time) × 100',
    notes: 'Map using VSM. Measure the specific processes targeted by your improvement programme.',
    inputs: [
      { id: 'va_time_pi', label: 'Value-added time per unit/transaction (VSM value-adding steps)', unit: 'minutes', dataSource: 'Current state VSM — sum of processing times for value-adding steps only', example: 38 },
      { id: 'total_lt_pi', label: 'Total end-to-end lead time per unit/transaction', unit: 'minutes', dataSource: 'Current state VSM — door-to-door elapsed time', example: 320 },
    ],
    calculate: ({ va_time_pi, total_lt_pi }) => pct(safe(va_time_pi), safe(total_lt_pi)),
  },
  {
    kpiId: 'ltr2',
    methodology: 'Lead Time Reduction % vs pre-improvement baseline — same as Lean Six Sigma LTR but measured for your process improvement programme specifically.',
    formula: 'Lead Time Reduction% = ((Baseline − Current) ÷ Baseline) × 100',
    notes: 'Baseline = lead time from As-Is VSM before the improvement project started.',
    inputs: [
      { id: 'baseline_lt_pi', label: 'Baseline end-to-end lead time BEFORE process improvement', unit: 'hours', dataSource: 'As-Is VSM from project start', example: 96 },
      { id: 'current_lt_pi', label: 'Current end-to-end lead time AFTER improvement', unit: 'hours', dataSource: 'To-Be VSM or current state measurement', example: 52 },
    ],
    calculate: ({ baseline_lt_pi, current_lt_pi }) => {
      if (!baseline_lt_pi) return NaN;
      return Math.round(((baseline_lt_pi - current_lt_pi) / baseline_lt_pi) * 1000) / 10;
    },
  },
  {
    kpiId: 'ftr2',
    methodology: 'First-Time-Right Rate for process improvement — same methodology as Lean FTR but measured in your policy/operations improvement context.',
    formula: 'FTR% = (Correct First-Time Outputs ÷ Total Outputs) × 100',
    notes: 'Count at first quality gate. Any rework, correction, or re-submission = not first-time-right.',
    inputs: [
      { id: 'total_outputs_pi', label: 'Total process outputs in the period', unit: 'transactions', dataSource: 'Operations / workflow system', example: 1_800 },
      { id: 'ftr_outputs_pi', label: 'Outputs completed correctly on first attempt', unit: 'transactions', dataSource: 'Quality check records — zero rework flag', example: 1_638 },
    ],
    calculate: ({ total_outputs_pi, ftr_outputs_pi }) => pct(safe(ftr_outputs_pi), safe(total_outputs_pi)),
  },
  {
    kpiId: 'pcr2',
    methodology: 'Policy Compliance Rate for process improvement — measures how well operations comply with documented, updated policies following a process improvement initiative.',
    formula: 'Policy Compliance% = (Compliant Operations ÷ Total Operations Audited) × 100',
    notes: 'Focus on the specific processes targeted by your improvement programme. Update your compliance checklist every time a policy is revised.',
    inputs: [
      { id: 'total_ops_audited', label: 'Total operations / transactions audited against updated policy', unit: 'transactions', dataSource: 'Internal audit sample for the period', example: 250 },
      { id: 'compliant_ops', label: 'Operations fully compliant with documented policy', unit: 'transactions', dataSource: 'Audit finding records — transactions with zero policy violations', example: 232 },
    ],
    calculate: ({ total_ops_audited, compliant_ops }) => pct(safe(compliant_ops), safe(total_ops_audited)),
  },
  {
    kpiId: 'afct',
    methodology: 'Audit Finding Closure Time measures the average days from an audit finding being raised to it being formally closed with a verified corrective action — a measure of organisational responsiveness to control weaknesses.',
    formula: 'Closure Time = Σ Days (Finding Raised → Finding Closed) ÷ Number of Findings Closed',
    notes: '"Closed" = corrective action implemented AND verified by the auditor, not merely planned. Findings with planned-but-not-verified actions remain open. Age findings >90 days for executive escalation.',
    inputs: [
      { id: 'total_finding_days', label: 'Sum of days from each audit finding being raised to being formally closed (verified)', unit: 'days', dataSource: 'Audit management system — sum of (close_date − raised_date) for findings closed in the period', example: 1_860 },
      { id: 'findings_closed', label: 'Number of audit findings formally closed (with verified corrective action) in the period', unit: 'findings', dataSource: 'Audit management system — findings with closure_status = verified_closed in the period', example: 62 },
    ],
    calculate: ({ total_finding_days, findings_closed }) => avg(safe(total_finding_days), safe(findings_closed)),
  },
  {
    kpiId: 'rfr',
    methodology: 'Repeat Finding Rate % measures the proportion of audit findings that reoccur in the next audit cycle — indicating that root causes were not properly addressed and corrective actions were superficial.',
    formula: 'Repeat Finding Rate% = (Findings That Recurred in Next Audit ÷ Total Prior-Period Findings Reviewed) × 100',
    notes: 'A finding "recurs" if the same or substantially similar control weakness is identified in the next audit of the same process. High repeat rates indicate cultural issues with accountability and root cause analysis.',
    inputs: [
      { id: 'prior_findings_reviewed', label: 'Total audit findings from the prior cycle that were reviewed in the current audit', unit: 'findings', dataSource: 'Audit management system — prior-cycle findings that are in scope for follow-up in the current audit', example: 62 },
      { id: 'repeat_findings', label: 'Prior-cycle findings that recurred (same or substantially similar) in the current audit', unit: 'findings', dataSource: 'Current audit report — findings explicitly noted as recurring from prior cycle', example: 8 },
    ],
    calculate: ({ prior_findings_reviewed, repeat_findings }) => pct(safe(repeat_findings), safe(prior_findings_reviewed)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TRAINING & CAPABILITY BUILDING
// ═══════════════════════════════════════════════════════════════════════════
const TRAINING_CAPABILITY: KpiDataSpec[] = [
  {
    kpiId: 'asi',
    methodology: 'Assessment Score Improvement measures the point gain in formal knowledge assessment scores between pre-training (before) and post-training (after) — the learning effectiveness measure (Kirkpatrick Level 2).',
    formula: 'Score Improvement = Average Post-Training Score − Average Pre-Training Score (points out of 100)',
    notes: 'Use the same assessment instrument for pre and post (parallel forms or identical). Minimum 4-week gap between training completion and post-assessment gives a more reliable learning retention measure.',
    inputs: [
      { id: 'avg_pre_score', label: 'Average assessment score BEFORE training (all participants, /100)', unit: 'points', dataSource: 'Pre-training assessment results — average score across all participants who completed the pre-test', example: 52 },
      { id: 'avg_post_score', label: 'Average assessment score AFTER training (same participants, /100)', unit: 'points', dataSource: 'Post-training assessment results — average score across same participants (matched pairs)', example: 79 },
    ],
    calculate: ({ avg_pre_score, avg_post_score }) => Math.round((safe(avg_post_score) - safe(avg_pre_score)) * 10) / 10,
  },
  {
    kpiId: 'tcr',
    methodology: 'Training Completion Rate measures the % of staff assigned to a training programme who complete all required modules and assessments within the scheduled timeframe.',
    formula: 'Training Completion% = (Staff Completing All Required Modules ÷ Staff Enrolled) × 100',
    notes: '"Complete" = finished all modules + passed the assessment (if applicable) + submitted within deadline. Track by programme, by business unit, and by management level. Non-completion is a people manager accountability.',
    inputs: [
      { id: 'staff_enrolled', label: 'Total staff enrolled in the training programme', unit: 'people', dataSource: 'LMS (Learning Management System) — enrolment records', example: 120 },
      { id: 'staff_completed', label: 'Staff who completed ALL required modules and assessments by the deadline', unit: 'people', dataSource: 'LMS — completion records with all required modules marked complete and assessment passed', example: 104 },
    ],
    calculate: ({ staff_enrolled, staff_completed }) => pct(safe(staff_completed), safe(staff_enrolled)),
  },
  {
    kpiId: 'cepr',
    methodology: 'CIPS Exam Pass Rate measures the % of staff who pass CIPS (Chartered Institute of Procurement & Supply) professional qualification exams in the sitting — measuring investment in professional credentialing.',
    formula: 'CIPS Pass Rate% = (CIPS Exams Passed ÷ Total CIPS Exams Sat) × 100',
    notes: 'Count at exam level (not candidate level). If a candidate sits 3 papers and passes 2, count as 2 passed / 3 sat. Track by CIPS level (L2, L4, L5, L6) and by study centre. Compare against CIPS global average pass rate (~65%).',
    inputs: [
      { id: 'cips_exams_sat', label: 'Total CIPS exam papers sat by staff in the period (all levels combined)', unit: 'exam sittings', dataSource: 'CIPS exam results / HR training records — count of papers sat in the period', example: 45 },
      { id: 'cips_exams_passed', label: 'CIPS exam papers passed in the period', unit: 'exam passes', dataSource: 'CIPS exam results — papers with a passing grade in the period', example: 36 },
    ],
    calculate: ({ cips_exams_sat, cips_exams_passed }) => pct(safe(cips_exams_passed), safe(cips_exams_sat)),
  },
  {
    kpiId: 'bcs',
    methodology: 'Behaviour Change Score measures the % of trained behaviours that are observed being applied in the workplace 90 days after training — Kirkpatrick Level 3, the most predictive indicator of sustained training impact.',
    formula: 'Behaviour Change% = (Trained Behaviours Observed On-the-Job at 90 Days ÷ Total Trained Behaviours Assessed) × 100',
    notes: 'Requires a structured 90-day observation / manager assessment against a defined behaviour checklist. Each behaviour scored 1 (not observed) to 4 (consistently applied). Count ≥3 as observed. Use 360 feedback for accuracy.',
    inputs: [
      { id: 'behaviours_assessed', label: 'Total trained behaviours assessed at the 90-day mark (participants × behaviours per participant)', unit: 'behaviour observations', dataSource: 'Line manager 90-day assessment forms — total observations recorded', example: 840 },
      { id: 'behaviours_observed', label: 'Trained behaviours scored ≥3 (regularly applied) at the 90-day assessment', unit: 'behaviour observations', dataSource: '90-day assessment forms — observations rated 3 or 4 out of 4', example: 630 },
    ],
    calculate: ({ behaviours_assessed, behaviours_observed }) => pct(safe(behaviours_observed), safe(behaviours_assessed)),
  },
  {
    kpiId: 'kpii',
    methodology: 'Post-Training KPI Improvement % measures the improvement in relevant team or individual KPIs attributable to the training intervention — Kirkpatrick Level 4, the business results measure.',
    formula: 'KPI Improvement% = ((Post-Training KPI − Pre-Training KPI) ÷ Pre-Training KPI) × 100',
    notes: 'Choose 2–3 measurable KPIs directly related to training content (e.g. PO accuracy rate after procurement training). Use 12-week pre/post comparison. Exclude external factors (market changes, system changes) in your attribution.',
    inputs: [
      { id: 'pre_training_kpi', label: 'Baseline KPI value BEFORE training (12-week average prior to training start)', unit: '%', dataSource: 'Operations reports — 12-week average of the relevant KPI immediately before training began', example: 68 },
      { id: 'post_training_kpi', label: 'KPI value AFTER training (12-week average, starting 4 weeks post-completion)', unit: '%', dataSource: 'Operations reports — 12-week average of same KPI starting 4 weeks after training completion', example: 79 },
    ],
    calculate: ({ pre_training_kpi, post_training_kpi }) => {
      if (!pre_training_kpi) return NaN;
      return Math.round(((post_training_kpi - pre_training_kpi) / pre_training_kpi) * 1000) / 10;
    },
  },
  {
    kpiId: 'roi',
    methodology: 'Training ROI % quantifies the financial return on training investment — Kirkpatrick-Phillips Level 5. It compares the monetary benefits from improved performance against the fully-loaded cost of the training programme.',
    formula: 'Training ROI% = ((Monetary Benefits − Total Training Costs) ÷ Total Training Costs) × 100\nMonetary Benefits = Quantified KPI improvements × financial value (e.g. savings from errors avoided, productivity gains)',
    notes: 'Fully-loaded costs include: fees, materials, venue, travel, staff time (opportunity cost), LMS, and management time. Benefits = conservative estimate of measurable improvements. Isolate training impact from other variables.',
    inputs: [
      { id: 'training_costs_total', label: 'Total fully-loaded training investment (fees + materials + venue + travel + staff time opportunity cost)', unit: 'SAR', dataSource: 'Finance / HR — all direct and indirect costs of the training programme', example: 180_000 },
      { id: 'training_benefits_total', label: 'Total monetary benefits attributable to training (quantified KPI improvements × financial value)', unit: 'SAR', dataSource: 'Finance / operations — conservative estimate of error savings, productivity gains, and waste reduction attributable to training', example: 882_000 },
    ],
    calculate: ({ training_costs_total, training_benefits_total }) => {
      if (!training_costs_total) return NaN;
      return Math.round(((training_benefits_total - training_costs_total) / training_costs_total) * 1000) / 10;
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// RISK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
const RISK_MANAGEMENT: KpiDataSpec[] = [
  {
    kpiId: 'rrc',
    methodology: 'Risk Register Coverage % measures the proportion of known supply chain risk categories that have been formally identified, assessed, and documented in the risk register — the foundation of risk management maturity.',
    formula: 'Risk Register Coverage% = (Risk Categories Formally Documented ÷ Total Identified Risk Categories) × 100',
    notes: 'Risk categories include: supplier risk, logistics risk, demand risk, geopolitical risk, regulatory risk, cyber risk, natural disaster risk, etc. Use ISO 31000 or COSO framework as your taxonomy.',
    inputs: [
      { id: 'total_risk_categories', label: 'Total supply chain risk categories identified (from risk taxonomy / brainstorming workshop)', unit: 'categories', dataSource: 'Risk management workshop output or industry risk taxonomy applied to your context', example: 28 },
      { id: 'documented_risk_categories', label: 'Risk categories with formal documentation: risk owner, likelihood, impact, controls, and mitigation plan', unit: 'categories', dataSource: 'Risk register — categories with complete risk cards (all mandatory fields populated)', example: 24 },
    ],
    calculate: ({ total_risk_categories, documented_risk_categories }) => pct(safe(documented_risk_categories), safe(total_risk_categories)),
  },
  {
    kpiId: 'bcpt',
    methodology: 'BCP Test Pass Rate % measures the proportion of Business Continuity Plan exercises conducted annually that demonstrate the organisation can achieve its recovery objectives — validating that the BCP actually works in practice.',
    formula: 'BCP Test Pass Rate% = (BCP Tests Passed ÷ Total BCP Tests Conducted) × 100',
    notes: 'Tests range from desktop exercises to full live drills. A test "passes" when: all objectives are met, RTO is achieved, and no critical gaps are identified that were not already known. Annual testing minimum; quarterly for critical processes.',
    inputs: [
      { id: 'bcp_tests_conducted', label: 'Total BCP exercises / tests conducted in the period', unit: 'tests', dataSource: 'BCP test log — all exercises (desktop, simulation, live) conducted and documented', example: 8 },
      { id: 'bcp_tests_passed', label: 'BCP tests where all objectives were met and RTO achieved', unit: 'tests', dataSource: 'BCP test reports — exercises marked as passed by the test director', example: 7 },
    ],
    calculate: ({ bcp_tests_conducted, bcp_tests_passed }) => pct(safe(bcp_tests_passed), safe(bcp_tests_conducted)),
  },
  {
    kpiId: 'rtoa2',
    methodology: 'RTO Attainment % for risk management — same as resilience RTO attainment but tracked in the risk management context for BCP compliance reporting.',
    formula: 'RTO Attainment% = (Disruptions Recovered Within RTO ÷ Total Disruptions) × 100',
    notes: 'Report to the risk committee quarterly. Trend downward = resilience degradation requiring BCP update.',
    inputs: [
      { id: 'total_disrupt_rm', label: 'Total supply disruption events in the period', unit: 'events', dataSource: 'Incident / risk event log', example: 10 },
      { id: 'rto_met_rm', label: 'Events where operations recovered within the defined RTO', unit: 'events', dataSource: 'BCP debrief records', example: 9 },
    ],
    calculate: ({ total_disrupt_rm, rto_met_rm }) => pct(safe(rto_met_rm), safe(total_disrupt_rm)),
  },
  {
    kpiId: 'ssr',
    methodology: 'Supplier Risk Score measures the weighted average risk rating across your active supplier portfolio — combining financial risk, operational risk, geopolitical risk, and ESG risk into a single portfolio health indicator.',
    formula: 'Portfolio Risk Score = Σ (Supplier Risk Score × Spend Weight) ÷ Total Spend\nwhere each supplier risk score is on a 1–10 scale (10 = highest risk)',
    notes: 'Assess each active supplier against: financial stability (Dun & Bradstreet or equivalent), single-source dependency, geographic concentration, ESG compliance, and performance history. Update quarterly for strategic suppliers.',
    inputs: [
      { id: 'total_risk_weighted_spend', label: 'Sum of (Supplier Risk Score × Supplier Spend) across all active suppliers', unit: 'SAR×score', dataSource: 'Supplier risk database — for each supplier: risk_score (1–10) × annual_spend. Sum all suppliers.', example: 154_000_000 },
      { id: 'total_active_spend_rm', label: 'Total active supplier spend', unit: 'SAR', dataSource: 'AP spend — total spend with active suppliers in the period', example: 22_000_000 },
    ],
    calculate: ({ total_risk_weighted_spend, total_active_spend_rm }) => {
      if (!total_active_spend_rm) return NaN;
      return Math.round((total_risk_weighted_spend / total_active_spend_rm) * 10) / 10;
    },
  },
  {
    kpiId: 'mitm',
    methodology: 'Risk Mitigation Effectiveness % measures the proportion of identified high-priority risks that have an implemented (not just planned) mitigation control in place — measuring execution of the risk response plan.',
    formula: 'Mitigation Effectiveness% = (High-Priority Risks with Implemented Controls ÷ Total High-Priority Risks) × 100',
    notes: '"Implemented" = control is active, tested, and evidenced. Not just documented in the register. High-priority = risks rated 16–25 on a 5×5 risk matrix (likelihood × impact). Review monthly.',
    inputs: [
      { id: 'total_high_risks', label: 'Total supply chain risks rated High or Critical (score ≥16 on 5×5 matrix)', unit: 'risks', dataSource: 'Risk register — risks with likelihood × impact score ≥16', example: 22 },
      { id: 'mitigated_high_risks', label: 'High/critical risks with fully implemented and tested mitigation controls in place', unit: 'risks', dataSource: 'Risk register — high-priority risks with control_status = implemented AND evidence_filed = yes', example: 18 },
    ],
    calculate: ({ total_high_risks, mitigated_high_risks }) => pct(safe(mitigated_high_risks), safe(total_high_risks)),
  },
  {
    kpiId: 'eri',
    methodology: 'Emerging Risk Identification Rate measures how proactively your organisation identifies new and emerging supply chain risks — tracking the ratio of risks identified through proactive scanning vs those discovered after an incident.',
    formula: 'Proactive Identification% = (Risks Identified Proactively ÷ Total New Risks Identified) × 100',
    notes: 'Proactive = identified through horizon scanning, supplier news monitoring, industry intelligence, or risk workshops — BEFORE any disruption occurs. Reactive = discovered when a disruption or near-miss happens.',
    inputs: [
      { id: 'total_new_risks', label: 'Total new supply chain risks added to the register in the period', unit: 'risks', dataSource: 'Risk register — risks with date_added in the period', example: 15 },
      { id: 'proactive_risks', label: 'New risks identified proactively (through horizon scanning, supplier monitoring, intelligence) — NOT triggered by an incident', unit: 'risks', dataSource: 'Risk register — new risks with identification_source = proactive/horizon-scan/intelligence', example: 11 },
    ],
    calculate: ({ total_new_risks, proactive_risks }) => pct(safe(proactive_risks), safe(total_new_risks)),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MASTER INDEX — maps each KPI ID to its spec
// ═══════════════════════════════════════════════════════════════════════════
export const KPI_DATA_SPECS: Record<string, KpiDataSpec> = Object.fromEntries(
  [
    ...SUPPLY_CHAIN_STRATEGY,
    ...PROCUREMENT_EXCELLENCE,
    ...LEAN_SIX_SIGMA,
    ...DIGITAL_TRANSFORMATION,
    ...SUSTAINABILITY_ESG,
    ...GOVERNANCE_COMPLIANCE,
    ...CONTRACT_LIFECYCLE,
    ...SUPPLIER_RELATIONSHIP,
    ...RESILIENCY,
    ...VALUE_ENGINEERING,
    ...PROCESS_IMPROVEMENT,
    ...TRAINING_CAPABILITY,
    ...RISK_MANAGEMENT,
  ].map(spec => [spec.kpiId, spec]),
);
