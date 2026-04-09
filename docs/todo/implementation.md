# Implementation Plan — Consolidated

| Status: In Progress | Owner: System | Last Updated: 2026-03-30 |

---

## Phase 0: Data Foundation

**Goal:** Create the data foundation for the game redesign — workers, raw materials, and upgrades as YAML data files with JS loader utilities.

### Tasks

| Task | Description | Files |
|------|-------------|-------|
| 0.1 | Install js-yaml dependency | package.json |
| 0.2 | Create Workers data (YAML + loader) | src/data/workers.yaml, workers.js |
| 0.3 | Create Upgrades data | src/data/upgrades.yaml, upgrades.js |
| 0.4 | Create Raw Materials data | src/data/raw-materials.yaml, rawMaterials.js |
| 0.5 | Write data tests | src/data/__tests__/*.test.js |
| 0.6 | Integration verification | npm run build, npm run test |

### Tech Notes
- No migration logic — schema changes delete saved state
- Zod validation at load time
- localStorage persistence

---

## Phase 1: Worker System

**Goal:** Implement the Worker system for idle generation with offline progress, assignment, and leveling.

### Design Decisions

| Decision | Choice |
|----------|--------|
| Offline progress | Full offline (calculate elapsed time on load) |
| Generation interval | 1 minute per tick |
| Level up | Auto level-up (no manual intervention) |
| Material source | Area loot table + worker stat bonuses |
| Hire UI | Both Discover screen (quick) + Workers tab (full management) |

### Tasks

| Task | Description | Files |
|------|-------------|-------|
| 1.1 | Update GameContext state model | src/context/GameContext.jsx |
| 1.2 | Write worker action tests | src/features/workers/__tests__/*.test.js |
| 1.3 | Implement HIRE/ASSIGN/UNASSIGN actions | src/context/GameContext.jsx |
| 1.4 | Create worker generation utility | src/features/workers/utils/workerGeneration.js |
| 1.5 | Implement offline progress calculation | src/context/GameContext.jsx |
| 1.6 | Create WorkerPanel component | src/features/workers/components/WorkerPanel.jsx |
| 1.7 | Create WorkerCard component | src/features/workers/components/WorkerCard.jsx |
| 1.8 | Create WorkerShop component | src/features/workers/components/WorkerShop.jsx |
| 1.9 | Integrate into app navigation | src/App.jsx, src/constants.js |
| 1.10 | Integration test | src/features/workers/__tests__/integration.test.js |

### Core State Model

```typescript
interface WorkerInstance {
  id: string;              // Unique instance ID
  workerTypeId: string;    // Reference to worker type
  level: number;           // Current level (1 to maxLevel)
  xp: number;              // Current XP (resets on level up)
  assignedArea: string | null;  // Location tier or null
  assignedAt: number | null;    // Timestamp when assigned
}
```

### Generation Formula

```
Base yield = area loot table roll
Efficiency multiplier = (workerEfficiency + levelBonus) / 100
Luck multiplier = 1 + (workerLuck / 200)
Final yield = floor(Base yield * Efficiency multiplier * Luck multiplier)
```

### XP Formula

```
XP to next level = baseXpToLevel * (1.1 ^ (level - 1))
Level up bonus = baseEfficiency * (1 + level * 0.05)
```

### Out of Scope

- Worker abilities (special skills)
- Worker leveling presets
- Worker customization (renaming)
- Worker trading

---

## Phase 2: Processing

**Goal:** Implement the processing system with cleaning, cutting, and faceting mechanics.

### Design Document
See [Process Design](../design/process-phase-design.md) for full minigame specifications.

### Tasks (TBD)

| Task | Description |
|------|-------------|
| 2.1 | Create processing queue system |
| 2.2 | Implement idle processing timer |
| 2.3 | Design Tumble Sort minigame |
| 2.4 | Design Facet Alignment minigame |
| 2.5 | Design Polish Wheel minigame |
| 2.6 | Implement processing equipment system |
| 2.7 | Create ProcessScreen component |

### Processing Queue

- Base: 2 slots
- Additional slots unlock at player levels 10, 25, 50
- Idle processing continues while offline

### Quality Ranges

| Processing Stage | Idle Quality | Active Quality |
|-----------------|--------------|----------------|
| Cleaned | 50-85% | 60-115% |
| Cut | 40-85% | 50-115% |
| Faceted | 40-85% | 40-110%+ |

---

## Phase 3: Crafting

**Goal:** Implement the jewelry crafting system.

### Design Document
See [Craft Design](./craft.md)

### Tasks (TBD)

| Task | Description |
|------|-------------|
| 3.1 | Define metal acquisition system |
| 3.2 | Create jewelry type definitions |
| 3.3 | Implement craft validation |
| 3.4 | Create CraftScreen component |
| 3.5 | Add craft to Gemdex tracking |

---

## Phase 4: Marketplace

**Goal:** Implement the buy/sell marketplace system.

### Design Document
See [Sell Design](./sell.md)

### Tasks (TBD)

| Task | Description |
|------|-------------|
| 4.1 | Implement quick-sell |
| 4.2 | Design listing system |
| 4.3 | Create buyer AI (if applicable) |
| 4.4 | Add transaction history |
| 4.5 | Create MarketplaceScreen component |

---

## File Structure

```
src/
├── data/                    # YAML game data
│   ├── items.yaml           # 40 gems and minerals
│   ├── workers.yaml         # 5 worker types
│   ├── upgrades.yaml        # 10 upgrades
│   ├── locations.yaml       # 15 location tiers
│   ├── equipment.yaml       # 7 discovery equipment
│   └── processEquipment.yaml # 12 processing equipment
├── schemas/                 # Zod validation
│   ├── items.js
│   ├── workers.js
│   ├── upgrades.js
│   ├── locations.js
│   └── equipment.js
├── loaders/                 # YAML loaders
│   ├── items.js
│   ├── workers.js
│   ├── upgrades.js
│   ├── locations.js
│   └── equipment.js
├── features/               # Game features
│   ├── discover/           # Mining locations
│   ├── process/            # Processing UI
│   ├── craft/              # Jewelry creation
│   ├── sell/               # Marketplace
│   ├── gemdex/             # Collection
│   ├── workers/            # Worker management
│   │   ├── components/
│   │   │   ├── WorkerPanel.jsx
│   │   │   ├── WorkerCard.jsx
│   │   │   └── WorkerShop.jsx
│   │   ├── hooks/
│   │   │   └── useWorkers.js
│   │   ├── utils/
│   │   │   └── workerGeneration.js
│   │   └── __tests__/
│   └── upgrades/           # Upgrade shop
├── context/                # State management
│   └── GameContext.jsx     # Main reducer
├── constants.js            # Game constants
└── App.jsx                 # Main app component
```

---

## Build & Test Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run test     # Run tests (watch mode)
npm run test:run # Run tests once
```

---

## Verification Checklist

Before each phase completion:

- [ ] All new code has corresponding tests
- [ ] `npm run build` passes
- [ ] `npm run test:run` passes
- [ ] No console errors in browser
- [ ] localStorage persistence works
- [ ] Mobile-responsive (if applicable)
