# Temp Minigames & TailwindCSS Implementation Plan

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace all location-specific minigames with a temporary simulator for testing, install TailwindCSS v4, and replace custom CSS with Tailwind utilities.

**Architecture:** 
- Single `TempMinigame` component replaces all location minigames
- Existing minigames preserved as commented imports and renamed files for reference
- TailwindCSS v4 with Vite plugin for zero-config setup
- Custom CSS replaced with Tailwind utility classes where practical

**Tech Stack:** TailwindCSS v4, React 18, Vite 5

---

## Task 1: Install & Configure TailwindCSS v4

**Files:**
- Modify: `package.json` (add dependencies)
- Create: `tailwind.config.js`
- Modify: `vite.config.js`
- Modify: `src/index.css`

**Step 1: Install TailwindCSS v4**

```bash
cd .worktrees/prototype
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Configure Vite**

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 3: Update CSS with Tailwind imports**

```css
/* src/index.css */
@import "tailwindcss";
```

**Step 4: Verify build**

Run: `npm run build`
Expected: SUCCESS - Tailwind processes CSS

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: install TailwindCSS v4 with Vite plugin"
```

---

## Task 2: Create Temp Minigame Component

**Files:**
- Create: `src/components/TempMinigame.jsx`
- Create: `src/components/TempMinigame.css`
- Modify: `src/App.jsx`

**Step 1: Create TempMinigame component**

```jsx
// src/components/TempMinigame.jsx
import { useGame, GAME_PHASES } from '../context/GameContext';
import { SCORE_TIERS } from '../data/minigames';
import gemsData from '../data/gems.json';
import './TempMinigame.css';

export default function TempMinigame() {
  const { state, dispatch } = useGame();
  const { selectedLocation } = state;
  
  const handleSelectReward = (tier) => {
    // Calculate rewards based on tier
    const coins = tier === 'high' ? 200 : tier === 'medium' ? 100 : 50;
    const gems = tier === 'high' ? 3 : tier === 'medium' ? 2 : 1;
    const shiftPoints = tier === 'high' ? 8 : tier === 'medium' ? 3 : 1;
    
    // Add rewards
    dispatch({ type: 'ADD_COINS', payload: coins });
    dispatch({ type: 'ADD_SHIFT_POINTS', payload: shiftPoints });
    
    // Add random gems
    for (let i = 0; i < gems; i++) {
      const randomGem = gemsData.gems[Math.floor(Math.random() * gemsData.gems.length)];
      dispatch({ type: 'DEBUG_ADD_GEM', payload: randomGem });
    }
    
    // Return to location map
    dispatch({ type: SET_PHASE, payload: 'location_map' });
  };
  
  return (
    <div className="temp-minigame">
      <h2>{selectedLocation?.name || 'Mining Expedition'}</h2>
      <p>Choose your performance level:</p>
      
      <div className="reward-options">
        <button onClick={() => handleSelectReward('low')}>
          <span>Low</span>
          <span>Poor (50 coins, 1 gem, 1 shift)</span>
        </button>
        <button onClick={() => handleSelectReward('medium')}>
          <span>Medium</span>
          <span>Good (100 coins, 2 gems, 3 shift)</span>
        </button>
        <button onClick={() => handleSelectReward('high')}>
          <span>High</span>
          <span>Excellent (200 coins, 3 gems, 8 shift)</span>
        </button>
      </div>
      
      <button onClick={() => dispatch({ type: SET_PHASE, payload: 'location_map' })}>
        Back to Map
      </button>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: SUCCESS

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add TempMinigame component for testing"
```

---

## Task 3: Archive Existing Minigames & Update Routing

**Files:**
- Rename: `src/components/ChipReveal.jsx` → `src/components/ChipReveal.disabled.jsx`
- Rename: `src/components/SieveSort.jsx` → `src/components/SieveSort.disabled.jsx`
- Rename: `src/components/Minigame.jsx` → `src/components/Minigame.disabled.jsx`
- Modify: `src/App.jsx`

**Step 1: Archive minigame files**

```bash
mv src/components/ChipReveal.jsx src/components/ChipReveal.disabled.jsx
mv src/components/SieveSort.jsx src/components/SieveSort.disabled.jsx
mv src/components/Minigame.jsx src/components/Minigame.disabled.jsx
```

**Step 2: Update App.jsx routing**

Remove minigame imports, add TempMinigame import, route all location tiers to TempMinigame.

**Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: archive existing minigames for reference"
```

---

## Task 4: Refactor CSS to Tailwind

**Files:**
- Modify: `src/App.css` (strip to essential custom styles)
- Modify: `src/components/Menu.css`
- Modify: `src/components/LocationMap.css`
- Modify: `src/components/Inventory.css`
- Modify: `src/components/Gemdex.css`
- Modify: `src/components/DebugPanel.css`
- Modify: `src/components/TempMinigame.css`

**Step 1: Strip App.css to Tailwind basics**

Replace custom CSS with Tailwind utilities where possible. Keep:
- CSS variables for colors
- Custom button styles (if needed beyond Tailwind)
- Tailwind-specific directives

**Step 2: Refactor components to use Tailwind**

Migrate component-specific styles to Tailwind utility classes in JSX.

**Step 3: Verify all components render correctly**

Run: `npm run dev`
Test: Menu, Discover, LocationMap, Inventory, Gemdex, TempMinigame

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: migrate to TailwindCSS utilities"
```

---

## Task 5: Update Full-Screen Layout

**Files:**
- Modify: `src/App.css` / `src/index.css`
- Modify: `src/App.jsx`

**Step 1: Update App layout for full viewport**

- Remove `.screen` max-width constraints
- Use Tailwind container with `max-w-[1536px]`
- Ensure full-height usage with `min-h-screen`

**Step 2: Verify responsive behavior**

Test at various viewport sizes (mobile, tablet, desktop).

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: full-screen responsive layout with max-w-1536"
```

---

## Task 6: Final Integration & Playwright Test

**Files:**
- Test: All components

**Step 1: Run Playwright test**

```bash
npx playwright test
```

**Step 2: Manual verification**

- Navigate to Location Map
- Select a location
- Play TempMinigame with each difficulty
- Verify rewards are added correctly
- Verify full-screen layout works on all breakpoints

**Step 3: Commit**

```bash
git add -A && git commit -m "test: verify temp minigame and full-screen layout"
```
