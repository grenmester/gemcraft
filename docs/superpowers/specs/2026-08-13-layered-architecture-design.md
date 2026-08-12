# Layered Architecture — Design Spec

**Status:** approved, ready to plan
**Type:** pure refactor — no behaviour change, no new features
**Supersedes nothing.** Blocks `2026-08-12-two-axis-quality-decisions.md` (see §10).

## 1. Goal

Restructure the source tree into four explicit layers — data, domain,
viewmodels, ui — plus a state layer, so that each module has one
responsibility and the dependency direction is visible rather than accidental.

Behaviour does not change. Not one rule, formula, or rendered string.

## 2. Why now

The layering this spec makes explicit *already holds informally*. Measured
before writing this spec:

- No domain module imports a view-model. The dependency direction is already
  acyclic; the split is a **move**, not a rewrite.
- The `*View.js` suffix already separates presentation logic from rules.

What does not hold is single responsibility, in five measured places:

| Finding | Evidence |
| --- | --- |
| `RockhoundContext.jsx` is 425 lines holding 5 responsibilities: action constants, state shape, a 229-line reducer, migration, persistence, and the React provider | `rockhoundReducer` spans lines 150–379 with 16 `case` labels |
| It is the codebase's god object | Knowledge-graph betweenness 0.100, bridging 7 of 23 communities — double the next-ranked node |
| Micro-helpers are copy-pasted | `titleize` ×5, `clamp` ×4, `round2` ×4, `loadYaml` ×3, `money` ×2 |
| Presentation is filed as logic | `logic/rarity.js` is hex colours; `logic/gemArt.js` is emoji glyphs and tints |
| Dead code | `shared/utils/requirements.js` (43 lines, zero references) and `getSpecies`/`getCutTechnique`/`getLocality` (defined, never called) |

Scale: 60 source files, 46 test files, 4,518 source LOC. Roughly 60 files move.

## 3. Non-goals

Explicitly out of scope, each for a stated reason:

- **Pruning redundant tests *during the move*.** The 622-test suite is the
  instrument that proves this refactor safe; removing tests in the same change
  that moves code removes the net while walking the wire. Pruning remains a
  goal — it is sequenced as the final phase, after every move commit is green.
  See §11.
- **Tightening leaky exports.** ~20 symbols (`WORST_CASE`, `RUNGS`, `FORM_POOLS`,
  `BASE_ERROR`, …) are exported solely for tests. Un-exporting them requires
  rewriting those tests, which contradicts §7. Recorded, not actioned.
- **Fixing known bugs.** `bestCutEstimate` disagrees with the `APPLY_CUT` payout
  by ~30% on an ungraded stone. It stays wrong, identically wrong, and is fixed
  in a separate visible commit afterwards.
- **The two-axis quality split.** Sequenced after this work — see §10.

## 4. Target structure

```
src/
  main.jsx · App.jsx
  data/
    yaml.js                          loadYaml(raw, schema, filename) — see note below
    species/{species.yaml, schema.js, loader.js}
    localities/{localities.yaml, schema.js, loader.js}
    cutTechniques/{cutTechniques.yaml, schema.js, loader.js}
  domain/                            pure rules: no React, no display strings, no colours
    bench candidates cut dive forms gemTests grading hues identifyResult
    idle market precision progression properties rollRough rungs traits
  viewmodels/                        domain -> props; no JSX
    cutView diveView footerView gemdexView identifyView idleView
    localityView marketView
  state/
    actions.js                       16 action constants
    initialState.js                  state shape + backfillRough migration
    reducer.js                       dispatch table only
    resolve.js                       stillConsistent, resolveSpecimen, admitDugSpecimens
    persistence.js                   STORAGE_KEY, load, save
    handlers/{exploration,identify,cut,economy,debug}.js
    RockhoundProvider.jsx            provider + useRockhound hook
  ui/
    shell/{Rockhound, StatusFooter}
    tabs/{Explore,Identify,Cut,Market,Gemdex,TrophyCase,CareerPanel}
    common/{GemGlyph,EntryModal,TechniqueCard,LocalityCard,PriceBreakdown,
            BenchStrip,SievePanel,GemdexEntry,LocalityEntry,LocalityMap,
            SpeciesCard,TechniqueGuide,DebugPanel}
    theme/{rarity.js, gemArt.js}
  shared/
    math.js                          clamp, round2
    format.js                        money, titleize
```

Two measured corrections to the duplication claim in §2, found while planning:

- **`loadYaml` is not byte-identical across the three loaders** — the copies
  differ in schema binding and error message (three distinct checksums). It
  extracts as a helper *parameterized* over schema and filename, not as a
  copy-paste deletion.
- **`round1` and `mid` are single-use**, in `marketView.js` only. They are not
  duplicated and stay where they are. Only `clamp` (×4), `round2` (×4),
  `titleize` (×5) and `money` (×2) have byte-identical copies to remove.

The `ui/` split follows `Rockhound.jsx`, which declares
`TABS = ['Explore', 'Identify', 'Cut', 'Market', 'Gemdex']` and
`GEMDEX_SUBTABS = ['Species', 'Trophies', 'Career']`. Tab-level screens are
those eight; everything else is a leaf.

`src/features/rockhound/` is removed. It wrapped the entire application, so it
bought one level of nesting and no isolation.

Tests stay colocated with their subjects, matching the existing convention.

## 5. The layer rule

Imports flow **downward only**:

```
data  ->  domain  ->  viewmodels  ->  ui
                \
                 ->  state  ->  ui
```

- `domain` may import `data` and `shared`. Never `viewmodels`, `ui`, `state`,
  or `react`.
- `viewmodels` may import `domain`, `data`, `shared`, and other viewmodels.
  Never `ui` or `state`.
- `state` may import `domain` and `data`. Never `viewmodels` or `ui`.
- `ui` may import anything below it.

**Enforcement:** one test walks every file under `src/domain/` and asserts none
imports from `viewmodels`, `ui`, `state`, or `react`. This is the only new test
this refactor adds, and it fails if a future change reintroduces the tangle.

## 6. Reducer decomposition

`reducer.js` becomes a dispatch table. Each handler is `(state, action) => state`
and stays pure — `now`, `rng`, and id factories continue to arrive in action
payloads, never read from the ambient environment.

| Handler | Actions |
| --- | --- |
| `handlers/exploration.js` | `COLLECT_HAUL`, `PARK_SIEVE`, `COLLECT_SIEVE` (+ `collectSieve`) |
| `handlers/identify.js` | `ADD_ROUGH`, `REVEAL_TRAIT`, `CLEAR_NEW` |
| `handlers/cut.js` | `APPLY_CUT`, `UNLOCK_TECHNIQUE`, `LEVEL_TECHNIQUE` |
| `handlers/economy.js` | `SELL_IDENTIFIED`, `SELL_STONE`, `BUY_GEAR` |
| `handlers/debug.js` | `DEBUG_SET_METHOD_LEVEL`, `DEBUG_ADD_CASH`, `DEBUG_RESET`, `DEBUG_REWIND_SIEVE` |

Shared internals, placed by measured usage rather than by guess:

- `stillConsistent`, `resolveSpecimen`, `admitDugSpecimens` are used by **both**
  the identify and exploration handlers, so they move to `state/resolve.js`.
- `withEarnedGear` is used by a handler **and** by initial-state loading, and is
  a pure progression rule, so it moves to `domain/progression.js`.
- `collectSieve` is used only by exploration, so it moves with that handler.

## 7. The preservation invariant

This is the property that makes a 60-file move reviewable:

> **No test assertion body is modified.**

Every file moves, so every test's *import paths* must change — that is
mechanical and expected. Nothing else in a test file may change. If a test
requires a real edit to pass, that is evidence the move altered behaviour: stop,
revert, and diagnose. It is never resolved by editing the test.

## 8. Renames

- `logic/tests.js` -> `domain/gemTests.js`. It holds gemological instrument
  tests and currently sits beside `tests.test.js`, colliding with the ordinary
  meaning of "tests" in a test suite.
- `components/GemdexV5.jsx` -> `ui/tabs/Gemdex.jsx`. A version number in a
  filename records history that git already records.
- `RockhoundContext.test.js` and `RockhoundContext.persistence.test.jsx` follow
  their subjects into `state/`, and take the `.js`/`.jsx` extension matching
  whether they render components.

## 9. Verification

- The full suite and `vite build` are green at **every** commit, not only at the
  end. The count starts at 622 and ends at 623 — the single layer-rule test from
  §5 is the only test this refactor adds. Any other change in the count means a
  test was lost or duplicated in a move, and must be explained before merge.
- Roughly 12 commits, each one layer or one handler, each independently
  revertible.
- For commits that are pure relocation, `git diff -M` must show renames with no
  content delta beyond import lines.
- Browser smoke check on the merged result: explore -> identify -> grade -> cut
  -> sell, confirming a stone survives the full loop.

## 10. Consequence for the two-axis quality split

`2026-08-12-two-axis-quality-decisions.md` cites `cut.js:86`, `cut.js:98-99`,
and `RockhoundContext.jsx:246`. All three references break here. That document's
**decisions remain valid**; only its line references go stale. It must be
re-pointed at `domain/cut.js` and `state/handlers/cut.js` before it is planned.

This ordering was chosen deliberately: the two-axis work splits one conflated
additive score into two multiplied factors, which lands far more cleanly into
separate domain modules and a 40-line cut handler than into a 229-line reducer.

## 11. Final phase — pruning redundant tests

Runs **only after every move commit in §9 is green**. Never interleaved: the
suite cannot simultaneously be the instrument proving the move safe and the
thing being altered.

A test is removed only on **evidence**, never on the impression that it looks
similar to another. A candidate must meet both criteria:

1. **It is not load-bearing.** Delete the behaviour it claims to guard; the test
   still passes. This is the codebase's existing standard, stated in its own
   constraints: never write a test that passes when the behaviour is removed. A
   test that survives the removal of its own subject was never testing it.
2. **It is genuinely covered elsewhere.** Removing it does not reduce line or
   branch coverage (`pnpm test:coverage`), and the named test that still covers
   the behaviour is identified in the commit message.

   *Prerequisite:* the `test:coverage` script exists in `package.json` but its
   provider does not — `@vitest/coverage-v8` is not installed, so the script
   currently fails. This phase's first commit installs it as a devDependency.
   Without it, criterion 2 cannot be evaluated and no test may be removed.

Both criteria must hold. Criterion 1 alone finds vacuous tests; criterion 2
alone finds duplicated ones; neither is sufficient because a vacuous test may
still be the only thing touching a line, and a covered test may still be the
only one asserting the *rule* rather than merely executing the code.

Additionally removed, without needing the criteria above:

- Tests for code this refactor deletes (`shared/utils/requirements.js` and the
  three unused loader accessors) — the subject is gone.

Explicitly **not** grounds for removal:

- Length, age, or verbosity of a test.
- Testing an internal rather than a public API. Those exports exist for tests
  by deliberate trade (§3); that is not redundancy.
- Two tests covering the same *function* — they are redundant only if they
  assert the same *rule*. A pricing function legitimately needs a test per rule.

Each removal is its own reviewable commit or a small grouped commit, with the
count before and after stated, so the drop from 623 is auditable rather than a
single unexplained collapse.
