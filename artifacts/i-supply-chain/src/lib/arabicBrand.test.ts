import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Owner rule: Arabic reads right-to-left, so an Arabic sentence must never embed the
// English company name or the "ISC" acronym. Use the Arabic brand name instead.
const SRC = [join(process.cwd(), 'src'), join(process.cwd(), 'artifacts/i-supply-chain/src')].find((d) => existsSync(d)) as string;
const AR = /[\u0600-\u06FF]/;
const BRAND = /I Supply Chain/;
const ISC = /(?<![\w\-/.@#:])ISC(?![\w\-/@:]|\.[a-z])(?!\s+[A-Za-z])/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe('Arabic strings do not embed the English brand', () => {
  it('has no Arabic string containing "I Supply Chain" or standalone "ISC"', () => {
    const violations: string[] = [];
    for (const file of walk(SRC)) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const t = line.trimStart();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        for (const seg of line.split(/(["'`])/)) {
          if (!AR.test(seg)) continue;
          const codeLike = /(className|=>|===)/.test(seg);
          if (BRAND.test(seg) || (!codeLike && ISC.test(seg))) {
            violations.push(`${file.slice(SRC.length)}:${i + 1}: ${seg.trim().slice(0, 80)}`);
          }
        }
      });
    }
    expect(violations).toEqual([]);
  });
});
