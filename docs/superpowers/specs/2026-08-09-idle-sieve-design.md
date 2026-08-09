# Explore: The Idle Sieve (Slice 2) — Design Spec

**Status:** approved for implementation
**Supersedes:** Part 3 of `2026-08-02-explore-roadmap-design.md`, which assumed idle would pre-identify catalogued species
**Companion:** `2026-08-02-explore-dive-design.md` (slice 1, shipped)

## Goal

Give the player something working while time passes — a device left at one
locality that accumulates rough — **without letting automation advance
discovery, and without letting the unidentified pile grow unbounded.**

## The two rules that shape everything

1. **The sieve catches only species already in the Gemdex.** Discovery is
   active play, always. A locality's undiscovered species are invisible to
   the sieve no matter how long it runs.
2. **Everything it catches arrives unidentified**, exactly as an active find
   does. The sieve produces material, never progress.

Together these make the sieve a *volume* supplement rather than a shortcut:
it can only give you more of what you have already earned, and you still
have to sit down and identify it.

A pleasing inversion falls out. **The sieve is most productive where you
have already finished the work** — park it at a locality whose set you have
completed and it can catch everything there; park it somewhere half-explored
and it catches only the species you know. That reinforces the existing
"complete the set → +1 depth" bonus rather than competing with it.

## 1. Where it can reach

`idleDepth` is the deepest stage whose break chance is at or under
`IDLE_RISK_TOLERANCE` (0.10), clamped to the locality's `maxDepth`.

The sieve never gambles, and it does not need a balance constant to stay
behind active play: **pushing past the risk-free line is a decision, and an
absent player makes no decisions.** Against the real `breakChance` formula
this yields:

| Method level | Idle reaches |
| --- | --- |
| 0–4 | depth 1 |
| 5–10 | depth 2 |
| any | **never depth 3** — `breakChance(3, 10)` is 0.20, twice the tolerance |

So the deep-only prizes at `minDepth` 3–4 stay permanently active-only, with
no arbitrary cap. Hidden Creek's topaz (`minDepth: 2`) becomes reachable at
method level 5 — a real, legible reward for levelling.

## 2. How much it yields

```
idleRate(level)      = IDLE_BASE_RATE + level * IDLE_RATE_PER_LEVEL   // 1 + level * 0.15 per hour
accruedHours(t0, t1) = clamp((t1 - t0) / MS_PER_HOUR, 0, IDLE_CAP_HOURS)   // cap 8
yieldCount           = floor(accruedHours * idleRate(level))
```

Eight stones at level 0, twenty at level 10, for a full eight hours. A
handful, not a flood. The rate scales with the same method level that sets
`idleDepth`, so a parked sieve stays worth maintaining all game.

**Accrual is wall-clock and unconditional** — the sieve fills whether the app
is open or closed. This is simpler than distinguishing foreground from
background, and it removes any incentive to quit the game to farm.

## 3. What it catches

The catchable pool is the locality's find pool at `idleDepth`, **intersected
with the player's Gemdex**, with weights renormalised across the survivors.
Depth bias and `minDepth` apply exactly as in active play, because the same
`effectivePool` computation is reused.

If the intersection is empty the sieve catches nothing. **This must be
surfaced before the player parks, not after.** A sieve left where the player
knows nothing would otherwise sit for eight hours and return an empty box.
The park control states what it can actually catch — *"can catch 3 of 4
species here"* — and refuses to promise otherwise.

## 4. The bench cap

`BENCH_CAP = 50` unidentified stones. Its purpose is to keep the player
circulating through the other phases rather than hoarding rough.

**Work already done is never destroyed:**

| Action | At or over the cap |
| --- | --- |
| Banking a haul | **Always succeeds.** You ran the risk; you keep the stones, even if that pushes you over. |
| Starting a run | Blocked, with the reason stated. |
| Collecting the sieve | Blocked. Accrued time is not lost — it stays capped at 8 hours until you make room. |
| Moving the sieve | Blocked *only if* there is pending yield to collect, since moving collects first. Parking for the first time is always allowed. |

The block on moving matters: without it, park-cycling would collect past the
cap and the limit would mean nothing.

The footer already shows a bench count; it gains the cap (`🪨 12/50`) so the
pressure is visible before it bites.

## 5. Acquisition and placement

A new purchasable **rocker box** in `SHOP_GEAR`. This gives the Market a
second reason to exist — cash currently has 420 gold of sinks in the entire
game — and means idle is earned rather than granted.

The device is parked from the **run screen**, where the player is already
standing at the locality and there is room for the control. The map stays as
decluttered as the previous increment left it.

The **collect banner lives on the Explore map**, because that is the screen
the player lands on. It is the "welcome back" moment: *"Your rocker box
worked Hidden Creek for 8 hours — 12 stones."*

Only one locality at a time. One small strategic decision, no empire to
manage — and the cleanest hook for slice 3, where shifting site conditions
would make "where is it parked?" a live question.

## 6. State and purity

Two additions:

```js
gear:  [...]                                   // gains 'rocker_box' when bought
sieve: null | { localityId: string, since: number }   // since = epoch ms
```

`since` resets to `now` on every collect and every move, so accrual always
measures from the last time the box was emptied.

**The reducer stays pure.** `COLLECT_SIEVE` and `PARK_SIEVE` take `now` and
`rng` in their payloads, exactly as `APPLY_CUT` already takes `rng`. No
`Date.now()` or `Math.random()` is called inside the reducer.

**Debug needs no clock abstraction.** Rather than a global time offset, the
debug panel rewinds `sieve.since`: "simulate 8 hours" sets it to
`now − 8h`. Same observable effect, no indirection anywhere in the app.

## 7. Module boundaries

Rules modules own formulas; view modules delegate and never restate one.

| Module | Owns |
| --- | --- |
| `logic/idle.js` *(new)* | `idleDepth`, `idleRate`, `accruedHours`, `pendingYield`, and the idle constants. Reuses `breakChance` from `dive.js` — never restates it. |
| `logic/bench.js` *(new)* | `BENCH_CAP`, `benchFull`, `benchSpace`. Shared, because the cap gates active runs as well as idle collection. |
| `logic/rollRough.js` | extended: `catchablePool(findPool, depth, allowedSpecies)`, and `rollRough` gains an optional species filter. **One extraction implementation**, so the UI's "can catch 3 of 4" count and the actual roll can never disagree. |
| `logic/idleView.js` *(new)* | the banner and park-control shapes. Delegates every number. |
| `RockhoundContext.jsx` | `sieve` state; `PARK_SIEVE`, `COLLECT_SIEVE`, `DEBUG_REWIND_SIEVE` |
| `components/SievePanel.jsx` *(new)* | the collect banner on the map |
| `components/Explore.jsx` | the park control; the run-start block at the cap |
| `components/StatusFooter.jsx` | bench count against the cap |

## 8. Testing

- `idle.js`: `idleDepth` is 1 below level 5 and 2 from level 5, and never 3
  at any level; clamps to a shallow locality's `maxDepth`; `accruedHours`
  clamps at both ends and never goes negative if a clock moves backwards;
  `yieldCount` at the documented level/hour boundaries.
- `bench.js`: `benchFull` at 49, 50 and 51; `benchSpace` never negative.
- `rollRough.js`: a species filter excludes everything outside it; an empty
  filtered pool yields nothing rather than throwing; without a filter,
  behaviour is byte-identical to today (the existing tests are the proof).
- Reducer: collecting adds unidentified stones only, grants **no**
  reputation and **no** Gemdex entry; collecting at the cap is a no-op that
  preserves `since`; moving with pending yield collects first; moving at the
  cap with pending yield is a no-op; a first park is always allowed.
- Component: the park control states the catchable count; a sieve parked
  where nothing is catchable says so; the run-start button is disabled at
  the cap with the reason given; the banner shows the count and clears
  after collecting.
- Guard: every species the sieve returns is already in the Gemdex — the
  central rule of this spec, asserted directly.

**Project constraints:** `@testing-library/jest-dom` is not installed — use
native Vitest matchers and raw DOM reads only. Never use `pnpm exec`; run
`./node_modules/.bin/vitest run` and `./node_modules/.bin/vite build`
directly.

## 9. Out of scope, with reasons

| Item | Why |
| --- | --- |
| A cost for a wrong identification guess | `RockhoundContext.jsx` returns state unchanged on an incorrect guess, so clearing a backlog is click-until-right and the bench cap adds clicks rather than dynamism. The real fix — test minigames, a wrong-guess consequence, and the dead `livePlay` skill slot — belongs to the Identify increment, together. **Recorded as the top reason to do Identify next.** |
| Grouping the Cut tray | Twenty stones arriving at once will make a flat unsorted column long. Cosmetic, and better judged once the volume is real. |
| Damping gear (slice 1b) | `damping` is threaded through `breakChance` and still always 0. `idleDepth` accepts it so the sieve deepens automatically when it lands. |
| Living Sites (slice 3) | Unchanged; the parked sieve is its hook. |
