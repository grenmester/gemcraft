# Explore: The Idle Sieve — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A purchasable rocker box left at one locality that accumulates rough over wall-clock time — catching only species already in the Gemdex, returning everything unidentified — plus a 50-stone cap on unidentified rough.

**Architecture:** Two new rules modules (`idle.js` for accrual and reach, `bench.js` for the cap) plus a species filter threaded through the existing extraction path so the UI's "can catch N of M" count and the actual roll share one implementation. The reducer stays pure: `now` and `rng` arrive in action payloads.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Zod-validated YAML, React Context + useReducer, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-09-idle-sieve-design.md`

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Native Vitest matchers and raw DOM reads only (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **`getByText` matches an element by its direct child text nodes joined**, not full `textContent`. Two siblings rendering the same string collide. Prefer `getByRole` with distinct accessible names. Locality card names are `"{name}, {method}, N of M found"`, so anchor with `/^Hidden Creek,/` — a bare `/Hidden Creek/` also matches the field-guide button and throws.
- **Rules modules own formulas; view modules delegate and never restate one.** Six violations have been caught in this project. `dive.js`, `forms.js`, `cut.js`, `market.js`, `progression.js`, `idle.js`, `bench.js` own rules; `diveView.js`, `localityView.js`, `cutView.js`, `marketView.js`, `footerView.js`, `idleView.js` delegate.
- **The reducer must stay pure.** No `Date.now()` and no `Math.random()` inside `rockhoundReducer`. Both arrive in action payloads, as `APPLY_CUT` already does with `rng`.
- **Never write a test that passes when the behaviour is removed.** After writing a test, stub the behaviour and confirm it fails.
- No inline magic numbers: every tuned value is a named constant, exported only if another module or a test needs it.
- When adding to an import from a path a file already imports, **extend the existing line** — a second `import` from the same path is a duplicate-binding `SyntaxError`.
- The suite is green at **403 tests** before this plan starts. It must be green at every commit.

## The two rules this feature exists to enforce

Both are asserted directly in tests, not merely implied:

1. **The sieve catches only species already in the Gemdex.** Automation never advances discovery.
2. **Everything it catches arrives unidentified**, exactly like an active find — no reputation, no Gemdex entry.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/features/rockhound/logic/bench.js` | *create* — `BENCH_CAP`, `benchFull`, `benchSpace` |
| `src/features/rockhound/logic/idle.js` | *create* — `idleDepth`, `idleRate`, `accruedHours`, `pendingCount`, constants |
| `src/features/rockhound/logic/rollRough.js` | *modify* — `catchablePool`, optional species filter on `rollRough` |
| `src/features/rockhound/logic/market.js` | *modify* — `rocker_box` in `SHOP_GEAR` |
| `src/features/rockhound/RockhoundContext.jsx` | *modify* — `sieve` state, `PARK_SIEVE`, `COLLECT_SIEVE`, `DEBUG_REWIND_SIEVE` |
| `src/features/rockhound/logic/idleView.js` | *create* — banner and park-control shapes |
| `src/features/rockhound/components/SievePanel.jsx` | *create* — the collect banner |
| `src/features/rockhound/components/Explore.jsx` | *modify* — park control, run-start blocked at cap |
| `src/features/rockhound/components/StatusFooter.jsx` | *modify* — bench count against the cap |
| `src/features/rockhound/components/Rockhound.jsx` | *modify* — mount the banner, wire actions |
| `src/shared/components/DebugPanel.jsx` | *modify* — rewind the sieve clock |

---

### Task 1: The bench cap

**Files:**
- Create: `src/features/rockhound/logic/bench.js`
- Test: `src/features/rockhound/logic/bench.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `BENCH_CAP` (50), `benchFull(rough) -> boolean`, `benchSpace(rough) -> number`

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/bench.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { BENCH_CAP, benchFull, benchSpace } from './bench.js';

const rough = (n) => Array.from({ length: n }, (_, i) => ({ instanceId: `r${i}` }));

describe('bench cap', () => {
  it('caps the unidentified pile at fifty stones', () => {
    expect(BENCH_CAP).toBe(50);
  });

  it('is not full one stone below the cap, and is full at it', () => {
    expect(benchFull(rough(BENCH_CAP - 1))).toBe(false);
    expect(benchFull(rough(BENCH_CAP))).toBe(true);
  });

  it('stays full past the cap, since banking a haul may overshoot', () => {
    // Banking always succeeds even if it pushes the player over — the block
    // is on acquiring more, never on keeping work already done.
    expect(benchFull(rough(BENCH_CAP + 7))).toBe(true);
  });

  it('reports remaining space, never a negative number', () => {
    expect(benchSpace(rough(0))).toBe(BENCH_CAP);
    expect(benchSpace(rough(20))).toBe(BENCH_CAP - 20);
    expect(benchSpace(rough(BENCH_CAP + 7))).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/bench.test.js`
Expected: FAIL — `Failed to resolve import "./bench.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/bench.js`:

```js
// The unidentified pile has a ceiling. Its purpose is to keep the player
// circulating through Identify, Cut and Market rather than hoarding rough.
//
// The cap gates ACQUIRING more (starting a run, collecting the sieve). It
// never blocks banking a haul the player has already risked a run for, so
// the bench can legitimately sit above the cap.

export const BENCH_CAP = 50;

export function benchFull(rough) {
  return rough.length >= BENCH_CAP;
}

export function benchSpace(rough) {
  return Math.max(0, BENCH_CAP - rough.length);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/bench.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/bench.js src/features/rockhound/logic/bench.test.js
git commit -m "feat(rockhound): cap the unidentified bench at fifty stones"
```

---

### Task 2: A species filter on extraction

The UI must tell the player how many species a sieve can catch at a locality, and the roll must catch exactly those. One implementation serves both, so the count and the reality cannot disagree.

**Files:**
- Modify: `src/features/rockhound/logic/rollRough.js`
- Modify: `src/features/rockhound/logic/rollRough.test.js`

**Interfaces:**
- Consumes: `effectivePool(findPool, depth)` (already exported)
- Produces:
  - `catchablePool(findPool, depth, allowedSpecies = null) -> Array<{...entry, effectiveWeight}>`
  - `rollRough(locality, depth, rng, idFactory, allowedSpecies = null) -> specimen | null`

**Note on the null return:** `rollRough` returns `null` when the filtered pool is empty. No existing caller passes a filter, and an unfiltered pool is never empty (`findPool` has at least one entry and `minDepth` is at least 1), so no existing behaviour changes.

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/rollRough.test.js`. Add `catchablePool` to the **existing** `./rollRough.js` import line — a second import from that path is a duplicate-binding `SyntaxError`:

```js
describe('species filtering', () => {
  const creek = localities.find((l) => l.id === 'hidden_creek');

  it('keeps only the allowed species in the pool', () => {
    const pool = catchablePool(creek.findPool, 1, new Set(['quartz']));
    expect(pool.map((e) => e.species)).toEqual(['quartz']);
  });

  it('is the whole depth pool when no filter is given', () => {
    const filtered = catchablePool(creek.findPool, 1, null);
    const plain = effectivePool(creek.findPool, 1);
    expect(filtered.map((e) => e.species)).toEqual(plain.map((e) => e.species));
  });

  it('still honours minDepth inside the filter', () => {
    // Hidden Creek's topaz is minDepth 2, so allowing it changes nothing at depth 1.
    expect(catchablePool(creek.findPool, 1, new Set(['topaz']))).toHaveLength(0);
    expect(catchablePool(creek.findPool, 2, new Set(['topaz']))).toHaveLength(1);
  });

  it('rolls only species the filter allows, whatever the random stream does', () => {
    for (let i = 0; i < 50; i++) {
      const s = rollRough(creek, 1, () => i / 50, undefined, new Set(['sapphire']));
      expect(s.trueSpeciesId).toBe('sapphire');
    }
  });

  it('returns nothing when the filter leaves the pool empty', () => {
    // A sieve parked where the player has catalogued nothing catches nothing.
    expect(rollRough(creek, 1, () => 0.5, undefined, new Set())).toBe(null);
  });

  it('is unchanged for callers that pass no filter', () => {
    const a = rollRough(creek, 1, () => 0.5, () => 'id-1');
    const b = rollRough(creek, 1, () => 0.5, () => 'id-1', null);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: FAIL — `catchablePool is not a function`

- [ ] **Step 3: Implement**

In `src/features/rockhound/logic/rollRough.js`, add `catchablePool` directly after `effectivePool`:

```js
/**
 * The pool a given collector may actually draw from: the depth pool, then
 * narrowed to an allowed set of species. The idle sieve uses this both to
 * report what it can catch at a locality and to do the catching, so the
 * number shown and the number rolled cannot drift apart.
 */
export function catchablePool(findPool, depth, allowedSpecies = null) {
  const pool = effectivePool(findPool, depth);
  return allowedSpecies ? pool.filter((e) => allowedSpecies.has(e.species)) : pool;
}
```

Then change `rollRough` to use it and to handle an empty pool:

```js
export function rollRough(locality, depth, rng = Math.random, idFactory = defaultId, allowedSpecies = null) {
  const pool = catchablePool(locality.findPool, depth, allowedSpecies);
  if (pool.length === 0) return null;
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
```

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — the existing `rollRough` and `rollHaul` tests prove the unfiltered path is unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/rollRough.js src/features/rockhound/logic/rollRough.test.js
git commit -m "feat(explore): optional species filter on extraction"
```

---

### Task 3: `idle.js` — reach, rate and accrual

**Files:**
- Create: `src/features/rockhound/logic/idle.js`
- Test: `src/features/rockhound/logic/idle.test.js`

**Interfaces:**
- Consumes: `breakChance` from `dive.js`
- Produces:
  - `idleDepth(level, maxDepth, damping = 0) -> number`
  - `idleRate(level) -> number` (stones per hour)
  - `accruedHours(since, now) -> number`
  - `pendingCount(level, since, now) -> number`
  - `IDLE_CAP_HOURS` (8), `IDLE_RISK_TOLERANCE` (0.10), `MS_PER_HOUR`

**Verified against the real `breakChance` formula:** idle reaches depth 1 at levels 0–4, depth 2 at levels 5–10, and **never depth 3** at any level — `breakChance(3, 10)` is 0.20, twice the tolerance. Yield at a full 8 hours is 8 stones at level 0, 14 at level 5, 20 at level 10.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/idle.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  idleDepth, idleRate, accruedHours, pendingCount,
  IDLE_CAP_HOURS, IDLE_RISK_TOLERANCE, MS_PER_HOUR
} from './idle.js';
import { breakChance, MAX_METHOD_LEVEL } from './dive.js';

const DEEP = 9; // a locality deeper than idle could ever reach

describe('idleDepth', () => {
  it('works the surface until the second stage becomes risk-free', () => {
    expect(idleDepth(0, DEEP)).toBe(1);
    expect(idleDepth(4, DEEP)).toBe(1);
    expect(idleDepth(5, DEEP)).toBe(2);
    expect(idleDepth(MAX_METHOD_LEVEL, DEEP)).toBe(2);
  });

  it('never reaches the depth where losses become real, at any level', () => {
    // This is the guarantee that keeps deep-only species active-only.
    for (let l = 0; l <= MAX_METHOD_LEVEL; l++) {
      expect(idleDepth(l, DEEP), `level ${l}`).toBeLessThan(3);
    }
  });

  it('never quotes a depth the locality does not have', () => {
    expect(idleDepth(MAX_METHOD_LEVEL, 1)).toBe(1);
  });

  it('only ever picks a stage whose risk is within tolerance', () => {
    for (let l = 0; l <= MAX_METHOD_LEVEL; l++) {
      expect(breakChance(idleDepth(l, DEEP), l), `level ${l}`).toBeLessThanOrEqual(IDLE_RISK_TOLERANCE);
    }
  });

  it('goes deeper once damping gear reduces the risk', () => {
    // damping is threaded but always 0 today; this proves the sieve will
    // follow the risk-free line down when slice 1b lands.
    expect(idleDepth(0, DEEP, 0.25)).toBe(2);
  });
});

describe('idleRate', () => {
  it('rises with the method level', () => {
    expect(idleRate(0)).toBeCloseTo(1, 10);
    expect(idleRate(10)).toBeCloseTo(2.5, 10);
    expect(idleRate(10)).toBeGreaterThan(idleRate(0));
  });
});

describe('accruedHours', () => {
  it('measures elapsed hours', () => {
    expect(accruedHours(0, 3 * MS_PER_HOUR)).toBeCloseTo(3, 10);
  });

  it('stops accruing at the cap', () => {
    expect(accruedHours(0, 50 * MS_PER_HOUR)).toBe(IDLE_CAP_HOURS);
  });

  it('never goes negative if the clock moves backwards', () => {
    // A device clock change must not produce negative yield.
    expect(accruedHours(5 * MS_PER_HOUR, 0)).toBe(0);
  });
});

describe('pendingCount', () => {
  it('yields a handful over a full session, more at higher level', () => {
    const full = 50 * MS_PER_HOUR; // past the cap
    expect(pendingCount(0, 0, full)).toBe(8);
    expect(pendingCount(5, 0, full)).toBe(14);
    expect(pendingCount(10, 0, full)).toBe(20);
  });

  it('yields nothing before a whole stone has accrued', () => {
    expect(pendingCount(0, 0, MS_PER_HOUR / 2)).toBe(0);
  });

  it('never yields a fraction of a stone', () => {
    expect(Number.isInteger(pendingCount(7, 0, 3.7 * MS_PER_HOUR))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/idle.test.js`
Expected: FAIL — `Failed to resolve import "./idle.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/idle.js`:

```js
import { breakChance } from './dive.js';

// The idle sieve (§1-§2 of the idle spec). It works the shallows and never
// gambles: it descends only while the risk stays inside tolerance. That is
// what keeps it permanently behind active play without a balance constant —
// pushing past the risk-free line is a decision, and an absent player makes
// no decisions.
//
// Risk itself is dive.js's rule; this module only asks it questions.

export const MS_PER_HOUR = 3600000;
export const IDLE_CAP_HOURS = 8;
export const IDLE_RISK_TOLERANCE = 0.10;
export const IDLE_BASE_RATE = 1;
export const IDLE_RATE_PER_LEVEL = 0.15;

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

/** The deepest stage whose risk is within tolerance, never past bedrock. */
export function idleDepth(level, maxDepth, damping = 0) {
  let depth = 1;
  while (depth < maxDepth && breakChance(depth + 1, level, damping) <= IDLE_RISK_TOLERANCE) {
    depth++;
  }
  return depth;
}

/** Stones per hour. Scales with the same level that sets idleDepth. */
export function idleRate(level) {
  return IDLE_BASE_RATE + level * IDLE_RATE_PER_LEVEL;
}

export function accruedHours(since, now) {
  return clamp((now - since) / MS_PER_HOUR, 0, IDLE_CAP_HOURS);
}

export function pendingCount(level, since, now) {
  return Math.floor(accruedHours(since, now) * idleRate(level));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/idle.test.js`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/idle.js src/features/rockhound/logic/idle.test.js
git commit -m "feat(explore): idle reach, rate and accrual"
```

---

### Task 4: The rocker box, and sieve state in the reducer

The heart of the feature. Both rules from the spec — Gemdex-only catching, and everything unidentified — live here and are asserted directly.

**Files:**
- Modify: `src/features/rockhound/logic/market.js`
- Modify: `src/features/rockhound/logic/market.test.js`
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Modify: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `idleDepth`, `pendingCount` (Task 3); `benchFull` (Task 1); `rollRough` with a species filter (Task 2); `levelForXp` from `dive.js`
- Produces:
  - `SHOP_GEAR` gains `{ id: 'rocker_box', name: 'Rocker Box', price: 250 }`
  - state gains `sieve: null | { localityId, since }`
  - actions `PARK_SIEVE { localityId, now }`, `COLLECT_SIEVE { now, rng }`, `DEBUG_REWIND_SIEVE { hours, now }`

**Design rules the implementation must honour:**
- Collected stones are **unidentified**: they land in `state.rough`, grant **no** reputation and **no** Gemdex entry. Identifying them by hand later pays normally through the existing path.
- The catch pool is filtered to `state.gemdex`, so automation can never discover a species.
- `PARK_SIEVE` collects pending yield first, so moving the box never destroys a haul. It is refused when the bench is full *and* there is yield pending — otherwise park-cycling would collect past the cap.
- Parking for the first time (`sieve === null`) is always allowed; there is nothing pending to collect.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/rockhound/RockhoundContext.test.js`. Add the three new action names to the **existing** `../RockhoundContext.jsx` import line:

```js
describe('the idle sieve', () => {
  const HOUR = 3600000;
  const withBox = (over = {}) => ({
    ...initialRockhoundState,
    gear: ['rocker_box'],
    gemdex: ['quartz'],
    exploreMethodXp: { ...initialRockhoundState.exploreMethodXp, panning: 0 },
    ...over
  });

  it('parks the box at a locality and starts its clock', () => {
    const next = rockhoundReducer(withBox(), {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toEqual({ localityId: 'hidden_creek', since: 1000 });
  });

  it('refuses to park a box the player does not own', () => {
    const next = rockhoundReducer({ ...withBox(), gear: [] }, {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toBe(null);
  });

  it('catches only species already in the gemdex', () => {
    // THE central rule: automation must never advance discovery. Hidden Creek
    // pools quartz, garnet and sapphire at depth 1; only quartz is known.
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
    });
    expect(next.rough.length).toBeGreaterThan(0);
    expect(next.rough.every((r) => r.trueSpeciesId === 'quartz')).toBe(true);
  });

  it('returns everything unidentified, granting no reputation and no gemdex entry', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
    });
    expect(next.rough.every((r) => r.stage === 'rough')).toBe(true);
    expect(next.rough.every((r) => r.identifiedAs === null)).toBe(true);
    expect(next.reputation).toBe(state.reputation);
    expect(next.gemdex).toEqual(state.gemdex);
    expect(next.identified).toEqual([]);
  });

  it('restarts the clock when collected', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
    });
    expect(next.sieve.since).toBe(8 * HOUR);
  });

  it('catches nothing where the player has catalogued nothing', () => {
    const state = withBox({ gemdex: [], sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
    });
    expect(next.rough).toEqual([]);
  });

  it('refuses to collect onto a full bench, and keeps the accrued time', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const state = withBox({ rough: full, sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
    });
    expect(next.rough).toHaveLength(BENCH_CAP);
    expect(next.sieve.since).toBe(0); // nothing lost — collect once there is room
  });

  it('collects what is pending before moving the box', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: PARK_SIEVE, payload: { localityId: 'gravel_bar', now: 8 * HOUR, rng: Math.random }
    });
    expect(next.rough.length).toBeGreaterThan(0);
    expect(next.sieve).toEqual({ localityId: 'gravel_bar', since: 8 * HOUR });
  });

  it('refuses to move the box on a full bench, so park-cycling cannot beat the cap', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const state = withBox({ rough: full, sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: PARK_SIEVE, payload: { localityId: 'gravel_bar', now: 8 * HOUR, rng: Math.random }
    });
    expect(next.sieve.localityId).toBe('hidden_creek');
    expect(next.rough).toHaveLength(BENCH_CAP);
  });

  it('allows a first park on a full bench, since nothing is pending', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const next = rockhoundReducer(withBox({ rough: full }), {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toEqual({ localityId: 'hidden_creek', since: 1000 });
  });

  it('rewinds the clock for testing without touching anything else', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 5 * HOUR } });
    const next = rockhoundReducer(state, {
      type: DEBUG_REWIND_SIEVE, payload: { hours: 8, now: 10 * HOUR }
    });
    expect(next.sieve.since).toBe(10 * HOUR - 8 * HOUR);
    expect(next.rough).toEqual(state.rough);
  });
});
```

Add `import { BENCH_CAP } from './logic/bench.js';` to that test file if it is not already imported.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `PARK_SIEVE is not defined`

- [ ] **Step 3: Add the rocker box to the shop**

In `src/features/rockhound/logic/market.js`, extend `SHOP_GEAR`:

```js
export const SHOP_GEAR = [
  { id: 'sieve', name: 'Sieve', price: 120 },
  { id: 'rock_hammer', name: 'Rock Hammer', price: 300 },
  { id: 'rocker_box', name: 'Rocker Box', price: 250 }
];
```

Add to `src/features/rockhound/logic/market.test.js`:

```js
it('sells a rocker box to leave working at a locality', () => {
  const box = SHOP_GEAR.find((g) => g.id === 'rocker_box');
  expect(box).toBeDefined();
  expect(gearPrice('rocker_box')).toBe(box.price);
});
```

Extend the existing `./market.js` import in that file with `SHOP_GEAR` and `gearPrice` if they are not already imported.

- [ ] **Step 4: Implement the sieve in the reducer**

In `src/features/rockhound/RockhoundContext.jsx`:

Add the action constants beside the others:

```js
export const PARK_SIEVE = 'PARK_SIEVE';
export const COLLECT_SIEVE = 'COLLECT_SIEVE';
export const DEBUG_REWIND_SIEVE = 'DEBUG_REWIND_SIEVE';
```

Add these imports (extend the existing `./logic/dive.js` line rather than adding a second):

```js
import { idleDepth, pendingCount, MS_PER_HOUR } from './logic/idle.js';
import { benchFull } from './logic/bench.js';
import { rollRough } from './logic/rollRough.js';
import { localitiesById } from '../../loaders/localities.js';
```

`levelForXp` comes from `./logic/dive.js` — add it to that existing import line.

Add the state field, after `rough: []`:

```js
  sieve: null, // { localityId, since } — where the rocker box is working
```

Add a helper above `rockhoundReducer`:

```js
/**
 * What the parked box has caught since it was last emptied. Only species the
 * player has already catalogued: automation supplies material, never
 * discovery. Everything comes back unidentified, exactly like an active find.
 */
function collectSieve(state, now, rng) {
  const locality = localitiesById[state.sieve.localityId];
  if (!locality) return [];
  const level = levelForXp(state.exploreMethodXp[locality.method] ?? 0);
  const depth = idleDepth(level, locality.maxDepth);
  const known = new Set(state.gemdex);
  const specimens = [];
  for (let i = 0; i < pendingCount(level, state.sieve.since, now); i++) {
    const s = rollRough(locality, depth, rng, undefined, known);
    if (s) specimens.push(s);
  }
  return specimens;
}
```

Add the reducer cases:

```js
    case PARK_SIEVE: {
      const { localityId, now, rng } = action.payload;
      if (!state.gear.includes('rocker_box')) return state;
      if (!localitiesById[localityId]) return state;

      // Moving collects first, so a move never destroys a haul. Refuse the
      // move on a full bench when there IS something pending — otherwise
      // park-cycling would collect past the cap.
      // No `?? Math.random` fallback: naming Math.random here would break the
      // reducer's purity. A caller that can have pending yield must supply rng.
      const pending = state.sieve ? collectSieve(state, now, rng) : [];
      if (pending.length > 0 && benchFull(state.rough)) return state;

      return {
        ...state,
        rough: [...state.rough, ...pending],
        sieve: { localityId, since: now }
      };
    }

    case COLLECT_SIEVE: {
      const { now, rng } = action.payload;
      if (!state.sieve) return state;
      if (benchFull(state.rough)) return state; // accrued time is kept

      const caught = collectSieve(state, now, rng);
      return {
        ...state,
        rough: [...state.rough, ...caught],
        sieve: { ...state.sieve, since: now }
      };
    }

    case DEBUG_REWIND_SIEVE: {
      const { hours, now } = action.payload;
      if (!state.sieve) return state;
      return { ...state, sieve: { ...state.sieve, since: now - hours * MS_PER_HOUR } };
    }
```

- [ ] **Step 5: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. `loadInitialState` already spreads `initialRockhoundState` beneath the parsed save, so old saves pick up `sieve: null` with no migration.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/logic/market.js src/features/rockhound/logic/market.test.js src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(explore): rocker box, sieve state, and gemdex-only idle catching"
```

---

### Task 5: `idleView.js` — what the screens say

**Files:**
- Create: `src/features/rockhound/logic/idleView.js`
- Test: `src/features/rockhound/logic/idleView.test.js`

**Interfaces:**
- Consumes: `idleDepth`, `pendingCount`, `IDLE_CAP_HOURS`, `accruedHours` (Task 3); `catchablePool` (Task 2); `benchFull` (Task 1); `levelForXp` from `dive.js`
- Produces:
  - `catchView(locality, gemdex, methodXp) -> { depth, catchable, total, canCatch }`
  - `sieveView(sieve, localitiesById, gemdex, exploreMethodXp, rough, now) -> null | { localityName, hours, atCap, pending, benchBlocked, canCollect }`

**Constraint:** this is a view module. Every number comes from `idle.js`, `bench.js` or `rollRough.js`. A reviewer will look specifically for a restated formula.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/idleView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { catchView, sieveView } from './idleView.js';
import { localities, localitiesById } from '../../../loaders/localities.js';
import { xpThreshold } from './dive.js';
import { IDLE_CAP_HOURS, MS_PER_HOUR, pendingCount } from './idle.js';
import { BENCH_CAP } from './bench.js';

const creek = localities.find((l) => l.id === 'hidden_creek');
const zeroXp = { panning: 0, hardrock: 0, geode: 0, surface: 0 };
const rough = (n) => Array.from({ length: n }, (_, i) => ({ instanceId: `r${i}` }));

describe('catchView', () => {
  it('counts how many of a locality\'s species the sieve could actually catch', () => {
    // Hidden Creek pools 4 species; 3 are reachable at depth 1 (topaz is
    // minDepth 2). Knowing one of them means the sieve can catch one.
    const v = catchView(creek, ['quartz'], 0);
    expect(v.catchable).toBe(1);
    expect(v.total).toBe(3);
    expect(v.canCatch).toBe(true);
  });

  it('reports plainly when the sieve would catch nothing', () => {
    // The trap this exists to prevent: a box parked where nothing is known
    // sits for hours and returns empty.
    const v = catchView(creek, [], 0);
    expect(v.catchable).toBe(0);
    expect(v.canCatch).toBe(false);
  });

  it('counts deeper species once the level reaches them', () => {
    // Topaz is minDepth 2, which idle reaches from method level 5.
    expect(catchView(creek, ['topaz'], 0).catchable).toBe(0);
    expect(catchView(creek, ['topaz'], xpThreshold(5)).catchable).toBe(1);
  });
});

describe('sieveView', () => {
  it('is nothing at all when no box is parked', () => {
    expect(sieveView(null, localitiesById, [], zeroXp, [], 0)).toBe(null);
  });

  it('names where the box is working and what it holds', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 3 * MS_PER_HOUR);
    expect(v.localityName).toBe('Hidden Creek');
    expect(v.pending).toBe(pendingCount(0, 0, 3 * MS_PER_HOUR));
    expect(v.canCollect).toBe(true);
  });

  it('says when the box has filled up and stopped', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 50 * MS_PER_HOUR);
    expect(v.hours).toBe(IDLE_CAP_HOURS);
    expect(v.atCap).toBe(true);
  });

  it('refuses collection on a full bench and says which problem it is', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, rough(BENCH_CAP), 8 * MS_PER_HOUR);
    expect(v.benchBlocked).toBe(true);
    expect(v.canCollect).toBe(false);
  });

  it('offers no collection when nothing has accrued yet', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 0);
    expect(v.pending).toBe(0);
    expect(v.canCollect).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/idleView.test.js`
Expected: FAIL — `Failed to resolve import "./idleView.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/idleView.js`:

```js
import { levelForXp } from './dive.js';
import { idleDepth, pendingCount, accruedHours, IDLE_CAP_HOURS } from './idle.js';
import { catchablePool } from './rollRough.js';
import { benchFull } from './bench.js';

// Presentation shapes for the sieve. Every number is produced by idle.js,
// bench.js or rollRough.js — this module chooses what to show and what to
// call it, never how to compute it.

/**
 * What a sieve parked here could catch, given what the player knows. The
 * count uses the same pool function the roll uses, so the promise on the
 * park control and the contents of the box cannot disagree.
 */
export function catchView(locality, gemdex, methodXp) {
  const level = levelForXp(methodXp);
  const depth = idleDepth(level, locality.maxDepth);
  const reachable = catchablePool(locality.findPool, depth);
  const catchable = catchablePool(locality.findPool, depth, new Set(gemdex));
  return {
    depth,
    catchable: catchable.length,
    total: reachable.length,
    canCatch: catchable.length > 0
  };
}

export function sieveView(sieve, localitiesById, gemdex, exploreMethodXp, rough, now) {
  if (!sieve) return null;
  const locality = localitiesById[sieve.localityId];
  if (!locality) return null;

  const level = levelForXp(exploreMethodXp[locality.method] ?? 0);
  const hours = accruedHours(sieve.since, now);
  const pending = pendingCount(level, sieve.since, now);
  const benchBlocked = benchFull(rough);
  return {
    localityName: locality.name,
    hours,
    atCap: hours >= IDLE_CAP_HOURS,
    pending,
    benchBlocked,
    canCollect: pending > 0 && !benchBlocked
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/idleView.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/idleView.js src/features/rockhound/logic/idleView.test.js
git commit -m "feat(explore): presentation shapes for the sieve and its catch pool"
```

---

### Task 6: The sieve on screen

**Files:**
- Create: `src/features/rockhound/components/SievePanel.jsx`
- Create: `src/features/rockhound/components/SievePanel.test.jsx`
- Modify: `src/features/rockhound/components/Explore.jsx`
- Modify: `src/features/rockhound/components/Explore.test.jsx`
- Modify: `src/features/rockhound/components/StatusFooter.jsx`
- Modify: `src/features/rockhound/components/StatusFooter.test.jsx`

**Interfaces:**
- Consumes: `sieveView`, `catchView` (Task 5); `BENCH_CAP`, `benchFull` (Task 1)
- Produces:
  - `<SievePanel view onCollect />` where `view` is a `sieveView` result or `null`
  - `<Explore>` gains `catch` (a `catchView` result), `sieveHere` (boolean), `onPark`, and `benchIsFull`

**Copy rules the tests pin:**
- The park control states what the box could catch here, because a box parked where nothing is known catches nothing for as long as it runs.
- A blocked run says *why* it is blocked. A disabled button with no reason is a defect.

- [ ] **Step 1: Write the failing SievePanel test**

Create `src/features/rockhound/components/SievePanel.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SievePanel from './SievePanel.jsx';

const base = {
  localityName: 'Hidden Creek', hours: 8, atCap: true,
  pending: 12, benchBlocked: false, canCollect: true
};

describe('SievePanel', () => {
  it('renders nothing when no box is parked', () => {
    const { container } = render(<SievePanel view={null} onCollect={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('says where the box worked and what it holds', () => {
    render(<SievePanel view={base} onCollect={vi.fn()} />);
    const panel = screen.getByRole('status');
    expect(panel.textContent).toMatch(/Hidden Creek/);
    expect(panel.textContent).toMatch(/12/);
  });

  it('hands the haul over when collected', () => {
    const onCollect = vi.fn();
    render(<SievePanel view={base} onCollect={onCollect} />);
    fireEvent.click(screen.getByRole('button', { name: /collect/i }));
    expect(onCollect).toHaveBeenCalledTimes(1);
  });

  it('explains a full bench rather than just disabling the button', () => {
    render(<SievePanel view={{ ...base, benchBlocked: true, canCollect: false }} onCollect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /collect/i }).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toMatch(/bench is full/i);
  });

  it('says when the box has filled up and stopped working', () => {
    render(<SievePanel view={base} onCollect={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toMatch(/full/i);
  });

  it('offers no collection before anything has accrued', () => {
    render(<SievePanel view={{ ...base, hours: 0, atCap: false, pending: 0, canCollect: false }} onCollect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /collect/i }).disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/SievePanel.test.jsx`
Expected: FAIL — cannot resolve `./SievePanel.jsx`

- [ ] **Step 3: Implement the panel**

Create `src/features/rockhound/components/SievePanel.jsx`:

```jsx
export default function SievePanel({ view, onCollect }) {
  if (!view) return null;

  const stones = `${view.pending} ${view.pending === 1 ? 'stone' : 'stones'}`;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3"
    >
      <span aria-hidden="true" className="text-xl">🪣</span>
      <span className="flex-1 text-sm">
        <span className="block text-slate-200">
          Your rocker box has been working {view.localityName} — {stones} waiting.
        </span>
        <span className="block text-xs text-slate-500">
          {view.benchBlocked
            ? 'Your bench is full — identify or sell before collecting.'
            : view.atCap
              ? 'The box is full and has stopped working.'
              : `Running for ${view.hours.toFixed(1)} h.`}
        </span>
      </span>
      <button
        type="button"
        disabled={!view.canCollect}
        onClick={onCollect}
        className={`rounded px-4 py-1.5 text-sm font-bold ${
          view.canCollect
            ? 'bg-green-600 text-white hover:bg-green-500'
            : 'cursor-not-allowed bg-slate-700 text-slate-500'
        }`}
      >
        Collect
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write the failing Explore tests**

Append to `src/features/rockhound/components/Explore.test.jsx`. Extend the existing `renderExplore` helper's default props with `catch: { depth: 1, catchable: 3, total: 3, canCatch: true }`, `sieveHere: false`, `onPark: vi.fn()`, `benchIsFull: false`:

```jsx
describe('Explore — the rocker box', () => {
  it('offers to leave the box here, saying what it could catch', () => {
    renderExplore();
    const park = screen.getByRole('button', { name: /leave the rocker box here/i });
    // A box parked where the player knows nothing catches nothing for as long
    // as it runs, so the control must state the count before they commit.
    expect(park.textContent).toMatch(/3 of 3/);
  });

  it('warns rather than promises when it would catch nothing here', () => {
    renderExplore({ catch: { depth: 1, catchable: 0, total: 3, canCatch: false } });
    expect(screen.getByRole('button', { name: /leave the rocker box here/i }).disabled).toBe(true);
    screen.getByText(/nothing here you have catalogued/i);
  });

  it('says so when the box is already working this locality', () => {
    renderExplore({ sieveHere: true });
    screen.getByText(/box is working here/i);
    expect(screen.queryByRole('button', { name: /leave the rocker box here/i })).toBeNull();
  });

  it('parks the box when asked', () => {
    const onPark = vi.fn();
    renderExplore({ onPark });
    fireEvent.click(screen.getByRole('button', { name: /leave the rocker box here/i }));
    expect(onPark).toHaveBeenCalledTimes(1);
  });
});

describe('Explore — a full bench', () => {
  it('will not start a run, and says why', () => {
    renderExplore({ benchIsFull: true });
    const work = screen.getByRole('button', { name: /work the gravel/i });
    expect(work.disabled).toBe(true);
    screen.getByText(/identify or sell/i);
  });

  it('starts normally when there is room', () => {
    renderExplore({ benchIsFull: false });
    expect(screen.getByRole('button', { name: /work the gravel/i }).disabled).toBe(false);
  });
});
```

- [ ] **Step 5: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Explore.test.jsx`
Expected: FAIL — no button named "Leave the rocker box here"

- [ ] **Step 6: Wire Explore**

In `src/features/rockhound/components/Explore.jsx`, extend the props:

```jsx
export default function Explore({
  locality, methodXp, setComplete, roughCount, onBank, onLeave = () => {},
  catch: catchInfo = null, sieveHere = false, onPark = () => {}, benchIsFull = false,
  rng = Math.random
}) {
```

Disable the work button and explain, replacing the existing `!run && (...)` block:

```jsx
      {!run && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={benchIsFull}
            onClick={start}
            className={`self-start rounded-lg px-6 py-3 font-bold ${
              benchIsFull
                ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {verb} the {locality.hostRock}
          </button>
          {benchIsFull && (
            <p className="text-xs text-amber-400">
              Your bench is full — identify or sell some rough before digging more.
            </p>
          )}
        </div>
      )}
```

Add the park control just above the closing `</section>`, after the bench readout:

```jsx
      {catchInfo && (
        sieveHere ? (
          <p className="text-xs text-slate-400">🪣 Your rocker box is working here.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={!catchInfo.canCatch}
              onClick={onPark}
              className={`self-start rounded px-4 py-1.5 text-sm ${
                catchInfo.canCatch
                  ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  : 'cursor-not-allowed bg-slate-800 text-slate-600'
              }`}
            >
              🪣 Leave the rocker box here — catches {catchInfo.catchable} of {catchInfo.total}
            </button>
            {!catchInfo.canCatch && (
              <p className="text-xs text-amber-400">
                There is nothing here you have catalogued yet, so the box would catch nothing.
              </p>
            )}
          </div>
        )
      )}
```

- [ ] **Step 7: Show the cap in the footer**

Add to `src/features/rockhound/components/StatusFooter.test.jsx`:

```jsx
it('shows the bench against its cap, so the limit is visible before it bites', () => {
  render(<StatusFooter {...props} />);
  expect(screen.getByLabelText(/bench/i).textContent).toMatch(new RegExp(`/${BENCH_CAP}`));
});
```

Add `import { BENCH_CAP } from '../logic/bench.js';` to that test file.

In `src/features/rockhound/components/StatusFooter.jsx`, add `import { BENCH_CAP } from '../logic/bench.js';` and change the bench span:

```jsx
        <span aria-label={`Bench: ${roughCount} of ${BENCH_CAP} rough, ${identifiedCount} identified, ${stoneCount} cut`}
              className="text-xs text-slate-400">
          🪨 {roughCount}/{BENCH_CAP} · 🔍 {identifiedCount} · 💎 {stoneCount}
        </span>
```

- [ ] **Step 8: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. A pre-existing footer test may match the old bench string — retarget it to the new one rather than deleting the assertion.

- [ ] **Step 9: Commit**

```bash
git add src/features/rockhound/components/SievePanel.jsx src/features/rockhound/components/SievePanel.test.jsx src/features/rockhound/components/Explore.jsx src/features/rockhound/components/Explore.test.jsx src/features/rockhound/components/StatusFooter.jsx src/features/rockhound/components/StatusFooter.test.jsx
git commit -m "feat(explore): sieve banner, park control and the visible bench cap"
```

---

### Task 7: Wire the shell and the debug panel

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Rockhound.test.jsx`
- Modify: `src/shared/components/DebugPanel.jsx`
- Modify: `src/shared/components/DebugPanel.test.jsx`

**Interfaces:**
- Consumes: everything from Tasks 1–6
- Produces: nothing downstream — this is the last task

- [ ] **Step 1: Write the failing integration tests**

Append to `src/features/rockhound/components/Rockhound.test.jsx`:

```jsx
describe('the rocker box end to end', () => {
  it('shows no banner until a box is parked', () => {
    render(<App />);
    expect(screen.queryByText(/rocker box has been working/i)).toBeNull();
  });

  it('parks from the run screen and reports it on the map', () => {
    // Seed a save with the box bought and one species known, then park it.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      gear: ['rocker_box'], gemdex: ['quartz']
    }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek,/ }));
    fireEvent.click(screen.getByRole('button', { name: /leave the rocker box here/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to the map/i }));
    screen.getByRole('status');
  });
});
```

Ensure the file's `beforeEach` clears `localStorage`; the seeding above must run after that clear, so set it inside the test as written.

- [ ] **Step 2: Write the failing debug test**

Append to `src/shared/components/DebugPanel.test.jsx`:

```jsx
it('offers to rewind the sieve clock for testing', () => {
  open();
  screen.getByRole('button', { name: /simulate 8 hours/i });
});
```

- [ ] **Step 3: Run to verify both fail**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx src/shared/components/DebugPanel.test.jsx`
Expected: FAIL — no park control reaches the shell, no rewind button exists.

- [ ] **Step 4: Wire the shell**

In `src/features/rockhound/components/Rockhound.jsx`:

Add to the existing `../RockhoundContext.jsx` import: `PARK_SIEVE`, `COLLECT_SIEVE`.

Add these imports:

```jsx
import SievePanel from './SievePanel.jsx';
import { sieveView, catchView } from '../logic/idleView.js';
import { benchFull } from '../logic/bench.js';
```

Inside `RockhoundInner`, above the return:

```jsx
  // `now` is read at render rather than stored, so the banner is current on
  // every mount without a ticker. The reducer never reads the clock itself.
  const now = Date.now();
  const sieve = sieveView(state.sieve, localitiesById, state.gemdex, state.exploreMethodXp, state.rough, now);
```

In the Explore tab's map branch, render the banner above `<LocalityMap>`:

```jsx
            <SievePanel
              view={sieve}
              onCollect={() => dispatch({ type: COLLECT_SIEVE, payload: { now: Date.now(), rng: Math.random } })}
            />
```

In the run branch, pass the new props to `<Explore>`:

```jsx
            catch={catchView(selectedLocality, state.gemdex, state.exploreMethodXp[selectedLocality.method] ?? 0)}
            sieveHere={state.sieve?.localityId === selectedLocality.id}
            onPark={() => dispatch({ type: PARK_SIEVE, payload: { localityId: selectedLocality.id, now: Date.now(), rng: Math.random } })}
            benchIsFull={benchFull(state.rough)}
```

Note the park control only renders when the player owns a rocker box — gate it in the shell so the run screen stays clean for players who have not bought one:

```jsx
            catch={state.gear.includes('rocker_box')
              ? catchView(selectedLocality, state.gemdex, state.exploreMethodXp[selectedLocality.method] ?? 0)
              : null}
```

- [ ] **Step 5: Wire the debug panel**

In `src/shared/components/DebugPanel.jsx`, add `DEBUG_REWIND_SIEVE` to the existing `RockhoundContext.jsx` import, and add a section above the danger zone:

```jsx
          <div className="border-b border-slate-700 pb-3">
            <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Rocker box {state.sieve ? `— parked at ${state.sieve.localityId}` : '— not parked'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {[1, 8].map((h) => (
                <button
                  key={h}
                  type="button"
                  className={BTN}
                  disabled={!state.sieve}
                  onClick={() => dispatch({ type: DEBUG_REWIND_SIEVE, payload: { hours: h, now: Date.now() } })}
                >
                  Simulate {h} {h === 1 ? 'hour' : 'hours'}
                </button>
              ))}
            </div>
          </div>
```

- [ ] **Step 6: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS.

Run: `./node_modules/.bin/vite build`
Expected: `built in <n>ms`, no errors.

- [ ] **Step 7: Verify by hand in a browser**

Run `./node_modules/.bin/vite` and check:

1. Fresh save: no sieve banner, and no park control on the run screen — the box is not owned.
2. Debug-grant cash, buy the Rocker Box in the Market. The park control now appears on the run screen.
3. At a locality where nothing is catalogued, the park control is disabled and says the box would catch nothing.
4. Identify one species, return: the control reads "catches 1 of 3" and is enabled.
5. Park it, go back to the map — the banner names the locality and shows 0 stones waiting.
6. `Ctrl+Shift+D` → "Simulate 8 hours". The banner shows the accrued stones and says the box is full.
7. Collect: the stones land on the bench **unidentified**, reputation and the Gemdex are unchanged, and every stone is a species already catalogued.
8. Fill the bench past 50 and confirm the work button is disabled with a reason, the Collect button is disabled and explains, and banking an in-progress haul still succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx src/shared/components/DebugPanel.jsx src/shared/components/DebugPanel.test.jsx
git commit -m "feat(explore): wire the rocker box into the shell and debug panel"
```

---

## Deferred, with reasons

| Item | Why |
| --- | --- |
| A cost for a wrong identification guess | `COMMIT_IDENTIFY` returns state unchanged on an incorrect guess, so clearing a backlog is click-until-right and the bench cap adds clicks rather than dynamism. The real fix — test minigames, a wrong-guess consequence, and the `livePlay` slot currently filled with `Math.random()` — belongs to the Identify increment, together. This is the top reason to do Identify next. |
| Grouping the Cut tray | Twenty stones arriving at once will make a flat unsorted column long. Cosmetic, and better judged once the volume is real. |
| Damping gear (slice 1b) | `idleDepth` already accepts `damping`, so the sieve deepens automatically when that lands. A test pins the behaviour today. |
| Living Sites (slice 3) | Unchanged; the parked box is its hook. |
