# Gemstone Collector — Game Design Document (GDD)

> **Version:** 4.0  
> **Last Updated:** 2026-03-30  
> **Status:** Active Specification

> **Related Documentation:**
> - [Worker System Detail](./docs/plans/2026-03-30-phase-1-workers-design.md) — Full worker mechanics specification
> - [Data Schema Reference](./src/schemas/) — Zod schemas for all data types
> - [Implementation Plans](./docs/plans/) — Phase-by-phase build roadmap

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Game Phases](#2-game-phases)
3. [Worker System](#3-worker-system)
4. [Currency & Economy](#4-currency--economy)
5. [Progression Systems](#5-progression-systems)
6. [Data Reference](#6-data-reference)
7. [UI/UX Specification](#7-uiux-specification)
8. [Technical Notes](#8-technical-notes)

---

## 1. Game Overview

### 1.1 Core Philosophy

**Gemstone Collector** is a casual idle/active hybrid game where players build a gem empire through discovery, collection, and strategic value-addition. The game emphasizes the journey from raw material to crafted treasure.

**Core Pillars:**
1. **Discovery-Driven** — Finding materials creates anticipation and excitement
2. **Earned Idle** — Rewards collected through active play, accumulated passively
3. **Layered Depth** — Simple at first, increasingly complex strategic decisions

### 1.2 Genre & Platform

- **Type:** Idle/Active Hybrid Collection Game
- **Platform:** Web (React/Vite), responsive (desktop-first, mobile-friendly)
- **Session Length:** 5 minutes to hours (flexible)
- **Monetization:** None — passion project for learning and fun
- **Multiplayer:** No (single-player only)

### 1.3 Core Game Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE GAME LOOP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐                  │
│  │  DISCOVER   │────►│  PROCESS     │────►│   CRAFT     │                  │
│  │             │     │              │     │             │                  │
│  │  - Workers  │     │  - Cleaning  │     │  - Jewelry  │                  │
│  │  - Areas    │     │  - Cutting   │     │  - Metals   │                  │
│  │  - Mining   │     │  - Faceting  │     │  - Assembly │                  │
│  └─────────────┘     └──────────────┘     └─────────────┘                  │
│         │                                      │                           │
│         │                                      ▼                           │
│         │                              ┌─────────────┐                     │
│         │                              │ MARKETPLACE │                     │
│         │                              │             │                     │
│         │                              │  - Quick    │                     │
│         │                              │    Sell     │                     │
│         │                              │  - List     │                     │
│         │                              │  - History  │                     │
│         │                              └─────────────┘                     │
│         │                                      │                           │
│         │                                      ▼                           │
│         │                              ┌─────────────┐                     │
│         │                              │   UPGRADES  │                     │
│         │                              │             │                     │
│         └──────────────────────────────►│  - Workers  │                     │
│                                        │  - Areas    │                     │
│                                        │  - Process  │                     │
│                                        └─────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Item Flow

```
DISCOVER (Mine Raw Materials)
        │
        ▼
┌───────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Raw Materials   │────►│    PROCESS      │────►│  Processed Gems │
│                   │     │                 │     │                 │
│  - rough_quartz   │     │  - Cleaning    │     │  - clear_quartz │
│  - rough_ruby     │     │  - Cutting     │     │  - ruby          │
│  - raw_malachite  │     │  - Faceting    │     │  - malachite     │
└───────────────────┘     └─────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │     CRAFT       │
                                                  │                 │
                                                  │  - Gold Ring    │
                                                  │  - Platinum     │
                                                  │    Necklace     │
                                                  └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │   SELL/CASH     │
                                                  │                 │
                                                  │  $10 → $100+    │
                                                  └─────────────────┘
```

---

## 2. Game Phases

### 2.1 Discover (Mining)

**Purpose:** Find and collect raw materials through workers and manual extraction.

**Key Concepts:**
- **Areas:** Each mine location can have ONE worker assigned
- **Idle Generation:** Assigned workers produce materials automatically (1-minute tick)
- **Manual Extraction:** Player can manually mine for immediate rewards
- **Raw Materials:** Distinct items from processed gems (e.g., `rough_quartz` vs `clear_quartz`)

**Area Progression:** Unlocked through upgrades purchased with Cash.

**Sub-Modes:**
| Mode | Description | Trigger |
|------|-------------|---------|
| **Idle** | Worker auto-generates materials | Worker assigned to area |
| **Active** | Manual mining for immediate rewards | Player clicks "Mine" button |

### 2.2 Process (Refining)

**Purpose:** Transform raw materials into refined gems/minerals.

**Processing Stages:**
| Stage | Description | Available To | Value Increase |
|-------|-------------|--------------|-----------------|
| **Cleaning** | Removes matrix/impurities, reveals base gem | All raw materials | +30-40% |
| **Cutting** | Shapes into workable forms | Gems only | +50-75% |
| **Faceting** | Adds brilliance/polish | Premium gems only | +80-125% |

**Processing Restrictions:**
- **Cleaning:** All raw materials can be cleaned
- **Cutting:** Most gems; some minerals (those with crystalline structure)
- **Faceting:** Only premium gems — **OPAL, TURQUOISE excluded** (too soft, Mohs < 6)

**Quality System:**
- Range: 40-110%
- Higher quality = higher sell value
- Idle processing: Queue-based, capped at 85% quality
- Active processing: Skill-based, can achieve masterwork (100%+)

### 2.3 Craft (Jewelry Creation)

**Purpose:** Combine processed gems with metals to create valuable jewelry.

**Jewelry Types:**
| Type | Gem Slots | Metal Required | Base Multiplier |
|------|-----------|----------------|-----------------|
| Ring | 1 | Any metal | 2.5x |
| Pendant | 1 | Gold/Platinum | 3.0x |
| Earrings | 2 (paired) | Any metal | 2.8x |
| Bracelet | 3 | Any metal | 3.5x |
| Necklace | 4 (1 centerpiece + 3 accent) | Platinum only | 5.0x |
| Crown | 6 (1 centerpiece + 5 accent) | Platinum only | 8.0x |

### 2.4 Marketplace (Selling)

**Purpose:** Convert items to Cash.

**Access:** Menu item (not separate phase)

**Mechanics:**
- **Quick-sell:** Instant sale at base market rates
- **List items:** Set custom prices, wait for buyers
- **Price history:** View market trends

**Profit Margins:**
| Item Type | Margin |
|-----------|--------|
| Raw materials | Lowest (encourages processing) |
| Processed gems/minerals | Medium |
| Crafted jewelry | Highest |

**Marketplace fees:** Apply to player-to-player sales.

### 2.5 Gemdex (Collection)

**Purpose:** Track discovered items, workers, and upgrades.

**Four Tabs:**
1. **Raw Materials** — All unprocessed items discovered
2. **Processed** — Refined gems and minerals
3. **Workers** — All owned workers, XP, assignments
4. **Upgrades** — Purchased upgrades, current bonuses

**Features:**
- Search function
- Progress tracking (X/Y discovered, percentage)
- Each entry shows: name, stack size, location found, processing options, market price

### 2.6 Workers Tab

**Purpose:** Manage worker hiring, assignment, and progression.

**Features:**
- View all owned workers
- Hire new workers from shop
- Assign/unassign workers to areas
- View worker stats and level progress

---

## 3. Worker System

> **Detailed Specification:** See [Worker System Design](./docs/plans/2026-03-30-phase-1-workers-design.md)

### 3.1 Overview

Workers are the primary source of idle material generation. Each worker:
- Can be assigned to ONE mine area
- Generates materials automatically over time
- Earns XP and levels up
- Has unique stats affecting generation

### 3.2 Worker Types

| ID | Name | Cost | Max Level | Efficiency | Luck | Speed | Description |
|----|------|------|-----------|------------|------|-------|-------------|
| `novice_miner` | Novice Miner | 100 | 10 | 30 | 20 | 50 | Beginner learning the ropes |
| `seasoned_prospector` | Seasoned Prospector | 500 | 25 | 50 | 40 | 40 | Years of reliable experience |
| `crystal_specialist` | Crystal Specialist | 2,000 | 50 | 75 | 30 | 25 | Expert in extracting precious gems |
| `fortune_seeker` | Fortune Seeker | 3,500 | 50 | 40 | 80 | 45 | Lucky by nature, finds rare gems |
| `master_gemologist` | Master Gemologist | 10,000 | 100 | 90 | 70 | 60 | Pinnacle of mining expertise |

### 3.3 Worker Instance Properties

Each worker instance in player state has:

```typescript
interface WorkerInstance {
  id: string;                    // Unique instance ID (e.g., "worker-1700000000000-abc123")
  workerTypeId: string;          // Reference to worker type (e.g., "novice_miner")
  level: number;                 // Current level (1 to workerType.maxLevel)
  xp: number;                    // Current XP (resets to 0 on level up)
  assignedArea: string | null;   // Location tier (e.g., "TIER_1") or null if unassigned
  assignedAt: number | null;    // Timestamp when assigned
}
```

### 3.4 Worker Stats

Each worker type has base stats (0-100 scale):

| Stat | Effect |
|------|--------|
| **Efficiency** | Affects material yield per tick |
| **Luck** | Increases chance of rare drops |
| **Speed** | Affects tick interval (not currently implemented) |

### 3.5 Leveling System

**XP to Next Level:**
```
XP_required = baseXpToLevel * (1.1 ^ (level - 1))

Examples (baseXpToLevel = 100):
- Level 1→2: 100 XP
- Level 2→3: 110 XP
- Level 3→4: 121 XP
- Level 10: ~235 XP
```

**Level Up Bonuses:**
- Worker level increases by 1
- XP resets to 0
- Efficiency bonus = baseEfficiency * (1 + level * 0.05)

### 3.6 Generation Mechanics

**Tick Interval:** 1 minute (60 seconds)

**Per Tick Calculation:**
```
1. Get area loot table for assigned area
2. Roll for base yield from loot table
3. Apply efficiency multiplier: (workerEfficiency + levelBonus) / 100
4. Apply luck multiplier: 1 + (workerLuck / 200)
5. Calculate final yield: floor(baseYield * efficiencyMult * luckMult)
6. Calculate XP earned: floor(baseXpPerAction * efficiencyMult)
7. Award materials to inventory
8. Award XP to worker
9. Check for level up
```

**Rare Drop Bonus:**
- If random roll > 0.95 (5% chance): Upgrade rarity one tier

### 3.7 Offline Progress

Workers continue generating while the player is away.

**On App Load:**
1. Calculate elapsed time since last session
2. Cap offline ticks at 8 hours (480 ticks at 1 min each)
3. Process accumulated ticks
4. Apply all materials and XP
5. Check for level ups

### 3.8 Assignment Rules

- One worker per area maximum
- Workers can be reassigned freely (no cooldown)
- Unassigning stops generation for that area
- Starter worker given at game start, auto-assigned to TIER_1

---

## 4. Currency & Economy

### 4.1 Currency Types

| Currency | Source | Use |
|----------|--------|-----|
| **Cash (Coins)** | Selling items in marketplace | Purchasing upgrades, hiring workers, unlocking areas |
| **XP (Experience)** | Worker generation, manual mining, processing | Leveling up workers |

### 4.2 Player State

```typescript
interface PlayerState {
  coins: number;                    // Cash balance
  level: number;                   // Player level (not currently used for progression)
  xp: number;                      // Player XP (not currently implemented)
  gems: Array<{gemId: string, quality: number}>;  // Inventory: gems
  minerals: Array<{id: string, quantity: number}>; // Inventory: minerals
  equipment: string[];              // Owned discovery equipment IDs
  processEquipment: string[];      // Owned processing equipment IDs
  gemdex: string[];                // Discovered gem IDs
  workers: WorkerInstance[];       // Owned workers
  lastOnlineTimestamp: number;      // For offline progress
  totalWorkerXp: number;            // Lifetime worker XP (stats tracking)
}
```

### 4.3 Value Progression

| Stage | Quality Range | Value Multiplier |
|-------|---------------|------------------|
| Raw (from Discover) | 60-100% | 1.0x |
| Cleaned | 50-115% | 1.3-1.5x |
| Cut | 40-115% | 1.5-2.0x |
| Faceted | 40-110% | 2.0-3.0x |

**Example Chain:**
```
rough_quartz (raw):        $10 base
  → clear_quartz (cleaned): $14 (+40%)
    → cut_quartz (cut):     $25 (+80%)
      → faceted_quartz:     $35 (+250%)
        → Gold Ring:        $87 (highest)
          → Marketplace:    $100+ (premium pricing)
```

---

## 5. Progression Systems

### 5.1 Discovery Equipment

Purchased with Cash, unlocks new mine areas.

| Equipment ID | Name | Cost | Unlock Level | Drop Rate Bonus | Extra Items | Unlocks |
|--------------|------|------|--------------|-----------------|-------------|---------|
| `NONE` | None | 0 | 0 | 0% | 0 | TIER_1 |
| `BASIC_PICKAXE` | Basic Pickaxe | 100 | 2 | +10% | 0 | TIER_1_B, TIER_1_C |
| `IRON_PICKAXE` | Iron Pickaxe | 500 | 5 | +20% | 0 | TIER_2_A, TIER_2_B |
| `STEEL_DRILL` | Steel Drill | 2,000 | 10 | +30% | 1 | TIER_2_C, TIER_3_A |
| `DIAMOND_DRILL` | Diamond Drill | 5,000 | 20 | +40% | 1 | TIER_3_B, TIER_3_C |
| `HEAVY_MACHINERY` | Heavy Machinery | 15,000 | 35 | +50% | 2 | TIER_4_A, TIER_4_B |
| `ELITE_OPERATIONS` | Elite Operations | 50,000 | 50 | +60% | 2 | TIER_4_C, TIER_5_A, TIER_5_B, TIER_5_C |

### 5.2 Mine Locations (Areas)

15 location tiers, organized by unlock level.

| Tier | Location ID | Name | Unlock Level | Unlock Equipment | Unlock Materials |
|------|-------------|------|--------------|------------------|------------------|
| 1 | TIER_1 | River Panning | 0 | NONE | — |
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

### 5.3 Process Equipment

Twelve equipment items across three categories (cleaning, cutting, faceting), each providing speed and quality bonuses.

> **Full list:** See `src/data/processEquipment.js`

### 5.4 Processing Queue

- Base: 2 slots
- Additional slots unlock at player levels 10, 25, 50
- Idle processing continues while offline

### 5.5 Upgrades

Purchased with Cash, providing permanent bonuses.

**Categories:**
| Category | Description |
|----------|-------------|
| **Processing** | Faster cleaning/cutting/faceting, quality bonuses |
| **Discovery** | Better drop rates, hidden vein detection |
| **Storage** | Increased inventory capacity |
| **Marketplace** | Lower fees, price history |

**Upgrade Properties:**
```yaml
- id: upgrade_id
  name: Display Name
  description: Effect description
  category: processing|discovery|storage|marketplace
  tier: 1-3
  cost:
    coins: number
    materials: { item_id: quantity }
  effect:
    type: string
    value: number | boolean
  maxLevel: number (optional)
```

---

## 6. Data Reference

### 6.1 Items (40 Total)

**Gems (24):**
| Rarity | Count | Examples |
|--------|-------|-----------|
| Legendary | 6 | Diamond, Blue Diamond, Alexandrite, Taaffeite, Musgravite, Red Beryl |
| Epic | 6 | Ruby, Sapphire, Emerald, Tanzanite, Paraíba Tourmaline, Jadeite |
| Rare | 5 | Spinel, Tsavorite, Black Opal, Imperial Topaz, Natural Pearl |
| Uncommon | 6 | Aquamarine, Tourmaline, Peridot, Opal, Citrine, Turquoise |
| Common | 2 | Amethyst, Clear Quartz |

**Minerals (16):**
| Rarity | Count | Examples |
|--------|-------|-----------|
| Uncommon | 7 | Malachite, Azurite, Lapis Lazuli, Rose Quartz, Labradorite, Celestite, Quartz Geode |
| Common | 9 | Clear Quartz, Obsidian, Moonstone, Calcite, Fluorite, Hematite, Pyrite, Gypsum, Mica |

### 6.2 Item Schema

```yaml
items:
  - id: string              # unique identifier (e.g., "ruby", "clear_quartz")
    name: string            # display name (e.g., "Ruby")
    category: Gem|Mineral  # item category
    hardness: number       # Mohs scale (1-10)
    value: number          # base coin value
    rarity: Common|Uncommon|Rare|Epic|Legendary
    realWorldLocations:     # for flavor/flair
      - string
    processing:
      canClean: boolean
      canCut: boolean
      canFacet: boolean
      baseProcessTime: number    # seconds
      processDifficulty: number   # 1-5
```

### 6.3 Location Schema

```yaml
TIER_X:
  name: string              # display name
  color: string             # hex color for UI (#RRGGBB)
  unlockLevel: number       # player level required
  unlockEquipment: string   # equipment ID required
  unlockMaterials:          # materials required (null if none)
    item_id: quantity
```

### 6.4 Worker Schema

```yaml
workers:
  - id: string              # unique type identifier
    name: string            # display name
    description: string    # flavor text
    maxLevel: number       # maximum level for this type
    baseXpPerAction: number # XP earned per tick
    xpToLevel: number      # base XP to reach level 2
    stats:
      efficiency: number   # 0-100
      luck: number        # 0-100
      speed: number       # 0-100
    cost:
      coins: number        # purchase cost
```

### 6.5 Equipment Schema

```yaml
equipment_id:
  id: string
  name: string
  cost: number
  unlockLevel: number
  effect:
    dropRateBonus: number  # 0-1 (percentage)
    extraItems: number      # additional items per discovery
  unlocks:                  # array of location IDs this equipment unlocks
    - string
  description: string
  craftRecipe:             # null if purchase-only
    materials:
      item_id: quantity
    coins: number
```

---

## 7. UI/UX Specification

### 7.1 Navigation Menu

```
┌─────────────────────────┐
│   GEMSTONE COLLECTOR   │  ← Header
├─────────────────────────┤
│  ▶ Discover (Mining)    │  ← Worker management, area selection
│  ▶ Process             │  ← Refine raw materials
│  ▶ Craft               │  ← Create jewelry
│  ▶ Marketplace         │  ← Buy/Sell
│  ▶ Gemdex              │  ← Collection encyclopedia
│  ▶ Workers             │  ← Worker management (NEW)
│  ▶ Upgrades            │  ← Shop for upgrades
├─────────────────────────┤
│  💰 CASH    ⭐ XP       │  ← Footer stats
└─────────────────────────┘
```

### 7.2 Component Architecture

```
src/
├── features/
│   ├── discover/          # Location selection, rewards
│   ├── inventory/        # Inventory, Gemdex
│   ├── process/          # Processing UI, queue
│   ├── craft/            # Jewelry creation (placeholder)
│   ├── sell/             # Marketplace (placeholder)
│   ├── workers/          # Worker management (NEW)
│   └── upgrades/         # Upgrade shop
├── shared/
│   ├── components/       # Menu, DebugPanel, ItemIcons
│   ├── hooks/           # useGame, usePlayer
│   └── utils/            # zoneUnlock, queueProcessing
├── context/
│   └── GameContext.jsx  # Main state management
├── schemas/              # Zod validation schemas
├── loaders/              # YAML data loaders with validation
└── data/                 # YAML data files
```

### 7.3 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### 7.4 Visual Style

- **Theme:** Dark slate with gold accents
- **Primary Colors:**
  - Background: `#1a1a2e` (dark slate)
  - Accent: `#ffd700` (gold)
  - Text: `#e0e0e0` (light gray)
- **Rarity Colors:**
  - Common: `#a0a0a0` (gray)
  - Uncommon: `#4CAF50` (green)
  - Rare: `#2196F3` (blue)
  - Epic: `#9C27B0` (purple)
  - Legendary: `#FF9800` (orange)

---

## 8. Technical Notes

### 8.1 Technology Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** React Context + useReducer
- **Data Validation:** Zod
- **Data Format:** YAML (human-editable)
- **Testing:** Vitest + React Testing Library
- **E2E Testing:** Playwright

### 8.2 Data Pipeline

```
src/data/*.yaml (human-editable)
        │
        ▼
src/loaders/*.js (import.meta.glob + js-yaml)
        │
        ▼
src/schemas/*.js (Zod validation at load time)
        │
        ▼
Runtime data (items, workers, upgrades, etc.)
```

### 8.3 Schema Validation

All YAML data files are validated against Zod schemas at module load time. Invalid data throws descriptive errors:

```javascript
// Example error output
❌ Invalid items.yaml: {
  items: {
    0: {
      hardness: {
        _errors: ["Number must be <= 10"]
      }
    }
  }
}
```

### 8.4 Persistence

- **Storage:** localStorage
- **Save Trigger:** Automatic on state change (debounced)
- **Offline Progress:** Calculated on load based on `lastOnlineTimestamp`

### 8.5 Build & Test Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run test     # Run tests (watch mode)
npm run test:run # Run tests once
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Area** | A mine location where workers can be assigned |
| **Cleaning** | First stage of processing, removes matrix |
| **Cutting** | Second stage of processing, shapes the gem |
| **Faceting** | Final stage of processing, adds brilliance |
| **Gemdex** | Collection/encyclopedia tracking discovered items |
| **Loot Table** | Probability distribution for item drops |
| **Player Level** | Overall player progression (not currently used) |
| **Quality** | Percentage affecting item value (40-110%) |
| **Raw Material** | Item before processing (e.g., rough_quartz) |
| **Processed** | Item after processing (e.g., clear_quartz) |
| **Tick** | Time interval for worker generation (1 minute) |
| **Worker** | Assignable entity that generates materials |

---

## Appendix B: File Inventory

### Data Files
- `src/data/items.yaml` — 40 items (gems + minerals)
- `src/data/workers.yaml` — 5 worker types
- `src/data/upgrades.yaml` — 10 upgrades
- `src/data/locations.yaml` — 15 location tiers
- `src/data/equipment.yaml` — 7 discovery equipment
- `src/data/processEquipment.yaml` — 12 processing equipment

### Schema Files
- `src/schemas/items.js`
- `src/schemas/workers.js`
- `src/schemas/upgrades.js`
- `src/schemas/locations.js`
- `src/schemas/equipment.js`

### Loader Files
- `src/loaders/items.js`
- `src/loaders/workers.js`
- `src/loaders/upgrades.js`
- `src/loaders/locations.js`
- `src/loaders/equipment.js`

---

*This document is the authoritative source for game mechanics. All implementation should follow this specification. For detailed worker system mechanics, see the linked Worker System Design document.*
