# UI Polish & Consistency Implementation Plan (Revised)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all four user-reported issues: temporary Process selector, item name display, visual consistency between Discover/Process, and react-icons across the UI with shared infrastructure for gem/mineral icons.

**Architecture:** Single-pass audit of all components. Each task is a self-contained fix with build verification.

**Tech Stack:** React, Tailwind CSS, react-icons (Fa* icons from react-icons/fa), with shared icon components for future customization.

---

## Task 1: Fix ProcessSelector — Add Inventory Feedback

**Problem:** ProcessSelector.jsx shows results but doesn't update inventory or give the player any feedback that something changed.

**Files:**
- Modify: `src/features/process/components/ProcessSelector.jsx`
- Modify: `src/features/process/components/Process.jsx`

**Step 1: In ProcessSelector.jsx — Add inventory update on completion**

ProcessSelector already has the logic to compute `result` with quality and newValue. Now we need to dispatch inventory actions when Done is clicked:

```jsx
// Add import at top
import { useGame, ADD_TO_INVENTORY, ADD_MINERAL, UPDATE_PROCESS_STATS } from '../../../context/GameContext';

// Inside handleDone():
const handleDone = () => {
  // Add the processed item back to inventory
  const isMineral = result.item.category === 'Mineral';
  if (isMineral) {
    dispatch({
      type: ADD_MINERAL,
      payload: { mineralId: result.item.id, quantity: 1 }
    });
  } else {
    dispatch({
      type: ADD_TO_INVENTORY,
      payload: { category: 'gems', gemId: result.item.id, quantity: 1 }
    });
  }
  
  // Optionally update process stats (quality tracking)
  // dispatch({ type: UPDATE_PROCESS_STATS, payload: { totalProcessed: 1, ... } });
  
  // Reset state
  setStep('select');
  setSelectedItem(null);
  setSelectedType(null);
  setResult(null);
};
```

**Step 2: Create `GemIcon` and `MineralIcon` shared components (placeholder)**

Create file `src/shared/components/ItemIcons.jsx`:

```jsx
import { FaGem, FaMountain } from 'react-icons/fa';

// Placeholder SVG components - replace with custom SVGs later
export const GemIcon = ({ className }) => <FaGem className={className} />;
export const MineralIcon = ({ className }) => <FaMountain className={className} />;
```

**Step 3: Update ProcessSelector.jsx to use shared icons**

Replace all `FaGem`/`FaMountain` with `GemIcon`/`MineralIcon`:
```jsx
import { GemIcon, MineralIcon } from '../../../shared/components/ItemIcons';
```

Replace:
- `CATEGORY_ICONS.Gem` → `GemIcon`
- `CATEGORY_ICONS.Mineral` → `MineralIcon`

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/features/process/components/ProcessSelector.jsx src/features/process/components/Process.jsx src/shared/components/ItemIcons.jsx
git commit -m "feat: wire ProcessSelector to update inventory; add shared icon components"
```

---

## Task 2: Clean Up Old gems.json References

**Problem:** gems.json is still imported in GameContext.jsx and DebugPanel.jsx, but items.json is the canonical source.

**Files:**
- Modify: `src/context/GameContext.jsx`
- Modify: `src/shared/components/DebugPanel.jsx`

**Step 1: Verify gems.json is not actually needed**

Check if any functionality relies on gems.json vs items.json. The new system should use items.json exclusively.

**Step 2: Update GameContext.jsx**

If there's an import:
```js
import gemsData from '../data/gems.json';
```
Remove it or replace with items.json if needed. Since we moved to items.json system, gemsData should be unused.

**Step 3: Update DebugPanel.jsx**

Remove any `gemsData` import. If the debug panel shows inventory, it should use GameContext state, not direct file imports.

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/context/GameContext.jsx src/shared/components/DebugPanel.jsx
git commit -m "cleanup: remove unused gems.json references"
```

---

## Task 3: Standardize Discover & Process Page Structure

**Problem:** Discover and Process have different layouts. User wants both to follow the same pattern with Active tab first, Idle second. Discover should default to Panning tab.

**Files:**
- Modify: `src/features/discover/components/Discover.jsx`
- Verify: `src/features/process/components/Process.jsx` (already correct)

**Step 1: Update Discover.jsx tab order and default**

Change the tab buttons so "Panning" is the default active tab when the page loads.

Current:
- Default shows Idle tab (activeTab === 'idle' by default)
- Active tab is Idle, secondary is Panning

Required:
- Make Panning the first tab (positionally), show Panning content by default

Implementation:
1. Change default `activeTab` state from `'idle'` to `'panning'`
2. Reorder buttons so Panning appears first, Idle second (matching Process's Active/Idle order)

**Step 2: Match header layout between Discover and Process**

Process.jsx uses:
```jsx
<div className="flex items-center justify-between mb-6">
  <button><FaArrowLeft /> Menu</button>
  <h2>Process</h2>
  <div className="w-16" />
</div>
```

Update Discover.jsx to use the same pattern:
- Back button on left
- Title centered (already there)
- Spacer on right for centering

**Step 3: Ensure container constraint**

Both pages should be wrapped in a `container mx-auto` from the parent `App.jsx`. Verify that `main` already has this class: `className="app-main flex-1 flex flex-col container mx-auto max-w-[1536px] ..."`. Any `h-screen` or full-bleed styles inside these pages should be changed to `h-full` and let the parent constrain width.

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/features/discover/components/Discover.jsx
git commit -m "fix: standardize Discover layout with Panning as default active tab"
```

---

## Task 4: Replace Emojis with Shared Icon Components in Discover

**Problem:** Discover components use emojis. Replace with shared `GemIcon`/`MineralIcon` components.

**Files:**
- `src/features/discover/components/SubareaSelector.jsx`
- `src/features/discover/components/RewardsSelector.jsx`
- `src/features/discover/components/RewardsSummary.jsx`
- `src/features/discover/components/LocationSelector.jsx`
- `src/features/discover/components/LocationMap.jsx`

**Step 1: Import shared icons**

At the top of each file:
```js
import { GemIcon } from '../../../shared/components/ItemIcons';
```

**Step 2: Replace emojis in each component**

**SubareaSelector.jsx:**
- `✨ {data?.name}` → `<GemIcon className="text-purple-400 text-sm" /> {data?.name}`
- `💎 {mineralCount}` → `<GemIcon className="text-blue-400 text-sm" /> {mineralCount}`
- `✨ Gems Only` → `<GemIcon className="text-purple-400" /> Gems Only`
- `💎 Minerals Only` → `<GemIcon className="text-blue-400" /> Minerals Only`
- `🔮 Mixed` → `<GemIcon className="text-purple-400" /> Mixed`
- `← Locations` → `<FaArrowLeft /> Locations`

**RewardsSelector.jsx:**
- `💰` → `<FaCoins />`
- `💎` → `<GemIcon />`
- `📦` → `<FaBox />`
- `✨` → `<GemIcon />`
- `←` → `<FaArrowLeft />`

**RewardsSummary.jsx:**
- Same as above

**LocationSelector.jsx & LocationMap.jsx:**
- `⭐` → `<FaStar />`
- `💎` → `<GemIcon />`
- `←` → `<FaArrowLeft />`

**Step 3: Add missing react-icons imports**

Add to each file if needed:
```js
import { FaArrowLeft, FaStar, FaCoins, FaBox } from 'react-icons/fa';
```

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/features/discover/components/
git commit -m "feat: replace emojis with shared icon components in Discover"
```

---

## Task 5: Replace Emojis with Shared Icons in Remaining Components

**Files:**
- `src/App.jsx` (footer)
- `src/features/inventory/components/Gemdex.jsx`
- `src/features/inventory/components/Inventory.jsx`
- `src/features/sell/components/Sell.jsx`
- `src/features/craft/components/Craft.jsx`
- `src/shared/components/DebugPanel.jsx`

**Step 1: Update App.jsx**

```js
import { FaGem } from 'react-icons/fa';

// In footer:
<span className="flex items-center gap-1">
  <FaGem className="text-xl text-yellow-400" />
  <span>{coins}</span>
</span>
```

**Step 2: Update Gemdex.jsx**

Add imports:
```js
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import { GemIcon, MineralIcon } from '../../../shared/components/ItemIcons';
```

Replace:
- `🔍` → `<FaSearch />`
- `💎` → `<GemIcon />`
- `🪨` → `<MineralIcon />`
- `←` → `<FaArrowLeft />`

**Step 3: Update Inventory.jsx**

Already uses react-icons for gems? Check and replace `💎` in value display with `<FaGem />` or just remove since icon next to value is redundant.

**Step 4: Update Sell.jsx and Craft.jsx**

Replace:
- `🏪` → `<FaStore />`
- `💎` (if any) → `<GemIcon />`
- `←` → `<FaArrowLeft />`

**Step 5: Update DebugPanel.jsx**

Replace `💎` with `<FaGem />`.

**Step 6: Verify with build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/App.jsx src/features/inventory/components/Gemdex.jsx src/features/inventory/components/Inventory.jsx src/features/sell/components/Sell.jsx src/features/craft/components/Craft.jsx src/shared/components/DebugPanel.jsx
git commit -m "feat: replace emojis with shared icon components in remaining components"
```

---

## Task 6: Container Constraint Audit

**Problem:** Some components use `h-screen` or overflow the container.

**Files to check:**
- RewardsSelector.jsx
- RewardsSummary.jsx
- SubareaSelector.jsx
- LocationMap.jsx
- Others identified in grep

**Step 1: Replace `h-screen` with `h-full`**

In RewardsSelector.jsx and RewardsSummary.jsx, change:
```jsx
<div className="flex flex-col h-screen ...">
```
to:
```jsx
<div className="flex flex-col h-full ...">
```

The parent `main` element in App.jsx already has the container constraint, so these pages should fill available space (flex column) but not exceed viewport height.

**Step 2: Remove viewport-relative classes**

Any `min-h-screen`, `h-screen`, or fixed-width classes that break container constraints should be changed to `min-h-full`, `h-full`, or removed.

**Step 3: Verify with build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/features/discover/components/RewardsSelector.jsx src/features/discover/components/RewardsSummary.jsx
git commit -m "fix: replace h-screen with h-full for container constraint"
```

---

## Task 7: Update Utility Icon Tests (if needed)

**Files:**
- `src/shared/utils/__tests__/gameUtils.test.js`

**Step 1: Check if tests reference emoji strings**

If we kept `getRequirementIcon` returning emojis, no change needed. If we changed it to return component names, update tests accordingly.

**Most likely:** Keep the function as-is (returns string emoji) since it's a text-based utility. The components now use react-icons directly. Tests can stay unchanged.

**Step 2: If no changes needed, skip commit**

---

## Task 8: Final Verification

**Step 1: Full build**

```bash
npm run build
```

**Step 2: Unit tests**

```bash
npm test -- --run
```

**Step 3: E2E tests**

```bash
npx playwright test
```

**Step 4: Manual smoke test in browser**

Start dev server and check:
- Discover page defaults to Panning tab
- Process page shows Active/Idle tabs correctly
- All pages have consistent header layout
- No emojis visible anywhere
- Gem and mineral icons display correctly

**Step 5: Fix any final issues and commit**

```bash
git add -A
git commit -m "chore: final polish and fixes"
```

---

## Summary

| Task | Purpose | New Files |
|------|---------|-----------|
| 1 | ProcessSelector inventory feedback | Updates to ProcessSelector.jsx/Process.jsx |
|   | Shared icon infrastructure | `src/shared/components/ItemIcons.jsx` |
| 2 | Remove old gems.json refs | — |
| 3 | Standardize Discover/Process layouts | Update to Discover.jsx |
| 4 | Replace emojis in Discover | Use ItemIcons |
| 5 | Replace emojis in other components | Use ItemIcons |
| 6 | Container constraint audit | Replace `h-screen` |
| 7 | Update icon tests | — (likely no change) |
| 8 | Final verification | — |

**Total: 8 tasks.** Ready to implement?
