# Cut Increment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Cut phase — identified specimens become cuttable with leveled techniques (abstracted skill roll), producing graded cut stones that reveal phenomena (star sapphire) and populate a best-in-species trophy case.

**Architecture:** Extend the isolated `src/features/rockhound/` module. Add one pure `logic/cut.js` (apply-a-cut roll, suitability, specimen scoring) reusing the existing `cutSuccessAtLevel` helper. Thread `cutTechniqueLevel` + `bestSpecimens` into `RockhoundContext` with `UNLOCK_TECHNIQUE`/`LEVEL_TECHNIQUE`/`APPLY_CUT` actions. Add a presentational `Cut` component and wire a Cut tab + trophy list into the shell. No legacy files touched.

**Tech Stack:** React 18 + Vite, Zod-validated YAML data, Vitest + React Testing Library (jsdom), Tailwind v4.

## Global Constraints

- **Package manager:** local binary, not `pnpm exec`: `./node_modules/.bin/vitest run <path>`; build `./node_modules/.bin/vite build`.
- **Unit tests under `src/**`** (`.test.js`/`.test.jsx`); no `@testing-library/jest-dom` (assert via `getByText`/`getByRole` throw-on-miss, `queryByText(...) === null`, `fireEvent`). The `localStorage` shim in `src/setupTests.js` exists; do not modify it.
- **Injectable randomness:** logic never calls `Math.random` directly; `applyCut` and `APPLY_CUT` take an `rng` (default `Math.random`).
- **Isolation:** only edit files under `src/features/rockhound/`. Do NOT touch `GameContext.jsx`, legacy features, `App.jsx`/`Menu.jsx`/`constants.js`, or the v5 data/schemas/loaders. The Rockhound menu button already exists.
- **Reuse existing data & helpers:** cut techniques come from `src/loaders/cutTechniques.js` (`cutTechniques`, `cutTechniquesById`, `cutSuccessAtLevel(technique, level)`); species carry `suitableCuts`, `cutDifficulty`, `cleavage`, and `phenomena: [{ type, revealedBy }]`. `sapphire.phenomena` = `[{ type: 'asterism', revealedBy: 'cabochon' }]`. Do not modify the data.
- **State shape (current):** `{ rough, identified, gemdex, newlyDiscovered, reputation, gear, testMastery }`; `state.identified` holds correctly-identified specimens (each `{ instanceId, stage:'identified', trueSpeciesId, identifiedAs, caratWeight, clarity, colorGrade, origin }`). New fields must default so existing tests pass.
- **Constants:** `CUT_DIFFICULTY_STEP = 0.08`; success probability clamped to `[0.05, 0.98]`.
- **Design decision (locked):** cut minigames are abstracted — "learn" a technique to unlock it, "practice" to raise its level, and applying it is an rng-modulated success roll. No tactile minigame in this increment.

---

## File Structure

New:
```
src/features/rockhound/logic/cut.js                # canApply, cutSuccessProbability, applyCut, specimenScore
src/features/rockhound/logic/cut.test.js
src/features/rockhound/components/Cut.jsx           # presentational: pick specimen, technique, apply
src/features/rockhound/components/Cut.test.jsx
```
Modified:
```
src/features/rockhound/RockhoundContext.jsx         # cutTechniqueLevel + bestSpecimens + 3 actions
src/features/rockhound/RockhoundContext.test.js
src/features/rockhound/components/Rockhound.jsx      # Cut tab + trophy list on Gemdex
src/features/rockhound/components/Rockhound.test.jsx
```

---

### Task 1: Cut logic

**Files:**
- Create: `src/features/rockhound/logic/cut.js`
- Test: `src/features/rockhound/logic/cut.test.js`

**Interfaces:**
- Consumes: `cutSuccessAtLevel` from `../../../loaders/cutTechniques.js` (pure helper).
- Produces:
  - `CUT_DIFFICULTY_STEP = 0.08`
  - `canApply(species, technique): boolean` — `species.suitableCuts.includes(technique.id)`
  - `cutSuccessProbability(species, technique, level): number` — `clamp(cutSuccessAtLevel(technique, level) * (1 - (species.cutDifficulty-1)*STEP), 0.05, 0.98)`
  - `applyCut(specimen, species, technique, level, rng=Math.random): { outcome: 'success'|'fail'|'shattered', specimen: Specimen|null }` — success on `rng() < pSuccess`; success sets `stage:'cut'`, `cut`, `cutQuality`, `caratRetained`, `symmetry`, and reveals phenomena whose `revealedBy === technique.id`; failure yields a low-quality cut, EXCEPT a `catastrophicOnFail` technique on a `good`/`perfect`-cleavage species with a high roll shatters (`specimen: null`).
  - `specimenScore(specimen, species): number`

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/cut.test.js
import { describe, it, expect } from 'vitest';
import { canApply, cutSuccessProbability, applyCut, specimenScore } from './cut.js';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniquesById } from '../../../loaders/cutTechniques.js';

const rough = (over = {}) => ({
  instanceId: 'c1', stage: 'identified', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire',
  caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek', ...over
});

describe('canApply', () => {
  it('respects a species suitableCuts', () => {
    expect(canApply(speciesById.sapphire, cutTechniquesById.cabochon)).toBe(true);
    expect(canApply(speciesById.agate, cutTechniquesById.round_brilliant)).toBe(false); // agate: cabochon only
  });
});

describe('cutSuccessProbability', () => {
  it('drops with material difficulty and clamps', () => {
    const easy = cutSuccessProbability(speciesById.quartz, cutTechniquesById.round_brilliant, 5);   // cutDifficulty 1
    const hard = cutSuccessProbability(speciesById.sapphire, cutTechniquesById.round_brilliant, 5); // cutDifficulty 4
    expect(hard).toBeLessThan(easy);
    expect(cutSuccessProbability(speciesById.sapphire, cutTechniquesById.fancy, 1)).toBeGreaterThanOrEqual(0.05);
  });
});

describe('applyCut', () => {
  it('a winning roll produces a cut stone with stats', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 10, () => 0);
    expect(res.outcome).toBe('success');
    expect(res.specimen.stage).toBe('cut');
    expect(res.specimen.cut).toBe('round_brilliant');
    expect(res.specimen.cutQuality).toBeGreaterThan(0);
    expect(res.specimen.caratRetained).toBeGreaterThan(0);
    expect(res.specimen.caratRetained).toBeLessThanOrEqual(rough().caratWeight);
  });

  it('reveals asterism when a sapphire is cut as a cabochon', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.cabochon, 10, () => 0);
    expect(res.outcome).toBe('success');
    expect(res.specimen.phenomena).toContain('asterism');
  });

  it('does NOT reveal asterism when the same sapphire is faceted', () => {
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 10, () => 0);
    expect(res.specimen.phenomena).toEqual([]);
  });

  it('a losing roll on a non-cleavable stone fails without shattering', () => {
    // round_brilliant is not catastrophicOnFail; sapphire cleavage 'none'
    const res = applyCut(rough(), speciesById.sapphire, cutTechniquesById.round_brilliant, 1, () => 0.999);
    expect(res.outcome).toBe('fail');
    expect(res.specimen).not.toBeNull();
  });

  it('a bad roll on a cleavable stone with a catastrophic cut shatters it', () => {
    // topaz cleavage 'perfect'; princess is catastrophicOnFail
    const res = applyCut(rough({ trueSpeciesId: 'topaz' }), speciesById.topaz, cutTechniquesById.princess, 1, () => 0.999);
    expect(res.outcome).toBe('shattered');
    expect(res.specimen).toBeNull();
  });
});

describe('specimenScore', () => {
  it('rewards higher cut quality and phenomena', () => {
    const base = { caratRetained: 1, clarity: 60, colorGrade: 60, cutQuality: 60, phenomena: [] };
    const better = { ...base, cutQuality: 95 };
    const starred = { ...base, phenomena: ['asterism'] };
    expect(specimenScore(better, speciesById.sapphire)).toBeGreaterThan(specimenScore(base, speciesById.sapphire));
    expect(specimenScore(starred, speciesById.sapphire)).toBeGreaterThan(specimenScore(base, speciesById.sapphire));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/cut.test.js`
Expected: FAIL — cannot resolve `./cut.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/cut.js
import { cutSuccessAtLevel } from '../../../loaders/cutTechniques.js';

export const CUT_DIFFICULTY_STEP = 0.08;

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const lerp = ([lo, hi], t) => lo + (hi - lo) * t;
const round2 = (n) => Math.round(n * 100) / 100;

export function canApply(species, technique) {
  return species.suitableCuts.includes(technique.id);
}

export function cutSuccessProbability(species, technique, level) {
  const base = cutSuccessAtLevel(technique, level);
  const difficulty = 1 - (species.cutDifficulty - 1) * CUT_DIFFICULTY_STEP;
  return clamp(base * difficulty, 0.05, 0.98);
}

export function applyCut(specimen, species, technique, level, rng = Math.random) {
  const p = cutSuccessProbability(species, technique, level);
  const roll = rng();
  const qualityRoll = rng();

  if (roll < p) {
    const cutQuality = Math.round(lerp(technique.cutQualityRange, qualityRoll));
    const caratRetained = round2(specimen.caratWeight * lerp(technique.yieldRange, qualityRoll));
    const phenomena = (species.phenomena ?? [])
      .filter((ph) => ph.revealedBy === technique.id)
      .map((ph) => ph.type);
    return {
      outcome: 'success',
      specimen: { ...specimen, stage: 'cut', cut: technique.id, cutQuality, caratRetained, symmetry: cutQuality, phenomena }
    };
  }

  const cleaves = species.cleavage === 'perfect' || species.cleavage === 'good';
  if (technique.catastrophicOnFail && cleaves && roll > 0.9) {
    return { outcome: 'shattered', specimen: null };
  }

  const floor = technique.cutQualityRange[0];
  const cutQuality = Math.max(10, Math.round(lerp([floor - 20, floor], qualityRoll)));
  const caratRetained = round2(specimen.caratWeight * lerp([0.3, technique.yieldRange[0]], qualityRoll));
  return {
    outcome: 'fail',
    specimen: { ...specimen, stage: 'cut', cut: technique.id, cutQuality, caratRetained, symmetry: cutQuality, phenomena: [] }
  };
}

export function specimenScore(specimen, species) {
  const carat = specimen.caratRetained ?? specimen.caratWeight ?? 0;
  const caratNorm = clamp(carat / 5, 0, 1) * 100; // 5 ct saturates
  const cut = specimen.cutQuality ?? 0;
  const color = specimen.colorGrade ?? 0;
  const clarity = specimen.clarity ?? 0;
  const traitBonus = (specimen.phenomena?.length ? 15 : 0) + (specimen.untreated ? 5 : 0);
  return Math.round(0.25 * caratNorm + 0.25 * color + 0.2 * clarity + 0.3 * cut + traitBonus);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/cut.test.js`
Expected: PASS (all blocks). If the "shatters" test fails, confirm topaz `cleavage: perfect` and princess `catastrophicOnFail: true` in the data — do not change the data; the roll `0.999 > 0.9` and `p < 0.999` must both hold.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/cut.js src/features/rockhound/logic/cut.test.js
git commit -m "feat(rockhound): cut logic (apply roll, suitability, phenomena, scoring)"
```

---

### Task 2: Cut state in the reducer

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Test: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `applyCut`, `canApply`, `specimenScore` (Task 1); `cutTechniquesById` (loader); existing `speciesById`.
- Produces: new action types `UNLOCK_TECHNIQUE`, `LEVEL_TECHNIQUE`, `APPLY_CUT`; `initialRockhoundState` gains `cutTechniqueLevel: {}` and `bestSpecimens: {}` and `lastCutResult: null`.
  - `{ type: UNLOCK_TECHNIQUE, payload: { techniqueId } }` — sets `cutTechniqueLevel[techniqueId] = 1` if not already ≥ 1.
  - `{ type: LEVEL_TECHNIQUE, payload: { techniqueId } }` — `cutTechniqueLevel[techniqueId] = min((current ?? 0) + 1, technique.successCurve.maxLevel)`; no-op if not yet unlocked (< 1).
  - `{ type: APPLY_CUT, payload: { instanceId, techniqueId, rng? } }` — find specimen in `identified`; require the technique unlocked (level ≥ 1) and `canApply`; run `applyCut`; remove specimen from `identified`; update `bestSpecimens[speciesId]` if the new `specimenScore` beats the stored one (shattered → no trophy); set `lastCutResult`.

- [ ] **Step 1: Write the failing test** (append to `describe('rockhoundReducer', ...)`; add imports at top)

```javascript
// add to the top imports of RockhoundContext.test.js:
import { cutTechniquesById } from '../../loaders/cutTechniques.js';

// inside describe('rockhoundReducer', ...):
  const identifiedSapphire = {
    instanceId: 'g1', stage: 'identified', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire',
    caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek'
  };
  const withIdentified = { ...initialRockhoundState, identified: [identifiedSapphire] };

  it('starts with empty cut state', () => {
    expect(initialRockhoundState.cutTechniqueLevel).toEqual({});
    expect(initialRockhoundState.bestSpecimens).toEqual({});
  });

  it('unlocks then levels a technique (capped at maxLevel)', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon).toBe(1);
    const max = cutTechniquesById.cabochon.successCurve.maxLevel;
    for (let i = 0; i < max + 3; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon).toBe(max);
  });

  it('will not level a technique that was never unlocked', () => {
    const s = rockhoundReducer(initialRockhoundState, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon ?? 0).toBe(0);
  });

  it('applying a winning cabochon cut trophies a starred sapphire and consumes the specimen', () => {
    let s = rockhoundReducer(withIdentified, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    for (let i = 0; i < 9; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } }); // level ~10
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.identified).toHaveLength(0);
    expect(s.bestSpecimens.sapphire).toBeTruthy();
    expect(s.bestSpecimens.sapphire.phenomena).toContain('asterism');
    expect(s.lastCutResult.outcome).toBe('success');
  });

  it('does not apply an un-unlocked technique', () => {
    const s = rockhoundReducer(withIdentified, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.identified).toHaveLength(1); // unchanged
    expect(s.bestSpecimens.sapphire).toBeUndefined();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — action types undefined / cut fields missing.

- [ ] **Step 3: Write minimal implementation**

In `RockhoundContext.jsx`, add imports:

```javascript
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { applyCut, canApply, specimenScore } from './logic/cut.js';
```

Add action types near the others:

```javascript
export const UNLOCK_TECHNIQUE = 'UNLOCK_TECHNIQUE';
export const LEVEL_TECHNIQUE = 'LEVEL_TECHNIQUE';
export const APPLY_CUT = 'APPLY_CUT';
```

Add fields to `initialRockhoundState`:

```javascript
  cutTechniqueLevel: {},
  bestSpecimens: {},
  lastCutResult: null,
```

Add cases in the reducer (before `default:`):

```javascript
    case UNLOCK_TECHNIQUE: {
      const { techniqueId } = action.payload;
      if ((state.cutTechniqueLevel[techniqueId] ?? 0) >= 1) return state;
      return { ...state, cutTechniqueLevel: { ...state.cutTechniqueLevel, [techniqueId]: 1 } };
    }

    case LEVEL_TECHNIQUE: {
      const { techniqueId } = action.payload;
      const current = state.cutTechniqueLevel[techniqueId] ?? 0;
      if (current < 1) return state; // must be unlocked first
      const max = cutTechniquesById[techniqueId]?.successCurve.maxLevel ?? current;
      const next = Math.min(current + 1, max);
      if (next === current) return state;
      return { ...state, cutTechniqueLevel: { ...state.cutTechniqueLevel, [techniqueId]: next } };
    }

    case APPLY_CUT: {
      const { instanceId, techniqueId, rng } = action.payload;
      const specimen = state.identified.find((s) => s.instanceId === instanceId);
      const technique = cutTechniquesById[techniqueId];
      const level = state.cutTechniqueLevel[techniqueId] ?? 0;
      if (!specimen || !technique || level < 1) return state;
      const species = speciesById[specimen.trueSpeciesId];
      if (!canApply(species, technique)) return state;

      const result = applyCut(specimen, species, technique, level, rng ?? Math.random);
      const identified = state.identified.filter((s) => s.instanceId !== instanceId);

      let bestSpecimens = state.bestSpecimens;
      if (result.specimen) {
        const score = specimenScore(result.specimen, species);
        const prev = state.bestSpecimens[species.id];
        if (!prev || score > prev.score) {
          bestSpecimens = { ...state.bestSpecimens, [species.id]: { ...result.specimen, score } };
        }
      }
      return {
        ...state,
        identified,
        bestSpecimens,
        lastCutResult: {
          instanceId,
          outcome: result.outcome,
          speciesId: species.id,
          cutQuality: result.specimen?.cutQuality ?? null,
          phenomena: result.specimen?.phenomena ?? []
        }
      };
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: PASS (existing + new cut tests). Then run the persistence test to confirm no regression: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.persistence.test.jsx`.

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(rockhound): cut state — unlock/level techniques, apply cut, trophies"
```

---

### Task 3: Cut component

**Files:**
- Create: `src/features/rockhound/components/Cut.jsx`
- Test: `src/features/rockhound/components/Cut.test.jsx`

**Interfaces:**
- Consumes: `canApply` (Task 1), `cutSuccessAtLevel` (loader).
- Produces: presentational `Cut` with props `{ identified, techniques, cutTechniqueLevel, speciesById, selectedId, onSelectSpecimen, lastCutResult, onUnlock, onLevel, onApply }`.
  - Left: list of `identified` specimens (name via `speciesById[trueSpeciesId].name` + carat); clicking selects (`onSelectSpecimen(instanceId)`), the selected one marked.
  - Right: each technique row shows its name; if `(cutTechniqueLevel[id] ?? 0) < 1` show a **Learn** button (`onUnlock(id)`); else show `Lv N`, a **Practice** button (`onLevel(id)`), and — when a specimen is selected and `canApply(species, technique)` — an **Apply** button (`onApply(selectedId, id)`).
  - Shows a result line from `lastCutResult` (outcome + phenomena) when present.
  - Empty state when `identified` is empty.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/Cut.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cut from './Cut.jsx';
import { speciesById } from '../../../loaders/species.js';
import { cutTechniques } from '../../../loaders/cutTechniques.js';

const identified = [
  { instanceId: 'g1', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' }
];

function setup(over = {}) {
  const props = {
    identified,
    techniques: cutTechniques,
    cutTechniqueLevel: {},
    speciesById,
    selectedId: 'g1',
    onSelectSpecimen: vi.fn(),
    lastCutResult: null,
    onUnlock: vi.fn(),
    onLevel: vi.fn(),
    onApply: vi.fn(),
    ...over
  };
  render(<Cut {...props} />);
  return props;
}

describe('Cut', () => {
  it('shows an empty state when there is nothing identified', () => {
    setup({ identified: [] });
    screen.getByText(/nothing to cut/i);
  });

  it('offers Learn for a locked technique and unlocks it', () => {
    const p = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Learn/i })[0]);
    expect(p.onUnlock).toHaveBeenCalled();
  });

  it('offers Apply only for a suitable, unlocked technique', () => {
    const p = setup({ cutTechniqueLevel: { cabochon: 3 } }); // sapphire suitableCuts includes cabochon
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));
    expect(p.onApply).toHaveBeenCalledWith('g1', 'cabochon');
  });

  it('renders the last cut result with a revealed phenomenon', () => {
    setup({ lastCutResult: { instanceId: 'g1', outcome: 'success', speciesId: 'sapphire', cutQuality: 92, phenomena: ['asterism'] } });
    screen.getByText(/asterism/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Cut.test.jsx`
Expected: FAIL — cannot resolve `./Cut.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/Cut.jsx
import { canApply } from '../logic/cut.js';
import { cutSuccessAtLevel } from '../../../loaders/cutTechniques.js';

export default function Cut({
  identified, techniques, cutTechniqueLevel, speciesById, selectedId,
  onSelectSpecimen, lastCutResult, onUnlock, onLevel, onApply
}) {
  if (identified.length === 0) {
    return <p className="text-slate-400">Nothing to cut yet — identify a specimen first.</p>;
  }

  const selected = identified.find((s) => s.instanceId === selectedId) ?? identified[0];
  const selectedSpecies = selected ? speciesById[selected.trueSpeciesId] : null;

  return (
    <section className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3 flex flex-col gap-2">
        <h3 className="font-bold text-yellow-400">Identified stones</h3>
        {identified.map((sp) => (
          <button
            key={sp.instanceId}
            type="button"
            onClick={() => onSelectSpecimen(sp.instanceId)}
            className={`text-left rounded border p-2 ${sp.instanceId === selected?.instanceId ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'}`}
          >
            <span className="text-slate-100">{speciesById[sp.trueSpeciesId].name}</span>
            <span className="block text-xs text-slate-400">{sp.caratWeight} ct</span>
          </button>
        ))}
      </div>

      <div className="md:w-2/3 flex flex-col gap-3">
        <h3 className="font-bold text-yellow-400">Techniques</h3>
        {lastCutResult && (
          <p className="text-sm text-slate-300">
            Last cut: <strong className="capitalize">{lastCutResult.outcome}</strong>
            {lastCutResult.cutQuality != null && ` · quality ${lastCutResult.cutQuality}`}
            {lastCutResult.phenomena.length > 0 && ` · ✨ ${lastCutResult.phenomena.join(', ')}`}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {techniques.map((t) => {
            const level = cutTechniqueLevel[t.id] ?? 0;
            const unlocked = level >= 1;
            const applicable = unlocked && selectedSpecies && canApply(selectedSpecies, t);
            return (
              <li key={t.id} className="flex items-center gap-2 rounded border border-slate-600 bg-slate-800 p-2">
                <span className="flex-1 text-slate-100">{t.name} {unlocked && <span className="text-xs text-slate-400">Lv {level} · {Math.round(cutSuccessAtLevel(t, level) * 100)}%</span>}</span>
                {!unlocked && (
                  <button type="button" onClick={() => onUnlock(t.id)} className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm text-white">Learn</button>
                )}
                {unlocked && (
                  <button type="button" onClick={() => onLevel(t.id)} className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-1 text-sm text-white">Practice</button>
                )}
                {applicable && (
                  <button type="button" onClick={() => onApply(selected.instanceId, t.id)} className="rounded bg-yellow-500 hover:bg-yellow-400 px-3 py-1 text-sm font-bold text-slate-900">Apply</button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Cut.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Cut.jsx src/features/rockhound/components/Cut.test.jsx
git commit -m "feat(rockhound): Cut component (learn/practice/apply techniques)"
```

---

### Task 4: Wire Cut into the shell + trophy case

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Test: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: `Cut` (Task 3), `cutTechniques` (loader), the new actions (Task 2).
- Produces: a fourth tab **Cut**; wires context state (`identified`, `cutTechniqueLevel`, `lastCutResult`) and dispatch (`UNLOCK_TECHNIQUE`/`LEVEL_TECHNIQUE`/`APPLY_CUT`) into `Cut`; adds a **trophy list** (from `state.bestSpecimens`) above the Gemdex grid. Cut-tab specimen selection uses shell local state (`selectedCutId`).

- [ ] **Step 1: Update tabs + add tests**

Add to the `describe('Rockhound shell', ...)` block:

```jsx
  it('shows a Cut tab with an empty state before anything is identified', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Cut$/i }));
    screen.getByText(/nothing to cut/i);
  });

  it('shows the trophy case heading on the Gemdex tab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    screen.getByText(/Trophy case/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — no Cut tab / no trophy case.

- [ ] **Step 3: Write minimal implementation**

In `Rockhound.jsx`: add imports and the new tab. Update the imports line and `TABS`, add `selectedCutId` state, render the Cut tab, and add a trophy list on the Gemdex tab.

```jsx
import Cut from './Cut.jsx';
import { cutTechniques } from '../../../loaders/cutTechniques.js';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT } from '../RockhoundContext.jsx';
```

Change `const TABS = ['Explore', 'Identify', 'Gemdex'];` to:

```jsx
const TABS = ['Explore', 'Identify', 'Cut', 'Gemdex'];
```

Add local state near the other `useState` calls:

```jsx
  const [selectedCutId, setSelectedCutId] = useState(null);
```

Add the Cut tab block (after the Identify block, before the Gemdex block):

```jsx
      {tab === 'Cut' && (
        <Cut
          identified={state.identified}
          techniques={cutTechniques}
          cutTechniqueLevel={state.cutTechniqueLevel}
          speciesById={speciesById}
          selectedId={selectedCutId ?? state.identified[0]?.instanceId ?? null}
          onSelectSpecimen={setSelectedCutId}
          lastCutResult={state.lastCutResult}
          onUnlock={(techniqueId) => dispatch({ type: UNLOCK_TECHNIQUE, payload: { techniqueId } })}
          onLevel={(techniqueId) => dispatch({ type: LEVEL_TECHNIQUE, payload: { techniqueId } })}
          onApply={(instanceId, techniqueId) => dispatch({ type: APPLY_CUT, payload: { instanceId, techniqueId } })}
        />
      )}
```

Replace the Gemdex block so it renders a trophy case above the grid:

```jsx
      {tab === 'Gemdex' && (
        <div className="flex flex-col gap-4">
          <ProgressionPanel reputation={state.reputation} gear={state.gear} familyProgress={familyProgressFor(state.gemdex)} />
          <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h3 className="font-bold text-yellow-400 mb-2">Trophy case</h3>
            {Object.keys(state.bestSpecimens).length === 0 ? (
              <p className="text-slate-500 text-sm">No cut stones yet — cut an identified specimen to earn a trophy.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {Object.entries(state.bestSpecimens).map(([speciesId, best]) => (
                  <li key={speciesId} className="flex items-center justify-between text-sm">
                    <span className="text-slate-100">{speciesById[speciesId].name} <span className="text-slate-400">({best.cut})</span>{best.phenomena?.length ? ' ✨' : ''}</span>
                    <span className="font-mono text-slate-400">score {best.score}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <GemdexV5 species={species} gemdex={state.gemdex} newlyDiscovered={state.newlyDiscovered} />
        </div>
      )}
```

- [ ] **Step 4: Run the shell test, the full suite, and the build**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: PASS (existing + 2 new).

Run: `./node_modules/.bin/vitest run`
Expected: whole unit suite green.

Run: `./node_modules/.bin/vite build`
Expected: `✓ built` no errors.

- [ ] **Step 5: Manual smoke (recommended)**

`./node_modules/.bin/vite --port 5173` → Rockhound. Pan → identify a sapphire → Cut tab → Learn "Cabochon" → Practice a few times → select the sapphire → Apply → see the result and a star (✨ asterism) → Gemdex tab shows it in the Trophy case. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(rockhound): Cut tab + trophy case wired into the shell"
```

---

## Notes for the implementer

- **Read the data first** for cut techniques (`src/data/cutTechniques.yaml`: `cabochon`, `round_brilliant`, `step`, `princess`, `fancy`; `princess`/`fancy` are `catastrophicOnFail`) and species (`suitableCuts`, `cutDifficulty`, `cleavage`, `phenomena`). Do not modify data.
- **Determinism:** `applyCut`/`APPLY_CUT` take an `rng`; tests inject `() => 0` (guaranteed success) / `() => 0.999` (guaranteed fail).
- **Back-compat:** new state fields default (`{}`/`null`); existing reducer, persistence, and shell tests must pass unchanged except the appended tests.
- **No jest-dom.** Presence via `getByText`/`getByRole`; the `/^Cut$/i` role query targets the tab button specifically.

## Known simplifications (intentional)

- Cut minigames are abstracted (Learn = unlock, Practice = +1 level, Apply = rng roll). Tactile cut minigames belong to the deferred fun-polish pass.
- No economy/sell yet: cut stones populate the trophy case (best-per-species by score); market value is deferred.
- `state.identified` is consumed on cut (success or fail); shattered stones are lost. Re-identifying more of a species lets you try again for a better trophy.
