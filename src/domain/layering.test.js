import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN_DIR = dirname(fileURLToPath(import.meta.url));

// The domain layer holds pure rules. It may reach DOWN to data and shared,
// never UP to the things that present or store it. React in particular must
// never appear here: a rule that imports React has become a component.
const FORBIDDEN = ['viewmodels/', 'ui/', 'state/', 'react'];

const sourceFiles = readdirSync(DOMAIN_DIR).filter(
  (f) => f.endsWith('.js') && !f.endsWith('.test.js')
);

describe('domain layer isolation', () => {
  it('has source files to check', () => {
    // Guards the whole suite: if the glob silently returns nothing, every
    // assertion below vacuously passes and the rule stops being enforced.
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it.each(sourceFiles)('%s imports nothing from an upper layer', (file) => {
    const source = readFileSync(join(DOMAIN_DIR, file), 'utf8');
    const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    const violations = specifiers.filter((s) =>
      FORBIDDEN.some((bad) => s === bad || s.includes(bad))
    );
    expect(violations).toEqual([]);
  });
});
