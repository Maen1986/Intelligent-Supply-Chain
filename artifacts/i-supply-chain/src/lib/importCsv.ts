/**
 * Minimal CSV parser — handles quoted fields and UTF-8 BOM.
 *
 * Designed for the toolkit import flow: parse a user-supplied CSV file,
 * validate that required column headers are present, and return the rows
 * as header-keyed records.
 *
 * No third-party dependencies — uses only the native FileReader API and
 * standard string operations.
 */

export interface CsvParseResult {
  /** Headers from the first row (BOM-stripped, trimmed). */
  headers: string[];
  /** Data rows as header → value maps. Empty cells → empty string. */
  rows: Record<string, string>[];
  /** Fatal or per-row errors collected during parsing. */
  errors: string[];
}

/**
 * Parse a single CSV line, respecting RFC-4180 quoted fields.
 * Escaped double-quotes (`""`) inside quoted fields are handled.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { fields.push(''); break; }
    if (line[i] === '"') {
      // Quoted field
      let val = '';
      i++; // skip opening "
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { val += line[i++]; }
      }
      fields.push(val);
      if (line[i] === ',') i++; // skip separator
    } else {
      // Unquoted field — read until comma or end
      const end = line.indexOf(',', i);
      if (end === -1) { fields.push(line.slice(i)); break; }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

/**
 * Parse a CSV text string and validate required headers.
 *
 * When `requiredHeaders` are provided the parser scans all lines (up to the
 * first 30) to find the row that contains every required column — so files
 * with leading branding / instruction rows (such as the KPI data-collection
 * template) are handled correctly without any special pre-processing.
 *
 * If no `requiredHeaders` are given, line 0 is used as the header row
 * (original behaviour, unchanged).
 *
 * @param text              Raw file content (may start with a UTF-8 BOM).
 * @param requiredHeaders   Column names that must be present somewhere in the
 *                          first 30 lines.  If none are found there, rows is []
 *                          and errors is non-empty.
 *
 * @returns `{ headers, rows, errors }` — rows are empty on a fatal header error.
 */
export function parseCsvFile(
  text: string,
  requiredHeaders: string[],
): CsvParseResult {
  // Strip UTF-8 BOM (Excel adds this)
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['The file is empty.'] };
  }

  // Find the header row: scan lines until one contains all required headers.
  // This lets templates include branding/instructions rows before the header row.
  let headerLineIndex = 0;
  if (requiredHeaders.length > 0) {
    for (let li = 0; li < lines.length; li++) {
      const candidate = parseCsvLine(lines[li]).map(h => h.trim());
      if (requiredHeaders.every(h => candidate.includes(h))) {
        headerLineIndex = li;
        break;
      }
    }
  }

  const headers = parseCsvLine(lines[headerLineIndex]).map(h => h.trim());
  const errors: string[] = [];

  // Validate required headers
  const missing = requiredHeaders.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    errors.push(`Missing required column(s): ${missing.join(', ')}`);
    return { headers, rows: [], errors };
  }

  const rows: Record<string, string>[] = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, hi) => { row[h] = (vals[hi] ?? '').trim(); });
    rows.push(row);
  }

  return { headers, rows, errors };
}

/**
 * Trigger a client-side CSV file download.
 *
 * @param rows     2D array — first row is headers.
 * @param filename Download filename (should end in `.csv`).
 */
export function downloadCsv(rows: string[][], filename: string): void {
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
