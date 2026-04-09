# Process — Design Doc

| Status: Design | Owner: System | Last Updated: 2026-03-30 |

---

## 1. Executive Summary

Process is the transformation layer between raw discovery and crafted value. Where Discover is about *finding* materials, Process is about *revealing* their potential.

**Why it exists:** Processing adds depth and player agency—raw materials are worth little, but properly processed gems command premium prices.

---

## 2. Design Goals

- **Primary goal:** Transform raw materials into higher-value processed gems
- **Secondary goals:** Create skill expression through minigames, risk/reward decisions
- **Non-goals:** Complex crafting recipes, equipment degradation
- **Fun factor:** Mastery through practice, risk/reward tension, transformation satisfaction

---

## 3. Core Behavior

### 3.1 Three Processing Categories

| Stage | Description | Available To | Value Increase |
|-------|-------------|--------------|----------------|
| **Cleaning** | Removes matrix/impurities, reveals base gem | All raw materials | +30-40% |
| **Cutting** | Shapes into workable forms | Gems only | +50-75% |
| **Faceting** | Adds brilliance/polish | Premium gems only (Mohs ≥ 6) | +80-125% |

### 3.2 Quality System

- **Range:** 40-110%
- **Higher quality** = higher sell value
- **Idle processing:** Queue-based, capped at 85% quality
- **Active processing:** Skill-based, can achieve masterwork (100%+)

### 3.3 Processing Restrictions

- **Cleaning:** All raw materials can be cleaned
- **Cutting:** Most gems; some minerals (those with crystalline structure)
- **Faceting:** Only premium gems — **OPAL, TURQUOISE excluded** (too soft, Mohs < 6)

### 3.4 Processing Chain

```
Raw Material (from Discover)
       │
       ▼
┌─────────────────┐
│    CLEANING     │
│  Tumble Sort    │ ← Idle or Active
│  +30-40% value  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     CUTTING     │
│ Facet Alignment │ ← Idle or Active
│  +50-75% value  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    FACETING     │
│  Polish Wheel   │ ← Idle or Active
│ +80-125% value  │
└────────┬────────┘
         │
         ▼
   Processed Gem
   (Craft Ready)
```

---

## 4. Minigame Designs

### 4.1 TUMBLE SORT (Cleaning)

**Purpose:** Remove matrix rock and impurities from raw gems and minerals.

**Materials:** All raw gems and minerals (first processing stage)

**Active Mode Loop:**
1. Materials tumble in barrel (rotation animation)
2. Player taps/clicks on raw gems to select for extraction
3. Selected gems move to cleaning tray
4. Player uses swipe gestures to brush away matrix
5. Quality determined by:
   - Matrix removal completeness
   - Wrong selections made
   - Time efficiency

**Scoring:**
- Perfect extraction: +15% quality
- Clean swipe: +5% per successful swipe
- Wrong selection: -10% quality
- Missed matrix: -3% per piece
- Time bonus (under 75s): +5%

**Idle Mode:**
- Automatic tumbling over time
- Base success: 70% quality preserved
- Takes 5-30 minutes depending on material
- Cannot achieve quality above 85%

---

### 4.2 FACET ALIGNMENT (Cutting)

**Purpose:** Shape rough gems into workable forms for further processing.

**Materials:** Cleaned gems (second processing stage)

**Active Mode Loop:**
1. Gem rotates slowly, showing different angles
2. Player selects a cutting plane (dashed line overlay)
3. Player drags to adjust cut angle
4. Player releases to execute cut
5. Score based on:
   - Alignment with ideal cut planes
   - Preservation of gem weight (carats)
   - Avoiding internal flaws

**Scoring:**
- Perfect alignment (within 2°): +20% quality
- Good alignment (within 5°): +10% quality
- Acceptable alignment (within 10°): +0%
- Poor alignment (10-20°): -10% quality
- Botched cut (>20°): -30% quality, gem cracked

**Idle Mode:**
- Automatic rough cutting
- Base success: 65% quality preserved
- Takes 10-60 minutes per gem

---

### 4.3 POLISH WHEEL (Faceting/Finishing)

**Purpose:** Add the final brilliance and finish to cut gems.

**Materials:** Cut gems (third processing stage), some minerals

**Active Mode Loop:**
1. Gem has 6-12 facets (depending on cut)
2. Each facet starts "dull" with imperfections
3. Player holds facet against polishing wheel
4. Pressure and angle affect polish quality
5. Over-polishing causes damage
6. Player must rotate gem to hit all facets
7. Perfect polish on all facets = masterwork gem

**Scoring:**
- Polish each facet to 0% imperfection
- Heat accumulates while holding
- Overheating (heat > 100%): Damage, -15% quality per overheat

**Perfect Polish Bonus:**
- All facets at 0%: +10% quality (masterwork)
- No overheats: Additional +5%
- Under time limit: Additional +5%

**Idle Mode:**
- Automatic polishing
- Base success: 60% quality preserved
- Takes 15-90 minutes per gem
- Random quality variance (50-85%)

---

### 4.4 CRYSTAL SEPARATION (Special)

**Purpose:** Extract embedded gems from matrix rock and geodes.

**Materials:** Geodes, matrix specimens

**Active Mode Loop:**
1. Player uses chisel to crack rock sections
2. Player uses brush to clear debris
3. Player taps gems to extract when revealed
4. Scoring based on gems extracted vs. present, damage

---

## 5. Idle vs Active Processing

### Key Philosophy

> **Active play earns capability. Idle play collects results.**

### Comparison Table

| Aspect | Discover Idle | Process Idle |
|--------|--------------|--------------|
| **What it does** | Generates new materials | Processes queued materials |
| **Input required** | Shift points (earned) | Raw materials + queue setup |
| **Time scale** | Hours | Minutes to hours |
| **Quality ceiling** | Can't get rares idle-only | Can't get masterwork idle-only |
| **Player action** | Collect accumulated loot | Queue materials, collect results |

### Neither Active Nor Idle is Strictly Better

| Scenario | Best Choice | Reasoning |
|----------|-------------|-----------|
| Legendary gem found | Active | Maximize quality, minimize risk |
| Common minerals (x50) | Idle | Not worth active time investment |
| Crafting order deadline | Active | Speed matters |
| Casual 5-minute session | Idle | Setup and collect |
| At work/school | Idle | Offline progress |

---

## 6. Processing Queue System

```
┌─────────────────────────────────────────────────────────────────────┐
│                         QUEUE SLOTS                                  │
│                                                                       │
│   Slot 1: [Rough Ruby] ─────► Cleaning ────► 12:34 remaining        │
│   Slot 2: [Clear Quartz] ────► Polishing ──► Complete! [Collect]     │
│   Slot 3: [Empty] ─────────── Click to add material                  │
│   Slot 4: [Locked] ────────── Unlock at Level 10                     │
│   Slot 5: [Locked] ────────── Unlock at Level 25                     │
│   Slot 6: [Locked] ────────── Unlock at Level 50                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Queue Rules:**
- Each slot processes one material at a time
- Player selects which process (Clean/Cut/Facet)
- Processing time depends on material type and equipment
- Completed items wait for collection
- Queue continues while game is closed (offline progress)

**Queue Limits:**
- Base slots: 2
- Level unlocks: +1 at 10, +1 at 25, +1 at 50
- Equipment bonuses: Certain tools add slots

---

## 7. Level-Based Unlocks

| Level | Unlock | Effect |
|-------|--------|--------|
| 1 | Process Screen | Access to basic cleaning |
| 3 | Idle Queue (1 slot) | Can queue 1 material for idle |
| 5 | Cutting | Unlock Facet Alignment minigame |
| 7 | Novice Skills | First skill tree tier |
| 10 | Queue Slot 2 | Can queue 2 materials |
| 15 | Faceting | Unlock Polish Wheel minigame |
| 20 | Crystal Separation | Unlock special minigame |
| 25 | Queue Slot 3 | Can queue 3 materials |
| 30 | Journeyman Skills | Third skill tree tier |
| 40 | Batch Processing | Process multiple at once |
| 50 | Master Skills | Final skill tree tier |

---

## 8. Dependencies & Interactions

- **Requires from other systems:**
  - Discover output (raw materials)
  - Process equipment
  - Inventory system
- **Provides to other systems:**
  - Processed gems → Craft phase
  - Sell items → Marketplace
- **Conflicts:** Cannot process while minigame is active

---

## 9. User Experience

### Inputs
- Select material from inventory
- Choose process type (Clean/Cut/Facet)
- Choose Active or Idle mode
- Play minigame (Active) or queue (Idle)

### Outputs / Feedback
- Quality score: 40-110%
- Material transformed
- Added to inventory or next stage

---

## 10. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| Quality below 50% | Material cracked, -25% final value |
| Quality below 30% | Material destroyed (lost) |
| Botched cut (>20°) | Gem cracked, quality penalty |
| Overheating on polish | Damage, -15% quality per overheat |

---

## 11. Tuning & Metrics

### Value Progression Example

Ruby (Base Value: 800 coins):

| Stage | Quality | Value | Cumulative Gain | Time |
|-------|---------|-------|-----------------|------|
| Raw | 80% | 640 | — | 30s expedition |
| Cleaned | 85% | 880 | +240 | +60s active |
| Cut | 80% | 1,100 | +220 | +90s active |
| Faceted | 90% | 1,580 | +480 | +120s active |

### Success Criteria
- Players understand idle vs active tradeoffs
- High-value gems justify active processing time
- Low-value minerals justify idle processing

---

## 12. Open Questions / Risks

- [ ] Minigame specifics need implementation planning
- [ ] Process equipment acquisition mechanics
- [ ] Processing skill tree implementation
- [ ] Batch processing UI design
