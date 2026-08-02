# Explore: The Dive — Design Spec (Slice 1)

**Status:** approved for implementation
**Supersedes:** the single-button Explore in `Explore.jsx`
**Companion:** `2026-08-02-explore-roadmap-design.md` (slices 1b/2/3 and the balance doctrine)

## Goal

Turn Explore from one button that draws a single stone from a static loot
table into a **push-your-luck dive**, where depth is one axis carrying
volume, quality and access, and where what you extract varies in *kind* —
not just in numbers.

## Why this shape

Six decisions fixed the design:

1. **Nothing in Explore is scarce.** Rough is worthless until identified,
   and Identify demands real human judgment. The throttle is the player's
   attention, not a resource. No energy, no cooldown, no wall clock.
2. **Because yield is not scarce, yield is not the reward.** More stones per
   click would only manufacture more Identify chores.
3. **The fun core is one juicy binary, not analysis.** An earlier proposal
   (read four cues per pan, then choose) was rejected: it is homework. Push
   or bank is a single decision with real stakes, made every few seconds,
   followed by a reveal.
4. **Skill is per-method.** Four tracks — panning, hard-rock, geode, surface
   — matching the existing precedents (`cutTechniqueLevel` per technique,
   `testMastery` per test).
5. **Failure escalates.** Cozy at shallow depth, real at depth 3+.
6. **Idle is a later slice**, but its boundary is designed in now.

## 1. The run

A run is a sequence of stages at one locality.

```
start ──► work depth 1 ──► HAUL revealed ──► bank & leave ──► done
                               │
                               └──► "go deeper?" ──► instability roll
                                        ├─ holds ──► work depth d+1 ──► (loop)
                                        └─ breaks ─► consequence, run ends
```

**The instability roll happens on commit to descend, before the next
reveal.** The player never sees a haul and then loses it. The reveal is
always a good moment; the dread lives entirely in the button pressed before
it. Everything already banked from shallower stages is at risk only through
the degrade rules in §4 — never silently deleted.

A run ends when the player banks, when the shaft breaks, or when the
locality's bedrock (`maxDepth`) is reached.

## 2. Depth

### Locality bedrock

Each locality gains `maxDepth`. This is real geology and gives localities
character: a placer creek is shallow, a diamond pipe is not.

| Deposit type | `maxDepth` | Localities |
| --- | --- | --- |
| alluvial | 3 | hidden_creek, gravel_bar |
| volcanic (surface) | 3 | basalt_mesa, opal_flats |
| hydrothermal | 4 | amethyst_vug, muzo_vein |
| pegmatite | 4 | pala_pegmatite |
| metamorphic | 4 | old_quarry, mogok_marble |
| kimberlite pipe | 5 | kimberlite_pipe |

### Player reach

```
reachDepth(level) = 1 + floor(level / 2)
```

Effective reach at a locality is
`min(reachDepth(methodLevel) + setBonus, locality.maxDepth)`, where
`setBonus` is 1 if the player has completed that locality's Gemdex set
(§6), otherwise 0.

Levels run 0–10, matching `successCurve.maxLevel` in `cutTechniques.yaml`.

### The three payoffs

**Volume.**
```
haulSize(depth, level) = 1 + (depth - 1) + floor(level / 3)
```
Depth 1 at level 0 yields exactly one stone — today's button, byte for byte.
Depth 3 at level 6 yields five.

**Quality.** At depth `d`, roll the lerp position `d` times and keep the
best. Expected position climbs 0.50 → 0.67 → 0.75 → 0.80 → 0.83. One rule,
trivially explainable, naturally diminishing. This replaces the bare `rng()`
in `rollRough`'s three `lerp` calls; all three positions roll independently
as they do today.

**Access.** Two new optional fields on each `findPool` entry:

- `depthBias` (default `1.0`) — effective weight becomes
  `weight × depthBias^(depth - 1)`. Below 1 thins with depth, above 1
  concentrates.
- `minDepth` (default `1`) — the entry is excluded from the pool at
  shallower depths. **This is how every locality gets at least one species
  obtainable no other way.**

Worked example — Hidden Creek, currently
`quartz 50 / almandine_garnet 25 / sapphire 20 / topaz 5`, with biases
`0.6 / 1.0 / 1.5 / 1.6` and a `minDepth: 3` entry:

| depth | stones | effective pool |
| --- | --- | --- |
| 1 | 1 | quartz 50 · garnet 25 · sapphire 20 · topaz 5 |
| 2 | 2 | quartz 34 · garnet 28 · sapphire 30 · topaz 9 |
| 3 | 3 | quartz 19 · garnet 24 · sapphire 40 · topaz 17 · **deep-only entry** |

Percentages shown here are the normalised shares the field guide already
renders via `chanceFor` — the UI work for displaying this exists.

## 3. Forms — what you pull out, not just which species

Today `canApply(species, technique)` consults only the species, so where a
stone was dug has no bearing on what can be done with it. **There is
currently no Explore → Cut link at all.** Forms create one, and they make
two geodes genuinely different.

A rough specimen gains a `form`, rolled at extraction.

| form | what it is | cut consequence |
| --- | --- | --- |
| `waterworn` | rounded pebble, crystal faces abraded away | faceting retains ×0.90 — more must be cut away |
| `crystal` | terminated crystal with intact faces | faceting retains ×1.10 — orients cleanly |
| `fragment` | broken chunk off a larger mass | neutral, ×1.00 |
| `nodule` | massive, no crystal form | **cabochon only** — cannot be faceted |
| `druzy` | cavity lined with micro-crystals | **cabochon only** — cannot be faceted |
| `matrix` | crystal still attached to host rock | **not cuttable at all** |

`matrix` is the reward that differs in kind rather than degree. It cannot be
cut, but it sells as a mineral specimen at **full price with no uncut
discount** — intact specimens genuinely outsell cut stones in the real
trade. It is rare, weighted toward depth, and is the clearest single reason
to push.

### Form distribution by method

Deliberately not one-to-one — the same method yields different forms.

| method | waterworn | crystal | fragment | nodule | druzy | matrix |
| --- | --- | --- | --- | --- | --- | --- |
| panning | 70 | 10 | 20 | — | — | — |
| surface | 15 | 10 | 45 | 30 | — | — |
| geode | — | 25 | — | 40 | 35 | — |
| hardrock | — | 40 | 45 | — | 5 | 10 |

Depth biases the roll the same way species are biased: `crystal` and
`matrix` carry `depthBias > 1` (undisturbed pockets lie deep), `waterworn`
and `fragment` carry `depthBias < 1`.

### Data and rule changes forms require

- `cutTechniques.yaml` gains `style: faceted | cabochon` per technique.
  Four are `faceted`; `cabochon` is `cabochon`. This is a real property of a
  cut, not a synthetic flag.
- `cut.js` gains `formAllows(form, technique)` and
  `canApplyToSpecimen(specimen, species, technique)`. `canApply` keeps its
  current species-only meaning and is delegated to — the two must not
  restate each other.
- `applyCut` multiplies `caratRetained` by the form's yield modifier.
- `market.js` owns the matrix no-discount rule. `marketView.js` must
  delegate, never mirror the formula.

### `foundDepth` and the candidate list

A rough specimen records `foundDepth` alongside its existing `origin`.

This is required for correctness, not flavour. `seedCandidates(locality)`
currently returns every species in the locality's pool. Once `minDepth`
exists, a stone dug at depth 1 *cannot* be a deep-only species, yet Identify
would still list it as a suspect — the game would be presenting a candidate
it knows to be impossible.

`seedCandidates` therefore narrows to entries with `minDepth <= foundDepth`.
A pleasing side effect falls out of the correct behaviour: shallow finds
start with a shorter suspect list, and deep finds are genuinely more
mysterious.

## 4. Instability

```
breakChance(depth, level, damping) =
  clamp(0, 0.60, (depth - 1) * 0.15 - level * 0.01 - damping)
```

`damping` is 0 in this slice; gear supplies it in slice 1b. Depth 1 is
always free, so a level-0 player can never lose anything.

**Consequences escalate:**

- **Depth 2 break — cozy.** The bag is shaken. Every stone carried loses
  clarity and carat. Nothing is lost. The run ends.
- **Depth 3 and below — real.** The last stage's haul is lost — the
  deepest and best stones — and everything else degrades. The run ends.

The first time a player can reach depth 3, the UI states the rule change
explicitly, once, before the descent. A break still awards partial XP: a
collapse teaches you something.

## 5. Progression

Four independent tracks stored as `exploreMethodLevel: { panning, hardrock,
geode, surface }`, mirroring `cutTechniqueLevel`.

XP is awarded per completed stage and **scales with depth**, so the risk
loop feeds itself — push deeper, level faster, reach deeper. A broken run
awards 50% of what it had accrued.

**Known risk, and its answer.** The difficulty ramp is pan → surface →
geode → hard-rock ×5, so late play is hard-rock dominated and the early
tracks would go stale. The design already answers this: deep-only species
sit at *every* locality including the creek, and are unreachable until the
relevant track is high. Combined with the set-completion bonus below, a
maxed panning track makes Hidden Creek worth returning to rather than a
graduated-from tutorial.

## 6. Cross-system hooks in this slice

| Source | Effect |
| --- | --- |
| **Gemdex — locality set complete** | **+1 reachable depth at that locality.** Finishing the ground makes it your best ground rather than a dead one. |
| **Explore → Cut** | Forms constrain and modify what a stone can become (§3). This link did not previously exist. |
| **Explore → Market** | Matrix specimens sell without the uncut discount. |
| **Identify → Explore** | Unchanged; reputation still gates which localities open. |
| **Cut/Market → value** | Free. Rough quality is now gambled for, and the existing score and price formulas carry that all the way to the sale. |

## 7. The complexity ramp

Every layer bolts onto a UI the player already knows.

```
L0–1   one button, one haul               ← today's Explore, no new concepts
L2     "Go deeper?" appears               ← push-your-luck arrives, cozy stakes only
L4     depth 3 and the real-loss rule     ← one-time explicit warning
L6+    deep localities, deep-only species, matrix finds
```

Nothing above L2 is visible or mentioned before it is reachable.

## 8. Module boundaries

The project rule holds: rules modules own formulas, view modules delegate
and never restate.

| Module | Owns |
| --- | --- |
| `logic/dive.js` (new) | `reachDepth`, `haulSize`, `breakChance`, `qualityRolls`, run state transitions, break consequences |
| `logic/forms.js` (new) | `FORMS` table, `rollForm(method, depth, rng)`, form yield modifiers |
| `logic/rollRough.js` | extended: depth-biased pool selection, `minDepth` filtering, best-of-`d` quality, `form` on the created specimen |
| `logic/cut.js` | extended: `formAllows`, `canApplyToSpecimen`, form yield in `applyCut` |
| `logic/market.js` | extended: matrix no-discount rule |
| `logic/progression.js` | extended: per-method XP and level thresholds |
| `logic/diveView.js` (new) | presentation shapes for the run UI — delegates to `dive.js` for every number |
| `components/Explore.jsx` | rewritten as the run UI |

## 9. Testing

- `dive.js`: reach, haul size, break chance at boundaries, clamp behaviour,
  both break consequences, XP on completion and on break.
- `forms.js`: distribution sums, depth bias direction, every method yields
  only forms declared for it.
- `rollRough.js`: `minDepth` exclusion, `depthBias` re-weighting normalises
  correctly, best-of-`d` raises the expected position monotonically, a
  `form` and a `foundDepth` are always assigned.
- `candidates.js`: `seedCandidates` never returns a species whose entry
  requires a greater depth than the specimen's `foundDepth`.
- `cut.js`: `matrix` admits no technique; `nodule`/`druzy` admit only
  `style: cabochon`; yield modifiers apply; `canApply` is unchanged for
  existing callers.
- `market.js`: matrix skips the uncut discount; nothing else does.
- Guard test: every locality declares `maxDepth`; every locality has at
  least one entry with `minDepth > 1`.
- Component: level 0 renders exactly one button and no depth affordance;
  level 2 renders the push option; the depth-3 warning appears once.

**Project constraints:** `@testing-library/jest-dom` is not installed — use
native Vitest matchers and raw DOM reads only. Never use `pnpm exec`; run
`./node_modules/.bin/vitest run` and `./node_modules/.bin/vite build`
directly.

## 10. Out of scope

Damping gear (slice 1b), the idle sieve (slice 2), Living Sites (slice 3),
matrix specimens in the Trophy Case, Explore-produced consumables, and the
Cut → Identify calibration link. All are recorded in the roadmap spec.
