# Cut & Market UX Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Cut and Market screens so a player can see what they are about to do and why a number is what it is — showing true cut odds, what a cut keeps, what it reveals, what it risks, and the arithmetic behind every price.

**Architecture:** Two new pure logic modules (`cutView.js`, `marketView.js`) derive everything the views need. A shared `GemGlyph` component is extracted first, since the tinted glyph tile is already duplicated in four components and these screens add three more call sites. Both screens reuse the existing `EntryModal` shell for their depth views, matching the Explore field guide. The scoring rule stays in `logic/cut.js`, which gains a `scoreBreakdown` that `specimenScore` delegates to, so the UI can show the 4C contributions without restating the formula.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Vitest + React Testing Library (jsdom).

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- `@testing-library/jest-dom` is **NOT installed**. Use only native Vitest matchers (`toBe`, `toBeTruthy`, `toBeNull`, `toMatch`, `toEqual`, `toHaveLength`, `toBeCloseTo`, `toBeGreaterThan`, `toBeLessThan`) and raw DOM reads (`el.getAttribute(...)`, `el.disabled`, `el.textContent`). Never `toHaveAttribute` / `toBeInTheDocument`.
- **No changes** to `src/data/*.yaml`, `src/schemas/*`, or the `RockhoundContext.jsx` reducer/state shape. View layer and pure logic only.
- `src/features/rockhound/logic/cut.js` owns cut **rules** (`cutSuccessProbability`, `applyCut`, `specimenScore`); `logic/market.js` owns **value rules** (`stoneValue`, `identifiedValue`, `gradeFactor`). View modules must delegate to them and must not restate a formula. This project has been corrected three times for that boundary.
- `getByText` matches an element by its **direct child text nodes joined**, not full `textContent`. Two siblings rendering the same string collide. Prefer exact strings or scoping via `.closest(...)`; never weaken a component to satisfy an ambiguous query.
- Tailwind utility classes only, dark palette consistent with existing components (`bg-slate-800`, `border-slate-700`, `text-yellow-400` accents).
- **Decided by the product owner, do not revisit:** Practice stays free and unlimited for now (no cost, no gating) — the UI must simply report level and true odds honestly. Price explanation goes in a modal as a full arithmetic breakdown.
- **Explicitly requested:** the Cut screen must NOT show a "last cut" result readout. Remove it.
- Out of scope (YAGNI): the cutting minigame, any change to `applyCut`'s outcome maths, gear beyond what `SHOP_GEAR` already holds, rebalancing `baseValue` or `gradeFactor`.

---

### Task 1: Extract the shared `GemGlyph` tile

The tinted-glyph tile is duplicated in `GemdexEntry`, `LocalityEntry`, `SpeciesCard` and `TrophyCase`. Extract it once before Cut and Market add three more copies.

**Files:**
- Create: `src/features/rockhound/components/GemGlyph.jsx`
- Create: `src/features/rockhound/components/GemGlyph.test.jsx`
- Modify: `SpeciesCard.jsx`, `TrophyCase.jsx`, `GemdexEntry.jsx`, `LocalityEntry.jsx`

**Interfaces:**
- Produces: default export `GemGlyph({ speciesId, variant = 'row', hidden = false })`
  - `variant` — one of `'hero' | 'card' | 'row' | 'pool'`, reproducing the four sizes already in use.
  - `hidden` — when true, renders the neutral `❔` placeholder with **no tint** (the spoiler rule: an undiscovered species must not leak its colour).
  - Always `aria-hidden="true"` — it is decoration beside a text label.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/components/GemGlyph.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import GemGlyph from './GemGlyph.jsx';
import { gemArt } from '../logic/gemArt.js';

describe('GemGlyph', () => {
  it("renders the species' glyph and tint", () => {
    const { container } = render(<GemGlyph speciesId="ruby" variant="card" />);
    const tile = container.firstChild;
    expect(tile.textContent).toBe(gemArt('ruby').glyph);
    expect(tile.getAttribute('style')).toMatch(/background-color/);
  });

  it('is hidden from assistive tech, being decoration beside a label', () => {
    const { container } = render(<GemGlyph speciesId="ruby" />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a neutral placeholder with no tint when hidden', () => {
    const { container } = render(<GemGlyph speciesId="ruby" hidden />);
    const tile = container.firstChild;
    expect(tile.textContent).toBe('❔');
    // the real tint must not leak for an undiscovered species
    expect(tile.getAttribute('style')).toBeNull();
  });

  it('applies a different size per variant', () => {
    const hero = render(<GemGlyph speciesId="ruby" variant="hero" />).container.firstChild.className;
    const pool = render(<GemGlyph speciesId="ruby" variant="pool" />).container.firstChild.className;
    expect(hero).not.toBe(pool);
    expect(hero).toMatch(/h-20/);
    expect(pool).toMatch(/h-7/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemGlyph.test.jsx`
Expected: FAIL — cannot resolve `./GemGlyph.jsx`.

- [ ] **Step 3: Write `GemGlyph.jsx`**

Create `src/features/rockhound/components/GemGlyph.jsx`:

```jsx
import { gemArt } from '../logic/gemArt.js';

// Variants reproduce the four tile sizes already used across the module, so
// migrating existing call sites is a no-op visually.
const VARIANTS = {
  hero: 'h-20 w-20 rounded-xl border-slate-600 text-4xl',
  card: 'h-12 w-12 rounded-lg border-slate-600 text-2xl',
  row: 'h-10 w-10 rounded-lg border-slate-600 text-xl',
  pool: 'h-7 w-7 rounded border-slate-700 text-base'
};

/**
 * A gem's placeholder art tile. Decoration only — always aria-hidden, so it
 * must sit beside a real text label. `hidden` renders the undiscovered
 * placeholder and deliberately omits the tint, which would leak the colour.
 */
export default function GemGlyph({ speciesId, variant = 'row', hidden = false }) {
  const art = gemArt(speciesId);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center border ${VARIANTS[variant] ?? VARIANTS.row}`}
      style={hidden ? undefined : { backgroundColor: `${art.tint}33` }}
    >
      {hidden ? '❔' : art.glyph}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemGlyph.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Migrate the four existing call sites**

Replace each hand-rolled tile with `<GemGlyph>`, choosing the variant that matches the size it already used. Add `import GemGlyph from './GemGlyph.jsx';` to each file.

- `SpeciesCard.jsx` — the `<div className="relative flex h-12 w-12 ...">` tile becomes `<GemGlyph speciesId={species.id} variant="card" />`.
- `TrophyCase.jsx` — the `<span className="flex h-10 w-10 ...">` tile becomes `<GemGlyph speciesId={speciesId} variant="row" />`.
- `GemdexEntry.jsx` — the `<div className="flex h-20 w-20 ...">` tile becomes `<GemGlyph speciesId={species.id} variant="hero" />`. The local `const art = gemArt(species.id);` is then unused for the tile; keep it only if something else still reads it, otherwise remove it and drop `gemArt` from that file's imports (`colorHex` is still needed).
- `LocalityEntry.jsx` — the pool `<span className="flex h-7 w-7 ...">` tile becomes `<GemGlyph speciesId={entry.speciesId} variant="pool" hidden={!entry.discovered} />`. This replaces the existing `entry.discovered ? … : '❔'` and conditional-style logic. Remove the now-unused `const art = gemArt(entry.speciesId);` and the `gemArt` import if nothing else uses it.
- Leave `LocalityCard.jsx` alone — it renders a bare inline glyph in a tight row with no tile chrome, which is a different thing.

- [ ] **Step 6: Verify nothing regressed**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — the full suite, **with no edits to any existing test**. These four components are covered by `GemdexV5.test.jsx`, `TrophyCase.test.jsx`, `GemdexEntry.test.jsx` and `LocalityEntry.test.jsx`; if any fails, the migration changed behaviour. In particular `LocalityEntry.test.jsx` asserts `getAllByText('???').length` and the spoiler rule — those must still hold.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components
git commit -m "refactor(rockhound): extract shared GemGlyph tile"
```

---

### Task 2: Cut derivations — true odds, risk, and what a cut reveals

The screen currently shows the technique's base success rate, but `applyCut` rolls against `cutSuccessProbability`, which also multiplies by species difficulty. Fix that by deriving what the player actually faces.

**Files:**
- Modify: `src/features/rockhound/logic/cut.js` (add `scoreBreakdown`; `specimenScore` delegates to it)
- Create: `src/features/rockhound/logic/cutView.js`
- Create: `src/features/rockhound/logic/cutView.test.js`
- Modify: `src/features/rockhound/logic/cut.test.js` (add coverage for `scoreBreakdown`)

**Interfaces:**
- `cut.js` gains:
  - `SCORE_WEIGHTS` — `{ carat: 0.25, color: 0.25, clarity: 0.2, cut: 0.3 }`
  - `scoreBreakdown(specimen, species) -> { parts: [{ key, label, raw, normalised, weight, points }], traitBonus, total }` — the single computation; `specimenScore` becomes `(s, sp) => scoreBreakdown(s, sp).total` so the two can never drift.
- `cutView.js` produces:
  - `techniqueView(species, technique, level) -> { level, unlocked, suitable, successPct, keepsPct: [lo,hi], qualityRange: [lo,hi], reveals: [phenomenonType], shatterRisk, unsuitableReason }`
    - `successPct` is the **true** probability (`cutSuccessProbability`), rounded; `null` when locked or when no species is selected.
    - `shatterRisk` is true only when the technique is `catastrophicOnFail` **and** the species' cleavage is `good` or `perfect` — the actual condition `applyCut` checks.
    - `unsuitableReason` is a short sentence when `suitable` is false, else `null`.
  - `expectedCarat(specimen, technique) -> [lo, hi]` — carat retained range, rounded to 2dp.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/cutView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { techniqueView, expectedCarat } from './cutView.js';
import { cutSuccessProbability } from './cut.js';

const RUBY = { id: 'ruby', name: 'Ruby', transparency: 'transparent', cleavage: 'none', cutDifficulty: 4, suitableCuts: ['cabochon', 'princess'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const TOPAZ = { id: 'topaz', name: 'Topaz', transparency: 'transparent', cleavage: 'perfect', cutDifficulty: 3, suitableCuts: ['princess'], phenomena: [] };

const CABOCHON = { id: 'cabochon', name: 'Cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9], catastrophicOnFail: false, successCurve: { base: 0.65, perLevel: 0.035, maxLevel: 10 } };
const PRINCESS = { id: 'princess', name: 'Princess / Boxed Cut', cutQualityRange: [65, 105], yieldRange: [0.65, 0.85], catastrophicOnFail: true, successCurve: { base: 0.40, perLevel: 0.050, maxLevel: 10 } };

describe('techniqueView', () => {
  it('reports the TRUE success odds, not the technique base rate', () => {
    const view = techniqueView(RUBY, CABOCHON, 4);
    // cabochon Lv4 base is 75.5%, but ruby's cutDifficulty 4 scales it down
    expect(view.successPct).toBe(Math.round(cutSuccessProbability(RUBY, CABOCHON, 4) * 100));
    expect(view.successPct).toBeLessThan(70);
  });

  it('has no success figure for a technique that is not learned', () => {
    expect(techniqueView(RUBY, CABOCHON, 0)).toMatchObject({ unlocked: false, successPct: null });
  });

  it('names the phenomenon a cut would reveal', () => {
    expect(techniqueView(RUBY, CABOCHON, 1).reveals).toEqual(['asterism']);
    expect(techniqueView(RUBY, PRINCESS, 1).reveals).toEqual([]);
  });

  it('flags shatter risk only when the cut is catastrophic AND the stone cleaves', () => {
    // topaz has perfect cleavage and princess is catastrophic -> real risk
    expect(techniqueView(TOPAZ, PRINCESS, 1).shatterRisk).toBe(true);
    // ruby does not cleave, so princess cannot shatter it
    expect(techniqueView(RUBY, PRINCESS, 1).shatterRisk).toBe(false);
    // cabochon is never catastrophic
    expect(techniqueView(TOPAZ, CABOCHON, 1).shatterRisk).toBe(false);
  });

  it('reports suitability and explains an unsuitable pairing', () => {
    const ok = techniqueView(RUBY, CABOCHON, 1);
    expect(ok.suitable).toBe(true);
    expect(ok.unsuitableReason).toBeNull();

    const no = techniqueView(TOPAZ, CABOCHON, 1);
    expect(no.suitable).toBe(false);
    expect(no.unsuitableReason).toMatch(/Topaz/);
  });

  it('reports what fraction of the stone the cut keeps, and the quality band', () => {
    const view = techniqueView(RUBY, CABOCHON, 1);
    expect(view.keepsPct).toEqual([70, 90]);
    expect(view.qualityRange).toEqual([50, 100]);
  });

  it('tolerates no selected species', () => {
    const view = techniqueView(null, CABOCHON, 3);
    expect(view).toMatchObject({ unlocked: true, suitable: false, successPct: null, shatterRisk: false });
  });
});

describe('expectedCarat', () => {
  it('scales the yield range by the stone weight', () => {
    expect(expectedCarat({ caratWeight: 2 }, CABOCHON)).toEqual([1.4, 1.8]);
  });
});
```

Add to `src/features/rockhound/logic/cut.test.js`:

```js
import { scoreBreakdown, specimenScore, SCORE_WEIGHTS } from './cut.js';

describe('scoreBreakdown', () => {
  const SPECIES = { id: 'ruby', baseValue: 900, phenomena: [] };
  const STONE = { caratRetained: 1.4, cutQuality: 88, colorGrade: 91, clarity: 82, phenomena: ['asterism'] };

  it('totals to exactly what specimenScore returns', () => {
    expect(scoreBreakdown(STONE, SPECIES).total).toBe(specimenScore(STONE, SPECIES));
  });

  it('splits the score into the four graded parts plus a trait bonus', () => {
    const b = scoreBreakdown(STONE, SPECIES);
    expect(b.parts.map((p) => p.key)).toEqual(['carat', 'color', 'clarity', 'cut']);
    expect(b.traitBonus).toBe(15); // phenomena revealed
    const sum = b.parts.reduce((t, p) => t + p.points, 0) + b.traitBonus;
    expect(Math.round(sum)).toBe(b.total);
  });

  it('weights each part as SCORE_WEIGHTS declares', () => {
    const b = scoreBreakdown(STONE, SPECIES);
    expect(b.parts.find((p) => p.key === 'cut').weight).toBe(SCORE_WEIGHTS.cut);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/cutView.test.js src/features/rockhound/logic/cut.test.js`
Expected: FAIL — cannot resolve `./cutView.js`; `scoreBreakdown` is not exported.

- [ ] **Step 3: Add `scoreBreakdown` to `cut.js`**

In `src/features/rockhound/logic/cut.js`, replace the existing `specimenScore` function with the breakdown plus a delegating `specimenScore`:

```js
export const SCORE_WEIGHTS = { carat: 0.25, color: 0.25, clarity: 0.2, cut: 0.3 };

/**
 * The score with its parts exposed, so the Market can show a player why a
 * stone is worth what it is. This is the single computation — specimenScore
 * delegates to it so the two can never drift apart.
 */
export function scoreBreakdown(specimen, species) {
  const carat = specimen.caratRetained ?? specimen.caratWeight ?? 0;
  const caratNorm = clamp(carat / 5, 0, 1) * 100; // 5 ct saturates
  const raws = {
    carat: { raw: carat, normalised: caratNorm, label: 'Carat' },
    color: { raw: specimen.colorGrade ?? 0, normalised: specimen.colorGrade ?? 0, label: 'Colour' },
    clarity: { raw: specimen.clarity ?? 0, normalised: specimen.clarity ?? 0, label: 'Clarity' },
    cut: { raw: specimen.cutQuality ?? 0, normalised: specimen.cutQuality ?? 0, label: 'Cut' }
  };
  const parts = Object.entries(raws).map(([key, v]) => ({
    key,
    label: v.label,
    raw: v.raw,
    normalised: v.normalised,
    weight: SCORE_WEIGHTS[key],
    points: SCORE_WEIGHTS[key] * v.normalised
  }));
  const traitBonus = (specimen.phenomena?.length ? 15 : 0) + (specimen.untreated ? 5 : 0);
  const total = Math.round(parts.reduce((t, p) => t + p.points, 0) + traitBonus);
  return { parts, traitBonus, total };
}

export function specimenScore(specimen, species) {
  return scoreBreakdown(specimen, species).total;
}
```

Note `species` is unused by the computation but stays in both signatures — existing callers pass it and it keeps the API stable.

- [ ] **Step 4: Write `cutView.js`**

Create `src/features/rockhound/logic/cutView.js`:

```js
import { canApply, cutSuccessProbability } from './cut.js';

const CLEAVES = ['good', 'perfect'];
const round2 = (n) => Math.round(n * 100) / 100;
const pct = (x) => Math.round(x * 100);

/**
 * A technique as it applies to the selected stone. `successPct` is the TRUE
 * probability applyCut will roll against — the technique's own curve scaled by
 * the species' cut difficulty — not the bare curve value.
 */
export function techniqueView(species, technique, level) {
  const unlocked = level >= 1;
  const suitable = !!species && canApply(species, technique);
  return {
    level,
    unlocked,
    suitable,
    successPct: unlocked && species ? pct(cutSuccessProbability(species, technique, level)) : null,
    keepsPct: [pct(technique.yieldRange[0]), pct(technique.yieldRange[1])],
    qualityRange: technique.cutQualityRange,
    reveals: (species?.phenomena ?? [])
      .filter((p) => p.revealedBy === technique.id)
      .map((p) => p.type),
    // The exact condition applyCut checks before destroying the stone.
    shatterRisk: !!technique.catastrophicOnFail && CLEAVES.includes(species?.cleavage),
    unsuitableReason: suitable || !species ? null : `${species.name} does not take this cut`
  };
}

/** Carat the stone would retain, as a [low, high] range. */
export function expectedCarat(specimen, technique) {
  const w = specimen.caratWeight ?? 0;
  return [round2(w * technique.yieldRange[0]), round2(w * technique.yieldRange[1])];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/cutView.test.js src/features/rockhound/logic/cut.test.js`
Expected: PASS — 8 new `cutView` tests, 3 new `scoreBreakdown` tests, and every pre-existing `cut.test.js` test still green (the `specimenScore` delegation must not change any result).

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/logic
git commit -m "feat(cut): derive true cut odds, shatter risk and score breakdown"
```

---

### Task 3: The Cut screen

Tray of stones on the left, workbench on the right. Every technique states its true odds, what it keeps, what it reveals and what it risks. No last-cut readout.

**Files:**
- Create: `src/features/rockhound/components/TechniqueCard.jsx`
- Create: `src/features/rockhound/components/TechniqueGuide.jsx`
- Modify: `src/features/rockhound/components/Cut.jsx` (full rewrite)
- Modify: `src/features/rockhound/components/Cut.test.jsx` (rewrite)
- Modify: `src/features/rockhound/components/Rockhound.jsx` (drop the `lastCutResult` prop)
- Modify: `src/features/rockhound/components/Rockhound.test.jsx` (only if an assertion referenced the last-cut line)

**Interfaces:**
- Consumes: `GemGlyph` (Task 1); `techniqueView`, `expectedCarat` (Task 2); `EntryModal`, `Section`, `Row`.
- Produces:
  - `TechniqueCard({ technique, view, specimen, onUnlock, onLevel, onApply, onOpenGuide })` — one technique row.
  - `TechniqueGuide({ technique, view, onClose })` — a modal explaining the cut, via `EntryModal`.
  - `Cut({ identified, techniques, cutTechniqueLevel, speciesById, selectedId, onSelectSpecimen, onUnlock, onLevel, onApply })` — note `lastCutResult` is **removed** from the props.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/features/rockhound/components/Cut.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cut from './Cut.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';
import { cutSuccessProbability } from '../logic/cut.js';

const RUBY_ROUGH = { instanceId: 'i1', stage: 'identified', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91, origin: 'mogok_marble' };
const TOPAZ_ROUGH = { instanceId: 'i2', stage: 'identified', trueSpeciesId: 'topaz', caratWeight: 2.0, clarity: 70, colorGrade: 60, origin: 'old_quarry' };

function renderCut(overrides = {}) {
  const props = {
    identified: [RUBY_ROUGH, TOPAZ_ROUGH],
    techniques: cutTechniques,
    cutTechniqueLevel: { cabochon: 4, princess: 1 },
    speciesById,
    selectedId: 'i1',
    onSelectSpecimen: vi.fn(),
    onUnlock: vi.fn(),
    onLevel: vi.fn(),
    onApply: vi.fn(),
    ...overrides
  };
  render(<Cut {...props} />);
  return props;
}

describe('Cut', () => {
  it('prompts when there is nothing to cut', () => {
    renderCut({ identified: [] });
    screen.getByText(/nothing to cut/i);
  });

  it('lists the stones on the bench and lets one be picked', () => {
    const { onSelectSpecimen } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /^Topaz,/ }));
    expect(onSelectSpecimen).toHaveBeenCalledWith('i2');
  });

  it('shows the selected stone measurements so the choice is informed', () => {
    renderCut();
    screen.getByText('1.8 ct');
    screen.getByText('91');  // colour grade
    screen.getByText('82');  // clarity
  });

  it('shows the TRUE success odds, not the technique base rate', () => {
    renderCut();
    const truth = Math.round(cutSuccessProbability(speciesById.ruby, cutTechniques.find((t) => t.id === 'cabochon'), 4) * 100);
    screen.getByText(`${truth}%`);
    // the bare curve value (76%) must not be what we display
    expect(truth).toBeLessThan(76);
    expect(screen.queryByText('76%')).toBeNull();
  });

  it('advertises the phenomenon a cut would reveal', () => {
    renderCut();
    screen.getByText(/asterism/i);
  });

  it('warns when a cut can shatter the selected stone', () => {
    // topaz has perfect cleavage; princess is catastrophic
    renderCut({ selectedId: 'i2' });
    screen.getByText(/can shatter/i);
  });

  it('does not warn about shattering a stone that cannot cleave', () => {
    renderCut({ selectedId: 'i1' }); // ruby, cleavage none
    expect(screen.queryByText(/can shatter/i)).toBeNull();
  });

  it('explains why an unsuitable technique cannot be used', () => {
    renderCut({ selectedId: 'i2' }); // topaz takes only princess
    screen.getByText(/does not take this cut/i);
  });

  it('applies a cut with the selected stone and technique', () => {
    const { onApply } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /Cut it with Cabochon/i }));
    expect(onApply).toHaveBeenCalledWith('i1', 'cabochon');
  });

  it('offers Learn for an unlearned technique and Practice for a learned one', () => {
    const { onUnlock, onLevel } = renderCut();
    fireEvent.click(screen.getByRole('button', { name: /Learn Step/i }));
    expect(onUnlock).toHaveBeenCalledWith('step');
    fireEvent.click(screen.getByRole('button', { name: /Practice Cabochon/i }));
    expect(onLevel).toHaveBeenCalledWith('cabochon');
  });

  it('opens a technique guide and closes it again', () => {
    renderCut();
    fireEvent.click(screen.getByRole('button', { name: /About Cabochon/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not show a last-cut result readout', () => {
    renderCut();
    expect(screen.queryByText(/last cut/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Cut.test.jsx`
Expected: FAIL — no stone measurements, no true odds, no risk warning, no guide.

- [ ] **Step 3: Write `TechniqueGuide.jsx`**

Create `src/features/rockhound/components/TechniqueGuide.jsx`:

```jsx
import EntryModal, { Section, Row } from './EntryModal.jsx';

const titleize = (s) => s.replace(/_/g, ' ');

export default function TechniqueGuide({ technique, view, onClose }) {
  return (
    <EntryModal titleId="technique-guide-title" onClose={onClose}>
      <div className="p-5">
        <h3 id="technique-guide-title" className="text-2xl font-bold text-slate-50">{technique.name}</h3>
        <p className="text-sm text-slate-400">
          Difficulty {'●'.repeat(technique.difficulty)}{'○'.repeat(5 - technique.difficulty)}
          {view.unlocked ? ` · learned to Lv ${view.level}` : ' · not learned yet'}
        </p>
      </div>

      <Section title="Odds on this stone">
        <Row label="Success">
          {view.successPct == null ? 'learn it first' : `${view.successPct}%`}
        </Row>
        <Row label="Keeps">{view.keepsPct[0]}–{view.keepsPct[1]}% of the carat</Row>
        <Row label="Cut quality">{view.qualityRange[0]}–{view.qualityRange[1]}</Row>
      </Section>

      <Section title="Suits">
        <Row label="Stone type">
          <span className="capitalize">{technique.suitableFor.transparency.join(', ')}</span>
        </Row>
        {view.reveals.length > 0 && (
          <Row label="✨ Reveals">
            <span className="capitalize">{view.reveals.map(titleize).join(', ')}</span>
          </Row>
        )}
      </Section>

      {view.shatterRisk && (
        <Section title="⚠️ Risk">
          <p className="text-sm text-red-300">
            This stone cleaves. A failed cut here can shatter it and lose it for good.
          </p>
        </Section>
      )}
    </EntryModal>
  );
}
```

- [ ] **Step 4: Write `TechniqueCard.jsx`**

Create `src/features/rockhound/components/TechniqueCard.jsx`:

```jsx
import { expectedCarat } from '../logic/cutView.js';

const titleize = (s) => s.replace(/_/g, ' ');

export default function TechniqueCard({
  technique, view, specimen, onUnlock, onLevel, onApply, onOpenGuide
}) {
  const carat = specimen ? expectedCarat(specimen, technique) : null;
  const dim = !view.unlocked || !view.suitable;

  return (
    <li className={`rounded-lg border p-3 ${dim ? 'border-slate-700 bg-slate-800/40' : 'border-slate-600 bg-slate-800'}`}>
      <div className="flex items-baseline gap-2">
        <span className={`font-semibold ${dim ? 'text-slate-400' : 'text-slate-100'}`}>{technique.name}</span>
        {view.unlocked && <span className="text-xs text-slate-500">Lv {view.level}</span>}
        {view.successPct != null && view.suitable && (
          <span className="ml-auto font-mono text-sm text-yellow-400">{view.successPct}%</span>
        )}
        <button
          type="button"
          aria-label={`About ${technique.name}`}
          onClick={() => onOpenGuide(technique.id)}
          className={`${view.successPct != null && view.suitable ? '' : 'ml-auto '}rounded px-1 text-slate-400 hover:text-white`}
        >
          ⓘ
        </button>
      </div>

      {view.suitable ? (
        <p className="mt-0.5 text-xs text-slate-400">
          keeps {view.keepsPct[0]}–{view.keepsPct[1]}%
          {carat && <> · {carat[0]}–{carat[1]} ct</>} · quality {view.qualityRange[0]}–{view.qualityRange[1]}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-slate-500">{view.unsuitableReason ?? 'no stone selected'}</p>
      )}

      {view.reveals.length > 0 && view.suitable && (
        <p className="mt-1 text-xs capitalize text-yellow-400">
          ✨ reveals {view.reveals.map(titleize).join(', ')}
        </p>
      )}

      {view.shatterRisk && view.suitable && (
        <p className="mt-1 text-xs text-red-300">⚠️ can shatter this stone — it cleaves</p>
      )}

      <div className="mt-2 flex gap-2">
        {!view.unlocked ? (
          <button
            type="button"
            aria-label={`Learn ${technique.name}`}
            onClick={() => onUnlock(technique.id)}
            className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500"
          >
            Learn
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Practice ${technique.name}`}
            onClick={() => onLevel(technique.id)}
            className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500"
          >
            Practice
          </button>
        )}
        {view.unlocked && view.suitable && specimen && (
          <button
            type="button"
            aria-label={`Cut it with ${technique.name}`}
            onClick={() => onApply(specimen.instanceId, technique.id)}
            className="rounded bg-yellow-500 px-3 py-1 text-sm font-bold text-slate-900 hover:bg-yellow-400"
          >
            Cut it
          </button>
        )}
      </div>
    </li>
  );
}
```

- [ ] **Step 5: Rewrite `Cut.jsx`**

Replace the whole of `src/features/rockhound/components/Cut.jsx`:

```jsx
import { useState } from 'react';
import GemGlyph from './GemGlyph.jsx';
import TechniqueCard from './TechniqueCard.jsx';
import TechniqueGuide from './TechniqueGuide.jsx';
import { techniqueView } from '../logic/cutView.js';

function Meter({ label, value, max = 100, unit = '' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-16 text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="w-12 font-mono text-sm text-slate-200">{value}{unit}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-700">
        <span className="block h-full bg-yellow-400" style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </span>
    </div>
  );
}

export default function Cut({
  identified, techniques, cutTechniqueLevel, speciesById,
  selectedId, onSelectSpecimen, onUnlock, onLevel, onApply
}) {
  const [guideId, setGuideId] = useState(null);

  if (identified.length === 0) {
    return <p className="text-slate-400">Nothing to cut yet — identify a specimen first.</p>;
  }

  const selected = identified.find((s) => s.instanceId === selectedId) ?? identified[0];
  const species = selected ? speciesById[selected.trueSpeciesId] : null;
  const guide = guideId ? techniques.find((t) => t.id === guideId) : null;

  return (
    <section className="flex flex-col gap-6 md:flex-row">
      <div className="flex flex-col gap-2 md:w-1/3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400">Stone tray</h3>
        {identified.map((sp) => {
          const s = speciesById[sp.trueSpeciesId];
          const isSel = sp.instanceId === selected?.instanceId;
          return (
            <button
              key={sp.instanceId}
              type="button"
              aria-label={`${s.name}, ${sp.caratWeight} carat`}
              onClick={() => onSelectSpecimen(sp.instanceId)}
              className={`flex items-center gap-3 rounded-lg border p-2 text-left ${
                isSel ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <GemGlyph speciesId={sp.trueSpeciesId} variant="row" />
              <span>
                <span className="block text-slate-100">{s.name}</span>
                <span className="block text-xs text-slate-400">{sp.caratWeight} ct</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:w-2/3">
        {species && (
          <div className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
            <GemGlyph speciesId={species.id} variant="hero" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-50">{species.name}</h3>
              <p className="mb-2 text-xs text-slate-500">
                Hardness {Array.isArray(species.hardness) ? species.hardness.join('–') : species.hardness}
                {' · '}cleavage <span className="capitalize">{species.cleavage}</span>
                {' · '}difficulty {'●'.repeat(species.cutDifficulty)}{'○'.repeat(5 - species.cutDifficulty)}
              </p>
              <Meter label="Carat" value={selected.caratWeight} max={5} unit=" ct" />
              <Meter label="Colour" value={selected.colorGrade} />
              <Meter label="Clarity" value={selected.clarity} />
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {techniques.map((t) => (
            <TechniqueCard
              key={t.id}
              technique={t}
              view={techniqueView(species, t, cutTechniqueLevel[t.id] ?? 0)}
              specimen={selected}
              onUnlock={onUnlock}
              onLevel={onLevel}
              onApply={onApply}
              onOpenGuide={setGuideId}
            />
          ))}
        </ul>
      </div>

      {guide && (
        <TechniqueGuide
          technique={guide}
          view={techniqueView(species, guide, cutTechniqueLevel[guide.id] ?? 0)}
          onClose={() => setGuideId(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 6: Drop `lastCutResult` from the shell**

In `src/features/rockhound/components/Rockhound.jsx`, remove the `lastCutResult={state.lastCutResult}` line from the `<Cut ... />` props. Leave `state.lastCutResult` in the reducer untouched — it is still written by `APPLY_CUT` and is out of scope here.

- [ ] **Step 7: Run the suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. If a `Rockhound.test.jsx` assertion referenced the last-cut line, update that one assertion; otherwise change nothing there.

- [ ] **Step 8: Commit**

```bash
git add src/features/rockhound/components
git commit -m "feat(cut): workbench with true odds, reveal preview and shatter warning"
```

---

### Task 4: Market derivations — why a price is what it is

**Files:**
- Create: `src/features/rockhound/logic/marketView.js`
- Create: `src/features/rockhound/logic/marketView.test.js`

**Interfaces:**
- Consumes: `stoneValue`, `identifiedValue`, `gradeFactor`, `UNCUT_DISCOUNT` from `./market.js`; `scoreBreakdown`, `specimenScore` from `./cut.js`.
- Produces:
  - `stonePrice(stone, species) -> { total, base, score, multiplier, parts, traitBonus }` — `parts`/`traitBonus` come straight from `scoreBreakdown`.
  - `roughPrice(specimen, species) -> { total, base, colorGrade, clarity, multiplier, uncutDiscount }`
  - `bestCutEstimate(specimen, species, techniques) -> number | null` — indicative value if cut with the best-suited technique at a mid roll; `null` when no technique suits.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/marketView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { stonePrice, roughPrice, bestCutEstimate } from './marketView.js';
import { stoneValue, identifiedValue } from './market.js';

const RUBY = { id: 'ruby', name: 'Ruby', baseValue: 900, suitableCuts: ['cabochon'], phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }] };
const AGATE = { id: 'agate', name: 'Agate', baseValue: 15, suitableCuts: [], phenomena: [] };
const CABOCHON = { id: 'cabochon', cutQualityRange: [50, 100], yieldRange: [0.7, 0.9] };

const STONE = { trueSpeciesId: 'ruby', caratRetained: 1.4, cutQuality: 88, colorGrade: 91, clarity: 82, phenomena: ['asterism'], score: 88 };
const ROUGH = { trueSpeciesId: 'ruby', caratWeight: 1.8, colorGrade: 91, clarity: 82 };

describe('stonePrice', () => {
  it('agrees with the value rule it explains', () => {
    expect(stonePrice(STONE, RUBY).total).toBe(stoneValue(STONE, RUBY));
  });

  it('exposes the base value, the grade multiplier and the score parts', () => {
    const p = stonePrice(STONE, RUBY);
    expect(p.base).toBe(900);
    expect(p.multiplier).toBeCloseTo(0.5 + 88 / 100, 5);
    expect(p.parts.map((x) => x.key)).toEqual(['carat', 'color', 'clarity', 'cut']);
    expect(p.traitBonus).toBe(15);
  });
});

describe('roughPrice', () => {
  it('agrees with the value rule it explains', () => {
    expect(roughPrice(ROUGH, RUBY).total).toBe(identifiedValue(ROUGH, RUBY));
  });

  it('exposes the uncut penalty', () => {
    expect(roughPrice(ROUGH, RUBY).uncutDiscount).toBe(0.5);
  });
});

describe('bestCutEstimate', () => {
  it('estimates above the rough price, so cutting reads as worthwhile', () => {
    const estimate = bestCutEstimate(ROUGH, RUBY, [CABOCHON]);
    expect(estimate).toBeGreaterThan(identifiedValue(ROUGH, RUBY));
  });

  it('is null when no technique suits the species', () => {
    expect(bestCutEstimate({ caratWeight: 3, colorGrade: 50, clarity: 50 }, AGATE, [CABOCHON])).toBeNull();
  });

  it('ignores techniques the species cannot take', () => {
    const other = { id: 'fancy', cutQualityRange: [70, 110], yieldRange: [0.5, 0.8] };
    expect(bestCutEstimate(ROUGH, RUBY, [other])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/marketView.test.js`
Expected: FAIL — cannot resolve `./marketView.js`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/logic/marketView.js`:

```js
import { stoneValue, identifiedValue, gradeFactor, UNCUT_DISCOUNT } from './market.js';
import { scoreBreakdown, specimenScore } from './cut.js';

const mid = ([lo, hi]) => (lo + hi) / 2;

/**
 * A cut stone's price with its arithmetic exposed. `total` comes from the
 * value rule in market.js; this only explains it.
 */
export function stonePrice(stone, species) {
  const { parts, traitBonus } = scoreBreakdown(stone, species);
  return {
    total: stoneValue(stone, species),
    base: species.baseValue,
    score: stone.score ?? specimenScore(stone, species),
    multiplier: gradeFactor(stone.score),
    parts,
    traitBonus
  };
}

/** An uncut stone's price, including the penalty for selling it rough. */
export function roughPrice(specimen, species) {
  return {
    total: identifiedValue(specimen, species),
    base: species.baseValue,
    colorGrade: specimen.colorGrade,
    clarity: specimen.clarity,
    multiplier: 0.5 + ((specimen.colorGrade + specimen.clarity) / 2) / 100,
    uncutDiscount: UNCUT_DISCOUNT
  };
}

/**
 * Indicative value if this rough were cut with its best-suited technique at a
 * middling roll. An estimate to inform the sell-or-cut choice, not a promise.
 */
export function bestCutEstimate(specimen, species, techniques) {
  const suitable = techniques.filter((t) => species.suitableCuts.includes(t.id));
  if (suitable.length === 0) return null;
  return suitable.reduce((best, t) => {
    const cut = {
      ...specimen,
      caratRetained: (specimen.caratWeight ?? 0) * mid(t.yieldRange),
      cutQuality: mid(t.cutQualityRange),
      phenomena: (species.phenomena ?? []).filter((p) => p.revealedBy === t.id).map((p) => p.type)
    };
    const value = stoneValue({ score: specimenScore(cut, species) }, species);
    return Math.max(best, value);
  }, 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/marketView.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic
git commit -m "feat(market): price breakdown and best-cut estimate derivations"
```

---

### Task 5: The Market screen

Rough and cut separated, art on every row, a price-breakdown modal, gear that says what it opens, and no duplicate cash readout.

**Files:**
- Create: `src/features/rockhound/components/PriceBreakdown.jsx`
- Modify: `src/features/rockhound/components/Market.jsx` (full rewrite)
- Modify: `src/features/rockhound/components/Market.test.jsx` (rewrite)
- Modify: `src/features/rockhound/components/Rockhound.jsx` (pass `cutTechniques` to Market)

**Interfaces:**
- Consumes: `GemGlyph`; `stonePrice`, `roughPrice`, `bestCutEstimate` (Task 4); `EntryModal`, `Section`, `Row`; `SHOP_GEAR` from `../logic/market.js`.
- Produces:
  - `PriceBreakdown({ title, price, kind, onClose })` — `kind` is `'rough' | 'cut'`; renders the arithmetic.
  - `Market({ cash, identified, stones, speciesById, ownedGear, techniques, onSellIdentified, onSellStone, onBuyGear })` — gains `techniques`; **must not render its own cash total**, the shell already shows one.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/features/rockhound/components/Market.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Market from './Market.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';
import { identifiedValue, stoneValue } from '../logic/market.js';

const ROUGH = { instanceId: 'i1', trueSpeciesId: 'ruby', caratWeight: 1.8, clarity: 82, colorGrade: 91 };
const STONE = { instanceId: 's1', trueSpeciesId: 'ruby', cut: 'cabochon', cutQuality: 88, caratRetained: 1.4, clarity: 82, colorGrade: 91, phenomena: ['asterism'], score: 88 };

function renderMarket(overrides = {}) {
  const props = {
    cash: 340,
    identified: [ROUGH],
    stones: [STONE],
    speciesById,
    ownedGear: ['sieve'],
    techniques: cutTechniques,
    onSellIdentified: vi.fn(),
    onSellStone: vi.fn(),
    onBuyGear: vi.fn(),
    ...overrides
  };
  render(<Market {...props} />);
  return props;
}

describe('Market', () => {
  it('prompts when there is nothing to sell', () => {
    renderMarket({ identified: [], stones: [] });
    screen.getByText(/nothing to sell/i);
  });

  it('separates rough from cut stones', () => {
    renderMarket();
    screen.getByText(/rough/i);
    screen.getByText(/cut stones/i);
  });

  it('does not duplicate the cash total the shell already shows', () => {
    renderMarket();
    expect(screen.queryByText(/💰 340/)).toBeNull();
  });

  it('prices rough and cut stones by the value rules', () => {
    renderMarket();
    screen.getByText(String(identifiedValue(ROUGH, speciesById.ruby)));
    screen.getByText(String(stoneValue(STONE, speciesById.ruby)));
  });

  it('suggests what cutting a rough stone could fetch', () => {
    renderMarket();
    screen.getByText(/could fetch/i);
  });

  it('sells a rough stone and a cut stone', () => {
    const { onSellIdentified, onSellStone } = renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Sell rough Ruby/i }));
    expect(onSellIdentified).toHaveBeenCalledWith('i1');
    fireEvent.click(screen.getByRole('button', { name: /Sell cut Ruby/i }));
    expect(onSellStone).toHaveBeenCalledWith('s1');
  });

  it('explains a price in a breakdown modal', () => {
    renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Why this price for cut Ruby/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toMatch(/900/);      // base value
    expect(dialog.textContent).toMatch(/Clarity/i); // a score part
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the uncut penalty when explaining a rough price', () => {
    renderMarket();
    fireEvent.click(screen.getByRole('button', { name: /Why this price for rough Ruby/i }));
    expect(screen.getByRole('dialog').textContent).toMatch(/uncut/i);
  });

  it('says what each piece of gear opens, and marks what is owned', () => {
    renderMarket();
    screen.getByText(/Gravel Bar/);
    screen.getByRole('button', { name: /Buy Rock Hammer/i });
    expect(screen.getByRole('button', { name: /Rock Hammer/i }).disabled).toBe(true); // 340 < 300? no: affordable
  });

  it('disables a purchase that cannot be afforded', () => {
    renderMarket({ cash: 10, ownedGear: [] });
    expect(screen.getByRole('button', { name: /Buy Sieve/i }).disabled).toBe(true);
  });
});
```

Note on the gear test: with `cash: 340` the Rock Hammer at 300 **is** affordable, so the `.disabled` expectation above is wrong as written — while implementing, correct that assertion to `false` and keep the separate unaffordable case. Report the correction.

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Market.test.jsx`
Expected: FAIL — no sections, no breakdown modal, no gear descriptions.

- [ ] **Step 3: Write `PriceBreakdown.jsx`**

Create `src/features/rockhound/components/PriceBreakdown.jsx`:

```jsx
import EntryModal, { Section, Row } from './EntryModal.jsx';

const money = (n) => `💰 ${Math.round(n).toLocaleString()}`;

export default function PriceBreakdown({ title, price, kind, onClose }) {
  return (
    <EntryModal titleId="price-breakdown-title" onClose={onClose}>
      <div className="p-5">
        <h3 id="price-breakdown-title" className="text-2xl font-bold text-slate-50">{title}</h3>
        <p className="text-sm text-slate-400">{money(price.total)}</p>
      </div>

      <Section title="How it adds up">
        <Row label="Base value">{money(price.base)}</Row>
        {kind === 'cut' ? (
          <>
            <Row label="Grade score">{price.score} / 120</Row>
            <Row label="Multiplier">×{price.multiplier.toFixed(2)}</Row>
          </>
        ) : (
          <>
            <Row label="Colour">{price.colorGrade}</Row>
            <Row label="Clarity">{price.clarity}</Row>
            <Row label="Multiplier">×{price.multiplier.toFixed(2)}</Row>
            <Row label="Uncut penalty">×{price.uncutDiscount}</Row>
          </>
        )}
        <Row label="Sells for">{money(price.total)}</Row>
      </Section>

      {kind === 'cut' && (
        <Section title="What made the grade">
          {price.parts.map((p) => (
            <div key={p.key} className="flex items-baseline gap-2 py-0.5">
              <span className="w-16 text-xs uppercase tracking-wide text-slate-500">{p.label}</span>
              <span className="w-10 font-mono text-xs text-slate-300">{Math.round(p.raw)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-700">
                <span className="block h-full bg-yellow-400" style={{ width: `${Math.min(p.normalised, 100)}%` }} />
              </span>
              <span className="w-16 text-right font-mono text-xs text-slate-400">
                +{p.points.toFixed(1)} pts
              </span>
            </div>
          ))}
          {price.traitBonus > 0 && (
            <p className="mt-1 text-xs text-yellow-400">✨ +{price.traitBonus} for a revealed phenomenon</p>
          )}
        </Section>
      )}

      {kind === 'rough' && (
        <Section title="Why so little">
          <p className="text-sm text-slate-300">
            Uncut stones sell at {price.uncutDiscount * 100}% — a buyer takes on the risk of cutting it.
          </p>
        </Section>
      )}
    </EntryModal>
  );
}
```

- [ ] **Step 4: Rewrite `Market.jsx`**

Replace the whole of `src/features/rockhound/components/Market.jsx`:

```jsx
import { useState } from 'react';
import GemGlyph from './GemGlyph.jsx';
import PriceBreakdown from './PriceBreakdown.jsx';
import { SHOP_GEAR } from '../logic/market.js';
import { stonePrice, roughPrice, bestCutEstimate } from '../logic/marketView.js';

const money = (n) => Math.round(n).toLocaleString();
const titleize = (s) => s.replace(/_/g, ' ');

// What each purchase actually gets you — a bare price list says nothing.
const GEAR_OPENS = {
  sieve: 'opens Gravel Bar',
  rock_hammer: 'opens Pala Pegmatite and Old Quarry'
};

function SellRow({ glyphId, name, detail, total, sellLabel, whyLabel, onSell, onWhy, children }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
      <GemGlyph speciesId={glyphId} variant="row" />
      <span className="flex-1">
        <span className="block font-semibold text-slate-100">{name}</span>
        <span className="block text-xs text-slate-400">{detail}</span>
        {children}
      </span>
      <span className="font-mono text-slate-200">{money(total)}</span>
      <button type="button" aria-label={whyLabel} onClick={onWhy} className="rounded px-1 text-slate-400 hover:text-white">ⓘ</button>
      <button
        type="button"
        aria-label={sellLabel}
        onClick={onSell}
        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500"
      >
        Sell
      </button>
    </li>
  );
}

export default function Market({
  cash, identified, stones, speciesById, ownedGear, techniques,
  onSellIdentified, onSellStone, onBuyGear
}) {
  const [explain, setExplain] = useState(null); // { title, price, kind }
  const nothingToSell = identified.length === 0 && stones.length === 0;

  return (
    <section className="flex flex-col gap-6">
      {nothingToSell && (
        <p className="text-sm text-slate-500">Nothing to sell — identify or cut a stone first.</p>
      )}

      {identified.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Rough — uncut</h3>
            <span className="ml-auto text-xs text-slate-500">uncut stones sell at half</span>
          </div>
          <ul className="flex flex-col gap-2">
            {identified.map((sp) => {
              const species = speciesById[sp.trueSpeciesId];
              const price = roughPrice(sp, species);
              const estimate = bestCutEstimate(sp, species, techniques);
              return (
                <SellRow
                  key={sp.instanceId}
                  glyphId={sp.trueSpeciesId}
                  name={species.name}
                  detail={`${sp.caratWeight} ct · colour ${sp.colorGrade} · clarity ${sp.clarity}`}
                  total={price.total}
                  sellLabel={`Sell rough ${species.name}`}
                  whyLabel={`Why this price for rough ${species.name}`}
                  onSell={() => onSellIdentified(sp.instanceId)}
                  onWhy={() => setExplain({ title: `${species.name} (rough)`, price, kind: 'rough' })}
                >
                  {estimate != null && estimate > price.total && (
                    <span className="block text-xs text-yellow-400">
                      cutting this could fetch ~{money(estimate)}
                    </span>
                  )}
                </SellRow>
              );
            })}
          </ul>
        </div>
      )}

      {stones.length > 0 && (
        <div>
          <h3 className="mb-2 border-b border-slate-700 pb-1 text-xs font-bold uppercase tracking-wider text-slate-200">
            Cut stones
          </h3>
          <ul className="flex flex-col gap-2">
            {stones.map((st) => {
              const species = speciesById[st.trueSpeciesId];
              const price = stonePrice(st, species);
              return (
                <SellRow
                  key={st.instanceId}
                  glyphId={st.trueSpeciesId}
                  name={species.name}
                  detail={`${titleize(st.cut)} · ${st.caratRetained ?? st.caratWeight} ct · quality ${st.cutQuality}${st.phenomena?.length ? ' · ✨' : ''}`}
                  total={price.total}
                  sellLabel={`Sell cut ${species.name}`}
                  whyLabel={`Why this price for cut ${species.name}`}
                  onSell={() => onSellStone(st.instanceId)}
                  onWhy={() => setExplain({ title: `${species.name} (${titleize(st.cut)})`, price, kind: 'cut' })}
                />
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 border-b border-slate-700 pb-1 text-xs font-bold uppercase tracking-wider text-slate-200">
          Gear
        </h3>
        <ul className="flex flex-col gap-2">
          {SHOP_GEAR.map((g) => {
            const owned = ownedGear.includes(g.id);
            const affordable = cash >= g.price;
            return (
              <li key={g.id} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
                <span className="flex-1">
                  <span className="block font-semibold text-slate-100">
                    {owned && <span className="text-green-400">✓ </span>}{g.name}
                  </span>
                  <span className="block text-xs text-slate-400">{GEAR_OPENS[g.id] ?? ''}</span>
                </span>
                <span className="font-mono text-slate-200">{money(g.price)}</span>
                <button
                  type="button"
                  aria-label={owned ? `${g.name} owned` : `Buy ${g.name}`}
                  disabled={owned || !affordable}
                  onClick={() => onBuyGear(g.id)}
                  className={`rounded px-3 py-1 text-sm ${
                    owned || !affordable
                      ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                      : 'bg-yellow-500 font-bold text-slate-900 hover:bg-yellow-400'
                  }`}
                >
                  {owned ? 'Owned' : 'Buy'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {explain && (
        <PriceBreakdown
          title={explain.title}
          price={explain.price}
          kind={explain.kind}
          onClose={() => setExplain(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 5: Pass `techniques` from the shell**

In `src/features/rockhound/components/Rockhound.jsx`, add `techniques={cutTechniques}` to the `<Market ... />` props. `cutTechniques` is already imported in that file.

- [ ] **Step 6: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — all tests. `Rockhound.test.jsx` asserts `/nothing to sell/i` on the Market tab, which the rewrite preserves.

Run: `./node_modules/.bin/vite build`
Expected: `✓ built in …`

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components
git commit -m "feat(market): split rough from cut, explain every price, describe gear"
```

---

## Verification

Tests cannot judge whether a screen communicates. After Task 5, drive the real app:

- [ ] `./node_modules/.bin/vitest run` — all green
- [ ] `./node_modules/.bin/vite build` — clean build
- [ ] Seed a save with several identified stones (include **topaz**, which can shatter, and **ruby** or **sapphire**, which reveal asterism via cabochon) plus a couple of cut stones and some cash.
- [ ] Cut screen: the selected stone's measurements are visible; the success figure **matches `cutSuccessProbability`, not the technique's base curve** — check one case by hand; the asterism reveal line appears for ruby + cabochon; the shatter warning appears for topaz + princess and **not** for ruby + princess; an unsuitable technique states why; the technique guide opens, Escape closes it, focus returns to the ⓘ that opened it; **no last-cut readout anywhere**.
- [ ] Market screen: rough and cut are separate sections; only ONE cash total on screen (the shell's); each price's ⓘ opens a breakdown whose figures reconcile with the row; the "cutting could fetch ~X" line beats the rough price; gear says what it opens.
- [ ] Confirm neither screen is cluttered at a narrow width — both must stack without horizontal scrolling.
