# Inventory & Requirements System Design

**Version:** 1.0  
**Date:** 2026-03-28  
**Status:** Approved

---

## Overview

Add a dedicated Inventory screen and improve Location Card requirements display to help players understand their progression and what they need to unlock advanced content.

---

## 1. Inventory Screen

### Navigation
- Menu → "Inventory" button (new)
- Menu → "Discover" → Location Map → Back (existing flow)

### Layout Structure
```
┌─────────────────────────────────────────────┐
│  [← Back]              INVENTORY            │
├─────────────────────────────────────────────┤
│  [Raw Minerals] [Gems] [Equipment] [Currency]│
├─────────────────────────────────────────────┤
│  Sort: [Name ▼]     Filter: [___________]    │
├─────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 💎  │ │ 💎  │ │ 💎  │ │ 💎  │          │
│  │ x5  │ │ x3  │ │ x12 │ │ x1  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│  ...                                        │
└─────────────────────────────────────────────┘
```

### Tabs
| Tab | Content |
|-----|---------|
| **Raw Minerals** | T1-T2 materials (Quartz, Feldspar, Pyrite, etc.) |
| **Gems** | T3-T5 precious gems (Ruby, Emerald, Diamond, etc.) |
| **Equipment** | Tools and machinery (Pickaxe, Drill, etc.) |
| **Currency** | Coins, Shift Points display |

### Sort Options
- Name (A-Z, Z-A)
- Value (High to Low, Low to High)
- Tier (T1→T5)
- Quantity (High to Low)

### Filter
- Text input for searching by name
- Case-insensitive partial match

### Item Card
```
┌─────────────────┐
│     [icon]      │  ← Gem icon/color representation
│                 │
│   Clear Quartz  │  ← Name
│      T1         │  ← Tier badge
│      x5         │  ← Quantity
│    Value: 5💎   │  ← Base value
└─────────────────┘
```

### Component Files
- `src/components/Inventory.jsx`
- `src/components/Inventory.css`
- `src/components/InventoryItem.jsx` (optional sub-component)

---

## 2. Location Card Requirements

### Locked State Display
When a location is locked, show:
- Grayed out card with reduced opacity
- Lock icon overlay
- Requirements panel

### Requirements Panel
```
🔒 Ozark Hills
━━━━━━━━━━━━━━━━━━
Requirements:
⭐ Level 5 (Current: 3)
🔧 Basic Pickaxe (Not owned)
```

### Requirement Types
| Symbol | Type | Display |
|--------|------|---------|
| ⭐ | Level | "Level X required (Current: Y)" |
| 🔧 | Equipment | "Equipment name (Owned/Not owned)" |
| 💎 | Resource | "X Resource (have/need)" |
| ⏱️ | Time | "X minutes mining (have/need)" |
| 🎯 | Score | "X score in Location Y (have/need)" |

### Progress Indicators
- **Met:** Green checkmark ✓
- **In Progress:** Yellow dot ●
- **Not Met:** Red X ✗

### Example States

**Locked - Level Only:**
```
🔒 Ural Shores
━━━━━━━━━━━━━━━━━━
Requirements:
⭐ Level 10 (Current: 7) ●
```

**Locked - Multiple Requirements:**
```
🔒 Bahia Mines
━━━━━━━━━━━━━━━━━━
Requirements:
⭐ Level 15 (Current: 15) ✓
🔧 Diamond Drill (Not owned) ✗
```

**Unlocked:**
```
🗺️ Bahia Mines
━━━━━━━━━━━━━━━━━━
Mines · Level 15+
```

---

## 3. Game State Changes

### New Inventory Structure
```javascript
// Old (flat array)
player.gems = [{ id: 'ruby', name: 'Ruby', ... }, ...]

// New (structured)
inventory = {
  minerals: [
    { gemId: 'quartz', quantity: 5 },
    { gemId: 'feldspar', quantity: 3 }
  ],
  gems: [
    { gemId: 'ruby', quantity: 2 },
    { gemId: 'emerald', quantity: 1 }
  ],
  equipment: [
    { equipmentId: 'basic_pickaxe', owned: true },
    { equipmentId: 'diamond_drill', owned: false }
  ],
  currency: {
    coins: 1500,
    shiftPoints: 250
  }
}
```

### New Player Properties
- `inventory` - Structured inventory
- `equipment` - Owned equipment list
- `locationProgress` - Per-location mining time
- `highScores` - Per-minigame best scores

### Equipment Data
```javascript
const EQUIPMENT = {
  NONE: { name: 'None', cost: 0, unlockLevel: 0 },
  BASIC_PICKAXE: { name: 'Basic Pickaxe', cost: 0, unlockLevel: 5 },
  DIAMOND_DRILL: { name: 'Diamond Drill', cost: 500, unlockLevel: 15 },
  HEAVY_MACHINERY: { name: 'Heavy Machinery', cost: 2000, unlockLevel: 40 },
  MINING_DYNASTY: { name: 'Mining Dynasty', cost: 5000, unlockLevel: 55 },
  ELITE_OPERATIONS: { name: 'Elite Operations', cost: 15000, unlockLevel: 70 }
};
```

### Requirements Check Function
```javascript
function checkRequirements(location, playerState) {
  const results = [];
  
  if (location.unlockLevel > playerState.level) {
    results.push({
      type: 'level',
      needed: location.unlockLevel,
      current: playerState.level,
      met: false
    });
  }
  
  if (location.requiredEquipment) {
    results.push({
      type: 'equipment',
      equipment: location.requiredEquipment,
      owned: playerState.equipment.includes(location.requiredEquipment),
      met: playerState.equipment.includes(location.requiredEquipment)
    });
  }
  
  // ... resource, time, score checks
  
  return {
    met: results.every(r => r.met),
    requirements: results
  };
}
```

---

## 4. Implementation Tasks

1. Update Player model with structured inventory
2. Update GameContext with inventory actions (ADD_ITEM, REMOVE_ITEM, BUY_EQUIPMENT)
3. Create Equipment data file
4. Create Inventory component with tabs
5. Create InventoryItem component
6. Update LocationCard to show requirements
7. Update Menu with Inventory button
8. Migrate existing gems to new inventory format
9. Add condition checking utility functions
10. Update DebugPanel for new inventory format

---

## 5. Backward Compatibility

- Migration function to convert old `gems[]` array to new `inventory` structure
- Run migration on first load if old save format detected
- Preserve existing coins, shiftPoints, gemdex

---

*Document Version: 1.0 - Inventory & Requirements System*
