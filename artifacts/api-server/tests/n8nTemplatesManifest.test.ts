/**
 * Manifest integrity check for n8n-templates.
 *
 * Reads manifest.json directly and asserts that every entry's `filename`
 * resolves to an actual file in public/n8n-templates/.
 *
 * Adding a manifest entry without the corresponding JSON file will cause
 * this test to fail immediately — no need to click "Prepare & Download" first.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const TEMPLATES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public/n8n-templates',
);

const MANIFEST_PATH = join(TEMPLATES_DIR, 'manifest.json');

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

describe('n8n-templates manifest integrity', () => {
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

  it('every filename in the manifest exists on disk in public/n8n-templates/', () => {
    // Collect unique filenames so the failure message names every missing file.
    const missing: string[] = [];

    for (const t of manifest.templates) {
      const fullPath = join(TEMPLATES_DIR, t.filename);
      if (!existsSync(fullPath)) {
        missing.push(`${t.id} → ${t.filename}`);
      }
    }

    expect(
      missing,
      `The following manifest entries have no matching file on disk:\n  ${missing.join('\n  ')}`,
    ).toHaveLength(0);
  });
});
