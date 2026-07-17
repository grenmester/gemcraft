# Gemstone Collector — Game Design Document (GDD)

> **Version:** 5.0
> **Last Updated:** 2026-07-18
> **Status:** Active Specification — implementation-ready
>
> This document is the **authoritative, self-contained** description of the game: what it is and how every essential system works. A designer or engineer should be able to implement the game from this doc alone. Design rationale and the brainstorming lineage live separately in `docs/superpowers/specs/2026-07-18-gemstone-collector-redesign-design.md`; that context is not required to build from this GDD. v5.0 is a ground-up reconception and supersedes the v4.0 worker/idle design.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Pillars](#2-design-pillars)
3. [Core Loop & The Journey of a Stone](#3-core-loop--the-journey-of-a-stone)
4. [Cross-Cutting UX Principles](#4-cross-cutting-ux-principles)
5. [System: Explore](#5-system-explore)
6. [System: Identify](#6-system-identify)
7. [System: Cut](#7-system-cut)
8. [System: Catalog & Progression](#8-system-catalog--progression)
9. [System: Economy](#9-system-economy)
10. [The Synergy Web](#10-the-synergy-web)
11. [Idle / Active Tradeoffs](#11-idle--active-tradeoffs)
12. [Data Model & Schemas](#12-data-model--schemas)
13. [Runtime State & Core Formulas](#13-runtime-state--core-formulas)
14. [UI / UX Specification](#14-ui--ux-specification)
15. [Progression Pacing & Power Curve](#15-progression-pacing--power-curve)
16. [Tunable Constants](#16-tunable-constants)
17. [Technical Notes](#17-technical-notes)
18. [Build Order / MVP Slice](#18-build-order--mvp-slice)
19. [Glossary](#19-glossary)

---

## 1. Overview

| Field | Value |
| --- | --- |
| **Title** | Gemstone Collector |
| **Genre** | Cozy collection / craft game (active-led, light idle) |
| **Platform** | Web (React + Vite), responsive, desktop-first, mobile-friendly |
| **Audience** | General casual players who enjoy cozy collection & idle games; education is a bonus, not the hook |
| **Session length** | 5 minutes to hours (flexible) |
| **Monetization** | None (passion project) |
| **Multiplayer** | No (single-player; "competitions" are NPC-judged) |

**Elevator pitch.** Travel the world as a rockhound and amateur gemologist-lapidary: read the land to find deposits, dig or pan for rough, puzzle out *what each mystery stone is*, cut the best ones, and build the definitive collection.

**Core fantasy.** Every rough stone is a mystery holding potential. The thrill of discovery meets the satisfaction of figuring it out and revealing its beauty.

**Key differentiators.**
- **Realism *is* the mechanic.** Core actions are real gemological processes (density panning, hardness/SG/UV testing, cleavage-aware cutting, 4C-style grading). Players passively learn real gemology by playing well.
- **Knowledge is progression.** You advance because *you* learned to prospect, identify, and cut — not because a stat number rose.
- **Two collection axes.** Breadth (a full Gemdex) and quality (best-in-species trophies), the latter creating a fishing-game "cast again for a bigger one" itch.

**Reference games.** Rockhound/gem collection fantasy; IdleOn (cross-system synergy buffs); fishing games (specimen stats/traits & competitions); cozy craft/collection games.

---

## 2. Design Pillars

| Pillar | Meaning | Anti-pattern it kills |
| --- | --- | --- |
| **Exploration & Collection first** | The map and the Gemdex are the spine; progress = new places + a fuller case | Grinding one screen for currency |
| **Knowledge is the real progression** | You get further because you learned to prospect, identify, cut | Black-box `efficiency`/`luck` stats; RNG quality |
| **Realism *is* the mechanic** | Every core action is a real gemological process | Real facts as decorative flavor text |
| **Cozy, low-punishment** | Casual pace, satisfying feedback; mistakes teach, they don't gate | Energy walls, harsh fail states |

---

## 3. Core Loop & The Journey of a Stone

```
        ┌──────────── META: fill the Gemdex, win shows, unlock the world ────────────┐
        │                                                                             │
  EXPLORE ─► FIELD-COLLECT ─► IDENTIFY ─► CUT (optional) ─► CATALOG ─► (SELL) ─────────┘
  pick a real   dig / pan /    deduce what   real-cut       Gemdex +     fund next
  locality      crack geode    the rough is  techniques,    trophies +   trip & gear
                (method matters)(test minigames)stats/traits  gem shows    (thin economy)
```

- **Moment-to-moment (seconds–minutes):** run an expedition minigame → get rough → identify a stone via test minigames → optionally cut it → file it / sell it.
- **Session (minutes–hours):** clear the Identify/Cut queues, chase a better specimen, prep the bench, enter a gem show.
- **Meta (across sessions):** raise Reputation and masteries, complete family/regional sets, unlock new localities, win shows, complete the Gemdex.

**The three directions blended (priority B > A > C):**
- **B — spine:** the world map, method-matched expeditions, regional & family collections, cozy travel.
- **A — heart:** Identify and Cut are the optional skill core that makes finds *mean* something.
- **C — thin layer:** a market that funds exploration and gear; a pure collector can largely ignore it.

**Worked example — one stone end-to-end.** You pan a Montana creek (Explore) and pull a glassy, colorless waterworn stone. Candidates at this placer: quartz, topaz, sapphire, zircon (Identify). Streak is useless (all white), so you heft it in water — surprisingly dense — which eliminates quartz; a scratch test past hardness 8 eliminates topaz; the board resolves to **sapphire**. You commit → a **NEW** Gemdex entry pops with real facts. It rolled a good color grade and decent carat weight, so you take it to Cut: you own **Round Brilliant Lv6**, apply it, and the success roll lands — a bright cut sapphire with strong stats. It beats your previous best sapphire (trophy case updates), and you enter it in the season's gem show. That show's rubric wants bigger color, so you head back to a richer sapphire locality — loop restarts.

---

## 4. Cross-Cutting UX Principles

These are binding across every system; they are what keep the game fun rather than instructive-but-tedious.

1. **Visual, never numeric.** The player never does arithmetic or reads a value against a table. The game does all comparison internally and shows it as movement, glow, elimination, and live preview. Raw numbers hide behind an optional **"expert readout"** toggle (off by default).
2. **Fun lives in *doing*; thinking is a reward multiplier.** Engagement = playing short, tactile minigames. Cleverness (efficient test choice, optimal cuts) earns *better rewards & efficiency* but is never a gate — a checked-out player still progresses.
3. **Casual surface, opt-in depth.** Common tasks are one-tap; deep loops are reserved for rare/valuable/new content and are skippable.
4. **Idle routes tedium; active earns trophies + skill.** Idle helpers auto-clear the boring bulk and escalate interesting cases to the player. Only active play grows the player's own mastery; idle caps always trail the player's ability.
5. **Content treadmill beats trivialization.** As masteries climb, harder look-alikes / cuts / rarer species appear that demand that skill, so growth always has a target.
6. **Unified core verb.** Identify and Cut share one loop: *play a themed minigame → raise a mastery/level → that mastery governs your outcomes.*

---

## 5. System: Explore

**Purpose:** find and collect rough. **Teaching payload:** deposit geology — why gems occur where they do and are dug how they are.

### 5.1 World map

A stylized globe of real-world-inspired **locality nodes**, grouped into regions. The player starts at one beginner locality (a local creek). Each locality exposes a **field-guide entry** that fills in as the player learns it: deposit type, host rock, indicator minerals, find pool.

### 5.2 Deposit types → method → finds (the backbone)

| Deposit type | Collection method (minigame) | Signature finds (real) | Example localities |
| --- | --- | --- | --- |
| Alluvial / placer | **Panning** (density) | sapphire, garnet, gold, topaz | Montana, Sri Lanka |
| Pegmatite | **Hard-rock / pocket** | tourmaline, beryl/aquamarine, topaz | Minas Gerais, Pala, Maine |
| Hydrothermal vug | **Geode cracking** | amethyst, agate, emerald (veins) | Brazil/Uruguay, Colombia |
| Metamorphic | **Hard-rock** | ruby, sapphire, jade, lapis | Mogok, Afghanistan |
| Volcanic / arid | **Surface collecting** | peridot, opal, turquoise | Arizona, Coober Pedy |

### 5.3 Expedition minigames (method-matched)

- **Panning** — swirl to wash away light sand; dense gems/gold sink and remain (real gravity concentration).
- **Hard-rock / pocket** — follow indicator signs to a crystal pocket, then split carefully; rushing fractures crystals (lowers carat/clarity of the rough).
- **Geode cracking** — a dull nodule splits to reveal a crystal-lined cavity (satisfying reveal, variable contents).

**Output:** a handful of **unidentified rough** items plus waste matrix. Each rough is created with base stats rolled from the locality's ranges (carat weight, clarity, color grade — see §12.4). A hidden true species is assigned by the find pool's weighted abundance.

### 5.4 Prospecting ("read the land")

Before digging, the player may read clues — surface float, indicator minerals in the pan, host rock — to pick a better spot (raising odds of rarer/better rough). Casual players get gentle hints; knowledge-seekers are rewarded for knowing real tells (e.g., pyrope garnet + chrome diopside → diamond indicators). Optional; never a wall.

### 5.5 Gear (spans all stages; introduced here)

| Gear | Enables |
| --- | --- |
| Gold pan, sieve/classifier | Panning; idle sieve |
| Rock hammer | Hard-rock sites |
| Geode cracker | Geode sites |
| Loupe, UV light, hardness picks, scale | Identify tests (see §6) |
| Cutting tools | Cut techniques (see §7) |

Gear gates methods and tests and is a primary map-unlock lever (§8.4).

### 5.6 Idle-lite

The player may leave a **sieve or tumbler running** at a locality, trickling out a small amount of rough while away (offline, capped ~8h). The single cozy "welcome back" reward — no empire to manage.

---

## 6. System: Identify

Rough comes out of the ground **unidentified**. Figuring out what it is *is* the game — a deduction puzzle (Mastermind/Wordle) played with a real gemologist's toolkit. **This is a signature mechanic.**

### 6.1 Setup

Each rough has a hidden true species with a full property profile (§12.1). The screen shows a **candidate list**, seeded and constrained by two realistic factors:
- **Free observations** shown for free: crystal **habit**, **color**, **transparency**, **luster**.
- **Locality** — candidates are limited to the species that occur in that locality's find pool (~6–12), never thousands of minerals.

### 6.2 Tests as minigames + the precision model (the core)

Each test needs its matching real tool (gear) and costs a little session time / a consumable, so the player can't brute-force every test on every stone. **A test's mastery decides how *precise* the reading is, not whether it passes.**

```
readingBand width = BASE_ERROR[test] / (masteryFactor × instrumentFactor × labPrepFactor × familiarityFactor)
```

- **masteryFactor** — the player's high score for that test's minigame sets the precision *tier*.
- **Live play** places the reading within that tier (play well → sharp end; fumble → fuzzy end), so live tests stay engaging while a casual player still gets the tier baseline.
- **instrumentFactor / labPrepFactor / familiarityFactor** — permanent instrument tier, temporary Lab-Prep buffs, and completed Family Familiarity shift the whole band sharper (the synergy web, §10).

A reading **eliminates a candidate when that candidate's true value for the tested property falls *outside* the reading band.** Wide band → few eliminated; narrow band → many. Precision = discriminating power. The "set of tests a species needs" is therefore emergent — it is whatever resolves that stone's specific look-alike group — not a handed-out recipe.

| Test | Minigame | Real property | Tool |
| --- | --- | --- | --- |
| Scratch / hardness | Lock-pick tension drag (bite vs. skate) | Mohs hardness | hardness picks / glass |
| Heft / SG | Balance-scale / water-line precision | Specific gravity | scale + water |
| Streak | Stroke porcelain at right pressure; read color | Streak | streak plate |
| UV fluorescence | Dark-room lamp sweep; capture glow at peak | Fluorescence | UV flashlight |
| Loupe | Rack-focus hidden-object; spot & tag features | 10× inspection | loupe |
| Spectral (late) | Line-up match onto the fingerprint | Spectroscopy | refractometer/spectroscope |

### 6.3 Presentation — no math, ever

The Identify screen is a **detective board** of candidate cards. As readings arrive, the game compares internally and the board reacts: eliminated candidates **flip / gray / slide off**, and a **"SUSPECTS: N"** counter ticks down. Each reading resolves onto a **visual gauge** (a dial with candidate pins; the reading is a glowing arc — pins outside fade, pins inside stay lit). The player reads *position and glow*, never digits.

### 6.4 Fast lane & cozy fail

- **Common / already-known species → one-tap recognition flick** (no puzzle). The bulk of identification is intentionally low-effort.
- **Mystery / rare / new species → the full puzzle**, with an optional highlighted **"suggested next test"** so a checked-out player never gets stuck.
- **Wrong ID is not an instant loss.** It costs the "clean identification" bonus and the player may re-test. The *real* consequence is deferred to Cut: cutting on a wrong species uses wrong cleavage/ideal-cut data → the stone windows or shatters. A soft per-session **accuracy rating** feeds Reputation.

### 6.5 Payoff

A correct ID writes the species' real profile into the **field notebook / Gemdex** (Mohs, SG, habit, luster, fluorescence, cleavage + a real fact), advances **Family Familiarity**, grants Reputation, and makes the specimen eligible to Cut (safely, since its true properties are now known), Sell, or keep.

---

## 7. System: Cut

Cutting is the **optional depth lane** — a pure collector can sell or display rough and never touch it. It is where Identify pays off, where the biggest "wow" moments live, and it replaces any RNG `quality%`. **Model: pick a leveled technique, roll against your skill.** The fun is leveling techniques via minigames, not executing a per-stone physics procedure.

### 7.1 Cut techniques

Realism lives in *which cuts suit which materials*. A **cut style is a global technique** the player levels once; each **material adds a difficulty modifier** (e.g., corundum is hard; a cleavable topaz cut "boxed" is riskier). This bounds grind while keeping material challenge real.

| Technique | Difficulty | Best for (real) | Value ceiling |
| --- | --- | --- | --- |
| Cabochon | easy | opaque/included/**phenomenal** stones (opal, star sapphire, moonstone) | low–med; reveals phenomena |
| Round Brilliant | medium | most transparent gems, diamonds | high |
| Step / Emerald cut | med–hard | emeralds & brittle stones; shows color/clarity | high |
| Princess / "boxed" | hard | high yield; sharp corners risky | very high |
| Fancy / fantasy cuts | hardest | endgame trophies | highest |

### 7.2 Unlock → level → apply

- **Unlock** a technique by playing its minigame once, well. Each minigame is themed to the cut's real challenge (Round = radial symmetry; Step = parallel-line precision; Cabochon = doming/shape-match) so learning sneaks in.
- **Level** it by replaying (practice mode raises the personal best). Level drives success: **Lv1 ≈ 50% → Lv10 ≈ 90%** (see §13 for the curve).
- **Apply:** cutting a stone = pick an unlocked technique appropriate to the material → success roll = f(technique level, material difficulty, equipment, buffs).

### 7.3 Cozy outcomes

A **fail** usually means a **lower-quality cut** (mediocre stats, lost weight) — still a sellable stone — not a vaporized gem. **Catastrophic loss (shatter) is reserved for the hardest cuts on cleavable stones** (opt-in gambles). Probability shapes the *quality distribution* (fishing-style: you always land something, size varies). If the stone was **misidentified**, Cut presents wrong danger planes / ideal cut → the stone windows or shatters; the loupe offers one last chance to notice.

### 7.4 Specimen stats & traits (the fishing hook)

Every specimen carries stats that accrue across phases, like a fish's weight/length:
- **Rolled at discovery (rough):** **carat weight** (the "size" stat), **clarity**, **color grade** (hue/tone/saturation; prized variants like pigeon-blood ruby, cornflower sapphire).
- **Set when cut:** **cut quality %**, **carat retained** (yield), **symmetry / polish / brilliance**.
- **Trait flags (not universal):** **phenomena** (asterism/star, cat's-eye, color-change, play-of-color — *revealed only by the correct cut*, e.g. a cabochon on a star sapphire), **origin prestige** (Kashmir, Burma), **untreated/natural**.

Stats roll into a **specimen score** and **market value** (§13). This creates the **two collection axes**: breadth (Gemdex) and quality (trophies).

---

## 8. System: Catalog & Progression

The collection spine (B heart). Runs on two axes plus a knowledge-based progression currency.

### 8.1 Gemdex (breadth)

One self-filling **textbook entry** per species, lit on first correct ID (big **NEW** pop): real property profile, facts/lore, source localities, suitable cuts, possible phenomena. Undiscovered species show as **locked silhouettes with a teasing hint** ("forms in pegmatite pockets…"). Tracks X/Y discovered overall, per-region, and per-**family**.

### 8.2 Families → Familiarity

Entries group into real **mineral families** (quartz, beryl, corundum, garnet, feldspar). Completing a family grants **Family Familiarity** — a permanent buff that sharpens both identifying and cutting that family (a synergy-web input; §10). Real taxonomy becomes a mechanical reward.

### 8.3 Trophy case (depth)

The game tracks the player's **best specimen per species** by score. Finest pieces sit in a **cozy display case** the player arranges (cosmetic, prestige, casual-friendly). Beating a personal best is its own small reward and drives locality re-visits.

### 8.4 Reputation & nonlinear map gates

**Reputation** is the progression meter, fed by knowledge & collecting: correct IDs (bonus for hard look-alikes), quality cuts, first discoveries, completing family & regional sets, winning gem shows. Reputation tiers unlock gear/technique tiers and raise ceilings.

Each locality defines its **own** unlock gate, drawn from a menu — sometimes a single requirement, sometimes a combo — so the map is a **branching graph, not a linear ladder**, and playstyle decides what opens first:

```
Creek ─┬─ Gravel Bar ...... gear only (gold pan)             ← gear-buyer path
       ├─ Old Quarry ...... gear only (rock hammer)          ← opens hard-rock early
       ├─ Amethyst Vug .... complete the Creek's set         ← collector path
       ├─ Ruby Marble ..... Reputation tier 3                ← identifier path
       └─ Kimberlite Pipe . Rep 5 + indicator gear + a set   ← flagship combo gate
```

Localities ramp by deposit type as a difficulty curve, teaching geology:
`Alluvial (pan) → Pegmatite (hard-rock) → Geodes → Metamorphic → Kimberlite / Opal fields`.

**Cash can only speed a gate, never replace one** (§9).

### 8.5 Gem Shows (endgame loop)

Periodic **shows** judge specimens against NPC rivals / rotating rubrics — Biggest Carat, Finest Color, Best Star Sapphire, Best Cut, Best-in-Show. Rewards: Reputation, cash, **exclusive techniques/gear/cosmetics**, sometimes access to rare rough/localities. A target trophy sends the player back through Explore → Identify → Cut, closing the meta loop.

---

## 9. System: Economy

**Two currencies, cleanly split:** Reputation/Knowledge = the **gate**; Cash = the **grease**. The player cannot buy their way to the endgame; cash smooths every grind. A pure collector can quick-sell surplus and ignore the rest.

- **Sources:** selling surplus (rough, cut stones, mineral specimens, offcut dust); gem-show prize money; light passive income as idle helpers clear & auto-sell commons.
- **Sinks (all accelerants):** instruments & cutting gear (raise ceilings/caps) · consumables (streak plates, distilled water, grit, dop wax — keep tests/idle/cutting running) · hiring/leveling idle helpers · travel (speed a map unlock) · **certification** (a lab cert adds value + trophy credibility + show prestige) · buying rough / missing species at market (fill a Gemdex gap or feed cutting practice — opt-in).
- **The market teaches:** prices derive from the *real* value drivers in specimen stats — rarity, 4Cs, phenomena, origin, natural/untreated premium, certification. One genuine decision surfaces: **sell rough now for safe cash, or invest cutting time for more value at some risk?** A light, occasional demand shimmer ("emeralds are hot this show season") makes timing mildly strategic — deliberately shallow, never a trading sim.

---

## 10. The Synergy Web

Every system feeds at least one other, pulling players through the whole game for a synergistic payoff; every link is thematically real, so the synergy teaches too. Centerpiece: the **Lab Prep ritual** (analog of IdleOn's "cook a dish → better fishing").

```
   EXPLORE ─────────► consumables (streak plates, distilled water,
     │                UV charges, reference specimens)
     │                        │
     ▼                        ▼
   CUT ──► offcuts &   ┌─► LAB PREP ──► stacking TEMP buffs to the
           calibration │   (clean plate,  next IDENTIFY session
           stones ─────┘   charge lamp,          │
                           calibrate scale)       ▼
   CATALOG ─► complete a family ─► permanent   IDENTIFY (sharper, fewer tests)
              Family Familiarity ───────────►     │
                                                   ▼
   ECONOMY ─► buy instruments ─► permanent    correct IDs raise Reputation →
              (digital scale,     ceilings    unlock deeper localities (EXPLORE),
               dual-wave UV)                   certified prices (ECONOMY),
                                               safe cutting of known species (CUT)
```

- **Two buff flavors:** **permanent** (instruments, family familiarity, technique levels) so the player always feels stronger; **temporary** (Lab Prep) so there's a fun pre-session ritual and moment-to-moment optimization.
- **Consumables** are the connective tissue: produced by Explore/Cut (or bought), consumed by tests and idle helpers — a sink that keeps the player circulating through systems.

---

## 11. Idle / Active Tradeoffs

Each active phase has a light idle counterpart with a "safe but limited" character. General rule: **idle clears the boring bulk and escalates interesting cases to the player; only active grows the player's own mastery; idle caps trail the player's ability.**

| Phase | Idle counterpart | Behavior |
| --- | --- | --- |
| Explore | Sieve / tumbler | Trickles out a little rough while away |
| Identify | **Lab Assistant** (apprentice) | Auto-IDs the queue offline at a **capped precision**; clears easy commons; flags hard look-alikes **"needs your eye"**; **never wrong-IDs** (only "certain" or "uncertain"); consumes consumables; hired/leveled with cash |
| Cut | **Lapidary Apprentice** | Auto-cuts offline at a **capped level** (safe cabochons/standard cuts, no masterwork); refuses risky/valuable rough, flags it **"worth your hand"**; consumes grit/wax; hired/leveled with cash |

Guardrails: idle helpers **cannot raise the player's own mastery**; their caps **always trail** the player's ability; offline progress is capped (`OFFLINE_CAP_HOURS`, default 8).

---

## 12. Data Model & Schemas

All game data lives in human-editable YAML validated by Zod at load time (see §17). Schemas below are the essential shapes; representative examples are given — the full data set is enumerated in `src/data/`.

### 12.1 Species (`items.yaml`)

```yaml
- id: sapphire
  name: Sapphire
  category: Gem              # Gem | Mineral
  family: corundum           # groups for Gemdex + Family Familiarity
  rarity: Rare               # Common | Uncommon | Rare | Epic | Legendary
  # --- diagnostic properties (drive Identify) ---
  hardness: 9.0              # Mohs (point or [min,max])
  specificGravity: 4.00
  habit: [prismatic, tabular]
  luster: vitreous           # vitreous | adamantine | metallic | greasy | pearly | silky | dull
  transparency: transparent  # transparent | translucent | opaque
  colors: [blue, colorless, yellow, pink]
  streak: white
  fluorescence: { longwave: red, shortwave: none }   # per species; null if inert
  refractiveIndex: 1.76
  cleavage: none             # none | poor | good | perfect (+ direction notes)
  fracture: conchoidal
  # --- value / craft ---
  baseValue: 800
  suitableCuts: [cabochon, round_brilliant, step, princess]
  cutDifficulty: 3           # material modifier (1-5), higher = harder to cut
  phenomena:                 # trait flags revealed by a specific cut; omit if none
    - { type: asterism, revealedBy: cabochon }
  occursAt: [montana_placer, mogok_marble, sri_lanka_placer]
  realWorldLocations: [Kashmir, Myanmar, Sri Lanka, Montana]
  funFact: "The 'Black Prince's Ruby' in the Crown Jewels is actually a red spinel."
```

### 12.2 Locality (`localities.yaml`)

```yaml
- id: montana_placer
  name: Montana Creek
  region: north_america
  depositType: alluvial       # alluvial | pegmatite | hydrothermal | metamorphic | volcanic
  method: panning             # panning | hardrock | geode | surface
  hostRock: gravel
  indicatorMinerals: [garnet, magnetite]
  color: "#3b6ea5"
  findPool:                   # weighted; each entry defines base-stat ranges for rolled rough
    - { species: quartz,   weight: 50, caratRange: [0.5, 4], clarityRange: [40, 90], colorRange: [30, 70] }
    - { species: garnet,   weight: 25, caratRange: [0.3, 2], clarityRange: [50, 95], colorRange: [50, 90] }
    - { species: sapphire, weight: 20, caratRange: [0.2, 1.5], clarityRange: [45, 95], colorRange: [40, 95] }
    - { species: topaz,    weight: 5,  caratRange: [0.5, 3], clarityRange: [55, 98], colorRange: [30, 80] }
  unlockGate:                 # heterogeneous; see §8.4. `anyOf`/`allOf` of conditions.
    allOf:
      - { type: gear, id: gold_pan }
```

Gate condition types: `gear` (id), `reputation` (tier), `setComplete` (localityId | familyId), `cash` (amount, optional accelerator). A locality unlocks when its `allOf`/`anyOf` tree is satisfied.

### 12.3 Cut technique (`cutTechniques.yaml`)

```yaml
- id: round_brilliant
  name: Round Brilliant
  difficulty: 2               # 1 (easy) .. 5 (hardest)
  suitableFor: { transparency: [transparent], phenomena: [] }
  unlockMinigame: radial_symmetry
  successCurve: { base: 0.50, perLevel: 0.044, maxLevel: 10 }   # Lv1≈0.50 → Lv10≈0.90
  yieldRange: [0.55, 0.75]    # fraction of carat retained on success
  cutQualityRange: [60, 100]  # % set on success, scaled by level & live play
  catastrophicOnFail: false   # true only for hard cuts on cleavable stones
  revealsPhenomena: []        # e.g. [asterism] for cabochon
```

### 12.4 Specimen instance (runtime)

```typescript
interface Specimen {
  instanceId: string;
  stage: "rough" | "identified" | "cut";
  // identity
  trueSpeciesId: string;             // hidden until identified
  identifiedAs: string | null;       // player's committed ID (may be wrong)
  candidateIds: string[];            // remaining candidates while identifying
  // stats (0-100 unless noted)
  caratWeight: number;               // "size" stat, rolled at discovery
  clarity: number;
  colorGrade: number;
  cutQuality: number | null;         // set on cut
  caratRetained: number | null;      // carats after cut
  symmetry: number | null;
  // traits
  phenomena: string[];               // e.g. ["asterism"]
  origin: string;                    // locality id → prestige lookup
  untreated: boolean;
  certified: boolean;
  // derived (see §13)
  score: number;
  marketValue: number;
}
```

### 12.5 Gear, instruments, consumables, idle helpers

- `gear.yaml` — id, name, cost, enables (method/test ids), unlock notes.
- `instruments.yaml` — id, testId, tier, `precisionMultiplier` (permanent Identify ceiling), cost.
- `consumables.yaml` — id, usedBy (test/helper), sources.
- Idle helpers are player-state records (§13), leveled with cash: `{ level, precisionCap | cutLevelCap, throughputPerHour }`.

---

## 13. Runtime State & Core Formulas

### 13.1 Player state

```typescript
interface PlayerState {
  cash: number;
  reputation: number;                      // progression meter → tiers
  // masteries
  testMastery: Record<string, number>;     // testId → high score (0-100)
  cutTechniqueLevel: Record<string, number>; // techniqueId → level (0 = locked)
  instruments: Record<string, number>;     // testId → owned instrument tier
  familyFamiliarity: Record<string, number>; // family → completion 0-1
  // collection
  gemdex: string[];                        // discovered species ids
  bestSpecimens: Record<string, Specimen>; // speciesId → trophy
  displayCase: Array<{ instanceId: string; slot: number }>;
  // world & gear
  unlockedLocalities: string[];
  gear: string[];
  unlockedTechniques: string[];
  // idle
  labAssistant: { level: number } | null;
  lapidaryApprentice: { level: number } | null;
  identifyQueue: string[];                 // instanceIds
  cutQueue: string[];
  activePrep: Array<{ buffId: string; expiresAfterSessions: number }>;
  consumables: Record<string, number>;
  sieveRunning: { localityId: string } | null;
  // bookkeeping
  lastOnlineTimestamp: number;
  reputationTier: number;
}
```

### 13.2 Identify precision (per test)

```
mastery      = clamp(testMastery[test] / 100, 0.1, 1)          // 0.1..1
instrument   = instruments[test].precisionMultiplier           // e.g. 1.0, 1.5, 2.5
labPrep      = product of active prep buffs for this test      // e.g. 1.0..1.5
familiarity  = 1 + FAMILIARITY_BONUS × familyFamiliarity[fam]  // e.g. 1..1.3
livePlay     = f(minigame performance) in [0.6, 1.0]           // agency within tier

bandWidth    = BASE_ERROR[test] / (mastery × instrument × labPrep × familiarity × livePlay)
reading      = trueValue ± noise(bandWidth)                    // center jitters, shrinks with precision
```

A candidate `c` survives a reading iff `|reading.center − c.trueValue| ≤ bandWidth`. Identification resolves when exactly one candidate remains (positive ID) or the player commits early at partial confidence (risk).

### 13.3 Cut success & stats

```
base       = successCurve.base + successCurve.perLevel × (level − 1)
difficulty = 1 − (species.cutDifficulty − 1) × CUT_DIFFICULTY_STEP     // harder → lower
equipment  = cuttingGearMultiplier                                    // ≥ 1
buff       = active cut prep buffs                                    // ≥ 1
pSuccess   = clamp(base × difficulty × equipment × buff, 0.05, 0.98)

on success: cutQuality = lerp(range, level & livePlay);  caratRetained = caratWeight × yield
on fail:    lower cutQuality, lower yield; if technique.catastrophicOnFail & cleavage≥good → shatter (lost)
misidentified: use WRONG species' cleavage/ideal → high shatter/window chance
```

### 13.4 Specimen score & market value

```
score = w_carat·norm(caratRetained ?? caratWeight)
      + w_color·colorGrade + w_clarity·clarity + w_cut·(cutQuality ?? 0)
      + traitBonus(phenomena, origin, untreated)

marketValue = species.baseValue
            × rarityMultiplier(species.rarity)
            × (0.5 + score/100)                 // grade scales value
            × (certified ? CERT_PREMIUM : 1)
            × demandMultiplier(species.family)  // light, occasional shimmer
```

Uncut rough sells at `ROUGH_DISCOUNT` of the cut value (drives the sell-rough-vs-cut decision). Fine uncut *mineral specimens* (great crystal habit) can be worth keeping/selling as-is.

### 13.5 Idle resolution (on load / tick)

For each queued item up to `throughputPerHour × min(elapsed, OFFLINE_CAP_HOURS)`: the Lab Assistant attempts ID at `precisionCap` — resolves easy commons, else flags "needs your eye"; the Lapidary Apprentice cuts at `min(techniqueLevel, cutLevelCap)`, refusing risky/valuable rough. Both consume consumables; neither grants the player mastery.

---

## 14. UI / UX Specification

### 14.1 Navigation

```
┌───────────────────────────┐
│      GEMSTONE COLLECTOR    │
├───────────────────────────┤
│  🗺  Explore  (world map)  │
│  🔬 Identify (the bench)   │
│  💎 Cut       (lapidary)   │
│  📖 Gemdex    (collection) │
│  🏆 Shows     (competitions)│
│  🛒 Market    (economy)    │
│  ⚙  Bench/Prep + Gear      │
├───────────────────────────┤
│  💰 Cash    ⭐ Reputation   │
└───────────────────────────┘
```

### 14.2 Key screens

- **Explore** — world map with locality nodes (locked/unlocked, gate hints); locality view = field-guide entry + expedition minigame + prospecting hints; idle sieve toggle.
- **Identify (the bench)** — detective board (candidate cards + SUSPECTS counter), visual test gauges, test tool tray, free-observation panel, suggested-test hint, commit button, expert-readout toggle; queue + Lab Assistant panel.
- **Cut (lapidary)** — technique picker (with suitability + success preview), unlock/level minigames, apply/roll with animated result, phenomena reveal moment; queue + Apprentice panel.
- **Gemdex** — breadth grid (families, locked silhouettes, NEW badges, %), per-entry textbook page; **Trophy/Display case** view.
- **Shows** — active rubrics, entry slots, NPC rivals, rewards.
- **Market** — sell (rough vs. cut), buy (gear/instruments/consumables/rough/species), certification, demand ticker.
- **Bench/Prep** — Lab Prep ritual (spend consumables → temp buffs), gear & instrument shop, hire/level idle helpers.

### 14.3 Visual style

- **Theme:** cozy, tactile; dark slate with gold accents (carried from prior identity).
- **Palette:** background `#1a1a2e`, accent `#ffd700`, text `#e0e0e0`.
- **Rarity colors:** Common `#a0a0a0`, Uncommon `#4CAF50`, Rare `#2196F3`, Epic `#9C27B0`, Legendary `#FF9800`.
- **Feel:** satisfying audio on tests/cuts, particle sparkle on reveals, big NEW/phenomena moments. Card-based item displays; 2D with pseudo-3D stone rotation where it sells the fantasy.
- **Responsive:** mobile < 640px, tablet 640–1024px, desktop > 1024px; 44px min touch targets.

---

## 15. Progression Pacing & Power Curve

- **Early (first session):** the beginner creek; panning; identify colorless/obvious commons via 2–3 tests; first NEW entries; basic gear (pan, loupe, hardness picks, scale). Cutting optional and safe (cabochon/round).
- **Mid:** multiple deposit types (hard-rock, geodes) via gear/reputation; harder look-alikes demand better instruments & higher test mastery; more cut techniques; Family Familiarity kicks in; Lab Assistant/Apprentice offload commons; first gem shows.
- **Late:** metamorphic/kimberlite/opal trophy tiers; nastiest look-alikes need advanced tools (refractometer); hardest cuts & fantasy cuts; chasing best-in-species and Best-in-Show; completing the Gemdex and every family/regional set.

The player is always pulled by (a) the next locality, (b) the next NEW, (c) a better trophy, (d) a show rubric, (e) raising a mastery to crack a look-alike or land a hard cut.

---

## 16. Tunable Constants

> All require playtesting; treat as starting points.

| Constant | Default | Notes |
| --- | --- | --- |
| `BASE_ERROR[test]` | per-test | Width of a novice reading; sets discriminating difficulty |
| `FAMILIARITY_BONUS` | 0.3 | Max sharpening from a completed family |
| `livePlay` range | 0.6–1.0 | Agency within a mastery tier |
| `cut successCurve.base / perLevel` | 0.50 / 0.044 | Lv1≈50% → Lv10≈90% |
| `CUT_DIFFICULTY_STEP` | 0.08 | Penalty per material difficulty point |
| `ROUGH_DISCOUNT` | 0.35 | Rough value vs. cut value |
| `CERT_PREMIUM` | 1.25 | Certification market bump |
| `OFFLINE_CAP_HOURS` | 8 | Idle progress cap |
| idle `precisionCap` / `cutLevelCap` | trails player | Always below the player's current ability |
| Reputation tier costs | curve | Gate map/gear/technique tiers |

---

## 17. Technical Notes

- **Stack:** React 18 + Vite, Tailwind CSS v4, state via React Context + `useReducer`, Zod validation, YAML data (`js-yaml` + `import.meta.glob`), Vitest + React Testing Library, Playwright E2E.
- **Data pipeline:** `src/data/*.yaml` → `src/loaders/*.js` → `src/schemas/*.js` (Zod validation at load) → runtime data. Invalid YAML throws descriptive errors at load.
- **Persistence:** localStorage; debounced autosave on state change; offline progress computed on load from `lastOnlineTimestamp`.
- **State discipline:** reducer is immutable (spread/new objects; never mutate `state`).
- **Feature structure:** `src/features/{explore,identify,cut,gemdex,shows,market,bench}` + `shared/` + `context/GameContext.jsx` + `schemas/` + `loaders/` + `data/`.

---

## 18. Build Order / MVP Slice

This design spans several systems; build it as sub-projects (each: spec → plan → implementation).

1. **Data & schema foundation** — species property profiles, families, localities/deposit types + find pools + gates, cut techniques; Zod schemas + loaders. (No UI.)
2. **Explore MVP** — world map, panning minigame, prospecting hints, rough-with-base-stats output, gear gating.
3. **Identify MVP** — candidate board + visual gauges, scratch/heft/UV tests, precision model, fast-lane, cozy fail, notebook/Gemdex writes.
4. **Catalog MVP** — Gemdex + families + familiarity, Reputation, nonlinear map gates, trophy tracking.
5. **Cut MVP** — cabochon + round brilliant, unlock/level minigames, apply-and-roll, specimen stats, first phenomenon (star sapphire).
6. **Synergy web + idle helpers** — Lab Prep, consumables, Lab Assistant, Lapidary Apprentice, offline progress.
7. **Economy + Gem Shows** — market, certification, show loop.

**Recommended first playable:** Sub-project 1, then a thin vertical slice of **Explore(pan) → Identify → Gemdex** to validate the core fun before widening.

---

## 19. Glossary

| Term | Definition |
| --- | --- |
| **Rough** | An unprocessed, possibly unidentified specimen from Explore |
| **Deposit type** | Geological class of a locality (alluvial, pegmatite, etc.) that sets its method & find pool |
| **Find pool** | Weighted set of species (with base-stat ranges) a locality can yield |
| **Candidate board** | The Identify UI showing remaining possible species |
| **Reading / band** | A test result and its precision-driven uncertainty range |
| **Precision** | How narrow a reading is; a function of mastery, instruments, prep, familiarity |
| **Mastery** | The player's high score in a test/cut minigame; sets outcome ceilings |
| **Technique** | A cut style the player unlocks and levels |
| **Specimen score** | Aggregate quality of a specimen from its stats/traits |
| **Phenomenon** | An optical effect (star, cat's-eye, play-of-color) revealed by the correct cut |
| **Family Familiarity** | Permanent buff from completing a mineral family's Gemdex set |
| **Reputation** | Knowledge-based progression meter; gates map/gear/techniques |
| **Lab Prep** | Pre-session ritual converting consumables into temporary Identify buffs |
| **Lab Assistant / Lapidary Apprentice** | Idle helpers that auto-ID / auto-cut commons at capped skill |
| **Gem Show** | NPC-judged competition on specimen stats; endgame reward loop |

---

_This GDD is the authoritative source for game mechanics; implementation should follow it. Balance values are starting points to be validated in playtesting._
