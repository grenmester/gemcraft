# Game Flow & Loot System Design

> **For Claude:** Use superpowers:writing-plans after approval to create implementation plan.

**Goal:** Fix Discover tab navigation flow, implement per-location loot tables, and update Gemdex with location data.

## Design Decisions

1. **Loot Tables:** Per-location loot objects with rarity tiers
2. **Discover Tabs:** UI tabs within same screen
3. **Rewards Summary:** Show earned rewards with gem names

---

## Screen Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        DISCOVER TAB                          │
│  ┌──────────┬──────────┐                                    │
│  │   Idle   │  Panning │   ← UI Tab Buttons                  │
│  └──────────┴──────────┘                                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    IDLE CONTENT                       │    │
│  │  Shift Tier: Tier 1 (3 gems/hr)                      │    │
│  │  Progress bar to next tier                           │    │
│  │  [Collect 5 Ready Gems]                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  OR                                                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   PANNING CONTENT                    │    │
│  │  [🌍 Select Mine Location]  ← Single button        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCATION SELECTOR                         │
│                                                              │
│  Tier 1                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ River       │ │ Ozark Hills │ │ Bavarian    │            │
│  │ Panning     │ │             │ │ Fields      │            │
│  │ ✅ Unlocked │ │ ✅ Unlocked │ │ 🔒 Lvl 2    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  Tier 2                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Ural Shores │ │ Bahia Mines │ │ Montana     │            │
│  │ 🔒 Lvl 3    │ │ 🔒 Lvl 5    │ │ 🔒 Lvl 7    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  [← Back to Discover]                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUBAREA SELECTOR                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RIVER PANNING                                        │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐          │    │
│  │  │  Area 1   │ │  Area 2   │ │  Area 3   │          │    │
│  │  │  (Easy)   │ │  (Medium) │ │  (Hard)   │          │    │
│  │  │  1-3 gems │ │  2-5 gems │ │  3-7 gems │          │    │
│  │  │  ★☆☆      │ │  ★★☆      │ │  ★★★      │          │    │
│  │  └───────────┘ └───────────┘ └───────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [← Back to Locations]                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REWARDS SELECTOR                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  RIVER PANNING - AREA 1                              │    │
│  │  Expected finds: Quartz, Amethyst, Garnet             │    │
│  │  ┌───────────────┐                                    │    │
│  │  │  EASY         │  50 coins, 1 gem, 1 shift          │    │
│  │  │  ★☆☆          │  Common loot only                   │    │
│  │  └───────────────┘                                    │    │
│  │  ┌───────────────┐                                    │    │
│  │  │  STANDARD     │  100 coins, 2 gems, 3 shift        │    │
│  │  │  ★★☆          │  Common + Uncommon                 │    │
│  │  └───────────────┘                                    │    │
│  │  ┌───────────────┐                                    │    │
│  │  │  DIFFICULT    │  200 coins, 3 gems, 8 shift        │    │
│  │  │  ★★★          │  All tiers possible                │    │
│  │  └───────────────┘                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [← Back to Areas]                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  REWARDS SUMMARY SCREEN                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            🎉 AREA COMPLETED! 🎉                    │    │
│  │                                                       │    │
│  │   💰 100 coins                                      │    │
│  │   ⭐ +3 Shift Points                                │    │
│  │                                                       │    │
│  │   💎 Gems Found:                                    │    │
│  │   ┌───────────────┐ ┌───────────────┐               │    │
│  │   │ Clear Quartz  │ │ Amethyst      │               │    │
│  │   │ Common 💎     │ │ Common 💎     │               │    │
│  │   └───────────────┘ └───────────────┘               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [← Back to Discover]    [🏠 Main Menu]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Loot Tables (`src/data/lootTables.js`)

```javascript
export const LOOT_TABLES = {
  TIER_1: {
    name: 'River Panning',
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
      area_2: {
        name: 'River Bends',
        difficulty: 2,
        gems: [
          { id: 'quartz_clear', weight: 40, rarity: 'COMMON' },
          { id: 'amethyst', weight: 35, rarity: 'COMMON' },
          { id: 'garnet', weight: 15, rarity: 'UNCOMMON' },
          { id: 'citrine', weight: 10, rarity: 'UNCOMMON' }
        ],
        baseRewards: { coins: 75, gems: 2, shift: 2 }
      },
      area_3: {
        name: 'Deep Pools',
        difficulty: 3,
        gems: [
          { id: 'amethyst', weight: 40, rarity: 'COMMON' },
          { id: 'garnet', weight: 30, rarity: 'UNCOMMON' },
          { id: 'citrine', weight: 20, rarity: 'UNCOMMON' },
          { id: 'rose_quartz', weight: 10, rarity: 'RARE' }
        ],
        baseRewards: { coins: 100, gems: 3, shift: 4 }
      }
    }
  },
  // ... other locations
};
```

### Reward Multipliers by Difficulty

| Difficulty | Coin Mult | Gem Mult | Shift Mult |
|------------|-----------|----------|------------|
| Easy (1)   | 1x        | 1x       | 1x         |
| Standard (2) | 1.5x    | 1.5x     | 2x         |
| Difficult (3) | 2x      | 2x       | 3x         |

---

## Component Structure

```
src/
├── data/
│   ├── lootTables.js      # NEW: Per-location loot tables
│   └── gems.json          # UPDATED: Add 'foundIn' computed from lootTables
│
├── components/
│   ├── Discover.jsx        # REFACTORED: Add UI tabs
│   ├── LocationSelector.jsx # NEW: Mine location grid
│   ├── SubareaSelector.jsx  # NEW: Area selection per location
│   ├── RewardsSelector.jsx  # REFACTORED: From TempMinigame
│   ├── RewardsSummary.jsx   # NEW: Post-reward display
│   └── Gemdex.jsx          # UPDATED: Show location sources
```

---

## Navigation State

```javascript
// Game phase remains DISCOVER throughout, but we track sub-phases
state = {
  phase: 'discover',
  discoverState: {
    activeTab: 'idle' | 'panning',
    selectedLocation: null | 'TIER_1' | 'TIER_1_B' | ...,
    selectedArea: null | 'area_1' | 'area_2' | 'area_3',
    lastRewards: null | { coins, gems, shift, gemDetails }
  }
}
```

New actions needed:
- `SET_DISCOVER_TAB`
- `SELECT_LOCATION`
- `SELECT_AREA`
- `CLEAR_DISCOVER_SELECTION`

---

## Gemdex Updates

The Gemdex should show where each gem can be found:

```jsx
// In Gemdex gem detail modal:
<div className="gem-sources">
  <h4>Found In:</h4>
  <ul>
    <li>🏔️ River Panning - Area 1 (Common), Area 2 (Common)</li>
    <li>🏔️ Ozark Hills - Area 1 (Uncommon)</li>
  </ul>
</div>
```

This data comes from `lootTables.js` - no duplication needed.

---

## Back Navigation

Every screen has clear back navigation:
- Rewards Summary → Discover Tab OR Main Menu
- Rewards Selector → Subarea Selector
- Subarea Selector → Location Selector
- Location Selector → Discover (Panning tab)

---

## Testing Checklist

- [ ] Idle tab shows shift tier and collect button
- [ ] Panning tab shows "Select Mine Location" button
- [ ] Location selector shows all 15 locations with unlock status
- [ ] Each location leads to its subareas
- [ ] Each subarea shows correct loot preview
- [ ] Reward selection adds correct rewards to player
- [ ] Rewards summary displays earned gems by name
- [ ] Back navigation works at every level
- [ ] Gemdex shows location sources for each gem
- [ ] Debug panel can test all flows
