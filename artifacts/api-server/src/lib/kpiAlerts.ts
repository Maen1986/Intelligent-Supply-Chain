/**
 * KPI Threshold Alerting
 *
 * Reads user-defined thresholds from tool_data.kpiThresholds and fires
 * `kpi.threshold_breach` events (+ email for critical breaches) whenever
 * an imported KPI value crosses a warn or critical boundary.
 *
 * Thresholds shape: Record<kpiKey, { warn: number; critical: number; higherIsBetter?: boolean }>
 *
 * Called from the /api/v1/kpis/import route after every successful import.
 */

import { dispatchEvent } from "./webhookDispatch";
import { sendAlertEmail } from "./notifyHelpers";
import { logger }         from "./logger";

export interface KpiThreshold {
  warn:             number;
  critical:         number;
  higherIsBetter?:  boolean;
  label?:           string;
  category?:        string;
}

export type KpiThresholds = Record<string, KpiThreshold>;

type Severity = "warn" | "critical" | null;

/**
 * Determine breach severity for a single KPI value against its threshold.
 * Returns null when the value is within acceptable limits.
 */
function breachSeverity(
  value:     unknown,
  threshold: KpiThreshold,
): Severity {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (isNaN(n)) return null;

  const { warn, critical, higherIsBetter = false } = threshold;

  if (higherIsBetter) {
    // Lower is worse — critical < warn < ok
    if (n <= critical) return "critical";
    if (n <= warn)     return "warn";
  } else {
    // Higher is worse — ok < warn < critical
    if (n >= critical) return "critical";
    if (n >= warn)     return "warn";
  }
  return null;
}

/**
 * Check all imported KPI values against the user's stored thresholds.
 * Fires `kpi.threshold_breach` events and emails for any breach found.
 * Never throws — all errors are caught and logged.
 */
export async function checkKpiThresholds(params: {
  userId:    number;
  userEmail: string;
  fullName:  string;
  slug:      string;
  values:    Record<string, unknown>;
  toolData:  Record<string, unknown> | null;
}): Promise<void> {
  try {
    const thresholds = (params.toolData?.kpiThresholds ?? {}) as KpiThresholds;
    if (Object.keys(thresholds).length === 0) return;

    const criticalBreaches: Array<{ kpiId: string; label: string; value: unknown; threshold: KpiThreshold }> = [];

    for (const [kpiId, threshold] of Object.entries(thresholds)) {
      const value    = params.values[kpiId];
      if (value === undefined) continue;

      const severity = breachSeverity(value, threshold);
      if (!severity) continue;

      const label = threshold.label ?? kpiId;

      dispatchEvent(params.userId, "kpi.threshold_breach", {
        kpiId,
        label,
        kpiLabel:          label,          // alias for Make/Zapier templates
        kpiCategory:       threshold.category ?? null,
        slug:             params.slug,
        severity,
        value,
        warnThreshold:    threshold.warn,
        criticalThreshold: threshold.critical,
        higherIsBetter:   threshold.higherIsBetter ?? false,
      });

      if (severity === "critical") {
        criticalBreaches.push({ kpiId, label, value, threshold });
      }
    }

    // Send an immediate email for critical breaches (batch all in one email)
    if (criticalBreaches.length > 0) {
      const subject = `🚨 Critical KPI Alert — ${params.fullName} (${params.slug})`;
      const rows: Record<string, string> = {
        "Account":       `${params.fullName} <${params.userEmail}>`,
        "Framework":     params.slug,
        "Alert Time":    new Date().toLocaleString("en-GB", { timeZone: "Asia/Riyadh" }),
      };
      for (const { label, value, threshold } of criticalBreaches) {
        rows[label] = `${value} (critical threshold: ${threshold.critical}${threshold.higherIsBetter ? "% min" : "% max"})`;
      }
      await sendAlertEmail(subject, rows).catch(
        err => logger.error({ err }, "[kpiAlerts] Failed to send critical alert email"),
      );
    }
  } catch (err) {
    logger.error({ err }, "[kpiAlerts] checkKpiThresholds error");
  }
}
