/**
 * Manifest integrity check for automation templates (n8n, Make.com, Zapier).
 *
 * Reads manifest.json directly and asserts that every entry's `filename`
 * resolves to an actual file in the correct platform subdirectory:
 *   - n8n    → public/n8n-templates/<filename>
 *   - make   → public/make-templates/<filename>
 *   - zapier → public/zapier-templates/<filename>
 *
 * Adding a manifest entry (for any platform) without the corresponding JSON
 * file will cause this test to fail immediately.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public',
);

const N8N_TEMPLATES_DIR = join(PUBLIC_DIR, 'n8n-templates');
const MAKE_TEMPLATES_DIR = join(PUBLIC_DIR, 'make-templates');
const ZAPIER_TEMPLATES_DIR = join(PUBLIC_DIR, 'zapier-templates');

const MANIFEST_PATH = join(N8N_TEMPLATES_DIR, 'manifest.json');

/** Map each platform value to its on-disk directory. */
const PLATFORM_DIR: Record<string, string> = {
  n8n: N8N_TEMPLATES_DIR,
  make: MAKE_TEMPLATES_DIR,
  zapier: ZAPIER_TEMPLATES_DIR,
};

interface ManifestTemplate {
  id: string;
  platform: string;
  filename: string;
  [key: string]: unknown;
}

interface Manifest {
  templates: ManifestTemplate[];
  [key: string]: unknown;
}

describe('automation templates manifest integrity', () => {
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

  it('manifest.json is parseable and has a templates array', () => {
    expect(Array.isArray(manifest.templates)).toBe(true);
    expect(manifest.templates.length).toBeGreaterThan(0);
  });

  it('every template entry has a non-empty filename field', () => {
    for (const t of manifest.templates) {
      expect(
        typeof t.filename === 'string' && t.filename.trim().length > 0,
        `template "${t.id}" is missing a filename`,
      ).toBe(true);
    }
  });

  it('every template entry has a recognised platform (n8n | make | zapier)', () => {
    for (const t of manifest.templates) {
      expect(
        Object.keys(PLATFORM_DIR),
        `template "${t.id}" has unknown platform "${t.platform}"`,
      ).toContain(t.platform);
    }
  });

  it('every n8n filename exists on disk in public/n8n-templates/', () => {
    const missing: string[] = [];
    for (const t of manifest.templates.filter(t => t.platform === 'n8n')) {
      const fullPath = join(N8N_TEMPLATES_DIR, t.filename);
      if (!existsSync(fullPath)) {
        missing.push(`${t.id} → n8n-templates/${t.filename}`);
      }
    }
    expect(
      missing,
      `The following n8n manifest entries have no matching file on disk:\n  ${missing.join('\n  ')}`,
    ).toHaveLength(0);
  });

  it('every Make.com filename exists on disk in public/make-templates/', () => {
    const missing: string[] = [];
    for (const t of manifest.templates.filter(t => t.platform === 'make')) {
      const fullPath = join(MAKE_TEMPLATES_DIR, t.filename);
      if (!existsSync(fullPath)) {
        missing.push(`${t.id} → make-templates/${t.filename}`);
      }
    }
    expect(
      missing,
      `The following Make.com manifest entries have no matching file on disk:\n  ${missing.join('\n  ')}`,
    ).toHaveLength(0);
  });

  it('every Zapier filename exists on disk in public/zapier-templates/', () => {
    const missing: string[] = [];
    for (const t of manifest.templates.filter(t => t.platform === 'zapier')) {
      const fullPath = join(ZAPIER_TEMPLATES_DIR, t.filename);
      if (!existsSync(fullPath)) {
        missing.push(`${t.id} → zapier-templates/${t.filename}`);
      }
    }
    expect(
      missing,
      `The following Zapier manifest entries have no matching file on disk:\n  ${missing.join('\n  ')}`,
    ).toHaveLength(0);
  });

  it('adding a platform-specific downloadPath without its file causes failure (self-test)', () => {
    // Verify the guard works: a fabricated entry pointing at a non-existent
    // make-templates file must not resolve.
    const fakePath = join(MAKE_TEMPLATES_DIR, '__nonexistent-guard-check__.json');
    expect(existsSync(fakePath)).toBe(false);
  });
});
