# Process Phase - Game Design Document

> **Version:** 1.0
> **Author:** GameDesigner Agent
> **Date:** 2026-03-29
> **Status:** Design Complete - Ready for Implementation Planning

---

## Table of Contents

1. [Core Concept](#1-core-concept)
2. [Inputs and Outputs](#2-inputs-and-outputs)
3. [Minigame Designs](#3-minigame-designs)
4. [Idle vs Active Processing](#4-idle-vs-active-processing)
5. [Progression and Upgrades](#5-progression-and-upgrades)
6. [Economic Balance](#6-economic-balance)
7. [Integration with Game Loop](#7-integration-with-game-loop)
8. [Self-Critique and Refinements](#8-self-critique-and-refinements)
9. [Final Polish Summary](#9-final-polish-summary)

---

## 1. Core Concept

### 1.1 What is the Process Phase?

**Process** is the transformation layer between raw discovery and crafted value. Where Discover is about *finding* materials, Process is about *revealing* their potential.

### 1.2 Fundamental Design Philosophy

| Aspect | Discover Phase | Process Phase |
|--------|---------------|---------------|
| **Core Action** | Find and collect | Transform and refine |
| **Player Fantasy** | Prospector/Explorer | Artisan/Craftsman |
| **Input** | Time, equipment, location knowledge | Raw materials, skill, patience |
| **Output** | Raw gems and minerals | Refined gems, cut stones, processed materials |
| **Risk** | Nothing found | Material destroyed, quality lost |
| **Mastery** | Knowing where to look | Knowing how to handle |
| **Pacing** | Expedition-based bursts | Steady, contemplative work |

### 1.3 The Core Tension

**Discovery gives you potential. Process realizes it.**

A rough sapphire from Montana Streambed might be worth 200 coins raw. But:
- Properly cleaned: 280 coins (+40%)
- Expertly cut: 450 coins (+125%)
- Masterfully faceted: 700 coins (+250%)

The player must decide: *Is this material worth the time and risk to process?*

### 1.4 Three Processing Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESSING CATEGORIES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │  CLEANING   │    │   CUTTING   │    │  FACETING   │            │
│  │             │    │             │    │             │            │
│  │  Remove     │    │  Shape the  │    │  Add the    │            │
│  │  matrix &   │    │  rough into │    │  final      │            │
│  │  impurities │    │  workable   │    │  brilliance │            │
│  │             │    │  form       │    │             │            │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│         │                  │                  │                    │
│         ▼                  ▼                  ▼                    │
│  Raw Material ────► Cleaned Gem ────► Cut Gem ────► Faceted Gem   │
│  (from Discover)       (Process)        (Process)     (Process)    │
│                                                                     │
│  Each stage:                                                        │
│  - Increases value 40-150%                                          │
│  - Has risk of quality loss                                         │
│  - Requires different minigame/mechanic                             │
│  - Takes time (idle) or skill (active)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Inputs and Outputs

### 2.1 What Enters Process

| Input Category | Source | Examples | Notes |
|---------------|--------|----------|-------|
| **Raw Gems** | Discover expeditions | Uncut ruby, rough sapphire | Have natural imperfections |
| **Raw Minerals** | Discover expeditions | Clear quartz, obsidian | Lower value but easier to process |
| **Matrix Rock** | Discover (byproduct) | Granite, basalt | Contains embedded gems |
| **Processing Materials** | Purchased/Discovered | Abrasive grit, polishing compound | Consumed during processing |

### 2.2 What Exits Process

| Output Category | Destination | Examples | Value Multiplier |
|----------------|-------------|----------|-----------------|
| **Cleaned Gems** | Cutting or Craft | Polished ruby, cleaned emerald | 1.3x - 1.5x raw |
| **Cut Gems** | Faceting or Craft | Shaped sapphire, cut diamond | 1.5x - 2.0x cleaned |
| **Faceted Gems** | Craft (Jewelry) | Brilliant-cut diamond, princess emerald | 2.0x - 3.0x cut |
| **Processed Minerals** | Craft or Sell | Tumbled quartz, carved obsidian | 1.2x - 1.8x raw |
| **Byproducts** | Sell or discard | Gem dust, rock chips | Minimal value |

### 2.3 Processing Chain Visualization

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE PROCESSING CHAIN                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DISCOVER              PROCESS                    CRAFT                      │
│  ────────              ───────                    ─────                      │
│                                                                              │
│  ┌─────────┐                                                          ┌────┐ │
│  │ Rough   │   Cleaning        Cutting         Faceting               │    │ │
│  │ Ruby    │──────────────────────────────────────────────────────────►│Ring│ │
│  │(95 carat│   ┌────────┐     ┌────────┐      ┌──────────┐            │    │ │
│  │ quality)│───►│Cleaned │────►│  Cut   │─────►│ Faceted  │───────────►│    │ │
│  └─────────┘    │ Ruby   │     │  Ruby  │      │  Ruby    │            └────┘ │
│       │         │(88%    │     │(75%    │      │(92%      │                   │
│       │         │quality)│     │quality)│      │quality)  │                   │
│       │         └────────┘     └────────┘      └──────────┘                   │
│       │              │              │               │                         │
│       │              ▼              ▼               ▼                         │
│       │         [Use in       [Use in         [Use in                        │
│       │          Craft]        Craft]          Craft]                         │
│       │                                                                      │
│       │         Alternative Paths:                                           │
│       │                                                                      │
│       ├──────────► [Cabochon Cut] ───────────────────────► [Simple Jewelry]  │
│       │            (Easier, less value)                     (Craft)          │
│       │                                                                      │
│       └──────────► [Tumble Polish] ───────────────────────► [Decorative]     │
│                    (Idle-only, 1.2x)                        (Craft/Sell)     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

QUALITY MECHANIC:
- Every gem has a quality % (found during Discover)
- Quality affects processing success rates
- Quality can be preserved, improved slightly, or lost
- Higher quality at each stage = higher final value
```

### 2.4 Connection to Craft Phase

| Processing Output | Craft Use Case | Design Intent |
|------------------|----------------|---------------|
| Faceted Gems | Jewelry settings (rings, necklaces) | High-value crafted items |
| Cut Gems | Simple settings, decorative pieces | Mid-tier crafted items |
| Cleaned Gems | Raw jewelry, specimen display | Entry-level crafted items |
| Processed Minerals | Carved items, inlays, metaphysical | Niche crafted items |

---

## 3. Minigame Designs

### 3.1 Design Philosophy for Process Minigames

Process minigames differ from Discover minigames in key ways:

| Aspect | Discover Minigames | Process Minigames |
|--------|-------------------|-------------------|
| **Pacing** | Fast, reactive | Deliberate, thoughtful |
| **Failure State** | Low score, fewer rewards | Material damage, quality loss |
| **Skill Expression** | Dexterity, timing | Precision, judgment, patience |
| **Session Length** | 30-90 seconds | 60-180 seconds |
| **Replay Incentive** | Better loot, shift points | Better quality, less waste |

### 3.2 Minigame 1: TUMBLE SORT (Cleaning)

#### Purpose
Remove matrix rock and impurities from raw gems and minerals.

#### Player Fantasy
Gem tumbling operator - carefully separating valuable stones from waste.

#### Materials This Applies To
- All raw gems (first processing stage)
- Raw minerals (first processing stage)
- Geodes and specimens

#### Mechanics

**Setup:**
- Screen shows a rotating tumbler barrel with mixed materials
- Raw gems/minerals appear with different colors/shapes
- Waste rock (matrix) appears as gray/brown irregular shapes

**Core Loop (Active Mode):**
1. Materials tumble in the barrel (realistic rotation animation)
2. Player taps/clicks on raw gems to "select" them for extraction
3. Selected gems move to a cleaning tray
4. Player uses swipe gestures to brush away remaining matrix
5. Quality is determined by:
   - How completely matrix was removed
   - How few times wrong materials were selected
   - Time taken (bonus for efficiency, not speed)

**Idle Mode:**
- Automatic tumbling over time (scales with equipment)
- Base success rate: 70% quality preserved
- Takes 5-30 minutes depending on material hardness
- Cannot achieve quality above 85% (active required for masterwork)

#### Input/Output Specification

```markdown
## Tumble Sort Minigame

**Input:** Raw gem/mineral (quality: 0-100%)
**Output:** Cleaned gem/mineral (quality: 60-100%)
**Time:** 60-90 seconds (active), 5-30 minutes (idle)

**Scoring:**
- Perfect extraction (no waste): +15% quality
- Clean swipe (matrix removed): +5% per successful swipe
- Wrong selection: -10% quality
- Missed matrix: -3% per piece
- Time bonus (under 75s): +5%

**Failure Thresholds:**
- Below 50% quality: Material cracked (-25% final value)
- Below 30% quality: Material destroyed (lost)

**Equipment Bonuses:**
- Basic Tumbler: Base stats
- Vibrating Tumbler: +10% automatic matrix removal
- Sonic Cleaner: +20% quality preservation, auto-removes small matrix
- Industrial Washer: Process 5 items simultaneously
```

#### Visual Design
- Top-down view of tumbler barrel
- Satisfying "click" sounds when selecting gems
- Particle effects when brushing matrix
- Quality meter fills as cleaning progresses

---

### 3.3 Minigame 2: FACET ALIGNMENT (Cutting)

#### Purpose
Shape rough gems into workable forms for further processing.

#### Player Fantasy
Lapidary artist - making the first critical cuts that determine a gem's potential.

#### Materials This Applies To
- Cleaned gems (second processing stage)
- Soft minerals being carved

#### Mechanics

**Setup:**
- 3D-ish view of the cleaned gem
- Facet lines appear showing potential cut angles
- Player must choose and execute cuts

**Core Loop (Active Mode):**
1. Gem rotates slowly, showing different angles
2. Player selects a cutting plane (dashed line overlay)
3. Player drags to adjust cut angle (precision matters)
4. Player releases to execute cut
5. Score based on:
   - Alignment with ideal cut planes
   - Preservation of gem weight (carats)
   - Avoiding internal flaws

**Risk/Reward:**
- Conservative cuts: Preserve weight, lower value potential
- Aggressive cuts: Higher value potential, risk of hitting flaws
- Perfect alignment unlocks bonus multipliers

**Idle Mode:**
- Automatic rough cutting
- Base success: 65% quality preserved
- Takes 10-60 minutes per gem
- Cannot achieve masterwork cuts

#### Input/Output Specification

```markdown
## Facet Alignment Minigame

**Input:** Cleaned gem (quality: 60-100%)
**Output:** Cut gem (quality: 50-100%)
**Time:** 90-120 seconds (active), 10-60 minutes (idle)

**Scoring:**
- Perfect alignment (within 2°): +20% quality
- Good alignment (within 5°): +10% quality
- Acceptable alignment (within 10°): +0% quality
- Poor alignment (10-20°): -10% quality
- Botched cut (>20°): -30% quality, gem cracked

**Carat Preservation:**
- Each gem starts with random carat weight (discover-dependent)
- Cuts remove carats
- Ideal cut removes 20-30% of weight
- Poor cuts may remove 40%+ or hit flaws

**Internal Flaws:**
- 30% of gems have hidden internal flaws
- Flaws appear as red zones on the gem model
- Cutting through a flaw: -25% quality
- Flaw avoidance: +15% quality bonus

**Equipment Bonuses:**
- Hand Lens: Reveals 50% of internal flaws
- Faceting Scope: Reveals 100% of internal flaws
- Precision Saw: ±5° tolerance instead of ±10°
- Laser Cutter: Automatic perfect cuts (masterwork possible idle)
```

#### Visual Design
- Gem rendered with pseudo-3D rotation
- Cut planes appear as glowing lines
- Satisfying "shing" sound when cut executes
- Carat counter ticks down as cuts happen
- Flaw zones pulse red when approaching

---

### 3.4 Minigame 3: POLISH WHEEL (Faceting/Finishing)

#### Purpose
Add the final brilliance and finish to cut gems.

#### Player Fantasy
Master lapidary - the final touches that make gems sparkle.

#### Materials This Applies To
- Cut gems (third processing stage)
- Some minerals (finishing stage)

#### Mechanics

**Setup:**
- Cut gem appears on a polishing wheel
- Multiple facets need attention
- Polish meter tracks progress per facet

**Core Loop (Active Mode):**
1. Gem has 6-12 facets (depending on cut)
2. Each facet starts "dull" with imperfections
3. Player holds facet against polishing wheel (hold gesture)
4. Pressure and angle affect polish quality
5. Over-polishing causes damage
6. Player must rotate gem to hit all facets
7. Perfect polish on all facets = masterwork gem

**Risk/Reward:**
- Under-polishing: Lower value, but safe
- Perfect polish: Maximum value
- Over-polishing: Heat damage, quality loss
- Strategic: Balance efficiency vs. quality

**Idle Mode:**
- Automatic polishing
- Base success: 60% quality preserved
- Takes 15-90 minutes per gem
- Random quality variance (50-85%)
- Cannot achieve perfect polish

#### Input/Output Specification

```markdown
## Polish Wheel Minigame

**Input:** Cut gem (quality: 50-100%)
**Output:** Faceted/finished gem (quality: 40-110%)  // Can exceed 100%!
**Time:** 120-180 seconds (active), 15-90 minutes (idle)

**Scoring:**
Each facet has:
- Imperfection level: 0-100%
- Target: Reduce to 0% (perfect) without overheating

Polish Mechanics:
- Holding applies polish (imperfection decreases)
- Heat accumulates while holding
- Releasing dissipates heat
- Overheating (heat > 100%): Damage, -15% quality per overheat

Perfect Polish Bonus:
- All facets at 0% imperfection: +10% quality (masterwork)
- No overheats: Additional +5%
- Under time limit: Additional +5%

**Equipment Bonuses:**
- Basic Wheel: Standard stats
- Water-Cooled Wheel: Heat dissipates 50% faster
- Diamond Dust Polish: Polish speed +30%
- Computer-Assisted: Auto-maintains optimal pressure
- Master's Wheel: Masterwork possible in idle mode (rare)
```

#### Visual Design
- Gem rotates slowly, facets catching light
- Polish wheel spins with blur effect
- Heat meter (thermometer-style) fills red
- Sparkle particles increase as polish improves
- Satisfying "shine" sound when facet completes

---

### 3.5 Minigame 4: CRYSTAL SEPARATION (Special)

#### Purpose
Extract embedded gems from matrix rock and geodes.

#### Player Fantasy
Geologist carefully extracting precious crystals from rock.

#### Materials This Applies To
- Geodes (quartz geode item)
- Matrix specimens (gems embedded in rock)
- Fossil/mineral combinations

#### Mechanics

**Setup:**
- Rock specimen appears with visible gem deposits
- Chisel tool on one side, brush tool on other side
- Gem locations are partially hidden

**Core Loop (Active Mode):**
1. Player uses chisel to crack rock sections
2. Player uses brush to clear debris and reveal gems
3. Player taps gems to extract once revealed
4. Scoring based on:
   - Gems extracted (vs. gems present)
   - Damage to gems during extraction
   - Time efficiency

**Risk/Reward:**
- Aggressive chiseling: Fast, but risks gem damage
- Careful brushing: Slow, but preserves quality
- Hidden gems: May miss some if too fast

**Idle Mode:**
- Automatic extraction
- Base success: 50% of gems extracted
- Takes 30-120 minutes per specimen
- Quality variance: 40-80%

#### Input/Output Specification

```markdown
## Crystal Separation Minigame

**Input:** Geode or matrix specimen
**Output:** 1-5 extracted gems/minerals (quality: 30-100%)
**Time:** 60-120 seconds (active), 30-120 minutes (idle)

**Scoring:**
Gems Embedded: 3-5 per specimen (random)

Extraction Quality:
- Perfect extraction: 100% quality
- Minor chips: 80% quality
- Visible damage: 60% quality
- Major damage: 40% quality
- Shattered: Gem lost

Hidden Gem Bonus:
- 10% chance of bonus hidden gem
- Careful play reveals hidden gems
- Rushed play misses hidden gems

**Equipment Bonuses:**
- Basic Chisel: Standard extraction
- Precision Tools: +25% gem preservation
- Air Scribe: Auto-extraction, +10% quality
- X-Ray Scanner: Reveals all gem locations including hidden
```

#### Visual Design
- Rock specimen with realistic textures
- Satisfying "crack" sounds when chiseling
- Dust particles when brushing
- Gems sparkle when revealed
- Quality indicator shows damage state

---

## 4. Idle vs Active Processing

### 4.1 Design Philosophy

The Process phase follows the same "earned idle" philosophy as Discover:

> **Active play earns capability. Idle play collects results.**

However, Process idle is different from Discover idle:

| Aspect | Discover Idle | Process Idle |
|--------|--------------|--------------|
| **What it does** | Generates new materials | Processes queued materials |
| **Input required** | Shift points (earned) | Raw materials + queue setup |
| **Time scale** | Hours | Minutes to hours |
| **Quality ceiling** | Can't get rares idle-only | Can't get masterwork idle-only |
| **Player action** | Collect accumulated loot | Queue materials, collect results |

### 4.2 The Processing Queue System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROCESSING QUEUE SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         QUEUE SLOTS                                  │   │
│  │                                                                       │   │
│  │   Slot 1: [Rough Ruby] ─────► Cleaning ────► 12:34 remaining        │   │
│  │   Slot 2: [Clear Quartz] ───► Polishing ──► Complete! [Collect]     │   │
│  │   Slot 3: [Empty] ─────────── Click to add material                  │   │
│  │   Slot 4: [Locked] ────────── Unlock at Level 10                     │   │
│  │   Slot 5: [Locked] ────────── Unlock at Level 25                     │   │
│  │   Slot 6: [Locked] ────────── Unlock at Level 50                     │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  QUEUE RULES:                                                               │
│  - Each slot processes one material at a time                               │
│  - Player selects which process (Clean/Cut/Facet)                          │
│  - Processing time depends on material type and equipment                   │
│  - Completed items wait for collection                                      │
│  - Queue continues while game is closed (offline progress)                 │
│                                                                             │
│  QUEUE LIMITS:                                                              │
│  - Base slots: 2                                                            │
│  - Level unlocks: +1 at 10, +1 at 25, +1 at 50                             │
│  - Equipment bonuses: Certain tools add slots                               │
│  - Premium: Cosmetic queue visual themes                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Active Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACTIVE PROCESSING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SELECT MATERIAL                                                         │
│     ┌─────────────────────────────────────┐                                │
│     │ Player opens Process screen          │                                │
│     │ Selects material from inventory      │                                │
│     │ Chooses: Active or Idle processing   │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  2. SELECT PROCESS TYPE                                                     │
│     ┌─────────────────────────────────────┐                                │
│     │ Cleaning (Tumble Sort)              │                                │
│     │ Cutting (Facet Alignment)           │                                │
│     │ Faceting (Polish Wheel)             │                                │
│     │ Special (Crystal Separation)        │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  3. PLAY MINIGAME                                                           │
│     ┌─────────────────────────────────────┐                                │
│     │ 60-180 seconds of gameplay           │                                │
│     │ Skill-based quality outcome          │                                │
│     │ Immediate feedback                   │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  4. RECEIVE RESULT                                                          │
│     ┌─────────────────────────────────────┐                                │
│     │ Quality score: 40-110%              │                                │
│     │ Material transformed                 │                                │
│     │ Added to inventory or next stage     │                                │
│     └─────────────────────────────────────┘                                │
│                                                                             │
│  ACTIVE ADVANTAGES:                                                         │
│  - Higher quality ceiling (up to 110%)                                      │
│  - Faster processing (seconds vs. minutes)                                  │
│  - Direct control over outcome                                              │
│  - Can achieve masterwork quality                                           │
│  - Learning and skill development                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Idle Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IDLE PROCESSING FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. QUEUE MATERIAL                                                          │
│     ┌─────────────────────────────────────┐                                │
│     │ Player opens Process screen          │                                │
│     │ Selects material from inventory      │                                │
│     │ Assigns to queue slot                │                                │
│     │ Chooses process type                 │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  2. TIMER STARTS                                                            │
│     ┌─────────────────────────────────────┐                                │
│     │ Processing time: 5-120 minutes       │                                │
│     │ Player can close game                │                                │
│     │ Progress continues offline           │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  3. AUTOMATIC PROCESSING                                                    │
│     ┌─────────────────────────────────────┐                                │
│     │ Quality rolled at completion         │                                │
│     │ Base: 50-85% quality range           │                                │
│     │ Equipment improves odds              │                                │
│     └─────────────────────────────────────┘                                │
│                      │                                                      │
│                      ▼                                                      │
│  4. COLLECTION                                                              │
│     ┌─────────────────────────────────────┐                                │
│     │ Notification: "Processing complete"  │                                │
│     │ Player returns to collect            │                                │
│     │ Material added to inventory          │                                │
│     └─────────────────────────────────────┘                                │
│                                                                             │
│  IDLE ADVANTAGES:                                                           │
│  - No active time required                                                  │
│  - Batch processing (multiple slots)                                        │
│  - Offline progress                                                         │
│  - Good for common materials                                                │
│  - Safe quality floor (50% minimum)                                         │
│                                                                             │
│  IDLE LIMITATIONS:                                                          │
│  - Quality capped at 85% (no masterwork)                                    │
│  - Slower than active                                                       │
│  - Requires queue management                                                │
│  - No skill expression                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Meaningful Tradeoffs

The key design goal: **Neither active nor idle should be strictly better.**

| Scenario | Best Choice | Reasoning |
|----------|-------------|-----------|
| Legendary gem found | Active | Maximize quality, minimize risk |
| Common minerals (x50) | Idle | Not worth active time investment |
| Crafting order deadline | Active | Speed matters |
| Casual 5-minute session | Idle (queue) | Setup and collect |
| Evening play session | Active | Skill gameplay is fun |
| At work/school | Idle | Offline progress |
| Perfectionist goal | Active | Only way to get 100%+ |
| New player learning | Active | Tutorial teaches mechanics |

### 4.6 Equipment Impact on Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EQUIPMENT EFFECTS ON PROCESSING                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DISCOVER EQUIPMENT (Mining Tools)                                          │
│  ─────────────────────────────────                                          │
│  These affect the QUALITY of materials found:                               │
│                                                                             │
│  Equipment         │ Effect on Process Input                                │
│  ─────────────────┼────────────────────────────────────────────             │
│  Basic Pickaxe    │ Materials found: 60-80% quality                         │
│  Iron Pickaxe     │ Materials found: 65-85% quality                         │
│  Steel Drill      │ Materials found: 70-90% quality                         │
│  Diamond Drill    │ Materials found: 75-95% quality                         │
│  Heavy Machinery  │ Materials found: 80-100% quality                        │
│  Elite Operations │ Materials found: 85-105% quality                        │
│                                                                             │
│  PROCESS EQUIPMENT (New Category)                                           │
│  ─────────────────────────────────────                                       │
│  These affect processing SPEED and QUALITY ceiling:                         │
│                                                                             │
│  Equipment              │ Idle Bonus │ Active Bonus │ Unlocks               │
│  ──────────────────────┼────────────┼──────────────┼────────────            │
│  Basic Tumbler         │ Base       │ Base         │ Cleaning only          │
│  Vibrating Tumbler     │ +10% speed │ +5% quality  │ -                      │
│  Sonic Cleaner         │ +25% speed │ +10% quality │ Auto-matrix removal    │
│  Faceting Scope        │ -          │ Flaws shown  │ Cutting enabled        │
│  Water-Cooled Wheel    │ +15% speed │ Heat control │ Faceting enabled       │
│  Laser Cutter          │ +40% speed │ Perfect cuts │ Masterwork idle        │
│  Master's Workbench    │ +50% speed │ +20% quality │ All processes          │
│                                                                             │
│  EQUIPMENT ACQUISITION:                                                     │
│  - Purchase with coins (early game)                                         │
│  - Craft with processed materials (mid game)                                │
│  - Unlock via achievements (late game)                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Progression and Upgrades

### 5.1 Processing Skills

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROCESSING SKILL TREE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TIER 1: NOVICE LAPIDARY (Unlock: Level 5)                                  │
│  ────────────────────────────────────────                                   │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Gem Knowledge  │────►│  Steady Hands   │────►│  Basic Tumbling │       │
│  │                 │     │                 │     │                 │       │
│  │  Identify gem   │     │  +5% quality    │     │  Unlock idle    │       │
│  │  quality range  │     │  on active      │     │  cleaning       │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│  TIER 2: APPRENTICE CRAFTER (Unlock: Level 15)                              │
│  ───────────────────────────────────────────                                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Flaw Detection │────►│  Precision Cut  │────►│  Queue Expand   │       │
│  │                 │     │                 │     │                 │       │
│  │  See internal   │     │  +10% cutting   │     │  +1 queue slot  │       │
│  │  flaws 50%      │     │  quality        │     │                 │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│  TIER 3: JOURNEYMAN ARTISAN (Unlock: Level 30)                              │
│  ───────────────────────────────────────────                                │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Heat Control   │────►│  Master Polish  │────►│  Batch Process  │       │
│  │                 │     │                 │     │                 │       │
│  │  +50% heat      │     │  Masterwork     │     │  Process 3 at   │       │
│  │  dissipation    │     │  chance +10%    │     │  once (active)  │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│  TIER 4: MASTER LAPIDARY (Unlock: Level 50)                                 │
│  ────────────────────────────────────────                                   │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Perfect Eye    │────►│  Gem Whisperer  │────►│  Grandmaster    │       │
│  │                 │     │                 │     │                 │       │
│  │  Auto-perfect   │     │  Rare chance    │     │  All skills     │       │
│  │  first cut      │     │  +15% quality   │     │  +25%          │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│  SKILL POINTS:                                                              │
│  - Earned by processing materials (1 point per 10 materials)                │
│  - Bonus points for masterwork results                                      │
│  - Can specialize or generalize                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Level-Based Unlocks

| Level | Unlock | Effect |
|-------|--------|--------|
| 1 | Process Screen | Access to basic cleaning |
| 3 | Idle Queue (1 slot) | Can queue 1 material for idle |
| 5 | Cutting | Unlock Facet Alignment minigame |
| 7 | Novice Skills | First skill tree tier |
| 10 | Queue Slot 2 | Can queue 2 materials |
| 15 | Faceting | Unlock Polish Wheel minigame |
| 15 | Apprentice Skills | Second skill tree tier |
| 20 | Crystal Separation | Unlock special minigame |
| 25 | Queue Slot 3 | Can queue 3 materials |
| 30 | Journeyman Skills | Third skill tree tier |
| 40 | Batch Processing | Process multiple at once |
| 50 | Master Skills | Final skill tree tier |
| 50 | Queue Slot 4 | Can queue 4 materials |
| 75 | Grandmaster Title | All processing +10% |

### 5.3 Achievement Unlocks

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| First Clean | Process 1 material | +50 coins |
| Tumble Master | Clean 100 materials | Unlock Vibrating Tumbler |
| Flawless Cut | Achieve 100% quality | "Flawless" gem prefix |
| Processing Line | Queue 1000 total items | +1 queue slot (permanent) |
| Masterwork x10 | 10 masterwork results | Master's Workbench unlock |
| Speed Processor | 100 active processes in one session | +10% active speed permanent |

---

## 6. Economic Balance

### 6.1 Value Progression Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VALUE PROGRESSION BY STAGE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Example: Ruby (Base Value: 800 coins)                                      │
│                                                                             │
│  Stage              │ Quality  │ Value    │ Cumulative  │ Time Invested     │
│  ──────────────────┼──────────┼──────────┼─────────────┼──────────────────  │
│  Raw (from Discover)│ 80%      │ 640      │ -           │ 30s expedition    │
│  Cleaned            │ 85%      │ 880      │ +240        │ +60s (active)     │
│  Cut                │ 80%      │ 1,100    │ +220        │ +90s (active)     │
│  Faceted            │ 90%      │ 1,580    │ +480        │ +120s (active)    │
│                                                                             │
│  Total Investment: 270 seconds active processing                            │
│  Total Value Gain: 940 coins (+147% from raw)                               │
│  Coins per Second: 3.5 coins/second                                         │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Example: Clear Quartz (Base Value: 5 coins)                                │
│                                                                             │
│  Stage              │ Quality  │ Value    │ Cumulative  │ Time Invested     │
│  ──────────────────┼──────────┼──────────┼─────────────┼──────────────────  │
│  Raw                │ 75%      │ 4        │ -           │ 30s expedition    │
│  Cleaned            │ 80%      │ 5        │ +1          │ +60s (active)     │
│  Polished           │ 85%      │ 7        │ +2          │ +60s (active)     │
│                                                                             │
│  Total Investment: 120 seconds                                               │
│  Total Value Gain: 3 coins (+75% from raw)                                  │
│  Coins per Second: 0.025 coins/second                                       │
│                                                                             │
│  DESIGN INSIGHT:                                                            │
│  ─────────────────                                                           │
│  Processing high-value gems is highly profitable.                           │
│  Processing low-value minerals is NOT worth active time.                    │
│  Solution: Use IDLE for minerals, ACTIVE for gems.                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Risk/Reward Matrix

| Action | Risk | Reward | Break-even Quality |
|--------|------|--------|-------------------|
| Clean gem (active) | Quality loss 10-30% | +40% value | 70%+ |
| Clean gem (idle) | None | +30% value | Any |
| Cut cleaned gem | Quality loss 20-40% | +75% value | 65%+ |
| Cut mineral | Minimal (soft) | +25% value | Any |
| Facet cut gem | Quality loss 30-50% | +125% value | 75%+ |
| Facet cut mineral | Moderate | +50% value | 60%+ |

### 6.3 Time Investment Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TIME INVESTMENT VS. REWARD                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ACTIVE PROCESSING (per gem)                                                │
│  ────────────────────────────                                               │
│                                                                             │
│  Cleaning:     60-90 seconds   →   +40% value                               │
│  Cutting:      90-120 seconds  →   +75% value (from cleaned)                │
│  Faceting:     120-180 seconds →   +125% value (from cut)                   │
│                                                                             │
│  Full chain:   4.5-6.5 minutes →   +240% value                              │
│                                                                             │
│  ───────────────────────────────────────────────────────────────            │
│                                                                             │
│  IDLE PROCESSING (per gem)                                                  │
│  ────────────────────────────                                               │
│                                                                             │
│  Cleaning:     5-15 minutes     →   +30% value                              │
│  Cutting:      15-45 minutes    →   +50% value (from cleaned)               │
│  Faceting:     30-90 minutes    →   +80% value (from cut)                   │
│                                                                             │
│  Full chain:   50-150 minutes   →   +160% value                             │
│                                                                             │
│  ───────────────────────────────────────────────────────────────            │
│                                                                             │
│  CONCLUSION:                                                                │
│  Active processing is ~10x faster per gem, but requires attention.          │
│  Idle processing allows batch processing and offline progress.               │
│  Optimal strategy: Mix both based on gem value and player time.              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 [PLACEHOLDER] Balance Variables

> These values require playtesting to validate. Mark all as `[PLACEHOLDER]` until verified.

| Variable | Base Value | Min | Max | Tuning Notes |
|----------|------------|-----|-----|--------------|
| `CLEAN_QUALITY_BONUS_ACTIVE` | +15% | +5% | +25% | Feel test: Is the minigame fun enough for this reward? |
| `CLEAN_QUALITY_BONUS_IDLE` | +10% | +5% | +15% | Must be less than active to incentivize engagement |
| `CUT_QUALITY_BONUS_ACTIVE` | +20% | +10% | +30% | Higher risk, higher reward |
| `CUT_QUALITY_BONUS_IDLE` | +12% | +8% | +18% | |
| `FACET_QUALITY_BONUS_ACTIVE` | +30% | +15% | +50% | Highest skill ceiling |
| `FACET_QUALITY_BONUS_IDLE` | +20% | +10% | +30% | |
| `QUALITY_LOSS_RISK_BASE` | 20% | 10% | 40% | Chance of quality loss on any process |
| `MASTERWORK_THRESHOLD` | 100% | 95% | 110% | Quality needed for masterwork bonus |
| `MASTERWORK_VALUE_MULTIPLIER` | 1.5x | 1.25x | 2.0x | Extra value for masterwork |
| `IDLE_QUALITY_CAP` | 85% | 75% | 95% | Maximum quality achievable idle |
| `QUEUE_SLOT_BASE` | 2 | 1 | 4 | Starting queue slots |
| `QUEUE_SLOT_MAX` | 6 | 4 | 10 | Maximum queue slots |
| `OFFLINE_PROGRESS_CAP_HOURS` | 8 | 4 | 24 | Hours of offline progress allowed |

---

## 7. Integration with Game Loop

### 7.1 Connection to Discover

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISCOVER → PROCESS INTEGRATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DISCOVER OUTPUT                 PROCESS INPUT                              │
│  ───────────────                 ─────────────                              │
│                                                                             │
│  Raw Gems (with quality)    ──►  Cleaning Stage                             │
│    - From expeditions             - Removes matrix                          │
│    - Quality 60-100%              - Reveals true gem                        │
│    - Location-affected            - Quality may change                      │
│                                                                             │
│  Raw Minerals               ──►  Cleaning/Tumbling                          │
│    - Lower value                  - Simpler process                         │
│    - Easier to process            - Lower risk                              │
│    - Often idle-processed         - Good for queue                          │
│                                                                             │
│  Geodes                     ──►  Crystal Separation                         │
│    - Special finds                - Extract embedded gems                   │
│    - Unknown contents             - Reveals hidden value                    │
│    - High variance                - Risk/reward                             │
│                                                                             │
│  Matrix Specimens           ──►  Crystal Separation                         │
│    - Rock with gems               - Similar to geodes                       │
│    - Partially visible            - More predictable                        │
│                                                                             │
│  DISCOVER IMPACT ON PROCESS:                                                │
│  ─────────────────────────────                                              │
│  - Better equipment → Higher quality input → Higher quality ceiling        │
│  - Better locations → Rarer gems → Higher value processing                  │
│  - Shift points → No direct impact (Discover-specific progression)          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Connection to Craft

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROCESS → CRAFT INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROCESS OUTPUT                  CRAFT INPUT                                │
│  ──────────────                  ───────────                                │
│                                                                             │
│  Cleaned Gems              ──►  Simple Jewelry                              │
│    - Minimum quality              - Rings, simple settings                  │
│    - Not fully refined            - Lower tier crafted items                │
│    - Quick to craft               - Faster crafting                         │
│                                                                             │
│  Cut Gems                  ──►  Standard Jewelry                            │
│    - Shaped, not faceted          - Professional settings                   │
│    - Good quality                 - Mid-tier crafted items                  │
│    - Standard crafting            - Normal crafting time                    │
│                                                                             │
│  Faceted Gems             ──►  Fine Jewelry                                 │
│    - Fully refined                - Intricate settings                      │
│    - High quality                 - High-tier crafted items                 │
│    - Masterwork possible          - Longer crafting, higher value           │
│                                                                             │
│  Processed Minerals        ──►  Decorative/Carved Items                     │
│    - Tumbled, polished            - Statues, inlays                         │
│    - Lower value                  - Lower tier crafted items                │
│    - Often bulk crafted           - Batch crafting possible                 │
│                                                                             │
│  PROCESS IMPACT ON CRAFT:                                                   │
│  ──────────────────────────                                                 │
│  - Higher quality → Higher crafted value                                    │
│  - Masterwork gems → Masterwork jewelry (multiplicative)                   │
│  - Processing stage → Determines craft recipes available                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Why Process is Essential

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE ESSENTIAL ROLE OF PROCESS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WITHOUT PROCESS PHASE:                                                     │
│  ─────────────────────                                                      │
│  Discover → Craft → Sell                                                    │
│                                                                             │
│  Problems:                                                                  │
│  - Raw gems would have limited craft options                                │
│  - No value scaling through skill                                           │
│  - No idle gameplay between expeditions                                     │
│  - Craft would need to handle all transformation                            │
│  - Player skill would only matter in Discover                               │
│                                                                             │
│  ─────────────────────────────────────────────────────────────              │
│                                                                             │
│  WITH PROCESS PHASE:                                                        │
│  ────────────────────                                                       │
│  Discover → Process → Craft → Sell                                          │
│                                                                             │
│  Benefits:                                                                  │
│  ✓ Raw gems have clear progression path                                     │
│  ✓ Value scales with player skill and investment                            │
│  ✓ Idle gameplay during non-expedition times                                │
│  ✓ Clear division: Discover finds, Process refines, Craft creates          │
│  ✓ Player skill matters in two phases                                       │
│  ✓ Strategic decisions: What to process, how, when?                         │
│  ✓ Risk/reward depth through quality system                                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────              │
│                                                                             │
│  PLAYER EXPERIENCE ARC:                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  "I found a rough ruby in Mogok Valley!                                     │
│   (Discover - excitement of discovery)                                      │
│                                                                             │
│   Now I need to clean it carefully...                                       │
│   (Process - anticipation, careful action)                                  │
│                                                                             │
│   Good, it's clean. Should I cut it actively for max quality,               │
│   or queue it for idle processing while I find more?                        │
│   (Process - strategic decision)                                            │
│                                                                             │
│   I'll cut it actively. One mistake and I lose quality...                   │
│   (Process - tension, skill expression)                                     │
│                                                                             │
│   Perfect cut! Now to facet it...                                           │
│   (Process - mastery, progression)                                          │
│                                                                             │
│   A masterwork ruby! This will make an incredible ring.                     │
│   (Craft - anticipation of creation)                                        │
│                                                                             │
│   Let me craft a gold ring setting for it...                                │
│   (Craft - creative expression)                                             │
│                                                                             │
│   This ring is worth 5,000 coins!                                           │
│   (Sell - payoff)                                                           │
│                                                                             │
│   Time to find more rubies..."                                              │
│   (Loop restarts)                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Self-Critique and Refinements

### 8.1 Initial Design Critique

After completing the initial design, I identified these concerns:

#### Concern 1: Is Process distinct enough from Discover?

**Critique:** Both phases have minigames, both have idle/active modes, both use equipment bonuses. Are they too similar?

**Analysis:**
- Discover is about **exploration and luck** - you don't know what you'll find
- Process is about **skill and precision** - you know what you have, execution matters
- Discover minigames are **reactive** (catch, sort, match)
- Process minigames are **deliberate** (align, polish, extract)
- Discover has **varied locations** with different themes
- Process has **varied techniques** applied to same materials

**Verdict:** DISTINCT ENOUGH, but need to emphasize the contemplative, precision nature of Process minigames.

**Refinement:** Add a "meditation" bonus for Process - extended play sessions increase quality slightly, rewarding patience rather than speed.

#### Concern 2: Are the minigames actually fun?

**Critique:** Tumble Sort sounds tedious. Facet Alignment might be frustrating. Polish Wheel could be boring.

**Analysis:**
- Tumble Sort: Need to add visual interest (tumbling animation, sparkles) and audio satisfaction (clicking sounds)
- Facet Alignment: Need clear feedback (visual alignment guides, score preview) and forgiveness (generous tolerance early)
- Polish Wheel: Need tension (heat mechanic) and variety (different facet shapes, gem types)

**Verdict:** NEEDS REFINEMENT. Each minigame needs a "hook" - a moment of joy.

**Refinements:**
- Tumble Sort: Add combo system - selecting multiple gems in quick succession gives bonus
- Facet Alignment: Add slow-motion moment when near-perfect alignment happens
- Polish Wheel: Add sparkle explosion when a facet reaches perfect polish
- Crystal Separation: Add treasure hunt feeling - hidden gems revealed with dramatic flair

#### Concern 3: Is there enough depth for long-term play?

**Critique:** Once you've done each minigame 100 times, will it still be engaging?

**Analysis:**
- Skill progression (getting better at minigames) provides initial depth
- Equipment upgrades change the minigames slightly
- Rare/masterwork gems provide long-term goals
- But: minigames may become repetitive

**Verdict:** NEEDS MORE DEPTH. Add systems that create long-term engagement.

**Refinements:**
1. **Gem Lore System:** Discovering optimal processing methods for each gem type
   - "Rubies cut best at 45° angles"
   - "Diamonds need extra polishing on pavilion facets"
   - Unlock through gameplay, adds strategic knowledge

2. **Signature Styles:** Players develop reputation for certain processing
   - "Known for brilliant princess cuts"
   - "Master of emerald faceting"
   - NPC clients request specific styles

3. **Daily/Weekly Challenges:**
   - "Process 10 gems with 90%+ quality"
   - "Complete a masterwork ruby in under 5 minutes"
   - Rewards: Exclusive equipment, titles, bonuses

4. **Processing Mastery Ranks:**
   - Novice → Apprentice → Journeyman → Master → Grandmaster
   - Each rank: Unlock new techniques, bonuses, recognition

#### Concern 4: Are idle/active tradeoffs meaningful?

**Critique:** If active is always better, why use idle? If idle is convenient enough, why play active?

**Analysis:**
- Active ceiling: 110% quality (masterwork)
- Idle ceiling: 85% quality
- Active speed: 60-180 seconds per gem
- Idle speed: 5-120 minutes per gem
- Active can process 1 gem at a time
- Idle can process multiple gems simultaneously (queue)

**Verdict:** TRADEOFFS ARE MEANINGFUL when considering:
- High-value gems → Active (quality matters)
- Low-value materials → Idle (quality less important)
- Limited playtime → Idle (offline progress)
- Dedicated session → Active (more engaging)

**Refinement:** Make the tradeoff clearer in UI:
- Show projected value for both paths
- "Active: 1,580 coins (90% quality) in 5 min"
- "Idle: 1,200 coins (75% quality) in 45 min"

### 8.2 Additional Design Refinements

Based on critique, adding these systems:

#### Refinement A: Quality Preview System

Before processing, show:
```
┌─────────────────────────────────────────────────┐
│  PROCESSING PREVIEW                              │
│                                                  │
│  Material: Rough Ruby (80% quality)              │
│                                                  │
│  ACTIVE PROCESSING:                              │
│  Potential Quality: 70-110%                      │
│  Time: 4-6 minutes                               │
│  Risk: Quality loss if mistakes made             │
│  Reward: Masterwork possible                     │
│                                                  │
│  IDLE PROCESSING:                                │
│  Potential Quality: 65-85%                       │
│  Time: 45-90 minutes                             │
│  Risk: None (minimum 65%)                        │
│  Reward: Can batch with other gems               │
│                                                  │
│  [Process Active]     [Queue for Idle]          │
└─────────────────────────────────────────────────┘
```

#### Refinement B: Processing Log

Track player's processing history:
```
┌─────────────────────────────────────────────────┐
│  YOUR PROCESSING HISTORY                         │
│                                                  │
│  Total Processed: 1,247 items                    │
│  Masterworks Created: 23                         │
│  Best Quality: 108% (Diamond)                    │
│  Favorite Process: Faceting (45% of items)       │
│                                                  │
│  Recent Masterworks:                             │
│  - Ruby (104%) - 2 hours ago                     │
│  - Sapphire (102%) - 1 day ago                   │
│  - Emerald (106%) - 3 days ago                   │
└─────────────────────────────────────────────────┘
```

#### Refinement C: Equipment Specialization

Instead of generic upgrades, equipment has tradeoffs:
- Precision Tumbler: +20% quality, -10% speed
- Rapid Polisher: +30% speed, -5% quality ceiling
- Balanced Workbench: No bonuses, +1 queue slot

---

## 9. Final Polish Summary

### 9.1 Key Design Decisions

1. **Three-stage processing** (Clean → Cut → Facet) creates clear progression
2. **Quality system** (40-110%) provides skill expression and risk/reward
3. **Queue system** enables idle processing without requiring active attention
4. **Distinct minigames** emphasize precision over speed
5. **Equipment specialization** allows player expression
6. **Meaningful tradeoffs** between active and idle based on material value

### 9.2 Success Metrics

The Process phase succeeds when:

- ✓ Players understand the value chain (raw → clean → cut → facet)
- ✓ Players make strategic decisions (active for gems, idle for minerals)
- ✓ Minigames feel distinct from Discover (contemplative vs. reactive)
- ✓ Idle processing feels rewarding, not mandatory
- ✓ Active processing feels skillful, not tedious
- ✓ Quality loss creates tension without frustration
- ✓ Masterwork achievements feel earned, not random

### 9.3 Implementation Priority

**Phase 1 (MVP):**
- Basic cleaning minigame (Tumble Sort)
- Idle queue system (2 slots)
- Quality system (50-100%)
- Basic equipment effects

**Phase 2:**
- Cutting minigame (Facet Alignment)
- Faceting minigame (Polish Wheel)
- Queue expansion (up to 4 slots)
- Quality ceiling (up to 110%)

**Phase 3:**
- Crystal Separation minigame
- Skill tree system
- Equipment specialization
- Processing challenges

### 9.4 Open Questions for Playtesting

1. Is 60-180 seconds per minigame too long?
2. Is 85% idle quality cap too generous?
3. Do players understand the quality system intuitively?
4. Is quality loss too punishing for new players?
5. Does the queue system feel like progress or busywork?

---

## Appendix A: Processing Time Reference

| Material Type | Cleaning | Cutting | Faceting | Total Active | Total Idle |
|--------------|----------|---------|----------|--------------|------------|
| Common Mineral | 60s | 60s | 60s | 3 min | 30 min |
| Uncommon Gem | 75s | 90s | 120s | 4.75 min | 75 min |
| Rare Gem | 90s | 105s | 150s | 5.75 min | 100 min |
| Epic Gem | 90s | 120s | 180s | 6.5 min | 120 min |
| Legendary Gem | 90s | 120s | 180s | 6.5 min | 150 min |

## Appendix B: Equipment Cost Progression

| Equipment | Cost | Unlock Level | Source |
|-----------|------|--------------|--------|
| Basic Tumbler | 500 coins | 1 | Purchase |
| Vibrating Tumbler | 2,000 coins | 5 | Purchase |
| Sonic Cleaner | 8,000 coins | 15 | Purchase |
| Faceting Scope | 15,000 coins | 20 | Craft |
| Water-Cooled Wheel | 25,000 coins | 30 | Craft |
| Laser Cutter | 75,000 coins | 50 | Craft |
| Master's Workbench | 200,000 coins | 75 | Achievement |

---

**Document End**

*This design document is a living reference. Update as playtesting reveals new insights.*
