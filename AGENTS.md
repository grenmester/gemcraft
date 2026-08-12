# AGENTS.md

## What this repo is

A single-page educational gemstone-mining game, mounted by `src/App.jsx`
(via `src/main.jsx`). There is no menu, no other feature area, and no legacy
"Discover / Process / Craft / Inventory" phases — those were retired.
`src/ui/shell/Rockhound.jsx` is the shell that switches between the app's
own tabs (Explore, Identify, Cut, Market, Gemdex, career/trophy views).

The app is organized into layers rather than one feature folder:

- `src/data/` — YAML game data plus its schemas and loaders
- `src/domain/` — pure rules, no React, no display strings
- `src/viewmodels/` — domain -> props shaping for the UI
- `src/state/` — the reducer, action constants, handlers, and persistence
- `src/ui/{shell,tabs,common,theme}/` — components
- `src/shared/` — small helpers used across layers (`math.js`, `format.js`)

Each layer may only import from its own layer or the ones below it in that
list; nothing in `src/domain/` may import from `viewmodels/`, `ui/`,
`state/`, or React. `src/domain/layering.test.js` enforces this
mechanically (walking `src/domain/` recursively and scanning every import
specifier) — treat it as the executable version of this rule, not just
advice in this doc.

State lives in `src/state/`: `RockhoundProvider.jsx` wires a single reducer
(`rockhoundReducer`, in `reducer.js`) with action constants exported from
`actions.js` (`ADD_ROUGH`, `APPLY_CUT`, `SELL_STONE`, `DEBUG_*`, etc.).
`reducer.js` is a dispatch table keyed by action type, routing to handlers
grouped by domain in `src/state/handlers/` (`exploration.js`, `identify.js`,
`cut.js`, `economy.js`, `debug.js`) rather than one large switch, so a
change to, say, selling touches exactly one file. `initialState.js` builds
the starting state; `resolve.js` holds logic shared by more than one
handler (e.g. whether a stone's identity has settled). `persistence.js`
owns `STORAGE_KEY`, `loadInitialState()`, and `saveState()`; state is
persisted to `localStorage` under `STORAGE_KEY = 'rockhound_save_v1'`.

## Data and schemas

Game data is YAML, one directory per dataset under `src/data/`:

- `src/data/species/species.yaml`
- `src/data/localities/localities.yaml`
- `src/data/cutTechniques/cutTechniques.yaml`

Each dataset directory holds the YAML alongside its own `schema.js` (a Zod
schema) and `loader.js`, which parses the raw YAML at import time through
the shared `loadYaml(rawYaml, schema, filename)` helper in `src/data/yaml.js`
and throws if it fails validation. Always read data through a loader's
exports (e.g. `species`/`speciesById` from `src/data/species/loader.js`,
`localities`/`localitiesById`/`getFindPoolSpecies` from
`src/data/localities/loader.js`), never by re-parsing the YAML elsewhere.
`src/data/foundation.test.js` cross-checks the data files against each
other (e.g. every species appears in at least one locality's find pool).

## Rules modules own formulas; view modules delegate

This is the core convention of the `src/domain/` / `src/viewmodels/` split
and must not be violated:

- **Rules modules** (`src/domain/`) own a formula outright and are the only
  place it is written: `dive.js` (depth, reach, break chance, XP curve),
  `forms.js` (crystal habit pools), `cut.js` (cut success/yield), `market.js`
  (pricing), `progression.js` (reputation tiers, familiarity, locality-set
  completion) — plus supporting pure derivations such as `candidates.js`
  and `rollRough.js` that state handlers and view modules both draw on.
- **View modules** (`src/viewmodels/`) shape those numbers for display and
  must call into the rules module rather than recompute anything:
  `diveView.js`, `localityView.js`, `cutView.js`, `marketView.js`,
  `footerView.js`, `gemdexView.js`, `identifyView.js`, `idleView.js`.

If you need a number a rules module already computes, import it — do not
copy the arithmetic into a component or a view module, even for "just this
one case." When fixing a view-module bug, check whether the rules module
already exposes the right primitive (e.g. `effectiveReach` in
`src/domain/dive.js`) before adding a new one.

Locality bedrock (`maxDepth` in `localities.yaml`) caps how deep any method
can ever go, regardless of player level — `reachDepth(level)` alone is not
the truth players experience; `effectiveReach(level, maxDepth, setComplete)`
is. Anything that reports "how deep can this method reach" must derive its
ceiling from the loader's locality data, not hard-code a number.

## Testing

- Test runner is Vitest (`vitest.config` lives inside `vite.config.js`),
  environment `jsdom`, setup file `src/setupTests.js`.
- **Never use `pnpm exec`.** Run the binaries directly:
  - `./node_modules/.bin/vitest run`
  - `./node_modules/.bin/vite build`
- `@testing-library/react` is installed; `@testing-library/jest-dom` is
  **NOT**. There are no `toHaveAttribute`, `toBeInTheDocument`, or other
  jest-dom matchers available — if you see one, it's a defect. Use native
  Vitest matchers and read the DOM directly (`el.getAttribute(...)`,
  `el.textContent`, `el.disabled`, `screen.getByRole(...)`, etc.).
- `getByText`/`getByRole` match accessible names built from direct child
  text, not full `textContent`. Anchor ambiguous queries precisely (e.g.
  `/^Hidden Creek,/` for a locality card, not a bare `/Hidden Creek/`, which
  also matches the field-guide button).
- There is no end-to-end/browser test suite in this repo — everything is
  Vitest + jsdom. Do not add Playwright or similar; it was deliberately
  removed because it drove a UI that no longer exists.

## Validation before considering a task complete

1. `./node_modules/.bin/vitest run` — all tests must pass.
2. `./node_modules/.bin/vite build` — must succeed with no errors.
3. If you touched `src/data/**/*.yaml` or `src/data/**/schema.js`, re-run
   the tests above — schema validation runs at module-import time and will
   surface YAML/schema mismatches as import failures, not as a separate
   lint step.

## Notes

- Use `pnpm` over `npm` for installing dependencies, but run test/build
  binaries directly from `node_modules/.bin` as above, not through `pnpm
  exec` or `pnpm run` wrappers, when investigating failures.
- Follow conventional commit style for commit messages.
- Only commit when explicitly asked to.
