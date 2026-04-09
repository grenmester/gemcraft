# Discover — Design Doc

| Status: In Progress (Refactoring) | Owner: System | Last Updated: 2026-04-09 |

**Clarified Decisions (2026-04-09, updated 2026-04-09 v2):**
- **Tab Order:** Panning/Active is DEFAULT tab
- **Active Tab:** Shows mine selection directly (no intermediate button)
- **Navigation Flow:** Mine Selection → Mine Details (with subareas) → Subarea Details
- **Manual Mining:** Subarea view has "Mine" button with Small/Medium/Large reward options
- **Idle Tab:** Shows idle mine selection with worker info (placeholder until Workers implemented)
- **Starting state:** Empty (no starter worker, prompt to hire)

---

## 1. Executive Summary

Discover is the mining/expedition phase where players find raw materials through workers and manual extraction.

**Why it exists:** Discovery creates anticipation and excitement—finding materials is the foundation of the entire game economy.

---

## 2. Design Goals

- **Primary goal:** Provide a consistent stream of raw materials for processing
- **Secondary goals:** Create area variety, unlock progression, rare gem excitement
- **Non-goals:** Combat or survival elements, procedural map generation
- **Fun factor:** The thrill of rare drops, strategic area selection, idle accumulation

---

## 3. Core Behavior

### 3.1 Key Concepts

- **Areas:** Each mine location can have ONE worker assigned
- **Idle Generation:** Assigned workers produce materials automatically (1-minute tick)
- **Manual Extraction:** Player can manually mine for immediate rewards
- **Raw Materials:** Distinct items from processed gems (e.g., `rough_quartz` vs `clear_quartz`)

### 3.2 Mining Modes

| Mode | Description | Trigger |
|------|-------------|---------|
| **Idle** | Worker auto-generates materials | Worker assigned to area |
| **Active** | Manual mining for immediate rewards | Player clicks "Mine" button |

### 3.3 Area Progression

Unlocked through:
1. Player level requirements
2. Equipment upgrades (purchased with Cash)
3. Optional: Material requirements (later feature)

### 3.4 Area Loot Tables

Each area has a loot table defining drop rates:

```javascript
{
  TIER_1: {
    rough_quartz: 0.30,
    raw_obsidian: 0.25,
    raw_fluorite: 0.20,
    // ...
  }
}
```

### 3.5 Rare Drop System

- Base drop rates from loot table
- Worker Luck stat: `1 + (luck / 200)` modifier
- 5% chance to upgrade rarity tier on any drop

---

## 4. Mine Locations (Areas)

### 15 Location Tiers

| Tier | ID | Name | Unlock Level | Unlock Equipment | Unlocks |
|------|----|------|-------------|------------------|---------|
| 1 | TIER_1 | River Panning | 0 | NONE | Starter area |
| 1 | TIER_1_B | Ozark Hills | 2 | BASIC_PICKAXE | — |
| 1 | TIER_1_C | Bavarian Fields | 3 | BASIC_PICKAXE | — |
| 2 | TIER_2_A | Ural Shores | 5 | IRON_PICKAXE | — |
| 2 | TIER_2_B | Bahia Mines | 7 | IRON_PICKAXE | clear_quartz: 10 |
| 2 | TIER_2_C | Montana Streambed | 10 | STEEL_DRILL | — |
| 3 | TIER_3_A | Minas Gerais | 15 | STEEL_DRILL | clear_quartz: 20, obsidian: 10 |
| 3 | TIER_3_B | Mogok Valley | 20 | DIAMOND_DRILL | — |
| 3 | TIER_3_C | Sri Lanka Fields | 25 | DIAMOND_DRILL | lapis_lazuli: 5 |
| 4 | TIER_4_A | Muzo Highlands | 30 | HEAVY_MACHINERY | — |
| 4 | TIER_4_B | Kashmir Heights | 35 | HEAVY_MACHINERY | malachite: 10, azurite: 5 |
| 4 | TIER_4_C | Argyle Caverns | 40 | ELITE_OPERATIONS | — |
| 5 | TIER_5_A | Golconda Depths | 50 | ELITE_OPERATIONS | hematite: 20, pyrite: 10 |
| 5 | TIER_5_B | Androy Dunes | 60 | ELITE_OPERATIONS | labradorite: 5, celestite: 5 |
| 5 | TIER_5_C | Mogok Hidden | 75 | ELITE_OPERATIONS | lapis_lazuli: 3, malachite: 3, azurite: 3 |

---

## 5. Discovery Equipment

Purchased with Cash, unlocks new mine areas.

| ID | Name | Cost | Unlock Level | Drop Rate Bonus | Extra Items | Unlocks |
|----|------|------|------------|---------------|-------------|---------|
| `NONE` | None | 0 | 0 | 0% | 0 | TIER_1 |
| `BASIC_PICKAXE` | Basic Pickaxe | 100 | 2 | +10% | 0 | TIER_1_B, TIER_1_C |
| `IRON_PICKAXE` | Iron Pickaxe | 500 | 5 | +20% | 0 | TIER_2_A, TIER_2_B |
| `STEEL_DRILL` | Steel Drill | 2,000 | 10 | +30% | 1 | TIER_2_C, TIER_3_A |
| `DIAMOND_DRILL` | Diamond Drill | 5,000 | 20 | +40% | 1 | TIER_3_B, TIER_3_C |
| `HEAVY_MACHINERY` | Heavy Machinery | 15,000 | 35 | +50% | 2 | TIER_4_A, TIER_4_B |
| `ELITE_OPERATIONS` | Elite Operations | 50,000 | 50 | +60% | 2 | TIER_4_C, TIER_5_A, TIER_5_B, TIER_5_C |

---

## 6. Raw Materials

Raw materials are items found in the wild before processing.

### Material Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Raw Gems** | Uncut precious stones | rough_ruby, rough_sapphire |
| **Raw Minerals** | Industrial/crafting minerals | raw_quartz, raw_obsidian |

### Processing Affordances

| Raw Material Type | Can Clean | Can Cut | Can Facet |
|-------------------|-----------|---------|-----------|
| Gems | ✓ | Most | Premium only (Mohs ≥ 6) |
| Minerals | ✓ | Some crystalline | No |

---

## 7. Dependencies & Interactions

- **Requires from other systems:**
  - Workers (for idle generation)
  - Loot tables (for drop rates)
  - Equipment system (for unlocks)
- **Provides to other systems:**
  - Raw materials → Process phase
  - Discovery tracking → Gemdex
  - Coins through selling → Economy

---

## 8. User Experience

### Tab Structure

| Tab | Default | Description |
|-----|---------|-------------|
| **Panning (Active)** | ✓ DEFAULT | Mine selection → Mine details → Subarea details |
| **Idle** | - | Idle mine selection with worker info |

### Navigation Flow (Active/Panning Tab)

```
┌─────────────────────────────────────────────────────────────┐
│  DISCOVER → PANNNING TAB (Default)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Panning ✓ ]  [ Idle ]    ← Tabs                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🗺 MINE SELECTION                                   │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ River    │ │ Ozark    │ │ Bavarian │  ...       │   │
│  │  │ Panning  │ │ Hills    │ │ Fields   │           │   │
│  │  │ TIER 1   │ │ TIER 1   │ │ TIER 1   │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  │                                                      │   │
│  │  (Grid of mine cards, clickable)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (click mine)
┌─────────────────────────────────────────────────────────────┐
│  DISCOVER → MINE DETAILS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [← Back to Mines]    TIER 1: River Panning                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📍 River Panning                                    │   │
│  │  A gentle stream where beginners find their first     │   │
│  │  gems. Perfect for learning the basics.              │   │
│  │                                                      │   │
│  │  Workers Assigned: 1/3                              │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🧑‍🔧 Novice Miner (Lv.3) - Area A         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SUBAREAS                                           │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │  Area A - River Bend                       │   │   │
│  │  │  Common gems • Loot table preview          │   │   │
│  │  │  [View Details →]                          │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │  Area B - Sandbar                         │   │   │
│  │  │  Common gems • Loot table preview          │   │   │
│  │  │  [View Details →]                          │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │  Area C - Rocky Shore                      │   │   │
│  │  │  Uncommon gems • Loot table preview        │   │   │
│  │  │  [View Details →]                          │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (click subarea)
┌─────────────────────────────────────────────────────────────┐
│  DISCOVER → SUBAREA DETAILS                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [← Back to Mine]    Area A - River Bend                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🌊 Area A - River Bend                              │   │
│  │                                                      │   │
│  │  A calm bend in the river with excellent gem         │   │
│  │  deposits in the shallow water.                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💎 LOOT TABLE                                      │   │
│  │                                                      │   │
│  │  Clear Quartz        ████████████████░░░░  40%      │   │
│  │  Raw Obsidian        █████████████░░░░░░░  30%      │   │
│  │  Raw Fluorite        ██████████░░░░░░░░░░  25%      │   │
│  │  Amethyst            ████░░░░░░░░░░░░░░░░   5%      │   │
│  │                                                      │   │
│  │  ⚠️ 5% chance for rarity upgrade                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🧑‍🔧 ASSIGNED WORKERS                               │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ 🧑‍🔧 Novice Miner (Lv.3)                    │   │   │
│  │  │ EFF: 45 | LCK: 30 | Lv XP: ████░░ 67%     │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  + Assign more workers (dropdown)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⛏️ MANUAL MINING                                   │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Small   │ │  Medium  │ │   Large  │           │   │
│  │  │  Reward  │ │  Reward  │ │  Reward  │           │   │
│  │  │  1 item  │ │  3 items │ │  5 items │           │   │
│  │  │  +5s CD   │ │  +15s CD │ │  +30s CD │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  │                                                      │   │
│  │  Cooldowns reset after 5 minutes                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Flow (Idle Tab)

```
┌─────────────────────────────────────────────────────────────┐
│  DISCOVER → IDLE TAB                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Panning ]  [ Idle ✓ ]    ← Tabs                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🧑‍🔧 WORKERS OVERVIEW                                │   │
│  │                                                      │   │
│  │  Total Workers: 3 / 10                            │   │
│  │  Assigned: 2 | Idle: 1                            │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ 🧑‍🔧 Novice Miner (Lv.5)                    │   │   │
│  │  │ Assigned to: Area A - River Bend           │   │   │
│  │  │ Next tick: 45s                            │   │   │
│  │  │ Pending: 3 items [Collect]                 │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ 🧑‍🔧 Seasoned Prospector (Lv.8)             │   │   │
│  │  │ Assigned to: Area B - Sandbar              │   │   │
│  │  │ Next tick: 12s                            │   │   │
│  │  │ Pending: 1 item [Collect]                  │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ 🧑‍🔧 Crystal Specialist (Lv.12) ⚡ Idle      │   │   │
│  │  │ No assignment                              │   │   │
│  │  │ [Assign to mine →]                        │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⏱ NEXT GENERATION: River Panning                 │   │
│  │  ████████████████░░░░░░░░░░░  45s                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Empty State (No Workers)

When `workers.length === 0`:
```
┌─────────────────────────────────────────────────────────────┐
│  No workers hired yet.                                      │
│  Go to [Workers] tab to hire your first!                   │
│                                                             │
│  Mines are ready but waiting for workers to generate       │
│  materials while you're away.                               │
└─────────────────────────────────────────────────────────────┘
```

### Inputs
- Click Panning tab → Mine selection (DEFAULT)
- Click Idle tab → Worker overview with idle info
- Click mine card → Mine details with subareas
- Click subarea → Subarea details with loot table, workers, mine buttons
- Click "Mine (Small/Medium/Large)" → Simulate resource gathering
- Click "Collect" → Add pending materials to inventory

### Outputs / Feedback
- Subarea loot tables visible
- Worker assignment status per subarea
- Mining cooldowns per subarea
- Pending materials count
- "Collect" adds materials to inventory

---

## 9. Generation Flow

### Per-Tick Generation (1 minute)

```
1. Timer reaches 0
2. Check if area has assigned worker
3. If yes:
   a. Roll loot from area loot table
   b. Apply worker efficiency bonus
   c. Apply worker luck bonus
   d. Add item(s) to area's pending pile
   e. Reset timer
4. If no worker:
   - No generation occurs
   - Display "Assign a worker to generate materials"
```

### Pending Materials

- Each area has its own pending pile (Map: `areaId -> PendingItem[]`)
- Pending items shown with count badge
- "Collect" button transfers all pending to inventory
- Offline progress calculates accumulated ticks (capped at 8 hours)

## 10. Failure & Mitigation

| Failure | Handling |
|---------|----------|
| No worker assigned | Show empty state with prompt to hire |
| Area locked | Show unlock requirements (equipment, level) |
| No pending materials | "Collect" button disabled, shows "No materials to collect" |
| Inventory full | Show warning, materials stay in pending |

---

## 11. Tuning & Metrics

### Exposed Variables for Balancing

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| Base drop rate common | 30% | 20-40% | Common item frequency |
| Rare drop threshold | 0.95 | 0.90-0.99 | Legendary chance |
| Rarity upgrade chance | 1 tier | 1-2 tiers | Rare scaling |

### Success Criteria
- Players find first rare gem within 30 minutes
- TIER_5 feels meaningfully different from TIER_1
- Worker placement creates strategic decisions

---

## 12. Open Questions / Risks

- [x] Area count (decided: 15 across 5 tiers)
- [x] Equipment progression (decided: 7 tiers)
- [x] Worker assignment flow (decided: Hybrid)
- [x] Material accumulation (decided: Per-area pending)
- [x] Starting state (decided: Empty, prompt to hire)
- [x] Tab order (decided: Panning default)
- [x] Subarea navigation (decided: Mine Selection → Mine Details → Subarea Details)
- [x] Manual mining rewards (decided: Small/Medium/Large buttons)
- [ ] Subarea data structure (TBD: how to define subareas per mine)
- [ ] Mining cooldown persistence (TBD: store in localStorage?)
- [ ] Worker generation logic (Phase 1)
