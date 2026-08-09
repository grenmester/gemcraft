# AGENTS.md

## What this repo is

A single-page educational gemstone-mining game. The whole app is
`src/features/rockhound/`, mounted by `src/App.jsx` (via `src/main.jsx`).
There is no menu, no other feature area, and no legacy "Discover / Process /
Craft / Inventory" phases — those were retired. `Rockhound.jsx` is the shell
that switches between the feature's own tabs (Explore, Identify, Cut,
Market, Gemdex, career/trophy views).

State lives in `src/features/rockhound/RockhoundContext.jsx`, a single
reducer (`rockhoundReducer`) with action constants exported from that file
(`ADD_ROUGH`, `APPLY_CUT`, `SELL_STONE`, `DEBUG_*`, etc.) and persisted to
`localStorage` under `STORAGE_KEY = 'rockhound_save_v1'`.

## Data and schemas

Game data is YAML under `src/data/`:

- `src/data/species.yaml`
- `src/data/localities.yaml`
- `src/data/cutTechniques.yaml`

Each is validated against a Zod schema in `src/schemas/` (`species.js`,
`localities.js`, `cutTechniques.js`) and loaded through `src/loaders/`
(`species.js`, `localities.js`, `cutTechniques.js`), which parse the raw
YAML at import time and throw if it fails validation. Always read data
through the loaders (`localities`, `getLocality`, `speciesById`, etc.), never
by re-parsing the YAML elsewhere. `src/data/foundation.test.js` cross-checks
the data files against each other (e.g. every species appears in at least
one locality's find pool).

## Rules modules own formulas; view modules delegate

This is the core convention in `src/features/rockhound/logic/` and must not
be violated:

- **Rules modules** own a formula outright and are the only place it is
  written: `dive.js` (depth, reach, break chance, XP curve), `forms.js`
  (crystal habit pools), `cut.js` (cut success/yield), `market.js` (pricing),
  `progression.js` (reputation tiers, familiarity, locality-set completion).
- **View modules** shape those numbers for display and must call into the
  rules module rather than recompute anything: `diveView.js`, `localityView.js`,
  `cutView.js`, `marketView.js`, `footerView.js` (plus `gemdexView.js`,
  `candidates.js`, `rollRough.js` as supporting derivations).

If you need a number a rules module already computes, import it — do not
copy the arithmetic into a component or a view module, even for "just this
one case." When fixing a view-module bug, check whether the rules module
already exposes the right primitive (e.g. `effectiveReach` in `dive.js`)
before adding a new one.

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
3. If you touched `src/data/*.yaml` or `src/schemas/*.js`, re-run the tests
   above — schema validation runs at module-import time and will surface
   YAML/schema mismatches as import failures, not as a separate lint step.

## Notes

- Use `pnpm` over `npm` for installing dependencies, but run test/build
  binaries directly from `node_modules/.bin` as above, not through `pnpm
  exec` or `pnpm run` wrappers, when investigating failures.
- Follow conventional commit style for commit messages.
- Only commit when explicitly asked to.
