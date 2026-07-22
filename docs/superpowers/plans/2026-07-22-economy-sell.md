# Economy & Sell Increment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the loop a payoff and a sink — cut stones become sellable inventory, you sell identified specimens or cut stones for cash (value driven by the stone's real base value and grade), and spend cash in a shop to buy the gear that unlocks new localities.

**Architecture:** Extend the isolated `src/features/rockhound/` module. Add one pure `logic/market.js` (value functions + shop catalog). Thread `cash` and a `stones` inventory into `RockhoundContext` (cut stones are pushed to `stones` on `APPLY_CUT`), add `SELL_IDENTIFIED`/`SELL_STONE`/`BUY_GEAR` actions, add a presentational `Market` component, and wire a Market tab + a cash readout into the shell. No legacy files touched.

**Tech Stack:** React 18 + Vite, Zod-validated YAML data, Vitest + React Testing Library (jsdom), Tailwind v4.

## Global Constraints

- **Package manager:** local binary, not `pnpm exec`: `./node_modules/.bin/vitest run <path>`; build `./node_modules/.bin/vite build`.
- **Unit tests under `src/**`** (`.test.js`/`.test.jsx`); no `@testing-library/jest-dom` (assert via `getByText`/`getByRole` throw-on-miss, `queryByText(...) === null`, `fireEvent`). The `localStorage` shim in `src/setupTests.js` exists; do not modify it.
- **Isolation:** only edit files under `src/features/rockhound/`. Do NOT touch `GameContext.jsx`, legacy features, `App.jsx`/`Menu.jsx`/`constants.js`, or the v5 data/schemas/loaders. The Rockhound menu button already exists.
- **Reuse existing data:** species carry `baseValue` and `rarity`; cut stones (in `state.stones`) carry `score`, `cutQuality`, `phenomena`, `cut`, `trueSpeciesId`. Gear ids `sieve`/`rock_hammer` are the map-unlock gear the locality gates check.
- **No `Math.random` in logic.**
- **Value model (locked):** species `baseValue` already encodes rarity, so do NOT multiply by a rarity factor — value = `baseValue × gradeFactor × stageDiscount`. `gradeFactor(score) = 0.5 + score/100`; identified (uncut) uses `UNCUT_DISCOUNT = 0.5` with a color/clarity grade; cut stones sell at full grade. Shop gear: `sieve` 120, `rock_hammer` 300.
- **Back-compat:** new state fields (`cash: 0`, `stones: []`) default so existing reducer, persistence, and shell tests pass unchanged. Cut stones are ADDED to `stones` in `APPLY_CUT` without changing its existing `identified`/`bestSpecimens`/`lastCutResult` behavior. `bestSpecimens` remains a persistent best-achieved record (selling a stone from `stones` does not remove its trophy record).

---

## File Structure

New:
```
src/features/rockhound/logic/market.js        # stoneValue, identifiedValue, SHOP_GEAR, gearPrice
src/features/rockhound/logic/market.test.js
src/features/rockhound/components/Market.jsx   # presentational: sell lists + shop
src/features/rockhound/components/Market.test.jsx
```
Modified:
```
src/features/rockhound/RockhoundContext.jsx    # cash + stones; APPLY_CUT pushes stones; SELL_*/BUY_GEAR
src/features/rockhound/RockhoundContext.test.js
src/features/rockhound/components/Rockhound.jsx # Market tab + cash readout
src/features/rockhound/components/Rockhound.test.jsx
```

---

### Task 1: Market logic

**Files:**
- Create: `src/features/rockhound/logic/market.js`
- Test: `src/features/rockhound/logic/market.test.js`

**Interfaces:**
- Produces:
  - `UNCUT_DISCOUNT = 0.5`
  - `gradeFactor(score): number` — `0.5 + (score ?? 0)/100`
  - `stoneValue(stone, species): number` — `round(species.baseValue * gradeFactor(stone.score))`
  - `identifiedValue(specimen, species): number` — `round(species.baseValue * (0.5 + ((colorGrade+clarity)/2)/100) * UNCUT_DISCOUNT)`
  - `SHOP_GEAR = [{ id:'sieve', name:'Sieve', price:120 }, { id:'rock_hammer', name:'Rock Hammer', price:300 }]`
  - `gearPrice(gearId): number|null`

- [ ] **Step 1: Write the failing test**

```javascript
// src/features/rockhound/logic/market.test.js
import { describe, it, expect } from 'vitest';
import { gradeFactor, stoneValue, identifiedValue, SHOP_GEAR, gearPrice, UNCUT_DISCOUNT } from './market.js';
import { speciesById } from '../../../loaders/species.js';

describe('gradeFactor', () => {
  it('maps score 0..100 to 0.5..1.5', () => {
    expect(gradeFactor(0)).toBeCloseTo(0.5, 5);
    expect(gradeFactor(100)).toBeCloseTo(1.5, 5);
    expect(gradeFactor(undefined)).toBeCloseTo(0.5, 5);
  });
});

describe('stoneValue', () => {
  it('scales a species baseValue by grade', () => {
    // sapphire baseValue 700; score 50 → 0.5+0.5 = 1.0 → 700
    expect(stoneValue({ score: 50 }, speciesById.sapphire)).toBe(700);
    // higher score → more value
    expect(stoneValue({ score: 90 }, speciesById.sapphire)).toBeGreaterThan(stoneValue({ score: 50 }, speciesById.sapphire));
  });
});

describe('identifiedValue', () => {
  it('is a discounted fraction of a good cut stone (cut is worth more)', () => {
    const specimen = { colorGrade: 80, clarity: 80 };
    const idVal = identifiedValue(specimen, speciesById.sapphire); // 700 * 1.3 * 0.5 = 455
    expect(idVal).toBe(455);
    expect(idVal).toBeLessThan(stoneValue({ score: 80 }, speciesById.sapphire)); // cutting adds value
  });
});

describe('shop', () => {
  it('prices the unlock gear', () => {
    expect(gearPrice('sieve')).toBe(120);
    expect(gearPrice('rock_hammer')).toBe(300);
    expect(gearPrice('nonsense')).toBeNull();
    expect(SHOP_GEAR.map((g) => g.id)).toEqual(['sieve', 'rock_hammer']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/market.test.js`
Expected: FAIL — cannot resolve `./market.js`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/features/rockhound/logic/market.js

export const UNCUT_DISCOUNT = 0.5;

export const gradeFactor = (score) => 0.5 + (score ?? 0) / 100;

export function stoneValue(stone, species) {
  return Math.round(species.baseValue * gradeFactor(stone.score));
}

export function identifiedValue(specimen, species) {
  const grade = 0.5 + ((specimen.colorGrade + specimen.clarity) / 2) / 100;
  return Math.round(species.baseValue * grade * UNCUT_DISCOUNT);
}

export const SHOP_GEAR = [
  { id: 'sieve', name: 'Sieve', price: 120 },
  { id: 'rock_hammer', name: 'Rock Hammer', price: 300 }
];

export function gearPrice(gearId) {
  return SHOP_GEAR.find((g) => g.id === gearId)?.price ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/market.test.js`
Expected: PASS (all blocks).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/market.js src/features/rockhound/logic/market.test.js
git commit -m "feat(rockhound): market logic (stone/identified value, shop gear)"
```

---

### Task 2: Cash + selling + shop in the reducer

**Files:**
- Modify: `src/features/rockhound/RockhoundContext.jsx`
- Test: `src/features/rockhound/RockhoundContext.test.js`

**Interfaces:**
- Consumes: `identifiedValue`, `stoneValue`, `gearPrice` (Task 1).
- Produces: `initialRockhoundState` gains `cash: 0` and `stones: []`; new action types `SELL_IDENTIFIED`, `SELL_STONE`, `BUY_GEAR`.
  - `APPLY_CUT` now also pushes the produced cut stone (`{ ...result.specimen, score }`) onto `stones` (success/fail; shattered adds nothing). Existing `identified`/`bestSpecimens`/`lastCutResult` behavior is unchanged.
  - `{ type: SELL_IDENTIFIED, payload: { instanceId } }` — remove from `identified`, `cash += identifiedValue(specimen, species)`.
  - `{ type: SELL_STONE, payload: { instanceId } }` — remove from `stones`, `cash += stoneValue(stone, species)`.
  - `{ type: BUY_GEAR, payload: { gearId } }` — no-op unless the gear has a price, is not already owned, and `cash >= price`; else `cash -= price`, `gear = [...gear, gearId]`.

- [ ] **Step 1: Write the failing tests** (append to `describe('rockhoundReducer', ...)`; add the import)

```javascript
// add to the top imports of RockhoundContext.test.js.
// If the file already imports from '../../loaders/species.js' (e.g. `species`),
// MERGE `speciesById` into that existing import instead of adding a second line.
import { stoneValue, identifiedValue, gearPrice } from './logic/market.js';
import { speciesById } from '../../loaders/species.js';

// inside describe('rockhoundReducer', ...):
  it('starts with zero cash and no stones', () => {
    expect(initialRockhoundState.cash).toBe(0);
    expect(initialRockhoundState.stones).toEqual([]);
  });

  it('a successful cut adds a sellable stone to inventory', () => {
    let s = { ...initialRockhoundState, identified: [identifiedSapphire] };
    s = rockhoundReducer(s, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    for (let i = 0; i < 9; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.stones).toHaveLength(1);
    expect(s.stones[0].trueSpeciesId).toBe('sapphire');
  });

  it('sells an identified specimen for its identified value', () => {
    const s0 = { ...initialRockhoundState, identified: [identifiedSapphire] };
    const s1 = rockhoundReducer(s0, { type: SELL_IDENTIFIED, payload: { instanceId: 'g1' } });
    expect(s1.identified).toHaveLength(0);
    expect(s1.cash).toBe(identifiedValue(identifiedSapphire, speciesById.sapphire));
  });

  it('sells a cut stone for its stone value', () => {
    const stone = { instanceId: 'st1', trueSpeciesId: 'sapphire', cut: 'cabochon', cutQuality: 90, phenomena: ['asterism'], caratWeight: 2, caratRetained: 1.6, clarity: 80, colorGrade: 80, score: 88 };
    const s0 = { ...initialRockhoundState, stones: [stone] };
    const s1 = rockhoundReducer(s0, { type: SELL_STONE, payload: { instanceId: 'st1' } });
    expect(s1.stones).toHaveLength(0);
    expect(s1.cash).toBe(stoneValue(stone, speciesById.sapphire));
  });

  it('buys gear when affordable and not owned, and no-ops otherwise', () => {
    const rich = { ...initialRockhoundState, cash: 500 };
    const bought = rockhoundReducer(rich, { type: BUY_GEAR, payload: { gearId: 'sieve' } });
    expect(bought.gear).toContain('sieve');
    expect(bought.cash).toBe(500 - gearPrice('sieve'));
    // already owned → no-op
    expect(rockhoundReducer(bought, { type: BUY_GEAR, payload: { gearId: 'sieve' } })).toBe(bought);
    // too poor → no-op
    const poor = { ...initialRockhoundState, cash: 10 };
    expect(rockhoundReducer(poor, { type: BUY_GEAR, payload: { gearId: 'rock_hammer' } })).toBe(poor);
  });
```

Note: `identifiedSapphire` is already defined in the block from the Cut increment (`{ instanceId: 'g1', stage: 'identified', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' }`). If it is not in scope where you add these tests, define it locally with those exact fields.

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — cash/stones missing, action types undefined.

- [ ] **Step 3: Write minimal implementation**

In `RockhoundContext.jsx`, add the import:

```javascript
import { identifiedValue, stoneValue, gearPrice } from './logic/market.js';
```

Add action types:

```javascript
export const SELL_IDENTIFIED = 'SELL_IDENTIFIED';
export const SELL_STONE = 'SELL_STONE';
export const BUY_GEAR = 'BUY_GEAR';
```

Add fields to `initialRockhoundState` (keep all existing fields):

```javascript
  cash: 0,
  stones: [],
```

Update the `APPLY_CUT` case so the produced stone is also stored. Replace its `bestSpecimens` block and return with:

```javascript
      let bestSpecimens = state.bestSpecimens;
      let stones = state.stones;
      if (result.specimen) {
        const score = specimenScore(result.specimen, species);
        const cutStone = { ...result.specimen, score };
        stones = [...state.stones, cutStone];
        const prev = state.bestSpecimens[species.id];
        if (!prev || score > prev.score) {
          bestSpecimens = { ...state.bestSpecimens, [species.id]: cutStone };
        }
      }
      return {
        ...state,
        identified,
        stones,
        bestSpecimens,
        lastCutResult: {
          instanceId,
          outcome: result.outcome,
          speciesId: species.id,
          cutQuality: result.specimen?.cutQuality ?? null,
          phenomena: result.specimen?.phenomena ?? []
        }
      };
```

Add the three new cases before `default:`:

```javascript
    case SELL_IDENTIFIED: {
      const { instanceId } = action.payload;
      const specimen = state.identified.find((s) => s.instanceId === instanceId);
      if (!specimen) return state;
      const species = speciesById[specimen.trueSpeciesId];
      return {
        ...state,
        identified: state.identified.filter((s) => s.instanceId !== instanceId),
        cash: state.cash + identifiedValue(specimen, species)
      };
    }

    case SELL_STONE: {
      const { instanceId } = action.payload;
      const stone = state.stones.find((s) => s.instanceId === instanceId);
      if (!stone) return state;
      const species = speciesById[stone.trueSpeciesId];
      return {
        ...state,
        stones: state.stones.filter((s) => s.instanceId !== instanceId),
        cash: state.cash + stoneValue(stone, species)
      };
    }

    case BUY_GEAR: {
      const { gearId } = action.payload;
      const price = gearPrice(gearId);
      if (price == null || state.gear.includes(gearId) || state.cash < price) return state;
      return { ...state, cash: state.cash - price, gear: [...state.gear, gearId] };
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js src/features/rockhound/RockhoundContext.persistence.test.jsx`
Expected: PASS (existing cut/gear/persistence tests + the new economy tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(rockhound): cash, sellable stones, sell/buy actions"
```

---

### Task 3: Market component

**Files:**
- Create: `src/features/rockhound/components/Market.jsx`
- Test: `src/features/rockhound/components/Market.test.jsx`

**Interfaces:**
- Consumes: `identifiedValue`, `stoneValue`, `SHOP_GEAR`, `gearPrice` (Task 1).
- Produces: presentational `Market` with props `{ cash, identified, stones, speciesById, ownedGear, onSellIdentified, onSellStone, onBuyGear }`.
  - Shows the current `cash`.
  - **Sell** section: each identified specimen → name + `identifiedValue` + a **Sell** button (`onSellIdentified(instanceId)`); each cut stone → name + cut + `stoneValue` + a **Sell** button (`onSellStone(instanceId)`). Empty-state text when nothing is sellable.
  - **Shop** section: each `SHOP_GEAR` item → name + price + a **Buy** button that is disabled when owned (`ownedGear.includes(id)`) or unaffordable (`cash < price`); clicking calls `onBuyGear(id)`.

- [ ] **Step 1: Write the failing test**

```jsx
// src/features/rockhound/components/Market.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Market from './Market.jsx';
import { speciesById } from '../../../loaders/species.js';

const identified = [{ instanceId: 'g1', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' }];
const stones = [{ instanceId: 'st1', trueSpeciesId: 'sapphire', cut: 'cabochon', cutQuality: 90, phenomena: ['asterism'], caratRetained: 1.6, clarity: 80, colorGrade: 80, score: 88 }];

function setup(over = {}) {
  const props = {
    cash: 0, identified, stones, speciesById, ownedGear: [],
    onSellIdentified: vi.fn(), onSellStone: vi.fn(), onBuyGear: vi.fn(), ...over
  };
  render(<Market {...props} />);
  return props;
}

describe('Market', () => {
  it('shows current cash', () => {
    setup({ cash: 425 });
    screen.getByText(/425/);
  });

  it('sells an identified specimen', () => {
    const p = setup();
    fireEvent.click(screen.getAllByRole('button', { name: /Sell/i })[0]);
    expect(p.onSellIdentified).toHaveBeenCalledWith('g1');
  });

  it('sells a cut stone', () => {
    const p = setup({ identified: [] }); // only the stone is sellable → its Sell button is first
    fireEvent.click(screen.getByRole('button', { name: /Sell/i }));
    expect(p.onSellStone).toHaveBeenCalledWith('st1');
  });

  it('disables Buy for unaffordable gear and buys when affordable', () => {
    const p = setup({ cash: 200 }); // sieve 120 affordable, rock_hammer 300 not
    const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
    const affordable = buyButtons.find((b) => !b.disabled);
    fireEvent.click(affordable);
    expect(p.onBuyGear).toHaveBeenCalledWith('sieve');
    expect(buyButtons.some((b) => b.disabled)).toBe(true); // rock_hammer disabled at cash 200
  });

  it('shows an empty state when nothing is sellable', () => {
    setup({ identified: [], stones: [] });
    screen.getByText(/nothing to sell/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Market.test.jsx`
Expected: FAIL — cannot resolve `./Market.jsx`.

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/features/rockhound/components/Market.jsx
import { identifiedValue, stoneValue, SHOP_GEAR } from '../logic/market.js';

export default function Market({ cash, identified, stones, speciesById, ownedGear, onSellIdentified, onSellStone, onBuyGear }) {
  const nothingToSell = identified.length === 0 && stones.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="text-lg font-bold text-yellow-400">💰 {cash}</div>

      <div>
        <h3 className="font-bold text-yellow-400 mb-2">Sell</h3>
        {nothingToSell ? (
          <p className="text-slate-500 text-sm">Nothing to sell — identify or cut a stone first.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {identified.map((sp) => (
              <li key={sp.instanceId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100">{speciesById[sp.trueSpeciesId].name} <span className="text-xs text-slate-400">(rough, uncut)</span></span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {identifiedValue(sp, speciesById[sp.trueSpeciesId])}</span>
                  <button type="button" onClick={() => onSellIdentified(sp.instanceId)} className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm text-white">Sell</button>
                </span>
              </li>
            ))}
            {stones.map((st) => (
              <li key={st.instanceId} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100">{speciesById[st.trueSpeciesId].name} <span className="text-xs text-slate-400">({st.cut}{st.phenomena?.length ? ' ✨' : ''})</span></span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {stoneValue(st, speciesById[st.trueSpeciesId])}</span>
                  <button type="button" onClick={() => onSellStone(st.instanceId)} className="rounded bg-green-600 hover:bg-green-500 px-3 py-1 text-sm text-white">Sell</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-bold text-yellow-400 mb-2">Shop — gear</h3>
        <ul className="flex flex-col gap-2">
          {SHOP_GEAR.map((g) => {
            const owned = ownedGear.includes(g.id);
            const affordable = cash >= g.price;
            return (
              <li key={g.id} className="flex items-center justify-between rounded border border-slate-600 bg-slate-800 p-2">
                <span className="text-slate-100 capitalize">{g.name}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">💰 {g.price}</span>
                  <button
                    type="button"
                    disabled={owned || !affordable}
                    onClick={() => onBuyGear(g.id)}
                    className={`rounded px-3 py-1 text-sm ${owned || !affordable ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold'}`}
                  >
                    {owned ? 'Owned' : 'Buy'}
                  </button>
                </span>
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

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Market.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/Market.jsx src/features/rockhound/components/Market.test.jsx
git commit -m "feat(rockhound): Market component (sell + shop)"
```

---

### Task 4: Wire Market into the shell

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Test: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: `Market` (Task 3), the new actions (Task 2).
- Produces: a fifth tab **Market** (order: Explore, Identify, Cut, Market, Gemdex); wires context state (`cash`, `identified`, `stones`, `gear`) and dispatch (`SELL_IDENTIFIED`/`SELL_STONE`/`BUY_GEAR`) into `Market`; adds a small persistent **cash readout** at the top of the shell (above the tab nav).

- [ ] **Step 1: Update tabs + add tests**

Add to the `describe('Rockhound shell', ...)` block:

```jsx
  it('shows a Market tab with an empty sell state before anything is sellable', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /^Market$/i }));
    screen.getByText(/nothing to sell/i);
  });

  it('shows a cash readout in the shell', () => {
    render(<Rockhound />);
    screen.getByText(/💰/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — no Market tab / no cash readout.

- [ ] **Step 3: Write minimal implementation**

In `Rockhound.jsx`, add the import (extend the existing context-action import line and add the component import):

```jsx
import Market from './Market.jsx';
```

Extend the `RockhoundContext.jsx` import to include the sell/buy actions:

```jsx
import { RockhoundProvider, useRockhound, ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR } from '../RockhoundContext.jsx';
```

Change `TABS`:

```jsx
const TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex'];
```

Add a cash readout just inside the outer `<div className="flex flex-col gap-4">`, before the `<nav>`:

```jsx
      <div className="flex justify-end text-lg font-bold text-yellow-400">💰 {state.cash}</div>
```

Add the Market tab block (after the Cut block, before the Gemdex block):

```jsx
      {tab === 'Market' && (
        <Market
          cash={state.cash}
          identified={state.identified}
          stones={state.stones}
          speciesById={speciesById}
          ownedGear={state.gear}
          onSellIdentified={(instanceId) => dispatch({ type: SELL_IDENTIFIED, payload: { instanceId } })}
          onSellStone={(instanceId) => dispatch({ type: SELL_STONE, payload: { instanceId } })}
          onBuyGear={(gearId) => dispatch({ type: BUY_GEAR, payload: { gearId } })}
        />
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

`./node_modules/.bin/vite --port 5173` → Rockhound. Identify a couple stones → **Market**: sell one identified specimen for cash; cut another and sell the cut stone for more (cutting adds value); buy the **Sieve** in the shop → **Explore** now shows **Gravel Bar** unlocked. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(rockhound): Market tab + cash readout wired into the shell"
```

---

## Notes for the implementer

- **Read the data first:** species `baseValue`/`rarity` from `src/data/species.yaml`; gear ids `sieve`/`rock_hammer` are the map-unlock gear the locality gates already check. Do not modify data.
- **Back-compat is a hard requirement:** `cash`/`stones` default so every existing reducer, persistence, and shell test passes unchanged. The `APPLY_CUT` edit only ADDS the `stones` push; do not alter its `identified`/`bestSpecimens`/`lastCutResult` outputs.
- **No jest-dom.** Presence via `getByText`/`getByRole`; the `/^Market$/i` role query targets the tab button. Button `.disabled` is asserted directly.
- **Buying gear** reuses the existing gate system: `BUY_GEAR` adds to `state.gear`, and the shell already computes `unlockedIds` via `isLocalityUnlocked` from that gear — so a bought sieve unlocks Gravel Bar with no extra wiring.

## Known simplifications (intentional)

- Sells identified specimens and cut stones only (not raw unidentified rough — avoids blind-loss). Certification, an instrument shop (needs instrument state), market demand fluctuation, and buying rough/species are deferred.
- `bestSpecimens` is a persistent best-achieved record; selling the physical stone from `stones` does not erase the trophy record.
- Prices are flat starting points to be tuned in playtest.
