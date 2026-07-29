# Explore Locality Information Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the locality data the Explore screen already owns but never shows — how each locality was (or will be) unlocked, what can be mined there, indicator minerals, set progress, and which locality a completed set opens — via compact informative cards plus an on-demand field-guide modal.

**Architecture:** One new pure logic module (`localityView.js`) derives everything the views need from `localities.yaml` + the player's gemdex. A shared `EntryModal` + `Section`/`Row` primitives are extracted from the existing `GemdexEntry` so the new `LocalityEntry` reuses the dialog shell rather than duplicating it — this also fixes the focus-trap/focus-restore debt deferred from the Gemdex revamp, in one place for both modals. `LocalityMap` becomes a grid of `LocalityCard`s that keeps click-to-select for panning and adds a separate info button for depth.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Vitest + React Testing Library (jsdom).

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **No changes** to `src/data/*.yaml`, `src/schemas/*`, or the `RockhoundContext.jsx` reducer/state shape. This is a read-only view over existing data and state.
- `@testing-library/jest-dom` is **NOT installed**. Use native Vitest matchers only (`toBe`, `toBeTruthy`, `toBeNull`, `toMatch`, `toEqual`, `toHaveLength`) and raw DOM reads such as `el.getAttribute(...)`. Never use `toHaveAttribute`/`toBeInTheDocument`.
- All new components are **presentational**: game data arrives as props, matching the convention of the existing `src/features/rockhound/components/`. Pure logic modules under `logic/` may be imported directly.
- **Spoiler rule (binding):** a species in a find pool is named only if its id is in the player's gemdex. Undiscovered species render as `❔ ???` with a softened frequency word. The pool's rarity ceiling ("up to Legendary") may always be shown.
- **Nested buttons are invalid HTML.** A card's select button and its info button must be siblings, never nested. Hint/requirement text must sit outside the select button so it does not leak into that button's accessible name (this exact bug was fixed once already in `LocalityMap`).
- Tailwind utility classes only, dark palette consistent with existing components (`bg-slate-800`, `border-slate-700`, `text-yellow-400` accents).
- Out of scope (YAGNI): the panning minigame itself, changes to `rollRough`, per-species carat/clarity/color range display, map imagery/geography.

---

### Task 1: Locality view derivations (`localityView.js`)

Pure functions the cards and the modal both need.

**Files:**
- Create: `src/features/rockhound/logic/localityView.js`
- Test: `src/features/rockhound/logic/localityView.test.js`

**Interfaces:**
- Consumes: `localities` array shape from `src/loaders/localities.js` (each `{ id, name, region, depositType, method, hostRock, indicatorMinerals, color, unlockGate, findPool: [{ species, weight, ... }] }`), `speciesById` map, `RARITY_ENUM` from `src/schemas/items.js`.
- Produces:
  - `findPoolView(locality, speciesById, gemdex) -> [{ speciesId, name, discovered, frequency }]` — `name` is the species name when discovered, else `null`; `frequency` is `'common here' | 'uncommon here' | 'rare here'`; ordered by descending weight.
  - `rarityCeiling(locality, speciesById) -> string` — highest `RARITY_ENUM` rarity in the pool.
  - `localitySetProgress(locality, gemdex) -> { found, total, complete }`
  - `localitiesGatedBy(localities, localityId) -> [locality]` — localities whose `unlockGate` requires this locality's set (searched recursively through `allOf`/`anyOf`).
  - `titleizeWords(value) -> string` — `'north_america'` → `'North America'`.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/localityView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  findPoolView, rarityCeiling, localitySetProgress, localitiesGatedBy, titleizeWords
} from './localityView.js';

const SPECIES_BY_ID = {
  quartz: { id: 'quartz', name: 'Clear Quartz', rarity: 'Common' },
  sapphire: { id: 'sapphire', name: 'Sapphire', rarity: 'Epic' },
  topaz: { id: 'topaz', name: 'Topaz', rarity: 'Rare' }
};

const CREEK = {
  id: 'creek',
  findPool: [
    { species: 'quartz', weight: 50 },
    { species: 'sapphire', weight: 20 },
    { species: 'topaz', weight: 5 }
  ]
};

describe('findPoolView', () => {
  it('names discovered species and silhouettes undiscovered ones', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, ['quartz']);
    expect(view[0]).toMatchObject({ speciesId: 'quartz', name: 'Clear Quartz', discovered: true });
    expect(view[1]).toMatchObject({ speciesId: 'sapphire', name: null, discovered: false });
  });

  it('orders the pool by descending weight', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    expect(view.map((e) => e.speciesId)).toEqual(['quartz', 'sapphire', 'topaz']);
  });

  it('describes frequency in words rather than raw weights', () => {
    const view = findPoolView(CREEK, SPECIES_BY_ID, []);
    // 50/75 = 0.67 -> common; 20/75 = 0.27 -> uncommon; 5/75 = 0.07 -> rare
    expect(view.map((e) => e.frequency)).toEqual(['common here', 'uncommon here', 'rare here']);
    view.forEach((e) => expect(e.weight).toBeUndefined());
  });
});

describe('rarityCeiling', () => {
  it('reports the highest rarity in the pool', () => {
    expect(rarityCeiling(CREEK, SPECIES_BY_ID)).toBe('Epic');
  });

  it('ignores species missing from the roster', () => {
    const pool = { findPool: [{ species: 'quartz', weight: 1 }, { species: 'ghost', weight: 1 }] };
    expect(rarityCeiling(pool, SPECIES_BY_ID)).toBe('Common');
  });
});

describe('localitySetProgress', () => {
  it('counts discovered pool species', () => {
    expect(localitySetProgress(CREEK, ['quartz', 'topaz'])).toEqual({ found: 2, total: 3, complete: false });
  });

  it('flags a complete set', () => {
    expect(localitySetProgress(CREEK, ['quartz', 'sapphire', 'topaz'])).toEqual({ found: 3, total: 3, complete: true });
  });

  it('ignores gemdex ids outside the pool', () => {
    expect(localitySetProgress(CREEK, ['diamond'])).toEqual({ found: 0, total: 3, complete: false });
  });
});

describe('localitiesGatedBy', () => {
  const LOCALITIES = [
    { id: 'creek', unlockGate: {} },
    { id: 'vug', unlockGate: { allOf: [{ type: 'setComplete', setType: 'locality', id: 'creek' }] } },
    { id: 'quarry', unlockGate: { anyOf: [{ type: 'reputation', tier: 2 }, { type: 'gear', id: 'rock_hammer' }] } },
    {
      id: 'pipe',
      unlockGate: {
        allOf: [
          { type: 'reputation', tier: 4 },
          { anyOf: [{ type: 'setComplete', setType: 'locality', id: 'creek' }] }
        ]
      }
    },
    { id: 'other', unlockGate: { allOf: [{ type: 'setComplete', setType: 'family', id: 'creek' }] } }
  ];

  it('finds localities whose gate needs this locality set, including nested gates', () => {
    expect(localitiesGatedBy(LOCALITIES, 'creek').map((l) => l.id)).toEqual(['vug', 'pipe']);
  });

  it('does not confuse a family set with a locality set of the same id', () => {
    expect(localitiesGatedBy(LOCALITIES, 'creek').map((l) => l.id)).not.toContain('other');
  });

  it('returns an empty list when nothing depends on it', () => {
    expect(localitiesGatedBy(LOCALITIES, 'quarry')).toEqual([]);
  });
});

describe('titleizeWords', () => {
  it('turns snake_case into title case', () => {
    expect(titleizeWords('north_america')).toBe('North America');
    expect(titleizeWords('pyrope_garnet')).toBe('Pyrope Garnet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/localityView.test.js`
Expected: FAIL — cannot resolve `./localityView.js`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/logic/localityView.js`:

```js
import { RARITY_ENUM } from '../../../schemas/items.js';

// Read-only derivations for the Explore views. Find-pool weights are the
// authoring knob; players see words, never the raw numbers, so tuning weights
// never turns into a UI change.

const FREQUENCY_BANDS = [
  { minShare: 0.35, label: 'common here' },
  { minShare: 0.15, label: 'uncommon here' }
];
const RAREST_LABEL = 'rare here';

function frequencyFor(weight, totalWeight) {
  if (totalWeight <= 0) return RAREST_LABEL;
  const share = weight / totalWeight;
  return FREQUENCY_BANDS.find((b) => share >= b.minShare)?.label ?? RAREST_LABEL;
}

/**
 * The find pool as the player may see it: discovered species are named,
 * undiscovered ones are withheld (spoiler rule). Ordered richest first.
 * Raw weights are deliberately not returned.
 */
export function findPoolView(locality, speciesById, gemdex) {
  const found = new Set(gemdex);
  const total = locality.findPool.reduce((sum, e) => sum + e.weight, 0);
  return [...locality.findPool]
    .sort((a, b) => b.weight - a.weight)
    .map((e) => {
      const discovered = found.has(e.species);
      return {
        speciesId: e.species,
        name: discovered ? (speciesById[e.species]?.name ?? null) : null,
        discovered,
        frequency: frequencyFor(e.weight, total)
      };
    });
}

/** Highest rarity present in the pool — safe to show even for locked ground. */
export function rarityCeiling(locality, speciesById) {
  let best = 0;
  locality.findPool.forEach((e) => {
    const rarity = speciesById[e.species]?.rarity;
    const rank = RARITY_ENUM.indexOf(rarity);
    if (rank > best) best = rank;
  });
  return RARITY_ENUM[best];
}

/** How much of this locality's set the player has found. */
export function localitySetProgress(locality, gemdex) {
  const found = new Set(gemdex);
  const ids = locality.findPool.map((e) => e.species);
  const discovered = ids.filter((id) => found.has(id)).length;
  return { found: discovered, total: ids.length, complete: discovered === ids.length };
}

function gateNeedsLocalitySet(gate, localityId) {
  const nodes = [...(gate.allOf ?? []), ...(gate.anyOf ?? [])];
  return nodes.some((node) =>
    'type' in node
      ? node.type === 'setComplete' && node.setType === 'locality' && node.id === localityId
      : gateNeedsLocalitySet(node, localityId)
  );
}

/**
 * Localities that this locality's completed set unlocks. Makes the otherwise
 * invisible set-completion dependency legible on the card.
 */
export function localitiesGatedBy(localities, localityId) {
  return localities.filter((l) => gateNeedsLocalitySet(l.unlockGate, localityId));
}

/** 'north_america' -> 'North America' */
export function titleizeWords(value) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/localityView.test.js`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/localityView.js src/features/rockhound/logic/localityView.test.js
git commit -m "feat(explore): locality view derivations (find pool, rarity ceiling, set gates)"
```

---

### Task 2: Shared entry-modal shell, and refactor `GemdexEntry` onto it

Both modals need the same dialog shell. Extract it once — and fix the focus-trap / focus-restore gap deferred from the Gemdex revamp here, so both modals get it.

**Files:**
- Create: `src/features/rockhound/components/EntryModal.jsx`
- Create: `src/features/rockhound/components/EntryModal.test.jsx`
- Modify: `src/features/rockhound/components/GemdexEntry.jsx`
- Modify: `src/features/rockhound/components/GemdexEntry.test.jsx`

**Interfaces:**
- Produces:
  - `EntryModal({ titleId, onClose, children })` — default export. Renders the backdrop (click closes), the `role="dialog" aria-modal="true" aria-labelledby={titleId}` container, and a `✕` button labelled `Close entry`. Moves focus to the close button on open, **restores focus to the previously focused element on close**, closes on Escape, and **keeps Tab focus inside the dialog**.
  - Named exports `Section({ title, children })` and `Row({ label, children })` — the layout primitives currently defined inside `GemdexEntry.jsx`, moved verbatim so both modals share one visual language.
- Consumes: nothing.
- After this task, `GemdexEntry` must render exactly the same output as before, sourcing its shell and `Section`/`Row` from `EntryModal.jsx` instead of defining them locally. Its existing 15 tests must still pass **unchanged**.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/components/EntryModal.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntryModal, { Section, Row } from './EntryModal.jsx';

function renderModal(overrides = {}) {
  const props = { titleId: 'test-title', onClose: vi.fn(), ...overrides };
  render(
    <EntryModal {...props}>
      <h3 id="test-title">A Title</h3>
      <Section title="Details">
        <Row label="Hardness">9</Row>
      </Section>
      <button type="button">inner action</button>
    </EntryModal>
  );
  return props;
}

describe('EntryModal', () => {
  it('renders a labelled modal dialog', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('test-title');
  });

  it('renders its children, including Section and Row content', () => {
    renderModal();
    screen.getByText('Details');
    screen.getByText('Hardness');
    screen.getByText('9');
  });

  it('closes on the close button, Escape, and the backdrop', () => {
    const a = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(a.onClose).toHaveBeenCalled();

    const b = renderModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(b.onClose).toHaveBeenCalled();

    const c = renderModal();
    fireEvent.click(screen.getByRole('dialog').parentElement);
    expect(c.onClose).toHaveBeenCalled();
  });

  it('does not close when the dialog body is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('moves focus to the close button on open', () => {
    renderModal();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close entry');
  });

  it('restores focus to the opener when it closes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { unmount } = render(
      <EntryModal titleId="t" onClose={() => {}}>
        <h3 id="t">Entry</h3>
      </EntryModal>
    );
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('keeps Tab focus inside the dialog', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    const inner = screen.getByRole('button', { name: /inner action/i });
    inner.focus();
    // Tab from the last focusable element wraps to the first
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    // Shift+Tab from the first wraps to the last, still inside
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/EntryModal.test.jsx`
Expected: FAIL — cannot resolve `./EntryModal.jsx`.

- [ ] **Step 3: Write `EntryModal.jsx`**

Create `src/features/rockhound/components/EntryModal.jsx`:

```jsx
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Shared layout primitives so every entry modal reads the same. */
export function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 text-right">{children}</span>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="border-t border-slate-700 px-5 py-3">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">{title}</h4>
      {children}
    </section>
  );
}

/**
 * The dialog shell every entry modal shares: backdrop dismissal, Escape,
 * a labelled dialog, focus moved in on open and returned to the opener on
 * close, and Tab kept inside while open.
 */
export default function EntryModal({ titleId, onClose, children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      // Return focus where the player left it rather than dumping it on <body>.
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
    // onClose is intentionally the only dependency; re-running on every parent
    // render would re-steal focus mid-read.
  }, [onClose]);

  const trapTab = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close entry"
          onClick={onClose}
          className="float-right px-3 pt-3 text-xl leading-none text-slate-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the new test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/EntryModal.test.jsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Refactor `GemdexEntry.jsx` onto the shared shell**

In `src/features/rockhound/components/GemdexEntry.jsx`:

1. Replace the React import and add the shared imports:

```jsx
import EntryModal, { Section, Row } from './EntryModal.jsx';
import { gemArt, colorHex } from '../logic/gemArt.js';
import { localitiesForSpecies } from '../logic/gemdexView.js';
```

(`useEffect`/`useRef` are no longer needed — remove that import line entirely.)

2. Delete the local `Row` and `Section` function definitions, the `closeRef`, and the whole `useEffect` that handled Escape/focus — `EntryModal` owns all of it now.

3. Replace the outer two `<div>`s (the backdrop and the `role="dialog"` container) and the standalone `✕` button with `EntryModal`. The component's return becomes:

```jsx
  return (
    <EntryModal titleId="gemdex-entry-title" onClose={onClose}>
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        ... existing header content, minus the ✕ button ...
      </div>
      ... all existing sections unchanged ...
    </EntryModal>
  );
```

Keep every existing child element, class name and string byte-for-byte — only the shell changes. The header's `<h3 id="gemdex-entry-title">` must keep that exact id so `EntryModal`'s `aria-labelledby` still resolves.

- [ ] **Step 6: Verify the Gemdex entry still behaves identically**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexEntry.test.jsx src/features/rockhound/components/GemdexV5.test.jsx`
Expected: PASS — all 15 GemdexEntry tests and all 10 GemdexV5 tests, **with no edits to `GemdexEntry.test.jsx` assertions**. If any assertion needs changing, the refactor changed behavior — fix the component, not the test.

- [ ] **Step 7: Commit**

```bash
git add src/features/rockhound/components/EntryModal.jsx src/features/rockhound/components/EntryModal.test.jsx src/features/rockhound/components/GemdexEntry.jsx
git commit -m "refactor(rockhound): shared EntryModal shell with focus trap and focus restore"
```

---

### Task 3: The locality field guide (`LocalityEntry.jsx`)

The depth view: geology, access, indicator minerals, spoiler-aware find pool, set progress, and what completing the set opens.

**Files:**
- Create: `src/features/rockhound/components/LocalityEntry.jsx`
- Test: `src/features/rockhound/components/LocalityEntry.test.jsx`

**Interfaces:**
- Consumes: `EntryModal`, `Section`, `Row` (Task 2); `findPoolView`, `rarityCeiling`, `localitySetProgress`, `localitiesGatedBy`, `titleizeWords` (Task 1); `gemArt` from `../logic/gemArt.js`; `describeGate` from `../logic/progression.js`.
- Produces: default export `LocalityEntry({ locality, localities, speciesById, gemdex, unlocked, onClose })`
  - `unlocked` — boolean; drives whether access reads as satisfied (`✓`) or pending (`🔒`).
  - `onClose` — passed through to `EntryModal`.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/components/LocalityEntry.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityEntry from './LocalityEntry.jsx';

const SPECIES_BY_ID = {
  spinel: { id: 'spinel', name: 'Spinel', rarity: 'Rare' },
  ruby: { id: 'ruby', name: 'Ruby', rarity: 'Epic' },
  tanzanite: { id: 'tanzanite', name: 'Tanzanite', rarity: 'Epic' }
};

const MOGOK = {
  id: 'mogok_marble',
  name: 'Mogok Marble',
  region: 'myanmar',
  depositType: 'metamorphic',
  method: 'hardrock',
  hostRock: 'marble',
  indicatorMinerals: ['spinel', 'pyrope_garnet'],
  color: '#b23a48',
  unlockGate: { allOf: [{ type: 'reputation', tier: 3 }] },
  findPool: [
    { species: 'spinel', weight: 50 },
    { species: 'ruby', weight: 30 },
    { species: 'tanzanite', weight: 5 }
  ]
};

const PIPE = {
  id: 'kimberlite_pipe',
  name: 'Kimberlite Pipe',
  unlockGate: { allOf: [{ type: 'setComplete', setType: 'locality', id: 'mogok_marble' }] },
  findPool: [{ species: 'ruby', weight: 1 }]
};

function renderEntry(overrides = {}) {
  const props = {
    locality: MOGOK,
    localities: [MOGOK, PIPE],
    speciesById: SPECIES_BY_ID,
    gemdex: ['spinel'],
    unlocked: true,
    onClose: vi.fn(),
    ...overrides
  };
  render(<LocalityEntry {...props} />);
  return props;
}

describe('LocalityEntry', () => {
  it('names the locality in a labelled dialog', () => {
    renderEntry();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    screen.getByRole('heading', { name: 'Mogok Marble' });
  });

  it('shows geology, method, host rock and region', () => {
    renderEntry();
    screen.getByText(/metamorphic/i);
    screen.getByText(/Myanmar/);
    screen.getByText(/marble/i);
  });

  it('shows a satisfied access requirement for an unlocked locality', () => {
    renderEntry();
    const access = screen.getByText(/reputation tier 3/i);
    expect(access.textContent).toMatch(/✓/);
  });

  it('shows a pending access requirement for a locked locality', () => {
    renderEntry({ unlocked: false });
    const access = screen.getByText(/reputation tier 3/i);
    expect(access.textContent).toMatch(/🔒/);
  });

  it('lists indicator minerals to prospect for', () => {
    renderEntry();
    screen.getByText(/Pyrope Garnet/);
  });

  it('names discovered pool species and withholds undiscovered ones', () => {
    renderEntry();
    screen.getByText('Spinel');
    expect(screen.queryByText('Ruby')).toBeNull();
    expect(screen.getAllByText('???').length).toBe(2);
  });

  it('describes frequency in words, never raw weights', () => {
    renderEntry();
    screen.getByText(/common here/);
    expect(screen.queryByText(/50/)).toBeNull();
  });

  it('shows the rarity ceiling even though the rare species are unfound', () => {
    renderEntry();
    screen.getByText(/up to Epic/i);
  });

  it('shows set progress', () => {
    renderEntry();
    screen.getByText('1 / 3');
  });

  it('reveals which locality a completed set opens', () => {
    renderEntry();
    screen.getByText(/Kimberlite Pipe/);
  });

  it('says so when a completed set opens nothing', () => {
    renderEntry({ localities: [MOGOK] });
    expect(screen.queryByText(/Kimberlite Pipe/)).toBeNull();
  });

  it('closes on the close button', () => {
    const { onClose } = renderEntry();
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityEntry.test.jsx`
Expected: FAIL — cannot resolve `./LocalityEntry.jsx`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/components/LocalityEntry.jsx`:

```jsx
import EntryModal, { Section, Row } from './EntryModal.jsx';
import { gemArt } from '../logic/gemArt.js';
import { describeGate } from '../logic/progression.js';
import {
  findPoolView, rarityCeiling, localitySetProgress, localitiesGatedBy, titleizeWords
} from '../logic/localityView.js';

export default function LocalityEntry({
  locality, localities, speciesById, gemdex, unlocked, onClose
}) {
  const pool = findPoolView(locality, speciesById, gemdex);
  const ceiling = rarityCeiling(locality, speciesById);
  const progress = localitySetProgress(locality, gemdex);
  const opens = localitiesGatedBy(localities, locality.id);

  return (
    <EntryModal titleId="locality-entry-title" onClose={onClose}>
      <div className="flex items-start gap-4 p-5">
        <span
          className="mt-1 h-12 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: locality.color }}
          aria-hidden="true"
        />
        <div>
          <h3 id="locality-entry-title" className="text-2xl font-bold text-slate-50">{locality.name}</h3>
          <p className="text-sm capitalize text-slate-400">
            {locality.depositType} · {locality.method}
          </p>
          <p className="text-xs text-slate-500">{titleizeWords(locality.region)}</p>
        </div>
      </div>

      <Section title="Access">
        <Row label="Requirement">
          <span>
            {unlocked ? '✓ ' : '🔒 '}
            {describeGate(locality.unlockGate)}
          </span>
        </Row>
        <Row label="Host rock"><span className="capitalize">{locality.hostRock}</span></Row>
        <Row label="Look for">
          {locality.indicatorMinerals.map(titleizeWords).join(' · ')}
        </Row>
      </Section>

      <Section title="What's here">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-500">up to {ceiling}</span>
          <span className="font-mono text-xs text-slate-400">{progress.found} / {progress.total}</span>
        </div>
        <ul className="flex flex-col gap-1">
          {pool.map((entry) => {
            const art = gemArt(entry.speciesId);
            return (
              <li key={entry.speciesId} className="flex items-center gap-2 text-sm">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-700 text-base"
                  style={entry.discovered ? { backgroundColor: `${art.tint}33` } : undefined}
                  aria-hidden="true"
                >
                  {entry.discovered ? art.glyph : '❔'}
                </span>
                <span className={entry.discovered ? 'text-slate-100' : 'text-slate-500'}>
                  {entry.discovered ? entry.name : '???'}
                </span>
                <span className="ml-auto text-xs text-slate-500">{entry.frequency}</span>
              </li>
            );
          })}
        </ul>
        {progress.complete && <p className="mt-2 text-xs text-green-400">✓ Set complete</p>}
      </Section>

      {opens.length > 0 && (
        <Section title="🔓 Completing this set opens">
          <p className="text-sm text-slate-200">{opens.map((l) => l.name).join(', ')}</p>
        </Section>
      )}
    </EntryModal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityEntry.test.jsx`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/LocalityEntry.jsx src/features/rockhound/components/LocalityEntry.test.jsx
git commit -m "feat(explore): locality field guide modal (access, indicators, find pool)"
```

---

### Task 4: Informative locality cards, wired into Explore

Rebuild the map as cards carrying the scannable signals, each with a separate info button opening the Task 3 modal. Selection for panning keeps working exactly as it does today.

**Files:**
- Create: `src/features/rockhound/components/LocalityCard.jsx`
- Modify: `src/features/rockhound/components/LocalityMap.jsx` (full rewrite)
- Modify: `src/features/rockhound/components/LocalityMap.test.jsx`
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Rockhound.test.jsx`

**Interfaces:**
- Consumes: `LocalityEntry` (Task 3); `findPoolView`, `rarityCeiling`, `localitySetProgress` (Task 1); `gemArt`; `describeGate`.
- Produces:
  - `LocalityCard({ locality, unlocked, selected, pool, ceiling, progress, onSelect, onOpenInfo })` — a `<div>` wrapper containing a select `<button>` (disabled when locked) and a sibling info `<button>` labelled `<name> field guide`. Requirement text renders **outside** the select button.
  - `LocalityMap({ localities, unlockedIds, selectedId, onSelect, speciesById, gemdex })` — owns the open-modal state internally.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/features/rockhound/components/LocalityMap.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalityMap from './LocalityMap.jsx';
import { localities } from '../../../loaders/localities.js';
import { speciesById } from '../../../loaders/species.js';

function renderMap(overrides = {}) {
  const props = {
    localities,
    unlockedIds: ['hidden_creek'],
    selectedId: 'hidden_creek',
    onSelect: vi.fn(),
    speciesById,
    gemdex: ['quartz'],
    ...overrides
  };
  render(<LocalityMap {...props} />);
  return props;
}

describe('LocalityMap', () => {
  it('renders unlocked localities as enabled and locked ones with a hint', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek/ });
    expect(creek.disabled).toBe(false);
    screen.getByText(/Needs the sieve/i);
  });

  it('keeps the requirement text out of the select button accessible name', () => {
    renderMap();
    const creek = screen.getByRole('button', { name: /^Hidden Creek/ });
    expect(creek.textContent).not.toMatch(/available now/i);
  });

  it('shows the satisfied requirement for an unlocked locality', () => {
    renderMap();
    // Hidden Creek has an empty gate; it reads as open rather than hiding the row
    expect(screen.getAllByText(/available now/i).length).toBeGreaterThan(0);
  });

  it('selects a locality when its card is clicked', () => {
    const { onSelect } = renderMap();
    fireEvent.click(screen.getByRole('button', { name: /^Hidden Creek/ }));
    expect(onSelect).toHaveBeenCalledWith('hidden_creek');
  });

  it('does not select a locked locality', () => {
    const { onSelect } = renderMap();
    const locked = screen.getByRole('button', { name: /^Gravel Bar/ });
    expect(locked.disabled).toBe(true);
    fireEvent.click(locked);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows set progress on the card', () => {
    renderMap();
    // hidden_creek pools 4 species; the player has found quartz
    screen.getByText('1 / 4');
  });

  it('opens the field guide from the info button without selecting', () => {
    const { onSelect } = renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('opens the field guide for a locked locality too', () => {
    renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Gravel Bar field guide/i }));
    screen.getByRole('heading', { name: 'Gravel Bar' });
  });

  it('closes the field guide again', () => {
    renderMap();
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    fireEvent.click(screen.getByRole('button', { name: /close entry/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('withholds undiscovered species on the card', () => {
    renderMap();
    expect(screen.queryByText('Sapphire')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/LocalityMap.test.jsx`
Expected: FAIL — the current map has no info button, set progress, or satisfied-requirement row.

- [ ] **Step 3: Write `LocalityCard.jsx`**

Create `src/features/rockhound/components/LocalityCard.jsx`:

```jsx
import { gemArt } from '../logic/gemArt.js';
import { describeGate } from '../logic/progression.js';

export default function LocalityCard({
  locality, unlocked, selected, pool, ceiling, progress, onSelect, onOpenInfo
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => onSelect(locality.id)}
        className={`w-full rounded-lg border p-3 pr-10 text-left ${
          selected ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800'
        } ${unlocked ? 'hover:border-yellow-400' : 'cursor-not-allowed opacity-60'}`}
      >
        <span className="flex items-baseline gap-2">
          <span
            className="h-3 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: locality.color }}
            aria-hidden="true"
          />
          <span className="font-semibold text-slate-100">{locality.name}</span>
          <span className="ml-auto font-mono text-xs text-slate-400">
            {progress.found} / {progress.total}
          </span>
        </span>
        <span className="mt-0.5 block text-xs capitalize text-slate-400">
          {locality.depositType} · {locality.method}
        </span>
        <span className="mt-1 flex items-center gap-1">
          {pool.map((entry) => (
            <span key={entry.speciesId} className="text-base" aria-hidden="true">
              {entry.discovered ? gemArt(entry.speciesId).glyph : '❔'}
            </span>
          ))}
          <span className="ml-auto text-xs text-slate-500">up to {ceiling}</span>
        </span>
      </button>

      {/* Sibling, never nested — nested buttons are invalid HTML. */}
      <button
        type="button"
        aria-label={`${locality.name} field guide`}
        onClick={() => onOpenInfo(locality.id)}
        className="absolute right-2 top-2 rounded px-1 text-slate-400 hover:text-white"
      >
        ℹ️
      </button>

      {/* Outside the select button so it never leaks into its accessible name. */}
      <span className={`mt-1 block text-xs ${unlocked ? 'text-slate-500' : 'text-amber-400'}`}>
        {unlocked ? '✓ ' : '🔒 '}
        {describeGate(locality.unlockGate)}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `LocalityMap.jsx`**

Replace the whole of `src/features/rockhound/components/LocalityMap.jsx`:

```jsx
import { useState } from 'react';
import LocalityCard from './LocalityCard.jsx';
import LocalityEntry from './LocalityEntry.jsx';
import { findPoolView, rarityCeiling, localitySetProgress } from '../logic/localityView.js';

export default function LocalityMap({
  localities, unlockedIds, selectedId, onSelect, speciesById, gemdex
}) {
  const [infoId, setInfoId] = useState(null);
  const unlocked = new Set(unlockedIds);
  const infoLocality = localities.find((l) => l.id === infoId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {localities.map((loc) => (
          <li key={loc.id}>
            <LocalityCard
              locality={loc}
              unlocked={unlocked.has(loc.id)}
              selected={loc.id === selectedId}
              pool={findPoolView(loc, speciesById, gemdex)}
              ceiling={rarityCeiling(loc, speciesById)}
              progress={localitySetProgress(loc, gemdex)}
              onSelect={onSelect}
              onOpenInfo={setInfoId}
            />
          </li>
        ))}
      </ul>

      {infoLocality && (
        <LocalityEntry
          locality={infoLocality}
          localities={localities}
          speciesById={speciesById}
          gemdex={gemdex}
          unlocked={unlocked.has(infoLocality.id)}
          onClose={() => setInfoId(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Pass the new props from the shell**

In `src/features/rockhound/components/Rockhound.jsx`, the Explore tab's `<LocalityMap ... />` gains two props:

```jsx
          <LocalityMap
            localities={localities}
            unlockedIds={unlockedIds}
            selectedId={selectedLocalityId}
            onSelect={setSelectedLocalityId}
            speciesById={speciesById}
            gemdex={state.gemdex}
          />
```

`speciesById` and `state.gemdex` are already in scope in that component — no new imports.

- [ ] **Step 6: Update the shell test for the locked-neighbour hint**

`src/features/rockhound/components/Rockhound.test.jsx` already asserts `screen.getByText(/Needs the sieve/i)` for the locked neighbour; that still holds. Add one test proving the field guide opens from the Explore tab:

```jsx
  it('opens a locality field guide from the Explore map', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Hidden Creek field guide/i }));
    screen.getByRole('dialog');
    screen.getByText(/Look for/i);
  });
```

- [ ] **Step 7: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — all tests green (162 before this plan, plus ~40 added here).

Run: `./node_modules/.bin/vite build`
Expected: `✓ built in …`

- [ ] **Step 8: Commit**

```bash
git add src/features/rockhound/components
git commit -m "feat(explore): informative locality cards with field-guide modal"
```

---

## Verification

Tests are not enough here — the whole point is what the screen communicates. After Task 4, drive the real app:

- [ ] `./node_modules/.bin/vitest run` — all green
- [ ] `./node_modules/.bin/vite build` — clean build
- [ ] Launch the dev server, seed a partial save, open Explore and confirm: every card shows its requirement (satisfied `✓` for unlocked, `🔒` for locked); glyph rows show found gems and `❔` for the rest; set progress reads correctly; `up to <rarity>` appears; the info button opens the field guide **without** changing the panning selection; a locked locality's guide still opens; Escape and the backdrop both close it; **focus returns to the info button that opened it**.
- [ ] Confirm the page is not absurdly long with ten cards — if it is, tighten the card before calling this done.
