# Gemstone Collector — Ground-Up Redesign (Design Spec)

> **Version:** 1.0
> **Date:** 2026-07-18
> **Status:** Design approved — pending spec review, then decomposition into implementation plans
> **Supersedes (conceptually):** `docs/gdd.md` v4.0 and `docs/todo/main.md` — this is a ground-up reconception, not an edit of the prior worker/idle design.

---

## 0. Purpose & how to read this

This spec captures a full ground-up redesign of *Gemstone Collector*. The prior design mapped generic idle-game math (worker `efficiency`/`luck` stats, 5% rare-drop rolls, a black-box `quality%`) onto gem names — the real gemology was only decorative flavor. This redesign makes **real gemological processes the mechanics themselves**, so that learning is a byproduct of playing well.

It is intentionally large (six interlocking systems). It is a *design* spec, not an implementation plan. Section 12 proposes how to decompose it into buildable sub-projects, each of which will get its own `spec → plan → implementation` cycle.

---

## 1. Direction (the decisions this rests on)

Locked with the user during brainstorming:

| Fork | Decision |
| --- | --- |
| Scope | **Ground-up reconception** (free to change the core fantasy/loop; stays a gemstone game) |
| Realism vs fun | **Realism *is* the fun** — core mechanics derived from real gemology; education is automatic |
| Idle vs active | **Active-led**, with light idle counterparts for retention (not an idle empire) |
| Audience | **General casual players** — cozy collection/idle fans; education is a bonus, not the hook |
| Blend priority | **B > A > C**: Exploration/Collection (spine) > Identify/Cut craft depth (heart) > Economy (nice-to-have) |

### Player fantasy

You are a traveling **rockhound and amateur gemologist-lapidary**. You journey to real-world-inspired localities, dig/pan for rough, puzzle out *what each mystery stone is*, optionally cut the good ones, and build the definitive collection. The world opens up as your knowledge and reputation grow.

### Design pillars

| Pillar | Meaning | Anti-pattern it kills |
| --- | --- | --- |
| **Exploration & Collection first** | The map and the Gemdex are the spine; progress = new places + a fuller case | Grinding one screen for currency |
| **Knowledge is the real progression** | You get further because *you* learned to prospect, identify, and cut | Black-box `efficiency`/`luck` stats; RNG quality |
| **Realism *is* the mechanic** | Every core action is a real gemological process | Real facts as decorative flavor text |
| **Cozy, low-punishment** | Casual pace, satisfying feedback; mistakes teach, they don't gate | Energy walls, harsh fail states |

### Core loop

```
        ┌──────────────── META: fill the Gemdex, win shows, unlock the world ─────────────┐
        │                                                                                  │
  EXPLORE ──► FIELD-COLLECT ──► IDENTIFY ──► CUT (optional) ──► CATALOG ──► (SELL) ─────────┘
  pick a real   dig / pan /     deduce what   real-cut         Gemdex +      fund next
  locality      crack geode     the rough is  techniques,      trophies +    trip & gear
                (method matters) (test minigames) stats/traits  gem shows     (thin C layer)
```

- **B (spine):** the world map, method-matched expeditions, regional/family collections, cozy travel.
- **A (heart):** Identify and Cut are the optional skill core that makes finds *mean* something.
- **C (thin layer):** a market that funds exploration and gear; a pure collector can largely ignore it.
- **Idle stance:** mostly active; each active phase has one light idle counterpart (see §9).

---

## 2. Cross-cutting design principles

These apply to every system and are the guardrails that keep it fun rather than instructive-but-tedious:

1. **Visual, never numeric.** The player never does arithmetic or compares values against a table. The game does all comparison internally and shows it as movement, glow, elimination, and preview. Raw numbers are hidden behind an optional "expert readout" toggle (off by default).
2. **Fun lives in *doing*, thinking is a reward multiplier.** Moment-to-moment engagement is playing short, tactile minigames. Cleverness (efficient test choice, optimal cuts) earns *better rewards and efficiency*, but is never a gate — a checked-out player can still progress.
3. **Casual surface, opt-in depth.** Common tasks are one-tap; the deep loops are reserved for rare/valuable/new content and can be ignored by casual players.
4. **Idle routes tedium; active earns trophies + skill.** Idle helpers auto-clear the boring bulk and *escalate* the interesting cases to the player. Only active play grows the player's own mastery, and idle caps always trail the player's ability, so the frontier is always the player's to crack.
5. **Content treadmill beats trivialization.** As masteries climb, the game introduces nastier look-alikes / harder cuts / rarer species that *demand* that skill — so growth always has a target.
6. **Unified core verb.** Across Identify and Cut, the loop is the same: *play a themed minigame → raise a mastery/level → that mastery governs your outcomes.* This is what makes the systems cohere (à la IdleOn).

---

## 3. EXPLORE — the world map & expeditions (B spine)

**Teaching payload: deposit geology** — why certain gems occur in certain places and are dug a certain way.

### World map

A stylized globe of real-world-inspired **locality nodes**, grouped into regions. Start at one humble beginner spot (a local creek). Each locality has a **field-guide entry** that fills in as you learn it: **deposit type**, **host rock**, **indicator minerals**, and a realistic **find pool**.

### Deposit types → method → finds (the backbone)

| Deposit type | Collection method (minigame) | Real signature finds | Example localities |
| --- | --- | --- | --- |
| Alluvial / placer (river gravels) | **Panning** — density minigame | Sapphire, garnet, gold, topaz | Montana creeks, Sri Lanka |
| Pegmatite (coarse igneous veins) | **Hard-rock / pocket** work | Tourmaline, aquamarine/beryl, topaz | Minas Gerais, Pala CA, Maine |
| Hydrothermal vugs | **Geode cracking** | Amethyst, agate, (emerald in veins) | Brazil/Uruguay, Colombia |
| Metamorphic (marble, schist) | **Hard-rock** | Ruby, sapphire, jade, lapis | Mogok, Afghanistan |
| Volcanic / arid | Surface collecting | Peridot, opal, turquoise | Arizona, Coober Pedy |

### Expedition minigames (method-matched)

- **Panning** — swirl to wash away light sand; dense gems/gold sink and stay (real gravity concentration).
- **Hard-rock / pocket** — follow indicator signs to a crystal pocket, then split carefully (rushing fractures crystals).
- **Geode cracking** — the "unboxing" dopamine hit, but real: a dull nodule splits to reveal a crystal-lined cavity.

Each session yields a few pieces of **unidentified rough** (+ waste matrix) → flows into Identify. Rough carries base stats rolled at discovery (see §5.3).

### Prospecting ("read the land")

Before digging, read clues — surface float, indicator minerals in the pan, host rock — to pick the best spot. Casual players get gentle hints; knowledge-seekers are rewarded for real tells (e.g., pyrope garnet + chrome diopside = diamond indicators). Optional depth, never a wall.

### Gear (spans all stages, introduced here)

Gold pan, sieve/classifier, rock hammer, geode cracker (Explore) · loupe, UV light, hardness picks, scale (Identify) · cutting tools (Cut). All real rockhound/lapidary equipment. Gear gates methods and tests.

### Idle-lite

Leave a **sieve or tumbler running** at a locality that trickles out a little while away — the single cozy "welcome back" reward. No empire to manage.

---

## 4. IDENTIFY — the deduction puzzle (A signature mechanic)

Rough comes out of the ground **unidentified**; figuring out what it is *is* the game. Under the hood: Mastermind/Wordle played with a real gemologist's toolkit.

### The setup

Every rough has a hidden true species with a full **real property profile**. The screen shows a **candidate list** that visibly shrinks as you learn. Two realistic constraints seed it:

- **Free observations** any collector makes at a glance: crystal **habit**, **color**, **transparency**, **luster**.
- **Locality** — you choose only among species that actually occur at that deposit (the ~6–12 in its find pool), not thousands of minerals.

### Tests as minigames + the precision model (the core)

Each test needs its matching real tool and costs a little session time/consumable, so you can't brute-force every test on every pebble. **A test's mastery decides how *precise* the reading is — not whether you pass.**

```
band width  =  base_error  /  ( technique_mastery × instrument_tier × lab_prep_buff × family_familiarity )
```

- **Technique mastery** (your minigame high score) sets your precision *tier*.
- **Live play** places you within that tier (play well → sharp end; fumble → fuzzy end) — so live tests stay engaging, but a casual player still gets their tier's baseline.
- **Instrument tier, Lab-Prep buffs, family familiarity** shift the whole range sharper (the synergy web, §8).

A reading **eliminates a candidate when the candidate's true value falls outside the reading band.** Wide band → eliminates few; narrow band → eliminates many. Precision = discriminating power. The "set of tests a species needs" *emerges* — it's whatever resolves that stone's specific look-alike group — rather than being a handed-out recipe.

| Test | Minigame | Real property |
| --- | --- | --- |
| Scratch / hardness | Lock-pick-style tension drag (bite vs. skate) | Mohs hardness |
| Heft / SG | Balance-scale / water-line precision | Specific gravity |
| Streak | Stroke across porcelain at right pressure, read color | Streak |
| UV fluorescence | Dark-room lamp sweep; capture the glow at peak | Fluorescence |
| Loupe | Rack-focus hidden-object; spot & tag features | 10× inspection |
| Spectral (late) | Line-up match onto the fingerprint | Spectroscopy |

### Presentation — no math, ever

The identification screen is a **detective board** of candidate cards. As readings arrive, the game compares internally and the board reacts: candidates outside the band **flip/gray/slide off**, a **"SUSPECTS: N"** counter ticks down. Readings resolve onto **visual gauges** (a dial with candidate pins; your reading is a glowing arc — pins outside fade). The player reads *position and glow*, not numbers.

### Look-alikes are the designed puzzles

Species pools deliberately seed real, historically meaningful confusions: colorless diamond/quartz/white sapphire/CZ/glass (SG + hardness + RI); amethyst vs. purple fluorite (7 vs. 4 + cleavage); **ruby vs. red spinel** (the "Black Prince's Ruby"); **pyrite vs. gold** ("fool's gold").

### Fast lane & cozy fail

- **Common/known species → one-tap recognition flick** (no puzzle). The bulk of ID is low-effort by design.
- **Mystery/rare/new → the full puzzle**, with an optional highlighted "suggested next test" so a checked-out player never gets stuck.
- **Wrong ID is not an instant loss** — it costs the "clean identification" bonus and you can re-test. The *real* consequence is deferred to Cut (you cut on wrong assumptions → window/shatter). A soft per-session **accuracy rating** feeds reputation.

### Knowledge is progression

Every correct ID writes the species' real profile into the **field notebook / Gemdex** (Mohs, SG, habit, luster, fluorescence, cleavage + a real fact). Next time you (and the notebook) recognize it faster. Better **gear unlocks more discriminating tests**, which is what lets you take on harder look-alikes and deeper localities.

---

## 5. CUT — real lapidary as leveled techniques (A heart, optional lane)

Cutting is the **optional depth lane** (a pure collector can sell/display rough and never touch it). It's where Identify pays off and where the biggest "wow" moments live. It replaces the old `quality%` RNG. **Model: pick a technique, roll against your skill** — the fun is in leveling techniques via minigames, not executing a per-stone physics procedure.

### 5.1 Cut techniques

Realism lives in *which cuts suit which materials* (genuine gemology). Cut **style is a global technique** you level once; each **material adds a difficulty modifier** (corundum is hard; a cleavable topaz cut "boxed" is riskier) — this bounds grind while keeping material challenge real.

| Technique | Difficulty | Best for (real) | Value ceiling |
| --- | --- | --- | --- |
| Cabochon | easy | opaque/included/**phenomenal** stones (opal, star sapphire, moonstone) | low–med; reveals phenomena |
| Round Brilliant | medium | most transparent gems, diamonds | high |
| Step / Emerald cut | med–hard | emeralds & brittle stones; shows color/clarity | high |
| Princess / "boxed" | hard | high yield; sharp corners = risky | very high |
| Fancy / fantasy cuts | hardest | endgame trophies | highest |

### 5.2 Unlock, level, apply

- **Unlock** a technique by playing its minigame once, well. Each minigame is themed to that cut's real challenge (Round = radial-symmetry; Step = parallel-lines precision; Cabochon = doming/shape-match) — learning sneaks in via theme.
- **Level** it by replaying (practice mode raises your best). Level drives success: **Lv1 ≈ 50% → Lv10 ≈ 90%**.
- **Apply:** cutting a stone = pick an unlocked technique appropriate to the material → success roll = f(technique level, material difficulty, equipment, buffs). Web buffs accelerate leveling and raise caps.

### 5.3 Cozy outcomes

A "fail" usually means a **lower-quality cut** (mediocre stats, lost weight) — still a sellable stone — not a vaporized gem. **Catastrophic loss is reserved for the hardest cuts on cleavable stones** (opt-in gambles). Probability shapes the *quality distribution* (fishing-style: you always land something, size varies). If the stone was **misidentified**, Cut shows wrong danger planes / ideal cut and the stone windows or shatters (the deferred consequence; the loupe offers one last chance to notice).

### 5.4 Specimen stats & traits (the fishing hook)

Every specimen carries stats that accrue across phases, like a fish's weight/length:

- **Rolled at discovery (rough):** **carat weight** (the "size" stat), **clarity**, **color grade** (hue/tone/saturation; prized variants like pigeon-blood ruby, cornflower sapphire).
- **Set when cut:** **cut quality %**, **carat retained** (yield), **symmetry / polish / brilliance**.
- **Trait flags (not all specimens have these):** **phenomena** (asterism/star, cat's-eye, color-change, play-of-color — *revealed only by the correct cut*, e.g. cabochon on a star sapphire), **origin prestige** (Kashmir, Burma), **untreated/natural**.

These roll into a **specimen score** and **market value**. This creates **two collection axes**: **breadth** (Gemdex — "one of each") and **quality** (trophies — "the best one"), the latter driving the fishing-style itch to re-visit localities for a bigger/cleaner/better find.

---

## 6. CATALOG & PROGRESSION — the collection spine (B heart)

### 6.1 Gemdex (breadth)

One self-filling **textbook entry** per species, lit on first correct ID (big **NEW** pop): real property profile, facts/lore, source localities, suitable cuts, possible phenomena. Undiscovered species show as **locked silhouettes with a teasing hint**. Entries group into **mineral families** (quartz, beryl, corundum, garnet, feldspar); completing a family grants **Family Familiarity** (permanent buff that sharpens both identifying and cutting that family — real taxonomy as reward).

### 6.2 Trophy case (depth)

The game tracks your **best specimen per species** by score (carat, color, clarity, cut, phenomena, origin) — a personal-best chase. Finest pieces sit in a **cozy display case** the player arranges (cosmetic, prestige, casual-friendly).

### 6.3 Field Notebook & Reputation (progression currency)

**Reputation** is the progression meter, fed by *knowledge and collecting*: correct IDs (bonus for hard look-alikes), quality cuts, first discoveries, completing family & regional sets, winning gem shows. Reputation tiers gate the map, unlock gear/technique tiers, and raise ceilings. **Cash only accelerates — never gates.**

### 6.4 How the map opens — nonlinear, heterogeneous gates

Each locality draws its **own** gate from the menu — sometimes a single requirement, sometimes a combo — so the map is a **branching graph, not a linear ladder**, and playstyle decides what opens first:

```
Creek ─┬─ Gravel Bar ....... gear only (gold pan)            ← gear-buyer path
       ├─ Old Quarry ....... gear only (rock hammer)         ← opens hard-rock early
       ├─ Amethyst Vug ..... complete the Creek's set        ← collector path
       ├─ Ruby Marble ...... Reputation tier 3               ← identifier path
       └─ Kimberlite Pipe .. Rep 5 + indicator gear + a set  ← flagship combo gate
```

Localities ramp by **deposit type** as a difficulty curve, teaching geology:

```
Alluvial (pan) → Pegmatite (hard-rock) → Geodes → Metamorphic → Kimberlite / Opal fields
```

### 6.5 Gem Shows (endgame loop)

Periodic **shows** judge specimens against NPC rivals / rotating rubrics — Biggest Carat, Finest Color, Best Star Sapphire, Best Cut, Best-in-Show (single-player, so NPC judges & thresholds). Rewards: reputation, cash, **exclusive techniques/gear/cosmetics**, sometimes access to rare rough/localities. Drives replay: a target trophy sends you back through Explore → Identify → Cut.

---

## 7. ECONOMY — the thin accelerant (C layer)

**Two currencies, cleanly split:** Reputation/Knowledge = the **gate**; Cash = the **grease**. You cannot buy your way to the endgame. A pure collector can quick-sell surplus and ignore the rest.

- **Sources:** selling surplus (rough, cut stones, mineral specimens, offcut dust); gem-show prize money; light passive income as idle helpers clear & auto-sell commons.
- **Sinks (all accelerants):** instruments & cutting gear (raise ceilings/caps) · consumables (streak plates, distilled water, grit, dop wax — keep tests/idle/cutting running) · hiring & leveling idle helpers · travel (speed a map unlock) · **certification** (a lab cert adds value + trophy credibility + show prestige; real: GIA) · buying rough/missing species at market (fill a Gemdex gap or feed cutting practice — opt-in).
- **The market teaches:** prices are driven by the *real* value factors in the specimen stats — rarity, 4Cs, phenomena, origin, natural/untreated premium, certification. One genuine decision surfaces: **sell rough now for safe cash, or invest cutting time for more value at some risk?** A light, occasional demand shimmer ("emeralds are hot this show season") makes timing mildly strategic — deliberately shallow, never a trading sim.
- **Its place in the web:** the hub converting *specimens → cash → higher ceilings, consumables, workers → more/better specimens.*

No monetization (passion project).

---

## 8. THE SYNERGY WEB (full, IdleOn-style)

Every system feeds at least one other, pulling players through the whole game for a synergistic payoff. Every link is **thematically real**, so the synergy teaches too. Centerpiece: the **Lab Prep ritual** (the direct analog of IdleOn's "cook a dish → better fishing").

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

- **Two buff flavors:** **permanent** growth (instruments, family familiarity, technique levels) so you always feel stronger; **temporary** Lab-Prep buffs so there's a fun pre-session ritual and moment-to-moment optimization.
- **Consumables as the connective tissue:** produced by Explore/Cut (or bought), consumed by tests and idle helpers — a sink that keeps you moving through systems.

---

## 9. IDLE / ACTIVE TRADEOFFS

Each active phase has a light idle counterpart with the same "safe but limited" character. General rule: **idle clears the boring bulk and escalates the interesting cases to the player; only active grows the player's own mastery; idle caps trail the player's ability.**

| Phase | Idle counterpart | Behavior |
| --- | --- | --- |
| Explore | Sieve / tumbler running | Trickles out a little while away |
| Identify | **Lab Assistant** (apprentice gemologist) | Auto-IDs the queue offline at a **capped precision**; auto-clears easy commons; flags hard look-alikes **"needs your eye"**; **never wrong-IDs** (only "certain" or "uncertain"); consumes consumables; hired/leveled with cash |
| Cut | **Lapidary Apprentice** | Auto-cuts queued rough offline at **capped level** (safe cabochons/standard cuts, no masterwork); refuses risky/valuable rough, flags it **"worth your hand"**; consumes grit/wax; hired/leveled with cash |

Guardrails everywhere: idle helpers **cannot raise the player's own mastery** (only playing minigames does), and their caps **always trail the player's ability**, so the newest/hardest/most valuable content is always the player's to crack. Offline progress is capped (≈8h, tunable).

---

## 10. What is dropped from the prior design

- Worker `efficiency` / `luck` / `speed` stats and 1-minute tick generation → replaced by active expeditions + light idle sieve/tumbler and the idle Lab Assistant/Apprentice.
- Black-box `quality%` (40–110% RNG) → replaced by real 4C-style **specimen stats** + leveled **cut techniques**.
- Idle **worker-empire** management → replaced by an active, collection-led loop with light idle counterparts.
- The per-stone **physics-tuner** cut concept (explored, rejected as not-fun) → replaced by the technique-unlock/level model; realism kept in the cut catalog, material fit, phenomena, and stats.
- "realWorldLocations" and facts as inert flavor → the same real data now *drives* mechanics (find pools, property profiles, value drivers).

Retained: the React/Vite + Tailwind + Zod-validated YAML data pipeline + Context/`useReducer` + localStorage architecture, and the collection/Gemdex heart (now far more central).

---

## 11. Player archetypes served

| Archetype | Loop they live in |
| --- | --- |
| The Collector (primary) | Gemdex + family + regional completion |
| The Trophy Hunter | Best-in-species stats, gem-show wins |
| The Optimizer | The synergy web + technique/mastery leveling |
| The Casual | Pan, collect, decorate the case; ignore the depth |

---

## 12. Decomposition & build order (for implementation planning)

This design is too large for a single implementation plan. Proposed sub-projects, each getting its own `spec → plan → build`:

1. **Data & schema foundation** — extend `items.yaml` with real property profiles (Mohs, SG, streak, fluorescence, cleavage, habit, luster, RI), families, phenomena; localities as deposit types with find pools + gate definitions; cut-technique definitions; Zod schemas + loaders. *(Enables everything; no UI.)*
2. **Explore MVP** — world map, one or two deposit types with their expedition minigame (start with **panning**), prospecting hints, rough-with-base-stats output, gear gating.
3. **Identify MVP** — candidate board + visual gauges, 2–3 test minigames (scratch, heft, UV), the precision model, fast-lane recognition, cozy fail, notebook/Gemdex writes.
4. **Catalog/Progression MVP** — Gemdex breadth + families + familiarity, Reputation meter, nonlinear map gates, trophy tracking.
5. **Cut MVP** — 2–3 techniques (cabochon, round brilliant), unlock/level minigames, apply-and-roll, specimen stats set on cut, first phenomenon (star sapphire).
6. **Synergy web + idle helpers** — Lab Prep ritual, consumables, Lab Assistant, Lapidary Apprentice, offline progress.
7. **Economy + Gem Shows** — market, certification, show loop.

Recommended first build: **Sub-project 1 (data foundation)**, then a **thin vertical slice of Explore(pan) → Identify → Gemdex** to validate the core fun before widening.

---

## 13. Open questions / to tune in playtesting

- Exact minigame mechanics and feel for each test and each cut technique (prototypes needed).
- Balance numbers: precision `base_error` and buff multipliers; technique success curve; idle caps and rates; reputation costs; market prices.
- How many species / localities / families ship in the first playable (start small — a single region's find pool).
- Whether Gem Shows are always-available entries or timed events.
- Consumable economy tuning (so idle helpers create a healthy sink without being annoying).
```
