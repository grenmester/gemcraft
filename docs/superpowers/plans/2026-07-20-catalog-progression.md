# Catalog & Progression Increment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the standalone identify slice into a felt progression: multiple localities that unlock as you collect (via reputation tiers, gear granted at milestones, and set-completion), plus family-completion "familiarity" that visibly sharpens identification.

**Architecture:** Extend the isolated `src/features/rockhound/` module. Add one pure `logic/progression.js` (reputation tiers, gate evaluation, set/family completion, milestone gear, familiarity). Thread `gear` into `RockhoundContext` state (recomputed on discovery). Add two presentational components (`LocalityMap`, `ProgressionPanel`), wire familiarity into the existing `Identify`/`runTest` seam, and update the shell to let the player pick among unlocked localities. No legacy files touched; the module stays behind the existing Rockhound menu button.

**Tech Stack:** React 18 + Vite, Zod-validated YAML data (already loaded), Vitest + React Testing Library (jsdom), Tailwind v4.

## Global Constraints

- **Package manager:** run the local binary, not `pnpm exec` (which aborts no-TTY): `./node_modules/.bin/vitest run <path>`; build `./node_modules/.bin/vite build`.
- **Unit tests under `src/**`** with `.test.js`/`.test.jsx`; vitest excludes `tests/**`.
- **No `@testing-library/jest-dom`** — assert with `getByText`/`getByRole` (throw-on-miss), `queryByText(...) === null`/`.toBeNull()`, and `fireEvent`. The in-memory `localStorage` shim already lives in `src/setupTests.js` (do not modify it).
- **Injectable randomness:** logic functions never call `Math.random` directly.
- **Isolation:** only edit files under `src/features/rockhound/`. Do NOT touch `src/context/GameContext.jsx`, legacy features, or the v5 data/schemas/loaders. The Rockhound menu wiring already exists — no `App.jsx`/`Menu.jsx`/`constants.js` edits in this increment.
- **Data is fixed.** Localities (`hidden_creek`, `gravel_bar`, `amethyst_vug`, `old_quarry`) and their `unlockGate` trees, and species families, come from the existing YAML. Reference ids verbatim; do not modify data.
- **Design decisions (locked):** gear is *granted at milestones* (no shop) — `sieve` at reputation tier ≥ 1, `rock_hammer` on completing the `hidden_creek` set. Cash gate conditions are treated as non-blocking accelerators (always pass) since there is no economy yet.
- **Reputation tiers:** `REPUTATION_TIERS = [0, 50, 120, 250, 450]` (tier = highest index whose threshold ≤ reputation). `FAMILIARITY_BONUS = 0.3`.
- **Back-compat:** existing slice tests must keep passing. New params (`familiarity`, `completedFamilies`, `gear`) get safe defaults so existing call sites are unaffected.

---

## File Structure

New:
```
src/features/rockhound/logic/progression.js        # tiers, gates, set/family completion, gear, familiarity
src/features/rockhound/logic/progression.test.js
src/features/rockhound/components/LocalityMap.jsx  # presentational: pick an unlocked locality
src/features/rockhound/components/LocalityMap.test.jsx
src/features/rockhound/components/ProgressionPanel.jsx  # presentational: reputation/tier/gear/family progress
src/features/rockhound/components/ProgressionPanel.test.jsx
```
Modified:
```
src/features/rockhound/logic/tests.js              # runTest accepts familiarity, passes to bandWidth
src/features/rockhound/logic/tests.test.js         # add familiarity assertion
src/features/rockhound/RockhoundContext.jsx        # gear state + recompute on COMMIT_IDENTIFY
src/features/rockhound/RockhoundContext.test.js     # gear-milestone assertions
src/features/rockhound/components/Identify.jsx     # thread familiarity from completedFamilies
src/features/rockhound/components/Rockhound.jsx    # locality selection, familiarity, progression panel
src/features/rockhound/components/Rockhound.test.jsx
```

---

### Task 1: Progression logic

**Files:**
- Create: `src/features/rockhound/logic/progression.js`
- Test: `src/features/rockhound/logic/progression.test.js`

**Interfaces:**
- Produces (all pure; data passed as params):
  - `REPUTATION_TIERS: number[]`, `reputationTier(reputation): number`
  - `FAMILIARITY_BONUS: number`, `familiarityFactor(family, completedFamiliesList): number`
  - `localitySetComplete(locality, gemdexSet: Set): boolean`, `completedLocalityIds(localities, gemdex): string[]`
  - `familyComplete(family, allSpecies, gemdexSet: Set): boolean`, `completedFamilies(allSpecies, gemdex): string[]`
  - `gatePassed(gate, ctx): boolean`, `isLocalityUnlocked(locality, ctx): boolean` where `ctx = { reputation, gear, completedLocalities, completedFamilies }`
  - `earnedGear(ctx): string[]`, `GEAR_MILESTONES`
  - `describeGate(gate): string` (a short human hint)

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/progression.test.js
import { describe, it, expect } from 'vitest';
import {
  reputationTier, familiarityFactor, FAMILIARITY_BONUS,
  localitySetComplete, completedLocalityIds,
  familyComplete, completedFamilies,
  isLocalityUnlocked, earnedGear, describeGate
} from './progression.js';
import { species, speciesById } from '../../../loaders/species.js';
import { localities, localitiesById } from '../../../loaders/localities.js';

describe('reputationTier', () => {
  it('maps reputation to the highest reached tier', () => {
    expect(reputationTier(0)).toBe(0);
    expect(reputationTier(49)).toBe(0);
    expect(reputationTier(50)).toBe(1);
    expect(reputationTier(120)).toBe(2);
    expect(reputationTier(9999)).toBe(4);
  });
});

describe('familiarityFactor', () => {
  it('boosts a completed family, leaves others at 1', () => {
    expect(familiarityFactor('quartz', ['quartz'])).toBeCloseTo(1 + FAMILIARITY_BONUS, 5);
    expect(familiarityFactor('corundum', ['quartz'])).toBe(1);
  });
});

describe('set completion', () => {
  it('detects a completed locality find pool', () => {
    const pool = localitiesById.hidden_creek.findPool.map((e) => e.species);
    expect(localitySetComplete(localitiesById.hidden_creek, new Set(pool))).toBe(true);
    expect(localitySetComplete(localitiesById.hidden_creek, new Set(['quartz']))).toBe(false);
  });
  it('lists fully-collected localities', () => {
    const creekPool = localitiesById.hidden_creek.findPool.map((e) => e.species);
    expect(completedLocalityIds(localities, creekPool)).toContain('hidden_creek');
    expect(completedLocalityIds(localities, [])).toEqual([]);
  });
  it('detects a completed family', () => {
    const quartzIds = species.filter((s) => s.family === 'quartz').map((s) => s.id);
    expect(familyComplete('quartz', species, new Set(quartzIds))).toBe(true);
    expect(familyComplete('quartz', species, new Set(['quartz'])).valueOf()).toBe(false);
    expect(completedFamilies(species, quartzIds)).toContain('quartz');
  });
});

describe('gate evaluation', () => {
  const baseCtx = { reputation: 0, gear: [], completedLocalities: [], completedFamilies: [] };

  it('unlocks a starter locality with an empty gate', () => {
    expect(isLocalityUnlocked(localitiesById.hidden_creek, baseCtx)).toBe(true);
  });
  it('keeps a gear-gated locality locked until the gear is owned', () => {
    expect(isLocalityUnlocked(localitiesById.gravel_bar, baseCtx)).toBe(false); // needs sieve
    expect(isLocalityUnlocked(localitiesById.gravel_bar, { ...baseCtx, gear: ['sieve'] })).toBe(true);
  });
  it('opens a setComplete-gated locality when the set is done', () => {
    expect(isLocalityUnlocked(localitiesById.amethyst_vug, baseCtx)).toBe(false);
    expect(isLocalityUnlocked(localitiesById.amethyst_vug, { ...baseCtx, completedLocalities: ['hidden_creek'] })).toBe(true);
  });
  it('opens an anyOf locality via either branch', () => {
    // old_quarry: anyOf [reputation tier 2, gear rock_hammer]
    expect(isLocalityUnlocked(localitiesById.old_quarry, baseCtx)).toBe(false);
    expect(isLocalityUnlocked(localitiesById.old_quarry, { ...baseCtx, reputation: 120 })).toBe(true);
    expect(isLocalityUnlocked(localitiesById.old_quarry, { ...baseCtx, gear: ['rock_hammer'] })).toBe(true);
  });
});

describe('earnedGear milestones', () => {
  it('grants sieve at reputation tier 1 and rock_hammer on the creek set', () => {
    expect(earnedGear({ reputation: 0, gear: [], completedLocalities: [], completedFamilies: [] })).toEqual([]);
    expect(earnedGear({ reputation: 50, gear: [], completedLocalities: [], completedFamilies: [] })).toContain('sieve');
    expect(earnedGear({ reputation: 0, gear: [], completedLocalities: ['hidden_creek'], completedFamilies: [] })).toContain('rock_hammer');
  });
});

describe('describeGate', () => {
  it('produces a non-empty hint for a gated locality', () => {
    expect(describeGate(localitiesById.gravel_bar.unlockGate).length).toBeGreaterThan(0);
    expect(describeGate(localitiesById.hidden_creek.unlockGate)).toMatch(/open|available|unlocked/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/progression.test.js`
Expected: FAIL — cannot resolve `./progression.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/progression.js

export const REPUTATION_TIERS = [0, 50, 120, 250, 450];
export const FAMILIARITY_BONUS = 0.3;

export function reputationTier(reputation) {
  let tier = 0;
  for (let i = 0; i < REPUTATION_TIERS.length; i++) {
    if (reputation >= REPUTATION_TIERS[i]) tier = i;
  }
  return tier;
}

export function familiarityFactor(family, completedFamiliesList) {
  return completedFamiliesList.includes(family) ? 1 + FAMILIARITY_BONUS : 1;
}

export function localitySetComplete(locality, gemdexSet) {
  return locality.findPool.every((e) => gemdexSet.has(e.species));
}

export function completedLocalityIds(localities, gemdex) {
  const set = new Set(gemdex);
  return localities.filter((l) => localitySetComplete(l, set)).map((l) => l.id);
}

export function familyComplete(family, allSpecies, gemdexSet) {
  const members = allSpecies.filter((s) => s.family === family);
  return members.length > 0 && members.every((s) => gemdexSet.has(s.id));
}

export function completedFamilies(allSpecies, gemdex) {
  const set = new Set(gemdex);
  const families = [...new Set(allSpecies.map((s) => s.family))];
  return families.filter((f) => familyComplete(f, allSpecies, set));
}

function conditionPassed(cond, ctx) {
  switch (cond.type) {
    case 'gear':
      return ctx.gear.includes(cond.id);
    case 'reputation':
      return reputationTier(ctx.reputation) >= cond.tier;
    case 'setComplete':
      return cond.setType === 'locality'
        ? ctx.completedLocalities.includes(cond.id)
        : ctx.completedFamilies.includes(cond.id);
    case 'cash':
      return true; // no economy yet: cash conditions are accelerators, never blocking
    default:
      return false;
  }
}

export function gatePassed(gate, ctx) {
  const evalNode = (node) => ('type' in node ? conditionPassed(node, ctx) : gatePassed(node, ctx));
  if (gate.allOf && !gate.allOf.every(evalNode)) return false;
  if (gate.anyOf && !gate.anyOf.some(evalNode)) return false;
  return true;
}

export function isLocalityUnlocked(locality, ctx) {
  return gatePassed(locality.unlockGate, ctx);
}

export const GEAR_MILESTONES = [
  { id: 'sieve', label: 'Sieve', when: (ctx) => reputationTier(ctx.reputation) >= 1 },
  { id: 'rock_hammer', label: 'Rock Hammer', when: (ctx) => ctx.completedLocalities.includes('hidden_creek') }
];

export function earnedGear(ctx) {
  return GEAR_MILESTONES.filter((m) => m.when(ctx)).map((m) => m.id);
}

function describeCondition(cond) {
  switch (cond.type) {
    case 'gear':
      return `Needs the ${cond.id.replace(/_/g, ' ')}`;
    case 'reputation':
      return `Reach reputation tier ${cond.tier}`;
    case 'setComplete':
      return `Complete the ${cond.id.replace(/_/g, ' ')} ${cond.setType} set`;
    case 'cash':
      return `Costs ${cond.amount}`;
    default:
      return 'Locked';
  }
}

const describeNode = (node) => ('type' in node ? describeCondition(node) : describeGate(node));

export function describeGate(gate) {
  if (gate.anyOf && gate.anyOf.length) return gate.anyOf.map(describeNode).join(' or ');
  if (gate.allOf && gate.allOf.length) return gate.allOf.map(describeNode).join(' and ');
  return 'Open — available now';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/progression.test.js`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/progression.js src/features/rockhound/logic/progression.test.js
git commit -m "feat(rockhound): progression logic (tiers, gates, set/family completion, gear, familiarity)"
```

---

### Task 2: Gear state in the reducer

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Test: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `completedLocalityIds`, `completedFamilies`, `earnedGear` (Task 1); `localities` (loader), `species` (loader).
- Produces: `initialRockhoundState` gains `gear: []`. After every `COMMIT_IDENTIFY`, `gear` is unioned with `earnedGear(ctx)` computed from the *new* reputation + gemdex. No new action type.

- [ ] **Step 1: Write the failing test** (append to the existing `describe('rockhoundReducer', ...)` block)

```javascript
// add these imports at the top of src/features/rockhound/RockhoundContext.test.js
import { species } from '../../loaders/species.js';
import { localitiesById } from '../../loaders/localities.js';

// ... inside describe('rockhoundReducer', ...):
  it('starts with no gear', () => {
    expect(initialRockhoundState.gear).toEqual([]);
  });

  it('grants rock_hammer once the hidden_creek set is complete', () => {
    // discover every hidden_creek species via correct commits
    const creekSpecies = localitiesById.hidden_creek.findPool.map((e) => e.species);
    let s = initialRockhoundState;
    creekSpecies.forEach((speciesId, i) => {
      const rough = { instanceId: `r${i}`, stage: 'rough', trueSpeciesId: speciesId, identifiedAs: null, caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek' };
      s = rockhoundReducer(s, { type: ADD_ROUGH, payload: rough });
      s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: `r${i}`, guessId: speciesId } });
    });
    expect(s.gemdex.sort()).toEqual([...creekSpecies].sort());
    expect(s.gear).toContain('rock_hammer'); // creek set complete
    expect(s.gear).toContain('sieve');       // creek rep total (70) >= tier-1 threshold (50)
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `initialRockhoundState.gear` is undefined; `s.gear` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/features/rockhound/RockhoundContext.jsx`:

Add imports near the top (after the existing imports):

```javascript
import { species } from '../../loaders/species.js';
import { localities } from '../../loaders/localities.js';
import { completedLocalityIds, completedFamilies, earnedGear } from './logic/progression.js';
```

Add `gear: []` to `initialRockhoundState`:

```javascript
export const initialRockhoundState = {
  rough: [],
  identified: [],
  gemdex: [],
  newlyDiscovered: [],
  reputation: 0,
  gear: [],
  testMastery: { scratch: 0, heft: 0, uv: 0 }
};
```

Add this helper above `rockhoundReducer`:

```javascript
// Union in any gear whose milestone is now satisfied by reputation + gemdex.
function withEarnedGear(gemdex, reputation, currentGear) {
  const ctx = {
    reputation,
    gear: currentGear,
    completedLocalities: completedLocalityIds(localities, gemdex),
    completedFamilies: completedFamilies(species, gemdex)
  };
  const merged = [...new Set([...currentGear, ...earnedGear(ctx)])];
  return merged.length === currentGear.length ? currentGear : merged;
}
```

Replace the `COMMIT_IDENTIFY` return object so it also updates `gear` from the new gemdex/reputation:

```javascript
      const newGemdex = isNew ? [...state.gemdex, speciesId] : state.gemdex;
      const newReputation = state.reputation + identifyReward(speciesById[speciesId]);
      return {
        ...state,
        rough: state.rough.filter((r) => r.instanceId !== instanceId),
        identified: [...state.identified, updated],
        gemdex: newGemdex,
        newlyDiscovered: isNew ? [...state.newlyDiscovered, speciesId] : state.newlyDiscovered,
        reputation: newReputation,
        gear: withEarnedGear(newGemdex, newReputation, state.gear)
      };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: PASS (existing reducer + persistence tests plus the two new gear tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(rockhound): grant gear at reputation/set milestones in the reducer"
```

---

### Task 3: Thread familiarity into identification

**Files:**
- Modify: `src/features/rockhound/logic/tests.js`
- Test: `src/features/rockhound/logic/tests.test.js`
- Modify: `src/features/rockhound/components/Identify.jsx`
- Test: `src/features/rockhound/components/Identify.test.jsx`

**Interfaces:**
- `runTest(testId, trueSpecies, { mastery, livePlay, familiarity = 1 })` — passes `familiarity` to `bandWidth`. Default `1` keeps existing callers unchanged.
- `Identify` gains prop `completedFamilies = []`; per test it computes `familiarity = familiarityFactor(trueSpecies.family, completedFamilies)` and passes it into `runTest`.

- [ ] **Step 1: Write the failing tests**

Add the import alongside the existing top-of-file imports in `src/features/rockhound/logic/tests.test.js`, then append the new `describe` block:

```javascript
import { familiarityFactor } from './progression.js'; // add with the other top imports

describe('runTest familiarity', () => {
  it('a familiar family narrows the band (eliminates more) than an unfamiliar one', () => {
    // topaz(8) vs sapphire(9): at mastery 40, livePlay 0.8, familiarity sharpens the band
    const ids = ['topaz', 'sapphire'];
    const plain = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: 1 });
    const familiar = runTest('scratch', speciesById.sapphire, { mastery: 40, livePlay: 0.8, familiarity: familiarityFactor('corundum', ['corundum']) });
    expect(familiar.band).toBeLessThan(plain.band);
    // the sharper familiar reading eliminates topaz; assert it is at least as discriminating
    expect(eliminate(ids, speciesById, familiar).length).toBeLessThanOrEqual(eliminate(ids, speciesById, plain).length);
  });
});
```

Append a familiarity case to `src/features/rockhound/components/Identify.test.jsx` (reuse its existing `renderSapphire` helper by adding an override):

```javascript
  it('passes familiarity through so a completed family sharpens the read', () => {
    // mastery 30, rng 0.5 → livePlay 0.8. Without familiarity the hardness band spans the
    // whole 4-species pool; the corundum familiarity boost (×1.3) narrows it to 2 suspects
    // (topaz + sapphire) without eliminating sapphire (corundum) itself.
    renderSapphire({ testMastery: { scratch: 30, heft: 30, uv: 30 }, completedFamilies: ['corundum'], rng: () => 0.5 });
    fireEvent.click(screen.getByRole('button', { name: /Scratch Test/i }));
    screen.getByText(/SUSPECTS: 2/);
    screen.getByText('Sapphire');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js src/features/rockhound/components/Identify.test.jsx`
Expected: FAIL — `runTest` ignores `familiarity` (bands equal); `Identify` has no `completedFamilies` prop.

- [ ] **Step 3: Write minimal implementation**

In `src/features/rockhound/logic/tests.js`, update `runTest` to accept and forward `familiarity`:

```javascript
export function runTest(testId, trueSpecies, { mastery, livePlay, familiarity = 1 }) {
  const def = TEST_DEFS[testId];
  if (def.kind === 'numeric') {
    return {
      testId,
      kind: 'numeric',
      property: def.property,
      center: numericProperty(trueSpecies, def.property),
      band: bandWidth({ property: def.property, mastery, livePlay, familiarity })
    };
  }
  return { testId, kind: 'categorical', property: def.property, key: fluorescenceKey(trueSpecies) };
}
```

In `src/features/rockhound/components/Identify.jsx`, import the factor and thread it:

```javascript
import { useState } from 'react';
import { TEST_DEFS, runTest, eliminate } from '../logic/tests.js';
import { livePlayFromRng } from '../logic/precision.js';
import { seedCandidates } from '../logic/candidates.js';
import { familiarityFactor } from '../logic/progression.js';

export default function Identify({ specimen, locality, speciesById, testMastery, completedFamilies = [], onRunTest, onCommit, rng = Math.random }) {
  const [candidates, setCandidates] = useState(() => seedCandidates(locality));
  const trueSpecies = speciesById[specimen.trueSpeciesId];

  const handleTest = (testId) => {
    const livePlay = livePlayFromRng(rng);
    const familiarity = familiarityFactor(trueSpecies.family, completedFamilies);
    const reading = runTest(testId, trueSpecies, { mastery: testMastery[testId] ?? 0, livePlay, familiarity });
    setCandidates((prev) => eliminate(prev, speciesById, reading));
    onRunTest(testId, Math.round(livePlay * 100));
  };
  // ... rest unchanged
```

(Leave the JSX body unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/tests.test.js src/features/rockhound/components/Identify.test.jsx`
Expected: PASS (including the earlier slice tests in both files).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/tests.js src/features/rockhound/logic/tests.test.js src/features/rockhound/components/Identify.jsx src/features/rockhound/components/Identify.test.jsx
git commit -m "feat(rockhound): family familiarity sharpens identification reads"
```

---

### Task 4: LocalityMap component

**Files:**
- Create: `src/features/rockhound/components/LocalityMap.jsx`
- Test: `src/features/rockhound/components/LocalityMap.test.jsx`

**Interfaces:**
- Consumes: `describeGate` (Task 1).
- Produces: presentational `LocalityMap` with props `{ localities, unlockedIds, selectedId, onSelect }`. Unlocked localities render a selectable button (the selected one visibly marked); locked ones render disabled with `describeGate(locality.unlockGate)` as a hint. Clicking an unlocked locality calls `onSelect(locality.id)`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/LocalityMap.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityMap from './LocalityMap.jsx';
import { localities } from '../../../loaders/localities.js';

describe('LocalityMap', () => {
  it('renders unlocked localities as enabled and locked ones with a hint', () => {
    render(<LocalityMap localities={localities} unlockedIds={['hidden_creek']} selectedId="hidden_creek" onSelect={() => {}} />);
    // unlocked
    const creek = screen.getByRole('button', { name: /Hidden Creek/i });
    expect(creek.disabled).toBe(false);
    // locked gravel_bar shows its gear hint
    screen.getByText(/Needs the sieve/i);
  });

  it('calls onSelect for an unlocked locality and not for a locked one', () => {
    const onSelect = vi.fn();
    render(<LocalityMap localities={localities} unlockedIds={['hidden_creek']} selectedId="hidden_creek" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek/i }));
    expect(onSelect).toHaveBeenCalledWith('hidden_creek');
    // locked locality button is disabled → clicking does nothing
    const locked = screen.getByRole('button', { name: /Gravel Bar/i });
    expect(locked.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityMap.test.jsx`
Expected: FAIL — cannot resolve `./LocalityMap.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/LocalityMap.jsx
import { describeGate } from '../logic/progression.js';

export default function LocalityMap({ localities, unlockedIds, selectedId, onSelect }) {
  const unlocked = new Set(unlockedIds);
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {localities.map((loc) => {
        const isUnlocked = unlocked.has(loc.id);
        const isSelected = loc.id === selectedId;
        return (
          <li key={loc.id}>
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(loc.id)}
              className={`w-full text-left rounded-lg border p-3 ${
                isSelected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'
              } ${isUnlocked ? 'hover:border-yellow-400' : 'opacity-60 cursor-not-allowed'}`}
            >
              <span className="font-semibold text-slate-100">{loc.name}</span>
              <span className="block text-xs text-slate-400 capitalize">{loc.depositType} · {loc.method}</span>
              {!isUnlocked && (
                <span className="block text-xs text-amber-400 mt-1">🔒 {describeGate(loc.unlockGate)}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityMap.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/LocalityMap.jsx src/features/rockhound/components/LocalityMap.test.jsx
git commit -m "feat(rockhound): LocalityMap component with gate hints"
```

---

### Task 5: ProgressionPanel component

**Files:**
- Create: `src/features/rockhound/components/ProgressionPanel.jsx`
- Test: `src/features/rockhound/components/ProgressionPanel.test.jsx`

**Interfaces:**
- Consumes: `reputationTier` (Task 1).
- Produces: presentational `ProgressionPanel` with props `{ reputation, gear, familyProgress }` where `familyProgress` is an array of `{ family, discovered, total, complete }`. Renders reputation + its tier, the owned gear list (or "none yet"), and per-family `discovered/total` with a ✓ marker on complete families.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/ProgressionPanel.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressionPanel from './ProgressionPanel.jsx';

describe('ProgressionPanel', () => {
  const familyProgress = [
    { family: 'quartz', discovered: 4, total: 4, complete: true },
    { family: 'corundum', discovered: 1, total: 1, complete: true },
    { family: 'garnet', discovered: 0, total: 1, complete: false }
  ];

  it('shows reputation and its tier', () => {
    render(<ProgressionPanel reputation={120} gear={['sieve']} familyProgress={familyProgress} />);
    screen.getByText(/120/);
    screen.getByText(/tier 2/i);
  });

  it('lists owned gear', () => {
    render(<ProgressionPanel reputation={50} gear={['sieve', 'rock_hammer']} familyProgress={familyProgress} />);
    screen.getByText(/sieve/i);
    screen.getByText(/rock.hammer/i);
  });

  it('shows "none yet" when no gear is owned', () => {
    render(<ProgressionPanel reputation={0} gear={[]} familyProgress={familyProgress} />);
    screen.getByText(/none yet/i);
  });

  it('renders per-family completion', () => {
    render(<ProgressionPanel reputation={0} gear={[]} familyProgress={familyProgress} />);
    screen.getByText(/quartz/i);
    screen.getByText('4 / 4');
    screen.getByText('0 / 1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/ProgressionPanel.test.jsx`
Expected: FAIL — cannot resolve `./ProgressionPanel.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/ProgressionPanel.jsx
import { reputationTier } from '../logic/progression.js';

export default function ProgressionPanel({ reputation, gear, familyProgress }) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-yellow-400 font-bold">⭐ {reputation}</span>
        <span className="text-slate-400 text-sm">Reputation · tier {reputationTier(reputation)}</span>
      </div>

      <div className="text-sm text-slate-300">
        <span className="font-semibold">Gear: </span>
        {gear.length === 0 ? (
          <span className="text-slate-500">none yet</span>
        ) : (
          <span className="capitalize">{gear.map((g) => g.replace(/_/g, ' ')).join(', ')}</span>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {familyProgress.map((f) => (
          <li key={f.family} className="flex items-center justify-between text-sm">
            <span className="capitalize text-slate-200">{f.family} {f.complete && <span className="text-green-400">✓</span>}</span>
            <span className="font-mono text-slate-400">{f.discovered} / {f.total}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/ProgressionPanel.test.jsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/ProgressionPanel.jsx src/features/rockhound/components/ProgressionPanel.test.jsx
git commit -m "feat(rockhound): ProgressionPanel (reputation tier, gear, family progress)"
```

---

### Task 6: Wire progression into the shell

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Test: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: everything above plus `localities`/`localitiesById`/`species` loaders and `completedLocalityIds`, `completedFamilies`, `isLocalityUnlocked` (Task 1).
- Produces: the shell now (a) lets the player pick among unlocked localities in Explore, (b) passes `completedFamilies` into Identify, and (c) shows `ProgressionPanel` above the Gemdex.

- [ ] **Step 1: Update the existing test, then add the new ones**

First, FIX an existing assertion that now matches multiple elements: the `'renders the three tabs and defaults to Explore'` test ends with `screen.getByText('Hidden Creek')`, but "Hidden Creek" now appears twice on the Explore tab (the LocalityMap button label AND the Explore panel heading), so `getByText` throws. Change that single line to:

```jsx
    expect(screen.getAllByText('Hidden Creek').length).toBeGreaterThan(0);
```

Then append these two tests to the existing `describe('Rockhound shell', ...)` block:

```jsx
  it('shows the locality map with a locked, hinted neighbor in Explore', () => {
    render(<Rockhound />);
    // starter is unlocked and selected; a gear-gated neighbor is locked with a hint
    screen.getByRole('button', { name: /Hidden Creek/i });
    screen.getByText(/Needs the sieve/i);
  });

  it('shows the progression panel (reputation) on the Gemdex tab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    screen.getByText(/Reputation/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — no locality map / progression panel rendered yet.

- [ ] **Step 3: Write minimal implementation**

Replace `src/features/rockhound/components/Rockhound.jsx` with:

```jsx
// src/features/rockhound/components/Rockhound.jsx
import { useState, useEffect } from 'react';
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW } from '../RockhoundContext.jsx';
import { localities, localitiesById } from '../../../loaders/localities.js';
import { speciesById, species } from '../../../loaders/species.js';
import { completedLocalityIds, completedFamilies, isLocalityUnlocked } from '../logic/progression.js';
import Explore from './Explore.jsx';
import Identify from './Identify.jsx';
import GemdexV5 from './GemdexV5.jsx';
import LocalityMap from './LocalityMap.jsx';
import ProgressionPanel from './ProgressionPanel.jsx';

const TABS = ['Explore', 'Identify', 'Gemdex'];

function familyProgressFor(gemdex) {
  const set = new Set(gemdex);
  const families = [...new Set(species.map((s) => s.family))];
  return families.map((family) => {
    const members = species.filter((s) => s.family === family);
    const discovered = members.filter((s) => set.has(s.id)).length;
    return { family, discovered, total: members.length, complete: discovered === members.length };
  });
}

function RockhoundInner() {
  const { state, dispatch } = useRockhound();
  const [tab, setTab] = useState('Explore');
  const [selectedLocalityId, setSelectedLocalityId] = useState('hidden_creek');

  const activeRough = state.rough[0] ?? null;

  const completedLocalities = completedLocalityIds(localities, state.gemdex);
  const completedFams = completedFamilies(species, state.gemdex);
  const ctx = { reputation: state.reputation, gear: state.gear, completedLocalities, completedFamilies: completedFams };
  const unlockedIds = localities.filter((l) => isLocalityUnlocked(l, ctx)).map((l) => l.id);
  const selectedLocality = localitiesById[selectedLocalityId] ?? localitiesById.hidden_creek;

  useEffect(() => {
    if (tab === 'Gemdex' && state.newlyDiscovered.length > 0) {
      dispatch({ type: CLEAR_NEW });
    }
  }, [tab, state.newlyDiscovered.length, dispatch]);

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
        <div className="flex flex-col gap-4">
          <LocalityMap
            localities={localities}
            unlockedIds={unlockedIds}
            selectedId={selectedLocalityId}
            onSelect={setSelectedLocalityId}
          />
          <Explore
            locality={selectedLocality}
            roughCount={state.rough.length}
            onCollect={(specimen) => dispatch({ type: ADD_ROUGH, payload: specimen })}
          />
        </div>
      )}

      {tab === 'Identify' && (
        activeRough ? (
          <Identify
            key={activeRough.instanceId}
            specimen={activeRough}
            locality={localitiesById[activeRough.origin] ?? localitiesById.hidden_creek}
            speciesById={speciesById}
            testMastery={state.testMastery}
            completedFamilies={completedFams}
            onRunTest={(testId, score) => dispatch({ type: RECORD_TEST_SCORE, payload: { testId, score } })}
            onCommit={(instanceId, guessId) => dispatch({ type: COMMIT_IDENTIFY, payload: { instanceId, guessId } })}
          />
        ) : (
          <p className="text-slate-400">Your bench has no rough — pan a locality in Explore first.</p>
        )
      )}

      {tab === 'Gemdex' && (
        <div className="flex flex-col gap-4">
          <ProgressionPanel reputation={state.reputation} gear={state.gear} familyProgress={familyProgressFor(state.gemdex)} />
          <GemdexV5 species={species} gemdex={state.gemdex} newlyDiscovered={state.newlyDiscovered} />
        </div>
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

- [ ] **Step 4: Run the shell test, then the full suite + build**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: PASS (existing shell tests + the two new ones).

Run: `./node_modules/.bin/vitest run`
Expected: PASS — whole unit suite green.

Run: `./node_modules/.bin/vite build`
Expected: `✓ built` with no errors.

- [ ] **Step 5: Manual smoke (recommended)**

`./node_modules/.bin/vite --port 5173`, open the app → Rockhound. Pan Hidden Creek, identify its species; watch reputation rise on the Gemdex tab, gear appear (sieve/rock hammer), and locked localities (Gravel Bar, Amethyst Vug, Old Quarry) unlock. Confirm no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(rockhound): wire locality selection, familiarity, and progression panel into the shell"
```

---

## Notes for the implementer

- **Read the data first.** Locality ids (`hidden_creek`, `gravel_bar`, `amethyst_vug`, `old_quarry`), their `unlockGate` trees, and species `family` values come from `src/data/localities.yaml` / `src/data/species.yaml`. Do not invent them.
- **Back-compat is a hard requirement.** `runTest`'s `familiarity` and `Identify`'s `completedFamilies` must default so the Task-2/Task-6 slice tests still pass unchanged.
- **Determinism.** Pure progression functions take data as parameters; no `Math.random`.
- **No jest-dom.** Presence via `getByText`/`getByRole` (throw-on-miss); absence via `queryByText(...) === null`.

## Known simplifications (intentional for this increment)

- Gear is granted by milestones (no shop/economy — the C layer is still deferred). Cash gate conditions always pass.
- Trophy/best-specimen tracking and gem shows are deferred to the Cut increment and beyond (they need cut stats).
- The locality map is a list with lock/hint states, not a spatial world map (visual polish deferred with the fun-polish pass).
