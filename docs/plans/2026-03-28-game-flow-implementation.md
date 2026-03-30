# Game Flow & Loot System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix Discover tab navigation flow, implement per-location loot tables with rarity tiers, and update Gemdex with location data.

**Architecture:** 
- New `lootTables.js` data file with per-location, per-area loot definitions
- Game state tracks `discoverState` sub-object for navigation within Discover phase
- New components: LocationSelector, SubareaSelector, RewardsSummary
- Refactored components: Discover (tabs), TempMinigame → RewardsSelector
- Gemdex updated to query lootTables for gem sources

**Tech Stack:** React + Vite + TailwindCSS v4

---

## Task 1: Create lootTables.js with Per-Location Loot Data

**Files:**
- Create: `src/data/lootTables.js`

```javascript
export const LOOT_TABLES = {
  TIER_1: {
    name: 'River Panning',
    color: '#87CEEB',
    unlockLevel: 0,
    areas: {
      area_1: {
        name: 'Shallow Waters',
        difficulty: 1,
        gems: [
          { id: 'quartz_clear', weight: 60, rarity: 'COMMON' },
          { id: 'amethyst', weight: 30, rarity: 'COMMON' },
          { id: 'garnet', weight: 10, rarity: 'UNCOMMON' }
        ],
        baseRewards: { coins: 50, gems: 1, shift: 1 }
      },
      // ... areas 2, 3
    }
  },
  TIER_1_B: {
    name: 'Ozark Hills',
    color: '#228B22',
    unlockLevel: 1,
    areas: {
      area_1: { /* ... */ },
      // ...
    }
  },
  // ... all 15 locations
};

export const REWARD_MULTIPLIERS = {
  1: { coins: 1, gems: 1, shift: 1 },      // Easy
  2: { coins: 1.5, gems: 1.5, shift: 2 }, // Standard
  3: { coins: 2, gems: 2, shift: 3 }       // Difficult
};

export const getGemById = (id) => gemsData.gems.find(g => g.id === id);
export const rollLoot = (area) => { /* weighted random selection */ };
export const getGemSources = (gemId) => { /* returns locations where gem appears */ };
```

---

## Task 2: Update GameContext with Discover Sub-State Actions

**Files:**
- Modify: `src/context/GameContext.jsx`

Add new action types:
- `SET_DISCOVER_TAB` - 'idle' | 'panning'
- `SELECT_LOCATION` - location key (e.g., 'TIER_1')
- `SELECT_AREA` - area key (e.g., 'area_1')
- `SET_REWARDS` - store last rewards after completing
- `CLEAR_DISCOVER_SELECTION` - reset to initial state

Update initial state:
```javascript
const initialState = {
  // ...existing
  discoverState: {
    activeTab: 'idle',
    selectedLocation: null,
    selectedArea: null,
    lastRewards: null
  }
};
```

---

## Task 3: Refactor Discover.jsx with UI Tabs

**Files:**
- Modify: `src/components/Discover.jsx`
- Create: `src/components/IdlePanel.jsx` (extract idle content)
- Create: `src/components/PanningPanel.jsx` (panning entry point)

New structure:
```
Discover
├── Tab buttons: Idle | Panning
├── Conditional content:
│   ├── IdlePanel (shift tier, progress, collect)
│   └── PanningPanel (single "Select Mine Location" button)
└── Back button → Menu
```

---

## Task 4: Create LocationSelector.jsx Component

**Files:**
- Create: `src/components/LocationSelector.jsx`

Features:
- Grid of all 15 locations (unlocked vs locked)
- Show unlock level for locked locations
- Click unlocked location → dispatch SELECT_LOCATION
- Back button → dispatch CLEAR_DISCOVER_SELECTION (returns to Discover Panning)

---

## Task 5: Create SubareaSelector.jsx Component

**Files:**
- Create: `src/components/SubareaSelector.jsx`

Features:
- Header showing location name
- Grid of area cards (1-3 areas per location)
- Each card shows: name, difficulty stars, gem count range
- Click area → dispatch SELECT_AREA
- Back button → dispatch SELECT_LOCATION (null) to go back to LocationSelector

---

## Task 6: Refactor TempMinigame to RewardsSelector.jsx

**Files:**
- Rename: `src/components/TempMinigame.jsx` → `src/components/RewardsSelector.jsx`
- Modify: Show 3 difficulty tiers based on area difficulty
- Show expected gem types from loot table
- On select: roll actual loot, dispatch rewards, dispatch SET_REWARDS

New behavior:
```javascript
const handleSelectReward = (difficulty) => {
  const area = lootTables[locationKey].areas[areaKey];
  const rolledGems = rollLoot(area, difficulty);
  const multiplier = REWARD_MULTIPLIERS[difficulty];
  
  dispatch({ type: 'ADD_COINS', payload: area.baseRewards.coins * multiplier.coins });
  dispatch({ type: 'ADD_SHIFT_POINTS', payload: Math.floor(area.baseRewards.shift * multiplier.shift) });
  
  rolledGems.forEach(gem => {
    dispatch({ type: 'DEBUG_ADD_GEM', payload: gem });
  });
  
  dispatch({ type: 'SET_REWARDS', payload: { coins, shift, gems: rolledGems } });
};
```

---

## Task 7: Create RewardsSummary.jsx Component

**Files:**
- Create: `src/components/RewardsSummary.jsx`

Features:
- Show "Area Completed!" header
- Display coins earned
- Display shift points earned
- Grid of gem cards with name and rarity badge
- Two buttons: "← Back to Discover" | "🏠 Main Menu"

---

## Task 8: Update App.jsx Routing for New Flow

**Files:**
- Modify: `src/App.jsx`

All phases now render within Discover flow based on `discoverState`:
```jsx
<GAME_PHASES.DISCOVER> → <Discover />
// Inside Discover, conditional rendering based on discoverState:
- No location selected → Show tabs
- Location selected, no area → <LocationSelector />
- Location + Area selected, no rewards → <RewardsSelector />
- Rewards completed → <RewardsSummary />
```

---

## Task 9: Update Gemdex to Show Location Sources

**Files:**
- Modify: `src/components/Gemdex.jsx`

In gem detail view, add "Found In" section:
```jsx
const getSources = (gemId) => {
  const sources = [];
  Object.entries(LOOT_TABLES).forEach(([locKey, location]) => {
    Object.entries(location.areas).forEach(([areaKey, area]) => {
      area.gems.forEach(g => {
        if (g.id === gemId) {
          sources.push({
            location: location.name,
            area: area.name,
            rarity: g.rarity
          });
        }
      });
    });
  });
  return sources;
};
```

---

## Task 10: Test with Playwright

**Verification:**
1. Build passes: `npm run build`
2. Idle tab shows shift tier and collect button
3. Panning tab shows "Select Mine Location"
4. Location selector shows all 15 locations
5. Location leads to subareas
6. Subarea shows correct loot preview
7. Reward selection adds correct rewards
8. Rewards summary displays earned gems
9. Back navigation works
10. Gemdex shows location sources
11. Debug panel can test all flows

---

## Dependencies

Tasks must be completed in order:
1. lootTables.js (data foundation)
2. GameContext (state management)
3. Discover + tabs (UI structure)
4. LocationSelector (navigation)
5. SubareaSelector (navigation)
6. RewardsSelector (core gameplay)
7. RewardsSummary (completion)
8. App.jsx (integration)
9. Gemdex (enhancement)
10. Playwright (verification)
