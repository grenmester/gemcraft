# Explore: The Dive — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-button Explore with a push-your-luck dive where depth carries volume, quality and access, and where extracted rough has a crystal *form* that constrains what it can become.

**Architecture:** Two new rules modules (`dive.js` for run maths, `forms.js` for the form table) plus depth-awareness threaded through `rollRough.js`, `candidates.js`, `cut.js` and `market.js`. Run state is ephemeral component state; only a banked haul reaches the reducer. View modules delegate every formula to its owning rules module.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Zod-validated YAML, React Context + useReducer, Vitest + React Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-08-02-explore-dive-design.md`

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Use native Vitest matchers and raw DOM reads only (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **`getByText` matches an element by its direct child text nodes joined**, not full `textContent`. Two siblings rendering the same string collide. Prefer `getByRole('button', { name: ... })` with distinct `aria-label`s.
- **Rules modules own formulas; view modules delegate and never restate one.** `dive.js`, `forms.js`, `cut.js`, `market.js`, `progression.js` own rules. `diveView.js`, `localityView.js`, `marketView.js` must import and call, never re-derive. This project has had five separate violations of this rule caught in review.
- **Never write a test that passes when the behaviour is removed.** After writing a test, mentally stub the implementation to a no-op and confirm the test would fail.
- Levels run 0–10 inclusive, matching `successCurve.maxLevel` in `cutTechniques.yaml`.
- The four methods are exactly `panning`, `hardrock`, `geode`, `surface` (`METHOD_ENUM` in `src/schemas/localities.js`).
- No inline magic numbers: every tuned value is a named constant. Export it when another module or a test needs it; keep it module-private otherwise.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/schemas/localities.js` | *modify* — `maxDepth` on locality; `depthBias`, `minDepth` on find-pool entries |
| `src/data/localities.yaml` | *modify* — depth fields for all 10 localities |
| `src/schemas/cutTechniques.js` | *modify* — `style` field |
| `src/data/cutTechniques.yaml` | *modify* — `style` on all 5 techniques |
| `src/features/rockhound/logic/dive.js` | *create* — reach, haul size, break chance, XP, levels, break consequences |
| `src/features/rockhound/logic/forms.js` | *create* — form pools per method, form effects table, `rollForm` |
| `src/features/rockhound/logic/rollRough.js` | *modify* — depth-biased pool, `minDepth`, best-of-`d` quality, `form`, `foundDepth`, `rollHaul` |
| `src/features/rockhound/logic/candidates.js` | *modify* — narrow suspects by `foundDepth` |
| `src/features/rockhound/logic/cut.js` | *modify* — `formAllows`, `canApplyToSpecimen`, `formYield` in `applyCut` |
| `src/features/rockhound/logic/market.js` | *modify* — matrix specimens skip the uncut discount |
| `src/features/rockhound/logic/marketView.js` | *modify* — delegate to the new discount rule |
| `src/features/rockhound/logic/localityView.js` | *modify* — depth-aware `findPoolView` |
| `src/features/rockhound/RockhoundContext.jsx` | *modify* — `exploreMethodXp`, `COLLECT_HAUL` |
| `src/features/rockhound/logic/diveView.js` | *create* — presentation shapes for the run UI |
| `src/features/rockhound/components/Explore.jsx` | *rewrite* — the run UI |
| `src/features/rockhound/components/Rockhound.jsx` | *modify* — wire the new Explore props |

---

### Task 1: Depth fields in schema and data

**Files:**
- Modify: `src/schemas/localities.js`
- Modify: `src/data/localities.yaml`
- Test: `src/data/foundation.test.js` (existing guard-test file)

**Interfaces:**
- Consumes: nothing
- Produces: `locality.maxDepth: number`, `findPoolEntry.depthBias: number` (default `1`), `findPoolEntry.minDepth: number` (default `1`)

- [ ] **Step 1: Write the failing guard tests**

Append to `src/data/foundation.test.js`:

```js
describe('locality depth fields', () => {
  it('gives every locality a bedrock depth of at least 3', () => {
    for (const l of localities) {
      expect(l.maxDepth, `${l.id} maxDepth`).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every locality at least one deep-only find', () => {
    for (const l of localities) {
      const deepOnly = l.findPool.filter((e) => e.minDepth > 1);
      expect(deepOnly.length, `${l.id} deep-only entries`).toBeGreaterThan(0);
    }
  });

  it('never puts a find deeper than the locality goes', () => {
    for (const l of localities) {
      for (const e of l.findPool) {
        expect(e.minDepth, `${l.id}/${e.species} minDepth`).toBeLessThanOrEqual(l.maxDepth);
      }
    }
  });

  it('defaults depthBias to 1 and minDepth to 1 when unstated', () => {
    // hidden_creek's quartz entry states a bias; its garnet entry does not.
    const creek = localities.find((l) => l.id === 'hidden_creek');
    const garnet = creek.findPool.find((e) => e.species === 'almandine_garnet');
    expect(garnet.depthBias).toBe(1);
    expect(garnet.minDepth).toBe(1);
  });
});
```

If `foundation.test.js` does not already import `localities`, add `import { localities } from '../loaders/localities.js';` to the existing import block — do not add a second import from the same path, which is a duplicate-binding `SyntaxError`.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/data/foundation.test.js`
Expected: FAIL — `expected undefined to be greater than or equal to 3`

- [ ] **Step 3: Extend the schema**

In `src/schemas/localities.js`, replace the `findPoolEntrySchema` and add `maxDepth` to `localitySchema`:

```js
export const findPoolEntrySchema = z.object({
  species: z.string().min(1), // species id (cross-checked in tests)
  weight: z.number().positive(),
  // Weight is multiplied by depthBias^(depth-1): below 1 thins out with
  // depth, above 1 concentrates. minDepth excludes the entry above that
  // depth entirely — this is how a locality gets finds you must dive for.
  depthBias: z.number().positive().optional().default(1),
  minDepth: z.number().int().min(1).optional().default(1),
  caratRange: z
    .tuple([z.number().positive(), z.number().positive()])
    .refine(([lo, hi]) => lo <= hi, { message: 'caratRange min must be <= max' }),
  clarityRange: statRange,
  colorRange: statRange
});
```

In `localitySchema`, add after `hostRock`:

```js
  maxDepth: z.number().int().min(3).max(5), // the locality's bedrock
```

- [ ] **Step 4: Add the data**

In `src/data/localities.yaml`, add one `maxDepth` line per locality (place it directly after that locality's `method:` line) and add `depthBias`/`minDepth` to the find-pool entries listed below. Entries not listed keep the schema defaults — do not write `depthBias: 1`.

The design principle, recorded here so later edits stay consistent: **commons thin out with depth, and each locality's headline prize lives deep.**

```yaml
hidden_creek     maxDepth: 3
  quartz            depthBias: 0.6
  sapphire          depthBias: 1.5
  topaz             depthBias: 1.6   minDepth: 2

gravel_bar       maxDepth: 3
  quartz            depthBias: 0.6
  sapphire          depthBias: 1.5
  topaz             depthBias: 1.6   minDepth: 2

basalt_mesa      maxDepth: 3
  obsidian          depthBias: 0.6
  peridot           depthBias: 1.5   minDepth: 2

amethyst_vug     maxDepth: 4
  quartz            depthBias: 0.6
  agate             depthBias: 0.8
  amethyst          depthBias: 1.4
  citrine           depthBias: 1.3
  fluorite          depthBias: 1.5   minDepth: 3

pala_pegmatite   maxDepth: 4
  topaz             depthBias: 0.8
  aquamarine        depthBias: 1.2
  tourmaline        depthBias: 1.3
  moonstone         depthBias: 1.4   minDepth: 3

old_quarry       maxDepth: 4
  almandine_garnet  depthBias: 0.6
  sapphire          depthBias: 1.3
  spinel            depthBias: 1.5   minDepth: 3

mogok_marble     maxDepth: 4
  spinel            depthBias: 0.9
  tanzanite         depthBias: 1.4
  ruby              depthBias: 1.6   minDepth: 3

muzo_vein        maxDepth: 4
  aquamarine        depthBias: 0.7
  tourmaline        depthBias: 0.7
  tsavorite         depthBias: 1.4
  emerald           depthBias: 1.6   minDepth: 3

opal_flats       maxDepth: 3
  agate             depthBias: 0.6
  obsidian          depthBias: 0.6
  opal              depthBias: 1.6   minDepth: 3

kimberlite_pipe  maxDepth: 5
  almandine_garnet  depthBias: 0.5
  alexandrite       depthBias: 1.4
  diamond           depthBias: 1.6   minDepth: 4
```

Each find-pool entry is a single-line flow mapping. Example for the first Hidden Creek entry, preserving the existing column alignment:

```yaml
      - { species: quartz,           weight: 50, depthBias: 0.6, caratRange: [0.5, 4.0], clarityRange: [40, 90], colorRange: [30, 70] }
      - { species: topaz,            weight: 5,  depthBias: 1.6, minDepth: 2, caratRange: [0.5, 3.0], clarityRange: [55, 98], colorRange: [30, 80] }
```

- [ ] **Step 5: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — all pre-existing tests plus the four new guards.

- [ ] **Step 6: Commit**

```bash
git add src/schemas/localities.js src/data/localities.yaml src/data/foundation.test.js
git commit -m "feat(data): depth fields on localities and find pools"
```

---

### Task 2: `dive.js` — the run maths

**Files:**
- Create: `src/features/rockhound/logic/dive.js`
- Test: `src/features/rockhound/logic/dive.test.js`

**Interfaces:**
- Consumes: `locality.maxDepth` (Task 1)
- Produces:
  - `reachDepth(level) -> number`
  - `effectiveReach(level, maxDepth, setComplete) -> number`
  - `haulSize(depth, level) -> number`
  - `breakChance(targetDepth, level, damping = 0) -> number`
  - `severityAt(targetDepth) -> 'none' | 'cozy' | 'real'`
  - `degradeSpecimen(specimen) -> specimen`
  - `breakConsequence(haul, targetDepth) -> { kept, lost }`
  - `xpForStage(depth) -> number`
  - `xpForRun(depths, broke) -> number`
  - `xpThreshold(level) -> number`
  - `levelForXp(xp) -> number`
  - constants `MAX_METHOD_LEVEL`, `REAL_LOSS_DEPTH`, `MAX_BREAK_CHANCE`

- [ ] **Step 1: Write the failing tests**

Create `src/features/rockhound/logic/dive.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  reachDepth, effectiveReach, haulSize, breakChance, severityAt,
  degradeSpecimen, breakConsequence, xpForStage, xpForRun,
  xpThreshold, levelForXp, MAX_METHOD_LEVEL, MAX_BREAK_CHANCE
} from './dive.js';

const stone = (foundDepth, over = {}) => ({
  instanceId: `s${foundDepth}${over.tag ?? ''}`, foundDepth,
  clarity: 60, caratWeight: 2.0, ...over
});

describe('reach', () => {
  it('starts every player at depth 1 and adds a depth every two levels', () => {
    expect(reachDepth(0)).toBe(1);
    expect(reachDepth(1)).toBe(1);
    expect(reachDepth(2)).toBe(2);
    expect(reachDepth(4)).toBe(3);
    expect(reachDepth(10)).toBe(6);
  });

  it('never lets a player dig past the locality bedrock', () => {
    expect(effectiveReach(10, 3, false)).toBe(3);
  });

  it('grants one extra depth once the locality set is complete', () => {
    expect(effectiveReach(2, 4, true)).toBe(3);
    expect(effectiveReach(2, 4, false)).toBe(2);
  });

  it('does not let the set bonus breach bedrock either', () => {
    expect(effectiveReach(10, 3, true)).toBe(3);
  });
});

describe('haul size', () => {
  it('yields exactly one stone at depth 1 for a new player', () => {
    // This is the pre-Dive behaviour, preserved byte for byte.
    expect(haulSize(1, 0)).toBe(1);
  });

  it('grows with depth and with level', () => {
    expect(haulSize(3, 0)).toBe(3);
    expect(haulSize(1, 6)).toBe(3);
    expect(haulSize(3, 6)).toBe(5);
  });
});

describe('break chance', () => {
  it('is always zero at depth 1, so a new player can never lose anything', () => {
    expect(breakChance(1, 0)).toBe(0);
    expect(breakChance(1, 10)).toBe(0);
  });

  it('rises with target depth', () => {
    expect(breakChance(2, 0)).toBeCloseTo(0.15, 10);
    expect(breakChance(3, 0)).toBeCloseTo(0.30, 10);
  });

  it('is reduced by level and by damping', () => {
    expect(breakChance(3, 10)).toBeCloseTo(0.20, 10);
    expect(breakChance(3, 0, 0.05)).toBeCloseTo(0.25, 10);
  });

  it('never falls below zero or exceeds the cap', () => {
    expect(breakChance(2, 10, 0.9)).toBe(0);
    expect(breakChance(9, 0)).toBe(MAX_BREAK_CHANCE);
  });
});

describe('severity', () => {
  it('escalates from harmless to cozy to real', () => {
    expect(severityAt(1)).toBe('none');
    expect(severityAt(2)).toBe('cozy');
    expect(severityAt(3)).toBe('real');
    expect(severityAt(5)).toBe('real');
  });
});

describe('break consequences', () => {
  it('at cozy depth degrades everything and loses nothing', () => {
    const haul = [stone(1), stone(2)];
    const { kept, lost } = breakConsequence(haul, 2);
    expect(lost).toEqual([]);
    expect(kept).toHaveLength(2);
    expect(kept[0].clarity).toBeLessThan(60);
    expect(kept[0].caratWeight).toBeLessThan(2.0);
  });

  it('at real depth loses the deepest stage and degrades the rest', () => {
    const haul = [stone(1), stone(2, { tag: 'a' }), stone(2, { tag: 'b' })];
    const { kept, lost } = breakConsequence(haul, 3);
    expect(lost.map((s) => s.foundDepth)).toEqual([2, 2]);
    expect(kept.map((s) => s.foundDepth)).toEqual([1]);
    expect(kept[0].clarity).toBeLessThan(60);
  });

  it('handles an empty haul without producing a nonsense depth', () => {
    expect(breakConsequence([], 3)).toEqual({ kept: [], lost: [] });
  });

  it('never degrades clarity below 1', () => {
    expect(degradeSpecimen({ clarity: 3, caratWeight: 0.1 }).clarity).toBeGreaterThanOrEqual(1);
  });
});

describe('experience', () => {
  it('pays more for deeper stages', () => {
    expect(xpForStage(1)).toBe(10);
    expect(xpForStage(3)).toBe(30);
  });

  it('sums the stages of a completed run', () => {
    expect(xpForRun([1, 2, 3], false)).toBe(60);
  });

  it('still teaches you something when the shaft breaks', () => {
    expect(xpForRun([1, 2, 3], true)).toBe(30);
  });

  it('maps experience onto levels and stops at the cap', () => {
    expect(levelForXp(0)).toBe(0);
    expect(levelForXp(39)).toBe(0);
    expect(levelForXp(40)).toBe(1);
    expect(levelForXp(120)).toBe(2);
    expect(levelForXp(999999)).toBe(MAX_METHOD_LEVEL);
  });

  it('has a threshold for every level that levelForXp agrees with', () => {
    for (let l = 1; l <= MAX_METHOD_LEVEL; l++) {
      expect(levelForXp(xpThreshold(l)), `level ${l}`).toBe(l);
      expect(levelForXp(xpThreshold(l) - 1), `just below level ${l}`).toBe(l - 1);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/dive.test.js`
Expected: FAIL — `Failed to resolve import "./dive.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/dive.js`:

```js
// The Dive (§1-§5 of the Explore spec). Depth is the single axis carrying
// volume, quality and access; this module owns every number that depends on
// it. View modules must delegate here rather than restate a formula.

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const round2 = (n) => Math.round(n * 100) / 100;

export const MAX_METHOD_LEVEL = 10;
export const LEVELS_PER_DEPTH = 2;
export const LEVELS_PER_EXTRA_STONE = 3;
export const BREAK_PER_DEPTH = 0.15;
export const BREAK_PER_LEVEL = 0.01;
export const MAX_BREAK_CHANCE = 0.6;
/** The depth at and below which a break costs stones, not just quality. */
export const REAL_LOSS_DEPTH = 3;
export const XP_PER_DEPTH = 10;
export const BREAK_XP_FRACTION = 0.5;
export const DEGRADE_CLARITY = 12;
export const DEGRADE_CARAT = 0.85;

export function reachDepth(level) {
  return 1 + Math.floor(level / LEVELS_PER_DEPTH);
}

/**
 * How deep this player can actually go here: their own reach, plus one for
 * knowing the ground, but never past the locality's bedrock.
 */
export function effectiveReach(level, maxDepth, setComplete) {
  return Math.min(reachDepth(level) + (setComplete ? 1 : 0), maxDepth);
}

export function haulSize(depth, level) {
  return 1 + (depth - 1) + Math.floor(level / LEVELS_PER_EXTRA_STONE);
}

/** `targetDepth` is the depth being descended TO — the risky one. */
export function breakChance(targetDepth, level, damping = 0) {
  const raw = (targetDepth - 1) * BREAK_PER_DEPTH - level * BREAK_PER_LEVEL - damping;
  return clamp(raw, 0, MAX_BREAK_CHANCE);
}

export function severityAt(targetDepth) {
  if (targetDepth <= 1) return 'none';
  return targetDepth >= REAL_LOSS_DEPTH ? 'real' : 'cozy';
}

export function degradeSpecimen(specimen) {
  return {
    ...specimen,
    clarity: Math.max(1, specimen.clarity - DEGRADE_CLARITY),
    caratWeight: round2(specimen.caratWeight * DEGRADE_CARAT)
  };
}

export function breakConsequence(haul, targetDepth) {
  if (haul.length === 0) return { kept: [], lost: [] };
  if (severityAt(targetDepth) !== 'real') {
    return { kept: haul.map(degradeSpecimen), lost: [] };
  }
  const deepest = Math.max(...haul.map((s) => s.foundDepth));
  return {
    kept: haul.filter((s) => s.foundDepth !== deepest).map(degradeSpecimen),
    lost: haul.filter((s) => s.foundDepth === deepest)
  };
}

export function xpForStage(depth) {
  return XP_PER_DEPTH * depth;
}

export function xpForRun(depths, broke) {
  const total = depths.reduce((sum, d) => sum + xpForStage(d), 0);
  return broke ? Math.round(total * BREAK_XP_FRACTION) : total;
}

/** Quadratic curve: L1 40, L2 120, L5 600, L10 2200. */
export function xpThreshold(level) {
  return 20 * level * level + 20 * level;
}

export function levelForXp(xp) {
  let level = 0;
  while (level < MAX_METHOD_LEVEL && xp >= xpThreshold(level + 1)) level++;
  return level;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/dive.test.js`
Expected: PASS — 20 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/dive.js src/features/rockhound/logic/dive.test.js
git commit -m "feat(explore): dive maths for reach, haul, risk and experience"
```

---

### Task 3: `forms.js` — crystal habit

**Files:**
- Create: `src/features/rockhound/logic/forms.js`
- Test: `src/features/rockhound/logic/forms.test.js`

**Interfaces:**
- Consumes: `METHOD_ENUM` from `src/schemas/localities.js`
- Produces:
  - `FORM_POOLS: Record<method, Array<{ form, weight, depthBias }>>`
  - `FORM_EFFECTS: Record<form, { styles: string[], facetedYield: number }>`
  - `FORM_LABELS: Record<form, string>`
  - `rollForm(method, depth, rng) -> string`

- [ ] **Step 1: Write the failing tests**

Create `src/features/rockhound/logic/forms.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { FORM_POOLS, FORM_EFFECTS, FORM_LABELS, rollForm } from './forms.js';
import { METHOD_ENUM } from '../../../schemas/localities.js';

describe('form pools', () => {
  it('covers every collection method', () => {
    expect(Object.keys(FORM_POOLS).sort()).toEqual([...METHOD_ENUM].sort());
  });

  it('only names forms that have declared effects and a label', () => {
    for (const [method, pool] of Object.entries(FORM_POOLS)) {
      for (const entry of pool) {
        expect(FORM_EFFECTS[entry.form], `${method}/${entry.form} effects`).toBeDefined();
        expect(FORM_LABELS[entry.form], `${method}/${entry.form} label`).toBeDefined();
      }
    }
  });

  it('keeps matrix specimens exclusive to hard rock', () => {
    // Matrix is the deep prize: a crystal still on its host rock. It only
    // survives where nobody has tumbled it down a river.
    for (const [method, pool] of Object.entries(FORM_POOLS)) {
      const hasMatrix = pool.some((e) => e.form === 'matrix');
      expect(hasMatrix, `${method}`).toBe(method === 'hardrock');
    }
  });

  it('gives every pool positive weights', () => {
    for (const pool of Object.values(FORM_POOLS)) {
      for (const e of pool) expect(e.weight).toBeGreaterThan(0);
    }
  });
});

describe('form effects', () => {
  it('lets matrix specimens take no cut at all', () => {
    expect(FORM_EFFECTS.matrix.styles).toEqual([]);
  });

  it('restricts nodules and druzy to cabochon', () => {
    expect(FORM_EFFECTS.nodule.styles).toEqual(['cabochon']);
    expect(FORM_EFFECTS.druzy.styles).toEqual(['cabochon']);
  });

  it('rewards terminated crystals and penalises waterworn pebbles when faceting', () => {
    expect(FORM_EFFECTS.crystal.facetedYield).toBeGreaterThan(1);
    expect(FORM_EFFECTS.waterworn.facetedYield).toBeLessThan(1);
    expect(FORM_EFFECTS.fragment.facetedYield).toBe(1);
  });
});

describe('rollForm', () => {
  it('only ever returns a form the method can produce', () => {
    for (const method of METHOD_ENUM) {
      const allowed = FORM_POOLS[method].map((e) => e.form);
      for (let i = 0; i < 200; i++) {
        const form = rollForm(method, 1 + (i % 4), () => i / 200);
        expect(allowed, `${method} produced ${form}`).toContain(form);
      }
    }
  });

  it('picks the entry the roll lands in', () => {
    // panning is waterworn 70 / crystal 10 / fragment 20 (total 100).
    // A roll of 0.0 lands in the first entry, 0.99 in the last.
    expect(rollForm('panning', 1, () => 0)).toBe(FORM_POOLS.panning[0].form);
    expect(rollForm('panning', 1, () => 0.999)).toBe(
      FORM_POOLS.panning[FORM_POOLS.panning.length - 1].form
    );
  });

  it('makes crystals commoner with depth and waterworn rarer', () => {
    // Same roll position, different depths: the shift must come from bias,
    // not from the random number.
    const crystalAt = (depth) => {
      let hits = 0;
      for (let i = 0; i < 1000; i++) {
        if (rollForm('hardrock', depth, () => i / 1000) === 'crystal') hits++;
      }
      return hits;
    };
    expect(crystalAt(4)).toBeGreaterThan(crystalAt(1));
  });

  it('falls back to a real form for an unknown method rather than undefined', () => {
    expect(typeof rollForm('spelunking', 1, () => 0.5)).toBe('string');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/forms.test.js`
Expected: FAIL — `Failed to resolve import "./forms.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/forms.js`:

```js
// Crystal habit (§3 of the Explore spec). Two stones of the same species from
// the same method are not interchangeable: what shape they came out of the
// ground in decides what they can become. This is the Explore -> Cut link.
//
// Method decides the shape distribution; depth shifts it, because undisturbed
// pockets lie deep and river-tumbled pebbles do not.

export const FORM_LABELS = {
  waterworn: 'Waterworn pebble',
  crystal: 'Terminated crystal',
  fragment: 'Broken fragment',
  nodule: 'Massive nodule',
  druzy: 'Druzy cavity',
  matrix: 'Crystal on matrix'
};

export const FORM_POOLS = {
  panning: [
    { form: 'waterworn', weight: 70, depthBias: 0.7 },
    { form: 'fragment', weight: 20, depthBias: 0.9 },
    { form: 'crystal', weight: 10, depthBias: 1.6 }
  ],
  surface: [
    { form: 'fragment', weight: 45, depthBias: 0.9 },
    { form: 'nodule', weight: 30, depthBias: 1.0 },
    { form: 'waterworn', weight: 15, depthBias: 0.7 },
    { form: 'crystal', weight: 10, depthBias: 1.6 }
  ],
  geode: [
    { form: 'nodule', weight: 40, depthBias: 1.0 },
    { form: 'druzy', weight: 35, depthBias: 1.1 },
    { form: 'crystal', weight: 25, depthBias: 1.6 }
  ],
  hardrock: [
    { form: 'fragment', weight: 45, depthBias: 0.9 },
    { form: 'crystal', weight: 40, depthBias: 1.5 },
    { form: 'matrix', weight: 10, depthBias: 1.8 },
    { form: 'druzy', weight: 5, depthBias: 1.0 }
  ]
};

/**
 * `styles` are the cut styles this shape admits (see `style` in
 * cutTechniques.yaml). `facetedYield` scales carat retention on faceted cuts
 * only — a cabochon does not care how the rough arrived.
 */
export const FORM_EFFECTS = {
  waterworn: { styles: ['faceted', 'cabochon'], facetedYield: 0.9 },
  crystal: { styles: ['faceted', 'cabochon'], facetedYield: 1.1 },
  fragment: { styles: ['faceted', 'cabochon'], facetedYield: 1.0 },
  nodule: { styles: ['cabochon'], facetedYield: 1.0 },
  druzy: { styles: ['cabochon'], facetedYield: 1.0 },
  matrix: { styles: [], facetedYield: 1.0 }
};

const FALLBACK_METHOD = 'panning';

export function rollForm(method, depth, rng = Math.random) {
  const pool = FORM_POOLS[method] ?? FORM_POOLS[FALLBACK_METHOD];
  const weighted = pool.map((e) => ({
    form: e.form,
    weight: e.weight * Math.pow(e.depthBias, depth - 1)
  }));
  const total = weighted.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const e of weighted) {
    roll -= e.weight;
    if (roll < 0) return e.form;
  }
  return weighted[weighted.length - 1].form;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/forms.test.js`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/forms.js src/features/rockhound/logic/forms.test.js
git commit -m "feat(explore): crystal habit table and depth-biased form rolls"
```

---

### Task 4: Depth-aware extraction

**Files:**
- Modify: `src/features/rockhound/logic/rollRough.js`
- Modify: `src/features/rockhound/logic/rollRough.test.js`
- Modify: `src/features/rockhound/logic/candidates.js`
- Modify: `src/features/rockhound/logic/localityView.js`
- Test: `src/features/rockhound/logic/candidates.test.js` (create)

**Interfaces:**
- Consumes: `haulSize` from `dive.js` (Task 2); `rollForm` from `forms.js` (Task 3); `depthBias`/`minDepth` from Task 1
- Produces:
  - `effectivePool(findPool, depth) -> Array<{...entry, effectiveWeight}>`
  - `bestOf(depth, rng) -> number` — the best of `depth` draws
  - `rollRough(locality, depth, rng, idFactory) -> specimen` — **breaking signature change**
  - `rollHaul(locality, depth, level, rng, idFactory) -> specimen[]`
  - specimen gains `form: string` and `foundDepth: number`
  - `seedCandidates(locality, foundDepth) -> string[]`
  - `findPoolView(locality, speciesById, gemdex, depth)` — `depth` optional, defaults to the whole pool

**Ambiguity resolved:** `effectivePool` lives in `rollRough.js` and `localityView.findPoolView` imports it. Display and reality then share one weighting function and cannot drift — the field guide can never advertise odds the roller does not use.

- [ ] **Step 1: Write the failing tests for extraction**

Add to `src/features/rockhound/logic/rollRough.test.js`. Extend the existing import from `./rollRough.js` rather than adding a second import statement from that path:

```js
describe('depth-aware extraction', () => {
  const creek = localities.find((l) => l.id === 'hidden_creek');

  it('hides deep-only finds from shallow digging', () => {
    // Hidden Creek's topaz is minDepth 2.
    const shallow = effectivePool(creek.findPool, 1).map((e) => e.species);
    expect(shallow).not.toContain('topaz');
    expect(effectivePool(creek.findPool, 2).map((e) => e.species)).toContain('topaz');
  });

  it('thins commons and concentrates prizes as depth grows', () => {
    const shareOf = (species, depth) => {
      const pool = effectivePool(creek.findPool, depth);
      const total = pool.reduce((s, e) => s + e.effectiveWeight, 0);
      return pool.find((e) => e.species === species).effectiveWeight / total;
    };
    expect(shareOf('quartz', 3)).toBeLessThan(shareOf('quartz', 1));
    expect(shareOf('sapphire', 3)).toBeGreaterThan(shareOf('sapphire', 1));
  });

  it('records the depth a stone came from', () => {
    const s = rollRough(creek, 2, () => 0.5);
    expect(s.foundDepth).toBe(2);
  });

  it('gives every stone a crystal form', () => {
    const s = rollRough(creek, 1, () => 0.5);
    expect(typeof s.form).toBe('string');
    expect(s.form.length).toBeGreaterThan(0);
  });

  it('takes the best of `depth` draws, so deeper ground gives better material', () => {
    // Tested directly rather than through rollRough: a whole roll consumes a
    // depth-dependent number of random values, so comparing two rollRough
    // calls on one scripted stream compares different points in the stream
    // and proves nothing.
    const from = (xs) => { let i = 0; return () => xs[i++]; };
    expect(bestOf(1, from([0.2, 0.9, 0.9]))).toBeCloseTo(0.2, 10);
    expect(bestOf(3, from([0.2, 0.9, 0.4]))).toBeCloseTo(0.9, 10);
  });

  it('consumes exactly one draw per level of depth for each stat', () => {
    // Guards the property the test above relies on: if bestOf stopped
    // scaling with depth, this count would not change.
    const count = (depth) => { let n = 0; bestOf(depth, () => { n++; return 0.5; }); return n; };
    expect(count(1)).toBe(1);
    expect(count(4)).toBe(4);
  });

  it('returns a full haul sized by depth and level', () => {
    expect(rollHaul(creek, 1, 0, () => 0.5)).toHaveLength(haulSize(1, 0));
    expect(rollHaul(creek, 3, 6, () => 0.5)).toHaveLength(haulSize(3, 6));
  });

  it('stamps every stone in a haul with the same depth', () => {
    const haul = rollHaul(creek, 2, 3, () => 0.5);
    expect(haul.every((s) => s.foundDepth === 2)).toBe(true);
  });

  it('gives each stone in a haul its own id', () => {
    const haul = rollHaul(creek, 3, 6, Math.random);
    expect(new Set(haul.map((s) => s.instanceId)).size).toBe(haul.length);
  });
});
```

Add `effectivePool, rollHaul, bestOf` to the existing `./rollRough.js` import, `import { haulSize } from './dive.js';`, and `import { localities } from '../../../loaders/localities.js';` if not already present.

**Every existing call of the form `rollRough(locality, rng)` in this file must become `rollRough(locality, 1, rng)`.** The signature change is deliberate and positional so that a missed call site fails loudly rather than silently ignoring its RNG.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: FAIL — `effectivePool is not a function`

- [ ] **Step 3: Implement extraction**

Replace the body of `src/features/rockhound/logic/rollRough.js` below `createRough` with:

```js
import { haulSize } from './dive.js';
import { rollForm } from './forms.js';

/**
 * The find pool as it actually is at this depth: entries that need deeper
 * digging are absent, and every weight is scaled by its bias. The field
 * guide renders from this same function, so shown odds and rolled odds
 * cannot drift apart.
 */
export function effectivePool(findPool, depth) {
  return findPool
    .filter((e) => (e.minDepth ?? 1) <= depth)
    .map((e) => ({ ...e, effectiveWeight: e.weight * Math.pow(e.depthBias ?? 1, depth - 1) }));
}

/** Best of `depth` draws — deeper ground gives up better material. */
export function bestOf(depth, rng) {
  let best = rng();
  for (let i = 1; i < depth; i++) best = Math.max(best, rng());
  return best;
}

export function rollRough(locality, depth, rng = Math.random, idFactory = defaultId) {
  const pool = effectivePool(locality.findPool, depth);
  const total = pool.reduce((sum, e) => sum + e.effectiveWeight, 0);
  let roll = rng() * total;
  let entry = pool[pool.length - 1];
  for (const e of pool) {
    roll -= e.effectiveWeight;
    if (roll < 0) { entry = e; break; }
  }
  return createRough({
    trueSpeciesId: entry.species,
    caratWeight: round2(lerp(entry.caratRange, bestOf(depth, rng))),
    clarity: Math.round(lerp(entry.clarityRange, bestOf(depth, rng))),
    colorGrade: Math.round(lerp(entry.colorRange, bestOf(depth, rng))),
    origin: locality.id,
    foundDepth: depth,
    form: rollForm(locality.method, depth, rng)
  }, idFactory);
}

export function rollHaul(locality, depth, level, rng = Math.random, idFactory = defaultId) {
  return Array.from({ length: haulSize(depth, level) }, () =>
    rollRough(locality, depth, rng, idFactory)
  );
}
```

And extend `createRough` to carry the two new fields:

```js
export function createRough({ trueSpeciesId, caratWeight, clarity, colorGrade, origin, foundDepth = 1, form = 'fragment' }, idFactory = defaultId) {
  return {
    instanceId: idFactory(),
    stage: 'rough',
    trueSpeciesId,
    identifiedAs: null,
    caratWeight,
    clarity,
    colorGrade,
    origin,
    foundDepth,
    form
  };
}
```

- [ ] **Step 4: Run to verify extraction passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: PASS

- [ ] **Step 5: Write the failing test for candidate narrowing**

Create `src/features/rockhound/logic/candidates.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { seedCandidates } from './candidates.js';
import { localities } from '../../../loaders/localities.js';

const creek = localities.find((l) => l.id === 'hidden_creek');

describe('seedCandidates', () => {
  it('never lists a suspect the stone could not possibly be', () => {
    // Topaz is minDepth 2 at Hidden Creek. A stone dug at depth 1 cannot be
    // topaz, so offering it as a suspect would be the game lying.
    expect(seedCandidates(creek, 1)).not.toContain('topaz');
  });

  it('lists the deep suspects once the stone came from deep enough', () => {
    expect(seedCandidates(creek, 2)).toContain('topaz');
  });

  it('falls back to the whole pool when the depth is unknown', () => {
    // Saves written before the Dive have no foundDepth. Filtering those to
    // nothing would make old rough unidentifiable.
    const everything = [...new Set(creek.findPool.map((e) => e.species))];
    expect(seedCandidates(creek, undefined).sort()).toEqual(everything.sort());
    expect(seedCandidates(creek).sort()).toEqual(everything.sort());
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/candidates.test.js`
Expected: FAIL — `expected [...] not to contain 'topaz'`

- [ ] **Step 7: Implement candidate narrowing**

Replace `src/features/rockhound/logic/candidates.js` entirely:

```js
/**
 * The suspect list for a specimen. Narrowed by the depth it was dug from:
 * a find pool entry that requires deeper digging cannot explain a shallow
 * stone, and offering it as a candidate would be the game presenting an
 * option it knows to be impossible.
 *
 * `foundDepth` is nullable — saves written before the Dive carry no depth,
 * and those specimens must stay identifiable against the whole pool.
 */
export function seedCandidates(locality, foundDepth = null) {
  const reachable = foundDepth == null
    ? locality.findPool
    : locality.findPool.filter((e) => (e.minDepth ?? 1) <= foundDepth);
  return [...new Set(reachable.map((e) => e.species))];
}
```

Then update the single call site in `src/features/rockhound/components/Identify.jsx` (line 9) to pass the depth:

```js
  const [candidates, setCandidates] = useState(() => seedCandidates(locality, specimen.foundDepth));
```

- [ ] **Step 8: Make the field guide depth-aware**

In `src/features/rockhound/logic/localityView.js`, add `import { effectivePool } from './rollRough.js';` and change `findPoolView` to weight by depth. Replace its first three lines:

```js
export function findPoolView(locality, speciesById, gemdex, depth = null) {
  const found = new Set(gemdex);
  // At a stated depth the guide shows the odds that actually apply there;
  // with no depth it shows the whole pool at surface weights.
  const pool = depth == null
    ? locality.findPool.map((e) => ({ ...e, effectiveWeight: e.weight }))
    : effectivePool(locality.findPool, depth);
  const total = pool.reduce((sum, e) => sum + e.effectiveWeight, 0);
  return [...pool]
    .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
```

and inside the `.map`, change the chance line to:

```js
        chance: chanceFor(e.effectiveWeight, total)
```

- [ ] **Step 9: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — existing `localityView.test.js` still passes because `depth` defaults to `null`, which reproduces the previous weighting exactly.

- [ ] **Step 10: Commit**

```bash
git add src/features/rockhound/logic/rollRough.js src/features/rockhound/logic/rollRough.test.js src/features/rockhound/logic/candidates.js src/features/rockhound/logic/candidates.test.js src/features/rockhound/logic/localityView.js src/features/rockhound/components/Identify.jsx
git commit -m "feat(explore): depth-biased pools, best-of-depth quality, forms on rough"
```

---

### Task 5: Form consequences in Cut and Market

**Files:**
- Modify: `src/schemas/cutTechniques.js`
- Modify: `src/data/cutTechniques.yaml`
- Modify: `src/features/rockhound/logic/cut.js`
- Modify: `src/features/rockhound/logic/cut.test.js`
- Modify: `src/features/rockhound/logic/market.js`
- Modify: `src/features/rockhound/logic/market.test.js`
- Modify: `src/features/rockhound/logic/marketView.js`
- Modify: `src/features/rockhound/RockhoundContext.jsx`

**Interfaces:**
- Consumes: `FORM_EFFECTS` from `forms.js` (Task 3); `specimen.form` from `rollRough.js` (Task 4)
- Produces:
  - `technique.style: 'faceted' | 'cabochon'`
  - `formAllows(form, technique) -> boolean`
  - `canApplyToSpecimen(specimen, species, technique) -> boolean`
  - `formYield(form, technique) -> number`
  - `uncutDiscountFor(specimen) -> number`

**Ambiguity resolved:** `forms.js` owns the `FORM_EFFECTS` *table*; `cut.js` owns *applying* it to a technique. `canApply` keeps its existing species-only meaning and `canApplyToSpecimen` delegates to it — the two must not restate each other, and existing `canApply` callers must not change behaviour.

- [ ] **Step 1: Add `style` to the schema and data**

In `src/schemas/cutTechniques.js`, add to `cutTechniqueSchema` after `difficulty`:

```js
  // The physical family of the cut. A shaped, polished dome is a different
  // operation from grinding facets, and rough of some habits admits only one.
  style: z.enum(['faceted', 'cabochon']),
```

In `src/data/cutTechniques.yaml`, add one `style:` line directly beneath each technique's `difficulty:` line:

```
cabochon         style: cabochon
round_brilliant  style: faceted
step             style: faceted
princess         style: faceted
fancy            style: faceted
```

- [ ] **Step 2: Write the failing tests for form rules**

Add to `src/features/rockhound/logic/cut.test.js`. Extend the existing `./cut.js` import — `specimenScore` and others are already imported there, and a second import statement from the same path is a duplicate-binding `SyntaxError`. Add `formAllows, canApplyToSpecimen, formYield` to that existing line.

```js
describe('crystal habit constrains the cut', () => {
  const cab = cutTechniques.find((t) => t.id === 'cabochon');
  const brilliant = cutTechniques.find((t) => t.id === 'round_brilliant');
  const rough = (form) => ({ instanceId: 'x', trueSpeciesId: 'quartz', caratWeight: 2, clarity: 70, colorGrade: 70, form });

  it('admits no cut at all for a crystal still on its matrix', () => {
    expect(formAllows('matrix', cab)).toBe(false);
    expect(formAllows('matrix', brilliant)).toBe(false);
  });

  it('lets a druzy cavity take a cabochon but never facets', () => {
    expect(formAllows('druzy', cab)).toBe(true);
    expect(formAllows('druzy', brilliant)).toBe(false);
  });

  it('lets a broken fragment take either', () => {
    expect(formAllows('fragment', cab)).toBe(true);
    expect(formAllows('fragment', brilliant)).toBe(true);
  });

  it('imposes no constraint on rough that predates forms', () => {
    // Saves written before the Dive carry no form; those stones must stay
    // cuttable exactly as they were.
    expect(formAllows(undefined, brilliant)).toBe(true);
  });

  it('combines the species rule and the form rule without replacing either', () => {
    const quartz = speciesById.quartz;
    // Same species, same technique, different habit -> different answer.
    expect(canApplyToSpecimen(rough('fragment'), quartz, cab)).toBe(canApply(quartz, cab));
    expect(canApplyToSpecimen(rough('matrix'), quartz, cab)).toBe(false);
  });

  it('scales faceted carat retention by habit but leaves cabochons alone', () => {
    expect(formYield('crystal', brilliant)).toBeGreaterThan(1);
    expect(formYield('waterworn', brilliant)).toBeLessThan(1);
    expect(formYield('crystal', cab)).toBe(1);
    expect(formYield('waterworn', cab)).toBe(1);
  });

  it('carries the habit through into the carat a cut actually keeps', () => {
    const species = speciesById.quartz;
    const asCrystal = applyCut(rough('crystal'), species, brilliant, 10, () => 0.01);
    const asPebble = applyCut(rough('waterworn'), species, brilliant, 10, () => 0.01);
    expect(asCrystal.outcome).toBe('success');
    expect(asPebble.outcome).toBe('success');
    expect(asCrystal.specimen.caratRetained).toBeGreaterThan(asPebble.specimen.caratRetained);
  });
});
```

Ensure `cutTechniques` and `speciesById` are imported in this file; if either is missing, add it to the existing import block.

- [ ] **Step 3: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/cut.test.js`
Expected: FAIL — `formAllows is not a function`

- [ ] **Step 4: Implement the form rules in `cut.js`**

Add `import { FORM_EFFECTS } from './forms.js';` at the top, and these functions immediately after the existing `canApply`:

```js
/**
 * Whether this rough's crystal habit admits this style of cut. An absent or
 * unrecognised form imposes no constraint — rough saved before habits
 * existed must stay exactly as cuttable as it was.
 */
export function formAllows(form, technique) {
  const effect = FORM_EFFECTS[form];
  if (!effect) return true;
  return effect.styles.includes(technique.style);
}

/** The species rule and the habit rule together. Neither restates the other. */
export function canApplyToSpecimen(specimen, species, technique) {
  return canApply(species, technique) && formAllows(specimen.form, technique);
}

/** Habit scales carat retention on faceted cuts only. */
export function formYield(form, technique) {
  if (technique.style !== 'faceted') return 1;
  return FORM_EFFECTS[form]?.facetedYield ?? 1;
}
```

In `applyCut`, apply the modifier in **both** the success and the fail branch. Success branch:

```js
    const caratRetained = round2(
      specimen.caratWeight * lerp(technique.yieldRange, qualityRoll) * formYield(specimen.form, technique)
    );
```

Fail branch:

```js
  const caratRetained = round2(
    specimen.caratWeight * lerp([0.3, technique.yieldRange[0]], qualityRoll) * formYield(specimen.form, technique)
  );
```

- [ ] **Step 5: Gate the reducer on the habit too**

In `src/features/rockhound/RockhoundContext.jsx`, the `APPLY_CUT` case currently guards with `canApply(species, technique)`. A matrix specimen must not be cuttable through the reducer either. Change the import on line 8 to bring in `canApplyToSpecimen` and replace the guard:

```js
      if (!canApplyToSpecimen(specimen, species, technique)) return state;
```

Leave the `canApply` import in place only if something else in the file still uses it; if nothing does, drop it from the import list.

- [ ] **Step 6: Write the failing test for the matrix sale rule**

Add to `src/features/rockhound/logic/market.test.js`:

```js
describe('mineral specimens', () => {
  const base = { trueSpeciesId: 'quartz', caratWeight: 2, clarity: 80, colorGrade: 80 };

  it('sells a crystal on matrix at full value, with no uncut penalty', () => {
    // A matrix specimen cannot be cut, so charging it the cutter's-risk
    // discount would price it as something it can never become.
    const onMatrix = identifiedValue({ ...base, form: 'matrix' }, speciesById.quartz);
    const loose = identifiedValue({ ...base, form: 'fragment' }, speciesById.quartz);
    expect(onMatrix).toBe(Math.round(loose / UNCUT_DISCOUNT));
  });

  it('still discounts every other habit', () => {
    for (const form of ['waterworn', 'crystal', 'fragment', 'nodule', 'druzy', undefined]) {
      expect(uncutDiscountFor({ ...base, form }), `${form}`).toBe(UNCUT_DISCOUNT);
    }
  });
});
```

Add `uncutDiscountFor` and `UNCUT_DISCOUNT` to the existing `./market.js` import in that file.

- [ ] **Step 7: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/market.test.js`
Expected: FAIL — `uncutDiscountFor is not a function`

- [ ] **Step 8: Implement the matrix rule**

In `src/features/rockhound/logic/market.js`, add above `identifiedValue` and change `identifiedValue` to use it:

```js
/**
 * The uncut discount exists because a buyer takes on the risk of cutting.
 * A crystal on matrix is never going to be cut — it is sold as a mineral
 * specimen — so that risk, and its discount, do not apply.
 */
export function uncutDiscountFor(specimen) {
  return specimen.form === 'matrix' ? 1 : UNCUT_DISCOUNT;
}

export function identifiedValue(specimen, species) {
  return Math.round(species.baseValue * roughGradeFactor(specimen) * uncutDiscountFor(specimen));
}
```

In `src/features/rockhound/logic/marketView.js`, `roughPrice` currently reports the constant `UNCUT_DISCOUNT`. It must report the discount that was actually applied, or the breakdown will contradict the total it explains. Import `uncutDiscountFor` in place of `UNCUT_DISCOUNT` and change the field:

```js
    uncutDiscount: uncutDiscountFor(specimen)
```

- [ ] **Step 9: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/schemas/cutTechniques.js src/data/cutTechniques.yaml src/features/rockhound/logic/cut.js src/features/rockhound/logic/cut.test.js src/features/rockhound/logic/market.js src/features/rockhound/logic/market.test.js src/features/rockhound/logic/marketView.js src/features/rockhound/RockhoundContext.jsx
git commit -m "feat(cut,market): crystal habit gates cuts and prices matrix specimens"
```

---

### Task 6: Per-method experience and banked hauls

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Modify: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `METHOD_ENUM`; specimens from `rollHaul` (Task 4)
- Produces:
  - state field `exploreMethodXp: { panning: 0, hardrock: 0, geode: 0, surface: 0 }`
  - action `COLLECT_HAUL` with payload `{ specimens, method, xp }`

**Design note:** a run in progress is *not* stored. Only a banked haul reaches the reducer, so the reducer stays pure and the save file gains one small field. A player who refreshes mid-run loses that run's uncommitted haul entirely, which makes refreshing to dodge a break strictly worse than taking it.

Levels are derived from XP via `levelForXp`, never stored. A denormalised level would be a second source of truth that can drift from the XP that produced it.

- [ ] **Step 1: Write the failing tests**

Add to `src/features/rockhound/RockhoundContext.test.js`:

```js
describe('COLLECT_HAUL', () => {
  const specimen = (id) => ({ instanceId: id, stage: 'rough', trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek', foundDepth: 1, form: 'waterworn' });

  it('starts every method at zero experience', () => {
    for (const m of METHOD_ENUM) {
      expect(initialRockhoundState.exploreMethodXp[m], m).toBe(0);
    }
  });

  it('adds a whole haul to the bench in one action', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: COLLECT_HAUL,
      payload: { specimens: [specimen('a'), specimen('b')], method: 'panning', xp: 10 }
    });
    expect(next.rough.map((r) => r.instanceId)).toEqual(['a', 'b']);
  });

  it('credits experience to the method that earned it, and no other', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: COLLECT_HAUL,
      payload: { specimens: [specimen('a')], method: 'geode', xp: 30 }
    });
    expect(next.exploreMethodXp.geode).toBe(30);
    expect(next.exploreMethodXp.panning).toBe(0);
    expect(next.exploreMethodXp.hardrock).toBe(0);
    expect(next.exploreMethodXp.surface).toBe(0);
  });

  it('accumulates experience across runs', () => {
    const once = rockhoundReducer(initialRockhoundState, {
      type: COLLECT_HAUL, payload: { specimens: [], method: 'panning', xp: 10 }
    });
    const twice = rockhoundReducer(once, {
      type: COLLECT_HAUL, payload: { specimens: [], method: 'panning', xp: 25 }
    });
    expect(twice.exploreMethodXp.panning).toBe(35);
  });

  it('keeps rough already on the bench', () => {
    const seeded = { ...initialRockhoundState, rough: [specimen('old')] };
    const next = rockhoundReducer(seeded, {
      type: COLLECT_HAUL, payload: { specimens: [specimen('new')], method: 'panning', xp: 10 }
    });
    expect(next.rough.map((r) => r.instanceId)).toEqual(['old', 'new']);
  });

  it('ignores an unknown method rather than corrupting the experience map', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: COLLECT_HAUL, payload: { specimens: [specimen('a')], method: 'spelunking', xp: 10 }
    });
    expect(next.exploreMethodXp).toEqual(initialRockhoundState.exploreMethodXp);
    expect(next.rough).toHaveLength(1); // the stones are still real
  });
});
```

Add `COLLECT_HAUL` to the existing `../RockhoundContext.jsx` import in that test file, and `import { METHOD_ENUM } from '../../schemas/localities.js';`.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'panning')`

- [ ] **Step 3: Implement**

In `src/features/rockhound/RockhoundContext.jsx`:

Add the action constant beside the others:

```js
export const COLLECT_HAUL = 'COLLECT_HAUL';
```

Add the field to `initialRockhoundState`, after `rough: []`:

```js
  exploreMethodXp: { panning: 0, hardrock: 0, geode: 0, surface: 0 },
```

Add the case to the reducer, beside `ADD_ROUGH`:

```js
    case COLLECT_HAUL: {
      const { specimens, method, xp } = action.payload;
      const known = Object.prototype.hasOwnProperty.call(state.exploreMethodXp, method);
      return {
        ...state,
        rough: [...state.rough, ...specimens],
        exploreMethodXp: known
          ? { ...state.exploreMethodXp, [method]: state.exploreMethodXp[method] + xp }
          : state.exploreMethodXp
      };
    }
```

`loadInitialState` already spreads `initialRockhoundState` under the parsed save, so saves written before the Dive pick up the zeroed map automatically — no migration needed.

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(explore): per-method experience and banked-haul collection"
```

---

### Task 7: `diveView.js` — presentation shapes

**Files:**
- Create: `src/features/rockhound/logic/diveView.js`
- Test: `src/features/rockhound/logic/diveView.test.js`

**Interfaces:**
- Consumes: everything from `dive.js` (Task 2); `localitySetComplete` from `progression.js`
- Produces:
  - `methodProgress(xp) -> { level, xp, nextAt, toNext, atCap }`
  - `siteView(locality, xp, setComplete) -> { method, level, bedrock, reach, showDescent }`
  - `descentView(locality, currentDepth, xp, setComplete, damping) -> { targetDepth, available, limitReason, chance, chanceText, severity }`

**Constraint reminder:** this module must not contain a single arithmetic rule. Every number comes from `dive.js`. A reviewer will check specifically for a formula restated here — this project has had five such violations.

- [ ] **Step 1: Write the failing tests**

Create `src/features/rockhound/logic/diveView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { methodProgress, siteView, descentView } from './diveView.js';
import { xpThreshold, levelForXp, breakChance, reachDepth, MAX_METHOD_LEVEL } from './dive.js';
import { localities } from '../../../loaders/localities.js';

const creek = localities.find((l) => l.id === 'hidden_creek');       // maxDepth 3, panning
const pipe = localities.find((l) => l.id === 'kimberlite_pipe');     // maxDepth 5, hardrock

describe('methodProgress', () => {
  it('reports the level the experience actually buys', () => {
    const p = methodProgress(150);
    expect(p.level).toBe(levelForXp(150));
    expect(p.xp).toBe(150);
  });

  it('reports how much more is needed for the next level', () => {
    const p = methodProgress(100);
    expect(p.nextAt).toBe(xpThreshold(levelForXp(100) + 1));
    expect(p.toNext).toBe(p.nextAt - 100);
  });

  it('flags the cap instead of promising a level that cannot come', () => {
    const p = methodProgress(xpThreshold(MAX_METHOD_LEVEL));
    expect(p.level).toBe(MAX_METHOD_LEVEL);
    expect(p.atCap).toBe(true);
    expect(p.toNext).toBe(0);
  });
});

describe('siteView', () => {
  it('names the method this ground is worked by', () => {
    expect(siteView(creek, 0, false).method).toBe('panning');
    expect(siteView(pipe, 0, false).method).toBe('hardrock');
  });

  it('caps reach at the locality bedrock however skilled the player', () => {
    const v = siteView(creek, xpThreshold(MAX_METHOD_LEVEL), false);
    expect(v.bedrock).toBe(3);
    expect(v.reach).toBe(3);
  });

  it('hides the descent affordance entirely from a beginner', () => {
    // The ramp: at level 0-1 Explore is one button and nothing else.
    expect(siteView(creek, 0, false).showDescent).toBe(false);
    expect(siteView(creek, xpThreshold(2), false).showDescent).toBe(true);
  });

  it('grants the set-completion bonus without breaching bedrock', () => {
    const xp = xpThreshold(2); // reach 2
    expect(siteView(pipe, xp, true).reach).toBe(reachDepth(2) + 1);
    expect(siteView(creek, xpThreshold(4), true).reach).toBe(3); // bedrock 3
  });
});

describe('descentView', () => {
  it('offers the next stage down and quotes the risk from the rules module', () => {
    const xp = xpThreshold(4); // reach 3
    const v = descentView(creek, 1, xp, false);
    expect(v.targetDepth).toBe(2);
    expect(v.available).toBe(true);
    expect(v.chance).toBeCloseTo(breakChance(2, levelForXp(xp)), 10);
    expect(v.chanceText).toMatch(/%$/);
  });

  it('escalates the stated severity with depth', () => {
    const xp = xpThreshold(4);
    expect(descentView(creek, 1, xp, false).severity).toBe('cozy');
    expect(descentView(creek, 2, xp, false).severity).toBe('real');
  });

  it('refuses the descent at bedrock and says why', () => {
    const v = descentView(creek, 3, xpThreshold(MAX_METHOD_LEVEL), false);
    expect(v.available).toBe(false);
    expect(v.limitReason).toBe('bedrock');
  });

  it('refuses the descent past the player reach and says why', () => {
    // Level 2 reaches depth 2; the pipe's bedrock is 5, so the wall is skill.
    const v = descentView(pipe, 2, xpThreshold(2), false);
    expect(v.available).toBe(false);
    expect(v.limitReason).toBe('reach');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/diveView.test.js`
Expected: FAIL — `Failed to resolve import "./diveView.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/diveView.js`:

```js
import {
  levelForXp, xpThreshold, effectiveReach, breakChance, severityAt,
  MAX_METHOD_LEVEL
} from './dive.js';

// Read-only presentation shapes for the run UI. Every number here is
// produced by dive.js — this module chooses what to show and what to call
// it, never how to compute it.

/** Below this reach the descent affordance is not shown at all (the ramp). */
const DESCENT_VISIBLE_FROM_REACH = 2;

const asPercent = (fraction) => `${Math.round(fraction * 100)}%`;

export function methodProgress(xp) {
  const level = levelForXp(xp);
  const atCap = level >= MAX_METHOD_LEVEL;
  const nextAt = atCap ? xpThreshold(MAX_METHOD_LEVEL) : xpThreshold(level + 1);
  return { level, xp, nextAt, toNext: atCap ? 0 : nextAt - xp, atCap };
}

export function siteView(locality, xp, setComplete) {
  const level = levelForXp(xp);
  const reach = effectiveReach(level, locality.maxDepth, setComplete);
  return {
    method: locality.method,
    level,
    bedrock: locality.maxDepth,
    reach,
    showDescent: reach >= DESCENT_VISIBLE_FROM_REACH
  };
}

export function descentView(locality, currentDepth, xp, setComplete, damping = 0) {
  const level = levelForXp(xp);
  const reach = effectiveReach(level, locality.maxDepth, setComplete);
  const targetDepth = currentDepth + 1;
  const atBedrock = targetDepth > locality.maxDepth;
  const beyondReach = targetDepth > reach;
  const chance = breakChance(targetDepth, level, damping);
  return {
    targetDepth,
    available: !atBedrock && !beyondReach,
    // Bedrock is the harder wall: no amount of skill opens it, so report it
    // first when both apply.
    limitReason: atBedrock ? 'bedrock' : beyondReach ? 'reach' : null,
    chance,
    chanceText: asPercent(chance),
    severity: severityAt(targetDepth)
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/diveView.test.js`
Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/diveView.js src/features/rockhound/logic/diveView.test.js
git commit -m "feat(explore): presentation shapes for reach, progress and descent"
```

---

### Task 8: The run UI

**Files:**
- Rewrite: `src/features/rockhound/components/Explore.jsx`
- Rewrite: `src/features/rockhound/components/Explore.test.jsx`

**Interfaces:**
- Consumes: `rollHaul` (Task 4), `siteView`/`descentView`/`methodProgress` (Task 7), `breakConsequence`/`xpForRun`/`levelForXp` (Task 2), `FORM_LABELS` (Task 3)
- Produces: `<Explore locality methodXp setComplete roughCount onBank rng />` where `onBank({ specimens, method, xp })`

**Two design decisions the implementer must not silently change:**

1. **The haul shows crystal habit, never species.** Rough is unidentified — that is the whole of the Identify game. A haul reveal that named the species would give the answer away for free. Habit *is* visible in the hand, so the reveal shows form and carat and withholds the rest. Use `<GemGlyph hidden />`, which renders `❔` with no tint.
2. **The real-loss warning is shown whenever severity is `real`, not once-then-forgotten.** A flag that suppresses the warning after first sight would leave a returning player facing a rule they were told about weeks ago. Always-visible is simpler and always honest.

- [ ] **Step 1: Write the failing tests**

Replace `src/features/rockhound/components/Explore.test.jsx` entirely:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Explore from './Explore.jsx';
import { localities } from '../../../loaders/localities.js';
import { xpThreshold } from '../logic/dive.js';

const creek = localities.find((l) => l.id === 'hidden_creek');

function renderExplore(overrides = {}) {
  const props = {
    locality: creek,
    methodXp: 0,
    setComplete: false,
    roughCount: 0,
    onBank: vi.fn(),
    rng: () => 0.5,
    ...overrides
  };
  render(<Explore {...props} />);
  return props;
}

describe('Explore — before a run', () => {
  it('offers a single way in', () => {
    renderExplore();
    screen.getByRole('button', { name: /work the gravel/i });
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
  });

  it('shows a beginner no depth machinery even mid-run', () => {
    // The ramp's first rung: at level 0 Explore is one button, a haul, and
    // banking. Asserting this before the run starts would pass trivially.
    renderExplore({ methodXp: 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
    screen.getByRole('button', { name: /bank this haul/i });
  });
});

describe('Explore — during a run', () => {
  it('reveals a haul and offers to bank it', () => {
    renderExplore();
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    screen.getByRole('button', { name: /bank this haul/i });
  });

  it('never names the species of unidentified rough', () => {
    // Naming it here would hand the player the answer Identify exists to ask.
    renderExplore({ methodXp: xpThreshold(4) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const haul = screen.getByRole('list', { name: /haul/i });
    for (const name of ['Quartz', 'Sapphire', 'Topaz', 'Almandine Garnet']) {
      expect(haul.textContent, `leaked ${name}`).not.toContain(name);
    }
  });

  it('offers the descent once the player can reach depth 2', () => {
    renderExplore({ methodXp: xpThreshold(2) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    screen.getByRole('button', { name: /go deeper/i });
  });

  it('quotes the risk on the descent button', () => {
    renderExplore({ methodXp: xpThreshold(2) });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const deeper = screen.getByRole('button', { name: /go deeper/i });
    expect(deeper.textContent).toMatch(/\d+%/);
  });

  it('adds to the haul when the descent holds', () => {
    // rng 0.99 never falls under a break chance of 0.13 at level 2.
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    const before = screen.getAllByRole('listitem').length;
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(before);
  });

  it('warns that the stakes change before a descent that can cost stones', () => {
    // Level 4 reaches depth 3; descending to 3 is where loss becomes real.
    renderExplore({ methodXp: xpThreshold(4), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getByRole('status').textContent).toMatch(/lose/i);
  });
});

describe('Explore — when the shaft breaks', () => {
  it('ends the run and says so', () => {
    // rng 0 is below every non-zero break chance.
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/gave way|broke|collapsed/i);
    expect(screen.queryByRole('button', { name: /go deeper/i })).toBeNull();
  });

  it('still lets the player walk away with what survived', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    expect(onBank).toHaveBeenCalledTimes(1);
    expect(onBank.mock.calls[0][0].specimens.length).toBeGreaterThan(0);
  });
});

describe('Explore — banking', () => {
  it('hands over the stones, the method and the experience earned', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    const payload = onBank.mock.calls[0][0];
    expect(payload.method).toBe('panning');
    expect(payload.xp).toBe(30); // depths [1, 2] -> 10 + 20, no break
    expect(payload.specimens.length).toBeGreaterThan(1);
  });

  it('pays less experience for a run that broke', () => {
    const { onBank } = renderExplore({ methodXp: xpThreshold(2), rng: () => 0 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /go deeper/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    expect(onBank.mock.calls[0][0].xp).toBe(5); // depths [1] -> 10, halved
  });

  it('returns to the start after banking', () => {
    renderExplore({ methodXp: xpThreshold(2), rng: () => 0.99 });
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    screen.getByRole('button', { name: /work the gravel/i });
    expect(screen.queryByRole('button', { name: /bank this haul/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Explore.test.jsx`
Expected: FAIL — the current component renders no button named "Bank this haul".

- [ ] **Step 3: Implement**

Replace `src/features/rockhound/components/Explore.jsx` entirely:

```jsx
import { useState } from 'react';
import GemGlyph from './GemGlyph.jsx';
import { rollHaul } from '../logic/rollRough.js';
import { breakConsequence, xpForRun, levelForXp } from '../logic/dive.js';
import { siteView, descentView, methodProgress } from '../logic/diveView.js';
import { FORM_LABELS } from '../logic/forms.js';

const WORK_VERB = {
  panning: 'Work',
  surface: 'Comb',
  geode: 'Crack',
  hardrock: 'Break'
};

function Haul({ stones }) {
  return (
    <ul aria-label="Your haul" className="flex flex-col gap-2">
      {stones.map((s) => (
        <li key={s.instanceId} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-2">
          {/* Species stays hidden: what it is, is Identify's question. */}
          <GemGlyph speciesId={s.trueSpeciesId} variant="row" hidden />
          <span>
            <span className="block text-slate-100">{FORM_LABELS[s.form] ?? 'Rough'}</span>
            <span className="block text-xs text-slate-400">{s.caratWeight} ct · depth {s.foundDepth}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Explore({ locality, methodXp, setComplete, roughCount, onBank, rng = Math.random }) {
  const [run, setRun] = useState(null);

  const site = siteView(locality, methodXp, setComplete);
  const progress = methodProgress(methodXp);
  const level = levelForXp(methodXp);
  const currentDepth = run ? run.depths[run.depths.length - 1] : 0;
  const descent = run && !run.broke ? descentView(locality, currentDepth, methodXp, setComplete) : null;
  const canDescend = site.showDescent && descent?.available;

  const start = () => {
    setRun({ haul: rollHaul(locality, 1, level, rng), depths: [1], broke: false, lost: [] });
  };

  const descend = () => {
    if (rng() < descent.chance) {
      const { kept, lost } = breakConsequence(run.haul, descent.targetDepth);
      setRun({ ...run, haul: kept, lost, broke: true });
      return;
    }
    setRun({
      ...run,
      haul: [...run.haul, ...rollHaul(locality, descent.targetDepth, level, rng)],
      depths: [...run.depths, descent.targetDepth]
    });
  };

  const bank = () => {
    onBank({ specimens: run.haul, method: locality.method, xp: xpForRun(run.depths, run.broke) });
    setRun(null);
  };

  const verb = WORK_VERB[locality.method] ?? 'Work';

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-bold text-yellow-400">{locality.name}</h2>
        <p className="capitalize text-slate-400">{locality.depositType} · {locality.method}</p>
        <p className="text-xs text-slate-500">
          {locality.method} level {progress.level}
          {progress.atCap ? ' · mastered' : ` · ${progress.toNext} xp to next`}
          {' · '}reaches depth {site.reach} of {site.bedrock}
        </p>
      </header>

      {!run && (
        <button
          type="button"
          onClick={start}
          className="self-start rounded-lg bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-500"
        >
          {verb} the {locality.hostRock}
        </button>
      )}

      {run && (
        <>
          <p className="text-sm text-slate-300">
            Depth {currentDepth} · carrying {run.haul.length} {run.haul.length === 1 ? 'stone' : 'stones'}
          </p>

          <Haul stones={run.haul} />

          {run.broke && (
            <p role="alert" className="rounded border border-red-700 bg-red-950 p-3 text-sm text-red-200">
              The ground gave way. {run.lost.length > 0
                ? `You lost ${run.lost.length} ${run.lost.length === 1 ? 'stone' : 'stones'} from the deepest stage, and the rest is scuffed.`
                : 'Everything you were carrying is scuffed.'}
            </p>
          )}

          {canDescend && descent.severity === 'real' && (
            <p role="status" className="rounded border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
              Below this point a collapse does not just scuff the haul — you lose the stones
              from the deepest stage you worked.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={bank}
              className="rounded-lg bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-500"
            >
              Bank this haul
            </button>
            {canDescend && (
              <button
                type="button"
                onClick={descend}
                className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500"
              >
                Go deeper — {descent.chanceText} risk
              </button>
            )}
          </div>
        </>
      )}

      <p className="text-slate-300">Unidentified rough on your bench: <strong>{roughCount}</strong></p>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Explore.test.jsx`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Explore.jsx src/features/rockhound/components/Explore.test.jsx
git commit -m "feat(explore): push-your-luck run UI with habit-only haul reveal"
```

---

### Task 9: Wire the shell and verify the whole ramp

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: `COLLECT_HAUL` (Task 6); the `<Explore>` prop shape (Task 8)
- Produces: nothing downstream — this is the last task

- [ ] **Step 1: Write the failing integration test**

Add to `src/features/rockhound/components/Rockhound.test.jsx`:

```jsx
describe('Explore wiring', () => {
  it('banks a haul onto the bench', () => {
    render(<Rockhound />);
    // Hidden Creek is the default locality and is panning-worked.
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    // The bench readout is the shell's own, so this proves the dispatch landed.
    expect(screen.getByText(/Unidentified rough on your bench/i).textContent).toMatch(/1/);
  });

  it('carries a banked stone through to Identify', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Identify' }));
    // A depth-1 stone from Hidden Creek can be any of the three shallow
    // species, but never the deep-only topaz.
    expect(screen.getByText(/SUSPECTS/).textContent).toMatch(/3/);
  });
});
```

If `Rockhound.test.jsx` clears `localStorage` between tests, keep that; if it does not, add `beforeEach(() => localStorage.clear());` so a saved bench from one test cannot satisfy another.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — no button named "Bank this haul", because the shell still passes the old `onCollect` prop.

- [ ] **Step 3: Rewire the shell**

In `src/features/rockhound/components/Rockhound.jsx`, replace `ADD_ROUGH` with `COLLECT_HAUL` in the import on line 3 (leave the other action imports untouched), and replace the `<Explore>` element:

```jsx
          <Explore
            locality={selectedLocality}
            methodXp={state.exploreMethodXp[selectedLocality.method] ?? 0}
            setComplete={completedLocalities.includes(selectedLocality.id)}
            roughCount={state.rough.length}
            onBank={(payload) => dispatch({ type: COLLECT_HAUL, payload })}
          />
```

`completedLocalities` is already computed on line 29 — do not recompute it.

Leave the `ADD_ROUGH` action and its reducer case in `RockhoundContext.jsx`. It is still the single-specimen path and is exercised by the context tests; removing it is out of scope.

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — every suite.

- [ ] **Step 5: Verify the production build**

Run: `./node_modules/.bin/vite build`
Expected: `built in <n>ms` with no errors.

- [ ] **Step 6: Verify the ramp by hand in a browser**

Run `./node_modules/.bin/vite` and open the app. Confirm each rung:

1. **Fresh save** (clear `localStorage` key `rockhound_save_v1`): Explore shows one button and no descent affordance. Working the gravel yields exactly one stone.
2. **Seed panning XP to 120** in the console and reload:
   ```js
   const s = JSON.parse(localStorage.rockhound_save_v1 || '{}');
   s.exploreMethodXp = { ...(s.exploreMethodXp || {}), panning: 120 };
   localStorage.rockhound_save_v1 = JSON.stringify(s); location.reload();
   ```
   "Go deeper" now appears with a quoted risk, and no real-loss warning.
3. **Seed panning XP to 400** the same way: descending from depth 2 shows the amber real-loss warning before the button is pressed, never after.
4. Bank a haul, go to Identify, confirm the suspect count is 3 for a depth-1 stone and 4 for a stone taken from depth 2 or deeper.
5. Cut a stone whose habit is a nodule or druzy and confirm the faceted techniques are unavailable while cabochon remains.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(explore): wire the dive into the shell"
```

---

## Post-Implementation Notes

**Not in this slice**, and deliberately so — see `2026-08-02-explore-roadmap-design.md`:

- `damping` is threaded through `breakChance` and `descentView` but is always `0`. Slice 1b supplies it from purchased gear.
- The idle sieve (slice 2) and Living Sites (slice 3).
- `findPoolView` accepts a `depth` argument that no caller yet passes. The locality field guide continues to show whole-pool odds. Wiring depth into that view is polish, not a requirement of this slice, and was left out so the field guide's existing tests stay meaningful.
