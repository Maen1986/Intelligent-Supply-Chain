/**
 * Validates a user-supplied webhook URL before it is stored or called.
 *
 * Rejects:
 *  - Non-HTTP(S) schemes
 *  - Malformed URLs
 *  - Loopback / localhost targets (SSRF)
 *  - RFC-1918 private ranges (SSRF)
 *  - Link-local and documentation ranges
 *  - IPv6 loopback, link-local, and ULA private ranges (including bracket-wrapped literals)
 *  - IPv4-mapped IPv6 addresses that wrap private IPv4 ranges
 */
export function validateWebhookUrl(rawUrl: string): { valid: true } | { valid: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, reason: "URL is malformed — must be a fully-qualified http(s) URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: `Scheme "${parsed.protocol}" is not allowed — use https or http.` };
  }

  // URL.hostname for IPv6 literals includes surrounding brackets, e.g. "[::1]".
  // Strip them before pattern matching.
  const rawHost = parsed.hostname.toLowerCase();
  const host    = rawHost.startsWith("[") && rawHost.endsWith("]")
    ? rawHost.slice(1, -1)
    : rawHost;

  // ── IPv4 checks ───────────────────────────────────────────────────────────

  // Loopback 127.0.0.0/8
  if (/^127\./.test(host) || host === "localhost") {
    return { valid: false, reason: "Loopback and localhost targets are not allowed." };
  }
  // Unspecified address
  if (host === "0.0.0.0" || /^0\./.test(host)) {
    return { valid: false, reason: "This address range is not permitted." };
  }
  // RFC-1918: 10.0.0.0/8
  if (/^10\./.test(host)) {
    return { valid: false, reason: "Private network addresses (10.x.x.x) are not allowed." };
  }
  // RFC-1918: 192.168.0.0/16
  if (/^192\.168\./.test(host)) {
    return { valid: false, reason: "Private network addresses (192.168.x.x) are not allowed." };
  }
  // RFC-1918: 172.16.0.0/12
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return { valid: false, reason: "Private network addresses (172.16–31.x.x) are not allowed." };
  }
  // Link-local 169.254.0.0/16 (includes AWS/GCP instance metadata)
  if (/^169\.254\./.test(host)) {
    return { valid: false, reason: "Link-local addresses are not allowed." };
  }

  // ── IPv6 checks ───────────────────────────────────────────────────────────

  // Loopback ::1
  if (host === "::1") {
    return { valid: false, reason: "IPv6 loopback (::1) is not allowed." };
  }
  // Link-local fe80::/10  (fe80 … fe8f … feBF)
  if (/^fe[89ab]/i.test(host)) {
    return { valid: false, reason: "IPv6 link-local addresses (fe80::/10) are not allowed." };
  }
  // ULA private fc00::/7 (fc and fd prefixes)
  if (/^f[cd]/i.test(host)) {
    return { valid: false, reason: "IPv6 private (ULA) addresses (fc00::/7) are not allowed." };
  }

  // IPv4-mapped IPv6 ::ffff:x.x.x.x — extract and re-validate the embedded IPv4 address
  const ipv4MappedMatch = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (ipv4MappedMatch) {
    const embeddedIpv4 = ipv4MappedMatch[1];
    const inner = validateWebhookUrl(`https://${embeddedIpv4}/`);
    if (!inner.valid) {
      return { valid: false, reason: `IPv4-mapped IPv6 wraps a blocked address: ${inner.reason}` };
    }
  }
  // Hex IPv4-mapped e.g. ::ffff:7f00:1 (127.0.0.1)
  const hexMappedMatch = host.match(/^::ffff:([0-9a-f]+):([0-9a-f]+)$/i);
  if (hexMappedMatch) {
    // Reconstruct IPv4 from two 16-bit hex groups
    const high = parseInt(hexMappedMatch[1], 16);
    const low  = parseInt(hexMappedMatch[2], 16);
    const a = (high >> 8) & 0xff;
    const b =  high       & 0xff;
    const c = (low  >> 8) & 0xff;
    const d =  low        & 0xff;
    const inner = validateWebhookUrl(`https://${a}.${b}.${c}.${d}/`);
    if (!inner.valid) {
      return { valid: false, reason: `IPv4-mapped IPv6 (hex) wraps a blocked address: ${inner.reason}` };
    }
  }

  return { valid: true };
}
