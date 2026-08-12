import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN_DIR = dirname(fileURLToPath(import.meta.url));

// The domain layer holds pure rules. It may reach DOWN to data and shared,
// never UP to the things that present or store it. React in particular must
// never appear here: a rule that imports React has become a component.
const FORBIDDEN = ['viewmodels/', 'ui/', 'state/', 'react'];

/** Recursively collects file paths under `dir`, so a future subdirectory
 *  (e.g. domain/pricing/*.js) is walked rather than silently skipped. */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(DOMAIN_DIR)
  .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))
  .map((f) => relative(DOMAIN_DIR, f));

// Matches `from '...'` / `from "..."` (normal imports) as well as bare
// `import '...'` / `import "..."` (side-effect imports, which have no
// `from` clause and would otherwise slip through unchecked).
const IMPORT_RE = /(?:from|import)\s+(['"])([^'"]+)\1/g;

describe('domain layer isolation', () => {
  it('has source files to check', () => {
    // Guards the whole suite: if the walk silently returns nothing, every
    // assertion below vacuously passes and the rule stops being enforced.
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it.each(sourceFiles)('%s imports nothing from an upper layer', (file) => {
    const source = readFileSync(join(DOMAIN_DIR, file), 'utf8');
    const specifiers = [...source.matchAll(IMPORT_RE)].map((m) => m[2]);
    const violations = specifiers.filter((s) =>
      FORBIDDEN.some((bad) => s === bad || s.includes(bad))
    );
    expect(violations).toEqual([]);
  });
});
