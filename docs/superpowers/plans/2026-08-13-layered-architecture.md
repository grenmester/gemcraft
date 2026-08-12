# Layered Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure 104 files into explicit `data -> domain -> viewmodels -> ui` layers plus a `state` layer, replacing the 425-line `RockhoundContext.jsx` god object, without changing behaviour.

**Architecture:** Bottom-up. Each task moves one layer, starting from the leaves (shared helpers, data) so that every commit leaves the suite green. The reducer split comes last among the moves because it depends on `domain` already being in place. Moves use `git mv` so history is preserved and `git diff -M` can prove a commit is relocation-only.

**Tech Stack:** React 18, Vite, Vitest + React Testing Library (jsdom), Zod, js-yaml, Tailwind CSS v4.

## Global Constraints

These bind every task. They are not suggestions.

- **Never use `pnpm exec`** — it aborts in this non-TTY environment. Run binaries directly: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`.
- **`@testing-library/jest-dom` is NOT installed.** Use native Vitest matchers and raw DOM reads (`getAttribute`, `.disabled`, `.textContent`, `.closest`). `toHaveAttribute` and `toBeInTheDocument` do not exist and are defects.
- **No assertion or expected value in a test may be modified.** What may change in a test file is limited to two things: (a) import paths, and (b) an identifier that mirrors an approved source rename — `GemdexV5` -> `Gemdex` in Task 7 is the only such rename, and it must land in the same commit as the source rename. Everything else — every `expect`, every fixture value, every queried string — is frozen. If a test needs a real edit to pass, the move broke behaviour: stop, revert, diagnose. Never edit a test to match new behaviour.
- **Behaviour does not change.** No rule, formula, constant, or rendered string. Known bugs stay identically wrong (e.g. `bestCutEstimate` disagreeing with the `APPLY_CUT` payout by ~30% on an ungraded stone).
- **Across Tasks 1–10 and 12 the test count stays at exactly 622.** Any change means a test was lost or duplicated in a move, and must be explained before merge.
- **Task 11 is the only task that adds tests, and it adds exactly one FILE.** That file uses `it.each` over the domain's source files, so it contributes one case per file plus a guard — 18 cases at the current 17 domain source modules, taking the suite to 640. The number will drift as domain modules are added or removed; the invariant is *one new test file*, not a fixed total. A per-file case is deliberate: a failure names the offending module instead of reporting one opaque list.
- **Task 13 removes tests deliberately**, under the evidence criteria stated in that task.
- **The reducer and its helpers must stay pure.** No `Date.now()` or `Math.random()`, not even as a fallback. `now`, `rng`, and id factories arrive in action payloads.
- **Rules modules own formulas.** View modules and components delegate and never restate one.
- **The suite and the build must be green at every commit**, not only at the end.
- **zsh `noclobber` is set** — `cat > existing_file` fails with "file exists". Use the Write tool.
- Tests stay colocated with their subjects.

**Verification commands used in every task:**

```bash
./node_modules/.bin/vitest run          # expect: Tests  622 passed (622)
./node_modules/.bin/vite build          # expect: ✓ built in <1s
```

---

### Task 1: Delete dead code

Do this first so 104 files become 103 and no dead code is carried through a move.

**Files:**
- Delete: `src/shared/utils/requirements.js`
- Modify: `src/loaders/species.js` (remove line 22), `src/loaders/cutTechniques.js` (remove line 22), `src/loaders/localities.js` (remove line 22)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This task only removes.

- [ ] **Step 1: Prove the file is unreferenced**

```bash
grep -rn "requirements" src --include='*.js' --include='*.jsx' | grep -v node_modules
```

Expected: only matches inside `src/shared/utils/requirements.js` itself. If anything else appears, STOP — it is not dead.

- [ ] **Step 2: Prove the three accessors are unreferenced**

```bash
for s in getSpecies getCutTechnique getLocality; do
  echo "$s: $(grep -rn "\b$s\b" src --include='*.js' --include='*.jsx' | wc -l)"
done
```

Expected: each reports exactly `1` — the definition line only.

- [ ] **Step 3: Delete**

```bash
git rm src/shared/utils/requirements.js
rmdir src/shared/utils 2>/dev/null || true
```

Then remove these three lines, one per file:

```js
// src/loaders/species.js:22
export const getSpecies = (id) => speciesById[id];
// src/loaders/cutTechniques.js:22
export const getCutTechnique = (id) => cutTechniquesById[id];
// src/loaders/localities.js:22
export const getLocality = (id) => localitiesById[id];
```

- [ ] **Step 4: Verify**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  622 passed (622)` and a successful build. The count does not drop — `requirements.js` had no tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: delete dead requirements util and three unused loader accessors"
```

---

### Task 2: Extract duplicated helpers into shared/

Four helpers are copy-pasted with byte-identical bodies. `round1` and `mid` are NOT duplicated (single-use in `marketView.js`) and must be left where they are.

**Files:**
- Create: `src/shared/math.js`, `src/shared/format.js`
- Modify: `src/features/rockhound/logic/cut.js`, `dive.js`, `idle.js`, `precision.js`, `rollRough.js`, `cutView.js`; `src/features/rockhound/components/GemdexEntry.jsx`, `Market.jsx`, `TechniqueGuide.jsx`, `TrophyCase.jsx`, `TechniqueCard.jsx`, `PriceBreakdown.jsx`

**Interfaces:**
- Produces: `clamp(x, lo, hi)`, `round2(n)` from `src/shared/math.js`; `money(n)`, `titleize(s)` from `src/shared/format.js`. Every later task's moved files import these from `src/shared/`.

- [ ] **Step 1: Create the shared modules**

`src/shared/math.js`:

```js
/** Numeric helpers shared across domain rules. Extracted because four
 *  modules carried byte-identical copies. */

export const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export const round2 = (n) => Math.round(n * 100) / 100;
```

`src/shared/format.js`:

```js
/** Display formatting shared across components. Extracted because five
 *  components carried byte-identical copies of titleize. */

export const money = (n) => `💰 ${Math.round(n).toLocaleString()}`;

export const titleize = (s) => s.replace(/_/g, ' ');
```

- [ ] **Step 2: Confirm every copy is byte-identical before deleting it**

```bash
grep -rhn --include='*.js' --include='*.jsx' -E "const (clamp|round2|titleize|money) =" src | sed 's/^[0-9]*://' | sort | uniq -c
```

Expected: four groups, with counts 4, 4, 5, 2 and exactly one distinct body each. If any group shows two distinct bodies, STOP — the copies have drifted and are not interchangeable.

- [ ] **Step 3: Replace each local definition with an import**

In each of the 12 files, delete the local `const` and add an import. Relative depth differs by directory — from `logic/` and `components/` the path is `../../../shared/`. Example, `src/features/rockhound/logic/cut.js`:

```js
// DELETE these lines:
const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const round2 = (n) => Math.round(n * 100) / 100;

// ADD at the top, beside the existing imports:
import { clamp, round2 } from '../../../shared/math.js';
```

`src/features/rockhound/components/Market.jsx` needs both:

```js
import { money, titleize } from '../../../shared/format.js';
```

- [ ] **Step 4: Verify no local copies survive**

```bash
grep -rn --include='*.js' --include='*.jsx' -E "^const (clamp|round2|titleize|money) =" src
```

Expected: empty output.

- [ ] **Step 5: Verify behaviour**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  622 passed (622)`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: extract duplicated clamp/round2/titleize/money into shared/"
```

---

### Task 3: Build the data layer

Each dataset's YAML, schema, and loader become one directory. The three `loadYaml` functions are the same *shape* but NOT byte-identical — they differ in schema and error message — so the shared helper is parameterized.

**Files:**
- Create: `src/data/yaml.js`
- Move: `src/data/{species,localities,cutTechniques}.yaml` -> `src/data/<name>/<name>.yaml`
- Move: `src/schemas/<name>.js` -> `src/data/<name>/schema.js`
- Move: `src/loaders/<name>.js` -> `src/data/<name>/loader.js`
- Modify: `src/data/foundation.test.js` and every file importing `loaders/` or `schemas/`

**Interfaces:**
- Produces: `loadYaml(rawYaml, schema, filename)` from `src/data/yaml.js`. Loaders keep their existing named exports unchanged: `species`, `speciesById`, `localities`, `localitiesById`, `cutTechniques`, `cutTechniquesById`, `getFindPoolSpecies`, `cutSuccessAtLevel`.

- [ ] **Step 1: Create the parameterized loader helper**

`src/data/yaml.js`:

```js
import { load } from 'js-yaml';

/**
 * Parse a raw YAML string and validate it against its Zod schema.
 * Parameterized over schema and filename because the three datasets differ
 * only in those two bindings — the parse-validate-throw shape is identical.
 */
export function loadYaml(rawYaml, schema, filename) {
  const data = load(rawYaml);
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`❌ Invalid ${filename}:`, result.error.format());
    throw new Error(`${filename} validation failed: ${result.error.message}`);
  }
  return result.data;
}
```

- [ ] **Step 2: Move the files**

```bash
mkdir -p src/data/species src/data/localities src/data/cutTechniques
for n in species localities cutTechniques; do
  git mv src/data/$n.yaml    src/data/$n/$n.yaml
  git mv src/schemas/$n.js   src/data/$n/schema.js
  git mv src/loaders/$n.js   src/data/$n/loader.js
done
rmdir src/schemas src/loaders
```

- [ ] **Step 3: Rewrite each loader to use the shared helper**

`src/data/species/loader.js` becomes:

```js
import { speciesDataSchema } from './schema.js';
import { loadYaml } from '../yaml.js';

const yamlModules = import.meta.glob('./species.yaml', { query: '?raw', import: 'default', eager: true });

const rawYaml = Object.values(yamlModules)[0];
const speciesData = loadYaml(rawYaml, speciesDataSchema, 'species.yaml');

export const species = speciesData.species;
export const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));
```

Apply the same shape to `localities/loader.js` (schema `localitiesDataSchema`, filename `'localities.yaml'`, keeping its existing `getFindPoolSpecies` export) and `cutTechniques/loader.js` (schema `cutTechniquesDataSchema`, filename `'cutTechniques.yaml'`, keeping its existing `cutSuccessAtLevel` export).

**Note the `import.meta.glob` path changed** from `'../data/species.yaml'` to `'./species.yaml'`. Vite resolves this at build time — if it is wrong the build fails with an empty glob, not a test failure. This is why Step 5 runs the build.

- [ ] **Step 4: Update every importer**

```bash
grep -rln --include='*.js' --include='*.jsx' -E "(loaders|schemas)/" src
```

For each file, rewrite `../../../loaders/species.js` -> `../../../data/species/loader.js` and `../../../schemas/species.js` -> `../../../data/species/schema.js`, adjusting `../` depth for the file's location.

- [ ] **Step 5: Verify**

```bash
grep -rn --include='*.js' --include='*.jsx' -E "from '.*(loaders|schemas)/" src
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: the grep is empty; `Tests  622 passed (622)`; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: colocate each dataset's yaml, schema and loader under data/"
```

---

### Task 4: Move the domain layer

17 pure-rule modules move out of `features/rockhound/logic/`, and `tests.js` is renamed to end its collision with the ordinary meaning of "tests".

**Files:**
- Move: `src/features/rockhound/logic/{bench,candidates,cut,dive,forms,grading,hues,identifyResult,idle,market,precision,progression,properties,rollRough,rungs,traits}.js` -> `src/domain/`
- Move + rename: `logic/tests.js` -> `src/domain/gemTests.js`, `logic/tests.test.js` -> `src/domain/gemTests.test.js`
- Move: the matching `*.test.js` for each, plus `logic/identify.test.js` -> `src/domain/identify.test.js`

**Interfaces:**
- Consumes: `src/shared/math.js` (Task 2), `src/data/*/loader.js` (Task 3).
- Produces: every domain module at `src/domain/<name>.js`. `gemTests.js` keeps its existing exports (`GRADE_DEFS`, `TEST_DEFS`, `consistentWithSpecies`, …) under the new filename.

- [ ] **Step 1: Move**

```bash
mkdir -p src/domain
cd src/features/rockhound/logic
for n in bench candidates cut dive forms grading hues identifyResult idle \
         market precision progression properties rollRough rungs traits; do
  git mv $n.js ../../../domain/$n.js
  [ -f $n.test.js ] && git mv $n.test.js ../../../domain/$n.test.js
done
git mv tests.js       ../../../domain/gemTests.js
git mv tests.test.js  ../../../domain/gemTests.test.js
git mv identify.test.js ../../../domain/identify.test.js
cd -
```

- [ ] **Step 2: Fix import depth inside the moved files**

Domain modules previously reached shared and data via `../../../`. From `src/domain/` the correct prefix is `../`:

```bash
grep -rn "\.\./\.\./\.\./" src/domain/
```

Rewrite each hit: `../../../shared/math.js` -> `../shared/math.js`, `../../../data/species/loader.js` -> `../data/species/loader.js`. Sibling imports (`./forms.js`) are unaffected.

- [ ] **Step 3: Update every importer of the moved modules**

```bash
grep -rln --include='*.js' --include='*.jsx' "rockhound/logic/" src
```

Rewrite those specifiers to `src/domain/<name>.js` at the correct relative depth. Every import of `logic/tests.js` becomes `domain/gemTests.js`.

- [ ] **Step 4: Verify**

```bash
grep -rn --include='*.js' --include='*.jsx' "logic/tests.js" src
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: grep empty; `Tests  622 passed (622)`.

- [ ] **Step 5: Confirm the moves are relocation-only**

```bash
git add -A
git diff --cached -M --stat -- src/domain | tail -5
```

Expected: entries shown as renames. Content deltas must be confined to import lines.

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: move pure rule modules to domain/, rename tests.js to gemTests.js"
```

---

### Task 5: Move the viewmodel layer

**Files:**
- Move: `src/features/rockhound/logic/{cutView,diveView,footerView,gemdexView,identifyView,idleView,localityView,marketView}.js` and their `*.test.js` -> `src/viewmodels/`

**Interfaces:**
- Consumes: `src/domain/*` (Task 4), `src/data/*` (Task 3).
- Produces: every view-model at `src/viewmodels/<name>.js`, exports unchanged (`roughPrice`, `stonePrice`, `bestCutEstimate`, `traitPanel`, `panelAt`, …).

- [ ] **Step 1: Move**

```bash
mkdir -p src/viewmodels
cd src/features/rockhound/logic
for n in cutView diveView footerView gemdexView identifyView idleView localityView marketView; do
  git mv $n.js ../../../viewmodels/$n.js
  [ -f $n.test.js ] && git mv $n.test.js ../../../viewmodels/$n.test.js
done
cd -
```

At this point `src/features/rockhound/logic/` should contain only `rarity.js`, `gemArt.js` and their tests.

- [ ] **Step 2: Fix imports inside the moved files**

Sibling domain imports (`./cut.js`) are now cross-layer and must become `../domain/cut.js`. View-to-view imports stay relative (`footerView.js` imports `./diveView.js` and `./localityView.js` — unchanged). Data imports become `../data/<name>/loader.js`.

```bash
grep -rn "from '\./" src/viewmodels/
```

Every hit that names a domain module must be repointed to `../domain/`.

- [ ] **Step 3: Update every importer**

```bash
grep -rln --include='*.js' --include='*.jsx' "logic/.*View" src
```

Rewrite to `src/viewmodels/<name>.js` at the correct depth.

- [ ] **Step 4: Verify**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  622 passed (622)`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move view-models to viewmodels/"
```

---

### Task 6: Move presentation constants to ui/theme

`rarity.js` is hex colours and `gemArt.js` is emoji glyphs and tints. Neither is a rule; both were filed as logic.

**Files:**
- Move: `logic/rarity.js` + `rarity.test.js`, `logic/gemArt.js` + `gemArt.test.js` -> `src/ui/theme/`
- Delete (now empty): `src/features/rockhound/logic/`

**Interfaces:**
- Produces: `rarityColor(rarity)` from `src/ui/theme/rarity.js`; `gemArt.js` keeps its existing exports.

- [ ] **Step 1: Move and remove the empty directory**

```bash
mkdir -p src/ui/theme
cd src/features/rockhound/logic
git mv rarity.js ../../../ui/theme/rarity.js
git mv rarity.test.js ../../../ui/theme/rarity.test.js
git mv gemArt.js ../../../ui/theme/gemArt.js
git mv gemArt.test.js ../../../ui/theme/gemArt.test.js
cd -
rmdir src/features/rockhound/logic
```

- [ ] **Step 2: Update importers**

```bash
grep -rln --include='*.js' --include='*.jsx' -E "logic/(rarity|gemArt)" src
```

Rewrite to `src/ui/theme/<name>.js`.

- [ ] **Step 3: Verify**

```bash
ls src/features/rockhound/
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: only `components/` and the three `RockhoundContext*` files remain; `Tests  622 passed (622)`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move rarity colours and gem art to ui/theme"
```

---

### Task 7: Move the ui layer

22 components split three ways. The classification is taken from `Rockhound.jsx`, which declares `TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex']` and `GEMDEX_SUBTABS = ['Species', 'Trophies', 'Career']` — so tab-level screens are those eight, and everything else is a leaf.

**Files:**
- Move to `src/ui/shell/`: `Rockhound.jsx`, `StatusFooter.jsx` (+ tests)
- Move to `src/ui/tabs/`: `Explore.jsx`, `Identify.jsx`, `Cut.jsx`, `Market.jsx`, `TrophyCase.jsx`, `CareerPanel.jsx` (+ tests), and `GemdexV5.jsx` -> `Gemdex.jsx`, `GemdexV5.test.jsx` -> `Gemdex.test.jsx`
- Move to `src/ui/common/`: `BenchStrip.jsx`, `SievePanel.jsx`, `GemGlyph.jsx`, `EntryModal.jsx`, `GemdexEntry.jsx`, `LocalityCard.jsx`, `LocalityEntry.jsx`, `LocalityMap.jsx`, `PriceBreakdown.jsx`, `SpeciesCard.jsx`, `TechniqueCard.jsx`, `TechniqueGuide.jsx` (+ tests), and `src/shared/components/DebugPanel.jsx` (+ test)

**Interfaces:**
- Consumes: `src/viewmodels/*`, `src/ui/theme/*`, `src/shared/format.js`.
- Produces: `src/ui/shell/Rockhound.jsx` (default export `Rockhound`) and `src/ui/common/DebugPanel.jsx` (default export `DebugPanel`), both imported by `App.jsx` in Task 10.

- [ ] **Step 1: Move**

```bash
mkdir -p src/ui/shell src/ui/tabs src/ui/common
cd src/features/rockhound/components
for n in Rockhound StatusFooter; do
  git mv $n.jsx ../../../ui/shell/$n.jsx
  [ -f $n.test.jsx ] && git mv $n.test.jsx ../../../ui/shell/$n.test.jsx
done
for n in Explore Identify Cut Market TrophyCase CareerPanel; do
  git mv $n.jsx ../../../ui/tabs/$n.jsx
  [ -f $n.test.jsx ] && git mv $n.test.jsx ../../../ui/tabs/$n.test.jsx
done
git mv GemdexV5.jsx      ../../../ui/tabs/Gemdex.jsx
git mv GemdexV5.test.jsx ../../../ui/tabs/Gemdex.test.jsx
for n in BenchStrip SievePanel GemGlyph EntryModal GemdexEntry LocalityCard \
         LocalityEntry LocalityMap PriceBreakdown SpeciesCard TechniqueCard TechniqueGuide; do
  git mv $n.jsx ../../../ui/common/$n.jsx
  [ -f $n.test.jsx ] && git mv $n.test.jsx ../../../ui/common/$n.test.jsx
done
cd -
git mv src/shared/components/DebugPanel.jsx      src/ui/common/DebugPanel.jsx
git mv src/shared/components/DebugPanel.test.jsx src/ui/common/DebugPanel.test.jsx
rmdir src/shared/components src/features/rockhound/components
```

- [ ] **Step 2: Rename the component identifier**

In `src/ui/tabs/Gemdex.jsx`, rename the function and its default export from `GemdexV5` to `Gemdex`:

```js
export default function Gemdex({ ... }) {
```

In `src/ui/tabs/Gemdex.test.jsx`, only the import line and the identifier change — **no assertion body changes**:

```js
import Gemdex from './Gemdex.jsx';
```

- [ ] **Step 3: Fix imports across ui/**

Components previously reached logic via `../logic/` and loaders via `../../../loaders/`. Now: `../../viewmodels/`, `../../domain/`, `../../data/<name>/loader.js`, `../../shared/format.js`, `../theme/rarity.js`. Sibling components move between `shell/`, `tabs/`, and `common/`, so cross-directory imports need `../common/GemGlyph.jsx` style paths.

```bash
grep -rn "from '\.\./logic\|from '\.\./\.\./\.\./" src/ui/
```

Every hit must be repointed.

- [ ] **Step 4: Verify no stale references remain**

```bash
grep -rn --include='*.js' --include='*.jsx' "GemdexV5" src
grep -rn --include='*.js' --include='*.jsx' "components/" src | grep -v "ui/"
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: both greps empty; `Tests  622 passed (622)`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move components to ui/{shell,tabs,common}, rename GemdexV5 to Gemdex"
```

---

### Task 8: Extract actions, initial state, and persistence

The first of three cuts into `RockhoundContext.jsx`. This one is pure extraction — no logic changes, only relocation of top-level declarations.

**Files:**
- Create: `src/state/actions.js`, `src/state/initialState.js`, `src/state/persistence.js`
- Modify: `src/features/rockhound/RockhoundContext.jsx` (imports what it used to declare)

**Interfaces:**
- Produces:
  - `src/state/actions.js` — the 16 constants: `ADD_ROUGH`, `REVEAL_TRAIT`, `CLEAR_NEW`, `UNLOCK_TECHNIQUE`, `LEVEL_TECHNIQUE`, `APPLY_CUT`, `SELL_IDENTIFIED`, `SELL_STONE`, `BUY_GEAR`, `COLLECT_HAUL`, `DEBUG_SET_METHOD_LEVEL`, `DEBUG_ADD_CASH`, `DEBUG_RESET`, `PARK_SIEVE`, `COLLECT_SIEVE`, `DEBUG_REWIND_SIEVE`.
  - `src/state/initialState.js` — `initialRockhoundState` (object), `backfillRough(rough)`.
  - `src/state/persistence.js` — `STORAGE_KEY` (`'rockhound_save_v1'`), `loadInitialState()`, and the save side-effect used by the provider.
- Consumes: `withEarnedGear` from `src/domain/progression.js` (moved in Step 2 below).

> **Locate every declaration by NAME, not by line number.** This task removes
> code from `RockhoundContext.jsx` step by step, so any line number is stale the
> moment the previous step runs. Where a line range is given below it describes
> the file as it stood *before this task began* — recover that original with
> `git show HEAD:src/features/rockhound/RockhoundContext.jsx` if you need it.

- [ ] **Step 1: Create `src/state/actions.js`**

Move the 16 `export const *_* = '...'` action constants verbatim (originally lines 20–35):

```js
export const ADD_ROUGH = 'ADD_ROUGH';
export const REVEAL_TRAIT = 'REVEAL_TRAIT';
export const CLEAR_NEW = 'CLEAR_NEW';
export const UNLOCK_TECHNIQUE = 'UNLOCK_TECHNIQUE';
export const LEVEL_TECHNIQUE = 'LEVEL_TECHNIQUE';
export const APPLY_CUT = 'APPLY_CUT';
export const SELL_IDENTIFIED = 'SELL_IDENTIFIED';
export const SELL_STONE = 'SELL_STONE';
export const BUY_GEAR = 'BUY_GEAR';
export const COLLECT_HAUL = 'COLLECT_HAUL';
export const DEBUG_SET_METHOD_LEVEL = 'DEBUG_SET_METHOD_LEVEL';
export const DEBUG_ADD_CASH = 'DEBUG_ADD_CASH';
export const DEBUG_RESET = 'DEBUG_RESET';
export const PARK_SIEVE = 'PARK_SIEVE';
export const COLLECT_SIEVE = 'COLLECT_SIEVE';
export const DEBUG_REWIND_SIEVE = 'DEBUG_REWIND_SIEVE';
```

- [ ] **Step 2: Move `withEarnedGear` to the domain layer**

It is a pure progression rule (gemdex + reputation -> gear) used by both a handler and initial-state loading. Cut the whole `function withEarnedGear(gemdex, reputation, currentGear)` out of `RockhoundContext.jsx` and append it to `src/domain/progression.js`, adding `export`. Copy the body verbatim — do not retype it.

- [ ] **Step 3: Create `src/state/initialState.js`**

Move the `initialRockhoundState` object literal and the `backfillRough` function verbatim. Keep both exported — `initialRockhoundState` has 58 test references and `backfillRough` has 2.

- [ ] **Step 4: Create `src/state/persistence.js`**

Move the `STORAGE_KEY` constant (`'rockhound_save_v1'`) and the `loadInitialState` function verbatim. `loadInitialState` imports `initialRockhoundState` and `backfillRough` from `./initialState.js`, and `withEarnedGear` from `../domain/progression.js`.

- [ ] **Step 5: Re-export from the old location so nothing breaks yet**

`RockhoundContext.jsx` deletes those declarations and adds:

```js
import { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE } from '../../state/actions.js';
import { initialRockhoundState, backfillRough } from '../../state/initialState.js';
import { STORAGE_KEY, loadInitialState } from '../../state/persistence.js';
import { withEarnedGear } from '../../domain/progression.js';

export { ADD_ROUGH, REVEAL_TRAIT, CLEAR_NEW, UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE,
         APPLY_CUT, SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
         DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET, PARK_SIEVE,
         COLLECT_SIEVE, DEBUG_REWIND_SIEVE, initialRockhoundState, backfillRough, STORAGE_KEY };
```

This re-export is temporary scaffolding, removed in Task 10.

- [ ] **Step 6: Verify**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  622 passed (622)`. `RockhoundContext.jsx` should now be roughly 300 lines.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: extract actions, initial state and persistence from RockhoundContext"
```

---

### Task 9: Split the reducer into handlers

The core of the refactor. A 229-line function with 16 cases becomes a dispatch table over five handlers grouped by domain.

**Files:**
- Create: `src/state/reducer.js`, `src/state/resolve.js`, `src/state/handlers/{exploration,identify,cut,economy,debug}.js`
- Modify: `src/features/rockhound/RockhoundContext.jsx`

**Interfaces:**
- Consumes: `src/state/actions.js`, `src/state/initialState.js` (Task 8), `src/domain/*` (Task 4).
- Produces:
  - `src/state/resolve.js` — `stillConsistent(specimen)`, `resolveSpecimen(state, specimen)`, `admitDugSpecimens(state, specimens)`. These three are shared by the identify and exploration handlers, which is why they are not inside either.
  - Each handler exports one function `(state, action) => state`.
  - `src/state/reducer.js` — `rockhoundReducer(state, action)`, same signature and behaviour as today. 89 test references depend on this name.

**Handler-to-action map:**

| Handler | Actions |
| --- | --- |
| `handlers/exploration.js` | `COLLECT_HAUL`, `PARK_SIEVE`, `COLLECT_SIEVE` (plus the private `collectSieve` helper, used only here) |
| `handlers/identify.js` | `ADD_ROUGH`, `REVEAL_TRAIT`, `CLEAR_NEW` |
| `handlers/cut.js` | `APPLY_CUT`, `UNLOCK_TECHNIQUE`, `LEVEL_TECHNIQUE` |
| `handlers/economy.js` | `SELL_IDENTIFIED`, `SELL_STONE`, `BUY_GEAR` |
| `handlers/debug.js` | `DEBUG_SET_METHOD_LEVEL`, `DEBUG_ADD_CASH`, `DEBUG_RESET`, `DEBUG_REWIND_SIEVE` |

> **Locate declarations by NAME.** Task 8 already removed code from
> `RockhoundContext.jsx`, so all original line numbers are stale. The
> pre-refactor file is recoverable with
> `git show <commit-before-task-8>:src/features/rockhound/RockhoundContext.jsx`.

- [ ] **Step 1: Create `src/state/resolve.js`**

Move the functions `stillConsistent`, `resolveSpecimen`, and `admitDugSpecimens` verbatim from `RockhoundContext.jsx`, adding `export` to each. They import from `../domain/gemTests.js` and `../domain/identifyResult.js` as they did before.

- [ ] **Step 2: Create the five handlers**

Each handler takes the `case` bodies verbatim from `rockhoundReducer` and returns the same object. Shape for `src/state/handlers/economy.js`:

```js
import { SELL_IDENTIFIED, SELL_STONE, BUY_GEAR } from '../actions.js';

export function economyHandler(state, action) {
  switch (action.type) {
    case SELL_IDENTIFIED: {
      // body copied verbatim from RockhoundContext.jsx
    }
    case SELL_STONE: {
      // body copied verbatim
    }
    case BUY_GEAR: {
      // body copied verbatim
    }
    default:
      return state;
  }
}
```

Apply the same shape to `explorationHandler`, `identifyHandler`, `cutHandler`, and `debugHandler`. **Copy bodies verbatim.** Any change to arithmetic, ordering, or object spread is a behaviour change and violates the global constraints.

- [ ] **Step 3: Create `src/state/reducer.js` as a dispatch table**

```js
import * as A from './actions.js';
import { explorationHandler } from './handlers/exploration.js';
import { identifyHandler } from './handlers/identify.js';
import { cutHandler } from './handlers/cut.js';
import { economyHandler } from './handlers/economy.js';
import { debugHandler } from './handlers/debug.js';

// Which handler owns which action. Grouped by domain rather than by action
// name so that a change to, say, selling touches exactly one file.
const HANDLERS = {
  [A.COLLECT_HAUL]: explorationHandler,
  [A.PARK_SIEVE]: explorationHandler,
  [A.COLLECT_SIEVE]: explorationHandler,
  [A.ADD_ROUGH]: identifyHandler,
  [A.REVEAL_TRAIT]: identifyHandler,
  [A.CLEAR_NEW]: identifyHandler,
  [A.APPLY_CUT]: cutHandler,
  [A.UNLOCK_TECHNIQUE]: cutHandler,
  [A.LEVEL_TECHNIQUE]: cutHandler,
  [A.SELL_IDENTIFIED]: economyHandler,
  [A.SELL_STONE]: economyHandler,
  [A.BUY_GEAR]: economyHandler,
  [A.DEBUG_SET_METHOD_LEVEL]: debugHandler,
  [A.DEBUG_ADD_CASH]: debugHandler,
  [A.DEBUG_RESET]: debugHandler,
  [A.DEBUG_REWIND_SIEVE]: debugHandler
};

export function rockhoundReducer(state, action) {
  const handler = HANDLERS[action.type];
  return handler ? handler(state, action) : state;
}
```

- [ ] **Step 4: Point the old location at the new reducer**

Delete `rockhoundReducer` and the five helpers from `RockhoundContext.jsx`; import and re-export instead:

```js
import { rockhoundReducer } from '../../state/reducer.js';
export { rockhoundReducer };
```

- [ ] **Step 5: Verify — this is the highest-risk task**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  622 passed (622)`. The reducer suite alone carries 89 references; a single transcription slip will surface here. If any test fails, the cause is a mis-copied body — fix the handler, never the test.

- [ ] **Step 6: Confirm the reducer's unknown-action behaviour is unchanged**

The original ended with `default: return state;`. The dispatch table returns `state` for an unmapped action, which is the same. Confirm no test asserts a throw on unknown actions:

```bash
grep -rn "unknown action\|UNKNOWN" src/state/ src/features/rockhound/
```

Expected: no test expects a throw. If one does, the table must throw instead.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: split the 229-line reducer into five domain handlers"
```

---

### Task 10: Land the provider and delete features/

**Files:**
- Create: `src/state/RockhoundProvider.jsx`
- Move: `RockhoundContext.test.js` -> `src/state/reducer.test.js`, `RockhoundContext.persistence.test.jsx` -> `src/state/persistence.test.jsx`
- Delete: `src/features/rockhound/RockhoundContext.jsx` and the `src/features/` tree
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `RockhoundProvider` and `useRockhound` from `src/state/RockhoundProvider.jsx`.

- [ ] **Step 1: Create `src/state/RockhoundProvider.jsx`**

Move the remaining four declarations verbatim — the `createContext` call, `RockhoundProvider`, `useRockhound`, and the `useEffect` that persists to localStorage. By this point they are all that is left in `RockhoundContext.jsx`. It imports `rockhoundReducer` from `./reducer.js` and `loadInitialState` from `./persistence.js`.

- [ ] **Step 2: Move the two test files**

```bash
git mv src/features/rockhound/RockhoundContext.test.js            src/state/reducer.test.js
git mv src/features/rockhound/RockhoundContext.persistence.test.jsx src/state/persistence.test.jsx
```

Their import lines change to `./reducer.js`, `./initialState.js`, `./actions.js`, `./RockhoundProvider.jsx`. **No assertion body changes.**

- [ ] **Step 3: Delete the old context and the features tree**

```bash
git rm src/features/rockhound/RockhoundContext.jsx
rmdir src/features/rockhound src/features
```

- [ ] **Step 4: Update `src/App.jsx`**

```jsx
import { RockhoundProvider } from './state/RockhoundProvider.jsx';
import Rockhound from './ui/shell/Rockhound.jsx';
import DebugPanel from './ui/common/DebugPanel.jsx';
```

The JSX body is unchanged.

- [ ] **Step 5: Verify the tree is clean**

```bash
grep -rn --include='*.js' --include='*.jsx' -E "features/rockhound|RockhoundContext" src
ls src/
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: grep empty; `src/` contains exactly `App.jsx`, `App.test.jsx`, `main.jsx`, `setupTests.js`, `data/`, `domain/`, `shared/`, `state/`, `ui/`, `viewmodels/`; `Tests  622 passed (622)`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: land RockhoundProvider in state/, delete the features/ tree"
```

---

### Task 11: Enforce the layer rule

The only test this refactor adds. Without it the layering decays back to accidental.

**Files:**
- Create: `src/domain/layering.test.js`

**Interfaces:**
- Consumes: `node:fs`, `node:path` — no application code.

- [ ] **Step 1: Write the test**

`src/domain/layering.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN_DIR = dirname(fileURLToPath(import.meta.url));

// The domain layer holds pure rules. It may reach DOWN to data and shared,
// never UP to the things that present or store it. React in particular must
// never appear here: a rule that imports React has become a component.
const FORBIDDEN = ['viewmodels/', 'ui/', 'state/', 'react'];

const sourceFiles = readdirSync(DOMAIN_DIR).filter(
  (f) => f.endsWith('.js') && !f.endsWith('.test.js')
);

describe('domain layer isolation', () => {
  it('has source files to check', () => {
    // Guards the whole suite: if the glob silently returns nothing, every
    // assertion below vacuously passes and the rule stops being enforced.
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it.each(sourceFiles)('%s imports nothing from an upper layer', (file) => {
    const source = readFileSync(join(DOMAIN_DIR, file), 'utf8');
    const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    const violations = specifiers.filter((s) =>
      FORBIDDEN.some((bad) => s === bad || s.includes(bad))
    );
    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 2: Prove the test can fail**

Temporarily add `import { useState } from 'react';` to `src/domain/cut.js`, then:

```bash
./node_modules/.bin/vitest run src/domain/layering.test.js
```

Expected: FAIL, naming `cut.js` with `['react']`. **Remove the temporary import.** A test that cannot fail is not a test.

- [ ] **Step 3: Verify**

```bash
./node_modules/.bin/vitest run && ./node_modules/.bin/vite build
```

Expected: `Tests  623 passed (623)` — the one added test.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: enforce that the domain layer never imports upward"
```

---

### Task 12: Browser smoke check

Automated tests do not exercise the real Vite build with real YAML loading. The `import.meta.glob` paths changed in Task 3, and a broken glob fails at runtime, not in jsdom.

**Files:** none — verification only.

- [ ] **Step 1: Start the dev server**

```bash
./node_modules/.bin/vite --port 5173
```

- [ ] **Step 2: Walk the full loop**

In the browser at `http://localhost:5173`, confirm each of these:

1. The app loads with no console errors.
2. **Explore** — a locality is selectable and a dig produces at least one rough stone.
3. **Identify** — the bench strip lists the stone; running a test reveals a trait; grading all three quality rows moves the stone to the `graded` rung.
4. **Cut** — the graded stone appears and can be cut.
5. **Market** — both a rough and a cut stone show a price, and "Why this price" opens the breakdown modal.
6. **Gemdex** — the species grid renders with glyphs and rarity rings (this proves `ui/theme` still resolves).
7. Reload the page — state persists (this proves `persistence.js` still reads `rockhound_save_v1`).

- [ ] **Step 3: Record the result**

If every step passes, note it in the commit message of the final task. If any fails, that is a real regression from the move — diagnose before merging.

---

### Task 13: Prune redundant tests

**Runs only after Tasks 1–12 are green.** Never interleaved: the suite cannot simultaneously be the instrument proving the move safe and the thing being altered.

**Files:**
- Modify: `package.json` (add devDependency)
- Delete: individual test cases meeting both criteria below

- [ ] **Step 1: Install the coverage provider**

`test:coverage` exists in `package.json` but `@vitest/coverage-v8` is not installed, so the script currently fails.

```bash
pnpm add -D @vitest/coverage-v8
./node_modules/.bin/vitest run --coverage
```

Expected: a coverage table. Record the baseline line and branch percentages — every later step compares against these.

- [ ] **Step 2: Commit the tooling separately**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install @vitest/coverage-v8 so coverage can gate test pruning"
```

- [ ] **Step 3: Apply both criteria to each candidate**

A test is removed only when **both** hold:

1. **Not load-bearing** — delete the behaviour it claims to guard; the test still passes. A test that survives the removal of its own subject was never testing it.
2. **Genuinely covered elsewhere** — removing it does not reduce line or branch coverage, and the named test that still covers the behaviour is identified.

Neither alone is sufficient: a vacuous test may still be the only thing touching a line, and a covered test may still be the only one asserting the *rule* rather than merely executing the code.

**Not grounds for removal:** length, age, or verbosity; testing an internal rather than a public API (those exports exist for tests by deliberate trade); two tests covering the same *function* — they are redundant only if they assert the same *rule*.

- [ ] **Step 4: Remove in small, auditable commits**

Each commit states the count before and after, and names the test that still covers the behaviour:

```bash
./node_modules/.bin/vitest run   # confirm the new count
git commit -m "test: remove <name> — vacuous (passes with <subject> deleted), covered by <other test>

Tests: 623 -> 621"
```

- [ ] **Step 5: Final verification**

```bash
./node_modules/.bin/vitest run --coverage
./node_modules/.bin/vite build
```

Expected: line and branch coverage no lower than the Step 1 baseline. If coverage dropped, a removal was wrong — restore it.

---

## Completion

After Task 13, use **superpowers:finishing-a-development-branch** to merge. The repository's history is linear by preference — rebase or fast-forward, do not create a merge commit.

Then re-point `docs/superpowers/specs/2026-08-12-two-axis-quality-decisions.md`, whose three line references (`cut.js:86`, `cut.js:98-99`, `RockhoundContext.jsx:246`) this plan invalidates. Its decisions remain valid; only the references go stale. New locations: `src/domain/cut.js` and `src/state/handlers/cut.js`.

Finally, `graphify . --update` — every path in the knowledge graph changed.
