# Gemdex Implementation Plan

> **For Claude:** Use subagent-driven-development to implement this plan.

**Goal:** Create a gem encyclopedia screen displaying discovered gems, their properties, hardness, and where to find them.

**Architecture:** 
- Gemdex component with grid view and detail modal
- Mohs hardness visualization
- Integration with Player.gemdex (discovered gems)
- Educational gem facts and mineral family info

**Tech Stack:** React, existing GameContext, CSS

---

## Design Direction

**Aesthetic:** Victorian naturalist's field journal - aged paper textures, serif typography with copper/brass accents. Creates a memorable collector's journal feel fitting the gem-collecting theme.

**Color Palette:**
- Background: Warm parchment (#f4e4c1)
- Text: Deep sepia (#3d2914)
- Accent: Copper/brass (#b87333)
- Cards: Cream white (#faf6ed)

---

## Task 1: Gemdex Component

**Files:**
- Create: `src/components/Gemdex.jsx`
- Create: `src/components/Gemdex.css`

**Step 1: Create Gemdex.jsx**

Create `src/components/Gemdex.jsx` with:
- Import hooks (useState, useMemo), GameContext, gems.json, locations.js
- MINERAL_FAMILIES constant mapping gem types to colors and names
- GEM_FACTS constant with educational facts for each gem
- State: selectedGem, filter ('all'|'discovered'|'undiscovered'), sortBy
- discoveredGemIds Set from state.player.gemdex
- filteredGems: filter and sort gems, add discovered status and family info
- stats: total gems, discovered count, percentage
- Render: header with back button, title, stats | toolbar with filter tabs and sort | progress bar | gem grid
- Gem cards: show icon with family color, name, family, value (or ??? for undiscovered)
- Detail modal: gem icon, name, family, value & hardness stats, Mohs scale visualization, locations where found, educational fact
- Helper function getMohsMineral to show scale labels

**Step 2: Create Gemdex.css**

Create `src/components/Gemdex.css` with:
- Victorian field journal aesthetic with parchment background
- Playfair Display serif font for headings
- Copper/brass accent colors (#b87333)
- Cream card backgrounds with sepia text
- Filter tabs with active state styling
- Progress bar with gradient fill
- Gem cards with hover lift effect
- Undiscovered gems with dashed border and reduced opacity
- Detail modal overlay with backdrop blur
- Mohs scale bar with gradient segments

**Step 3: Update App.jsx**

Add:
- Import: `import Gemdex from './components/Gemdex';`
- Case: `case 'gemdex': return <Gemdex />;`

**Step 4: Update Menu.jsx**

Add Gemdex button to menu:
```jsx
{ label: 'Gemdex', phase: 'gemdex', icon: '📖' }
```

**Step 5: Commit**
```bash
git add src/components/Gemdex.jsx src/components/Gemdex.css src/App.jsx src/components/Menu.jsx && git commit -m "feat: add Gemdex encyclopedia component"
```

---

## Task 2: Test with Playwright

**Files:**
- Test: `playwright open http://localhost:5173`

**Step 1: Start dev server if not running**
```bash
cd .worktrees/prototype && npm run dev &
sleep 3
```

**Step 2: Use playwright-cli to test**
```bash
playwright-cli open http://localhost:5173
playwright-cli snapshot
# Navigate to Gemdex
playwright-cli click "Gemdex button"
playwright-cli snapshot
# Take screenshot of Gemdex
playwright-cli screenshot gemdex-page.png
# Close
playwright-cli close
```

---

## Verification Checklist

- [ ] Gemdex component renders with grid of gems
- [ ] Filter tabs work (All, Discovered, Undiscovered)
- [ ] Sort dropdown works (Name, Value, Hardness)
- [ ] Progress bar shows completion percentage
- [ ] Clicking gem opens detail modal
- [ ] Detail shows Mohs scale visualization
- [ ] Detail shows locations where gem can be found
- [ ] Educational fact displays correctly
- [ ] Back button returns to menu
- [ ] Undiscovered gems show ??? and cannot see details
