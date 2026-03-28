# Gemstone Collector - Game Design Document

> **Last Updated:** 2026-03-28
> **Status:** Prototype (Temp Minigames)
> **Engine:** React 18 + Vite + TailwindCSS v4

---

## Overview

**Gemstone Collector** is a casual idle/active hybrid game where players build a gem empire through discovery, collection, and strategic gameplay. Players explore real-world mining locations, extract minerals, process them into gems, and sell for profit.

### Core Pillars

1. **Discovery-Driven** - Each location reveals new minerals and gems organically
2. **Earned Idle** - Rewards are earned through active play, then collected passively
3. **Layered Depth** - Simple at first, but with 4+ layers of progression

---

## Game Loop

```
┌─────────────────────────────────────────────────────────────┐
│                        CORE LOOP                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [Discover] ──► [Mini-Game] ──► [Rewards]                   │
│       │               │              │                        │
│       │               ▼              ▼                        │
│       │         [Shift Points] ──► [Idle Collection]          │
│       │               │              │                        │
│       │               ▼              ▼                        │
│       │         [Level Up] ◄──── [Gems Added]                 │
│       │               │                                      │
│       └───────────────┘                                      │
│                                                              │
│   [Process] ──► [Craft] ──► [Sell] ──► [Coins]              │
│                         │              │                     │
│                         └──────────────┘                     │
│                                 │                            │
│                                 ▼                            │
│                        [Buy Equipment]                       │
│                                 │                            │
│                         ┌───────┴───────┐                    │
│                         ▼               ▼                    │
│                   [Better Mining]  [More Locations]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Progression Systems

### 1. Shift System (Earned Idle)

Shift Points are earned through active mini-game play:

| Tier | Points | Idle Rate | Label |
|------|--------|-----------|-------|
| I | 10-49 | 1 gem/hr | Bronze |
| II | 50-99 | 5 gems/hr | Silver |
| III | 100-149 | 10 gems/hr | Gold |
| IV | 150-299 | 20 gems/hr | Platinum |
| V | 300+ | 25 gems/hr | Diamond |

**Decay:** -1% per hour offline (minimum tier I)

**Key Design:** Idle rewards only accumulate AFTER earning shift points. This prevents pure idle farming and ensures active engagement.

### 2. Location System

15 real-world mining locations organized by tier:

| Tier | Locations | Level Req | Minigame Type |
|------|-----------|-----------|---------------|
| 1 | River Panning, Ozark Hills, Bavarian Fields | 0 | Panning, Chip & Reveal, Sieve & Sort |
| 2 | Ural Mountains, Bahia Mine, Montana River | 5 | Climb & Collect, Tunnel Trace, Read the Flow |
| 3 | Minas Gerais, Mogok Valley, Sri Lanka | 15 | Shake Table, Marble Extract, Excavate & Reveal |
| 4 | Zambia, Kashmir, Argyle | 30 | Vein Trace, Ice Climb, Pipe Drop |
| 5 | Golconda, Androy, Mogok Hidden | 50 | Diamond Grade, Dust & Discover, Master Challenge |

Each location has:
- **Unlock Requirements:** Level, Equipment, Resources
- **Resources:** Location-specific minerals/gems
- **Minigame:** Unique gameplay mechanic
- **High Score:** Tracked per location

### 3. Resource System

**Raw Minerals** → **Processed Gems** → **Crafted Jewelry**

#### Mineral Families (20 total)
- Quartz (agate, amethyst, citrine, rose quartz, smoky quartz)
- Beryl (emerald, aquamarine, morganite, heliodor)
- Corundum (ruby, sapphire, padparadscha)
- Feldspar (moonstone, labradorite, amazonite)
- Opal (white, fire, black, boulder)
- Others: Garnet, Tourmaline, Peridot, Topaz, Diamond

#### Processing Chain
```
Raw Mineral (Tier 1) ──► Processed Gem (Tier 2) ──► Cut Gem (Tier 3)
      │                         │                        │
   Mining                   Tumbling               Faceting
      │                         │                        │
   Panning                   Cutting              Setting
```

### 4. Equipment System

Equipment provides bonuses and unlock requirements:

| Equipment | Cost | Effect | Unlock Level |
|-----------|------|--------|--------------|
| Basic Pickaxe | 100 | +10% minerals | 0 |
| Sifting Pan | 500 | +15% gems | 3 |
| Metal Detector | 2000 | +25% rare finds | 7 |
| Excavation Drill | 10000 | +50% yield | 15 |
| Gem Microscope | 50000 | +25% gem quality | 25 |
| Elite Operations | 500000 | +100% everything | 50 |

---

## Mini-Game System

### Score Tiers

| Tier | Score Range | Shift Points | Multiplier | Label |
|------|-------------|--------------|------------|-------|
| Poor | 0-25% | 1 | 0.5x | Low rewards |
| Average | 26-50% | 3 | 1.0x | Medium rewards |
| Good | 51-75% | 5 | 1.25x | Good rewards |
| Excellent | 76-90% | 8 | 1.5x | High rewards |
| Mastery | 91-100% | 15 | 2.0x | Max rewards |

### Temp Minigame Simulator

Currently, all locations use a temporary simulator:
- Low/Medium/High buttons simulate performance
- Awards coins, gems, and shift points
- Allows full game loop testing without functional minigames

### Planned Mini-Games (16 total)

| Location | Mini-Game | Mechanic |
|----------|-----------|----------|
| River Panning | Pan & Catch | Swipe to catch falling gems |
| Ozark Hills | Chip & Reveal | Tap crystals when they flash |
| Bavarian Fields | Sieve & Sort | Color-match falling gems |
| Ural Mountains | Climb & Collect | Vertical platformer |
| Bahia Mine | Tunnel Trace | Draw paths through ore veins |
| Montana River | Read the Flow | Timing-based gem sorting |
| Minas Gerais | Shake Table | Separate gems by weight |
| Mogok Valley | Marble Extract | Precision extraction |
| Sri Lanka | Excavate & Reveal | Scratch-off layers |
| Zambia | Vein Trace | Connect matching veins |
| Kashmir | Ice Climb | Vertical obstacle course |
| Argyle | Pipe Drop | Physics-based gem routing |
| Golconda | Diamond Grade | Quality assessment |
| Androy | Dust & Discover | Sift through alluvial deposits |
| Mogok Hidden | Master Challenge | Combined mechanics |

---

## UI Screens

### 1. Menu
- Title and tagline
- Navigation: Discover, Process, Craft, Sell, Inventory, Gemdex
- Player stats summary (coins, shift tier)

### 2. Discover (Prospector Phase)
- **Idle Section:** Mining timer (5s default), auto-generates random gems
- **Active Section:** Access to Location Map
- **Resources Display:** Coins, Inventory count/capacity

### 3. Location Map
- Grid of all 15 locations (locked/unlocked states)
- Location details: Name, Tier, Requirements, Resources
- Select location to play minigame

### 4. Process
- Tumbling/faceting placeholder
- Raw → Processed gem conversion (future)

### 5. Craft
- Jewelry crafting placeholder
- Processed → Jewelry creation (future)

### 6. Sell
- Client orders/negotiation placeholder
- Jewelry → Coins (future)

### 7. Inventory
- **Tabs:** Minerals, Gems, Equipment, Currency
- **Sort:** Name, Value, Quantity
- **Filter:** Search by name
- **Display:** Grid with item details

### 8. Gemdex
- Encyclopedia of all discovered gems
- **Filters:** All, Discovered, Undiscovered
- **Sort:** Name, Value, Hardness
- **Details:** Mohs scale visualization, gem facts, locations

### 9. Debug Panel (Ctrl+Shift+D)
- Unlock all gems
- Add coins (+1K, +10K, +100K)
- Max shift points
- Unlock all locations
- Reset progress

---

## Data Structures

### Player State
```javascript
{
  coins: number,
  gems: Gem[],
  gemdex: Gem[],
  shiftPoints: number,
  inventory: {
    minerals: { gemId: string, quantity: number }[],
    gems: { gemId: string, quantity: number }[],
    equipment: string[],
    currency: { coins: number }
  },
  locationProgress: {
    [locationId]: { completed: boolean, highScore: number }
  },
  highScores: { [minigameId]: number }
}
```

### Location Structure
```javascript
{
  id: string,
  name: string,
  tier: number,
  unlockLevel: number,
  color: string,
  icon: string,
  resources: string[],  // gem IDs available here
  minigameType: string
}
```

### Gem Structure
```javascript
{
  id: string,
  name: string,
  mohs: number,
  color: string,
  type: string,         // mineral family
  facts: string[],
  value: number,
  locations: string[]    // where to find
}
```

---

## Technical Architecture

### Stack
- **Framework:** React 18
- **Build:** Vite 5
- **Styling:** TailwindCSS v4
- **State:** React Context + useReducer
- **Persistence:** localStorage

### File Structure
```
src/
├── components/
│   ├── Menu.jsx
│   ├── Discover.jsx
│   ├── LocationMap.jsx
│   ├── Inventory.jsx
│   ├── Gemdex.jsx
│   ├── Process.jsx
│   ├── Craft.jsx
│   ├── Sell.jsx
│   ├── TempMinigame.jsx
│   └── DebugPanel.jsx
├── components.disabled/   # Archived minigames
│   ├── Minigame.disabled.jsx
│   ├── ChipReveal.disabled.jsx
│   └── SieveSort.disabled.jsx
├── context/
│   └── GameContext.jsx
├── data/
│   ├── gems.json
│   ├── locations.js
│   ├── minigames.js
│   └── equipment.js
├── models/
│   ├── Gem.js
│   ├── Player.js
│   └── Inventory.js
├── utils/
│   └── requirements.js
├── hooks/
│   └── useMinigameRegistry.js
├── App.jsx
├── App.css
└── main.jsx
```

### Context Actions
| Action | Description |
|--------|-------------|
| SET_PHASE | Navigate to screen |
| ADD_GEM | Add gem to inventory |
| ADD_COINS | Add coins |
| ADD_SHIFT_POINTS | Add shift points |
| BUY_EQUIPMENT | Purchase equipment |
| ADD_TO_INVENTORY | Add item to category |
| REMOVE_FROM_INVENTORY | Remove item |
| LOAD_STATE | Load saved game |
| DEBUG_* | Debug actions |

---

## Future Development

### High Priority
- [ ] Implement all 16 mini-games (replace temp simulator)
- [ ] Process screen - tumbling/faceting mechanics
- [ ] Craft screen - jewelry creation
- [ ] Sell screen - client orders/negotiation

### Medium Priority
- [ ] Tutorial/onboarding flow
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Leaderboards

### Low Priority
- [ ] Sound effects and music
- [ ] Social features (friends, trading)
- [ ] PvP mining competitions
- [ ] Seasonal events

---

## Design Principles

1. **YAGNI** - Build only what's needed
2. **Discovery-Driven** - Let players explore organically
3. **Mobile-First** - But fully responsive for desktop
4. **Casual Accessible** - Short sessions, flexible play
5. **F2P Friendly** - Cosmetics monetization, no pay-to-win
6. **Education** - Real gem/mineral facts woven in

---

## Reference Documents

- `docs/plans/2026-03-28-core-loop-design.md` - Core loop details
- `docs/plans/2026-03-28-resource-crafting-tree.md` - Resource system
- `docs/plans/2026-03-28-minigame-design.md` - Mini-game designs
- `docs/plans/2026-03-28-minigame-implementation.md` - Implementation plan
- `docs/plans/2026-03-28-gemdex-implementation.md` - Gemdex design
