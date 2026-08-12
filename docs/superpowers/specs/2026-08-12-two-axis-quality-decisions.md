# Two-Axis Quality — decisions taken, ahead of a spec

**Status:** decisions recorded, not yet designed
**Follows:** `2026-08-11-stone-sheet-design.md` (shipped)
**Next step:** brainstorm this into a full spec before planning

Recorded so the reasoning survives the branch that surfaced it. This is not a
spec — it fixes the decisions a spec has to honour.

## The problem this answers

The Stone Sheet made a stone's **natural quality** — carat, colour, clarity —
something the player must *measure*, with an unmeasured trait priced at its
worst case. That rule binds on rough sales. It does not bind on cutting:
`APPLY_CUT` scores the finished stone from the specimen's *true* `colorGrade`
and `clarity` (`RockhoundContext.jsx` → `cut.js:98-99`), so an ungraded stone
could be cut and sold at full value. Measured: an ungraded superb ruby cut for
**1170** against a **792** estimate.

## The model

There are **two independent quality axes**, and the current code conflates them:

| Axis | What it is | Learned by | Belongs to |
| --- | --- | --- | --- |
| **Natural quality** | the stone's own carat, colour, clarity | grading, under a loupe | Identify |
| **Cut quality** | the artisan's skill in shaping it | doing the cut | Cut |

They are **separate values that multiply** into a final price. Cutting must
therefore reveal *nothing* about natural quality — a cut stone's colour was
always its colour; only the workmanship is new.

Today `SCORE_WEIGHTS = { carat: 0.25, color: 0.25, clarity: 0.2, cut: 0.3 }`
(`cut.js:86`) mixes both axes into one **additive** score, frozen at cut time
(`RockhoundContext.jsx:246`), and `stoneValue` reads that single number.

## Decisions

1. **Grading is required to cut.** Cutting is gated on every quality row being
   measured, the way identification already gates it. So "a stone cut before it
   was graded" cannot arise, and no rule is needed for it.
2. **Price becomes `base × naturalFactor × cutFactor`**, replacing the single
   additive score. This also makes "cutting raises the price" *structural* — the
   cut factor takes the place of the uncut discount rather than sitting beside it.
3. **The natural factor uses appraised quality**, i.e. the pessimistic edge
   `max(0, center − band)`, exactly as `roughGradeFactor` already does. Closing
   the exploit via decision 1 does **not** achieve this on its own: a required
   grade still leaves scoring on the band's *centre*, so grading mastery would
   remain inert on the cut path. This is the reason the split is still needed.

## Consequences to design against

- **The Trophy Case ranks on the frozen `score`** (`bestSpecimens`). Splitting the
  axes changes what "best" means, and whether it is computed live or at cut time.
- **Gating cutting on a full grade adds three mandatory measurements** before any
  stone can be cut. That is the busywork risk the Stone Sheet spec explicitly
  guarded against — "Measure everything" must cover grading, and it does, but the
  friction is real and should be watched in playtest.
- **`scoreBreakdown` is shared with already-cut stones**, whose grades legitimately
  *are* known. Any change must keep that path intact.
- `bestCutEstimate` currently feeds appraised quality into `scoreBreakdown` while
  `APPLY_CUT` feeds true quality, so the estimate and the payout disagree by ~30%
  on an ungraded stone. The split should make them agree by construction.
