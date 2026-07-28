# Gemdex Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Gemdex tab's three undifferentiated sections into labelled subtabs (Species / Trophies / Career) and make every discovered species open a detailed field-journal entry with placeholder art.

**Architecture:** Two new pure logic modules (`gemArt.js` for the art/color placeholder layer, `gemdexView.js` for family grouping and locality lookup) feed four presentational components (`SpeciesCard`, `GemdexEntry` modal, `TrophyCase`, `CareerPanel`). The `Rockhound` shell gains a subtab router inside the existing `Gemdex` tab. No state, reducer, schema, or YAML changes — this is a read-only view over existing state.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, Vitest + React Testing Library (jsdom).

## Global Constraints

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **No changes** to `src/data/*.yaml`, `src/schemas/*`, or `RockhoundContext.jsx` reducer/state shape. This plan is view-layer only. The one exception is a purely additive `requirement` string field on `GEAR_MILESTONES` in Task 5.
- All new components are **presentational**: every piece of game data arrives as props (matching the existing `GemdexV5`/`ProgressionPanel` convention) so tests can render them without the provider.
- Tailwind utility classes only, dark palette matching existing components (`bg-slate-800`, `border-slate-700`, `text-yellow-400` accents).
- Out of scope (YAGNI): search, sort, filter chips, species comparison, real art assets.
- Existing tests must keep passing except where this plan explicitly updates them.

---

### Task 1: Placeholder art layer (`gemArt.js`)

The single swap point for real gem sprites later. Maps each species id to a glyph + tint, and each color name used in `species.yaml` to a hex swatch.

**Files:**
- Create: `src/features/rockhound/logic/gemArt.js`
- Test: `src/features/rockhound/logic/gemArt.test.js`

**Interfaces:**
- Consumes: nothing (pure table module).
- Produces: `gemArt(speciesId) -> { glyph: string, tint: string }`, `colorHex(colorName) -> string`.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/gemArt.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { gemArt, colorHex } from './gemArt.js';
import { species } from '../../../loaders/species.js';

describe('gemArt', () => {
  it('gives every species in the roster its own art entry', () => {
    // Guard: adding a species to species.yaml must fail loudly until art exists.
    const missing = species.filter((s) => !gemArt(s.id).known);
    expect(missing.map((s) => s.id)).toEqual([]);
  });

  it('returns distinct glyphs so species are visually separable', () => {
    const glyphs = species.map((s) => gemArt(s.id).glyph);
    expect(new Set(glyphs).size).toBe(species.length);
  });

  it('falls back to a neutral rock for an unknown id', () => {
    const art = gemArt('not_a_species');
    expect(art.known).toBe(false);
    expect(art.glyph).toBe('🪨');
  });

  it('maps every color name used in the roster to a hex swatch', () => {
    const names = [...new Set(species.flatMap((s) => s.colors))];
    const unmapped = names.filter((n) => !colorHex(n));
    expect(unmapped).toEqual([]);
  });

  it('returns hex values', () => {
    expect(colorHex('red')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/gemArt.test.js`
Expected: FAIL — cannot resolve `./gemArt.js`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/logic/gemArt.js`:

```js
// Placeholder art layer for the Gemdex. Real sprites will replace the glyphs
// later; keeping the mapping here means only this file and the tile markup
// change. Tints are the species' natural color anchor from
// docs/research/gem-reference.md (§7 art direction).

const ART = {
  quartz:           { glyph: '💧', tint: '#dfe7f0' },
  amethyst:         { glyph: '🟣', tint: '#7a4fa0' },
  citrine:          { glyph: '🟡', tint: '#e8a417' },
  agate:            { glyph: '🪨', tint: '#a9846a' },
  almandine_garnet: { glyph: '🔴', tint: '#8c2b32' },
  tsavorite:        { glyph: '🟩', tint: '#17a05a' },
  sapphire:         { glyph: '🔵', tint: '#2f5fc0' },
  ruby:             { glyph: '❤️', tint: '#c62d3a' },
  aquamarine:       { glyph: '🌊', tint: '#5fc4d0' },
  emerald:          { glyph: '💚', tint: '#1f8f57' },
  topaz:            { glyph: '🔶', tint: '#d98f3a' },
  spinel:           { glyph: '🌸', tint: '#d4557a' },
  peridot:          { glyph: '🫒', tint: '#8aab2a' },
  tanzanite:        { glyph: '🔷', tint: '#4a52b8' },
  tourmaline:       { glyph: '🍉', tint: '#4aa84a' },
  moonstone:        { glyph: '🌙', tint: '#c2d2e2' },
  opal:             { glyph: '🌈', tint: '#7ec8c0' },
  alexandrite:      { glyph: '🎭', tint: '#5f8f5f' },
  diamond:          { glyph: '💎', tint: '#e6eef7' },
  fluorite:         { glyph: '🧊', tint: '#6f8fd0' },
  obsidian:         { glyph: '⚫', tint: '#26262b' }
};

const FALLBACK = { glyph: '🪨', tint: '#8a8f98' };

/**
 * Art for a species id. `known` is false for ids with no entry, which the
 * roster guard test uses to catch species added without art.
 */
export function gemArt(speciesId) {
  const art = ART[speciesId];
  return art ? { ...art, known: true } : { ...FALLBACK, known: false };
}

// Every color name appearing in species.yaml. Names describing an effect
// rather than a single hue (banded, sheen, play-of-color, multicolor,
// watermelon) get an approximating hue until real art lands.
const COLOR_HEX = {
  amber: '#ffbf00',
  banded: '#b98a5a',
  black: '#1c1c1e',
  blue: '#2f6fd0',
  'blue-green': '#1d8a8a',
  'blue-sheen': '#8fb8dd',
  'blue-violet': '#5a4fc0',
  brown: '#7a5230',
  'brownish-red': '#8c3b2e',
  colorless: '#e8eef5',
  cyan: '#4fd1e0',
  gray: '#9aa0a6',
  green: '#2f9e5b',
  lavender: '#c3a6e0',
  multicolor: '#b06fd0',
  olive: '#7c8a3a',
  orange: '#f08a2c',
  pink: '#f08ab0',
  'pinkish-red': '#e0456b',
  'play-of-color': '#6fd0c0',
  purple: '#7a4fa0',
  'purple-red': '#a03a5a',
  red: '#c62d3a',
  sheen: '#b9c2cc',
  sherry: '#b5603a',
  violet: '#7d5fd0',
  'vivid-green': '#17c964',
  watermelon: '#e0507a',
  white: '#f2f4f7',
  yellow: '#f2c744',
  'yellow-green': '#a8cf3a'
};

/** Hex swatch for a color name from species.yaml, or '' if unmapped. */
export function colorHex(name) {
  return COLOR_HEX[name] ?? '';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/gemArt.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/gemArt.js src/features/rockhound/logic/gemArt.test.js
git commit -m "feat(gemdex): placeholder art layer (glyph + tint per species, color swatches)"
```

---

### Task 2: Gemdex view logic (`gemdexView.js`)

Pure derivations the Species subtab and the entry modal need: family grouping with per-family progress, and which localities pool a species.

**Files:**
- Create: `src/features/rockhound/logic/gemdexView.js`
- Test: `src/features/rockhound/logic/gemdexView.test.js`

**Interfaces:**
- Consumes: `species` array shape from `src/loaders/species.js`, `localities` array shape from `src/loaders/localities.js`.
- Produces:
  - `familyGroups(allSpecies, gemdex) -> [{ family, members, discovered, total, complete }]` — families in the order they first appear in `allSpecies`.
  - `localitiesForSpecies(localities, speciesId) -> [locality]` — full locality objects whose `findPool` contains the species.
  - `collectionProgress(allSpecies, gemdex) -> { discovered, total }`

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/logic/gemdexView.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { familyGroups, localitiesForSpecies, collectionProgress } from './gemdexView.js';

const SPECIES = [
  { id: 'quartz', family: 'quartz' },
  { id: 'ruby', family: 'corundum' },
  { id: 'amethyst', family: 'quartz' },
  { id: 'sapphire', family: 'corundum' }
];

const LOCALITIES = [
  { id: 'creek', findPool: [{ species: 'quartz' }, { species: 'sapphire' }] },
  { id: 'mogok', findPool: [{ species: 'ruby' }, { species: 'sapphire' }] }
];

describe('familyGroups', () => {
  it('groups members by family in first-appearance order', () => {
    const groups = familyGroups(SPECIES, []);
    expect(groups.map((g) => g.family)).toEqual(['quartz', 'corundum']);
    expect(groups[0].members.map((m) => m.id)).toEqual(['quartz', 'amethyst']);
  });

  it('counts discovered members and flags a complete family', () => {
    const groups = familyGroups(SPECIES, ['ruby', 'sapphire', 'quartz']);
    const quartz = groups.find((g) => g.family === 'quartz');
    const corundum = groups.find((g) => g.family === 'corundum');
    expect(quartz).toMatchObject({ discovered: 1, total: 2, complete: false });
    expect(corundum).toMatchObject({ discovered: 2, total: 2, complete: true });
  });

  it('treats an empty gemdex as nothing discovered', () => {
    expect(familyGroups(SPECIES, []).every((g) => g.discovered === 0)).toBe(true);
  });
});

describe('localitiesForSpecies', () => {
  it('returns every locality whose find pool contains the species', () => {
    expect(localitiesForSpecies(LOCALITIES, 'sapphire').map((l) => l.id)).toEqual(['creek', 'mogok']);
  });

  it('returns an empty list for a species nothing pools', () => {
    expect(localitiesForSpecies(LOCALITIES, 'diamond')).toEqual([]);
  });
});

describe('collectionProgress', () => {
  it('counts discovered against the full roster', () => {
    expect(collectionProgress(SPECIES, ['ruby', 'ruby'])).toEqual({ discovered: 1, total: 4 });
  });

  it('ignores gemdex entries not in the roster', () => {
    expect(collectionProgress(SPECIES, ['ghost'])).toEqual({ discovered: 0, total: 4 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/gemdexView.test.js`
Expected: FAIL — cannot resolve `./gemdexView.js`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/logic/gemdexView.js`:

```js
// Read-only derivations for the Gemdex views. Family grouping lives here (not
// in progression.js) because it is presentation shape, not game rules;
// progression.js remains the authority on whether a family set is *complete*.

/**
 * Species grouped by family, families ordered by first appearance in
 * `allSpecies` (species.yaml is authored family-by-family, so this reads in
 * the intended order).
 */
export function familyGroups(allSpecies, gemdex) {
  const found = new Set(gemdex);
  const order = [...new Set(allSpecies.map((s) => s.family))];
  return order.map((family) => {
    const members = allSpecies.filter((s) => s.family === family);
    const discovered = members.filter((s) => found.has(s.id)).length;
    return { family, members, discovered, total: members.length, complete: discovered === members.length };
  });
}

/** Localities whose findPool can yield this species (findPool is the source of truth). */
export function localitiesForSpecies(localities, speciesId) {
  return localities.filter((l) => l.findPool.some((e) => e.species === speciesId));
}

/** Overall roster completion. Gemdex ids outside the roster are ignored. */
export function collectionProgress(allSpecies, gemdex) {
  const found = new Set(gemdex);
  return {
    discovered: allSpecies.filter((s) => found.has(s.id)).length,
    total: allSpecies.length
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/logic/gemdexView.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/logic/gemdexView.js src/features/rockhound/logic/gemdexView.test.js
git commit -m "feat(gemdex): family grouping and locality lookup derivations"
```

---

### Task 3: The detail entry modal (`GemdexEntry.jsx`)

A dialog showing every property of one discovered species, grouped to mirror the game's systems. Spoiler-safe: localities the player hasn't unlocked show as locked.

**Files:**
- Create: `src/features/rockhound/components/GemdexEntry.jsx`
- Test: `src/features/rockhound/components/GemdexEntry.test.jsx`

**Interfaces:**
- Consumes: `gemArt`, `colorHex` (Task 1); `localitiesForSpecies` (Task 2).
- Produces: default export `GemdexEntry({ species, localities, unlockedIds, cutTechniquesById, best, familyGroup, onClose })`
  - `species` — one species object from the roster.
  - `localities` — full localities array.
  - `unlockedIds` — array of locality ids the player has unlocked; others render as `🔒 ???`.
  - `cutTechniquesById` — map of cut id → `{ id, name }`, used to name `suitableCuts` and `phenomena[].revealedBy`.
  - `best` — this species' entry from `state.bestSpecimens`, or `null`/`undefined`.
  - `familyGroup` — the matching `familyGroups()` entry, for the "3 / 4 in family" line.
  - `onClose` — called on ✕ click, backdrop click, or Escape.

- [ ] **Step 1: Write the failing test**

Create `src/features/rockhound/components/GemdexEntry.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GemdexEntry from './GemdexEntry.jsx';

const RUBY = {
  id: 'ruby', name: 'Ruby', category: 'Gem', family: 'corundum', rarity: 'Epic',
  hardness: 9, specificGravity: 4.0, habit: ['prismatic', 'tabular'],
  luster: 'vitreous', transparency: 'transparent', colors: ['red', 'pinkish-red'],
  streak: 'white', fluorescence: { longwave: 'red', shortwave: 'none' },
  refractiveIndex: [1.762, 1.77], cleavage: 'none', fracture: 'uneven',
  baseValue: 900, suitableCuts: ['cabochon', 'step'], cutDifficulty: 4,
  phenomena: [{ type: 'asterism', revealedBy: 'cabochon' }],
  realWorldLocations: ['Myanmar', 'Mozambique'],
  funFact: 'Ruby and sapphire are the same mineral.'
};

const LOCALITIES = [
  { id: 'mogok_marble', name: 'Mogok Marble', findPool: [{ species: 'ruby' }] },
  { id: 'secret_pipe', name: 'Secret Pipe', findPool: [{ species: 'ruby' }] }
];

const CUTS = { cabochon: { id: 'cabochon', name: 'Cabochon' }, step: { id: 'step', name: 'Step / Emerald Cut' } };

const FAMILY = { family: 'corundum', discovered: 1, total: 2, complete: false };

function renderEntry(overrides = {}) {
  const props = {
    species: RUBY, localities: LOCALITIES, unlockedIds: ['mogok_marble'],
    cutTechniquesById: CUTS, best: null, familyGroup: FAMILY, onClose: vi.fn(),
    ...overrides
  };
  render(<GemdexEntry {...props} />);
  return props;
}

describe('GemdexEntry', () => {
  it('renders as a labelled modal dialog naming the species', () => {
    renderEntry();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Ruby' })).toBeTruthy();
  });

  it('shows family, category and rarity', () => {
    renderEntry();
    screen.getByText(/corundum/);
    screen.getByText(/Epic/);
  });

  it('shows physical and optical properties including a formatted RI range', () => {
    renderEntry();
    screen.getByText('1.762–1.770');
    screen.getByText('4.00');
    screen.getByText(/prismatic, tabular/);
    screen.getByText(/vitreous/);
    screen.getByText(/white/);
  });

  it('shows fluorescence per wave', () => {
    renderEntry();
    screen.getByText(/LW/);
    screen.getByText(/red/);
  });

  it('reports an inert species as inert', () => {
    renderEntry({ species: { ...RUBY, fluorescence: null } });
    screen.getByText(/Inert/i);
  });

  it('names the phenomenon and the cut that reveals it', () => {
    renderEntry();
    screen.getByText(/asterism/i);
    screen.getByText(/Cabochon/);
  });

  it('shows lapidary data: value, difficulty and named cuts', () => {
    renderEntry();
    screen.getByText(/900/);
    screen.getByText(/Step \/ Emerald Cut/);
  });

  it('names unlocked localities and hides locked ones', () => {
    renderEntry();
    screen.getByText(/Mogok Marble/);
    expect(screen.queryByText(/Secret Pipe/)).toBeNull();
    screen.getByText(/1 locked/);
  });

  it('shows real world locations and the fun fact', () => {
    renderEntry();
    screen.getByText(/Myanmar/);
    screen.getByText(/same mineral/);
  });

  it('shows a prompt when there is no trophy yet', () => {
    renderEntry();
    screen.getByText(/no cut stone yet/i);
  });

  it('shows the best cut stone when one exists', () => {
    renderEntry({ best: { cut: 'cabochon', score: 812, phenomena: ['asterism'] } });
    screen.getByText(/812/);
  });

  it('closes on the close button', () => {
    const { onClose } = renderEntry();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const { onClose } = renderEntry();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexEntry.test.jsx`
Expected: FAIL — cannot resolve `./GemdexEntry.jsx`.

- [ ] **Step 3: Write the implementation**

Create `src/features/rockhound/components/GemdexEntry.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import { gemArt, colorHex } from '../logic/gemArt.js';
import { localitiesForSpecies } from '../logic/gemdexView.js';

const RARITY_COLOR = {
  Common: 'text-slate-300',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400'
};

// Hardness / refractive index may be a point value or a [min, max] range.
const formatRange = (v, digits) =>
  Array.isArray(v)
    ? `${v[0].toFixed(digits)}–${v[1].toFixed(digits)}`
    : v.toFixed(digits);

const maxOf = (v) => (Array.isArray(v) ? v[1] : v);
const titleize = (s) => s.replace(/_/g, ' ');

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 text-right">{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-slate-700 px-5 py-3">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">{title}</h4>
      {children}
    </section>
  );
}

export default function GemdexEntry({
  species, localities, unlockedIds, cutTechniquesById, best, familyGroup, onClose
}) {
  const closeRef = useRef(null);
  const art = gemArt(species.id);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pools = localitiesForSpecies(localities, species.id);
  const unlocked = new Set(unlockedIds);
  const knownPools = pools.filter((l) => unlocked.has(l.id));
  const lockedCount = pools.length - knownPools.length;

  const cutName = (id) => cutTechniquesById[id]?.name ?? titleize(id);
  const hardnessPct = Math.round((maxOf(species.hardness) / 10) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gemdex-entry-title"
        className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-600 text-4xl"
            style={{ backgroundColor: `${art.tint}33` }}
            aria-hidden="true"
          >
            {art.glyph}
          </div>
          <div className="flex-1">
            <h3 id="gemdex-entry-title" className="text-2xl font-bold text-slate-50">{species.name}</h3>
            <p className="text-sm text-slate-400">
              <span className="capitalize">{titleize(species.family)}</span> family · {species.category} ·{' '}
              <span className={`font-semibold ${RARITY_COLOR[species.rarity] ?? 'text-slate-300'}`}>{species.rarity}</span>
            </p>
            <p className="text-xs text-slate-500">
              {familyGroup.discovered} / {familyGroup.total} in this family
              {familyGroup.complete && <span className="text-green-400"> ✓ set complete</span>}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {species.colors.map((c) => (
                <li key={c} className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-slate-600"
                    style={{ backgroundColor: colorHex(c) || '#8a8f98' }}
                    aria-hidden="true"
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close entry"
            onClick={onClose}
            className="rounded px-2 text-xl leading-none text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Properties */}
        <div className="grid gap-x-8 border-t border-slate-700 px-5 py-3 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">Physical</h4>
            <Row label="Hardness">
              <span className="font-mono">{formatRange(species.hardness, 1)}</span>
              <span className="ml-2 inline-block h-1.5 w-16 overflow-hidden rounded bg-slate-700 align-middle">
                <span className="block h-full bg-yellow-400" style={{ width: `${hardnessPct}%` }} />
              </span>
            </Row>
            <Row label="Sp. gravity"><span className="font-mono">{species.specificGravity.toFixed(2)}</span></Row>
            <Row label="Habit"><span className="capitalize">{species.habit.join(', ')}</span></Row>
            <Row label="Cleavage"><span className="capitalize">{species.cleavage}</span></Row>
            {species.fracture && <Row label="Fracture"><span className="capitalize">{species.fracture}</span></Row>}
          </div>
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-400">Optical</h4>
            <Row label="Luster"><span className="capitalize">{species.luster}</span></Row>
            <Row label="Transparency"><span className="capitalize">{species.transparency}</span></Row>
            <Row label="Refr. index">
              <span className="font-mono">
                {species.refractiveIndex == null ? '—' : formatRange(species.refractiveIndex, 3)}
              </span>
            </Row>
            <Row label="Streak">{species.streak}</Row>
            <Row label="UV">
              {species.fluorescence
                ? `LW ${species.fluorescence.longwave} · SW ${species.fluorescence.shortwave}`
                : 'Inert'}
            </Row>
          </div>
        </div>

        {species.phenomena?.length > 0 && (
          <Section title="✨ Phenomena">
            <ul className="text-sm text-slate-200">
              {species.phenomena.map((p) => (
                <li key={p.type} className="capitalize">
                  {titleize(p.type)} —{' '}
                  <span className="text-slate-400">revealed by <span className="text-slate-200">{cutName(p.revealedBy)}</span></span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Lapidary">
          <Row label="Base value"><span className="font-mono">💰 {species.baseValue}</span></Row>
          <Row label="Cut difficulty">
            <span className="font-mono text-yellow-400">
              {'●'.repeat(species.cutDifficulty)}{'○'.repeat(5 - species.cutDifficulty)}
            </span>
          </Row>
          <Row label="Suitable cuts">{species.suitableCuts.map(cutName).join(', ')}</Row>
        </Section>

        <Section title="Where to find">
          <Row label="Localities">
            {knownPools.length === 0 && lockedCount === 0 && <span className="text-slate-500">Nowhere yet</span>}
            {knownPools.map((l) => l.name).join(' · ')}
            {lockedCount > 0 && (
              <span className="text-slate-500">
                {knownPools.length > 0 ? ' · ' : ''}🔒 ??? ({lockedCount} locked)
              </span>
            )}
          </Row>
          <Row label="In the world">{species.realWorldLocations.join(', ')}</Row>
        </Section>

        <Section title="🏆 Your best">
          {best ? (
            <p className="text-sm text-slate-200">
              <span className="capitalize">{titleize(best.cut)}</span> · score{' '}
              <span className="font-mono">{best.score}</span>
              {best.phenomena?.length > 0 && <span className="text-yellow-400"> · ✨ {best.phenomena.join(', ')}</span>}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No cut stone yet — cut one to claim a trophy.</p>
          )}
        </Section>

        {species.funFact && (
          <Section title="💡 Field note">
            <p className="text-sm italic text-slate-300">{species.funFact}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexEntry.test.jsx`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/rockhound/components/GemdexEntry.jsx src/features/rockhound/components/GemdexEntry.test.jsx
git commit -m "feat(gemdex): detailed species entry modal with properties, phenomena and trophy"
```

---

### Task 4: Grouped, clickable species grid (`SpeciesCard` + `GemdexV5`)

Rebuild the grid as family sections of clickable cards that open the Task 3 entry.

**Files:**
- Create: `src/features/rockhound/components/SpeciesCard.jsx`
- Modify: `src/features/rockhound/components/GemdexV5.jsx` (full rewrite)
- Test: `src/features/rockhound/components/GemdexV5.test.jsx` (extend existing file)

**Interfaces:**
- Consumes: `gemArt` (Task 1); `familyGroups`, `collectionProgress` (Task 2); `GemdexEntry` (Task 3).
- Produces:
  - `SpeciesCard({ species, discovered, isNew, onOpen })` — a `<button>` when discovered, a plain `<div>` when not.
  - `GemdexV5({ species, gemdex, newlyDiscovered, localities, unlockedIds, cutTechniquesById, bestSpecimens })` — owns the open-entry state internally.

- [ ] **Step 1: Write the failing test**

Replace the contents of `src/features/rockhound/components/GemdexV5.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GemdexV5 from './GemdexV5.jsx';
import { species } from '../../../loaders/species.js';
import { localities } from '../../../loaders/localities.js';
import { cutTechniquesById } from '../../../loaders/cutTechniques.js';

function renderGemdex(overrides = {}) {
  render(
    <GemdexV5
      species={species}
      gemdex={['sapphire']}
      newlyDiscovered={[]}
      localities={localities}
      unlockedIds={['hidden_creek']}
      cutTechniquesById={cutTechniquesById}
      bestSpecimens={{}}
      {...overrides}
    />
  );
}

describe('GemdexV5', () => {
  it('shows an X / Y discovered header', () => {
    renderGemdex();
    screen.getByText(new RegExp(`1 / ${species.length}`));
  });

  it('reveals discovered species and hides undiscovered ones', () => {
    renderGemdex();
    screen.getByText('Sapphire');
    expect(screen.queryByText('Clear Quartz')).toBeNull();
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
  });

  it('marks newly discovered species with a NEW badge', () => {
    renderGemdex({ newlyDiscovered: ['sapphire'] });
    screen.getByText('NEW');
  });

  it('groups species under family headings with per-family progress', () => {
    renderGemdex();
    // corundum holds sapphire + ruby; one of two is discovered
    const heading = screen.getByText(/corundum/i);
    expect(heading).toBeTruthy();
    screen.getByText('1 / 2');
  });

  it('opens the detail entry when a discovered species is clicked', () => {
    renderGemdex();
    fireEvent.click(screen.getByRole('button', { name: /Sapphire/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    // the entry shows a property the card does not
    screen.getByText(/Sp. gravity/i);
  });

  it('closes the detail entry again', () => {
    renderGemdex();
    fireEvent.click(screen.getByRole('button', { name: /Sapphire/i }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not make undiscovered species clickable', () => {
    renderGemdex();
    expect(screen.queryByRole('button', { name: /\?\?\?/ })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexV5.test.jsx`
Expected: FAIL — the grouped-heading, click-to-open and non-clickable-locked tests fail against the current flat grid.

- [ ] **Step 3: Write `SpeciesCard.jsx`**

Create `src/features/rockhound/components/SpeciesCard.jsx`:

```jsx
import { gemArt } from '../logic/gemArt.js';

const RARITY_COLOR = {
  Common: 'text-slate-400',
  Uncommon: 'text-green-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400'
};

export default function SpeciesCard({ species, discovered, isNew, onOpen }) {
  const art = gemArt(species.id);

  if (!discovered) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700/40 text-2xl grayscale opacity-40" aria-hidden="true">
          ❔
        </div>
        <span className="font-semibold text-slate-500">???</span>
        <span className="text-xs text-slate-600">{species.realWorldLocations[0]}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 p-3 text-center transition hover:border-yellow-400 hover:bg-slate-700"
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-slate-600 text-2xl"
        style={{ backgroundColor: `${art.tint}33` }} aria-hidden="true">
        {art.glyph}
      </div>
      <span className="font-semibold text-slate-100">{species.name}</span>
      <span className="flex items-center gap-1 text-xs">
        <span className={RARITY_COLOR[species.rarity] ?? 'text-slate-400'}>{species.rarity}</span>
        {species.phenomena?.length > 0 && <span className="text-yellow-400">✨</span>}
      </span>
      {isNew && (
        <span className="rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-slate-900">NEW</span>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Rewrite `GemdexV5.jsx`**

Replace the whole of `src/features/rockhound/components/GemdexV5.jsx`:

```jsx
import { useState } from 'react';
import { familyGroups, collectionProgress } from '../logic/gemdexView.js';
import SpeciesCard from './SpeciesCard.jsx';
import GemdexEntry from './GemdexEntry.jsx';

export default function GemdexV5({
  species, gemdex, newlyDiscovered, localities, unlockedIds, cutTechniquesById, bestSpecimens
}) {
  const [openId, setOpenId] = useState(null);
  const discovered = new Set(gemdex);
  const isNew = new Set(newlyDiscovered);
  const groups = familyGroups(species, gemdex);
  const { discovered: found, total } = collectionProgress(species, gemdex);

  const openGroup = openId ? groups.find((g) => g.members.some((m) => m.id === openId)) : null;
  const openSpecies = openGroup?.members.find((m) => m.id === openId) ?? null;

  return (
    <section className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        Every mineral you have identified — <span className="font-mono text-slate-200">{found} / {total}</span> discovered
      </p>

      {groups.map((g) => (
        <div key={g.family} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 border-b border-slate-700 pb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">{g.family.replace(/_/g, ' ')}</h3>
            {g.complete && <span className="text-green-400" aria-label="set complete">✓</span>}
            <span className="ml-auto font-mono text-xs text-slate-400">{g.discovered} / {g.total}</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {g.members.map((s) => (
              <li key={s.id}>
                <SpeciesCard
                  species={s}
                  discovered={discovered.has(s.id)}
                  isNew={isNew.has(s.id)}
                  onOpen={() => setOpenId(s.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {openSpecies && (
        <GemdexEntry
          species={openSpecies}
          localities={localities}
          unlockedIds={unlockedIds}
          cutTechniquesById={cutTechniquesById}
          best={bestSpecimens[openSpecies.id] ?? null}
          familyGroup={openGroup}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  );
}
```

Note: `SpeciesCard` renders a full-width card inside each `<li>`; add `w-full` to the card's class list if the grid cells look ragged.

- [ ] **Step 5: Run tests to verify they pass**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/GemdexV5.test.jsx`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/features/rockhound/components/SpeciesCard.jsx src/features/rockhound/components/GemdexV5.jsx src/features/rockhound/components/GemdexV5.test.jsx
git commit -m "feat(gemdex): family-grouped grid of clickable species cards"
```

---

### Task 5: Subtabs, Trophy case and Career panel

Split the Gemdex tab into three labelled subtabs, extract the inline trophy case into its own component, and turn `ProgressionPanel` into `CareerPanel` — dropping the family list (now in Species) and gaining set counts and gear milestones.

**Files:**
- Create: `src/features/rockhound/components/TrophyCase.jsx`
- Create: `src/features/rockhound/components/TrophyCase.test.jsx`
- Rename: `src/features/rockhound/components/ProgressionPanel.jsx` → `CareerPanel.jsx` (and its test)
- Modify: `src/features/rockhound/components/Rockhound.jsx`
- Modify: `src/features/rockhound/components/Rockhound.test.jsx`
- Modify: `src/features/rockhound/logic/progression.js` (add `requirement` text to `GEAR_MILESTONES`)

**Interfaces:**
- Consumes: `GemdexV5` (Task 4); `collectionProgress`, `familyGroups` (Task 2); `gemArt` (Task 1); `reputationTier`, `REPUTATION_TIERS`, `GEAR_MILESTONES` from `progression.js`.
- Produces:
  - `TrophyCase({ bestSpecimens, speciesById })`
  - `CareerPanel({ reputation, gear, familySetsComplete, familySetsTotal, localitySetsComplete, localitySetsTotal })`

- [ ] **Step 1: Add requirement text to gear milestones**

In `src/features/rockhound/logic/progression.js`, replace the `GEAR_MILESTONES` block:

```js
export const GEAR_MILESTONES = [
  {
    id: 'sieve',
    label: 'Sieve',
    requirement: 'Reach reputation tier 1',
    when: (ctx) => reputationTier(ctx.reputation) >= 1
  },
  {
    id: 'rock_hammer',
    label: 'Rock Hammer',
    requirement: 'Complete the Hidden Creek set',
    when: (ctx) => ctx.completedLocalities.includes('hidden_creek')
  }
];
```

- [ ] **Step 2: Write the failing TrophyCase test**

Create `src/features/rockhound/components/TrophyCase.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrophyCase from './TrophyCase.jsx';

const SPECIES_BY_ID = {
  ruby: { id: 'ruby', name: 'Ruby' },
  opal: { id: 'opal', name: 'Opal' }
};

describe('TrophyCase', () => {
  it('explains itself and prompts when empty', () => {
    render(<TrophyCase bestSpecimens={{}} speciesById={SPECIES_BY_ID} />);
    screen.getByText(/finest cut stone/i);
    screen.getByText(/no cut stones yet/i);
  });

  it('lists the best stone per species, highest score first', () => {
    render(
      <TrophyCase
        bestSpecimens={{
          ruby: { cut: 'cabochon', score: 500, phenomena: [] },
          opal: { cut: 'cabochon', score: 900, phenomena: ['play_of_color'] }
        }}
        speciesById={SPECIES_BY_ID}
      />
    );
    const names = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(names[0]).toMatch(/Opal/);
    expect(names[1]).toMatch(/Ruby/);
  });

  it('marks a stone whose phenomenon was revealed', () => {
    render(
      <TrophyCase
        bestSpecimens={{ opal: { cut: 'cabochon', score: 900, phenomena: ['play_of_color'] } }}
        speciesById={SPECIES_BY_ID}
      />
    );
    screen.getByText(/✨/);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/TrophyCase.test.jsx`
Expected: FAIL — cannot resolve `./TrophyCase.jsx`.

- [ ] **Step 4: Write `TrophyCase.jsx`**

Create `src/features/rockhound/components/TrophyCase.jsx`:

```jsx
import { gemArt } from '../logic/gemArt.js';

const titleize = (s) => s.replace(/_/g, ' ');

export default function TrophyCase({ bestSpecimens, speciesById }) {
  const entries = Object.entries(bestSpecimens)
    .filter(([speciesId]) => speciesById[speciesId])
    .sort((a, b) => b[1].score - a[1].score);

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">Your finest cut stone for each species — one trophy per species, best score kept.</p>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No cut stones yet — cut an identified specimen to earn a trophy.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {entries.map(([speciesId, best]) => {
            const art = gemArt(speciesId);
            return (
              <li
                key={speciesId}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-600 text-xl"
                  style={{ backgroundColor: `${art.tint}33` }}
                  aria-hidden="true"
                >
                  {art.glyph}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-100">{speciesById[speciesId].name}</span>
                  <span className="block text-xs capitalize text-slate-400">
                    {titleize(best.cut)}
                    {best.phenomena?.length > 0 && <span className="text-yellow-400"> · ✨ {best.phenomena.map(titleize).join(', ')}</span>}
                  </span>
                </span>
                <span className="font-mono text-sm text-slate-300">{best.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/TrophyCase.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Rename ProgressionPanel to CareerPanel**

```bash
git mv src/features/rockhound/components/ProgressionPanel.jsx src/features/rockhound/components/CareerPanel.jsx
git mv src/features/rockhound/components/ProgressionPanel.test.jsx src/features/rockhound/components/CareerPanel.test.jsx
```

- [ ] **Step 7: Write the failing CareerPanel test**

Replace the contents of `src/features/rockhound/components/CareerPanel.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerPanel from './CareerPanel.jsx';

function renderPanel(overrides = {}) {
  render(
    <CareerPanel
      reputation={60}
      gear={['sieve']}
      familySetsComplete={2}
      familySetsTotal={15}
      localitySetsComplete={1}
      localitySetsTotal={10}
      {...overrides}
    />
  );
}

describe('CareerPanel', () => {
  it('explains itself', () => {
    renderPanel();
    screen.getByText(/standing/i);
  });

  it('shows reputation and its tier', () => {
    renderPanel();
    screen.getByText(/60/);
    screen.getByText(/tier 1/i);
  });

  it('shows progress toward the next tier', () => {
    renderPanel();
    screen.getByText(/120/); // next tier threshold
  });

  it('shows owned gear and locked milestones with their requirement', () => {
    renderPanel();
    screen.getByText(/Sieve/i);
    screen.getByText(/Rock Hammer/i);
    screen.getByText(/Complete the Hidden Creek set/i);
  });

  it('shows set completion counts', () => {
    renderPanel();
    screen.getByText('2 / 15');
    screen.getByText('1 / 10');
  });

  it('does not list individual families (that lives in the Species tab)', () => {
    renderPanel();
    expect(screen.queryByText(/corundum/i)).toBeNull();
  });

  it('reports a maxed-out reputation without a next tier', () => {
    renderPanel({ reputation: 500 });
    screen.getByText(/max tier/i);
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/CareerPanel.test.jsx`
Expected: FAIL — the old panel has no subtitle, tier progress, gear milestones or set counts.

- [ ] **Step 9: Write `CareerPanel.jsx`**

Replace the whole of `src/features/rockhound/components/CareerPanel.jsx`:

```jsx
import { reputationTier, REPUTATION_TIERS, GEAR_MILESTONES } from '../logic/progression.js';

export default function CareerPanel({
  reputation, gear, familySetsComplete, familySetsTotal, localitySetsComplete, localitySetsTotal
}) {
  const tier = reputationTier(reputation);
  const nextThreshold = REPUTATION_TIERS[tier + 1] ?? null;
  const floor = REPUTATION_TIERS[tier];
  const pct = nextThreshold
    ? Math.round(((reputation - floor) / (nextThreshold - floor)) * 100)
    : 100;
  const owned = new Set(gear);

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">Your standing as a rockhound — reputation, gear and the sets that unlock new ground.</p>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold text-yellow-400">⭐ {reputation}</span>
          <span className="text-sm text-slate-400">Reputation · tier {tier}</span>
          <span className="ml-auto font-mono text-xs text-slate-400">
            {nextThreshold ? `${reputation} / ${nextThreshold}` : 'max tier'}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-700">
          <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-400">Gear</h3>
        <ul className="flex flex-col gap-1">
          {GEAR_MILESTONES.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className={owned.has(m.id) ? 'text-slate-100' : 'text-slate-500'}>
                {owned.has(m.id) ? '✓' : '🔒'} {m.label}
              </span>
              <span className="text-xs text-slate-500">{owned.has(m.id) ? 'owned' : m.requirement}</span>
            </li>
          ))}
          {gear
            .filter((g) => !GEAR_MILESTONES.some((m) => m.id === g))
            .map((g) => (
              <li key={g} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="capitalize text-slate-100">✓ {g.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-500">bought</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-400">Sets</h3>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-300">Family sets complete</span>
          <span className="font-mono text-slate-400">{familySetsComplete} / {familySetsTotal}</span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-300">Locality sets complete</span>
          <span className="font-mono text-slate-400">{localitySetsComplete} / {localitySetsTotal}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Completing a family set sharpens your readings on that family; locality sets open new ground.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 10: Run it to verify it passes**

Run: `./node_modules/.bin/vitest run src/features/rockhound/components/CareerPanel.test.jsx`
Expected: PASS (7 tests)

- [ ] **Step 11: Wire the subtabs into the shell**

In `src/features/rockhound/components/Rockhound.jsx`:

1. Replace the `ProgressionPanel`/`GemdexV5` imports:

```jsx
import GemdexV5 from './GemdexV5.jsx';
import LocalityMap from './LocalityMap.jsx';
import TrophyCase from './TrophyCase.jsx';
import CareerPanel from './CareerPanel.jsx';
```

2. Add the subtab constant next to `TABS`:

```jsx
const TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex'];
const GEMDEX_SUBTABS = ['Species', 'Trophies', 'Career'];
```

3. Delete the `familyProgressFor` helper (lines 18-26) — the Species subtab derives this itself now. Add the `cutTechniquesById` import to the existing cutTechniques import line:

```jsx
import { cutTechniques, cutTechniquesById } from '../../../loaders/cutTechniques.js';
```

4. Add subtab state next to the other `useState` calls:

```jsx
  const [gemdexSub, setGemdexSub] = useState('Species');
```

5. Replace the `CLEAR_NEW` effect so badges only clear when the Species subtab is actually looked at:

```jsx
  useEffect(() => {
    if (tab === 'Gemdex' && gemdexSub === 'Species' && state.newlyDiscovered.length > 0) {
      dispatch({ type: CLEAR_NEW });
    }
  }, [tab, gemdexSub, state.newlyDiscovered.length, dispatch]);
```

6. Replace the whole `{tab === 'Gemdex' && (...)}` block (lines 125-145) with:

```jsx
      {tab === 'Gemdex' && (
        <div className="flex flex-col gap-4">
          <nav className="flex gap-2" aria-label="Gemdex sections">
            {GEMDEX_SUBTABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setGemdexSub(s)}
                aria-current={gemdexSub === s ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  gemdexSub === s
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </nav>

          {gemdexSub === 'Species' && (
            <GemdexV5
              species={species}
              gemdex={state.gemdex}
              newlyDiscovered={state.newlyDiscovered}
              localities={localities}
              unlockedIds={unlockedIds}
              cutTechniquesById={cutTechniquesById}
              bestSpecimens={state.bestSpecimens}
            />
          )}

          {gemdexSub === 'Trophies' && (
            <TrophyCase bestSpecimens={state.bestSpecimens} speciesById={speciesById} />
          )}

          {gemdexSub === 'Career' && (
            <CareerPanel
              reputation={state.reputation}
              gear={state.gear}
              familySetsComplete={completedFams.length}
              familySetsTotal={new Set(species.map((s) => s.family)).size}
              localitySetsComplete={completedLocalities.length}
              localitySetsTotal={localities.length}
            />
          )}
        </div>
      )}
```

- [ ] **Step 12: Update the shell tests for the subtabs**

In `src/features/rockhound/components/Rockhound.test.jsx`, replace the two tests that assert on Gemdex-tab content directly (currently lines 49-53 and 61-65):

```jsx
  it('shows the career panel (reputation) on the Gemdex Career subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Career$/ }));
    screen.getByText(/Reputation/i);
  });

  it('shows the trophy case on the Gemdex Trophies subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Trophies$/ }));
    screen.getByText(/finest cut stone/i);
  });
```

Then add one test proving the subtabs exist and Species is the default:

```jsx
  it('defaults the Gemdex tab to the Species subtab', () => {
    render(<Rockhound />);
    fireEvent.click(screen.getByRole('button', { name: /Gemdex/i }));
    screen.getByRole('button', { name: /^Species$/ });
    screen.getByRole('button', { name: /^Trophies$/ });
    screen.getByRole('button', { name: /^Career$/ });
    screen.getByText(/discovered/i);
  });
```

- [ ] **Step 13: Run the full suite and the build**

Run: `./node_modules/.bin/vitest run`
Expected: PASS — every test green (previous baseline 119 plus the ~35 added here).

Run: `./node_modules/.bin/vite build`
Expected: `✓ built in …`

If the "clears NEW badges once the Gemdex tab is viewed" test (line 31) fails, confirm `gemdexSub` defaults to `'Species'` so the effect still fires on first view.

- [ ] **Step 14: Commit**

```bash
git add -A src/features/rockhound src/features/rockhound/logic/progression.js
git commit -m "feat(gemdex): Species/Trophies/Career subtabs with trophy case and career panel"
```

---

## Verification

After Task 5, drive the real app rather than trusting tests alone:

- [ ] `./node_modules/.bin/vitest run` — all green
- [ ] `./node_modules/.bin/vite build` — clean build
- [ ] Launch the dev server, open Rockhound, and confirm: three subtabs with distinct subtitles; family headings with `n / total`; clicking a discovered gem opens the entry; ✕ / Escape / backdrop all close it; locked cards are inert; NEW badge clears only after visiting Species.
