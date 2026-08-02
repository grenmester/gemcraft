# Explore Roadmap & the Even-Split Doctrine — Design Spec

**Status:** approved in principle; each slice gets its own implementation plan
**Companion:** `2026-08-02-explore-dive-design.md` (slice 1, implementation-grade)

This document holds three things: the standing balance doctrine that governs
how the game's phases relate, an audit of every phase-to-phase link against
it, and the scoped follow-on slices to the Dive.

---

## Part 1 — The Even-Split Doctrine

> **No phase may be skipped, and no phase may be maximised in isolation.**
> Every phase both *consumes* an output of another phase and *raises a
> ceiling* in another. Investing more time or skill in a phase must elevate
> that phase's gains — but a player who neglects a phase should feel a
> **throttle**, not a punishment.

The intended shape of play is a roughly even split of time across Explore,
Identify, Cut, Market and Catalog, with specialisation expressed as *better
returns within a phase*, never as *skipping the others*.

This has three concrete consequences for every future design decision:

**Throttle, not penalty.** A neglected phase should make progress slower and
narrower, never blocked or lost. A player who has ignored cutting still
sells rough — for less. A player who has ignored exploring still identifies
what is on the bench — there is just less of it.

**Advantages are slight, and paid for in time.** Where an active and a
passive route exist for the same thing, the active route should be *modestly*
better per unit of wall-clock time and much better in the tail, not
categorically superior. Players are dividing attention across five phases;
a route that is 10× better is not a choice, it is an obligation.

**Every phase needs an inbound and an outbound link.** A phase with no
inbound link can be skipped. A phase with no outbound link is a dead end
that players will correctly stop investing in.

### Doctrine audit

State after slice 1 lands. Rows are the *source* phase.

| → | Explore | Identify | Cut | Market | Catalog |
| --- | --- | --- | --- | --- | --- |
| **Explore** | — | rough must be ID'd — strong | **forms constrain cuts — new in slice 1** | rough sales; matrix specimens | finds fill the Gemdex — strong |
| **Identify** | reputation gates localities — strong | — | must be ID'd to cut — strong | ID'd rough sells | correct ID enters the Gemdex — strong |
| **Cut** | **— gap —** | **— gap —** | — | cut stones sell far higher — strong | trophy case — medium |
| **Market** | gear gates localities; damping gear in 1b | *(GDD: instruments — unbuilt)* | **— gap —** *(levels are free)* | — | **— gap —** |
| **Catalog** | **locality set → +1 depth — new in slice 1** | family familiarity tightens bands — strong | **— gap —** | *(GDD: certification — unbuilt)* | — |

**Four real gaps, in priority order:**

1. **Cut has no inbound cost at all.** `UNLOCK_TECHNIQUE` and
   `LEVEL_TECHNIQUE` in `RockhoundContext.jsx` do not touch cash; only
   `BUY_GEAR` spends. Every technique can be taken to level 10 without
   exploring, identifying, or earning a cent. This is the doctrine's central
   prohibition — **a phase maximised in isolation** — and it is live in the
   code today. Whatever the fix (cash per level, practice stones consumed,
   reputation-gated tiers), it should be chosen deliberately rather than
   inherited by accident.
2. **Cut → Identify.** Cutting feeds nothing back into identifying. The
   GDD's answer (§10) is **calibration stones**: offcuts become reference
   specimens that sharpen future readings. This closes the only loop that is
   currently one-way.
3. **Market → Identify.** GDD §10 specifies instruments (digital scale,
   dual-wave UV) as permanent precision ceilings bought with cash. Unbuilt.
   `TEST_DEFS` already carries a `gear` field that `Identify.jsx` never
   checks — the hook is half-present.
4. **Catalog → Cut.** Completing a family sharpens identification but does
   nothing for cutting. A species-familiarity bonus to cut success would
   mirror the existing family familiarity exactly.

None of these block the Dive. Gap 1 is the most urgent independently of
Explore, because it is an active doctrine violation rather than a missing
opportunity.

---

## Part 2 — Slice 1b: Damping gear

Supplies the `damping` term that slice 1 defines and sets to zero.

New `SHOP_GEAR` entries bought with cash, each reducing `breakChance`:
shoring timber, a pry bar, a crevice sucker. Gear may be method-specific,
which gives the four tracks distinct shopping lists and prevents a single
purchase from flattening all risk.

Damping must never reach zero risk at depth 3+. Cap total damping such that
the deepest reachable stage always carries a real chance of breaking —
otherwise the push decision stops being a decision.

`market.js` owns the gear table; `dive.js` owns how damping enters
`breakChance`. Neither restates the other.

---

## Part 3 — Slice 2: The idle sieve

### The rule

**Idle works the shallows down to the deepest risk-free stage. It never
gambles.**

```
idleDepth = deepest d where breakChance(d, level, damping) <= IDLE_RISK_TOLERANCE
IDLE_RISK_TOLERANCE = 0.10
```

This is deliberately *not* a fixed cap. As level and damping gear rise, the
risk-free line moves down and the sieve follows it, so idle stays worth
setting up all game. But it always trails, and it trails for a reason that
needs no balance constant: **pushing past the risk-free line is a decision,
and an absent player makes no decisions.**

The consequence is exactly the intended shape from the doctrine: active play
is *slightly* better in expectation and *much* better in the tail. Deep-only
species and high-quality outliers live below the risk line and are
unreachable by idling — permanently, without a single arbitrary number.

It is also diegetic. You leave a sieve running in the creek and it catches
what washes past; nobody is down in the bedrock crevices while you sleep.

### The sieve lives at one locality

The player parks it somewhere. One small strategic decision, no empire to
manage. This is also the cleanest hook for slice 3 — once site conditions
shift, "where is my sieve parked?" becomes a live question.

### The chore problem, and its fix

The game's throttle is the player's own attention in Identify. An idle sieve
that returns twenty unidentified quartz does not reward the player — it
hands them a chore, and works directly against the chosen limiter.

> **Species the player has already catalogued return pre-identified.**
> You know quartz on sight; the game should not make you prove it again.
> Anything *not* yet in the Gemdex returns as rough, flagged
> **"needs your eye."**

This clears the boring bulk and escalates the interesting case — the same
principle GDD §11 assigns to the Lab Assistant, applied one system earlier.
It also makes the sieve a cash-and-commons faucet rather than an
Identify-queue faucet, so the two systems stop fighting.

Offline accrual is capped at `OFFLINE_CAP_HOURS` (GDD default 8).

---

## Part 4 — Slice 3: Living Sites

The highlight/event idea, layered on the Dive rather than built as its own
system.

Locality conditions shift over time — a flood re-sorts the creek, a new
pocket opens in the quarry, a dry season exposes surface float. Conditions
modify **existing Dive terms** rather than introducing new ones:

- shift `depthBias` on particular entries
- raise or lower `breakChance` at that locality
- temporarily lower a `minDepth`, surfacing a deep-only species

Because every effect routes through terms the Dive already owns, this adds
no new player-facing vocabulary — the field guide already displays all of
these numbers.

**Open question deferred to this slice's own brainstorm:** whether rotation
is driven by a wall clock or by an action counter. A wall clock is a
retention-design commitment and is awkward to playtest in bursts; an action
counter ("the creek re-sorts every N expeditions, anywhere") keeps the world
alive without asking players to come back at a particular hour. This should
be decided on its own merits, not inherited.

---

## Part 5 — Deferred, with reasons

| Item | Why deferred |
| --- | --- |
| Matrix specimens in the Trophy Case | Needs a display-slot model the Trophy Case does not have; the sale path in slice 1 already gives matrix a payoff. |
| Explore-produced consumables (GDD §10) | Depends on the Lab Prep ritual, which is unbuilt. Introducing a consumable with no consumer is a dead end under the doctrine. |
| Cut → Identify calibration stones | The highest-priority doctrine gap, but it is an Identify-side feature. Deserves its own brainstorm. |
| Prospecting / read-the-land (GDD §5.4) | Rejected for the MVP: it is analysis, not play. May return as an *optional* information layer once the Dive is proven, never as the core. |
| Sublocations as authored content | Superseded. Depth delivers the same variety through one re-weighting rule instead of thirty hand-authored pools. |
