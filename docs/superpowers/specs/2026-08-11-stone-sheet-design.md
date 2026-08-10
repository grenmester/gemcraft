# The Stone Sheet — Design Spec

**Status:** approved for implementation
**Supersedes:** slice 4 ("quality spread") of the Identify roadmap, and folds in the tier ladder from slice 3
**Follows:** `2026-08-10-identify-revelation-design.md` (shipped)

## Why

Playtest feedback, four points, one cause:

1. Only the head of the bench is reachable — `Rockhound.jsx` renders `state.rough[0]` with no selector.
2. Tests behave inconsistently: sometimes numbers appear, sometimes the stone vanishes into Cut, and nothing explains either.
3. Cut's stats don't correlate with Identify's tests.
4. The `sorted → species → variety → origin` ladder is nowhere to be seen.

**They are one problem.** The player fills in three rows of a sheet, the stone
disappears, and a *different* sheet with three *different* rows appears in
another tab. Nothing links them and nothing says what kind of thing any number
is.

Point 3 is the deepest, and it is a design gap rather than a UI one. Identify
measures hardness, specific gravity and fluorescence — **species constants**,
which say what a stone *is*. Cut shows carat, colour and clarity — **per-stone
qualities**, which say what it is *worth*. They cannot correlate. Worse, the
quality numbers are rolled at extraction and simply materialise; the player
never measured them.

## The fix

> **One sheet per stone. Every trait on it. Nothing appears that you did not
> measure.**

The player's model becomes *"I am building a complete picture of this stone."*
Each test fills a named row; Cut and Market read the rows you filled.

## 1. The sheet

| Row | Kind | How it is learned | Tells you |
| --- | --- | --- | --- |
| Hue | diagnostic | free — you look | what it is |
| Transparency | diagnostic | free — you look | what it is |
| Hardness | diagnostic | scratch test | what it is |
| Specific gravity | diagnostic | heft in water | what it is |
| Fluorescence | diagnostic | UV lamp | what it is |
| **Carat** | **quality** | **scale — exact** | what it is worth |
| **Colour grade** | **quality** | **loupe — uncertain** | what it is worth |
| **Clarity** | **quality** | **loupe — uncertain** | what it is worth |

The two kinds are visually separated and labelled, because the distinction is
the answer to point 3: *diagnostics identify, grades appraise.* A stone can be
fully identified and completely ungraded, and that is a normal state.

**Carat is exact; colour and clarity are not.** A scale reads 1.52 ct and that
is that. Colour and clarity are judgment calls under a loupe, so they carry a
band that narrows as mastery improves — the same `bandWidth` model the
diagnostics already use. This makes mastery matter for value as well as
identity: a novice's grade is genuinely unreliable.

## 2. The ladder, with rungs that actually exist

The originally specified ladder does not survive contact with the data. Verified
across all four multi-variety families — quartz, garnet, corundum, beryl — **the
varieties have completely disjoint hues.** Since hue is free, the moment the
diagnostics settle the family the free hue has already settled the variety. Ruby
versus sapphire *is* red versus blue. So `species → variety` is not a rung; it
is the same instant.

What the sheet makes real instead:

| Rung | Reached when | Effect |
| --- | --- | --- |
| **Unidentified** | nothing settles it | sells at the worst-case grade |
| **Identified** | diagnostics + hue settle what it is | can be cut; sells honestly once graded |
| **Graded** | every quality row measured | sells for what it is actually worth |
| *Origin* | *later — needs data* | *deferred* |

**Graded is the new rung, and it is the one that makes grading matter.**

## 3. Value: the buyer assumes the worst

No new discount constant. `roughGradeFactor` already reads colour and clarity,
so **an unmeasured quality trait counts as its worst case**. An ungraded stone
therefore prices at the floor (factor 0.5); grading lifts it toward 1.5. A 3×
swing, falling out of the existing formula, and true to life — an ungraded stone
trades below a documented one because the buyer cannot verify it.

**Rough value gains a carat term.** Today `identifiedValue` ignores
`caratWeight` entirely while `stoneValue` weights it — a known inconsistency
already recorded as an open follow-up. Adding it here gives the scale a purpose
and closes that gap. This is a real balance change and is called out as such.

The existing uncut discount is unchanged and independent: it prices the risk a
buyer takes on cutting, whereas the grading discount prices what they cannot
verify. A matrix specimen keeps its exemption from the former.

## 4. What the screen does

**A bench strip.** Every unidentified stone is selectable, showing its glyph,
hue and how complete its sheet is. This closes point 1 — and removes the hazard
that made a stranded stone catastrophic, since the player can simply work on
something else.

**A resolution moment.** When the readings become decisive the identity row
fills in — visibly, in place, naming the stone — instead of the stone silently
teleporting to Cut. The stone then moves on the player's next action rather than
underneath them. This closes point 2.

**Cut and Market read the same rows.** No number appears in either tab that the
player did not measure. An ungraded stone shows its rows as unmeasured in Cut,
with the same "— not measured" treatment the Identify sheet uses, so the
connection is unmistakable. This closes point 3.

## 5. Module boundaries

Rules modules own formulas; view modules delegate and never restate one.

| Module | Owns |
| --- | --- |
| `logic/tests.js` | extended: the three grading observations alongside the three diagnostic tests |
| `logic/traits.js` | unchanged in shape — the revealed record already stores any reading kind |
| `logic/grading.js` *(new)* | which quality rows are measured, and the worst-case substitution for those that are not |
| `logic/market.js` | value keyed on measured quality; the carat term |
| `logic/identifyView.js` | extended: diagnostic and quality sections, the rung, the bench strip's shape |
| `components/Identify.jsx` | the sheet |
| `components/Rockhound.jsx` | bench selection replaces `rough[0]` |
| `components/Cut.jsx`, `PriceBreakdown.jsx` | read measured rows; show unmeasured as unmeasured |

## 6. Testing

- Grading: an unmeasured quality trait prices at its worst case; measuring lifts
  the price; carat reads exactly while colour and clarity carry a band that
  narrows with mastery.
- The ladder: a stone reaches Identified without any quality row measured, and
  Graded only when every one is.
- Bench: selecting a stone changes which sheet is shown; a stone that cannot
  currently be resolved never blocks the others.
- Resolution: the identity row fills in on the reading that settles it, and the
  stone does not leave the bench in the same action.
- Cut and Market: no unmeasured value is ever displayed as though it were known.
- Guard: every value the Market shows traces to a measured row or an explicit
  worst-case substitution — never to a rolled number the player has not seen.

**Project constraints:** `@testing-library/jest-dom` is not installed — native
Vitest matchers and raw DOM reads only. Never use `pnpm exec`. The reducer stays
pure: `now` and `rng` arrive in action payloads.

## 7. Out of scope

| Item | Why |
| --- | --- |
| Instrument minigames | `livePlay` remains a live socket. This spec makes *more* numbers respond to it — grading as well as identification — so a minigame lands with more to affect. Still the single biggest gap for how the tab *feels*. |
| The origin rung | Needs provenance data that does not exist, and every stone already records where it was dug. |
| Splitting colour into hue/tone/saturation | The old slice 4 idea. Three quality rows is enough to prove the model; splitting one of them is a tuning exercise afterwards. |
| Contradiction and synthetics | Unchanged, still last but one. |
| The Lab Assistant | Still last, by your decision — active play gets judged before any of it is automated. |

## 8. Honest risks

**This is the largest single increment attempted here.** It touches Identify,
Cut and Market, and it changes how value is computed. The carat term and the
worst-case substitution are both real balance changes landing together.

**Grading could feel like a chore.** Three extra measurements per stone, on a
bench that may hold fifty. The 3× value swing has to be visible enough to feel
worth it, and "Run all tests" must cover grading too — otherwise this adds
exactly the busywork the previous increment removed.

**It still does not make the tab fun.** Pressing a button is pressing a button.
This makes the numbers cohere and gives them consequence; the skill only enters
the player's hands when a minigame fills `livePlay`.
