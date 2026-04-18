# Craft Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the complete Craft phase as designed in `docs/todo/craft.md`, integrating with Discover (ore loot) and Process (refining ore to metal).

**Architecture:** 
- Add ore to Discover loot tables at TIER_2+ locations
- Add metal processing to Process phase (refine ore → metal with quality)
- Create Craft component with recipe-based jewelry making
- New inventory category for metals and findings
- XP-based recipe unlocks

**Tech Stack:** React, GameContext, Playwright for testing

---

## Phase 1: Ore & Metal System (Integration with Discover + Process)

### Task 1: Add Ore to Discover Loot Tables

**Files:**
- Modify: `src/data/subareas.js` - Add ore drops to loot tables
- Modify: `src/data/items.yaml` - Add ore items (copper ore, silver ore, gold ore, platinum ore)

**Step 1: Add ore items to items.yaml**

Add these items to `src/data/items.yaml`:
```yaml
  - id: copper_ore
    name: Copper Ore
    category: Ore
    hardness: 3
    value: 2
    rarity: Common
    processing:
      canRefine: true
      refineOutput: copper
      baseProcessTime: 10
      processDifficulty: 1

  - id: silver_ore
    name: Silver Ore
    category: Ore
    hardness: 2.5
    value: 10
    rarity: Uncommon
    processing:
      canRefine: true
      refineOutput: silver
      baseProcessTime: 15
      processDifficulty: 2

  - id: gold_ore
    name: Gold Ore
    category: Ore
    hardness: 2.5
    value: 40
    rarity: Rare
    processing:
      canRefine: true
      refineOutput: gold
      baseProcessTime: 20
      processDifficulty: 3

  - id: platinum_ore
    name: Platinum Ore
    category: Ore
    hardness: 4
    value: 200
    rarity: Epic
    processing:
      canRefine: true
      refineOutput: platinum
      baseProcessTime: 30
      processDifficulty: 4
```

**Step 2: Update subareas.js to add ore to loot tables**

Add ore drops to TIER_2 and higher subareas. Example for TIER_2 area_a:
```javascript
TIER_2: {
  area_a: {
    name: 'Silver Vein',
    items: [
      { id: 'clear_quartz', weight: 30 },
      { id: 'silver_ore', weight: 40 },
      { id: 'copper_ore', weight: 20 },
      { id: 'amethyst', weight: 10 }
    ],
    baseCoins: 15
  }
}
```

**Step 3: Update COLLECT_PENDING_MATERIALS in GameContext.jsx**

Handle Ore category similar to Mineral/Gem:
- If category is 'Ore', add to `ores` array in inventory
- Ores don't have quality until refined

**Step 4: Commit**

```bash
git add src/data/items.yaml src/data/subareas.js src/context/GameContext.jsx
git commit -m "feat(discover): add ore to loot tables at TIER_2+"
```

---

### Task 2: Add Metal Refining to Process

**Files:**
- Modify: `src/features/process/components/ActiveProcessing.jsx` - Add ore refining option
- Modify: `src/features/process/hooks/useProcess.js` - Include ores in available items

**Step 1: Add ore refining to Process UI**

In ActiveProcessing.jsx, add a new "Refine" tab or option that shows ores. When user selects ore + refining type, it produces metal.

**Step 2: Add REFINING action to GameContext.jsx**

Add new action type `REFINE_ORE` that:
- Removes ore from inventory
- Adds metal to `inventory.metals` with quality
- Quality = base + random variance (e.g., 70-90%)

**Step 3: Add metals to inventory helper**

Update `inventoryHelpers.js` to handle metals array (similar to minerals/gems).

**Step 4: Update availableItems in useProcess.js**

Include ores in available items for processing.

**Step 5: Commit**

```bash
git add src/context/GameContext.jsx src/context/inventoryHelpers.js src/features/process/components/ActiveProcessing.jsx src/features/process/hooks/useProcess.js
git commit -m "feat(process): add ore refining to produce metals with quality"
```

---

## Phase 2: Craft Phase UI

### Task 3: Create Craft Component Shell

**Files:**
- Create: `src/features/craft/components/Craft.jsx`
- Modify: `src/App.jsx` - Add route for CRAFT phase

**Step 1: Create Craft.jsx**

```jsx
import { useState } from 'react';
import { useGame, SET_PHASE, GAME_PHASES } from '../../../context/GameContext';
import { FaHammer, FaGem, FaArrowLeft } from 'react-icons/fa';

export default function Craft() {
  const { dispatch } = useGame();
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'materials'

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          className="flex items-center gap-2 text-gray-400 hover:text-white"
          onClick={handleBack}
        >
          <FaArrowLeft /> Menu
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Craft</h2>
        <div className="w-16" />
      </div>
      
      {/* Placeholder content - will be filled in Task 4 */}
      <div className="text-center text-gray-400 py-12">
        <FaHammer className="text-6xl mx-auto mb-4 opacity-50" />
        <p>Crafting system coming soon...</p>
      </div>
    </div>
  );
}
```

**Step 2: Add CRAFT phase to App.jsx**

Add case for `GAME_PHASES.CRAFT` in App.jsx to render Craft component.

**Step 3: Commit**

```bash
git add src/features/craft/components/Craft.jsx src/App.jsx
git commit -m "feat(craft): create Craft component shell"
```

---

### Task 4: Implement Recipe System

**Files:**
- Create: `src/data/recipes.js` - All crafting recipes
- Modify: `src/features/craft/components/Craft.jsx` - Recipe browser

**Step 1: Create recipes.js**

```javascript
export const RECIPES = [
  {
    id: 'basic_copper_ring',
    name: 'Simple Copper Ring',
    type: 'ring',
    design: 'Basic',
    difficulty: 1,
    xpRequired: 0,
    requirements: {
      gems: [{ id: 'clear_quartz', qualityMin: 0 }],
      metal: { id: 'copper', qualityMin: 0 },
      findings: ['band']
    },
    settings: ['prong', 'bezel'],
    baseValue: 50,
    multiplier: 2.5
  },
  // ... more recipes
];

export const JEWELRY_TYPES = {
  ring: { slots: 1, minMetal: 'copper', multiplier: 2.5, complexity: 'simple' },
  pendant: { slots: 1, minMetal: 'silver', multiplier: 3.0, complexity: 'simple' },
  earrings: { slots: 2, minMetal: 'silver', multiplier: 2.8, complexity: 'medium' },
  bracelet: { slots: 3, minMetal: 'silver', multiplier: 3.5, complexity: 'medium' },
  necklace: { slots: 4, minMetal: 'gold', multiplier: 5.0, complexity: 'complex' },
  crown: { slots: 6, minMetal: 'platinum', multiplier: 8.0, complexity: 'expert' }
};

export const SETTINGS = {
  prong: { name: 'Prong', multiplier: 1.0, description: 'Classic claw setting' },
  bezel: { name: 'Bezel', multiplier: 1.2, description: 'Metal rim around gem' },
  pave: { name: 'Pavé', multiplier: 1.5, description: 'Tiny gems set in metal' },
  channel: { name: 'Channel', multiplier: 1.3, description: 'Gems in metal channel' },
  illusion: { name: 'Illusion', multiplier: 1.4, description: 'Enhanced sparkle' }
};

export const FINDINGS = {
  band: { name: 'Ring Band', value: 5 },
  ear_wires: { name: 'Ear Wires', value: 3 },
  earring_backs: { name: 'Earring Backs', value: 2 },
  jump_ring: { name: 'Jump Ring', value: 1 },
  chain: { name: 'Necklace Chain', value: 15 },
  bail: { name: 'Bail', value: 5 },
  clasp: { name: 'Bracelet Clasp', value: 10 }
};
```

**Step 2: Update Craft.jsx with recipe browser**

Add tabs to browse by jewelry type, show locked/unlocked status based on player XP.

**Step 3: Commit**

```bash
git add src/data/recipes.js src/features/craft/components/Craft.jsx
git commit -m "feat(craft): add recipe data and recipe browser UI"
```

---

### Task 5: Implement Crafting Logic

**Files:**
- Modify: `src/context/GameContext.jsx` - Add CRAFT_ITEM action
- Modify: `src/features/craft/components/Craft.jsx` - Add crafting form

**Step 1: Add CRAFT_ITEM action**

In GameContext.jsx reducer:
- Validate all recipe requirements met
- Calculate final value using formula
- Add crafted item to `inventory.jewelry`
- Award crafting XP

**Step 2: Add crafting form to Craft.jsx**

When recipe selected:
- Show gem selector (filtered by quality requirement)
- Show metal selector
- Show settings selector
- Show value preview
- Craft button

**Step 3: Commit**

```bash
git add src/context/GameContext.jsx src/features/craft/components/Craft.jsx
git commit -m "feat(craft): implement crafting logic with value calculation"
```

---

## Phase 3: Testing & Integration

### Task 6: Add Playwright Tests

**Files:**
- Create: `tests/craft.spec.js`

**Step 1: Write tests**

```javascript
test('craft button visible in menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Craft' })).toBeVisible();
});

test('can navigate to craft screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Craft' }).click();
  await expect(page.locator('h2:has-text("Craft")')).toBeVisible();
});

// More tests for ore discovery, metal refining, jewelry crafting
```

**Step 2: Run tests**

```bash
pnpm playwright test tests/craft.spec.js
```

**Step 3: Fix any failures**

**Step 4: Commit**

```bash
git add tests/craft.spec.js
git commit -m "test(craft): add Playwright tests for crafting system"
```

---

### Task 7: Visual Verification

**Run manual visual checks:**
1. Start dev server: `cd .worktrees/craft && pnpm run dev`
2. Open browser to http://localhost:5173
3. Navigate: Menu → Discover → Mine TIER_2+ → Check ore appears in loot
4. Navigate: Menu → Process → Refine ore → Check metal in inventory
5. Navigate: Menu → Craft → Browse recipes → Craft item

**Take screenshots of:**
- Ore in loot table display
- Metal in inventory (with quality)
- Craft screen with recipe selected
- Crafted jewelry in inventory

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add ore to Discover loot tables (TIER_2+) |
| 2 | Add metal refining to Process phase |
| 3 | Create Craft component shell |
| 4 | Implement recipe system with data |
| 5 | Implement crafting logic |
| 6 | Add Playwright tests |
| 7 | Visual verification |

**Plan complete and saved to** `docs/plans/2026-04-10-craft-implementation.md`

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?