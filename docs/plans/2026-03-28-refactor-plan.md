# Refactoring Plan: CSS, Architecture & Testing

## Phase 1: CSS Migration to Tailwind

### Goal: Remove all .css files except Tailwind config

**CSS Files to Migrate:**
| File | Status | Action |
|------|--------|--------|
| `src/App.css` | Has `.btn` classes | Move to Tailwind @layer components |
| `src/index.css` | Base styles | Keep minimal resets |
| `src/components/Gemdex.css` | Custom styles | Migrate to inline Tailwind |
| `src/components/BaseMinigame.css` | Archived | Delete (disabled) |
| `src/components/Minigame.css` | Archived | Delete (disabled) |
| `src/components/MinigameResults.css` | Archived | Delete (disabled) |
| `src/components/Process.css` | Simple | Migrate to Tailwind |
| `src/components/Craft.css` | Simple | Migrate to Tailwind |
| `src/components/Sell.css` | Simple | Migrate to Tailwind |

**Action for App.css button classes:**
```javascript
// Add to index.css or create src/styles/buttons.css
@layer components {
  .btn {
    @apply px-6 py-3 font-semibold rounded-lg transition-all;
  }
  .btn-primary {
    @apply bg-red-500 text-white hover:bg-red-400;
  }
  .btn-secondary {
    @apply bg-slate-700 text-white hover:bg-teal-500;
  }
  .btn-gold {
    @apply bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:shadow-lg;
  }
}
```

---

## Phase 2: Architecture Refactoring

### Goal: Separate game logic from React UI

**Current Structure:**
```
src/
├── components/     # All UI components (flat)
├── context/        # GameContext (mixed logic + React)
├── data/           # Static data
├── models/         # Data models
├── hooks/          # Custom hooks
├── utils/          # Utility functions
└── constants.js    # Constants
```

**Target Structure:**
```
src/
├── game/                    # Pure game logic (no React dependencies)
│   ├── constants.js         # PHASES, TIERS, CONFIG
│   ├── reducer.js          # Pure state reducer
│   ├── actions.js          # Action creators
│   ├── selectors.js        # State selectors
│   ├── migrations.js      # Save migrations
│   └── initialState.js    # Default state
│
├── data/                    # Static game data
│   ├── gems.json
│   ├── lootTables.js
│   ├── locations.js
│   └── equipment.js
│
├── models/                  # Domain models
│   ├── Player.js
│   ├── Gem.js
│   └── Inventory.js
│
├── components/             # UI Layer (only rendering)
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── menu/
│   │   └── Menu.jsx
│   ├── discover/
│   │   ├── Discover.jsx
│   │   ├── LocationSelector.jsx
│   │   ├── SubareaSelector.jsx
│   │   ├── RewardsSelector.jsx
│   │   └── RewardsSummary.jsx
│   ├── inventory/
│   │   └── Inventory.jsx
│   ├── gemdex/
│   │   └── Gemdex.jsx
│   └── debug/
│       └── DebugPanel.jsx
│
├── hooks/                 # UI hooks (useGame, useGameState)
│   └── useGame.js
│
├── context/               # React context (thin wrapper)
│   └── GameProvider.jsx
│
├── styles/
│   └── buttons.css        # Custom button @layer (only CSS needed)
│
├── index.css             # Tailwind + minimal resets
└── App.jsx              # Main app shell
```

### Key Changes:
1. **Game logic is pure** - `reducer.js` has no React imports, testable without DOM
2. **Actions are creators** - Not just strings, but functions that return actions
3. **Selectors extract state** - Components don't access `state.player.coins` directly
4. **Context is thin** - Only wraps provider, imports from `game/`

---

## Phase 3: Unit Testing

### Goal: Test game logic independently

**Testing Stack:**
- Vitest (fast, modern)
- React Testing Library (for component tests if needed)

**Test Structure:**
```
src/
├── game/
│   ├── reducer.test.js    # Test all state transitions
│   ├── selectors.test.js  # Test state queries
│   └── actions.test.js     # Test action creators
│
├── models/
│   ├── Player.test.js
│   ├── Gem.test.js
│   └── Inventory.test.js
│
└── utils/
    ├── requirements.test.js
    └── lootTables.test.js
```

**Test Coverage:**
- [ ] All reducer cases (ADD_COINS, ADD_GEM, etc.)
- [ ] State migrations
- [ ] Selectors (getPlayerGems, getInventoryCount, etc.)
- [ ] Model methods
- [ ] Utility functions (rollLoot, checkRequirements, etc.)

---

## Execution Order

### Week 1: CSS Migration
1. Migrate App.css buttons to Tailwind @layer
2. Migrate Gemdex.css to inline Tailwind
3. Migrate Process/Craft/Sell CSS to Tailwind
4. Delete archived .disabled.css files

### Week 2: Architecture
1. Create `src/game/` module
2. Extract reducer logic (pure functions)
3. Create selectors
4. Update context to import from game/
5. Move components into feature folders
6. Update imports across app

### Week 3: Testing
1. Install Vitest
2. Write tests for reducer
3. Write tests for selectors
4. Write tests for models
5. Write tests for utilities

---

## Files to Modify

### CSS Migration (8 files)
- index.css - Add @layer components
- Delete: Gemdex.css, Process.css, Craft.css, Sell.css, *.disabled.css

### Architecture (15+ files)
- Create: game/constants.js, reducer.js, actions.js, selectors.js
- Create: context/GameProvider.jsx (refactor GameContext.jsx)
- Move: components into subdirectories

### Testing (new files)
- Create: vitest.config.js
- Create: game/*.test.js
- Create: models/*.test.js

---

## Success Criteria

- [ ] Zero .css files except index.css and styles/buttons.css
- [ ] Game logic has 0 React imports
- [ ] All reducer cases have unit tests
- [ ] Components only import from hooks/, context/, data/
- [ ] Build passes
- [ ] All features work after refactor
