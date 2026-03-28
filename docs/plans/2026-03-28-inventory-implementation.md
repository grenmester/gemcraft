# Inventory & Requirements System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add a structured Inventory screen with tabs (Raw Minerals, Gems, Equipment, Currency) and update Location Cards to show unlock requirements.

**Architecture:** 
- New `src/data/equipment.js` for equipment data
- Update `Player` model with structured inventory
- Create `Inventory` component with tab-based navigation
- Update `LocationMap` with requirement display
- Add condition checking utilities

**Tech Stack:** React, CSS Modules, localStorage persistence

---

## Task 1: Equipment Data & Condition Checking

**Files:**
- Create: `src/data/equipment.js`
- Create: `src/utils/requirements.js`
- Modify: `src/context/GameContext.jsx` (add action types)

**Step 1: Create equipment.js**

```javascript
export const EQUIPMENT = {
  NONE: { id: 'NONE', name: 'None', cost: 0, unlockLevel: 0 },
  BASIC_PICKAXE: { id: 'BASIC_PICKAXE', name: 'Basic Pickaxe', cost: 0, unlockLevel: 5 },
  DIAMOND_DRILL: { id: 'DIAMOND_DRILL', name: 'Diamond Drill', cost: 500, unlockLevel: 15 },
  HEAVY_MACHINERY: { id: 'HEAVY_MACHINERY', name: 'Heavy Machinery', cost: 2000, unlockLevel: 40 },
  MINING_DYNASTY: { id: 'MINING_DYNASTY', name: 'Mining Dynasty', cost: 5000, unlockLevel: 55 },
  ELITE_OPERATIONS: { id: 'ELITE_OPERATIONS', name: 'Elite Operations', cost: 15000, unlockLevel: 70 }
};

export const getEquipmentById = (id) => EQUIPMENT[id];

export const getOwnedEquipment = (level, ownedIds = []) => {
  return Object.values(EQUIPMENT).filter(eq => 
    eq.unlockLevel <= level && (eq.id === 'NONE' || ownedIds.includes(eq.id))
  );
};
```

**Step 2: Create requirements.js**

```javascript
export function checkLocationRequirements(location, playerState) {
  const requirements = [];
  const level = Math.floor((playerState.shiftPoints || 0) / 100);
  
  // Level requirement
  requirements.push({
    type: 'level',
    needed: location.unlockLevel,
    current: level,
    met: level >= location.unlockLevel
  });
  
  // Equipment requirement (if any)
  if (location.requiredEquipment) {
    requirements.push({
      type: 'equipment',
      equipmentId: location.requiredEquipment,
      met: playerState.equipment?.includes(location.requiredEquipment) || false
    });
  }
  
  return {
    met: requirements.every(r => r.met),
    requirements
  };
}

export function getRequirementIcon(type) {
  const icons = {
    level: '⭐',
    equipment: '🔧',
    resource: '💎',
    time: '⏱️',
    score: '🎯'
  };
  return icons[type] || '📋';
}
```

**Step 3: Update GameContext action types**

Add to GameContext.jsx:
```javascript
export const BUY_EQUIPMENT = 'BUY_EQUIPMENT';
export const ADD_TO_INVENTORY = 'ADD_TO_INVENTORY';
export const REMOVE_FROM_INVENTORY = 'REMOVE_FROM_INVENTORY';
```

**Step 4: Commit**

```bash
git add src/data/equipment.js src/utils/requirements.js src/context/GameContext.jsx
git commit -m "feat: add equipment data and requirements checking utilities"
```

---

## Task 2: Update Player Model

**Files:**
- Modify: `src/models/Player.js`

**Step 1: Update Player constructor**

```javascript
export class Player {
  constructor({
    coins = 100,
    gems = [],
    gemdex = [],
    pathProgress = 0,
    shiftPoints = 0,
    calibrationMultiplier = 1.0,
    inventory = { minerals: [], gems: [], equipment: [], currency: { coins: 100 } },
    locationProgress = {},
    highScores = {}
  } = {}) {
    this.coins = coins;
    this.gems = gems; // Legacy - for migration
    this.gemdex = gemdex;
    this.pathProgress = pathProgress;
    this.shiftPoints = shiftPoints;
    this.calibrationMultiplier = calibrationMultiplier;
    this.inventory = inventory;
    this.locationProgress = locationProgress;
    this.highScores = highScores;
  }
  
  // ... existing methods
}
```

**Step 2: Commit**

```bash
git add src/models/Player.js
git commit -m "feat: update Player model with structured inventory"
```

---

## Task 3: Update GameContext Reducer

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Add reducer cases**

Add to gameReducer switch:

```javascript
case BUY_EQUIPMENT: {
  const eq = action.payload;
  const cost = EQUIPMENT[eq]?.cost || 0;
  if (state.player.coins < cost) return state;
  return {
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins - cost,
      inventory: {
        ...state.player.inventory,
        equipment: [...(state.player.inventory?.equipment || []), eq]
      }
    }
  };
}

case ADD_TO_INVENTORY: {
  const { category, gemId, quantity = 1 } = action.payload;
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const items = [...(inv[category] || [])];
  const existing = items.find(i => i.gemId === gemId);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ gemId, quantity });
  }
  
  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        [category]: items
      }
    }
  };
}

case REMOVE_FROM_INVENTORY: {
  const { category, gemId, quantity = 1 } = action.payload;
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const items = [...(inv[category] || [])];
  const existingIndex = items.findIndex(i => i.gemId === gemId);
  
  if (existingIndex >= 0) {
    items[existingIndex].quantity -= quantity;
    if (items[existingIndex].quantity <= 0) {
      items.splice(existingIndex, 1);
    }
  }
  
  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        [category]: items
      }
    }
  };
}
```

**Step 2: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat: add inventory management actions to reducer"
```

---

## Task 4: Create Inventory Component

**Files:**
- Create: `src/components/Inventory.jsx`
- Create: `src/components/Inventory.css`

**Step 1: Create Inventory.jsx**

```javascript
import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import gemsData from '../data/gems.json';
import './Inventory.css';

const TABS = [
  { id: 'minerals', label: 'Raw Minerals', icon: '🪨' },
  { id: 'gems', label: 'Gems', icon: '💎' },
  { id: 'equipment', label: 'Equipment', icon: '🔧' },
  { id: 'currency', label: 'Currency', icon: '💰' }
];

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'value', label: 'Value' },
  { id: 'tier', label: 'Tier' },
  { id: 'quantity', label: 'Quantity' }
];

export default function Inventory() {
  const { state, dispatch } = useGame();
  const [activeTab, setActiveTab] = useState('minerals');
  const [sortBy, setSortBy] = useState('name');
  const [filter, setFilter] = useState('');
  
  const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  const inventory = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: {} };
  
  // Get items for current tab
  const items = useMemo(() => {
    if (activeTab === 'currency') {
      return [{
        id: 'currency',
        name: 'Currency',
        quantity: 1,
        coins: state.player.coins,
        shiftPoints: state.player.shiftPoints || 0
      }];
    }
    
    if (activeTab === 'equipment') {
      return Object.values(EQUIPMENT).map(eq => ({
        id: eq.id,
        name: eq.name,
        quantity: 1,
        owned: inventory.equipment?.includes(eq.id) || playerLevel >= eq.unlockLevel && eq.id === 'NONE',
        unlockLevel: eq.unlockLevel,
        cost: eq.cost
      }));
    }
    
    const invItems = inventory[activeTab] || [];
    return invItems.map(invItem => {
      const gemData = gemsData.gems.find(g => g.id === invItem.gemId);
      return {
        ...invItem,
        name: gemData?.name || invItem.gemId,
        value: gemData?.value || 0,
        hardness: gemData?.hardness || 0,
        type: gemData?.type || 'unknown'
      };
    });
  }, [activeTab, inventory, state.player.coins, state.player.shiftPoints, playerLevel]);
  
  // Filter and sort
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Filter
    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(lower));
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'quantity':
          return (b.quantity || 0) - (a.quantity || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [items, filter, sortBy]);
  
  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: 'MENU' });
  };
  
  return (
    <div className="inventory screen">
      <div className="inventory-header">
        <button className="btn btn-secondary" onClick={handleBack}>← Back</button>
        <h2>INVENTORY</h2>
        <div style={{ width: 80 }} />
      </div>
      
      <div className="inventory-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      
      <div className="inventory-controls">
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)}
          className="sort-select"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>Sort: {opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      
      <div className="inventory-grid">
        {filteredItems.length === 0 ? (
          <div className="inventory-empty">
            No items in {TABS.find(t => t.id === activeTab)?.label}
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`inventory-item ${activeTab === 'equipment' && !item.owned ? 'locked' : ''}`}>
              <div className="item-icon">
                {activeTab === 'currency' ? '💰' : 
                 activeTab === 'equipment' ? '🔧' : '💎'}
              </div>
              <div className="item-name">{item.name}</div>
              {activeTab !== 'equipment' && activeTab !== 'currency' && (
                <>
                  <div className="item-quantity">x{item.quantity}</div>
                  <div className="item-value">{item.value}💎</div>
                </>
              )}
              {activeTab === 'currency' && (
                <>
                  <div className="item-coins">💎 {item.coins?.toLocaleString()}</div>
                  <div className="item-shift">✨ {item.shiftPoints}</div>
                </>
              )}
              {activeTab === 'equipment' && (
                <div className={`item-status ${item.owned ? 'owned' : ''}`}>
                  {item.owned ? '✓ Owned' : `Level ${item.unlockLevel}`}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create Inventory.css**

```css
.inventory {
  padding: var(--spacing-lg);
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin-bottom: var(--spacing-lg);
}

.inventory-header h2 {
  margin: 0;
  color: var(--accent-gold);
}

.inventory-tabs {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
  max-width: 800px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--bg-secondary);
}

.tab-btn.active {
  background: var(--accent-gold);
  color: var(--bg-primary);
  border-color: var(--accent-gold);
}

.tab-icon {
  font-size: 1.25rem;
}

.inventory-controls {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  max-width: 800px;
  width: 100%;
}

.sort-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--border-radius);
  color: var(--text-primary);
}

.filter-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-tertiary);
  border-radius: var(--border-radius);
  color: var(--text-primary);
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-md);
  max-width: 800px;
  width: 100%;
}

.inventory-item {
  background: var(--bg-secondary);
  border: 2px solid var(--bg-tertiary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  text-align: center;
  transition: all 0.2s;
}

.inventory-item:hover {
  border-color: var(--accent-gold);
}

.inventory-item.locked {
  opacity: 0.5;
}

.item-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
}

.item-name {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.item-quantity {
  font-size: 0.875rem;
  color: var(--accent-secondary);
}

.item-value {
  font-size: 0.75rem;
  color: var(--accent-gold);
}

.item-coins, .item-shift {
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.item-status {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.item-status.owned {
  color: var(--accent-secondary);
}

.inventory-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

@media (max-width: 480px) {
  .inventory-tabs {
    justify-content: center;
  }
  
  .tab-label {
    display: none;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Step 3: Commit**

```bash
git add src/components/Inventory.jsx src/components/Inventory.css
git commit -m "feat: add Inventory component with tabs"
```

---

## Task 5: Update Menu with Inventory Button

**Files:**
- Modify: `src/components/Menu.jsx`
- Modify: `src/App.jsx`

**Step 1: Add Inventory to Menu**

In Menu.jsx, add to menuButtons:
```javascript
{ label: 'Inventory', phase: 'inventory', icon: '🎒' }
```

**Step 2: Add route in App.jsx**

Add to switch statement:
```javascript
case 'inventory':
  phaseContent = <Inventory />;
  break;
```

**Step 3: Import Inventory**

```javascript
import Inventory from './components/Inventory';
```

**Step 4: Commit**

```bash
git add src/components/Menu.jsx src/App.jsx
git commit -m "feat: add Inventory to menu navigation"
```

---

## Task 6: Update LocationMap with Requirements

**Files:**
- Modify: `src/components/LocationMap.jsx`
- Modify: `src/components/LocationMap.css`

**Step 1: Update LocationMap.jsx**

Add requirements display to locked cards:

```javascript
import { checkLocationRequirements, getRequirementIcon } from '../utils/requirements';
import { EQUIPMENT, getEquipmentById } from '../data/equipment';

// In the location card render:
const { met, requirements } = checkLocationRequirements(
  { ...LOCATION_TIERS[key], id: key },
  state.player
);

// Card content:
<div className="location-card ...">
  {/* ... existing icon and name ... */}
  
  {!isUnlocked && (
    <div className="location-requirements">
      {requirements.map((req, idx) => (
        <div key={idx} className={`req-item ${req.met ? 'met' : ''}`}>
          <span className="req-icon">{getRequirementIcon(req.type)}</span>
          {req.type === 'level' && (
            <span>Level {req.needed} ({req.current})</span>
          )}
          {req.type === 'equipment' && (
            <span>{getEquipmentById(req.equipmentId)?.name}</span>
          )}
          <span className="req-status">{req.met ? '✓' : '✗'}</span>
        </div>
      ))}
    </div>
  )}
</div>
```

**Step 2: Add CSS for requirements**

```css
.location-requirements {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--bg-tertiary);
  font-size: var(--font-size-xs);
  text-align: left;
}

.req-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 0;
  color: var(--text-secondary);
}

.req-item.met {
  color: var(--accent-secondary);
}

.req-icon {
  font-size: 0.75rem;
}

.req-status {
  margin-left: auto;
}
```

**Step 3: Commit**

```bash
git add src/components/LocationMap.jsx src/components/LocationMap.css
git commit -m "feat: add requirements display to location cards"
```

---

## Task 7: Final Integration & Test

**Files:**
- Modify: `src/context/GameContext.jsx` (add migration)
- Test with Playwright

**Step 1: Add migration for old save format**

```javascript
function migratePlayerState(savedState) {
  // If old format, migrate to new
  if (savedState.player && Array.isArray(savedState.player.gems) && !savedState.player.inventory) {
    const minerals = [];
    const gems = [];
    
    savedState.player.gems.forEach(gem => {
      const gemData = gemsData.gems.find(g => g.id === gem.id || g.id === gem.gemId);
      if (gemData && gemData.value < 50) {
        minerals.push({ gemId: gem.id || gem.gemId, quantity: 1 });
      } else {
        gems.push({ gemId: gem.id || gem.gemId, quantity: 1 });
      }
    });
    
    savedState.player.inventory = {
      minerals,
      gems,
      equipment: [],
      currency: { coins: savedState.player.coins || 0 }
    };
  }
  
  return savedState;
}
```

**Step 2: Use migration in GameProvider**

```javascript
const parsed = JSON.parse(saved);
const migrated = migratePlayerState(parsed);
return { ...initial, ...migrated };
```

**Step 3: Test with Playwright**

Run dev server and verify:
- Inventory opens from menu
- All 4 tabs work
- Items display correctly
- Location cards show requirements
- Migration works for old saves

**Step 4: Commit**

```bash
git add src/context/GameContext.jsx
git commit -m "feat: add migration for inventory format"
```

---

## Plan Complete

**Execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
