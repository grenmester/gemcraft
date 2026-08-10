# Identify: Revelation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace candidate-elimination with revelation — each test reports a named reading instead of silently pruning a list, and a stone's identity emerges on its own once the readings are decisive.

**Architecture:** Traits are revealed onto the specimen itself (so progress survives a tab switch), readings come from the existing `bandWidth` model, and resolution fires the transition `COMMIT_IDENTIFY` fires today. The reducer stays pure: the component passes `byHand`, and the rules module turns that into a precision value.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Zod-validated YAML, React Context + useReducer, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-10-identify-revelation-design.md`

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Native Vitest matchers and raw DOM reads only (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **`getByText` matches an element by its direct child text nodes joined**, not full `textContent`. Two siblings rendering the same string collide. Prefer `getByRole` with distinct accessible names.
- **Rules modules own formulas; view modules delegate and never restate one.** Six violations have been caught in this project. `precision.js`, `tests.js`, `hues.js`, `traits.js` own rules; `identifyView.js` delegates.
- **The reducer must stay pure.** No `Date.now()` and no `Math.random()` inside `rockhoundReducer` or its helpers, not even as a fallback.
- **Never write a test that passes when the behaviour is removed.** After writing a test, stub the behaviour and confirm it fails.
- No inline magic numbers: every tuned value is a named constant, exported only if another module or a test needs it.
- When adding to an import from a path a file already imports, **extend the existing line** — a second `import` from the same path is a duplicate-binding `SyntaxError`.
- The suite is green at **471 tests** before this plan starts. It must be green at every commit.

## The inversion this plan exists to deliver

`runTest` already computes a `center` and a `band`. **Neither is rendered anywhere** — the reading goes straight into `eliminate()` and the player sees only `SUSPECTS: 4` become `SUSPECTS: 3`. So the player does work and never sees its result.

After this plan: every test reports a named, visible reading; identity emerges when the readings are decisive; nothing is ever pressed blind.

## Verified facts this design rests on

Measured against the real data before writing — trust these, and if an implementation disagrees, the implementation is wrong:

- Hardness, SG and fluorescence separate the **families** in all ten locality pools.
- One coarse hue per specimen plus transparency leaves **40% sight-resolvable, 60% needing instruments**. (Matching a species' *full* colour list would resolve 89% by sight and make instruments pointless — hence the hue table.)
- **Zero stones are unresolvable** at best precision once transparency is included. Without it, a black or colourless opal is indistinguishable from obsidian at Opal Flats forever.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/features/rockhound/logic/hues.js` | *create* — colour-word → hue table, `hueOf`, `huesForSpecies` |
| `src/features/rockhound/logic/traits.js` | *create* — the revealed-trait record; merging readings (narrower wins) |
| `src/features/rockhound/logic/tests.js` | *modify* — `OBSERVED_TRAITS`, consistency for hue and transparency, `consistentSpecies` |
| `src/features/rockhound/logic/precision.js` | *modify* — `HAND_LIVE_PLAY` / `AUTO_LIVE_PLAY`; delete `livePlayFromRng` |
| `src/features/rockhound/logic/rollRough.js` | *modify* — roll one observed `hue` onto the specimen |
| `src/features/rockhound/logic/identifyView.js` | *create* — the trait panel's shape; delegates every number |
| `src/features/rockhound/RockhoundContext.jsx` | *modify* — `REVEAL_TRAIT`; mastery by practice; auto-resolve; retire `COMMIT_IDENTIFY` |
| `src/features/rockhound/components/Identify.jsx` | *rewrite* — the trait panel |
| `src/data/foundation.test.js` | *modify* — the three guards from spec §7 |

---

### Task 1: The hue table

Turns 32 colour words into ~12 hues. This table is the single most tuning-sensitive thing in the slice: it decides how ambiguous the game is.

**Files:**
- Create: `src/features/rockhound/logic/hues.js`
- Test: `src/features/rockhound/logic/hues.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `hueOf(colourWord) -> string`, `huesForSpecies(species) -> string[]` (sorted, deduped)

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/hues.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { hueOf, huesForSpecies, HUE_BY_COLOUR } from './hues.js';
import { species, speciesById } from '../../../loaders/species.js';

describe('hueOf', () => {
  it('collapses shades of one colour onto a single hue', () => {
    // What an untrained eye reports is "red", not "pinkish-red".
    expect(hueOf('red')).toBe('red');
    expect(hueOf('pinkish-red')).toBe('red');
    expect(hueOf('brownish-red')).toBe('red');
  });

  it('keeps genuinely different colours apart', () => {
    expect(hueOf('blue')).not.toBe(hueOf('green'));
    expect(hueOf('purple')).not.toBe(hueOf('red'));
  });

  it('maps every colour word in the roster', () => {
    // An unmapped word would make a species unobservable.
    for (const s of species) {
      for (const c of s.colors) {
        expect(HUE_BY_COLOUR[c], `unmapped colour word: ${c}`).toBeDefined();
      }
    }
  });
});

describe('huesForSpecies', () => {
  it('dedupes shades that collapse to the same hue', () => {
    // Ruby is red and pinkish-red — one hue, not two.
    expect(huesForSpecies(speciesById.ruby)).toEqual(['red']);
  });

  it('keeps a species that really does appear in several hues', () => {
    expect(huesForSpecies(speciesById.sapphire).length).toBeGreaterThan(1);
  });

  it('is sorted, so two callers never disagree on order', () => {
    const h = huesForSpecies(speciesById.sapphire);
    expect(h).toEqual([...h].sort());
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/hues.test.js`
Expected: FAIL — `Failed to resolve import "./hues.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/hues.js`:

```js
// What a stone looks like at a glance. The data describes colours in trade
// terms ("pinkish-red", "sherry"); an untrained eye reports a bare hue. That
// gap is the point: collapsing shades onto hues is what keeps sight from
// identifying everything by itself.
//
// Measured against the real roster: matching a species' full colour list would
// let sight alone resolve 89% of stones. Coarse hues plus transparency resolve
// 40%, leaving 60% that genuinely need instruments.

export const HUE_BY_COLOUR = {
  red: 'red', 'pinkish-red': 'red', 'brownish-red': 'red', 'purple-red': 'red',
  pink: 'pink',
  purple: 'purple', violet: 'purple', lavender: 'purple', 'blue-violet': 'purple',
  blue: 'blue', cyan: 'blue', 'blue-green': 'blue', 'blue-sheen': 'blue',
  green: 'green', 'vivid-green': 'green', olive: 'green', 'yellow-green': 'green',
  yellow: 'yellow', amber: 'yellow', sherry: 'yellow',
  orange: 'orange',
  colorless: 'colorless', white: 'colorless', sheen: 'colorless',
  gray: 'gray', brown: 'brown', black: 'black',
  banded: 'banded', multicolor: 'banded', 'play-of-color': 'banded', watermelon: 'banded'
};

/** The hue an untrained eye would report for a trade colour word. */
export function hueOf(colourWord) {
  return HUE_BY_COLOUR[colourWord] ?? colourWord;
}

/** Every hue this species can appear in, deduped and sorted. */
export function huesForSpecies(species) {
  return [...new Set((species.colors ?? []).map(hueOf))].sort();
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/hues.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/hues.js src/features/rockhound/logic/hues.test.js
git commit -m "feat(identify): coarse hue table for what a stone looks like at a glance"
```

---

### Task 2: Observed hue on every specimen

A specimen shows **one** hue, not its species' whole palette. That is what makes sight ambiguous.

**Files:**
- Modify: `src/features/rockhound/logic/rollRough.js`
- Modify: `src/features/rockhound/logic/rollRough.test.js`

**Interfaces:**
- Consumes: `huesForSpecies` (Task 1)
- Produces: every specimen carries `hue: string`

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/rollRough.test.js`. Add `huesForSpecies` as a new import line for `./hues.js`, and `speciesById` to the existing species-loader import if not already there:

```js
describe('observed hue', () => {
  const creek = localities.find((l) => l.id === 'hidden_creek');

  it('gives every stone exactly one observed hue', () => {
    const s = rollRough(creek, 1, () => 0.5);
    expect(typeof s.hue).toBe('string');
    expect(s.hue.length).toBeGreaterThan(0);
  });

  it('only ever shows a hue its species can actually appear in', () => {
    for (let i = 0; i < 100; i++) {
      const s = rollRough(creek, 1, () => i / 100);
      expect(huesForSpecies(speciesById[s.trueSpeciesId]), s.trueSpeciesId).toContain(s.hue);
    }
  });

  it('shows different hues for a species with several, across many rolls', () => {
    // Sapphire is blue, colorless, yellow or pink. One specimen shows ONE of
    // them — if every specimen showed the same one, sight would be far more
    // diagnostic than intended.
    const mogok = localities.find((l) => l.id === 'mogok_marble');
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      const s = rollRough(mogok, 1, () => i / 400);
      if (s.trueSpeciesId === 'sapphire') seen.add(s.hue);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('defaults to an unknown hue for specimens that predate the field', () => {
    // Saves written before this change carry no hue.
    const s = createRough({ trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'x' }, () => 'z');
    expect(s.hue).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rollRough.test.js`
Expected: FAIL — `expected undefined to be a string`

- [ ] **Step 3: Implement**

In `src/features/rockhound/logic/rollRough.js`, add to the imports:

```js
import { huesForSpecies } from './hues.js';
import { speciesById } from '../../../loaders/species.js';
```

Extend `createRough` to carry the field:

```js
export function createRough({ trueSpeciesId, caratWeight, clarity, colorGrade, origin, foundDepth = 1, form = 'fragment', hue = 'unknown' }, idFactory = defaultId) {
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
    form,
    hue
  };
}
```

Add a helper beside `bestOf`:

```js
/** The one hue THIS stone shows, drawn from the hues its species can take. */
function rollHue(speciesId, rng) {
  const hues = huesForSpecies(speciesById[speciesId]);
  if (hues.length === 0) return 'unknown';
  return hues[Math.min(Math.floor(rng() * hues.length), hues.length - 1)];
}
```

And in `rollRough`'s `createRough` call, add the field after `form`:

```js
    form: rollForm(locality.method, depth, rng),
    hue: rollHue(entry.species, rng)
```

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. `rollRough` now consumes one more random value per roll, so if a test scripts an exact RNG sequence it will need one more entry — extend the array rather than loosening the assertion.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/rollRough.js src/features/rockhound/logic/rollRough.test.js
git commit -m "feat(identify): every specimen shows one observed hue"
```

---

### Task 3: Consistency, and the traits a stone can show

Replaces "does this candidate survive?" with "which species are consistent with everything I have seen?" — the same maths, inverted so the player can be shown the reading rather than its side effect.

**Files:**
- Modify: `src/features/rockhound/logic/tests.js`
- Modify: `src/features/rockhound/logic/tests.test.js`
- Modify: `src/features/rockhound/logic/precision.js`
- Modify: `src/features/rockhound/logic/precision.test.js` (create if absent)

**Interfaces:**
- Consumes: `huesForSpecies` (Task 1)
- Produces:
  - `OBSERVED_TRAITS` — the two free observations, `{ hue, transparency }`
  - `consistentWithSpecies(species, reading) -> boolean` — handles numeric, categorical, hue and transparency
  - `consistentSpecies(candidateIds, speciesById, readings) -> string[]`
  - `HAND_LIVE_PLAY` (1.0) and `AUTO_LIVE_PLAY` (0.6) from `precision.js`; `livePlayFromRng` deleted

- [ ] **Step 1: Write the failing test**

Append to `src/features/rockhound/logic/tests.test.js`. Extend the existing `./tests.js` import with the new names:

```js
describe('consistency', () => {
  it('accepts a species whose value sits inside the band, and rejects one outside', () => {
    const reading = { kind: 'numeric', property: 'hardness', center: 9, band: 0.5 };
    expect(consistentWithSpecies(speciesById.ruby, reading)).toBe(true);      // hardness 9
    expect(consistentWithSpecies(speciesById.quartz, reading)).toBe(false);   // hardness 7
  });

  it('accepts a value exactly on the band edge', () => {
    // A stone must never be excluded by a reading it sits precisely at.
    const reading = { kind: 'numeric', property: 'hardness', center: 7.5, band: 0.5 };
    expect(consistentWithSpecies(speciesById.quartz, reading)).toBe(true);
  });

  it('requires an exact match on a categorical reading', () => {
    const inert = { kind: 'categorical', property: 'fluorescence', key: 'inert' };
    expect(consistentWithSpecies(speciesById.quartz, inert)).toBe(true);
    expect(consistentWithSpecies(speciesById.ruby, inert)).toBe(false);       // red under LW
  });

  it('accepts a hue the species can show, and rejects one it cannot', () => {
    const red = { kind: 'hue', value: 'red' };
    expect(consistentWithSpecies(speciesById.ruby, red)).toBe(true);
    expect(consistentWithSpecies(speciesById.aquamarine, red)).toBe(false);
  });

  it('matches transparency exactly — this is what separates opal from obsidian', () => {
    const translucent = { kind: 'transparency', value: 'translucent' };
    expect(consistentWithSpecies(speciesById.opal, translucent)).toBe(true);
    expect(consistentWithSpecies(speciesById.obsidian, translucent)).toBe(false);
  });
});

describe('consistentSpecies', () => {
  const pool = ['ruby', 'sapphire', 'spinel', 'tanzanite'];

  it('returns the whole pool when nothing has been observed', () => {
    expect(consistentSpecies(pool, speciesById, []).sort()).toEqual([...pool].sort());
  });

  it('narrows as observations accumulate', () => {
    const red = [{ kind: 'hue', value: 'red' }];
    const narrowed = consistentSpecies(pool, speciesById, red);
    // Ruby and spinel are both red — the classic confusion. Sight alone
    // must not resolve this.
    expect(narrowed).toContain('ruby');
    expect(narrowed).toContain('spinel');
    expect(narrowed).not.toContain('tanzanite');
  });

  it('resolves to one when the readings are decisive', () => {
    const readings = [
      { kind: 'hue', value: 'red' },
      { kind: 'numeric', property: 'specificGravity', center: 4.0, band: 0.3 }
    ];
    // Spinel's SG is 3.6, outside the band around corundum's 4.0.
    expect(consistentSpecies(pool, speciesById, readings)).toEqual(['ruby']);
  });
});

describe('precision constants', () => {
  it('rewards working by hand over the shortcut', () => {
    expect(HAND_LIVE_PLAY).toBeGreaterThan(AUTO_LIVE_PLAY);
  });

  it('produces a narrower band by hand than by shortcut', () => {
    const byHand = bandWidth({ property: 'hardness', mastery: 50, livePlay: HAND_LIVE_PLAY });
    const auto = bandWidth({ property: 'hardness', mastery: 50, livePlay: AUTO_LIVE_PLAY });
    expect(byHand).toBeLessThan(auto);
  });
});
```

Add `import { bandWidth, HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from './precision.js';` and ensure `speciesById` is imported from `'../../../loaders/species.js'`.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js`
Expected: FAIL — `consistentWithSpecies is not a function`

- [ ] **Step 3: Implement the precision constants**

In `src/features/rockhound/logic/precision.js`, **delete** `livePlayFromRng` entirely and add:

```js
// How well the reading was taken. Working by hand beats the shortcut, and when
// an instrument minigame lands this is where its score arrives — nothing else
// in the model has to change.
//
// AUTO_LIVE_PLAY is the clamp floor in bandWidth, so the shortcut is exactly
// as good as the model allows a reading to be, and no better.
export const HAND_LIVE_PLAY = 1.0;
export const AUTO_LIVE_PLAY = 0.6;
```

`livePlayFromRng` is the source of today's defect — mastery is currently the running maximum of a random number — and its only caller is `Identify.jsx`, which Task 6 rewrites. Grep to confirm before deleting: `grep -rn "livePlayFromRng" src/`.

- [ ] **Step 4: Implement consistency in `tests.js`**

In `src/features/rockhound/logic/tests.js`, add `import { huesForSpecies } from './hues.js';` and append:

```js
/** The two traits a player observes for free, just by looking at the stone. */
export const OBSERVED_TRAITS = {
  hue: { id: 'hue', name: 'Hue', kind: 'hue' },
  transparency: { id: 'transparency', name: 'Transparency', kind: 'transparency' }
};

/**
 * Whether this species could have produced this reading. The inverse of the
 * old `survivesReading` framing: the player is shown the reading, and the
 * species list is derived from it rather than mutated by it.
 */
export function consistentWithSpecies(species, reading) {
  switch (reading.kind) {
    case 'numeric':
      return Math.abs(numericProperty(species, reading.property) - reading.center) <= reading.band;
    case 'categorical':
      return fluorescenceKey(species) === reading.key;
    case 'hue':
      return huesForSpecies(species).includes(reading.value);
    case 'transparency':
      return species.transparency === reading.value;
    default:
      return true;
  }
}

/** Every candidate still consistent with everything observed so far. */
export function consistentSpecies(candidateIds, speciesById, readings) {
  return candidateIds.filter((id) =>
    readings.every((r) => consistentWithSpecies(speciesById[id], r))
  );
}
```

Leave `survivesReading` and `eliminate` in place for now; Task 6 removes their last caller and Task 7 deletes them.

- [ ] **Step 5: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/logic/tests.js src/features/rockhound/logic/tests.test.js src/features/rockhound/logic/precision.js src/features/rockhound/logic/precision.test.js
git commit -m "feat(identify): species consistency from readings, and hand-vs-shortcut precision"
```

---

### Task 4: The revealed-trait record

What the player has measured so far, carried on the specimen so progress survives a tab switch.

**Files:**
- Create: `src/features/rockhound/logic/traits.js`
- Test: `src/features/rockhound/logic/traits.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `revealedReadings(specimen, species) -> reading[]` — the free observations plus every measured reading
  - `mergeReading(revealed, reading) -> revealed` — narrower wins
  - `isRevealed(revealed, traitId) -> boolean`

**The narrower-wins rule matters:** without it, re-measuring a trait after your mastery has improved could make a stone *less* resolved than before, and a badly-measured stone could be stuck forever.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/traits.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { revealedReadings, mergeReading, isRevealed } from './traits.js';
import { speciesById } from '../../../loaders/species.js';

const wide = { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 1.0 };
const tight = { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.3 };

describe('mergeReading', () => {
  it('records a trait measured for the first time', () => {
    expect(isRevealed(mergeReading({}, wide), 'scratch')).toBe(true);
  });

  it('keeps the narrower reading when a trait is measured again', () => {
    // Re-measuring with better mastery should improve what you know.
    expect(mergeReading({ scratch: wide }, tight).scratch.band).toBe(0.3);
  });

  it('never lets a sloppier reading undo a careful one', () => {
    // Otherwise a stone could become less resolved than it already was.
    expect(mergeReading({ scratch: tight }, wide).scratch.band).toBe(0.3);
  });

  it('does not mutate the record it was given', () => {
    const before = { scratch: tight };
    mergeReading(before, wide);
    expect(before.scratch.band).toBe(0.3);
  });
});

describe('revealedReadings', () => {
  const stone = { hue: 'red', trueSpeciesId: 'ruby', revealed: {} };

  it('always includes the two free observations', () => {
    const kinds = revealedReadings(stone, speciesById.ruby).map((r) => r.kind);
    expect(kinds).toContain('hue');
    expect(kinds).toContain('transparency');
  });

  it('reads transparency from the species, since it is not rolled per stone', () => {
    const t = revealedReadings(stone, speciesById.ruby).find((r) => r.kind === 'transparency');
    expect(t.value).toBe(speciesById.ruby.transparency);
  });

  it('includes measured readings alongside the free ones', () => {
    const measured = { ...stone, revealed: { scratch: tight } };
    expect(revealedReadings(measured, speciesById.ruby)).toHaveLength(3);
  });

  it('omits an unknown hue rather than filtering every species out', () => {
    // Specimens saved before hues existed carry 'unknown'; treating that as a
    // real observation would make them permanently unidentifiable.
    const legacy = { ...stone, hue: 'unknown' };
    expect(revealedReadings(legacy, speciesById.ruby).some((r) => r.kind === 'hue')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/traits.test.js`
Expected: FAIL — `Failed to resolve import "./traits.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/traits.js`:

```js
// What the player has observed about one stone. Kept on the specimen rather
// than in component state, so measuring a trait is not undone by switching
// tabs.

/** A hue the game could not determine — specimens saved before hues existed. */
export const UNKNOWN_HUE = 'unknown';

export function isRevealed(revealed, traitId) {
  return Boolean(revealed?.[traitId]);
}

/**
 * Fold a new reading into the record. The narrower reading always wins, so
 * re-measuring with better mastery improves what you know and can never make
 * a stone less resolved than it already was.
 */
export function mergeReading(revealed, reading) {
  const existing = revealed?.[reading.testId];
  if (existing && existing.band != null && reading.band != null && existing.band <= reading.band) {
    return revealed;
  }
  return { ...revealed, [reading.testId]: reading };
}

/**
 * Everything observed about this stone: the two free observations plus every
 * measured reading. Transparency is a property of the species, not of the
 * individual stone, so it is read from the species rather than rolled.
 */
export function revealedReadings(specimen, species) {
  const free = [];
  if (specimen.hue && specimen.hue !== UNKNOWN_HUE) {
    free.push({ testId: 'hue', kind: 'hue', value: specimen.hue });
  }
  if (species?.transparency) {
    free.push({ testId: 'transparency', kind: 'transparency', value: species.transparency });
  }
  return [...free, ...Object.values(specimen.revealed ?? {})];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/traits.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/traits.js src/features/rockhound/logic/traits.test.js
git commit -m "feat(identify): revealed-trait record, narrower reading wins"
```

---

### Task 5: The guards the design rests on

Three invariants that were verified by hand while writing the spec. Turning them into tests converts the design's viability from a lucky fact about today's data into something that fails loudly the day someone edits a colour or a find pool.

**Files:**
- Modify: `src/data/foundation.test.js`

**Interfaces:**
- Consumes: `huesForSpecies` (Task 1), `consistentSpecies` (Task 3), `BASE_ERROR` from `precision.js`
- Produces: nothing — guards only

**Why "best precision" is `BASE_ERROR`:** `bandWidth` divides `BASE_ERROR[property]` by the product of its multipliers, each of which maxes at 1. So the narrowest a band can ever be is `BASE_ERROR[property]` itself — 0.5 for hardness, 0.3 for specific gravity.

- [ ] **Step 1: Write the failing guards**

Append to `src/data/foundation.test.js`. Add these imports to the existing block (extend the existing `../loaders/species.js` and `../loaders/localities.js` lines rather than adding new ones for those paths):

```js
import { huesForSpecies } from '../features/rockhound/logic/hues.js';
import { consistentSpecies } from '../features/rockhound/logic/tests.js';
import { BASE_ERROR } from '../features/rockhound/logic/precision.js';
import { fluorescenceKey } from '../features/rockhound/logic/properties.js';
```

```js
describe('identification is always possible', () => {
  // The narrowest band the model can ever produce, so this is the best case.
  const best = (species, property) => ({
    kind: 'numeric', property,
    center: Array.isArray(species[property])
      ? (species[property][0] + species[property][1]) / 2
      : species[property],
    band: BASE_ERROR[property]
  });

  const everything = (species, hue) => [
    { kind: 'hue', value: hue },
    { kind: 'transparency', value: species.transparency },
    best(species, 'hardness'),
    best(species, 'specificGravity'),
    { kind: 'categorical', property: 'fluorescence', key: fluorescenceKey(species) }
  ];

  it('every species declares a transparency', () => {
    // Without it, opal and obsidian are indistinguishable forever.
    for (const s of species) {
      expect(s.transparency, `${s.id} transparency`).toBeTruthy();
    }
  });

  it('no stone is unresolvable, at any locality, in any hue it can show', () => {
    // THE guard. A stone that never resolves can never be identified, cut or
    // sold at full value — a permanent dead end for the player.
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const id of pool) {
        for (const hue of huesForSpecies(speciesById[id])) {
          const survivors = consistentSpecies(pool, speciesById, everything(speciesById[id], hue));
          expect(survivors, `${loc.id}: a ${hue} ${id}`).toEqual([id]);
        }
      }
    }
  });

  it('lets a beginner resolve most stones, so nobody is stonewalled at the start', () => {
    // bandWidth clamps mastery at a floor of 0.1, so a beginner's numeric
    // readings are ten times wider than an expert's and contribute almost
    // nothing. Measured: 77% still resolve at mastery 0, on hue, transparency
    // and fluorescence alone. If a data change pushed this down, new players
    // would measure everything and watch nothing happen.
    const beginnerBand = (property) => BASE_ERROR[property] / 0.1;
    const beginner = (species, hue) => [
      { kind: 'hue', value: hue },
      { kind: 'transparency', value: species.transparency },
      { kind: 'numeric', property: 'hardness',
        center: Array.isArray(species.hardness) ? (species.hardness[0] + species.hardness[1]) / 2 : species.hardness,
        band: beginnerBand('hardness') },
      { kind: 'numeric', property: 'specificGravity', center: species.specificGravity, band: beginnerBand('specificGravity') },
      { kind: 'categorical', property: 'fluorescence', key: fluorescenceKey(species) }
    ];
    let total = 0;
    let resolved = 0;
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const entry of loc.findPool) {
        const hues = huesForSpecies(speciesById[entry.species]);
        const share = entry.weight / hues.length;
        for (const hue of hues) {
          total += share;
          if (consistentSpecies(pool, speciesById, beginner(speciesById[entry.species], hue)).length === 1) {
            resolved += share;
          }
        }
      }
    }
    const pct = (resolved / total) * 100;
    expect(pct, `beginner-resolvable ${pct.toFixed(1)}%`).toBeGreaterThan(60);
  });

  it('keeps sight useful but not sufficient', () => {
    // The slice rests on most stones needing instruments. Measured at design
    // time: 40% sight-resolvable. A colour or find-pool edit that pushed this
    // far up would quietly make the instruments pointless.
    let total = 0;
    let resolved = 0;
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const entry of loc.findPool) {
        const hues = huesForSpecies(speciesById[entry.species]);
        const share = entry.weight / hues.length;
        for (const hue of hues) {
          total += share;
          const sightOnly = [
            { kind: 'hue', value: hue },
            { kind: 'transparency', value: speciesById[entry.species].transparency }
          ];
          if (consistentSpecies(pool, speciesById, sightOnly).length === 1) resolved += share;
        }
      }
    }
    const pct = (resolved / total) * 100;
    expect(pct, `sight-resolvable ${pct.toFixed(1)}%`).toBeGreaterThan(25);
    expect(pct, `sight-resolvable ${pct.toFixed(1)}%`).toBeLessThan(55);
  });
});
```

- [ ] **Step 2: Run the guards**

Run: `./node_modules/.bin/vitest run src/data/foundation.test.js`
Expected: PASS — 3 new guards.

If "no stone is unresolvable" fails, **the data is wrong, not the test.** The failure message names the exact locality, hue and species. Report it rather than loosening the assertion — a failure here means a real player could be permanently stuck.

- [ ] **Step 3: Prove the guards can actually fail**

Temporarily delete the transparency reading from the `everything` helper, re-run, and confirm the unresolvable guard fails naming a black or colourless opal at Opal Flats. Restore it. Report the failure output you saw.

- [ ] **Step 4: Commit**

```bash
git add src/data/foundation.test.js
git commit -m "test(identify): guard that every stone is resolvable and sight stays insufficient"
```

---

### Task 6: Revealing a trait, and identity emerging

The reducer half. A test reveals a reading onto the specimen; when the readings are decisive, the stone resolves on its own.

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Modify: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `runTest`, `consistentSpecies` (Task 3); `mergeReading`, `revealedReadings` (Task 4); `seedCandidates` from `candidates.js`; `HAND_LIVE_PLAY` / `AUTO_LIVE_PLAY` (Task 3)
- Produces: action `REVEAL_TRAIT { instanceId, testId, byHand }`; `COMMIT_IDENTIFY` and `RECORD_TEST_SCORE` retired

**Purity:** `runTest` is deterministic given `livePlay` — it reads the species' own value as the centre and derives the band from the multipliers. Nothing random happens. The payload carries `byHand`, and the reducer maps it to a precision constant, so no `Math.random()` is needed anywhere.

**Mastery by practice:** today `RECORD_TEST_SCORE` stores `max(livePlay × 100)` where `livePlay` was `Math.random()` — so mastery climbs to 100 by attrition regardless of skill. Replace it: each hand-run raises that test's mastery by `MASTERY_PER_HAND_RUN`, each shortcut run by `MASTERY_PER_AUTO_RUN`, capped at 100.

**Why 8 per hand-run, and why this matters more than it looks.** `bandWidth` clamps its mastery term at a floor of 0.1, so a beginner's reading is **ten times wider** than an expert's: hardness reads ±5.0 at mastery 0 against a roster that only spans 5–10. Measured across the real data, that means **77% of stones resolve at mastery 0, 91% at mastery 75, and 100% only at mastery 100.** At 8 per hand-run a player reaches full precision in about 13 measurements of a given test — spread across stones, since mastery is per test rather than per stone. This is the single most tuning-sensitive number in the slice.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/rockhound/RockhoundContext.test.js`. Add `REVEAL_TRAIT` to the existing `../RockhoundContext.jsx` import:

```js
describe('REVEAL_TRAIT', () => {
  const roughRuby = {
    instanceId: 'r1', stage: 'rough', trueSpeciesId: 'ruby', identifiedAs: null,
    caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'mogok_marble',
    foundDepth: 1, form: 'fragment', hue: 'red', revealed: {}
  };
  const withStone = (over = {}) => ({ ...initialRockhoundState, rough: [roughRuby], ...over });

  it('records a reading the player can actually be shown', () => {
    const next = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const reading = next.rough[0].revealed.scratch;
    expect(reading.center).toBe(9);        // ruby's hardness
    expect(reading.band).toBeGreaterThan(0);
  });

  it('is deterministic — the same state and action twice give the same result', () => {
    // The reducer must never reach for Math.random or Date.now.
    const act = { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true } };
    expect(rockhoundReducer(withStone(), act)).toEqual(rockhoundReducer(withStone(), act));
  });

  it('reads more precisely by hand than by shortcut', () => {
    const hand = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const auto = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: false }
    });
    expect(hand.rough[0].revealed.scratch.band).toBeLessThan(auto.rough[0].revealed.scratch.band);
  });

  it('grows mastery by practice, and rewards hand work more than the shortcut', () => {
    const hand = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const auto = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: false }
    });
    expect(hand.testMastery.scratch).toBeGreaterThan(initialRockhoundState.testMastery.scratch);
    expect(hand.testMastery.scratch).toBeGreaterThan(auto.testMastery.scratch);
  });

  it('never lets mastery exceed its ceiling', () => {
    const maxed = withStone({ testMastery: { ...initialRockhoundState.testMastery, scratch: 100 } });
    const next = rockhoundReducer(maxed, {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    expect(next.testMastery.scratch).toBe(100);
  });

  it('leaves the stone unidentified while the readings are still ambiguous', () => {
    // At Mogok Marble a red stone could be ruby or spinel — sight alone
    // must not resolve it.
    const next = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'uv', byHand: true }
    });
    expect(next.rough).toHaveLength(1);
    expect(next.identified).toHaveLength(0);
  });

  it('resolves the stone on its own once the readings are decisive', () => {
    // Ruby fluoresces red under longwave; spinel and tanzanite do not. With
    // hue and transparency free, that one reading settles it.
    let state = withStone();
    for (const testId of ['scratch', 'heft', 'uv']) {
      state = rockhoundReducer(state, { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId, byHand: true } });
    }
    expect(state.rough).toHaveLength(0);
    expect(state.identified).toHaveLength(1);
    expect(state.identified[0].trueSpeciesId).toBe('ruby');
    expect(state.identified[0].stage).toBe('identified');
  });

  it('awards the same reputation and gemdex entry the old path did', () => {
    let state = withStone();
    for (const testId of ['scratch', 'heft', 'uv']) {
      state = rockhoundReducer(state, { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId, byHand: true } });
    }
    expect(state.gemdex).toContain('ruby');
    expect(state.newlyDiscovered).toContain('ruby');
    expect(state.reputation).toBeGreaterThan(0);
  });

  it('ignores a stone that is not on the bench', () => {
    // Compare against the SAME object, not a freshly built one — the reducer
    // returns state unchanged, so identity is the assertion that matters.
    const before = withStone();
    const next = rockhoundReducer(before, {
      type: REVEAL_TRAIT, payload: { instanceId: 'nope', testId: 'scratch', byHand: true }
    });
    expect(next).toBe(before);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `REVEAL_TRAIT is not defined`

- [ ] **Step 3: Implement**

In `src/features/rockhound/RockhoundContext.jsx`:

Replace the `RECORD_TEST_SCORE` and `COMMIT_IDENTIFY` action constants with:

```js
export const REVEAL_TRAIT = 'REVEAL_TRAIT';
```

Update the imports — extend the existing `./logic/tests.js` line if present, otherwise add:

```js
import { runTest, consistentSpecies } from './logic/tests.js';
import { mergeReading, revealedReadings } from './logic/traits.js';
import { seedCandidates } from './logic/candidates.js';
import { HAND_LIVE_PLAY, AUTO_LIVE_PLAY } from './logic/precision.js';
```

`localitiesById` is already imported. Add the mastery constants near the top:

```js
const MASTERY_CEILING = 100;
const MASTERY_PER_HAND_RUN = 8;
const MASTERY_PER_AUTO_RUN = 2;
```

Add a helper beside `withEarnedGear` — this is the transition `COMMIT_IDENTIFY` used to perform, unchanged:

```js
/**
 * The stone's identity has become certain, so move it to the bench of
 * identified specimens. Byte-identical to what committing a correct guess
 * used to do — only the trigger changed.
 */
function resolveSpecimen(state, specimen) {
  const speciesId = specimen.trueSpeciesId;
  const isNew = !state.gemdex.includes(speciesId);
  const newGemdex = isNew ? [...state.gemdex, speciesId] : state.gemdex;
  const newReputation = state.reputation + identifyReward(speciesById[speciesId]);
  return {
    ...state,
    rough: state.rough.filter((r) => r.instanceId !== specimen.instanceId),
    identified: [...state.identified, { ...specimen, stage: 'identified', identifiedAs: speciesId }],
    gemdex: newGemdex,
    newlyDiscovered: isNew ? [...state.newlyDiscovered, speciesId] : state.newlyDiscovered,
    reputation: newReputation,
    gear: withEarnedGear(newGemdex, newReputation, state.gear)
  };
}
```

Replace the `RECORD_TEST_SCORE` and `COMMIT_IDENTIFY` cases with:

```js
    case REVEAL_TRAIT: {
      const { instanceId, testId, byHand } = action.payload;
      const specimen = state.rough.find((r) => r.instanceId === instanceId);
      if (!specimen) return state;

      const trueSpecies = speciesById[specimen.trueSpeciesId];
      const livePlay = byHand ? HAND_LIVE_PLAY : AUTO_LIVE_PLAY;
      const reading = runTest(testId, trueSpecies, {
        mastery: state.testMastery[testId] ?? 0,
        livePlay,
        familiarity: familiarityFactor(trueSpecies.family, completedFamilies(species, state.gemdex))
      });

      const updated = { ...specimen, revealed: mergeReading(specimen.revealed, reading) };
      const gain = byHand ? MASTERY_PER_HAND_RUN : MASTERY_PER_AUTO_RUN;
      const withReading = {
        ...state,
        rough: state.rough.map((r) => (r.instanceId === instanceId ? updated : r)),
        testMastery: {
          ...state.testMastery,
          [testId]: Math.min(MASTERY_CEILING, (state.testMastery[testId] ?? 0) + gain)
        }
      };

      // Identity emerges: nothing is guessed, and nothing is clicked.
      const locality = localitiesById[specimen.origin];
      const pool = locality ? seedCandidates(locality, specimen.foundDepth) : [specimen.trueSpeciesId];
      const survivors = consistentSpecies(pool, speciesById, revealedReadings(updated, trueSpecies));
      return survivors.length === 1 ? resolveSpecimen(withReading, updated) : withReading;
    }
```

Add `import { familiarityFactor, completedFamilies } from './logic/progression.js';` — extend the existing `./logic/progression.js` import instead if one is present. `species` is already imported from the species loader.

- [ ] **Step 4: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: FAIL — existing tests still reference `COMMIT_IDENTIFY` and `RECORD_TEST_SCORE`, and `Identify.jsx` still dispatches them. Delete the tests for the two retired actions (their behaviour is now covered by the `REVEAL_TRAIT` resolution tests), and leave `Identify.jsx` broken until Task 8 — note it in your report rather than patching it here.

If any *other* test breaks, that is a real regression: report it.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(identify): reveal traits, grow mastery by practice, resolve on certainty"
```

---

### Task 7: The trait panel's shape

**Files:**
- Create: `src/features/rockhound/logic/identifyView.js`
- Test: `src/features/rockhound/logic/identifyView.test.js`

**Interfaces:**
- Consumes: `TEST_DEFS`, `OBSERVED_TRAITS`, `consistentSpecies` (Task 3); `revealedReadings` (Task 4); `seedCandidates`
- Produces: `traitPanel(specimen, species, speciesById, locality) -> { rows, consistent, resolved }`

Each row is `{ id, label, measured, value, uncertainty, free }`. **This is a view module — it must not restate a formula.**

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/identifyView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { traitPanel } from './identifyView.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

const stone = (over = {}) => ({
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble',
  foundDepth: 1, hue: 'red', revealed: {}, ...over
});
const panel = (s) => traitPanel(s, speciesById[s.trueSpeciesId], speciesById, localitiesById[s.origin]);

describe('traitPanel', () => {
  it('lists every trait, so nothing is ever pressed blind', () => {
    const ids = panel(stone()).rows.map((r) => r.id);
    expect(ids).toContain('hue');
    expect(ids).toContain('transparency');
    expect(ids).toContain('scratch');
    expect(ids).toContain('heft');
    expect(ids).toContain('uv');
  });

  it('marks the two free observations as already made', () => {
    const free = panel(stone()).rows.filter((r) => r.free);
    expect(free.map((r) => r.id).sort()).toEqual(['hue', 'transparency']);
    expect(free.every((r) => r.measured)).toBe(true);
  });

  it('shows an untested trait as unmeasured with no value', () => {
    const row = panel(stone()).rows.find((r) => r.id === 'scratch');
    expect(row.measured).toBe(false);
    expect(row.value).toBe(null);
  });

  it('shows a measured reading with its value and uncertainty', () => {
    const measured = stone({
      revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } }
    });
    const row = panel(measured).rows.find((r) => r.id === 'scratch');
    expect(row.measured).toBe(true);
    expect(row.value).toBe(9);
    expect(row.uncertainty).toBe(0.5);
  });

  it('reports who is still in the running', () => {
    // A red stone at Mogok Marble is ruby or spinel — the classic confusion.
    const c = panel(stone()).consistent;
    expect(c).toContain('ruby');
    expect(c).toContain('spinel');
  });

  it('is not resolved while more than one species fits', () => {
    expect(panel(stone()).resolved).toBe(false);
  });

  it('is resolved once exactly one fits', () => {
    const measured = stone({
      revealed: { uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'red/none' } }
    });
    const p = panel(measured);
    expect(p.consistent).toEqual(['ruby']);
    expect(p.resolved).toBe(true);
  });

  it('falls back to the stone\'s own species when the locality is unknown', () => {
    // A stale save could name a locality that no longer exists.
    const p = traitPanel(stone(), speciesById.ruby, speciesById, undefined);
    expect(p.consistent).toContain('ruby');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/identifyView.test.js`
Expected: FAIL — `Failed to resolve import "./identifyView.js"`

- [ ] **Step 3: Implement**

Create `src/features/rockhound/logic/identifyView.js`:

```js
import { TEST_DEFS, OBSERVED_TRAITS, consistentSpecies } from './tests.js';
import { revealedReadings } from './traits.js';
import { seedCandidates } from './candidates.js';

// The trait panel's shape. Every number comes from tests.js or traits.js —
// this module decides what to show and what to call it, never how to compute
// it.

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

export function traitPanel(specimen, species, speciesById, locality) {
  const readings = revealedReadings(specimen, species);
  const byId = Object.fromEntries(readings.map((r) => [r.testId, r]));

  const rows = [
    ...Object.values(OBSERVED_TRAITS).map((t) => freeRow(t, byId[t.id])),
    ...Object.values(TEST_DEFS).map((d) => testRow(d, byId[d.id]))
  ];

  const pool = locality
    ? seedCandidates(locality, specimen.foundDepth)
    : [specimen.trueSpeciesId];
  const consistent = consistentSpecies(pool, speciesById, readings);

  return { rows, consistent, resolved: consistent.length === 1 };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/identifyView.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/identifyView.js src/features/rockhound/logic/identifyView.test.js
git commit -m "feat(identify): trait panel presentation shape"
```

---

### Task 8: The screen, and retiring what it replaces

**Files:**
- Rewrite: `src/features/rockhound/components/Identify.jsx`
- Rewrite: `src/features/rockhound/components/Identify.test.jsx`
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/logic/tests.js` (delete the dead elimination helpers)

**Interfaces:**
- Consumes: `traitPanel` (Task 7); `REVEAL_TRAIT` (Task 6)
- Produces: `<Identify specimen locality speciesById onReveal />`

- [ ] **Step 1: Write the failing test**

Replace `src/features/rockhound/components/Identify.test.jsx` entirely:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Identify from './Identify.jsx';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

const RUBY = {
  instanceId: 'r1', trueSpeciesId: 'ruby', origin: 'mogok_marble',
  foundDepth: 1, hue: 'red', revealed: {}
};

function renderIdentify(over = {}) {
  const props = {
    specimen: RUBY,
    locality: localitiesById.mogok_marble,
    speciesById,
    onReveal: vi.fn(),
    ...over
  };
  render(<Identify {...props} />);
  return props;
}

describe('Identify', () => {
  it('shows what each test will tell you before you press it', () => {
    // The whole point: no button is ever pressed blind.
    renderIdentify();
    screen.getByText(/Scratch Test/i);
    screen.getByText(/Heft in Water/i);
    screen.getByText(/UV Light/i);
  });

  it('marks unmeasured traits as unmeasured', () => {
    renderIdentify();
    expect(screen.getAllByText(/not measured/i).length).toBeGreaterThan(0);
  });

  it('shows the free observations without a test button', () => {
    renderIdentify();
    expect(screen.getByLabelText(/^Hue/i).textContent).toMatch(/red/i);
    expect(screen.queryByRole('button', { name: /measure hue/i })).toBeNull();
  });

  it('shows a measured reading with its value and uncertainty', () => {
    renderIdentify({
      specimen: { ...RUBY, revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } } }
    });
    expect(screen.getByLabelText(/^Scratch Test/i).textContent).toMatch(/9/);
    expect(screen.getByLabelText(/^Scratch Test/i).textContent).toMatch(/0\.5/);
  });

  it('names who is still in the running', () => {
    renderIdentify();
    const running = screen.getByLabelText(/still consistent/i).textContent;
    expect(running).toMatch(/Ruby/);
    expect(running).toMatch(/Spinel/);
  });

  it('reveals a trait by hand when its test is pressed', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /measure scratch test/i }));
    expect(onReveal).toHaveBeenCalledWith('scratch', true);
  });

  it('runs every remaining test at once, at reduced precision', () => {
    const { onReveal } = renderIdentify();
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));
    expect(onReveal).toHaveBeenCalledTimes(3);
    // byHand false — the shortcut trades precision for speed.
    expect(onReveal.mock.calls.every((c) => c[1] === false)).toBe(true);
  });

  it('does not offer to re-run a test that has nothing left to measure', () => {
    const all = {
      scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 },
      heft: { testId: 'heft', kind: 'numeric', property: 'specificGravity', center: 4, band: 0.3 },
      uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'red/none' }
    };
    const { onReveal } = renderIdentify({ specimen: { ...RUBY, revealed: all } });
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('explains a fully measured stone that still has not resolved', () => {
    // 23% of stones cannot resolve at low mastery even with everything
    // measured, because a beginner's bands are ten times too wide. Without
    // this message the player measures everything, sees nothing happen, and
    // concludes the game is broken.
    const all = {
      scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 5 },
      heft: { testId: 'heft', kind: 'numeric', property: 'specificGravity', center: 4, band: 3 },
      uv: { testId: 'uv', kind: 'categorical', property: 'fluorescence', key: 'inert' }
    };
    renderIdentify({ specimen: { ...RUBY, hue: 'red', revealed: all } });
    screen.getByText(/too imprecise to separate/i);
  });

  it('says nothing about imprecision while tests remain unrun', () => {
    // The message must mean "your readings are too wide", not "you have not
    // finished" — otherwise it fires on every fresh stone and means nothing.
    renderIdentify();
    expect(screen.queryByText(/too imprecise to separate/i)).toBeNull();
  });

  it('still offers a single test again, since a sharper reading is worth taking', () => {
    renderIdentify({
      specimen: { ...RUBY, revealed: { scratch: { testId: 'scratch', kind: 'numeric', property: 'hardness', center: 9, band: 0.5 } } }
    });
    screen.getByRole('button', { name: /measure scratch test/i });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Identify.test.jsx`
Expected: FAIL — the old component renders a suspect list, not a trait panel.

- [ ] **Step 3: Implement the screen**

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

export default function Identify({ specimen, locality, speciesById, onReveal }) {
  const species = speciesById[specimen.trueSpeciesId];
  const panel = traitPanel(specimen, species, speciesById, locality);
  const unmeasured = panel.rows.filter((r) => !r.free && !r.measured);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">Identify the rough</h2>
        <button
          type="button"
          aria-label="Run all tests"
          disabled={unmeasured.length === 0}
          onClick={() => unmeasured.forEach((r) => onReveal(r.id, false))}
          className={`rounded px-4 py-1.5 text-sm ${
            unmeasured.length === 0
              ? 'cursor-not-allowed bg-slate-800 text-slate-600'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          Run all tests
        </button>
      </header>

      <ul className="flex flex-col">
        {panel.rows.map((row) => (
          <TraitRow key={row.id} row={row} onReveal={onReveal} />
        ))}
      </ul>

      <p aria-label="Still consistent with" className="text-sm text-slate-400">
        <span className="text-slate-500">Consistent with: </span>
        {panel.consistent.map((id) => speciesById[id].name).join(', ')}
      </p>

      {unmeasured.length === 0 && !panel.resolved && (
        <p className="rounded border border-amber-700 bg-amber-950 p-3 text-sm text-amber-200">
          Your readings are still too imprecise to separate these. Measure again — each
          careful measurement sharpens your eye, and a narrower reading replaces a wider one.
        </p>
      )}

      <p className="text-xs text-slate-600">
        Measuring by hand reads more precisely than running everything at once — and teaches you more.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Rewire the shell**

In `src/features/rockhound/components/Rockhound.jsx`, replace `RECORD_TEST_SCORE` and `COMMIT_IDENTIFY` in the `../RockhoundContext.jsx` import with `REVEAL_TRAIT`, and replace the `<Identify>` element:

```jsx
          <Identify
            key={activeRough.instanceId}
            specimen={activeRough}
            locality={localitiesById[activeRough.origin] ?? localitiesById.hidden_creek}
            speciesById={speciesById}
            onReveal={(testId, byHand) =>
              dispatch({ type: REVEAL_TRAIT, payload: { instanceId: activeRough.instanceId, testId, byHand } })
            }
          />
```

- [ ] **Step 5: Delete the dead elimination helpers**

`survivesReading` and `eliminate` in `src/features/rockhound/logic/tests.js` now have no production caller. Grep to confirm — `grep -rn "survivesReading\|eliminate(" src/` — then delete both, and their tests.

- [ ] **Step 6: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. `Rockhound.test.jsx` drives Identify through the shell; a case asserting `SUSPECTS:` must be **retargeted** to the new consistent-with readout, not deleted — it is the only end-to-end proof that identification reaches the reducer.

Run: `./node_modules/.bin/vite build`
Expected: `built in <n>ms`, no errors.

- [ ] **Step 7: Verify by hand in a browser**

Run `./node_modules/.bin/vite` and confirm:

1. Dig a stone at Hidden Creek and open Identify. Every trait is listed; hue and transparency already read a value; the three tests read `— not measured`.
2. Press **Measure** on Scratch Test. A number with a ± appears, and the consistent-with line shrinks.
3. Keep measuring until one species remains — the stone resolves on its own, moves off the bench, and appears under Cut.
4. Reputation and the Gemdex update exactly as before.
5. On a fresh stone, press **Run all tests**: everything is measured at once, and the readings are visibly wider than hand-measured ones.
6. After a run-all, **Run all tests** is disabled but individual **Again** buttons still work.
7. On a stone that will not resolve, the amber "too imprecise" message appears, and re-measuring by hand eventually resolves it as mastery climbs.
8. Nowhere is there a suspect list to click a name from.

- [ ] **Step 8: Commit**

```bash
git add src/features/rockhound/components/Identify.jsx src/features/rockhound/components/Identify.test.jsx src/features/rockhound/components/Rockhound.jsx src/features/rockhound/logic/tests.js src/features/rockhound/logic/tests.test.js
git commit -m "feat(identify): the trait panel replaces the suspect list"
```

---

## Deferred, with reasons

| Item | Why |
| --- | --- |
| Instrument minigames | `livePlay` is now a live socket with the right shape (hand 1.0, shortcut 0.6). A refractometer or polariscope minigame replaces the constant and every number in this slice starts responding to skill — with no other change. |
| The Lab Assistant | Slice 2. Its tier ceiling depends on how this model settles in play. |
| Instruments, property knowledge, the origin rung | Slice 3. `instrument` and `labPrep` stay at 1.0 until then. |
| Quality trait spread | Slice 4, deliberately isolated — it touches `market.js` and `cut.js`, which both key off a single grade number. |
| Contradiction and synthetics | Slice 5, needs new data. |
