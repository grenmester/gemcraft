# Gemstone Collector — Game Design Document

| Field                  | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **Game Title**         | Gemstone Collector                                                  |
| **Genre**              | Incremental Game                                                    |
| **Target Platform(s)** | Web (React/Vite), responsive (desktop-first, mobile-friendly)       |
| **Target Audience**    | Casual gamers who enjoy collection, progression, and idle mechanics |
| **Current Version**    | v0.1                                                                |
| **Last Updated**       | 2026-03-31                                                          |

---

## 1. Executive Summary

**Elevator Pitch:** Build your gem empire from humble river panning to mastering the craft of jewelry creation. Discover rare gems, process them with skill or patience, and craft valuable pieces for the marketplace.

**Core Fantasy:** The thrill of discovery meets the satisfaction of transformation. Every rough stone holds potential waiting to be revealed.

**Key Differentiators:**

- Earned idle mechanic: active play earns capability, idle play collects results
- Layered processing depth: raw → cleaned → cut → faceted → crafted
- Worker-driven progression with skill growth
- Educational: facts and processes in the game are inspired by real-world gemology

**Reference Games:**

- Motherload (idle mining)
- Idle Miner (worker management)
- GemCraft (collection/completionism)

---

## 2. Design Pillars

| Pillar                | Meaning                                               | Anti-pattern                               |
| --------------------- | ----------------------------------------------------- | ------------------------------------------ |
| **Discovery-Driven**  | Finding materials creates anticipation                | Guaranteed drops, instant rewards          |
| **Earned Idle**       | Active play earns capability, passive play collects   | Pay-to-skip, energy walls                  |
| **Layered Depth**     | Simple at first, increasingly complex                 | Feature bloat, overwhelming tutorials      |
| **Educational Value** | Inspired by real life, passively learn about gemology | Fake gems, imagined non-existent processes |

---

## 3. Core Loop Diagram

```txt
┌────────────────────────────────────────────────────────────────────────────┐
│                              CORE GAME LOOP                                │
├────────────────────────────────────────────────────────────────────────────┤
│  DISCOVER ───► PROCESS ───► CRAFT ───► MARKETPLACE ───► UPGRADES           │
│                                                                            │
│  Workers mine     Transform       Combine gems      Sell items             │
│  areas for        raw materials   with metals       for coins              │
│  raw gems         into refined     into jewelry                            │
│                   gems             for profit                              │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Moment-to-moment loop:** (seconds) Worker generates → Collect materials → Queue processing → Collect processed → Craft/Sell
- **Session loop:** (minutes/hours) Assign workers → Upgrade areas → Process queue → Craft items → Sell
- **Meta loop:** (across sessions) Unlock areas → Hire better workers → Maximize processing → Collect legendary gems

---

## 4. Player Archetypes & Goals

| Player Type    | Motivations                    | Mechanics                                |
| -------------- | ------------------------------ | ---------------------------------------- |
| The Achiever   | Complete Gemdex, max level     | Collection tracking, 100% completion     |
| The Strategist | Optimize idle, maximize profit | Worker placement, processing efficiency  |
| The Casual     | Relaxing progression           | Idle generation, minimal active required |

---

## 5. Mechanic Directory

| Mechanic  | Status      | Summary                                                     | Link                           |
| --------- | ----------- | ----------------------------------------------------------- | ------------------------------ |
| Discover  | In Progress | Mine selection → details → subareas, manual mining           | [discover.md](./discover.md)   |
| Workers   | Planned     | Assignable units that generate materials idle               | [workers.md](./workers.md)     |
| Process   | Design      | Transform raw materials through cleaning, cutting, faceting | [process.md](./process.md)     |
| Craft     | Design      | Combine gems with metals to create jewelry                  | [craft.md](./craft.md)         |
| Sell      | Design      | Marketplace for buying/selling items                        | [sell.md](./sell.md)           |
| Gemdex    | Implemented | Collection encyclopedia tracking discoveries                | [gemdex.md](./gemdex.md)       |
| Inventory | Implemented | Item storage and management                                 | [inventory.md](./inventory.md) |
| Upgrades  | Implemented | Purchasable bonuses for all systems                         | (in this doc)                  |

---

## 6. Dependency Matrix

| Mechanic  | Requires                           | Used By                                   |
| --------- | ---------------------------------- | ----------------------------------------- |
| Workers   | Discover areas, Coins              | Discover (generates materials), Economy   |
| Discover  | Workers, Equipment, Areas          | Process (raw input), Gemdex (discoveries) |
| Process   | Discover output, Process Equipment | Craft (cut gems input), Inventory         |
| Craft     | Processed gems, Metals             | Sell (jewelry input), Inventory           |
| Sell      | All items                          | Upgrades (coins), Workers (hiring)        |
| Gemdex    | Discover, Process, Craft           | Achievement tracking                      |
| Inventory | All mechanics                      | All mechanics (item storage)              |

---

## 7. Progression Architecture

### Critical Path

1. **Start** → River Panning (TIER_1) with starter worker
2. **Early** → Unlock areas, hire workers, basic processing
3. **Mid** → Cutting/faceting, better equipment, crafting
4. **Late** → Elite areas, master workers, legendary gems

### Unlock Flow

```txt
TIER_1 ──────────────────────► TIER_2 ──────────────────────► TIER_3
  │                               │                               │
  ▼                               ▼                               ▼
Unlock Equipment ──────────► Unlock Equipment ──────────► Unlock Equipment
(100 coins)                   (500 coins)                   (2,000 coins)
```

### Power Curve

- **Early (0-10):** Worker basics, TIER_1-2 areas, basic cleaning
- **Mid (10-30):** TIER_3-4, cutting/faceting, better workers
- **Late (30+):** TIER_5, elite operations, legendary gems, crafting

---

## 8. Economy & Balancing Overview

### Currencies

| Currency     | Source            | Use                                                   |
| ------------ | ----------------- | ----------------------------------------------------- |
| Cash (Coins) | Selling items     | Hiring workers, upgrading areas, purchasing equipment |
| XP           | Worker generation | Leveling up workers, discovering resources            |

### Sinks vs Sources

| Sink                 | Source                  |
| -------------------- | ----------------------- |
| Hiring workers       | Selling raw materials   |
| Unlocking areas      | Selling processed gems  |
| Purchasing equipment | Selling crafted jewelry |
| Processing fees      | Active mining bonuses   |

### Rarity Tiers

| Tier      | Drop Rate | Value Multiplier | Examples                        |
| --------- | --------- | ---------------- | ------------------------------- |
| Common    | 60%       | 1x               | Clear Quartz, Obsidian          |
| Uncommon  | 25%       | 3x               | Amethyst, Malachite             |
| Rare      | 10%       | 10x              | Sapphire, Spinel                |
| Epic      | 4%        | 50x              | Ruby, Emerald, Tanzanite        |
| Legendary | 1%        | 200x+            | Diamond, Alexandrite, Taaffeite |

### Value Progression

| Stage               | Quality Range | Value Multiplier |
| ------------------- | ------------- | ---------------- |
| Raw (from Discover) | 60-100%       | 1.0x             |
| Cleaned             | 50-115%       | 1.3-1.5x         |
| Cut                 | 40-115%       | 1.5-2.0x         |
| Faceted             | 40-110%       | 2.0-3.0x         |
| Crafted Jewelry     | N/A           | 2.5x-8.0x base   |

---

## 9. Art & Audio Direction Summary

### Visual References

- Dark slate backgrounds with gold accents
- Gem-inspired color palette based on rarity
- Clean, readable UI with clear affordances

### Color Palette

| Purpose    | Color                |
| ---------- | -------------------- |
| Background | #1a1a2e (dark slate) |
| Accent     | #ffd700 (gold)       |
| Text       | #e0e0e0 (light gray) |
| Common     | #a0a0a0 (gray)       |
| Uncommon   | #4CAF50 (green)      |
| Rare       | #2196F3 (blue)       |
| Epic       | #9C27B0 (purple)     |
| Legendary  | #FF9800 (orange)     |

### Camera Style

- 2D top-down view
- Isometric UI panels
- Card-based item displays

---

## 10. Tech Constraints & Risks

| Constraint               | Impact             | Mitigation                          |
| ------------------------ | ------------------ | ----------------------------------- |
| localStorage persistence | Data loss on clear | Warn users, consider cloud backup   |
| Single-player only       | No social features | Focus on internal progression depth |
| No server-side           | No anti-cheat      | Accept cheating, optimize for fun   |
| Mobile-friendly          | Touch targets      | 44px minimum touch targets          |

---

## 11. Milestones & Priorities

| Phase   | Focus           | Key Deliverables                                 |
| ------- | --------------- | ------------------------------------------------ |
| Phase 0 | Data Foundation | YAML data files, loaders, schemas ✅              |
| Phase 1 | Workers         | Worker system, idle generation, offline progress |
| Phase 2 | Processing      | Cleaning, cutting, faceting mechanics            |
| Phase 3 | Crafting        | Jewelry creation system                          |
| Phase 4 | Marketplace     | Buy/sell mechanics, price history                |

> **Current Work:** Discover Refactor (preparing UI for Workers)

---

## 12. Open Questions & Decisions Pending

- [ ] Active processing minigame specifics (see process-phase-design.md)
- [ ] Crafting metal acquisition mechanics
- [ ] Marketplace buyer AI
- [ ] Achievement system details

---

## Appendix A: Glossary

| Term             | Definition                                        |
| ---------------- | ------------------------------------------------- |
| **Area**         | A mine location where workers can be assigned     |
| **Cleaning**     | First stage of processing, removes matrix         |
| **Cutting**      | Second stage of processing, shapes the gem        |
| **Faceting**     | Final stage of processing, adds brilliance        |
| **Gemdex**       | Collection/encyclopedia tracking discovered items |
| **Loot Table**   | Probability distribution for item drops           |
| **Quality**      | Percentage affecting item value (40-110%)         |
| **Raw Material** | Item before processing (e.g., rough_quartz)       |
| **Processed**    | Item after processing (e.g., clear_quartz)        |
| **Tick**         | Time interval for worker generation (1 minute)    |
| **Worker**       | Assignable entity that generates materials        |

---

## Appendix B: File Structure

```txt
src/
├── data/                     # YAML game data
│   ├── items.yaml            # 40 gems and minerals
│   ├── workers.yaml          # 5 worker types
│   ├── upgrades.yaml         # 10 upgrades
│   ├── locations.yaml        # 15 location tiers
│   ├── equipment.yaml        # 7 discovery equipment
│   └── processEquipment.yaml # 12 processing equipment
├── schemas/                  # Zod validation
├── loaders/                  # YAML loaders
├── features/                 # Game features
│   ├── discover/             # Mining locations
│   ├── process/              # Processing UI
│   ├── craft/                # Jewelry creation
│   ├── sell/                 # Marketplace
│   ├── gemdex/               # Collection
│   ├── workers/              # Worker management
│   └── upgrades/             # Upgrade shop
├── context/                  # State management
│   └── GameContext.jsx       # Main reducer
└── constants.js              # Game constants
```

---

Last updated: 2026-03-31
