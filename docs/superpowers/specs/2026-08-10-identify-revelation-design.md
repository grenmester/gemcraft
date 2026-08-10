# Identify: Revelation (Slice 1) — Design Spec

**Status:** approved for implementation
**Replaces:** the candidate-elimination mechanic in `Identify.jsx`
**Part of:** the Identify revamp, decomposed into five slices (see §8)

## The problem, precisely

`runTest` computes a real reading — a `center` and a `band` — and **that reading is
rendered nowhere.** It goes straight into `eliminate()`, and the only thing the
player ever sees is `SUSPECTS: 4` becoming `SUSPECTS: 3`.

So the player does work and never sees its result, only a side effect. That is the
whole cause of "clicking tests without knowing whether they work."

## The fix

> **Stop identifying by elimination. Identify by revelation.**
> A test does not prune a list — it tells you a number. Identity falls out of the numbers.

You always know what a test will give you before you press it, and afterwards you
have something concrete to read. Nothing is ever pressed blind.

## 1. Traits

A specimen carries four observable traits in this slice.

| Trait | How it is observed | Cost |
| --- | --- | --- |
| **Hue** | you look at it | free, revealed on arrival |
| **Hardness** | scratch test | a test |
| **Specific gravity** | heft in water | a test |
| **Fluorescence** | UV lamp | a test |

**Colour is free because looking is free** — but what you see is a *hue*, not a
species descriptor. A specimen shows one coarse hue (`red`, `blue`, `green`…),
rolled at extraction from its species' colour list and mapped through a shared hue
table. This distinction is load-bearing, and I measured it: matching against a
species' full colour list would let sight alone resolve **89%** of stones and make
the instruments nearly pointless. One coarse hue per specimen resolves **28%** —
leaving 72% genuinely needing instruments.

It also produces exactly the right confusions, which are the textbook ones:
**ruby and spinel both appear red** (the Black Prince's Ruby is famously a spinel),
as do ruby and almandine garnet; emerald and tsavorite are both green; aquamarine
and topaz both blue.

- Hue narrows the field but rarely settles it — and says nothing about which
  mineral it is.
- Hardness, SG and fluorescence separate the families in all ten locality pools —
  but are blind to variety, because ruby and sapphire are the same mineral with
  identical readings.

**Neither alone identifies anything. Together they do.** That is real gemology,
taught by the mechanic rather than by a tooltip.

## 2. Readings

Numeric traits produce `center ± band` from the existing `bandWidth` model. The
categorical trait (fluorescence) produces an exact key. **Both are displayed**:
`SG 4.0 ± 0.3`, `Fluorescence: red / none`.

A species is **consistent** with what you have measured when every revealed trait
fits it:

- numeric — `|species.value − center| ≤ band`
- categorical — exact match
- hue — the specimen's observed hue is among the hues that species can show

Tighter bands admit fewer species. So precision is visible as progress: a sharp
reading collapses the field, a sloppy one barely narrows it.

**A trait may be re-measured.** The narrower reading wins. Without this, a stone
measured badly early could be permanently unresolvable — and "measure it again,
more carefully" is what a gemologist actually does.

## 3. Identity emerges

When exactly one species is consistent with the revealed traits, the stone
**resolves on its own**. No name is guessed and no name is clicked.

This deletes the click-until-right exploit rather than penalising it: today
`COMMIT_IDENTIFY` returns state unchanged on a wrong guess, so a player can try
every candidate for free. Under revelation there is nothing to try.

**The resolved state is exactly today's `identified` state.** The same transition
fires — reputation awarded, Gemdex updated, the stone becomes cuttable and sellable
at full value. Cut, Market, reputation and the Gemdex are untouched by this slice.
Only the route changes.

## 4. Run-all, and what convenience costs

A **Run all tests** button measures every unmeasured trait at once, at the
precision floor (`livePlay` = 0.6, the existing clamp minimum). Measuring by hand
gives a better reading.

So the shortcut is real convenience with a real price, and it does not undermine
progression — it *is* progression's other half, at the scale of a single stone.
It is the same relationship the rocker box has to a dive.

**Mastery is earned by practice, not by luck.** Today `RECORD_TEST_SCORE` stores
`max(livePlay × 100)` where `livePlay` is `Math.random()` — so a player's "test
mastery" is the high-water mark of a random number generator, and rises to 100 by
attrition regardless of skill. This slice replaces that: **a hand-run test raises
that test's mastery a little; a run-all test raises it less.** Convenience costs
learning, which is the honest trade.

## 5. What `livePlay` holds until the minigames arrive

`bandWidth` takes five multipliers and only `familiarity` is wired. This slice
wires `livePlay` with a **deliberate placeholder**: hand-run = 1.0, run-all = 0.6.

That is not skill yet — it is a live socket with the right shape. When a
refractometer or polariscope minigame lands, `livePlay` becomes the minigame's
result and every number in this design starts responding to how well the player
plays. Nothing else has to change.

`instrument` and `labPrep` stay at 1.0; they belong to later slices.

## 6. The screen

The suspect list is replaced by a **trait panel**:

```
Hue               red                     (observed — free)
Hardness          9.0 ± 0.5               [Test]
Specific gravity  — not measured          [Test]
Fluorescence      — not measured          [Test]

Consistent with: Ruby, Spinel, Almandine Garnet    [Run all tests]
```

Unmeasured traits read `— not measured` beside their test button, so the player
always knows what is left and what each button will give them. The consistent-with
line shrinks as evidence accumulates, and when it reaches one the stone resolves.

## 7. A guard the design depends on

One family pair is indistinguishable by these instruments at any precision:
**olivine (peridot) and zoisite (tanzanite)** — ΔSG 0.01, Δhardness 0.00, identical
fluorescence. They never share a locality pool today, so it is unreachable — but
only by luck, and a future locality could pool both.

**A foundation test must assert that no locality pool contains two families
indistinguishable by the available tests.** That turns the design's viability from
a lucky fact into a tested invariant, and it will fail loudly the day someone adds
a locality that breaks it.

**A second guard must pin the sight-resolution rate.** The whole slice rests on
most stones needing instruments; measured today that is 72% ambiguous / 28%
sight-resolvable. A test should assert the ambiguous share stays within a sane band
(60–85%), so a future colour or find-pool edit that quietly makes sight too
powerful — and the instruments pointless — fails loudly instead of silently
hollowing out the mechanic.

## 8. Scope — this slice and the four after it

| Slice | Ships | Status |
| --- | --- | --- |
| **1. Revelation** | this document | **now** |
| 2. Lab Assistant | idle counterpart: names catalogued species, never documents fully, flags what needs your eye | next |
| 3. Instruments & property knowledge | Market sells instruments that unlock *which traits you can measure at all*; the origin rung; the disclosure schedule | later |
| 4. Quality spread | colour splits into hue/tone/saturation; prized = percentile profile; Trophy Case becomes profile-hunting | later, isolated |
| 5. Contradiction & synthetics | readings fitting no species flag a fake or a treatment | later, needs new data |

**Deliberately out of scope here:** any change to reputation, value, cutting, the
Gemdex or the Trophy Case. This slice changes only how a stone gets from rough to
identified.

## 9. Module boundaries

Rules modules own formulas; view modules delegate and never restate one.

| Module | Owns |
| --- | --- |
| `logic/precision.js` | unchanged — `bandWidth`, the five multipliers |
| `logic/tests.js` | extended: trait definitions, `consistentWith(species, reading)` for all three reading kinds including colour |
| `logic/traits.js` *(new)* | the revealed-trait record on a specimen; merging a new reading with an existing one (narrower wins) |
| `logic/identifyView.js` *(new)* | the trait panel's shape — delegates every number |
| `logic/hues.js` *(new)* | the coarse hue table: maps the 32 colour words in `species.yaml` onto ~12 hues, and the hue set each species can show |
| `logic/rollRough.js` | extended: roll one observed `hue` for the specimen, mirroring how `form` was added |
| `RockhoundContext.jsx` | `REVEAL_TRAIT` replaces `RECORD_TEST_SCORE`'s luck-based mastery; resolution fires the existing identify transition |
| `components/Identify.jsx` | rewritten as the trait panel |

## 10. Testing

- `traits.js`: a narrower reading replaces a wider one; a wider reading never
  replaces a narrower; an unmeasured trait reads as absent.
- `tests.js`: colour consistency matches on any listed colour; numeric consistency
  respects the band at both edges; categorical requires exact match.
- Resolution: a stone resolves exactly when one species is consistent, never
  before; the resolved state is byte-identical to today's `identified` state.
- Mastery: a hand-run test raises mastery more than a run-all test; mastery no
  longer moves at random.
- Guard: **no locality pool contains two families indistinguishable by the
  available tests** (§7).
- Guard: every colour word in `species.yaml` maps to a hue — an unmapped word would
  silently make a species unobservable.
- Guard: the sight-resolvable share of stones stays within 15–40% (§7).
- Component: every unmeasured trait shows its test button; a measured trait shows
  its reading and uncertainty; the consistent-with list shrinks as traits are
  revealed; run-all measures everything left.

**Project constraints:** `@testing-library/jest-dom` is not installed — native
Vitest matchers and raw DOM reads only. Never use `pnpm exec`; run
`./node_modules/.bin/vitest run` and `./node_modules/.bin/vite build` directly.
The reducer must stay pure: `now` and `rng` arrive in action payloads.

## 11. Honest risks

**This slice does not add a minigame.** Pressing "Test" is still pressing a button
— but you now know what it will tell you, you see the answer, and the answer
visibly narrows the field. The tedium of *blind* clicking is gone; the *joy* of a
skilful reading arrives with slice 3's instruments and the minigames after them.

**Sight resolves about a quarter of stones outright, and that is uneven by design.**
Basalt Mesa is only 30% ambiguous — obsidian, peridot and agate look nothing alike,
and a beginner *should* identify them at a glance. The deep localities are where
instruments earn their keep: Old Quarry 96%, Muzo Vein 88%, Mogok Marble 86%. So
the tests feel optional early and essential late, which is the right shape but does
mean the mechanic's depth is not visible in the first hour. Worth watching in
playtest rather than pre-tuning.

**The hue table is a judgement call, not data.** Collapsing 32 colour words onto
~12 hues decides how ambiguous the game is. Both guards in §7 exist because that
table is the single most tuning-sensitive thing in this slice.
