# UI Polish & Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all four user-reported issues: temporary Process selector, item name display, visual consistency between Discover/Process, and react-icons across the UI.

**Architecture:** Single-pass audit of all components. Each task is a self-contained fix with build verification.

**Tech Stack:** React, Tailwind CSS, react-icons (Fa* icons from react-icons/fa)

---

## Task 1: Fix ProcessSelector — Add Inventory Feedback

**Problem:** ProcessSelector.jsx shows results but doesn't update inventory or give the player any feedback that something changed.

**Files:**
- Modify: `src/features/process/components/ProcessSelector.jsx`

**Step 1: Add process completion callback to ProcessSelector**

```jsx
// In ProcessSelector.jsx, import the quality system
import { calculateQuality } from '../../../data/qualitySystem';

// In processItem(), after setting result, call onComplete if provided
// Wire it through as a prop so the parent can handle inventory updates
```

**Step 2: Wire process completion through Process.jsx**

```jsx
// In Process.jsx, add a handler that updates inventory when process completes
// Use the existing GameContext actions
```

**Step 3: Verify with build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/features/process/components/ProcessSelector.jsx src/features/process/components/Process.jsx
git commit -m "fix: wire ProcessSelector to update inventory on completion"
```

---

## Task 2: Clean Up Old gems.json References

**Problem:** gems.json is still imported in GameContext.jsx and DebugPanel.jsx, but items.json is the canonical source. Some item IDs may not match.

**Files:**
- Modify: `src/context/GameContext.jsx` — remove gems.json import, use items.json
- Modify: `src/shared/components/DebugPanel.jsx` — remove gems.json import, use items.json
- Verify: `src/data/items.json` — confirm all IDs are clean (no underscores in display names)

**Step 1: Update GameContext.jsx to use items.json**

Replace:
```js
import gemsData from '../data/gems.json';
```
With:
```js
import itemsData from '../data/items.json';
```

Update any references to `gemsData.items` to `itemsData.items`.

**Step 2: Update DebugPanel.jsx to use items.json**

Replace:
```js
import gemsData from '../../data/gems.json';
```
With:
```js
import itemsData from '../../data/items.json';
```

Update references from `gemsData` to `itemsData`.

**Step 3: Verify item IDs and names are clean**

Check items.json for:
- All IDs use clean snake_case (e.g., `clear_quartz`, not `quartz_clear`)
- All `name` fields are display-ready (e.g., "Clear Quartz")
- No hardcoded raw IDs shown to users

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/context/GameContext.jsx src/shared/components/DebugPanel.jsx
git commit -m "fix: replace gems.json references with items.json"
```

---

## Task 3: Standardize Discover & Process Page Structure

**Problem:** Discover and Process have different layouts. User wants both to follow the same pattern:
- Header at top with back button, title, and spacer
- Main "active" tab content shown first
- Secondary "idle" tab accessible via button

**Files:**
- Modify: `src/features/discover/components/Discover.jsx`
- Modify: `src/features/process/components/Process.jsx`

**Step 1: Create shared layout pattern**

Both pages should follow this structure:
```jsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <button className="flex items-center gap-2 text-gray-400 hover:text-white">
      <FaArrowLeft /> Menu
    </button>
    <h2 className="text-2xl text-yellow-400 font-bold">Page Title</h2>
    <div className="w-16" />
  </div>

  {/* Tab Navigation */}
  <div className="flex gap-2 mb-6">
    <button className={tabStyle(activeTab === 'active')}>
      <FaBolt /> Active/Panning
    </button>
    <button className={tabStyle(activeTab === 'idle')}>
      <FaClock /> Idle
    </button>
  </div>

  {/* Content */}
  <div className="flex-1 overflow-auto">
    {activeTab === 'active' ? <ActiveContent /> : <IdleContent />}
  </div>
</div>
```

**Step 2: Update Discover.jsx**

- Move back button to header (top-left)
- Make "Panning" the first tab (active), "Idle" the second tab
- Use FaSearch or FaMapMarkedAlt for panning icon
- Use FaClock for idle icon
- Replace remaining emojis with react-icons

**Step 3: Update Process.jsx**

- Already has the header pattern ✅
- Already has tab order correct (Active first, Idle Queue second) ✅
- Verify content matches the pattern

**Step 4: Verify with build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/features/discover/components/Discover.jsx src/features/process/components/Process.jsx
git commit -m "fix: standardize Discover and Process page layout"
```

---

## Task 4: Replace Emojis with react-icons in Discover Components

**Problem:** Multiple components still use emoji characters instead of react-icons.

**Files to modify:**
- `src/features/discover/components/SubareaSelector.jsx` — ✨→FaGem, 💎→FaGem, ←→FaArrowLeft
- `src/features/discover/components/RewardsSelector.jsx` — 💰→FaCoins, 💎→FaGem, 📦→FaBox, ✨→FaGem, ←→FaArrowLeft
- `src/features/discover/components/RewardsSummary.jsx` — 💰→FaCoins, 💎→FaGem, ←→FaArrowLeft
- `src/features/discover/components/LocationSelector.jsx` — ⭐→FaStar, 💎→FaGem, ←→FaArrowLeft
- `src/features/discover/components/LocationMap.jsx` — ⭐→FaStar, 💎→FaGem, ←→FaArrowLeft

**Step 1: Update SubareaSelector.jsx**

Add import:
```js
import { FaGem, FaArrowLeft } from 'react-icons/fa';
```

Replace emojis:
- `✨ {data?.name}` → `<FaGem className="text-purple-400" /> {data?.name}`
- `💎 {data?.name}` → `<FaGem className="text-blue-400" /> {data?.name}`
- `← Locations` → `<FaArrowLeft /> Locations`
- `✨ Gems Only` → `<FaGem /> Gems Only`
- `💎 Minerals Only` → `<FaGem /> Minerals Only`
- `🔮 Mixed` → `<FaGem /> Mixed`

**Step 2: Update RewardsSelector.jsx**

Add import:
```js
import { FaGem, FaCoins, FaBox, FaArrowLeft } from 'react-icons/fa';
```

Replace emojis:
- `💰` → `<FaCoins />`
- `💎` → `<FaGem />`
- `📦` → `<FaBox />`
- `✨` → `<FaGem />`
- `←` → `<FaArrowLeft />`

**Step 3: Update RewardsSummary.jsx**

Add import:
```js
import { FaGem, FaCoins, FaArrowLeft } from 'react-icons/fa';
```

Replace emojis similarly.

**Step 4: Update LocationSelector.jsx**

Add import:
```js
import { FaStar, FaGem, FaArrowLeft } from 'react-icons/fa';
```

Replace emojis:
- `⭐` → `<FaStar />`
- `💎` → `<FaGem />`
- `←` → `<FaArrowLeft />`

**Step 5: Update LocationMap.jsx**

Same emoji replacements as LocationSelector.

**Step 6: Verify with build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/features/discover/components/
git commit -m "fix: replace emojis with react-icons in Discover components"
```

---

## Task 5: Replace Emojis with react-icons in Remaining Components

**Problem:** App.jsx footer, Gemdex, Inventory, Sell, Craft, DebugPanel, and utility files still use emojis.

**Files to modify:**
- `src/App.jsx` — 💎→FaGem in footer
- `src/features/inventory/components/Gemdex.jsx` — 🔍→FaSearch, 💎→FaGem, 🪨→FaMountain, ←→FaArrowLeft
- `src/features/inventory/components/Inventory.jsx` — 💎→FaGem in value display
- `src/features/sell/components/Sell.jsx` — 🏪→FaStore, ←→FaArrowLeft
- `src/features/craft/components/Craft.jsx` — 💳→FaRing (or similar), ←→FaArrowLeft
- `src/shared/components/DebugPanel.jsx` — 💎→FaGem
- `src/shared/utils/requirements.js` — ⭐→FaStar, 💎→FaGem
- `src/shared/utils/__tests__/gameUtils.test.js` — update tests for new icon output

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

Add imports and replace all emojis with react-icons.

**Step 3: Update Inventory.jsx**

Replace `💎` with `<FaGem />`.

**Step 4: Update Sell.jsx and Craft.jsx**

Replace emojis with appropriate react-icons:
- Sell: FaStore for shop icon
- Craft: FaGem or FaRing for craft icon
- Back buttons: FaArrowLeft

**Step 5: Update DebugPanel.jsx**

Replace `💎` with `<FaGem />`.

**Step 6: Update requirements.js**

Change from returning emoji strings to returning react-icon components. Since this is a utility file, we need to think about how icons are used. If the icons are used in JSX, we can keep them as icon component references. If they're used as text, we may need to refactor.

Actually, looking at the code, `getRequirementIcon` returns string emojis. This is called in components like LocationSelector.jsx and LocationMap.jsx. We should:
- Change `getRequirementIcon` to return the icon component name or import react-icons in the components themselves
- OR change the approach: keep getRequirementIcon for text/logic, and have the components use react-icons directly

**Better approach:** Keep `getRequirementIcon` as-is for tests, and update the components to use react-icons directly instead of calling `getRequirementIcon`.

**Step 7: Verify with build**

```bash
npm run build
```

**Step 8: Commit**

```bash
git add src/ -A
git commit -m "fix: replace all remaining emojis with react-icons"
```

---

## Task 6: Ensure Container Constraint Across All Pages

**Problem:** Some components use `h-screen` or break out of the Tailwind `container` parent in App.jsx.

**Files to check/modify:**
- `src/features/discover/components/RewardsSelector.jsx` — uses `h-screen` and full-width backgrounds
- `src/features/discover/components/RewardsSummary.jsx` — check for full-width
- `src/features/discover/components/SubareaSelector.jsx` — check
- `src/features/inventory/components/Gemdex.jsx` — check
- `src/features/inventory/components/Inventory.jsx` — has `max-w-3xl` ✅

**Step 1: Audit all components for container-breaking patterns**

Look for:
- `w-full` without `mx-auto` or `max-w-*` — could overflow
- `h-screen` — should be `h-full` to respect parent container
- Fixed backgrounds or borders that span full viewport width

**Step 2: Fix RewardsSelector.jsx**

Currently uses:
```jsx
<div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 to-slate-800">
```

Change to:
```jsx
<div className="flex flex-col h-full">
```

Remove `h-screen` and full-viewport backgrounds. Let the parent `<main>` container handle max-width and centering.

**Step 3: Fix RewardsSummary.jsx**

Same pattern — remove `h-screen` and full-width backgrounds.

**Step 4: Verify other components respect container**

Any component that has `w-full` inside the container is fine — it just fills the container's width. The issue is components that use `h-screen` or viewport-width backgrounds.

**Step 5: Verify with build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add src/features/discover/components/RewardsSelector.jsx src/features/discover/components/RewardsSummary.jsx
git commit -m "fix: ensure container constraint respected by all components"
```

---

## Task 7: Update Tests for New Icon Output

**Problem:** Tests in gameUtils.test.js expect emoji strings. If we change getRequirementIcon to return react-icon components, tests need updating.

**Files:**
- Modify: `src/shared/utils/__tests__/gameUtils.test.js`
- Modify: `src/shared/utils/requirements.js` (if changing icon function)

**Step 1: Decide on approach**

Option A: Keep getRequirementIcon returning strings, use react-icons in components directly
Option B: Change getRequirementIcon to return icon component names, update tests

**Recommendation: Option A** — Minimal changes. Components already handle their own icons. Keep the utility function for text/logic.

**Step 2: If Option A, no test changes needed**

Skip to Step 5.

**Step 3: If Option B, update tests**

```js
// Before:
expect(getRequirementIcon('level')).toBe('⭐');

// After:
expect(getRequirementIcon('level')).toBe('FaStar');
```

**Step 4: Verify with build and tests**

```bash
npm run build
npm test -- --run
```

**Step 5: Commit**

```bash
git add src/shared/utils/ src/shared/utils/__tests__/
git commit -m "test: update icon tests for react-icons"
```

---

## Task 8: Final Verification

**Files:**
- Run full build
- Run all tests
- Run E2E tests
- Manual visual check

**Step 1: Build verification**

```bash
npm run build
```

**Step 2: Unit test verification**

```bash
npm test -- --run
```

**Step 3: E2E test verification**

```bash
npx playwright test
```

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

---

## Summary of Changes

| Request | Tasks |
|---------|-------|
| 1. Temporary Process selector | Task 1 |
| 2. Fix item names | Task 2 |
| 3. Visual consistency | Tasks 3, 6 |
| 4. Replace emojis with react-icons | Tasks 4, 5, 7 |

**Total: 8 tasks, ~2-3 hours estimated.**
