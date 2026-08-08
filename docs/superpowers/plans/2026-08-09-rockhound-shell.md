# Rockhound Shell: Retire Legacy, Sticky Footer, Debug Menu, Run Screen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Rockhound the whole app — delete the legacy prototype and its second economy, give the player a persistent stat footer, rebuild the debug menu around the features actually under development, and split the Explore map from the Explore run.

**Architecture:** One deletion task removes 40+ legacy files whose only entry points are `GameContext` and `Menu`; `App.jsx` then mounts `RockhoundProvider` + `Rockhound` directly. The remaining tasks are additive UI work inside the Rockhound feature, plus a debug panel rewritten against `RockhoundContext`.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Zod-validated YAML, React Context + useReducer, Vitest + React Testing Library, `react-icons`.

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Native Vitest matchers and raw DOM reads only (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **`getByText` matches an element by its direct child text nodes joined**, not full `textContent`. Two siblings rendering the same string collide. Prefer `getByRole` with distinct accessible names.
- **Rules modules own formulas; view modules delegate and never restate one.** Six violations of this rule have been caught in this project. `dive.js`, `forms.js`, `cut.js`, `market.js`, `progression.js` own rules; `diveView.js`, `localityView.js`, `cutView.js`, `marketView.js` delegate.
- **Never write a test that passes when the behaviour is removed.** After writing a test, stub the behaviour and confirm it fails.
- No inline magic numbers: every tuned value is a named constant, exported only if another module or a test needs it.
- When adding to an import from a path a file already imports, **extend the existing line** — a second `import` from the same path is a duplicate-binding `SyntaxError`.
- The test suite is green at **356 tests** before this plan starts. It must be green at every commit.

## Context: what is being deleted and why it is safe

`grep` establishes that Rockhound's entire external surface is four modules — `loaders/species.js`, `loaders/localities.js`, `loaders/cutTechniques.js`, `schemas/localities.js` — plus one stray import of `RARITY_ENUM` from `schemas/items.js`. Nothing outside `src/features/rockhound/` imports anything from inside it except `App.jsx` and `Menu.jsx`. `src/data/foundation.test.js` tests only Rockhound data.

`src/constants.js` and `src/loaders/index.js` are imported by nothing at all — already dead.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/schemas/species.js` | *modify* — becomes the owner of `RARITY_ENUM` |
| `src/features/rockhound/logic/localityView.js` | *modify* — import `RARITY_ENUM` from its new home |
| `src/App.jsx` | *rewrite* — mounts `RockhoundProvider` + `Rockhound`, no header, no coin footer |
| ~40 legacy files | *delete* — see Task 2 for the exact list |
| `src/features/rockhound/logic/rarity.js` | *create* — rarity tier colours (seeded from the deleted `GEM_TIERS`) |
| `src/features/rockhound/logic/footerView.js` | *create* — the footer's presentation shape |
| `src/features/rockhound/components/StatusFooter.jsx` | *create* — the sticky footer |
| `src/shared/components/DebugPanel.jsx` | *rewrite* — Rockhound-targeted controls |
| `src/features/rockhound/components/LocalityCard.jsx` | *modify* — method+level promoted, rarity rings, icon button |
| `src/features/rockhound/components/LocalityEntry.jsx` | *modify* — receives `depositType` detail |
| `src/features/rockhound/components/Rockhound.jsx` | *modify* — map/run routing, footer mount |

---

### Task 1: Move `RARITY_ENUM` out of the legacy schema

The single knot tying Rockhound to the legacy data model. Must land before Task 2 can delete `schemas/items.js`.

**Files:**
- Modify: `src/schemas/species.js`
- Modify: `src/features/rockhound/logic/localityView.js`
- Test: `src/data/foundation.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `RARITY_ENUM` exported from `src/schemas/species.js`, unchanged in value: `['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']`

- [ ] **Step 1: Write the failing test**

Append to `src/data/foundation.test.js`. Add `RARITY_ENUM` to the **existing** `../schemas/species.js` import line (do not add a second import from that path):

```js
describe('rarity tiers', () => {
  it('are owned by the species schema, in ascending order', () => {
    expect(RARITY_ENUM).toEqual(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  });

  it('cover every species in the roster', () => {
    for (const s of species) {
      expect(RARITY_ENUM, `${s.id} rarity`).toContain(s.rarity);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/data/foundation.test.js`
Expected: FAIL — `RARITY_ENUM is not defined` (no such export from `species.js`).

- [ ] **Step 3: Move the constant**

In `src/schemas/species.js`, delete the line `import { RARITY_ENUM } from './items.js';` and declare it locally instead, directly above the schema that uses it:

```js
// The five rarity tiers, ascending. Owned here because species are the only
// things in the game that carry a rarity.
export const RARITY_ENUM = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
```

In `src/features/rockhound/logic/localityView.js`, change line 1 from:

```js
import { RARITY_ENUM } from '../../../schemas/items.js';
```

to:

```js
import { RARITY_ENUM } from '../../../schemas/species.js';
```

- [ ] **Step 4: Verify no Rockhound file still reaches into the legacy schema**

Run: `grep -rn "schemas/items" src/features/rockhound/`
Expected: no output.

- [ ] **Step 5: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — 356 existing plus 2 new.

- [ ] **Step 6: Commit**

```bash
git add src/schemas/species.js src/features/rockhound/logic/localityView.js src/data/foundation.test.js
git commit -m "refactor(schemas): species schema owns the rarity tiers"
```

---

### Task 2: Retire the legacy prototype

The one irreversible task. Everything deleted here is recoverable from git history, and every file listed is reachable only from other files in the same list.

**Files:**
- Rewrite: `src/App.jsx`
- Delete: the lists below
- Test: `src/App.test.jsx` (create)

**Interfaces:**
- Consumes: `RARITY_ENUM` from `schemas/species.js` (Task 1)
- Produces: an app whose root renders `RockhoundProvider` > `Rockhound`

- [ ] **Step 1: Write the failing test**

Create `src/App.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('opens straight into Rockhound with no menu to cross', () => {
    render(<App />);
    // The five Rockhound tabs are the app's only navigation now.
    for (const tab of ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex']) {
      screen.getByRole('button', { name: tab });
    }
  });

  it('no longer shows the retired shell chrome', () => {
    render(<App />);
    // The "Gemstone Collector" banner and the legacy coin bar are both gone.
    expect(screen.queryByText(/Gemstone Collector/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Discover$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Craft$/ })).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/App.test.jsx`
Expected: FAIL — the app renders the legacy Menu, so no `Explore` button exists and the banner is present.

- [ ] **Step 3: Rewrite `src/App.jsx`**

Replace the file entirely:

```jsx
import { RockhoundProvider } from './features/rockhound/RockhoundContext.jsx';
import Rockhound from './features/rockhound/components/Rockhound.jsx';
import DebugPanel from './shared/components/DebugPanel.jsx';

// The provider sits at the root rather than inside the feature so that state
// loads once at startup and the debug panel can dispatch into it.
export default function App() {
  return (
    <RockhoundProvider>
      <div className="flex min-h-screen flex-col bg-slate-900">
        <main className="container mx-auto w-full max-w-[1536px] flex-1 px-4 py-6 md:px-6">
          <Rockhound />
        </main>
        <DebugPanel />
      </div>
    </RockhoundProvider>
  );
}
```

- [ ] **Step 4: Stop `Rockhound.jsx` mounting a second provider**

`Rockhound.jsx` currently wraps its own content in `<RockhoundProvider>` (around line 178). Two nested providers would give the debug panel a *different* store than the UI — a silent, confusing bug. Remove the wrapper so the default export is:

```jsx
export default function Rockhound() {
  return <RockhoundInner />;
}
```

Leave the `RockhoundProvider` name in the import list only if something else in the file uses it; otherwise drop it from the import.

- [ ] **Step 5: Delete the legacy features**

```bash
git rm -r src/features/discover src/features/process src/features/craft src/features/sell src/features/inventory
```

- [ ] **Step 6: Delete the legacy shell, context and hooks**

```bash
git rm src/context/GameContext.jsx src/context/inventoryHelpers.js
git rm src/shared/components/Menu.jsx src/shared/components/ItemIcons.jsx src/shared/components/TutorialModal.jsx
git rm src/shared/hooks/useGame.js src/shared/hooks/usePlayer.js
git rm src/constants.js src/loaders/index.js src/schemas/index.js
```

If `src/shared/utils/queueProcessing.js` exists, delete it too — it imports `data/processEquipment.js`, which goes in the next step.

- [ ] **Step 7: Delete the legacy data, loaders and schemas**

```bash
git rm src/loaders/items.js src/loaders/equipment.js src/loaders/locations.js src/loaders/upgrades.js src/loaders/workers.js
git rm src/schemas/items.js src/schemas/equipment.js src/schemas/locations.js src/schemas/player.js src/schemas/upgrades.js src/schemas/workers.js
git rm src/data/items.yaml src/data/equipment.yaml src/data/locations.yaml src/data/upgrades.yaml src/data/workers.yaml
git rm src/data/items.js src/data/lootTables.js src/data/minigames.js src/data/processEquipment.js src/data/recipes.js src/data/subareas.js
```

**Keep** `src/data/species.yaml`, `localities.yaml`, `cutTechniques.yaml`, `foundation.test.js`, and the three loaders and two schemas that serve them.

- [ ] **Step 8: Prove nothing dangles**

Run each and expect **no output**:

```bash
grep -rn "GameContext\|useGame\|usePlayer" src/
grep -rn "loaders/items\|loaders/equipment\|loaders/locations\|loaders/upgrades\|loaders/workers" src/
grep -rn "schemas/items\|schemas/equipment\|schemas/locations\|schemas/player\|schemas/upgrades\|schemas/workers" src/
grep -rn "data/lootTables\|data/minigames\|data/processEquipment\|data/recipes\|data/subareas" src/
grep -rn "features/discover\|features/process\|features/craft\|features/sell\|features/inventory" src/
```

`DebugPanel.jsx` **will** appear in the first and second sweeps — it imports `useGame`, `items` and `PROCESS_EQUIPMENT`. Task 3 rewrites it. To keep this task's commit green, reduce `DebugPanel.jsx` to a placeholder that renders nothing:

```jsx
// Rewritten in the next task against RockhoundContext. The legacy panel was
// built entirely on GameContext, which no longer exists.
export const DEBUG_KEY = 'debug_mode';

export default function DebugPanel() {
  return null;
}
```

Re-run the sweeps after this; all five must now be silent.

- [ ] **Step 9: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — the same 358 as Task 1 plus 2 new. No test file referenced deleted code.

Run: `./node_modules/.bin/vite build`
Expected: `built in <n>ms`, no unresolved-import errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(app): retire the legacy prototype, mount Rockhound as the app"
```

---

### Task 3: Rebuild the debug panel around Rockhound

The old panel granted `GameContext` coins the Rockhound Market could never spend, and its "Clear Save Data" removed only `gemstone_game_save` — never `rockhound_save_v1` — so it silently left the state under test intact.

**Files:**
- Rewrite: `src/shared/components/DebugPanel.jsx`
- Create: `src/shared/components/DebugPanel.test.jsx`
- Modify: `src/features/rockhound/RockhoundContext.jsx`

**Interfaces:**
- Consumes: `useRockhound`, `METHOD_ENUM`, `xpThreshold` from `dive.js`
- Produces: actions `DEBUG_SET_METHOD_LEVEL` (`{ method, level }`), `DEBUG_ADD_CASH` (`{ amount }`), `DEBUG_RESET`; constant `STORAGE_KEY` exported from `RockhoundContext.jsx`

- [ ] **Step 1: Write the failing reducer tests**

Append to `src/features/rockhound/RockhoundContext.test.js`. Add the three new action names to the **existing** `../RockhoundContext.jsx` import line:

```js
describe('debug actions', () => {
  it('sets a method to the exact xp its level requires', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'geode', level: 6 }
    });
    // Stored as xp, never as a level — a stored level would be a second
    // source of truth that can drift from the xp that produced it.
    expect(levelForXp(next.exploreMethodXp.geode)).toBe(6);
    expect(next.exploreMethodXp.panning).toBe(0);
  });

  it('clamps a requested level into the real range', () => {
    const hi = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'panning', level: 99 }
    });
    const lo = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'panning', level: -5 }
    });
    expect(levelForXp(hi.exploreMethodXp.panning)).toBe(MAX_METHOD_LEVEL);
    expect(lo.exploreMethodXp.panning).toBe(0);
  });

  it('ignores an unknown method rather than inventing a track', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'spelunking', level: 4 }
    });
    expect(next.exploreMethodXp).toEqual(initialRockhoundState.exploreMethodXp);
  });

  it('grants cash the Market can actually spend', () => {
    const next = rockhoundReducer({ ...initialRockhoundState, cash: 40 }, {
      type: DEBUG_ADD_CASH, payload: { amount: 1000 }
    });
    expect(next.cash).toBe(1040);
  });

  it('resets to a genuinely fresh state', () => {
    const dirty = { ...initialRockhoundState, cash: 999, gemdex: ['ruby'], reputation: 50 };
    expect(rockhoundReducer(dirty, { type: DEBUG_RESET })).toEqual(initialRockhoundState);
  });
});
```

Add to the existing `./logic/dive.js` import in that file: `levelForXp`, `MAX_METHOD_LEVEL`. If `dive.js` is not yet imported there, add one import line.

`MAX_METHOD_LEVEL` is exported from `dive.js`. `levelForXp` and `xpThreshold` are too.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: FAIL — `DEBUG_SET_METHOD_LEVEL is not defined`.

- [ ] **Step 3: Implement the reducer cases**

In `src/features/rockhound/RockhoundContext.jsx`, export the storage key (the debug panel needs it, and duplicating the string would let the two drift):

```js
export const STORAGE_KEY = 'rockhound_save_v1';
```

Add the action constants beside the others:

```js
export const DEBUG_SET_METHOD_LEVEL = 'DEBUG_SET_METHOD_LEVEL';
export const DEBUG_ADD_CASH = 'DEBUG_ADD_CASH';
export const DEBUG_RESET = 'DEBUG_RESET';
```

Add `import { xpThreshold, levelForXp, MAX_METHOD_LEVEL } from './logic/dive.js';` — or extend the existing `./logic/dive.js` import if one is present.

Add the cases to the reducer:

```js
    case DEBUG_SET_METHOD_LEVEL: {
      const { method, level } = action.payload;
      if (!Object.prototype.hasOwnProperty.call(state.exploreMethodXp, method)) return state;
      const clamped = Math.min(Math.max(Math.round(level), 0), MAX_METHOD_LEVEL);
      return {
        ...state,
        exploreMethodXp: { ...state.exploreMethodXp, [method]: xpThreshold(clamped) }
      };
    }

    case DEBUG_ADD_CASH:
      return { ...state, cash: state.cash + action.payload.amount };

    case DEBUG_RESET:
      return initialRockhoundState;
```

`xpThreshold(0)` is 0, so the lower clamp stores 0 as the test expects.

- [ ] **Step 4: Run to verify the reducer passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/RockhoundContext.test.js`
Expected: PASS.

- [ ] **Step 5: Write the failing panel test**

Create `src/shared/components/DebugPanel.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RockhoundProvider } from '../../features/rockhound/RockhoundContext.jsx';
import DebugPanel from './DebugPanel.jsx';

function open() {
  render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
  fireEvent.keyDown(window, { key: 'D', ctrlKey: true, shiftKey: true });
  fireEvent.click(screen.getByRole('button', { name: /debug mode/i }));
}

describe('DebugPanel', () => {
  beforeEach(() => localStorage.clear());

  it('stays hidden until the shortcut is pressed', () => {
    render(<RockhoundProvider><DebugPanel /></RockhoundProvider>);
    expect(screen.queryByRole('button', { name: /debug mode/i })).toBeNull();
  });

  it('offers a level control for every collection method', () => {
    open();
    for (const m of ['panning', 'hardrock', 'geode', 'surface']) {
      screen.getByRole('slider', { name: new RegExp(`${m} level`, 'i') });
    }
  });

  it('reports the depth a level actually reaches, not just the level', () => {
    open();
    const slider = screen.getByRole('slider', { name: /panning level/i });
    fireEvent.change(slider, { target: { value: '6' } });
    // The number that matters when testing the dive is the depth, so the
    // panel must state it rather than making the tester derive it.
    expect(screen.getByTestId('panning-readout').textContent).toMatch(/depth 4/i);
  });

  it('clears both save keys, not just the legacy one', () => {
    localStorage.setItem('rockhound_save_v1', '{"cash":999}');
    localStorage.setItem('gemstone_game_save', '{"legacy":true}');
    open();
    fireEvent.click(screen.getByRole('button', { name: /clear all save data/i }));
    expect(localStorage.getItem('rockhound_save_v1')).toBe(null);
    expect(localStorage.getItem('gemstone_game_save')).toBe(null);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/shared/components/DebugPanel.test.jsx`
Expected: FAIL — the placeholder panel renders nothing.

- [ ] **Step 7: Implement the panel**

Replace `src/shared/components/DebugPanel.jsx` entirely:

```jsx
import { useState, useEffect } from 'react';
import { useRockhound, STORAGE_KEY, DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET } from '../../features/rockhound/RockhoundContext.jsx';
import { METHOD_ENUM } from '../../schemas/localities.js';
import { levelForXp, MAX_METHOD_LEVEL, effectiveReach } from '../../features/rockhound/logic/dive.js';

export const DEBUG_KEY = 'debug_mode';

const LEGACY_STORAGE_KEY = 'gemstone_game_save';
/** The deepest bedrock in the data — what a level's reach is quoted against. */
const DEEPEST_BEDROCK = 5;

const BTN = 'rounded border border-teal-400 bg-slate-700 px-3 py-1.5 text-xs text-white transition-all hover:bg-teal-400 hover:text-slate-900';
const DANGER = 'rounded border border-red-400 bg-slate-700 px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-400 hover:text-white';

function MethodControl({ method, xp, onSet }) {
  const level = levelForXp(xp);
  return (
    <div className="flex items-center gap-2">
      <label className="w-20 shrink-0 text-xs capitalize text-slate-300" htmlFor={`dbg-${method}`}>
        {method}
      </label>
      <input
        id={`dbg-${method}`}
        type="range"
        min="0"
        max={MAX_METHOD_LEVEL}
        value={level}
        aria-label={`${method} level`}
        onChange={(e) => onSet(method, Number(e.target.value))}
        className="flex-1"
      />
      <span data-testid={`${method}-readout`} className="w-28 shrink-0 text-right font-mono text-xs text-slate-400">
        Lv {level} · depth {effectiveReach(level, DEEPEST_BEDROCK, false)}
      </span>
    </div>
  );
}

export default function DebugPanel() {
  const { state, dispatch } = useRockhound();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible((v) => !v);
        setIsOpen(false);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isVisible) return null;

  const setLevel = (method, level) =>
    dispatch({ type: DEBUG_SET_METHOD_LEVEL, payload: { method, level } });

  const clearEverything = () => {
    // Both keys: the legacy save is dead but lingers in existing browsers,
    // and leaving it behind is the bug this panel used to have.
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9999] min-w-[320px] max-w-md rounded-lg border-2 border-red-400 bg-slate-800 text-sm shadow-lg">
      <button
        type="button"
        aria-label="Debug mode"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-slate-700 p-3 hover:bg-red-400 hover:text-white"
      >
        <span className="font-bold text-red-400">🔧 Debug Mode</span>
        <span className="text-xs opacity-70">{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 p-4">
          <div className="border-b border-slate-700 pb-3">
            <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Explore levels</h4>
            <div className="flex flex-col gap-1.5">
              {METHOD_ENUM.map((m) => (
                <MethodControl key={m} method={m} xp={state.exploreMethodXp[m] ?? 0} onSet={setLevel} />
              ))}
            </div>
          </div>

          <div className="border-b border-slate-700 pb-3">
            <h4 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Cash — 💰 {state.cash}</h4>
            <div className="flex flex-wrap gap-2">
              {[100, 1000, 10000].map((n) => (
                <button key={n} type="button" className={BTN}
                  onClick={() => dispatch({ type: DEBUG_ADD_CASH, payload: { amount: n } })}>
                  +{n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs uppercase tracking-wide text-red-400">Danger zone</h4>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={DANGER} onClick={() => dispatch({ type: DEBUG_RESET })}>
                Reset Rockhound
              </button>
              <button type="button" className={DANGER} onClick={clearEverything}>
                Clear all save data
              </button>
            </div>
          </div>

          <p className="pt-2 text-center text-xs text-slate-500">Ctrl+Shift+D to toggle</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Run the full suite**

Run: `./node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/shared/components/DebugPanel.jsx src/shared/components/DebugPanel.test.jsx src/features/rockhound/RockhoundContext.jsx src/features/rockhound/RockhoundContext.test.js
git commit -m "feat(debug): Rockhound-targeted debug panel with method level controls"
```

---

### Task 4: Sticky status footer

Replaces the Rockhound cash row. Its real job is making the four independent XP tracks visible at once — the absence of that is why "some locations have no deeper option" was baffling.

**Files:**
- Create: `src/features/rockhound/logic/footerView.js`
- Create: `src/features/rockhound/logic/footerView.test.js`
- Create: `src/features/rockhound/components/StatusFooter.jsx`
- Create: `src/features/rockhound/components/StatusFooter.test.jsx`
- Modify: `src/features/rockhound/components/Rockhound.jsx`

**Interfaces:**
- Consumes: `methodProgress` from `diveView.js`; `reachDepth`, `MAX_METHOD_LEVEL` from `dive.js`; `METHOD_ENUM`
- Produces: `methodTracks(exploreMethodXp) -> Array<{ method, level, xp, toNext, atCap, pct, reach, nextDepthAt }>`; `<StatusFooter cash roughCount identifiedCount stoneCount gemdexFound gemdexTotal exploreMethodXp />`

**Design decision — state the next *depth*, not the next level.** Four of eleven levels (1, 5, 7, 10) buy nothing, because reach steps every 2 levels and haul size every 3. "Next level" would sometimes promise a reward that does not exist. `nextDepthAt` is the next level that actually increases reach, or `null` at the cap.

- [ ] **Step 1: Write the failing derivation tests**

Create `src/features/rockhound/logic/footerView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { methodTracks } from './footerView.js';
import { xpThreshold, reachDepth, MAX_METHOD_LEVEL } from './dive.js';
import { METHOD_ENUM } from '../../../schemas/localities.js';

const zeroed = { panning: 0, hardrock: 0, geode: 0, surface: 0 };

describe('methodTracks', () => {
  it('reports every collection method, always, so an untouched track is visible', () => {
    // A track sitting at zero is exactly the thing a player needs to see:
    // it explains why a site offers no descent.
    expect(methodTracks(zeroed).map((t) => t.method)).toEqual(METHOD_ENUM);
  });

  it('derives level and reach from experience', () => {
    const t = methodTracks({ ...zeroed, geode: xpThreshold(6) }).find((x) => x.method === 'geode');
    expect(t.level).toBe(6);
    expect(t.reach).toBe(reachDepth(6));
  });

  it('names the next level that actually buys a depth, skipping the ones that buy nothing', () => {
    // Level 5 grants no reach over level 4; the next real depth is at 6.
    const t = methodTracks({ ...zeroed, panning: xpThreshold(4) }).find((x) => x.method === 'panning');
    expect(t.nextDepthAt).toBe(6);
  });

  it('promises no further depth at the cap', () => {
    const t = methodTracks({ ...zeroed, surface: xpThreshold(MAX_METHOD_LEVEL) }).find((x) => x.method === 'surface');
    expect(t.atCap).toBe(true);
    expect(t.nextDepthAt).toBe(null);
  });

  it('reports progress toward the next level as a 0-100 fraction', () => {
    const half = Math.round((xpThreshold(1) + xpThreshold(2)) / 2);
    const t = methodTracks({ ...zeroed, panning: half }).find((x) => x.method === 'panning');
    expect(t.pct).toBeGreaterThan(0);
    expect(t.pct).toBeLessThan(100);
  });

  it('treats a missing track as zero rather than crashing', () => {
    // Saves written before per-method experience existed carry no map.
    expect(methodTracks({})[0].level).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/footerView.test.js`
Expected: FAIL — `Failed to resolve import "./footerView.js"`.

- [ ] **Step 3: Implement the derivation**

Create `src/features/rockhound/logic/footerView.js`:

```js
import { METHOD_ENUM } from '../../../schemas/localities.js';
import { methodProgress } from './diveView.js';
import { reachDepth, xpThreshold, MAX_METHOD_LEVEL } from './dive.js';

// Presentation shape for the status footer. Every number is produced by
// dive.js / diveView.js — this module chooses what to show, never how to
// compute it.

/**
 * The next level that actually increases reach, or null at the cap. Reach
 * steps every other level, so the level immediately above the current one
 * frequently buys no depth at all; naming it would promise nothing.
 */
/** How far through the current level's xp span this player is, 0-100. */
function progressPct(level, xp) {
  const floor = xpThreshold(level);
  const ceil = xpThreshold(level + 1);
  if (ceil <= floor) return 100;
  return Math.round(((xp - floor) / (ceil - floor)) * 100);
}

function nextDepthLevel(level) {
  for (let l = level + 1; l <= MAX_METHOD_LEVEL; l++) {
    if (reachDepth(l) > reachDepth(level)) return l;
  }
  return null;
}

export function methodTracks(exploreMethodXp = {}) {
  return METHOD_ENUM.map((method) => {
    const xp = exploreMethodXp[method] ?? 0;
    const p = methodProgress(xp);
    return {
      method,
      level: p.level,
      xp,
      toNext: p.toNext,
      atCap: p.atCap,
      // Progress across the CURRENT level's span, not from zero: at level 4
      // (400xp) heading for level 5 (600xp), 500xp must read 50%, not 83%.
      pct: p.atCap ? 100 : progressPct(p.level, xp),
      reach: reachDepth(p.level),
      nextDepthAt: nextDepthLevel(p.level)
    };
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/footerView.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Write the failing component test**

Create `src/features/rockhound/components/StatusFooter.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusFooter from './StatusFooter.jsx';
import { xpThreshold } from '../logic/dive.js';

const props = {
  cash: 1234,
  roughCount: 3,
  identifiedCount: 2,
  stoneCount: 1,
  gemdexFound: 7,
  gemdexTotal: 21,
  exploreMethodXp: { panning: xpThreshold(4), hardrock: 0, geode: 0, surface: 0 }
};

describe('StatusFooter', () => {
  it('shows the money the Market actually spends', () => {
    render(<StatusFooter {...props} />);
    expect(screen.getByLabelText(/cash/i).textContent).toMatch(/1,234/);
  });

  it('shows all four tracks at once, including the untouched ones', () => {
    render(<StatusFooter {...props} />);
    for (const m of ['panning', 'hardrock', 'geode', 'surface']) {
      screen.getByLabelText(new RegExp(`${m} level`, 'i'));
    }
  });

  it('says what depth a track currently reaches', () => {
    render(<StatusFooter {...props} />);
    // panning at level 4 reaches depth 3; a fresh track reaches 1.
    expect(screen.getByLabelText(/panning level/i).textContent).toMatch(/3/);
    expect(screen.getByLabelText(/geode level/i).textContent).toMatch(/1/);
  });

  it('shows what is on the bench and in the Gemdex', () => {
    render(<StatusFooter {...props} />);
    expect(screen.getByLabelText(/bench/i).textContent).toMatch(/3/);
    expect(screen.getByLabelText(/gemdex/i).textContent).toMatch(/7/);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/StatusFooter.test.jsx`
Expected: FAIL — cannot resolve `./StatusFooter.jsx`.

- [ ] **Step 7: Implement the footer**

Create `src/features/rockhound/components/StatusFooter.jsx`:

```jsx
import { methodTracks } from '../logic/footerView.js';

const METHOD_ICON = { panning: '🥣', hardrock: '⛏️', geode: '🥚', surface: '🔎' };

function Track({ track }) {
  const label = `${track.method} level ${track.level}, reaches depth ${track.reach}` +
    (track.atCap ? ', mastered' : `, ${track.toNext} xp to level ${track.level + 1}`);
  return (
    <div aria-label={label} className="flex min-w-[104px] flex-col gap-0.5">
      <span className="flex items-baseline gap-1 text-xs">
        <span aria-hidden="true">{METHOD_ICON[track.method]}</span>
        <span className="capitalize text-slate-300">{track.method}</span>
        <span className="ml-auto font-mono text-slate-400">
          L{track.level} · d{track.reach}
        </span>
      </span>
      <span className="h-1 overflow-hidden rounded bg-slate-700">
        <span className="block h-full bg-yellow-400" style={{ width: `${track.pct}%` }} />
      </span>
    </div>
  );
}

export default function StatusFooter({
  cash, roughCount, identifiedCount, stoneCount, gemdexFound, gemdexTotal, exploreMethodXp
}) {
  const tracks = methodTracks(exploreMethodXp);
  return (
    <footer className="sticky bottom-0 z-40 border-t border-slate-700 bg-slate-800/95 px-4 py-2 backdrop-blur md:px-6">
      <div className="container mx-auto flex max-w-[1536px] flex-wrap items-center gap-x-6 gap-y-2">
        <span aria-label={`Cash ${cash}`} className="font-bold text-yellow-400">
          💰 {cash.toLocaleString()}
        </span>

        <span aria-label={`Bench: ${roughCount} rough, ${identifiedCount} identified, ${stoneCount} cut`}
              className="text-xs text-slate-400">
          🪨 {roughCount} · 🔍 {identifiedCount} · 💎 {stoneCount}
        </span>

        <span aria-label={`Gemdex ${gemdexFound} of ${gemdexTotal}`} className="text-xs text-slate-400">
          📖 {gemdexFound}/{gemdexTotal}
        </span>

        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-2">
          {tracks.map((t) => <Track key={t.method} track={t} />)}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: Mount it and remove the cash row**

In `src/features/rockhound/components/Rockhound.jsx`:

- Delete the line rendering `<div className="flex justify-end text-lg font-bold text-yellow-400">💰 {state.cash}</div>` (around line 45).
- Import `StatusFooter` and render it as the last child of the outer wrapper, after the tab content:

```jsx
      <StatusFooter
        cash={state.cash}
        roughCount={state.rough.length}
        identifiedCount={state.identified.length}
        stoneCount={state.stones.length}
        gemdexFound={state.gemdex.length}
        gemdexTotal={species.length}
        exploreMethodXp={state.exploreMethodXp}
      />
```

`species` is already imported in that file.

- [ ] **Step 9: Run the full suite and build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. If a `Rockhound.test.jsx` case asserted on the old cash row, update it to read the footer's `Cash` label rather than deleting the assertion.

Run: `./node_modules/.bin/vite build`
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add src/features/rockhound/logic/footerView.js src/features/rockhound/logic/footerView.test.js src/features/rockhound/components/StatusFooter.jsx src/features/rockhound/components/StatusFooter.test.jsx src/features/rockhound/components/Rockhound.jsx
git commit -m "feat(rockhound): sticky status footer showing cash, bench and all four tracks"
```

---

### Task 5: Locality cards — promote method, move deposit type, rarity rings

`grep` establishes that `depositType` appears in display strings only, with zero runtime use, while `method` decides the form pool, the XP track and the work verb. They are currently rendered identically, in the same dim grey.

**Files:**
- Create: `src/features/rockhound/logic/rarity.js`
- Create: `src/features/rockhound/logic/rarity.test.js`
- Modify: `src/features/rockhound/components/LocalityCard.jsx`
- Modify: `src/features/rockhound/components/LocalityMap.jsx`
- Modify: `src/features/rockhound/components/LocalityEntry.jsx`
- Modify: `src/features/rockhound/logic/localityView.js`
- Test: `src/features/rockhound/components/LocalityMap.test.jsx`, `LocalityEntry.test.jsx`

**Interfaces:**
- Consumes: `RARITY_ENUM` from `schemas/species.js` (Task 1)
- Produces: `rarityColor(rarity) -> string`; `findPoolView` entries gain `rarity: string | null`; `<LocalityCard>` gains a `methodLevel` prop

**Spoiler rule:** rings appear only on species the player has discovered. `findPoolView` already withholds the name of an undiscovered species; it must withhold the rarity for the same reason. An undiscovered slot keeps the neutral `❔`.

**Channel rule:** background tint means *gem colour* everywhere else in the app (`GemGlyph` uses `art.tint`). Rarity therefore uses the **ring/border**, never the background, so the two never contradict each other.

- [ ] **Step 1: Write the failing rarity tests**

Create `src/features/rockhound/logic/rarity.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { rarityColor } from './rarity.js';
import { RARITY_ENUM } from '../../../schemas/species.js';

describe('rarityColor', () => {
  it('gives every tier its own colour', () => {
    const colors = RARITY_ENUM.map(rarityColor);
    expect(new Set(colors).size).toBe(RARITY_ENUM.length);
  });

  it('returns a hex colour for every tier', () => {
    for (const r of RARITY_ENUM) {
      expect(rarityColor(r), r).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('falls back to a neutral colour for an unknown or withheld rarity', () => {
    // Undiscovered species deliberately carry no rarity.
    expect(rarityColor(null)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(rarityColor('Mythic')).toBe(rarityColor(null));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/rarity.test.js`
Expected: FAIL — cannot resolve `./rarity.js`.

- [ ] **Step 3: Implement rarity colours**

Create `src/features/rockhound/logic/rarity.js`. The palette is carried over from the deleted `constants.js` `GEM_TIERS`, so the game keeps the colours it already used:

```js
// Rarity is shown as a ring, never as a fill: background tint already means
// the gem's own colour everywhere else (see GemGlyph). Two meanings on one
// channel would contradict each other.
const RARITY_COLORS = {
  Common: '#A0A0A0',
  Uncommon: '#4CAF50',
  Rare: '#2196F3',
  Epic: '#9C27B0',
  Legendary: '#FF9800'
};

/** Neutral ring for an unknown tier, and for species not yet discovered. */
const UNKNOWN_COLOR = '#475569';

export function rarityColor(rarity) {
  return RARITY_COLORS[rarity] ?? UNKNOWN_COLOR;
}
```

- [ ] **Step 4: Expose rarity through the find-pool view**

In `src/features/rockhound/logic/localityView.js`, inside `findPoolView`'s `.map`, add a `rarity` field beside the existing `name`, honouring the same spoiler rule:

```js
        rarity: discovered ? (speciesById[e.species]?.rarity ?? null) : null,
```

- [ ] **Step 5: Write the failing card tests**

Append to `src/features/rockhound/components/LocalityMap.test.jsx`:

```jsx
describe('locality card information design', () => {
  it('shows the collection method and its level, since that decides the xp track', () => {
    renderMap({ gemdex: [], exploreMethodXp: { panning: 0, hardrock: 0, geode: 0, surface: 0 } });
    // Hidden Creek is panning-worked. Level 0 explains why it offers no descent.
    const card = screen.getByRole('button', { name: /^Hidden Creek/ }).closest('li');
    expect(card.textContent).toMatch(/panning/i);
  });

  it('does not clutter the card with the deposit type', () => {
    renderMap({ gemdex: [] });
    const card = screen.getByRole('button', { name: /^Hidden Creek/ }).closest('li');
    // Deposit type is teaching payload with no mechanical effect — it belongs
    // in the field guide, where someone is reading rather than scanning.
    expect(card.textContent).not.toMatch(/alluvial/i);
  });

  it('drops the vague rarity ceiling', () => {
    renderMap({ gemdex: [] });
    expect(screen.queryByText(/up to Epic/i)).toBeNull();
  });

  it('rings a discovered species with its rarity colour, and withholds it otherwise', () => {
    renderMap({ gemdex: ['sapphire'] });
    const card = screen.getByRole('button', { name: /^Hidden Creek/ }).closest('li');
    const slots = card.querySelectorAll('[data-rarity]');
    const known = [...slots].filter((s) => s.getAttribute('data-rarity') !== 'unknown');
    expect(known).toHaveLength(1);
    expect(known[0].getAttribute('data-rarity')).toBe('Epic');
  });

  it('opens the field guide from a labelled icon button, not a bare emoji', () => {
    renderMap({ gemdex: [] });
    const info = screen.getByRole('button', { name: /Hidden Creek field guide/i });
    expect(info.textContent).not.toMatch(/ℹ/);
    expect(info.querySelector('svg')).not.toBe(null);
  });
});
```

Adapt `renderMap` to the helper already in that file; if it does not accept `exploreMethodXp`, extend it. Sapphire's rarity is `Epic` (`species.yaml:151`) — verified, but re-check if you change the fixture species.

- [ ] **Step 6: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityMap.test.jsx`
Expected: FAIL — the card still renders `alluvial`, `up to Epic`, and a bare `ℹ️`.

- [ ] **Step 7: Rebuild the card**

In `src/features/rockhound/components/LocalityCard.jsx`:

Add imports:

```jsx
import { FaInfoCircle } from 'react-icons/fa';
import { rarityColor } from '../logic/rarity.js';
```

Replace the deposit-type line with a method line carrying the level:

```jsx
        <span className="mt-0.5 block text-xs text-slate-400">
          <span className="capitalize">{locality.method}</span>
          {methodLevel != null && <span className="text-slate-500"> · level {methodLevel}</span>}
        </span>
```

Replace the preview row — ring for rarity, no ceiling text:

```jsx
        <span className="mt-1 flex items-center gap-1">
          {pool.map((entry) => (
            <span
              key={entry.speciesId}
              data-rarity={entry.rarity ?? 'unknown'}
              className="flex h-6 w-6 items-center justify-center rounded border-2 text-sm"
              style={{ borderColor: rarityColor(entry.rarity) }}
              aria-hidden="true"
            >
              {entry.discovered ? gemArt(entry.speciesId).glyph : '❔'}
            </span>
          ))}
        </span>
```

Accept `methodLevel` in the props destructuring, and drop `ceiling` if nothing else uses it. Update the select button's `aria-label` to drop `up to ${ceiling}` and use the method instead:

```jsx
        aria-label={`${locality.name}, ${locality.method}, ${progress.found} of ${progress.total} found`}
```

Replace the info button's `ℹ️` with the icon, keeping the button a **sibling** of the select button — never nested, which is invalid HTML:

```jsx
        <FaInfoCircle aria-hidden="true" />
```

and give that button hover feedback:

```jsx
        className="absolute right-2 top-2 rounded p-1 text-slate-500 transition-colors hover:text-yellow-400"
```

- [ ] **Step 8: Pass the level down and move deposit type into the guide**

In `LocalityMap.jsx`, accept an `exploreMethodXp` prop and pass each card its level:

```jsx
import { levelForXp } from '../logic/dive.js';
```

```jsx
              methodLevel={levelForXp(exploreMethodXp?.[loc.method] ?? 0)}
```

Drop the `ceiling` prop and the now-unused `rarityCeiling` import if nothing else needs them.

In `Rockhound.jsx`, pass `exploreMethodXp={state.exploreMethodXp}` to `<LocalityMap>`.

In `LocalityEntry.jsx`, the header already shows `{locality.depositType} · {locality.method}` — keep it, and add a `Row` inside the "Access" section explaining the deposit type's significance:

```jsx
        <Row label="Deposit"><span className="capitalize">{locality.depositType}</span></Row>
```

- [ ] **Step 9: Run the full suite and build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. `LocalityCard`'s aria-label changed, so fix any test that matched the old `up to …` wording by matching the new label — do not weaken an assertion to `/Hidden Creek/`, which also matches the field-guide button.

Run: `./node_modules/.bin/vite build`
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add src/features/rockhound/logic/rarity.js src/features/rockhound/logic/rarity.test.js src/features/rockhound/logic/localityView.js src/features/rockhound/components/LocalityCard.jsx src/features/rockhound/components/LocalityMap.jsx src/features/rockhound/components/LocalityEntry.jsx src/features/rockhound/components/LocalityMap.test.jsx src/features/rockhound/components/Rockhound.jsx
git commit -m "feat(explore): promote method and level on cards, rarity rings, icon button"
```

---

### Task 6: Split the map from the run

Today the map and the run render together, so a locality can be selected mid-run: the run keeps digging its captured locality while the header names another. The state is correct and the screen lies about it.

**Files:**
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Explore.jsx`
- Test: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: everything from Tasks 4–5
- Produces: Explore renders either the map or the run screen, never both; `<Explore>` gains an `onLeave` prop

- [ ] **Step 1: Write the failing tests**

Append to `src/features/rockhound/components/Rockhound.test.jsx`:

```jsx
describe('Explore map and run are separate screens', () => {
  it('starts on the map with no run in progress', () => {
    render(<App />);
    screen.getByRole('button', { name: /^Hidden Creek/ });
    expect(screen.queryByRole('button', { name: /work the gravel/i })).toBeNull();
  });

  it('opens the run screen when a locality is chosen, hiding the map', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek/ }));
    screen.getByRole('button', { name: /work the gravel/i });
    // The map must be gone: switching localities mid-run made the header
    // disagree with the locality actually being dug.
    expect(screen.queryByRole('button', { name: /^Gravel Bar/ })).toBeNull();
  });

  it('returns to the map from the run screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek/ }));
    fireEvent.click(screen.getByRole('button', { name: /back to the map/i }));
    screen.getByRole('button', { name: /^Gravel Bar/ });
  });

  it('still banks a haul onto the bench from the run screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek/ }));
    fireEvent.click(screen.getByRole('button', { name: /work the gravel/i }));
    fireEvent.click(screen.getByRole('button', { name: /bank this haul/i }));
    expect(screen.getByLabelText(/bench/i).textContent).toMatch(/1/);
  });
});
```

The suite renders `<App />`, which now mounts the provider — add `beforeEach(() => localStorage.clear())` to this describe block if the file does not already clear between tests.

- [ ] **Step 2: Run to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/Rockhound.test.jsx`
Expected: FAIL — the map and Explore render together, so "Work the gravel" is present from the start.

- [ ] **Step 3: Route between the two screens**

In `Rockhound.jsx`, replace the Explore tab block. The existing `selectedLocalityId` becomes the *routing* state: `null` means the map is showing.

```jsx
      {tab === 'Explore' && (
        exploringId ? (
          <Explore
            locality={selectedLocality}
            methodXp={state.exploreMethodXp[selectedLocality.method] ?? 0}
            setComplete={completedLocalities.includes(selectedLocality.id)}
            roughCount={state.rough.length}
            onBank={(payload) => dispatch({ type: COLLECT_HAUL, payload })}
            onLeave={() => setExploringId(null)}
          />
        ) : (
          <LocalityMap
            localities={localities}
            unlockedIds={unlockedIds}
            selectedId={null}
            onSelect={setExploringId}
            speciesById={speciesById}
            gemdex={state.gemdex}
            exploreMethodXp={state.exploreMethodXp}
          />
        )
      )}
```

Rename the state to match its new job:

```jsx
  const [exploringId, setExploringId] = useState(null);
  const selectedLocality = localitiesById[exploringId] ?? localitiesById.hidden_creek;
```

- [ ] **Step 4: Give the run screen a way back, and show the field guide there**

In `Explore.jsx`, accept `onLeave` and render a back control above the header:

```jsx
      <button
        type="button"
        onClick={onLeave}
        className="self-start text-sm text-slate-400 transition-colors hover:text-yellow-400"
      >
        ← Back to the map
      </button>
```

Guard it so a run in progress is not abandoned by accident — if `run` is non-null and not yet banked, the control still works but reads differently:

```jsx
        {run ? '← Leave run (haul is lost)' : '← Back to the map'}
```

Keep the accessible name matching `/back to the map/i` when no run is in progress; the test above depends on it.

- [ ] **Step 5: Run the full suite and build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS. Earlier `Rockhound.test.jsx` cases drove Explore directly from the tab; they now need the locality click first. Update them rather than deleting them.

Run: `./node_modules/.bin/vite build`
Expected: green.

- [ ] **Step 6: Verify by hand in a browser**

Run `./node_modules/.bin/vite` and check:

1. Explore opens on the map. No run controls are present.
2. Each card shows its method and level; a fresh save shows every track at level 0.
3. Cards show no deposit type and no "up to …"; the info button is an icon that lightens on hover.
4. With one species discovered, exactly one slot carries a coloured ring; the rest stay neutral.
5. Clicking a locality opens the run screen; the map is gone; "Back to the map" returns.
6. `Ctrl+Shift+D` opens the debug panel. Setting geode to level 6 updates the footer immediately, and Amethyst Vug then offers a descent.
7. "Clear all save data" empties both keys and reloads to a fresh state.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components/Rockhound.jsx src/features/rockhound/components/Explore.jsx src/features/rockhound/components/Rockhound.test.jsx
git commit -m "feat(explore): separate the locality map from the run screen"
```

---

## Deferred, with reasons

| Item | Why |
| --- | --- |
| The depth XP curve | Tasks 3–4 make the curve visible and adjustable. Retune from felt experience once you can jump to level 6 and dig depth 4 — the concrete trigger is playing a depth-4 run and judging whether ~30 runs of build-up feels earned. |
| The four dead levels (1, 5, 7, 10) | Real defect, but it is a curve change and belongs with the retune. `footerView.nextDepthAt` already stops the UI from promising a reward those levels do not deliver. |
| Idle simulation buttons | Nothing exists to simulate. A clock offset is the right control, and it should be built with the idle rules in slice 2 rather than guessed at now. |
| `damping`, `findPoolView(depth)` | Threaded but unused, per the Dive plan's closing notes. |
