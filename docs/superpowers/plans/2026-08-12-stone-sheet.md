# The Stone Sheet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One sheet per stone carrying every trait — diagnostic and quality — so nothing appears in Cut or Market that the player did not measure, with a bench they can navigate and a ladder they can watch fill in.

**Architecture:** Grading observations join the existing reading model as a second *axis*: diagnostics identify a stone, quality grades it, and only diagnostics narrow the species list. Measured quality then drives value, with an unmeasured trait counting as its worst case. Tasks are ordered so 1–6 are coherent on their own; the value change lands last.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Zod-validated YAML, React Context + useReducer, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-11-stone-sheet-design.md`

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Native Vitest matchers and raw DOM reads only (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **`getByText` matches an element by its direct child text nodes joined**, not full `textContent`. Prefer `getByRole` / `getByLabelText` with distinct accessible names.
- **Rules modules own formulas; view modules delegate and never restate one.** Seven such violations have been caught in this project — the most recurrent defect class here. `tests.js`, `precision.js`, `grading.js`, `market.js` own rules; `identifyView.js`, `marketView.js`, `cutView.js` delegate.
- **The reducer must stay pure.** No `Date.now()` and no `Math.random()` inside `rockhoundReducer` or its helpers, not even as a fallback.
- **Never write a test that passes when the behaviour is removed.** After writing a test, stub the behaviour and confirm it fails.
- No inline magic numbers: every tuned value is a named constant, exported only if another module or a test needs it.
- When adding to an import from a path a file already imports, **extend the existing line** — a second `import` from the same path is a duplicate-binding `SyntaxError`.
- The suite is green at **532 tests** before this plan starts. It must be green at every commit.

## What the playtest found, and what fixes it

Four reports, one cause: the player fills three rows of a sheet, the stone vanishes, and a *different* sheet with three *different* rows appears in another tab.

| Report | Cause | Task |
| --- | --- | --- |
| Only one stone reachable | `Rockhound.jsx` renders `state.rough[0]`, no selector | 7 |
| Tests behave inconsistently | resolution is invisible — the stone silently teleports | 7 |
| Cut's stats don't correlate with Identify's tests | quality traits are rolled at extraction and never measured | 1–3, 8 |
| No visible ladder | only one transition exists: unidentified → identified | 4, 6 |

## Two facts verified against the real data — trust these

- **The variety rung does not exist.** In all four multi-variety families (quartz, garnet, corundum, beryl) the varieties have **completely disjoint hues**, and hue is free. So the instant diagnostics settle the family, the free hue has already settled the variety. `Graded` replaces `variety` as the real second rung.
- **The worst-case substitution gives exactly a 3× swing.** `roughGradeFactor` runs 0.5 (everything unmeasured) to 1.5 (everything perfect). No new discount constant is needed.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/features/rockhound/logic/precision.js` | *modify* — `BASE_ERROR` gains grading entries |
| `src/features/rockhound/logic/tests.js` | *modify* — `GRADE_DEFS`, `runGrading`, reading `axis`, consistency uses diagnostics only |
| `src/features/rockhound/logic/grading.js` | *create* — measured quality with worst-case substitution; `isGraded` |
| `src/features/rockhound/logic/rungs.js` | *create* — `stoneRung`, the ladder |
| `src/features/rockhound/RockhoundContext.jsx` | *modify* — `REVEAL_TRAIT` handles both axes; works on rough *and* identified |
| `src/features/rockhound/logic/identifyView.js` | *modify* — two sections, the rung, the bench strip |
| `src/features/rockhound/components/Identify.jsx` | *rewrite* — the sheet |
| `src/features/rockhound/components/Rockhound.jsx` | *modify* — bench selection replaces `rough[0]` |
| `src/features/rockhound/logic/market.js` | *modify* — value from measured quality, plus carat |
| `src/features/rockhound/logic/marketView.js`, `components/Cut.jsx` | *modify* — show unmeasured as unmeasured |

---

### Task 1: Grading observations

Quality traits become things you measure. The key difference from a diagnostic test: a grading observation reads the **specimen**, not the species — every corundum has SG 4.00, but *this* stone's carat is its own.

**Files:**
- Modify: `src/features/rockhound/logic/precision.js`
- Modify: `src/features/rockhound/logic/tests.js`
- Modify: `src/features/rockhound/logic/tests.test.js`

**Interfaces:**
- Consumes: `bandWidth` from `precision.js`
- Produces:
  - `BASE_ERROR` gains `colorGrade: 5` and `clarity: 5`
  - `GRADE_DEFS` — `{ weigh, colour, clarity }`, each `{ id, name, kind, property }`
  - `runGrading(gradeId, specimen, { mastery, livePlay }) -> reading`
  - every reading carries `axis: 'diagnostic' | 'quality'`

**Why carat is exact and the other two are not:** a scale reads 1.52 ct and that is that. Colour and clarity are judgment calls under a loupe, so they carry a band that narrows as mastery improves — which makes mastery matter for value as well as identity.

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/tests.test.js`. Add `GRADE_DEFS, runGrading` to the **existing** `./tests.js` import line:

```js
describe('grading observations', () => {
  const stone = { caratWeight: 1.52, colorGrade: 78, clarity: 64 };

  it('weighs carat exactly, because a scale is exact', () => {
    const r = runGrading('weigh', stone, { mastery: 0, livePlay: 0.6 });
    expect(r.value).toBe(1.52);
    expect(r.band).toBeUndefined();
  });

  it('grades colour and clarity with uncertainty, because they are judgment calls', () => {
    const c = runGrading('colour', stone, { mastery: 50, livePlay: 1 });
    expect(c.center).toBe(78);
    expect(c.band).toBeGreaterThan(0);
  });

  it('grades more precisely as mastery rises', () => {
    const novice = runGrading('colour', stone, { mastery: 0, livePlay: 1 });
    const expert = runGrading('colour', stone, { mastery: 100, livePlay: 1 });
    expect(expert.band).toBeLessThan(novice.band);
  });

  it('reads the specimen, not the species', () => {
    // Every corundum has the same specific gravity, but this stone's carat is
    // its own — that is the whole difference between the two axes.
    const heavy = runGrading('weigh', { ...stone, caratWeight: 4.1 }, { mastery: 0, livePlay: 1 });
    expect(heavy.value).toBe(4.1);
  });

  it('tags every reading with the axis it belongs to', () => {
    expect(runGrading('weigh', stone, { mastery: 0, livePlay: 1 }).axis).toBe('quality');
    expect(runTest('scratch', speciesById.ruby, { mastery: 0, livePlay: 1 }).axis).toBe('diagnostic');
  });
});

describe('only diagnostics narrow the species list', () => {
  it('ignores a quality reading when deciding what a stone could be', () => {
    // A heavy stone is not a different mineral. If grading narrowed the list,
    // measuring carat would appear to identify things.
    const pool = ['ruby', 'sapphire', 'spinel'];
    const quality = [{ testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 4.1 }];
    expect(consistentSpecies(pool, speciesById, quality).sort()).toEqual([...pool].sort());
  });

  it('still narrows on a diagnostic reading alongside a quality one', () => {
    const mixed = [
      { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 4.1 },
      { testId: 'hue', axis: 'diagnostic', kind: 'hue', value: 'red' }
    ];
    expect(consistentSpecies(['ruby', 'aquamarine'], speciesById, mixed)).toEqual(['ruby']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js`
Expected: FAIL — `runGrading is not a function`

- [ ] **Step 3: Add the grading base errors**

In `src/features/rockhound/logic/precision.js`, extend `BASE_ERROR`:

```js
// Hardness and specific gravity are instrument readings on small scales.
// Colour and clarity are eye judgments on a 0-100 grade, so 5 points is a
// sharp grade and — divided by the 0.1 mastery floor — 50 points is a
// novice's, which is as good as no opinion at all.
export const BASE_ERROR = {
  hardness: 0.5,
  specificGravity: 0.3,
  colorGrade: 5,
  clarity: 5
};
```

Keep the existing key order and any surrounding comment; only the two new entries are added.

- [ ] **Step 4: Add grading to `tests.js`**

In `src/features/rockhound/logic/tests.js`, add after `TEST_DEFS`:

```js
/**
 * Grading observations. Unlike a diagnostic test, these read the SPECIMEN
 * rather than its species: every corundum has the same specific gravity, but
 * this stone's carat is its own. They say what a stone is worth, never what
 * it is.
 */
export const GRADE_DEFS = {
  weigh: { id: 'weigh', name: 'Weigh', kind: 'quality-exact', property: 'caratWeight' },
  colour: { id: 'colour', name: 'Grade Colour', kind: 'quality-band', property: 'colorGrade' },
  clarity: { id: 'clarity', name: 'Grade Clarity', kind: 'quality-band', property: 'clarity' }
};

export function runGrading(gradeId, specimen, { mastery, livePlay }) {
  const def = GRADE_DEFS[gradeId];
  if (def.kind === 'quality-exact') {
    return { testId: def.id, axis: 'quality', kind: def.kind, property: def.property, value: specimen[def.property] };
  }
  return {
    testId: def.id,
    axis: 'quality',
    kind: def.kind,
    property: def.property,
    center: specimen[def.property],
    band: bandWidth({ property: def.property, mastery, livePlay })
  };
}
```

Tag diagnostic readings too — in `runTest`, add `axis: 'diagnostic'` to both returned objects.

Then make consistency explicit about which axis it reads:

```js
/** Every candidate still consistent with everything observed so far. Quality
 *  readings are skipped: a heavy stone is not a different mineral. */
export function consistentSpecies(candidateIds, speciesById, readings) {
  const diagnostics = readings.filter((r) => r.axis !== 'quality');
  return candidateIds.filter((id) =>
    diagnostics.every((r) => consistentWithSpecies(speciesById[id], r))
  );
}
```

The free observations built by `revealedReadings` in `traits.js` carry no `axis` today; `r.axis !== 'quality'` treats them as diagnostic, which is correct. Add `axis: 'diagnostic'` to both of them in `traits.js` anyway, so the field is never absent.

- [ ] **Step 5: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — 532 existing plus 7 new.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/logic/precision.js src/features/rockhound/logic/tests.js src/features/rockhound/logic/tests.test.js src/features/rockhound/logic/traits.js
git commit -m "feat(identify): grading observations read the specimen, not the species"
```

---

### Task 2: Measured quality, and the worst case

**Files:**
- Create: `src/features/rockhound/logic/grading.js`
- Test: `src/features/rockhound/logic/grading.test.js`

**Interfaces:**
- Consumes: `GRADE_DEFS` (Task 1)
- Produces:
  - `measuredQuality(specimen) -> { caratWeight, colorGrade, clarity }` — the value for each, or its worst case when unmeasured
  - `isGraded(specimen) -> boolean`
  - `gradedCount(specimen) -> number`
  - `WORST_CASE` — the value an unmeasured trait counts as

**The rule this encodes:** a buyer cannot verify what you have not measured, so they assume the worst. This needs no new discount constant — substituting the floor into the existing grade formula *is* the discount.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/grading.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { measuredQuality, isGraded, gradedCount, WORST_CASE } from './grading.js';

const weighed = { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 };
const colour = { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 };
const clarity = { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 64, band: 5 };
const stone = (revealed = {}) => ({ caratWeight: 2.4, colorGrade: 78, clarity: 64, revealed });

describe('measuredQuality', () => {
  it('counts an unmeasured trait as its worst case', () => {
    // The buyer cannot verify what you have not measured, so they assume the
    // worst. This substitution IS the ungraded discount.
    const q = measuredQuality(stone());
    expect(q.colorGrade).toBe(WORST_CASE);
    expect(q.clarity).toBe(WORST_CASE);
    expect(q.caratWeight).toBe(WORST_CASE);
  });

  it('uses the real value once measured', () => {
    const q = measuredQuality(stone({ weigh: weighed, colour, clarity }));
    expect(q.caratWeight).toBe(2.4);
    expect(q.colorGrade).toBe(78);
    expect(q.clarity).toBe(64);
  });

  it('takes the centre of an uncertain grade, not its edges', () => {
    // The player's best estimate is what a buyer trades on.
    expect(measuredQuality(stone({ colour })).colorGrade).toBe(78);
  });

  it('substitutes only the traits that are missing', () => {
    const q = measuredQuality(stone({ weigh: weighed }));
    expect(q.caratWeight).toBe(2.4);
    expect(q.colorGrade).toBe(WORST_CASE);
  });

  it('never reads the true value of an unmeasured trait', () => {
    // The whole point: a stone with a superb colour the player has not graded
    // must be worth no more than one with a terrible colour they have not graded.
    const superb = measuredQuality({ caratWeight: 5, colorGrade: 99, clarity: 99, revealed: {} });
    const awful = measuredQuality({ caratWeight: 0.1, colorGrade: 3, clarity: 3, revealed: {} });
    expect(superb).toEqual(awful);
  });
});

describe('isGraded', () => {
  it('is false until every quality trait is measured', () => {
    expect(isGraded(stone())).toBe(false);
    expect(isGraded(stone({ weigh: weighed }))).toBe(false);
    expect(isGraded(stone({ weigh: weighed, colour }))).toBe(false);
  });

  it('is true once all three are measured', () => {
    expect(isGraded(stone({ weigh: weighed, colour, clarity }))).toBe(true);
  });

  it('ignores diagnostic readings — grading is its own axis', () => {
    const withDiagnostics = stone({ scratch: { testId: 'scratch', axis: 'diagnostic', kind: 'numeric', center: 9, band: 0.5 } });
    expect(isGraded(withDiagnostics)).toBe(false);
  });
});

describe('gradedCount', () => {
  it('counts how many quality traits are measured', () => {
    expect(gradedCount(stone())).toBe(0);
    expect(gradedCount(stone({ weigh: weighed, colour }))).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/grading.test.js`
Expected: FAIL — `Failed to resolve import "./grading.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/grading.js`:

```js
import { GRADE_DEFS } from './tests.js';

// What a stone is worth rests on what the player has actually measured. A
// buyer cannot verify an ungraded trait, so they assume the worst — and that
// substitution is the entire ungraded discount. No separate constant exists
// or is needed.

/** What an unmeasured quality trait counts as. */
export const WORST_CASE = 0;

const readingValue = (reading) =>
  reading.kind === 'quality-exact' ? reading.value : reading.center;

/**
 * Each quality trait as the market sees it: the measured value where one
 * exists, the worst case where none does. Never reads the specimen's true
 * value for an unmeasured trait — that is the point.
 */
export function measuredQuality(specimen) {
  const revealed = specimen.revealed ?? {};
  return Object.fromEntries(
    Object.values(GRADE_DEFS).map((def) => [
      def.property,
      revealed[def.id] ? readingValue(revealed[def.id]) : WORST_CASE
    ])
  );
}

export function gradedCount(specimen) {
  const revealed = specimen.revealed ?? {};
  return Object.values(GRADE_DEFS).filter((def) => revealed[def.id]).length;
}

export function isGraded(specimen) {
  return gradedCount(specimen) === Object.keys(GRADE_DEFS).length;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/grading.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/grading.js src/features/rockhound/logic/grading.test.js
git commit -m "feat(identify): measured quality, with the worst case standing in for what is unknown"
```

---

### Task 3: The ladder

**Files:**
- Create: `src/features/rockhound/logic/rungs.js`
- Test: `src/features/rockhound/logic/rungs.test.js`

**Interfaces:**
- Consumes: `isGraded` (Task 2)
- Produces: `RUNGS` (ordered ids), `stoneRung(specimen, identified) -> 'unidentified' | 'identified' | 'graded'`, `rungLabel(rung) -> string`

**Why there is no `variety` rung:** verified across all four multi-variety families — the varieties have completely disjoint hues, and hue is free. The instant diagnostics settle the family, the free hue has already settled the variety. `graded` is the real second rung.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/rungs.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { RUNGS, stoneRung, rungLabel } from './rungs.js';

const graded = {
  weigh: { testId: 'weigh', kind: 'quality-exact', property: 'caratWeight', value: 2 },
  colour: { testId: 'colour', kind: 'quality-band', property: 'colorGrade', center: 70, band: 5 },
  clarity: { testId: 'clarity', kind: 'quality-band', property: 'clarity', center: 70, band: 5 }
};

describe('stoneRung', () => {
  it('starts unidentified', () => {
    expect(stoneRung({ revealed: {} }, false)).toBe('unidentified');
  });

  it('reaches identified without any grading', () => {
    // Knowing what a stone IS and knowing what it is WORTH are separate axes.
    // A fully identified, completely ungraded stone is a normal state.
    expect(stoneRung({ revealed: {} }, true)).toBe('identified');
  });

  it('reaches graded only once identified as well', () => {
    // Grading an unidentified stone does not promote it — you cannot price
    // what you cannot name.
    expect(stoneRung({ revealed: graded }, false)).toBe('unidentified');
    expect(stoneRung({ revealed: graded }, true)).toBe('graded');
  });

  it('does not promote on partial grading', () => {
    const partial = { revealed: { weigh: graded.weigh, colour: graded.colour } };
    expect(stoneRung(partial, true)).toBe('identified');
  });
});

describe('RUNGS', () => {
  it('is ordered from least to most known', () => {
    expect(RUNGS).toEqual(['unidentified', 'identified', 'graded']);
  });

  it('gives every rung a player-facing label', () => {
    for (const r of RUNGS) expect(rungLabel(r).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rungs.test.js`
Expected: FAIL — `Failed to resolve import "./rungs.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/rungs.js`:

```js
import { isGraded } from './grading.js';

// How completely a stone is known. There is deliberately no `variety` rung:
// in all four multi-variety families the varieties have disjoint hues, and hue
// is free — so the instant the diagnostics settle the family, the free hue has
// already settled the variety. Ruby versus sapphire IS red versus blue.
// `graded` is the real second rung, and it is the one that makes measuring
// quality worth doing.

export const RUNGS = ['unidentified', 'identified', 'graded'];

const LABELS = {
  unidentified: 'Unidentified',
  identified: 'Identified',
  graded: 'Graded'
};

export function rungLabel(rung) {
  return LABELS[rung] ?? rung;
}

/** You cannot price what you cannot name, so grading never promotes an
 *  unidentified stone. */
export function stoneRung(specimen, identified) {
  if (!identified) return 'unidentified';
  return isGraded(specimen) ? 'graded' : 'identified';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rungs.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/rungs.js src/features/rockhound/logic/rungs.test.js
git commit -m "feat(identify): the ladder — unidentified, identified, graded"
```

---

### Task 4: The reducer measures both axes, on any stone

Today `REVEAL_TRAIT` only runs diagnostic tests and only finds stones in `state.rough`. Grading has to work on identified stones too — you grade a stone before selling or cutting it, and by then it has left the rough pile.

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Modify: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `GRADE_DEFS`, `runGrading` (Task 1)
- Produces: `REVEAL_TRAIT { instanceId, testId, byHand }` now accepts a grading id as well as a test id, and finds the stone in either `rough` or `identified`

**Two rules that must hold:**
- **Grading never resolves identity.** Only diagnostics narrow the species list, so measuring carat must never move a stone off the bench.
- **The reducer stays pure.** `runGrading` is deterministic given `livePlay`, exactly like `runTest` — nothing random inside.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/rockhound/RockhoundContext.test.js`:

```js
describe('grading through the reducer', () => {
  const rough = {
    instanceId: 'g1', stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
    caratWeight: 2.4, clarity: 64, colorGrade: 78, origin: 'hidden_creek',
    foundDepth: 1, form: 'waterworn', hue: 'colorless', revealed: {}
  };
  const identified = { ...rough, instanceId: 'g2', stage: 'identified', identifiedAs: 'quartz' };

  it('records a grading reading on a stone still on the bench', () => {
    const next = rockhoundReducer({ ...initialRockhoundState, rough: [rough] }, {
      type: REVEAL_TRAIT, payload: { instanceId: 'g1', testId: 'weigh', byHand: true }
    });
    expect(next.rough[0].revealed.weigh.value).toBe(2.4);
  });

  it('grades a stone that has already been identified', () => {
    // You grade a stone before selling or cutting it, and by then it has left
    // the rough pile — so grading must reach the identified list too.
    const next = rockhoundReducer({ ...initialRockhoundState, identified: [identified] }, {
      type: REVEAL_TRAIT, payload: { instanceId: 'g2', testId: 'colour', byHand: true }
    });
    expect(next.identified[0].revealed.colour.center).toBe(78);
  });

  it('never resolves identity from a grading reading', () => {
    // A heavy stone is not a different mineral. If grading could resolve, then
    // weighing a stone would appear to identify it.
    const next = rockhoundReducer({ ...initialRockhoundState, rough: [rough] }, {
      type: REVEAL_TRAIT, payload: { instanceId: 'g1', testId: 'weigh', byHand: true }
    });
    expect(next.rough).toHaveLength(1);
    expect(next.identified).toHaveLength(0);
    expect(next.reputation).toBe(initialRockhoundState.reputation);
  });

  it('is deterministic, like every other reading', () => {
    const act = { type: REVEAL_TRAIT, payload: { instanceId: 'g1', testId: 'colour', byHand: true } };
    const base = { ...initialRockhoundState, rough: [rough] };
    expect(rockhoundReducer(base, act)).toEqual(rockhoundReducer(base, act));
  });

  it('grades more precisely by hand than by shortcut', () => {
    const base = { ...initialRockhoundState, rough: [rough] };
    const hand = rockhoundReducer(base, { type: REVEAL_TRAIT, payload: { instanceId: 'g1', testId: 'colour', byHand: true } });
    const auto = rockhoundReducer(base, { type: REVEAL_TRAIT, payload: { instanceId: 'g1', testId: 'colour', byHand: false } });
    expect(hand.rough[0].revealed.colour.band).toBeLessThan(auto.rough[0].revealed.colour.band);
  });

  it('ignores a stone that is on neither list', () => {
    const base = { ...initialRockhoundState, rough: [rough] };
    const next = rockhoundReducer(base, { type: REVEAL_TRAIT, payload: { instanceId: 'nope', testId: 'weigh', byHand: true } });
    expect(next).toBe(base);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'value')`

- [ ] **Step 3: Implement**

In `src/features/rockhound/RockhoundContext.jsx`, extend the existing `./logic/tests.js` import with `GRADE_DEFS, runGrading`.

Replace the `REVEAL_TRAIT` case with:

```js
    case REVEAL_TRAIT: {
      const { instanceId, testId, byHand } = action.payload;
      // Grading reaches identified stones too: you grade a stone before
      // selling or cutting it, and by then it has left the rough pile.
      const onBench = state.rough.find((r) => r.instanceId === instanceId);
      const specimen = onBench ?? state.identified.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;

      const trueSpecies = speciesById[specimen.trueSpeciesId];
      const livePlay = byHand ? HAND_LIVE_PLAY : AUTO_LIVE_PLAY;
      const mastery = state.testMastery[testId] ?? 0;
      const reading = GRADE_DEFS[testId]
        ? runGrading(testId, specimen, { mastery, livePlay })
        : runTest(testId, trueSpecies, {
            mastery,
            livePlay,
            familiarity: familiarityFactor(trueSpecies.family, completedFamilies(species, state.gemdex))
          });

      const updated = { ...specimen, revealed: mergeReading(specimen.revealed, reading) };
      const gain = byHand ? MASTERY_PER_HAND_RUN : MASTERY_PER_AUTO_RUN;
      const swap = (list) => list.map((r) => (r.instanceId === instanceId ? updated : r));
      const withReading = {
        ...state,
        rough: onBench ? swap(state.rough) : state.rough,
        identified: onBench ? state.identified : swap(state.identified),
        testMastery: {
          ...state.testMastery,
          [testId]: Math.min(MASTERY_CEILING, mastery + gain)
        }
      };

      // Identity emerges from diagnostics only — a heavy stone is not a
      // different mineral, so grading can never move a stone off the bench.
      if (!onBench || GRADE_DEFS[testId]) return withReading;
      return stillConsistent(updated).length === 1
        ? resolveSpecimen(withReading, updated)
        : withReading;
    }
```

`initialRockhoundState.testMastery` covers only the three diagnostic tests; the `?? 0` above means a grading id starts at zero without any change to the initial state.

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(identify): grade any stone, on the bench or already identified"
```

---

### Task 5: The sheet's shape

**Files:**
- Modify: `src/features/rockhound/logic/identifyView.js`
- Modify: `src/features/rockhound/logic/identifyView.test.js`

**Interfaces:**
- Consumes: `GRADE_DEFS` (Task 1), `gradedCount` (Task 2), `stoneRung`, `rungLabel` (Task 3)
- Produces:
  - `traitPanel(specimen, species, speciesById, locality, identified)` now returns `{ diagnostics, qualities, consistent, resolved, rung, rungLabel }`
  - `benchStrip(stones, speciesById) -> Array<{ instanceId, speciesId, hue, rung, measured, total }>`

**Constraint:** this is a view module. Every number comes from `tests.js`, `traits.js`, `grading.js` or `rungs.js`. Seven violations of that boundary have been caught here; a reviewer will look for a restated formula.

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/identifyView.test.js`:

```js
describe('the sheet has two sections', () => {
  const s = stone();

  it('separates what identifies a stone from what grades it', () => {
    // The distinction is the answer to "why don't Cut's stats match the tests":
    // diagnostics identify, grades appraise.
    const p = panel(s);
    expect(p.diagnostics.map((r) => r.id)).toEqual(['hue', 'transparency', 'scratch', 'heft', 'uv']);
    expect(p.qualities.map((r) => r.id)).toEqual(['weigh', 'colour', 'clarity']);
  });

  it('shows an ungraded quality row as unmeasured', () => {
    const row = panel(s).qualities.find((r) => r.id === 'weigh');
    expect(row.measured).toBe(false);
    expect(row.value).toBe(null);
  });

  it('shows an exact grade without an uncertainty', () => {
    const measured = stone({
      revealed: { weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 } }
    });
    const row = panel(measured).qualities.find((r) => r.id === 'weigh');
    expect(row.value).toBe(2.4);
    expect(row.uncertainty).toBe(null);
  });

  it('shows an uncertain grade with its band', () => {
    const measured = stone({
      revealed: { colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 } }
    });
    const row = panel(measured).qualities.find((r) => r.id === 'colour');
    expect(row.value).toBe(78);
    expect(row.uncertainty).toBe(5);
  });
});

describe('the sheet reports which rung a stone is on', () => {
  it('is unidentified before the diagnostics settle it', () => {
    expect(panelAt(stone(), false).rung).toBe('unidentified');
  });

  it('is identified but ungraded once named', () => {
    expect(panelAt(stone(), true).rung).toBe('identified');
  });

  it('carries a label the screen can render', () => {
    expect(panelAt(stone(), true).rungLabel.length).toBeGreaterThan(0);
  });
});

describe('benchStrip', () => {
  const a = { instanceId: 'a', trueSpeciesId: 'quartz', hue: 'colorless', revealed: {}, identifiedAs: null };
  const b = { instanceId: 'b', trueSpeciesId: 'ruby', hue: 'red', revealed: {}, identifiedAs: 'ruby' };

  it('lists every stone so the player can choose one', () => {
    // The playtest could only ever reach the head of the pile.
    expect(benchStrip([a, b], speciesById).map((e) => e.instanceId)).toEqual(['a', 'b']);
  });

  it('withholds the species of a stone not yet identified', () => {
    const [first] = benchStrip([a, b], speciesById);
    expect(first.speciesId).toBe(null);
    expect(first.hue).toBe('colorless');
  });

  it('names a stone that has been identified', () => {
    expect(benchStrip([a, b], speciesById)[1].speciesId).toBe('ruby');
  });

  it('shows how complete each sheet is', () => {
    const [first] = benchStrip([a, b], speciesById);
    expect(first.measured).toBe(0);
    expect(first.total).toBeGreaterThan(0);
  });
});
```

Add to the top of the file, beside the existing helpers:

```js
const panelAt = (s, identified) =>
  traitPanel(s, speciesById[s.trueSpeciesId], speciesById, localitiesById[s.origin], identified);
```

and extend the existing `panel` helper to pass `false` for `identified`. Add `benchStrip` to the existing `./identifyView.js` import.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/identifyView.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'map')`

- [ ] **Step 3: Implement**

Rewrite `src/features/rockhound/logic/identifyView.js`:

```js
import { TEST_DEFS, GRADE_DEFS, OBSERVED_TRAITS, consistentSpecies } from './tests.js';
import { revealedReadings } from './traits.js';
import { seedCandidates } from './candidates.js';
import { stoneRung, rungLabel } from './rungs.js';

// The stone sheet's shape. Every number comes from tests.js, traits.js,
// grading.js or rungs.js — this module decides what to show and what to call
// it, never how to compute it.

const RESOLVED_COUNT = 1;

const freeRow = (trait, reading) => ({
  id: trait.id,
  label: trait.name,
  free: true,
  measured: Boolean(reading),
  value: reading ? reading.value : null,
  uncertainty: null
});

const testRow = (def, reading) => ({
  id: def.id,
  label: def.name,
  free: false,
  measured: Boolean(reading),
  value: reading ? (reading.kind === 'numeric' ? reading.center : reading.key) : null,
  uncertainty: reading && reading.kind === 'numeric' ? reading.band : null
});

const gradeRow = (def, reading) => ({
  id: def.id,
  label: def.name,
  free: false,
  measured: Boolean(reading),
  value: reading ? (reading.kind === 'quality-exact' ? reading.value : reading.center) : null,
  uncertainty: reading && reading.kind === 'quality-band' ? reading.band : null
});

export function traitPanel(specimen, species, speciesById, locality, identified = false) {
  const readings = revealedReadings(specimen, species);
  const byId = Object.fromEntries(readings.map((r) => [r.testId, r]));

  const diagnostics = [
    ...Object.values(OBSERVED_TRAITS).map((t) => freeRow(t, byId[t.id])),
    ...Object.values(TEST_DEFS).map((d) => testRow(d, byId[d.id]))
  ];
  const qualities = Object.values(GRADE_DEFS).map((d) => gradeRow(d, byId[d.id]));

  const pool = locality
    ? seedCandidates(locality, specimen.foundDepth)
    : [specimen.trueSpeciesId];
  const consistent = consistentSpecies(pool, speciesById, readings);
  const rung = stoneRung(specimen, identified);

  return {
    diagnostics,
    qualities,
    consistent,
    resolved: consistent.length === RESOLVED_COUNT,
    rung,
    rungLabel: rungLabel(rung)
  };
}

/** Every stone the player can pick up, and how far each one has got. */
export function benchStrip(stones, speciesById) {
  const total = Object.keys(GRADE_DEFS).length + Object.keys(TEST_DEFS).length;
  return stones.map((s) => {
    const identified = Boolean(s.identifiedAs);
    const rung = stoneRung(s, identified);
    return {
      instanceId: s.instanceId,
      speciesId: identified ? s.trueSpeciesId : null,
      name: identified ? speciesById[s.trueSpeciesId]?.name ?? null : null,
      hue: s.hue,
      rung,
      rungLabel: rungLabel(rung),
      measured: Object.keys(s.revealed ?? {}).length,
      total
    };
  });
}
```

`measured` counts every reading the stone carries, diagnostic or quality, so the strip shows overall progress out of the six things there are to measure. Grading state reaches this module only through `stoneRung`, so `grading.js` is not imported here.

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. `traitPanel` no longer returns `rows`, so its existing tests must be updated to read `diagnostics` — retarget them rather than deleting, since they cover the free-observation and unmeasured cases.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/identifyView.js src/features/rockhound/logic/identifyView.test.js
git commit -m "feat(identify): the sheet's two sections, its rung, and the bench strip"
```

---

### Task 6: The sheet on screen

**Files:**
- Rewrite: `src/features/rockhound/components/Identify.jsx`
- Rewrite: `src/features/rockhound/components/Identify.test.jsx`

**Interfaces:**
- Consumes: `traitPanel` (Task 5)
- Produces: `<Identify specimen locality speciesById identified onReveal />`

**Three things the playtest asked for, all landing here:**
- The two sections are **labelled by what they are for** — diagnostics say what a stone is, grades say what it is worth. That labelling is the answer to "why don't Cut's stats match the tests?"
- The rung is shown, so the ladder is visible rather than implied.
- **"Run all" covers grading too.** Otherwise this adds three more presses per stone and reintroduces exactly the busywork the last increment removed.

- [ ] **Step 1: Write the failing test**

Replace `src/features/rockhound/components/Identify.test.jsx` entirely:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

const STONE = {
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble', foundDepth: 3,
  hue: 'red', caratWeight: 2.4, colorGrade: 78, clarity: 64, revealed: {}
};

function renderIdentify(over = {}) {
  const props = {
    specimen: STONE, locality: localitiesById.mogok_marble, speciesById,
    identified: false, onReveal: vi.fn(), ...over
  };
  render(<Identify {...props} />);
  return props;
}

describe('the stone sheet', () => {
  it('says what each section is for', () => {
    // The answer to "why don't Cut's stats match the tests": one kind of trait
    // identifies a stone, the other prices it.
    renderIdentify();
    screen.getByText(/what it is/i);
    screen.getByText(/what it is worth/i);
  });

  it('offers every diagnostic test and every grading observation', () => {
    renderIdentify();
    for (const name of [/scratch test/i, /heft in water/i, /uv light/i, /weigh/i, /grade colour/i, /grade clarity/i]) {
      screen.getByRole('button', { name: new RegExp(`measure ${name.source}`, 'i') });
    }
  });

  it('marks an ungraded quality row as unmeasured', () => {
    renderIdentify();
    expect(screen.getByLabelText(/^Weigh/i).textContent).toMatch(/not measured/i);
  });

  it('shows an exact weight without a plus-or-minus', () => {
    renderIdentify({ specimen: { ...STONE, revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 }
    } } });
    const row = screen.getByLabelText(/^Weigh/i).textContent;
    expect(row).toMatch(/2\.4/);
    expect(row).not.toMatch(/±/);
  });

  it('shows an uncertain grade with its plus-or-minus', () => {
    renderIdentify({ specimen: { ...STONE, revealed: {
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 }
    } } });
    const row = screen.getByLabelText(/^Grade Colour/i).textContent;
    expect(row).toMatch(/78/);
    expect(row).toMatch(/±/);
  });

  it('shows which rung the stone has reached', () => {
    renderIdentify();
    expect(screen.getByLabelText(/rung/i).textContent).toMatch(/unidentified/i);
  });

  it('says a stone is identified but not yet graded', () => {
    renderIdentify({ identified: true });
    expect(screen.getByLabelText(/rung/i).textContent).toMatch(/identified/i);
  });

  it('measures a single trait by hand when its button is pressed', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure grade colour/i }));
    expect(onReveal).toHaveBeenCalledWith('colour', true);
  });

  it('runs everything unmeasured at once, grading included', () => {
    // If run-all skipped grading, this would add three presses per stone and
    // reintroduce the busywork the previous increment removed.
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure everything/i }));
    const ids = onReveal.mock.calls.map((c) => c[0]).sort();
    expect(ids).toEqual(['clarity', 'colour', 'heft', 'scratch', 'uv', 'weigh']);
    expect(onReveal.mock.calls.every((c) => c[1] === false)).toBe(true);
  });

  it('has nothing left to run once everything is measured', () => {
    const all = {
      scratch: { testId: 'scratch', axis: 'diagnostic', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 },
      heft: { testId: 'heft', axis: 'diagnostic', kind: 'numeric', property: 'specificGravity', center: 4, band: 0.3 },
      uv: { testId: 'uv', axis: 'diagnostic', kind: 'categorical', property: 'fluorescence', key: 'red/none' },
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 64, band: 5 }
    };
    renderIdentify({ specimen: { ...STONE, revealed: all } });
    expect(screen.getByRole('button', { name: /measure everything/i }).disabled).toBe(true);
  });

  it('names who is still in the running', () => {
    renderIdentify();
    const readout = screen.getByLabelText(/still consistent/i).textContent;
    expect(readout).toMatch(/Ruby/);
    expect(readout).toMatch(/Spinel/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Identify.test.jsx`
Expected: FAIL — the current component renders one flat list and no rung.

- [ ] **Step 3: Implement**

Replace `src/features/rockhound/components/Identify.jsx` entirely:

```jsx
import { traitPanel } from '../logic/identifyView.js';

function TraitRow({ row, onReveal }) {
  const reading = row.measured
    ? row.uncertainty != null
      ? `${row.value} ± ${row.uncertainty}`
      : String(row.value)
    : '— not measured';

  return (
    <li className="flex items-center gap-3 border-b border-slate-800 py-2">
      <span className="w-40 shrink-0 text-xs uppercase tracking-wide text-slate-500">{row.label}</span>
      <span aria-label={`${row.label}: ${reading}`} className="flex-1 font-mono text-sm text-slate-200">
        {reading}
      </span>
      {row.free ? (
        <span className="w-24 shrink-0 text-right text-xs text-slate-600">observed</span>
      ) : (
        <button
          type="button"
          aria-label={`Measure ${row.label}`}
          onClick={() => onReveal(row.id, true)}
          className="w-24 shrink-0 rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
        >
          {row.measured ? 'Again' : 'Measure'}
        </button>
      )}
    </li>
  );
}

function Section({ title, blurb, rows, onReveal }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</h3>
      <p className="mb-1 text-xs text-slate-500">{blurb}</p>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <TraitRow key={row.id} row={row} onReveal={onReveal} />
        ))}
      </ul>
    </div>
  );
}

export default function Identify({ specimen, locality, speciesById, identified = false, onReveal }) {
  const species = speciesById[specimen.trueSpeciesId];
  const panel = traitPanel(specimen, species, speciesById, locality, identified);
  const unmeasured = [...panel.diagnostics, ...panel.qualities].filter((r) => !r.free && !r.measured);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">The stone sheet</h2>
        <span aria-label={`Rung: ${panel.rungLabel}`} className="rounded bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
          {panel.rungLabel}
        </span>
      </header>

      <Section
        title="What it is"
        blurb="Every stone of this mineral reads the same. These say what you are holding."
        rows={panel.diagnostics}
        onReveal={onReveal}
      />

      <Section
        title="What it is worth"
        blurb="These belong to this stone alone. A buyer assumes the worst until you measure them."
        rows={panel.qualities}
        onReveal={onReveal}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Measure everything"
          disabled={unmeasured.length === 0}
          onClick={() => unmeasured.forEach((r) => onReveal(r.id, false))}
          className={`rounded px-4 py-1.5 text-sm ${
            unmeasured.length === 0
              ? 'cursor-not-allowed bg-slate-800 text-slate-600'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          Measure everything
        </button>
        <span className="text-xs text-slate-600">
          Measuring by hand reads more precisely than measuring everything at once — and teaches you more.
        </span>
      </div>

      <p aria-label="Still consistent with" className="text-sm text-slate-400">
        <span className="text-slate-500">Consistent with: </span>
        {panel.consistent.map((id) => speciesById[id].name).join(', ')}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: FAIL in `Rockhound.test.jsx` only — the shell still passes the old prop shape and expects the old copy. Task 7 rewires it. Report those failures; do not patch the shell here.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Identify.jsx src/features/rockhound/components/Identify.test.jsx
git commit -m "feat(identify): the stone sheet, in two labelled sections with its rung"
```

---

### Task 7: A bench you can navigate, and a resolution you can see

The two UX reports from the playtest: only the head of the pile was reachable, and a stone silently teleported to Cut with no explanation.

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Rockhound.test.jsx`
- Create: `src/features/rockhound/components/BenchStrip.jsx`
- Create: `src/features/rockhound/components/BenchStrip.test.jsx`

**Interfaces:**
- Consumes: `benchStrip` (Task 5); `isGraded` (Task 2)
- Produces: `<BenchStrip entries selectedId onSelect />`

**What the bench holds:** every stone not yet at the top rung — unidentified rough *and* identified-but-ungraded stones. A stone drops off once it is Graded. That is what makes grading reachable at all, since an identified stone has left `state.rough`.

- [ ] **Step 1: Write the failing BenchStrip test**

Create `src/features/rockhound/components/BenchStrip.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BenchStrip from './BenchStrip.jsx';

const entries = [
  { instanceId: 'a', speciesId: null, name: null, hue: 'colorless', rung: 'unidentified', rungLabel: 'Unidentified', measured: 0, total: 6 },
  { instanceId: 'b', speciesId: 'ruby', name: 'Ruby', hue: 'red', rung: 'identified', rungLabel: 'Identified', measured: 4, total: 6 }
];

describe('BenchStrip', () => {
  it('offers every stone, not just the first', () => {
    // The playtest could only ever reach the head of the pile.
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('withholds the name of a stone not yet identified', () => {
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.queryByText('Ruby')).not.toBe(null);
    const unknown = screen.getAllByRole('button')[0];
    expect(unknown.textContent).toMatch(/colorless/i);
    expect(unknown.textContent).not.toMatch(/quartz/i);
  });

  it('shows how far each sheet has got', () => {
    render(<BenchStrip entries={entries} selectedId="a" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')[1].textContent).toMatch(/4\s*\/\s*6/);
  });

  it('marks which stone is being worked on', () => {
    render(<BenchStrip entries={entries} selectedId="b" onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('picks up a different stone when one is clicked', () => {
    const onSelect = vi.fn();
    render(<BenchStrip entries={entries} selectedId="a" onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('renders nothing when the bench is empty', () => {
    const { container } = render(<BenchStrip entries={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(container.textContent).toBe('');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/BenchStrip.test.jsx`
Expected: FAIL — cannot resolve `./BenchStrip.jsx`

- [ ] **Step 3: Implement the strip**

Create `src/features/rockhound/components/BenchStrip.jsx`:

```jsx
export default function BenchStrip({ entries, selectedId, onSelect }) {
  if (entries.length === 0) return null;

  return (
    <ul aria-label="Stones on your bench" className="flex flex-wrap gap-2">
      {entries.map((e) => {
        const selected = e.instanceId === selectedId;
        return (
          <li key={e.instanceId}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${e.name ?? `Unidentified ${e.hue} stone`}, ${e.rungLabel}, ${e.measured} of ${e.total} measured`}
              onClick={() => onSelect(e.instanceId)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                selected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <span className="block text-slate-100">{e.name ?? e.hue}</span>
              <span className="block text-slate-500">
                {e.rungLabel} · {e.measured} / {e.total}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Write the failing shell tests**

Append to `src/features/rockhound/components/Rockhound.test.jsx`:

```jsx
describe('the bench', () => {
  const stone = (over = {}) => ({
    instanceId: 'x', stage: 'rough', trueSpeciesId: 'quartz', identifiedAs: null,
    caratWeight: 1, clarity: 60, colorGrade: 60, origin: 'hidden_creek',
    foundDepth: 1, form: 'waterworn', hue: 'colorless', revealed: {}, ...over
  });

  it('lets the player choose between stones', () => {
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [stone({ instanceId: 'x1' }), stone({ instanceId: 'x2', hue: 'colorless' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    const bench = screen.getByLabelText(/stones on your bench/i);
    expect(bench.querySelectorAll('button')).toHaveLength(2);
  });

  it('keeps an identified but ungraded stone on the bench so it can be graded', () => {
    // An identified stone has left state.rough, so without this it would be
    // impossible to grade anything.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [],
      identified: [stone({ instanceId: 'y1', stage: 'identified', identifiedAs: 'quartz' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByRole('button', { name: /Clear Quartz, Identified/i });
  });

  it('drops a fully graded stone off the bench', () => {
    const graded = {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 1 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 60, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 60, band: 5 }
    };
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [],
      identified: [stone({ instanceId: 'y2', stage: 'identified', identifiedAs: 'quartz', revealed: graded })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    screen.getByText(/nothing on your bench/i);
  });

  it('announces a stone that has just been identified', () => {
    // The playtest saw stones teleport to Cut with no explanation.
    localStorage.setItem('rockhound_save_v1', JSON.stringify({
      rough: [stone({ instanceId: 'z1', trueSpeciesId: 'almandine_garnet', hue: 'red' })]
    }));
    renderRockhound();
    fireEvent.click(screen.getByRole('button', { name: /^Identify$/i }));
    fireEvent.click(screen.getByRole('button', { name: /measure scratch test/i }));
    expect(screen.getByRole('status').textContent).toMatch(/Almandine Garnet/);
  });
});
```

- [ ] **Step 5: Rewire the shell**

In `src/features/rockhound/components/Rockhound.jsx`:

Add imports:

```jsx
import BenchStrip from './BenchStrip.jsx';
import { benchStrip } from '../logic/identifyView.js';
import { isGraded } from '../logic/grading.js';
```

Replace `const activeRough = state.rough[0] ?? null;` with bench state. Put the `useState` beside the other `useState` calls at the top of `RockhoundInner`:

```jsx
  const [benchId, setBenchId] = useState(null);
  const [justResolved, setJustResolved] = useState(null);

  // The bench holds every stone not yet fully known: unidentified rough, and
  // identified stones still missing a grade. A stone drops off once Graded.
  const benchStones = [...state.rough, ...state.identified.filter((s) => !isGraded(s))];
  const activeRough = benchStones.find((s) => s.instanceId === benchId) ?? benchStones[0] ?? null;
```

Replace the `<Identify>` element and add the strip and the announcement:

```jsx
        activeRough ? (
          <div className="flex flex-col gap-4">
            <BenchStrip
              entries={benchStrip(benchStones, speciesById)}
              selectedId={activeRough.instanceId}
              onSelect={(id) => { setBenchId(id); setJustResolved(null); }}
            />
            {justResolved && (
              <p role="status" className="rounded border border-green-700 bg-green-950 p-3 text-sm text-green-200">
                That settles it — {speciesById[justResolved].name}. It is on your bench, ready to grade.
              </p>
            )}
            <Identify
              key={activeRough.instanceId}
              specimen={activeRough}
              locality={localitiesById[activeRough.origin]}
              speciesById={speciesById}
              identified={Boolean(activeRough.identifiedAs)}
              onReveal={(testId, byHand) =>
                dispatch({ type: REVEAL_TRAIT, payload: { instanceId: activeRough.instanceId, testId, byHand } })
              }
            />
          </div>
        ) : (
          <p className="text-slate-400">Nothing on your bench — dig at a locality first.</p>
        )
```

The announcement is **derived from state, never set inside `onReveal`** — otherwise it would fire on every measurement, including the ones that resolve nothing. Add this effect beside the existing `CLEAR_NEW` one:

```jsx
  useEffect(() => {
    // A stone the player was working on has left the rough pile: it resolved.
    if (benchId && state.identified.some((s) => s.instanceId === benchId)
        && !state.rough.some((s) => s.instanceId === benchId)) {
      const s = state.identified.find((x) => x.instanceId === benchId);
      setJustResolved(s.trueSpeciesId);
    }
  }, [state.rough, state.identified, benchId]);
```

Also update the existing empty-bench copy elsewhere in the file if it still reads "no rough", so both paths say the same thing.

- [ ] **Step 6: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. Earlier `Rockhound.test.jsx` cases assumed the old flat Identify screen; retarget them to the new copy rather than deleting, since several are the only end-to-end proof that identification reaches the reducer.

Run: `./node_modules/.bin/vite build`
Expected: `built in <n>ms`, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components/BenchStrip.jsx src/features/rockhound/components/BenchStrip.test.jsx src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(identify): a bench you can navigate, and a resolution you can see"
```

---

### Task 8: Value follows what was measured

The last task, and the one that gives grading its consequence. **A balance change:** ungraded stones lose value, and rough gains a carat term it never had.

**Files:**
- Modify: `src/features/rockhound/logic/market.js`
- Modify: `src/features/rockhound/logic/market.test.js`
- Modify: `src/features/rockhound/logic/marketView.js`
- Modify: `src/features/rockhound/components/Cut.jsx`
- Modify: `src/features/rockhound/components/Cut.test.jsx`

**Interfaces:**
- Consumes: `measuredQuality` (Task 2)
- Produces: `roughGradeFactor(specimen)` now reads measured quality and includes carat

**The carat term closes a known gap.** `identifiedValue` ignores `caratWeight` entirely today while `stoneValue` weights it — recorded as an open follow-up since the Cut increment. Folding carat into the same three-way average keeps the factor's range at 0.5–1.5, so the balance shift is carat mattering at all, not values inflating.

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/market.test.js`:

```js
describe('value follows what was measured', () => {
  const quartz = speciesById.quartz;
  const base = { trueSpeciesId: 'quartz', caratWeight: 5, colorGrade: 99, clarity: 99, form: 'fragment' };
  const fully = {
    weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 5 },
    colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 99, band: 5 },
    clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 99, band: 5 }
  };

  it('prices an ungraded stone at the floor', () => {
    // A buyer cannot verify what you have not measured, so they assume the
    // worst. This substitution IS the ungraded discount.
    expect(roughGradeFactor({ ...base, revealed: {} })).toBeCloseTo(0.5, 10);
  });

  it('prices a fully graded stone at what it is actually worth', () => {
    expect(roughGradeFactor({ ...base, revealed: fully })).toBeGreaterThan(1.4);
  });

  it('never rewards a fine stone the player has not graded', () => {
    // The whole point: an ungraded superb stone must be worth no more than an
    // ungraded terrible one.
    const superb = { ...base, revealed: {} };
    const awful = { trueSpeciesId: 'quartz', caratWeight: 0.1, colorGrade: 2, clarity: 2, form: 'fragment', revealed: {} };
    expect(roughGradeFactor(superb)).toBe(roughGradeFactor(awful));
  });

  it('lifts the price with each trait graded', () => {
    const one = { ...base, revealed: { weigh: fully.weigh } };
    const two = { ...base, revealed: { weigh: fully.weigh, colour: fully.colour } };
    expect(roughGradeFactor(two)).toBeGreaterThan(roughGradeFactor(one));
    expect(roughGradeFactor(one)).toBeGreaterThan(roughGradeFactor({ ...base, revealed: {} }));
  });

  it('weighs carat, which rough value used to ignore entirely', () => {
    const heavy = { ...base, caratWeight: 5, revealed: { weigh: fully.weigh } };
    const light = { ...base, caratWeight: 0.5, revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 0.5 }
    } };
    expect(roughGradeFactor(heavy)).toBeGreaterThan(roughGradeFactor(light));
  });

  it('keeps the factor inside its historic range', () => {
    // 0.5 to 1.5, so this changes what drives value without inflating it.
    expect(roughGradeFactor({ ...base, revealed: {} })).toBeGreaterThanOrEqual(0.5);
    expect(roughGradeFactor({ ...base, revealed: fully })).toBeLessThanOrEqual(1.5);
  });

  it('carries through to what a buyer pays', () => {
    const ungraded = identifiedValue({ ...base, revealed: {} }, quartz);
    const graded = identifiedValue({ ...base, revealed: fully }, quartz);
    expect(graded).toBeGreaterThan(ungraded);
  });
});
```

Add `roughGradeFactor` and `speciesById` to the existing imports in that file if they are not already there.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/market.test.js`
Expected: FAIL — the current factor reads the specimen's true colour and clarity, so an ungraded stone still prices high.

- [ ] **Step 3: Implement**

In `src/features/rockhound/logic/market.js`, add `import { measuredQuality } from './grading.js';` and replace `roughGradeFactor`:

```js
/** A carat saturates the scale at five, matching specimenScore's treatment. */
const CARAT_SATURATION = 5;
const QUALITY_AXES = 3;

/**
 * How much a stone's own qualities are worth to a buyer — using what the
 * player has MEASURED, not what the stone truly is. An unmeasured trait counts
 * as its worst case, because a buyer cannot verify it. That substitution is
 * the entire ungraded discount; there is no separate constant.
 *
 * Carat is included here. Rough value used to ignore it while cut value
 * weighted it, which was a long-standing inconsistency.
 */
export function roughGradeFactor(specimen) {
  const q = measuredQuality(specimen);
  const caratNorm = Math.min(q.caratWeight / CARAT_SATURATION, 1) * 100;
  return 0.5 + ((caratNorm + q.colorGrade + q.clarity) / QUALITY_AXES) / 100;
}
```

- [ ] **Step 4: Show unmeasured as unmeasured in Cut**

`Cut.jsx` renders `Meter` rows straight from `selected.caratWeight`, `selected.colorGrade` and `selected.clarity` — the stone's true values, which the player may not have measured. Change it to read measured quality, and mark an unmeasured row rather than showing a number:

```jsx
import { measuredQuality } from '../logic/grading.js';
import { GRADE_DEFS } from '../logic/tests.js';
```

Replace the three `Meter` lines with:

```jsx
              {Object.values(GRADE_DEFS).map((def) => {
                const measured = Boolean(selected.revealed?.[def.id]);
                const value = measuredQuality(selected)[def.property];
                return measured ? (
                  <Meter
                    key={def.id}
                    label={def.name.replace(/^Grade /, '')}
                    value={value}
                    max={def.property === 'caratWeight' ? 5 : 100}
                    unit={def.property === 'caratWeight' ? ' ct' : ''}
                  />
                ) : (
                  <p key={def.id} className="text-xs text-amber-400">
                    {def.name.replace(/^Grade /, '')} — not measured, so a buyer assumes the worst.
                  </p>
                );
              })}
```

Add to `src/features/rockhound/components/Cut.test.jsx`:

```jsx
it('does not show a quality the player has never measured', () => {
  // The playtest asked why Cut's stats did not match Identify's tests. They
  // must never appear as though they were known.
  renderCut();
  expect(screen.getAllByText(/not measured, so a buyer assumes the worst/i).length).toBeGreaterThan(0);
});
```

Adapt to that file's existing render helper; its fixtures carry no `revealed`, so every quality reads as unmeasured.

- [ ] **Step 5: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. Several `market.test.js` and `marketView.test.js` fixtures carry no `revealed`, so their expected values now fall to the ungraded floor. **Recompute each expected value from the new formula — do not delete the assertion.** If a test's intent was "a fine stone sells for more", give its fixture a full `revealed` so it still tests that.

Run: `./node_modules/.bin/vite build`
Expected: green.

- [ ] **Step 6: Verify by hand in a browser**

Run `./node_modules/.bin/vite` and check:

1. Dig several stones. The Identify tab shows a bench strip with every stone, and clicking one switches sheets.
2. The sheet has two labelled sections — *What it is* and *What it is worth*.
3. Measuring a diagnostic narrows *Consistent with*. Measuring a grade never does.
4. When a stone resolves, a green banner names it and the stone stays reachable on the bench for grading.
5. The rung reads Unidentified, then Identified, then Graded as you work.
6. A fully graded stone drops off the bench.
7. Cut shows "— not measured" for ungraded qualities, and real meters once graded.
8. In Market, grade a stone and watch its price rise.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/logic/market.js src/features/rockhound/logic/market.test.js src/features/rockhound/logic/marketView.js src/features/rockhound/components/Cut.jsx src/features/rockhound/components/Cut.test.jsx
git commit -m "feat(market): value follows what was measured, and rough finally weighs carat"
```

---

## Deferred, with reasons

| Item | Why |
| --- | --- |
| Instrument minigames | `livePlay` is still a live socket, and this plan gives it *more* to affect — grading responds to it as well as identification. Remains the single biggest gap for how the tab **feels**: pressing a button is pressing a button. |
| The origin rung | Needs provenance data that does not exist, and every stone already records where it was dug. |
| Splitting colour into hue/tone/saturation | Three quality rows prove the model; splitting one is a tuning exercise afterwards. |
| Contradiction and synthetics | Unchanged, still late. |
| The Lab Assistant | Still last, by explicit decision — active play gets judged before any of it is automated. |
