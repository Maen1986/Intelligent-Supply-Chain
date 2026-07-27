/**
 * ISC Event Catalog
 *
 * Single source of truth for all outbound event names and their metadata.
 * Import ISC_EVENTS wherever you need the full list (integrations UI, n8n templates, etc.).
 * Import buildEventPayload to stamp a consistent envelope on every dispatchEvent call.
 */

export interface IscEventDef {
  name:        string;
  description: string;
  category:    "auth" | "assessment" | "ai" | "supplier" | "kpi" | "spend" | "risk" | "feedback" | "lead" | "plan" | "system";
}

export const ISC_EVENTS: IscEventDef[] = [
  // ── Auth ────────────────────────────────────────────────────────────────────
  { name: "user.registered",        description: "A new user account was created",                              category: "auth"       },
  { name: "user.login",             description: "A user signed in to their account",                           category: "auth"       },
  // ── Assessment ──────────────────────────────────────────────────────────────
  { name: "assessment.saved",       description: "A command-centre briefing / assessment was submitted",        category: "assessment" },
  // ── AI ──────────────────────────────────────────────────────────────────────
  { name: "ai_plan.generated",      description: "An AI action plan was generated for a toolkit tool",         category: "ai"         },
  // ── Supplier ────────────────────────────────────────────────────────────────
  { name: "supplier.updated",       description: "The supplier scorecard roster was saved via the UI",         category: "supplier"   },
  { name: "supplier.imported",      description: "Suppliers were bulk-imported via the M2M API",               category: "supplier"   },
  { name: "supplier.tier_changed",  description: "A supplier's tier classification changed",                   category: "supplier"   },
  // ── KPI ─────────────────────────────────────────────────────────────────────
  { name: "kpi.imported",           description: "KPI values were imported via the M2M API",                   category: "kpi"        },
  { name: "kpi.rag_changed",        description: "A KPI crossed a RAG band threshold on import",               category: "kpi"        },
  // ── Spend ───────────────────────────────────────────────────────────────────
  { name: "spend.imported",         description: "Spend Pareto data was imported via the M2M API",             category: "spend"      },
  // ── Risk ────────────────────────────────────────────────────────────────────
  { name: "risk_kri.imported",      description: "KRI values were imported via the M2M API",                   category: "risk"       },
  { name: "kri.threshold_breached", description: "A KRI crossed its amber or red threshold",                   category: "risk"       },
  // ── Feedback ────────────────────────────────────────────────────────────────
  { name: "feedback.submitted",     description: "A visitor submitted tool feedback",                          category: "feedback"   },
  // ── Lead ────────────────────────────────────────────────────────────────────
  { name: "lead.captured",          description: "A lead submitted the command-centre briefing form",          category: "lead"       },
  // ── Plans ───────────────────────────────────────────────────────────────────
  { name: "plan.saved",             description: "A generated AI plan was saved to a toolkit",                 category: "plan"       },
  { name: "plan.deleted",           description: "A saved AI plan was deleted from a toolkit",                 category: "plan"       },
  // ── KPI Threshold Alerts ─────────────────────────────────────────────────────
  { name: "kpi.threshold_breach",   description: "A KPI value crossed a user-defined warn or critical threshold", category: "kpi"    },
  // ── Scheduled Jobs ───────────────────────────────────────────────────────────
  { name: "schedule.weekly_kpi_digest",    description: "Weekly KPI summary digest sent to user",               category: "system" },
  { name: "schedule.monthly_scorecard",    description: "Monthly supplier scorecard digest sent to user",        category: "system" },
  { name: "schedule.lead_followup",        description: "Uncontacted lead flagged for follow-up after 48 hours", category: "system" },
  { name: "schedule.stale_data_nudge",     description: "User nudged to re-import KPI data after 14+ days",     category: "system" },
  // ── System ──────────────────────────────────────────────────────────────────
  { name: "webhook.test",           description: "A test ping was sent from the integrations UI",              category: "system"     },
  { name: "test.ping",              description: "A connectivity test from the Automation Hub",                category: "system"     },
];

/** Flat list of event name strings — useful for validation and dropdown menus */
export const ISC_EVENT_NAMES = ISC_EVENTS.map(e => e.name);

export interface EventPayload {
  event:     string;
  source:    "isc";
  version:   "1";
  timestamp: string;
  userId:    number | null;
  data:      unknown;
}

/**
 * Stamp a consistent envelope on every event payload.
 * Use in route handlers before calling dispatchEvent():
 *
 *   dispatchEvent(userId, "user.registered", buildEventPayload("user.registered", userId, { email }));
 */
export function buildEventPayload(
  event:  string,
  userId: number | null,
  data:   unknown,
): EventPayload {
  return {
    event,
    source:    "isc",
    version:   "1",
    timestamp: new Date().toISOString(),
    userId,
    data,
  };
}
