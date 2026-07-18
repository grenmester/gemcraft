# Vertical Slice: Explore → Identify → Gemdex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable core loop — pan a locality for unidentified rough, identify it by running precision-based test minigames that narrow a candidate list, and record correct IDs in a Gemdex — proving the redesign's fun before widening.

**Architecture:** A self-contained module under `src/features/rockhound/` with (a) pure, framework-free logic in `logic/` (rough generation, the precision/band identification model), (b) an isolated `RockhoundContext` reducer + provider with its own localStorage key, and (c) presentational React components wired together by a `Rockhound` shell. It reads the v5.0 data foundation (`loaders/species.js`, `loaders/localities.js`) already committed. It does **not** touch the legacy `GameContext` or its features; it mounts behind one new App phase.

**Tech Stack:** React 18 + Vite, Zod-validated YAML data (already loaded), Vitest + React Testing Library (jsdom), Tailwind v4.

## Global Constraints

- **Package manager:** `pnpm`, but `pnpm exec` aborts in this environment (no-TTY module purge). Run the local binary directly: `./node_modules/.bin/vitest run <path>`.
- **Unit tests live under `src/**`** and use the `*.test.js`/`*.test.jsx` suffix (vitest config excludes `tests/**`, which is Playwright's). Never put vitest tests in `tests/`.
- **No `@testing-library/jest-dom`** is configured. Do **not** use matchers like `toBeInTheDocument()`. Assert with `getByText`/`getByRole` (they throw if absent, so the call is the assertion), `.textContent`, `queryByText(...) === null` for absence, and `fireEvent` from `@testing-library/react` (there is no `@testing-library/user-event`).
- **Immutability:** reducers must return new objects/arrays; never mutate `state`.
- **Data model is fixed** (already committed): `species.yaml`, `localities.yaml`, `cutTechniques.yaml` with the schemas in `src/schemas/`. Do not modify them in this slice.
- **Isolation:** do not import from or edit `src/context/GameContext.jsx` or `src/features/{discover,process,craft,sell,inventory}`. The only shared edits allowed are adding one phase constant and one render case (Task 8).
- **MVP simplification (explicit):** the test "minigame" in this slice derives its live-play quality from an injectable `rng` (`livePlay = 0.6 + rng()*0.4`); the animated steady-hand bar is a documented fast-follow, not part of this slice.

---

## File Structure

New files (all additive):

```
src/features/rockhound/
├── logic/
│   ├── properties.js        # numericProperty(), fluorescenceKey()
│   ├── rollRough.js         # createRough(), rollRough(locality, rng)
│   ├── precision.js         # BASE_ERROR, bandWidth(), livePlayFromRng()
│   ├── tests.js             # TEST_DEFS, runTest(), survivesReading(), eliminate()
│   ├── candidates.js        # seedCandidates(locality)
│   └── identifyResult.js    # identifyReward(), commitIdentification()
├── RockhoundContext.jsx     # reducer + provider + useRockhound() + persistence
├── components/
│   ├── Explore.jsx          # presentational: pan button -> onCollect(specimen)
│   ├── Identify.jsx         # presentational: candidate board + tests + commit
│   ├── GemdexV5.jsx         # presentational: collection grid
│   └── Rockhound.jsx        # container: tabs, wires context to the three views
└── (tests colocated as *.test.js / *.test.jsx)
```

Shared edits (Task 8 only): `src/constants.js` (add `ROCKHOUND` phase), `src/App.jsx` (one render case), `src/shared/components/Menu.jsx` (one button).

---

### Task 1: Rough generation logic

**Files:**
- Create: `src/features/rockhound/logic/properties.js`
- Create: `src/features/rockhound/logic/rollRough.js`
- Test: `src/features/rockhound/logic/rollRough.test.js`

**Interfaces:**
- Consumes: `species` objects (shape from `src/schemas/species.js`) and `locality` objects (shape from `src/schemas/localities.js`).
- Produces:
  - `numericProperty(species, prop): number` — `prop` is `'hardness'` or `'specificGravity'`; returns the midpoint if the value is a `[min,max]` tuple.
  - `fluorescenceKey(species): string` — `'inert'` if `fluorescence` is null, else `` `${longwave}/${shortwave}` ``.
  - `createRough({trueSpeciesId, caratWeight, clarity, colorGrade, origin}, idFactory?): Specimen`
  - `rollRough(locality, rng=Math.random, idFactory?): Specimen`
  - `Specimen = { instanceId, stage:'rough', trueSpeciesId, identifiedAs:null, caratWeight, clarity, colorGrade, origin }`

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/rollRough.test.js
import { describe, it, expect } from 'vitest';
import { numericProperty, fluorescenceKey } from './properties.js';
import { createRough, rollRough } from './rollRough.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

describe('properties', () => {
  it('returns the midpoint for a hardness range', () => {
    expect(numericProperty(speciesById.almandine_garnet, 'hardness')).toBeCloseTo(7.25, 2);
  });
  it('returns a point hardness unchanged', () => {
    expect(numericProperty(speciesById.sapphire, 'hardness')).toBe(9);
  });
  it('reads specific gravity', () => {
    expect(numericProperty(speciesById.quartz, 'specificGravity')).toBeCloseTo(2.65, 2);
  });
  it('keys fluorescence, inert when null', () => {
    expect(fluorescenceKey(speciesById.quartz)).toBe('inert');
    expect(fluorescenceKey(speciesById.fluorite)).toBe('blue/violet');
  });
});

describe('rollRough', () => {
  // rng is called in order: [speciesPick, carat, clarity, color]
  const stubRng = (values) => {
    let i = 0;
    return () => values[i++];
  };

  it('picks the first find-pool species when the pick roll is 0', () => {
    const loc = localitiesById.hidden_creek; // first entry: quartz
    const spec = rollRough(loc, stubRng([0, 0, 0, 0]), () => 'id-1');
    expect(spec.trueSpeciesId).toBe('quartz');
    expect(spec.origin).toBe('hidden_creek');
    expect(spec.stage).toBe('rough');
    expect(spec.identifiedAs).toBe(null);
    expect(spec.instanceId).toBe('id-1');
  });

  it('rolls stats within the find-pool ranges', () => {
    const loc = localitiesById.hidden_creek;
    const spec = rollRough(loc, stubRng([0, 1, 1, 1]), () => 'id-2');
    // quartz entry: caratRange [0.5,4.0], clarityRange [40,90], colorRange [30,70]
    expect(spec.caratWeight).toBeGreaterThanOrEqual(0.5);
    expect(spec.caratWeight).toBeLessThanOrEqual(4.0);
    expect(spec.clarity).toBe(90);
    expect(spec.colorGrade).toBe(70);
  });

  it('createRough fills defaults', () => {
    const s = createRough({ trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'x' }, () => 'z');
    expect(s).toMatchObject({ stage: 'rough', identifiedAs: null, trueSpeciesId: 'quartz', instanceId: 'z' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: FAIL — cannot resolve `./properties.js` / `./rollRough.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/properties.js
export function numericProperty(species, prop) {
  const v = prop === 'hardness' ? species.hardness : species.specificGravity;
  return Array.isArray(v) ? (v[0] + v[1]) / 2 : v;
}

export function fluorescenceKey(species) {
  const f = species.fluorescence;
  if (!f) return 'inert';
  return `${f.longwave}/${f.shortwave}`;
}
```

```javascript
// src/features/rockhound/logic/rollRough.js
const lerp = ([lo, hi], t) => lo + (hi - lo) * t;
const round2 = (n) => Math.round(n * 100) / 100;
const defaultId = () => `spec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createRough({ trueSpeciesId, caratWeight, clarity, colorGrade, origin }, idFactory = defaultId) {
  return {
    instanceId: idFactory(),
    stage: 'rough',
    trueSpeciesId,
    identifiedAs: null,
    caratWeight,
    clarity,
    colorGrade,
    origin
  };
}

export function rollRough(locality, rng = Math.random, idFactory = defaultId) {
  const pool = locality.findPool;
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  let entry = pool[pool.length - 1];
  for (const e of pool) {
    roll -= e.weight;
    if (roll < 0) { entry = e; break; }
  }
  return createRough({
    trueSpeciesId: entry.species,
    caratWeight: round2(lerp(entry.caratRange, rng())),
    clarity: Math.round(lerp(entry.clarityRange, rng())),
    colorGrade: Math.round(lerp(entry.colorRange, rng())),
    origin: locality.id
  }, idFactory);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/properties.js src/features/rockhound/logic/rollRough.js src/features/rockhound/logic/rollRough.test.js
git commit -m "feat(rockhound): rough generation + property helpers"
```

---

### Task 2: Precision model & test definitions

**Files:**
- Create: `src/features/rockhound/logic/precision.js`
- Create: `src/features/rockhound/logic/tests.js`
- Test: `src/features/rockhound/logic/tests.test.js`

**Interfaces:**
- Consumes: `numericProperty`, `fluorescenceKey` (Task 1).
- Produces:
  - `BASE_ERROR = { hardness: 0.5, specificGravity: 0.3 }`
  - `bandWidth({property, mastery, instrument?, labPrep?, familiarity?, livePlay}): number` — `mastery` is 0–100 (clamped to [0.1,1] as a fraction), `livePlay` clamped to [0.6,1].
  - `livePlayFromRng(rng): number` — `0.6 + rng()*0.4`.
  - `TEST_DEFS = { scratch, heft, uv }` each `{ id, name, kind, property, gear }`.
  - `runTest(testId, trueSpecies, {mastery, livePlay}): Reading` — numeric: `{testId, kind:'numeric', property, center, band}`; categorical: `{testId, kind:'categorical', property, key}`.
  - `survivesReading(candidateSpecies, reading): boolean`
  - `eliminate(candidateIds, speciesById, reading): string[]`

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/tests.test.js
import { describe, it, expect } from 'vitest';
import { bandWidth, livePlayFromRng, BASE_ERROR } from './precision.js';
import { runTest, survivesReading, eliminate, TEST_DEFS } from './tests.js';
import { speciesById } from '../../../loaders/species.js';

describe('precision', () => {
  it('narrows the band as mastery rises', () => {
    const low = bandWidth({ property: 'hardness', mastery: 10, livePlay: 0.6 });
    const high = bandWidth({ property: 'hardness', mastery: 100, livePlay: 1.0 });
    expect(high).toBeLessThan(low);
    expect(high).toBeCloseTo(BASE_ERROR.hardness, 5); // mastery 1, all factors 1
  });
  it('maps rng into the [0.6, 1.0] live-play range', () => {
    expect(livePlayFromRng(() => 0)).toBeCloseTo(0.6, 5);
    expect(livePlayFromRng(() => 1)).toBeCloseTo(1.0, 5);
  });
});

describe('runTest + elimination', () => {
  const ids = ['quartz', 'topaz', 'sapphire']; // colorless look-alikes: 7 / 8 / 9

  it('a sharp scratch test on sapphire eliminates quartz and topaz', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 100, livePlay: 1.0 });
    const survivors = eliminate(ids, speciesById, reading);
    expect(survivors).toEqual(['sapphire']);
  });

  it('a fuzzy scratch test eliminates nothing', () => {
    const reading = runTest('scratch', speciesById.sapphire, { mastery: 10, livePlay: 0.6 });
    const survivors = eliminate(ids, speciesById, reading);
    expect(survivors).toEqual(ids);
  });

  it('the true species always survives its own reading', () => {
    const reading = runTest('heft', speciesById.topaz, { mastery: 100, livePlay: 1.0 });
    expect(survivesReading(speciesById.topaz, reading)).toBe(true);
  });

  it('UV is categorical: fluorite (fluorescent) is separated from inert quartz', () => {
    const reading = runTest('uv', speciesById.fluorite, { mastery: 50, livePlay: 0.8 });
    const survivors = eliminate(['quartz', 'amethyst', 'fluorite'], speciesById, reading);
    expect(survivors).toEqual(['fluorite']);
  });

  it('exposes the three slice tests', () => {
    expect(Object.keys(TEST_DEFS).sort()).toEqual(['heft', 'scratch', 'uv']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js`
Expected: FAIL — cannot resolve `./precision.js` / `./tests.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/precision.js
export const BASE_ERROR = { hardness: 0.5, specificGravity: 0.3 };

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export function bandWidth({ property, mastery, instrument = 1, labPrep = 1, familiarity = 1, livePlay }) {
  const m = clamp(mastery / 100, 0.1, 1);
  const lp = clamp(livePlay, 0.6, 1);
  return BASE_ERROR[property] / (m * instrument * labPrep * familiarity * lp);
}

export function livePlayFromRng(rng) {
  return 0.6 + rng() * 0.4;
}
```

```javascript
// src/features/rockhound/logic/tests.js
import { numericProperty, fluorescenceKey } from './properties.js';
import { bandWidth } from './precision.js';

export const TEST_DEFS = {
  scratch: { id: 'scratch', name: 'Scratch Test', kind: 'numeric', property: 'hardness', gear: 'hardness_picks' },
  heft: { id: 'heft', name: 'Heft in Water', kind: 'numeric', property: 'specificGravity', gear: 'scale' },
  uv: { id: 'uv', name: 'UV Light', kind: 'categorical', property: 'fluorescence', gear: 'uv_light' }
};

export function runTest(testId, trueSpecies, { mastery, livePlay }) {
  const def = TEST_DEFS[testId];
  if (def.kind === 'numeric') {
    return {
      testId,
      kind: 'numeric',
      property: def.property,
      center: numericProperty(trueSpecies, def.property),
      band: bandWidth({ property: def.property, mastery, livePlay })
    };
  }
  return { testId, kind: 'categorical', property: def.property, key: fluorescenceKey(trueSpecies) };
}

export function survivesReading(candidate, reading) {
  if (reading.kind === 'numeric') {
    return Math.abs(numericProperty(candidate, reading.property) - reading.center) <= reading.band;
  }
  return fluorescenceKey(candidate) === reading.key;
}

export function eliminate(candidateIds, speciesById, reading) {
  return candidateIds.filter((id) => survivesReading(speciesById[id], reading));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/precision.js src/features/rockhound/logic/tests.js src/features/rockhound/logic/tests.test.js
git commit -m "feat(rockhound): precision-band identification model + test definitions"
```

---

### Task 3: Candidate seeding & commit

**Files:**
- Create: `src/features/rockhound/logic/candidates.js`
- Create: `src/features/rockhound/logic/identifyResult.js`
- Test: `src/features/rockhound/logic/identify.test.js`

**Interfaces:**
- Produces:
  - `seedCandidates(locality): string[]` — unique species ids from the locality's find pool.
  - `identifyReward(species): number` — reputation by rarity (`Common 5, Uncommon 10, Rare 20, Epic 35, Legendary 60`).
  - `commitIdentification(specimen, guessId): { correct: boolean, specimen: Specimen }` — on correct, `stage:'identified'`; always sets `identifiedAs`. On wrong, `stage` stays `'rough'` (cozy retry).

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/identify.test.js
import { describe, it, expect } from 'vitest';
import { seedCandidates } from './candidates.js';
import { identifyReward, commitIdentification } from './identifyResult.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';
import { createRough } from './rollRough.js';

describe('seedCandidates', () => {
  it('returns the unique find-pool species for a locality', () => {
    const c = seedCandidates(localitiesById.hidden_creek);
    expect([...c].sort()).toEqual(['almandine_garnet', 'quartz', 'sapphire', 'topaz']);
  });
});

describe('identifyReward', () => {
  it('scales with rarity', () => {
    expect(identifyReward(speciesById.quartz)).toBe(5);      // Common
    expect(identifyReward(speciesById.sapphire)).toBe(35);   // Epic
  });
});

describe('commitIdentification', () => {
  const rough = createRough(
    { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek' },
    () => 'i1'
  );
  it('marks a correct guess as identified', () => {
    const { correct, specimen } = commitIdentification(rough, 'sapphire');
    expect(correct).toBe(true);
    expect(specimen.stage).toBe('identified');
    expect(specimen.identifiedAs).toBe('sapphire');
  });
  it('leaves a wrong guess as rough for retry', () => {
    const { correct, specimen } = commitIdentification(rough, 'quartz');
    expect(correct).toBe(false);
    expect(specimen.stage).toBe('rough');
    expect(specimen.identifiedAs).toBe('quartz');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/identify.test.js`
Expected: FAIL — cannot resolve `./candidates.js` / `./identifyResult.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/candidates.js
export function seedCandidates(locality) {
  return [...new Set(locality.findPool.map((e) => e.species))];
}
```

```javascript
// src/features/rockhound/logic/identifyResult.js
const RARITY_REP = { Common: 5, Uncommon: 10, Rare: 20, Epic: 35, Legendary: 60 };

export function identifyReward(species) {
  return RARITY_REP[species.rarity] ?? 5;
}

export function commitIdentification(specimen, guessId) {
  const correct = specimen.trueSpeciesId === guessId;
  return {
    correct,
    specimen: { ...specimen, stage: correct ? 'identified' : 'rough', identifiedAs: guessId }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/identify.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/candidates.js src/features/rockhound/logic/identifyResult.js src/features/rockhound/logic/identify.test.js
git commit -m "feat(rockhound): candidate seeding + ID commit logic"
```

---

### Task 4: RockhoundContext (state, reducer, persistence)

**Files:**
- Create: `src/features/rockhound/RockhoundContext.jsx`
- Test: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `speciesById` (loader), `identifyReward`, `commitIdentification` (Task 3).
- Produces:
  - Action creators / types: `ADD_ROUGH`, `RECORD_TEST_SCORE`, `COMMIT_IDENTIFY`, `CLEAR_NEW`.
  - `rockhoundReducer(state, action): State` where `State = { rough: Specimen[], identified: Specimen[], gemdex: string[], newlyDiscovered: string[], reputation: number, testMastery: {scratch,heft,uv} }`.
  - `initialRockhoundState`.
  - `RockhoundProvider({children})`, `useRockhound()` → `{ state, dispatch }`.
- Action shapes:
  - `{ type: ADD_ROUGH, payload: Specimen }`
  - `{ type: RECORD_TEST_SCORE, payload: { testId, score } }` — sets `testMastery[testId] = max(current, score)`.
  - `{ type: COMMIT_IDENTIFY, payload: { instanceId, guessId } }` — if the found rough's `trueSpeciesId === guessId`: move it to `identified`, add species to `gemdex` + `newlyDiscovered` if new, add `identifyReward` to `reputation`. Otherwise no-op.
  - `{ type: CLEAR_NEW }` — empties `newlyDiscovered`.

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/RockhoundContext.test.js
import { describe, it, expect } from 'vitest';
import {
  rockhoundReducer, initialRockhoundState,
  ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';

const sapphireRough = createRough(
  { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek' },
  () => 'r1'
);

describe('rockhoundReducer', () => {
  it('adds rough to the bench', () => {
    const s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    expect(s.rough).toHaveLength(1);
    expect(s.rough[0].instanceId).toBe('r1');
  });

  it('records a test score as a running best', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: RECORD_TEST_SCORE, payload: { testId: 'scratch', score: 60 } });
    s = rockhoundReducer(s, { type: RECORD_TEST_SCORE, payload: { testId: 'scratch', score: 40 } });
    expect(s.testMastery.scratch).toBe(60);
  });

  it('a correct commit discovers the species and awards reputation', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    expect(s.rough).toHaveLength(0);
    expect(s.identified).toHaveLength(1);
    expect(s.gemdex).toContain('sapphire');
    expect(s.newlyDiscovered).toContain('sapphire');
    expect(s.reputation).toBe(35);
  });

  it('a wrong commit leaves the rough in place and awards nothing', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'quartz' } });
    expect(s.rough).toHaveLength(1);
    expect(s.gemdex).toHaveLength(0);
    expect(s.reputation).toBe(0);
  });

  it('does not double-count a species already in the gemdex', () => {
    const second = { ...sapphireRough, instanceId: 'r2' };
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: ADD_ROUGH, payload: second });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r2', guessId: 'sapphire' } });
    expect(s.gemdex).toEqual(['sapphire']);
    expect(s.reputation).toBe(70); // reputation still awarded per correct ID
  });

  it('clears newly-discovered flags', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    s = rockhoundReducer(s, { type: CLEAR_NEW });
    expect(s.newlyDiscovered).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — cannot resolve `./RockhoundContext.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/RockhoundContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { speciesById } from '../../loaders/species.js';
import { identifyReward, commitIdentification } from './logic/identifyResult.js';

export const ADD_ROUGH = 'ADD_ROUGH';
export const RECORD_TEST_SCORE = 'RECORD_TEST_SCORE';
export const COMMIT_IDENTIFY = 'COMMIT_IDENTIFY';
export const CLEAR_NEW = 'CLEAR_NEW';

const STORAGE_KEY = 'rockhound_save_v1';

export const initialRockhoundState = {
  rough: [],
  identified: [],
  gemdex: [],
  newlyDiscovered: [],
  reputation: 0,
  testMastery: { scratch: 0, heft: 0, uv: 0 }
};

export function rockhoundReducer(state, action) {
  switch (action.type) {
    case ADD_ROUGH:
      return { ...state, rough: [...state.rough, action.payload] };

    case RECORD_TEST_SCORE: {
      const { testId, score } = action.payload;
      return {
        ...state,
        testMastery: {
          ...state.testMastery,
          [testId]: Math.max(state.testMastery[testId] ?? 0, score)
        }
      };
    }

    case COMMIT_IDENTIFY: {
      const { instanceId, guessId } = action.payload;
      const specimen = state.rough.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;
      const { correct, specimen: updated } = commitIdentification(specimen, guessId);
      if (!correct) return state;

      const speciesId = updated.trueSpeciesId;
      const isNew = !state.gemdex.includes(speciesId);
      return {
        ...state,
        rough: state.rough.filter((r) => r.instanceId !== instanceId),
        identified: [...state.identified, updated],
        gemdex: isNew ? [...state.gemdex, speciesId] : state.gemdex,
        newlyDiscovered: isNew ? [...state.newlyDiscovered, speciesId] : state.newlyDiscovered,
        reputation: state.reputation + identifyReward(speciesById[speciesId])
      };
    }

    case CLEAR_NEW:
      return { ...state, newlyDiscovered: [] };

    default:
      return state;
  }
}

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...initialRockhoundState, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to load rockhound save:', e);
  }
  return initialRockhoundState;
}

const RockhoundContext = createContext(null);

export function RockhoundProvider({ children }) {
  const [state, dispatch] = useReducer(rockhoundReducer, initialRockhoundState, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save rockhound state:', e);
    }
  }, [state]);

  return <RockhoundContext.Provider value={{ state, dispatch }}>{children}</RockhoundContext.Provider>;
}

export function useRockhound() {
  const ctx = useContext(RockhoundContext);
  if (!ctx) throw new Error('useRockhound must be used within a RockhoundProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(rockhound): isolated context, reducer, and persistence"
```

---

### Task 5: Explore component (panning → rough)

**Files:**
- Create: `src/features/rockhound/components/Explore.jsx`
- Test: `src/features/rockhound/components/Explore.test.jsx`

**Interfaces:**
- Consumes: `rollRough` (Task 1); a `locality` object; props `{ locality, roughCount, onCollect, rng? }`.
- Produces: presentational `Explore` — renders the locality name/deposit, a "Pan" button that calls `onCollect(rollRough(locality, rng))`, and the current `roughCount`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/Explore.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Explore from './Explore.jsx';
import { localitiesById } from '../../../loaders/localities.js';

describe('Explore', () => {
  const loc = localitiesById.hidden_creek;

  it('shows the locality name and rough count', () => {
    render(<Explore locality={loc} roughCount={3} onCollect={() => {}} />);
    screen.getByText('Hidden Creek');
    screen.getByText(/3/);
  });

  it('panning collects a rough specimen from this locality', () => {
    const onCollect = vi.fn();
    render(<Explore locality={loc} roughCount={0} onCollect={onCollect} rng={() => 0} />);
    fireEvent.click(screen.getByRole('button', { name: /pan/i }));
    expect(onCollect).toHaveBeenCalledTimes(1);
    const specimen = onCollect.mock.calls[0][0];
    expect(specimen.origin).toBe('hidden_creek');
    expect(specimen.stage).toBe('rough');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Explore.test.jsx`
Expected: FAIL — cannot resolve `./Explore.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/Explore.jsx
import { rollRough } from '../logic/rollRough.js';

export default function Explore({ locality, roughCount, onCollect, rng = Math.random }) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-bold text-yellow-400">{locality.name}</h2>
        <p className="text-slate-400 capitalize">{locality.depositType} · {locality.method}</p>
      </header>

      <button
        type="button"
        onClick={() => onCollect(rollRough(locality, rng))}
        className="self-start rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-3 font-bold text-white"
      >
        Pan the {locality.hostRock}
      </button>

      <p className="text-slate-300">Unidentified rough on your bench: <strong>{roughCount}</strong></p>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Explore.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Explore.jsx src/features/rockhound/components/Explore.test.jsx
git commit -m "feat(rockhound): Explore (panning) component"
```

---

### Task 6: Identify component (candidate board + tests + commit)

**Files:**
- Create: `src/features/rockhound/components/Identify.jsx`
- Test: `src/features/rockhound/components/Identify.test.jsx`

**Interfaces:**
- Consumes: `TEST_DEFS`, `runTest`, `eliminate` (Task 2), `seedCandidates` (Task 3), `livePlayFromRng` (Task 2), `speciesById` (loader).
- Produces: presentational `Identify` with props `{ specimen, locality, speciesById, testMastery, onRunTest, onCommit, rng? }`.
  - Seeds candidates from `locality` on mount; keeps surviving-candidate ids in local state.
  - Each `TEST_DEFS` entry renders a button. Clicking it computes `livePlay = livePlayFromRng(rng)`, builds a reading via `runTest(testId, speciesById[specimen.trueSpeciesId], {mastery: testMastery[testId], livePlay})`, narrows local candidates via `eliminate`, and calls `onRunTest(testId, Math.round(livePlay*100))`.
  - Renders a candidate card per surviving id with a "This is it" button → `onCommit(specimen.instanceId, candidateId)`.
  - Shows a `SUSPECTS: N` counter.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/Identify.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';
import { createRough } from '../logic/rollRough.js';

const mastery = { scratch: 100, heft: 100, uv: 100 };

function renderSapphire(overrides = {}) {
  const specimen = createRough(
    { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek' },
    () => 'r1'
  );
  const props = {
    specimen,
    locality: localitiesById.hidden_creek,
    speciesById,
    testMastery: mastery,
    onRunTest: vi.fn(),
    onCommit: vi.fn(),
    rng: () => 1, // perfect live-play → sharp bands
    ...overrides
  };
  render(<Identify {...props} />);
  return props;
}

describe('Identify', () => {
  it('starts with all find-pool candidates as suspects', () => {
    renderSapphire();
    screen.getByText(/SUSPECTS: 4/);
  });

  it('a sharp scratch test narrows the four colorless-pool candidates toward sapphire', () => {
    renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    // hidden_creek pool = quartz(7), almandine_garnet(7.25), sapphire(9), topaz(8)
    // sharp band (~0.5) around 9 keeps only sapphire
    screen.getByText(/SUSPECTS: 1/);
    screen.getByText('Sapphire');
  });

  it('records the test score when a test is run', () => {
    const props = renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    expect(props.onRunTest).toHaveBeenCalledWith('scratch', 100);
  });

  it('committing a candidate reports the guess', () => {
    const props = renderSapphire();
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    fireEvent.click(screen.getByRole('button', { name: /This is it/i }));
    expect(props.onCommit).toHaveBeenCalledWith('r1', 'sapphire');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Identify.test.jsx`
Expected: FAIL — cannot resolve `./Identify.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/Identify.jsx
import { useState } from 'react';
import { TEST_DEFS, runTest, eliminate } from '../logic/tests.js';
import { livePlayFromRng } from '../logic/precision.js';
import { seedCandidates } from '../logic/candidates.js';

export default function Identify({ specimen, locality, speciesById, testMastery, onRunTest, onCommit, rng = Math.random }) {
  const [candidates, setCandidates] = useState(() => seedCandidates(locality));
  const trueSpecies = speciesById[specimen.trueSpeciesId];

  const handleTest = (testId) => {
    const livePlay = livePlayFromRng(rng);
    const reading = runTest(testId, trueSpecies, { mastery: testMastery[testId] ?? 0, livePlay });
    setCandidates((prev) => eliminate(prev, speciesById, reading));
    onRunTest(testId, Math.round(livePlay * 100));
  };

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">Identify the rough</h2>
        <span className="font-mono text-slate-300">SUSPECTS: {candidates.length}</span>
      </header>

      <div className="flex flex-wrap gap-2">
        {Object.values(TEST_DEFS).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTest(t.id)}
            className="rounded bg-slate-700 hover:bg-slate-600 px-4 py-2 text-white"
          >
            {t.name}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {candidates.map((id) => (
          <li key={id} className="rounded-lg border border-slate-600 bg-slate-800 p-3 flex flex-col gap-2">
            <span className="font-semibold text-slate-100">{speciesById[id].name}</span>
            <button
              type="button"
              onClick={() => onCommit(specimen.instanceId, id)}
              className="rounded bg-yellow-500 hover:bg-yellow-400 px-3 py-1 text-sm font-bold text-slate-900"
            >
              This is it
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Identify.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Identify.jsx src/features/rockhound/components/Identify.test.jsx
git commit -m "feat(rockhound): Identify candidate-board component"
```

---

### Task 7: Gemdex component (collection)

**Files:**
- Create: `src/features/rockhound/components/GemdexV5.jsx`
- Test: `src/features/rockhound/components/GemdexV5.test.jsx`

**Interfaces:**
- Consumes: `species` array (loader); props `{ species, gemdex, newlyDiscovered }`.
- Produces: presentational `GemdexV5` — one card per species. Discovered cards show the name, family, and a **NEW** badge when the id is in `newlyDiscovered`. Undiscovered cards show `???` and a hint (`Found in <depositType>` derived from `realWorldLocations[0]` or family). A `X / Y discovered` header.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/GemdexV5.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GemdexV5 from './GemdexV5.jsx';
import { species } from '../../../loaders/species.js';

describe('GemdexV5', () => {
  it('shows an X / Y discovered header', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={[]} />);
    screen.getByText(new RegExp(`1 / ${species.length}`));
  });

  it('reveals discovered species and hides undiscovered ones', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={[]} />);
    screen.getByText('Sapphire');
    // quartz not discovered → its name is not shown; a locked marker is
    expect(screen.queryByText('Clear Quartz')).toBeNull();
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
  });

  it('marks newly discovered species with a NEW badge', () => {
    render(<GemdexV5 species={species} gemdex={['sapphire']} newlyDiscovered={['sapphire']} />);
    screen.getByText('NEW');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexV5.test.jsx`
Expected: FAIL — cannot resolve `./GemdexV5.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/GemdexV5.jsx
export default function GemdexV5({ species, gemdex, newlyDiscovered }) {
  const discovered = new Set(gemdex);
  const isNew = new Set(newlyDiscovered);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-yellow-400">
        Gemdex <span className="text-slate-400 text-base font-normal">{discovered.size} / {species.length} discovered</span>
      </h2>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {species.map((s) => {
          const found = discovered.has(s.id);
          return (
            <li key={s.id} className="rounded-lg border border-slate-600 bg-slate-800 p-3 min-h-24 flex flex-col gap-1">
              {found ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{s.name}</span>
                    {isNew.has(s.id) && (
                      <span className="rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-slate-900">NEW</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{s.family} family</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-500">???</span>
                  <span className="text-xs text-slate-500">Found near {s.realWorldLocations[0]}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexV5.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/GemdexV5.jsx src/features/rockhound/components/GemdexV5.test.jsx
git commit -m "feat(rockhound): GemdexV5 collection component"
```

---

### Task 8: Rockhound shell + app wiring

**Files:**
- Create: `src/features/rockhound/components/Rockhound.jsx`
- Test: `src/features/rockhound/components/Rockhound.test.jsx`
- Modify: `src/constants.js` (add `ROCKHOUND: 'rockhound'` to `GAME_PHASES`)
- Modify: `src/App.jsx` (import `Rockhound`, add a render case)
- Modify: `src/shared/components/Menu.jsx` (add one nav button)

**Interfaces:**
- Consumes: `RockhoundProvider`, `useRockhound`, the four action types (Task 4); `Explore`, `Identify`, `GemdexV5` (Tasks 5–7); `localitiesById`, `speciesById` (loaders).
- Produces: `Rockhound` — wraps its subtree in `RockhoundProvider`; renders internal tabs **Explore | Identify | Gemdex**; wires context state/dispatch into the presentational components. Explore uses `localitiesById.hidden_creek`. Identify operates on the first rough on the bench (or a prompt if none).

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/Rockhound.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Rockhound from './Rockhound.jsx';

describe('Rockhound shell', () => {
  beforeEach(() => localStorage.clear());

  it('renders the three tabs and defaults to Explore', () => {
    render(<Rockhound />);
    screen.getByRole('button', { name: /Explore/i });
    screen.getByRole('button', { name: /Identify/i });
    screen.getByRole('button', { name: /Gemdex/i });
    screen.getByText('Hidden Creek');
  });

  it('panning then switching to Identify shows a rough to work on', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Pan the/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    // A suspects counter proves an Identify session is active on a real rough.
    screen.getByText(/SUSPECTS:/);
  });

  it('shows an empty-bench prompt in Identify when there is no rough', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/no rough/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — cannot resolve `./Rockhound.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/Rockhound.jsx
import { useState } from 'react';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY } from '../RockhoundContext.jsx';
import { localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import GemdexV5 from './GemdexV5.jsx';

const TABS = ['Explore', 'Identify', 'Gemdex'];
const STARTER_LOCALITY = localitiesById.hidden_creek;

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');

  const activeRough = state.rough[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-2 border-b border-slate-700 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-4 py-2 font-semibold ${tab === t ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Explore' && (
        <Explore
          locality={STARTER_LOCALITY}
          roughCount={state.rough.length}
          onCollect={(specimen) => dispatch({ type: ADD_ROUGH, payload: specimen })}
        />
      )}

      {tab === 'Identify' && (
        activeRough ? (
          <Identify
            key={activeRough.instanceId}
            specimen={activeRough}
            locality={localitiesById[activeRough.origin] ?? STARTER_LOCALITY}
            speciesById={speciesById}
            testMastery={state.testMastery}
            onRunTest={(testId, score) => dispatch({ type: RECORD_TEST_SCORE, payload: { testId, score } })}
            onCommit={(instanceId, guessId) => dispatch({ type: COMMIT_IDENTIFY, payload: { instanceId, guessId } })}
          />
        ) : (
          <p className="text-slate-400">Your bench has no rough — pan a locality in Explore first.</p>
        )
      )}

      {tab === 'Gemdex' && (
        <GemdexV5 species={species} gemdex={state.gemdex} newlyDiscovered={state.newlyDiscovered} />
      )}
    </div>
  );
}

export default function Rockhound() {
  return (
    <RockhoundProvider>
      <RockhoundInner />
    </RockhoundProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire into the app**

In `src/constants.js`, add the phase to the `GAME_PHASES` object (keep existing entries):

```javascript
export const GAME_PHASES = {
  MENU: 'menu',
  DISCOVER: 'discover',
  PROCESS: 'process',
  CRAFT: 'craft',
  SELL: 'sell',
  MINIGAME: 'minigame',
  TIER_1_B: 'TIER_1_B',
  ROCKHOUND: 'rockhound'
};
```

In `src/App.jsx`, add the import near the other feature imports:

```jsx
import Rockhound from './features/rockhound/components/Rockhound';
```

and add a case inside the `switch (state.phase)` block (before `default:`):

```jsx
    case 'rockhound':
      phaseContent = <Rockhound />;
      break;
```

In `src/shared/components/Menu.jsx`, the nav is data-driven by the `menuButtons` array. Add `FaMountain` to the `react-icons/fa` import and append one entry to `menuButtons`:

```jsx
import { FaSearch, FaCog, FaGem, FaDollarSign, FaBook, FaBriefcase, FaMountain } from 'react-icons/fa';

const menuButtons = [
  { label: 'Discover', phase: GAME_PHASES.DISCOVER, Icon: FaSearch },
  { label: 'Process', phase: GAME_PHASES.PROCESS, Icon: FaCog },
  { label: 'Craft', phase: GAME_PHASES.CRAFT, Icon: FaGem },
  { label: 'Sell', phase: GAME_PHASES.SELL, Icon: FaDollarSign },
  { label: 'Gemdex', phase: 'gemdex', Icon: FaBook },
  { label: 'Inventory', phase: 'inventory', Icon: FaBriefcase },
  { label: 'Rockhound', phase: 'rockhound', Icon: FaMountain }
];
```

The existing `handleNavigation`/`SET_PHASE` dispatch already routes any `phase` string, so no other change is needed. (`FaMountain` ships with `react-icons/fa`.)

- [ ] **Step 6: Verify the whole slice + build**

Run: `./node_modules/.bin/vitest run` (full unit suite)
Expected: PASS — all foundation + rockhound tests green.

Run: `./node_modules/.bin/vite build`
Expected: `✓ built` with no errors.

- [ ] **Step 7: Manual smoke (optional but recommended)**

Run: `./node_modules/.bin/vite --port 5173`, open `http://localhost:5173`, click **Rockhound (v5)** in the menu, Pan a few times, switch to Identify, run tests until one suspect remains, commit, and confirm the species appears in Gemdex with a NEW badge and reputation increased. Verify no console errors.

- [ ] **Step 8: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx src/constants.js src/App.jsx src/shared/components/Menu.jsx
git commit -m "feat(rockhound): shell, tab nav, and app wiring for the vertical slice"
```

---

## Notes for the implementer

- **Read the data first.** `src/data/species.yaml` and `src/data/localities.yaml` define the exact ids used in tests (`quartz`, `sapphire`, `fluorite`, `hidden_creek`, …). Do not invent ids.
- **Determinism.** All randomness flows through an injectable `rng`. Tests pass stubs (`() => 0`, `() => 1`). Never call `Math.random` directly inside logic functions — take `rng` as a parameter.
- **No jest-dom.** Assert presence with `getByText`/`getByRole` (throws on miss), absence with `queryByText(...) === null` / `.toBeNull()`.
- **Isolation.** If you feel tempted to reuse a legacy reducer action or inventory helper, don't — this slice is deliberately standalone so it can be validated and iterated without legacy coupling.

## Known simplifications (documented, intentional for the slice)

- The test minigame's live-play is `0.6 + rng()*0.4`; the animated steady-hand bar and the visual reading gauges (GDD §6.3) are fast-follows.
- Free-observation pre-filtering, instruments, Lab Prep, familiarity, and the Lab Assistant (idle) are out of scope; candidates are seeded from the locality find pool only.
- Reading `center` equals the true property value (no measurement jitter); precision is expressed purely through band width. Jitter is a later enhancement.
- Cutting, stats/traits, economy, and gem shows are later sub-projects per the GDD build order.
