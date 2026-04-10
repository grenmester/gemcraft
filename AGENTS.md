# AGENTS.md

## Validation Requirements

Before considering any task complete, verify:

1. **Build passes:** Run `pnpm build` and ensure it succeeds
2. **Tests pass:** Run `pnpm playwright test` - all relevant tests should pass
3. **App loads in browser:** Start dev server (`pnpm run dev`), open http://localhost:5173, verify no console errors
4. **No schema validation errors:** Check that items.yaml validation passes (no "Invalid option" errors)

## Common Issues & Resolutions

### Issue: Subagent reports success but files don't exist
**Symptom:** Subagent reports "Implementation complete" but spec reviewer finds "File does not exist"
**Resolution:** Always verify files exist before reviewing. If not found, the implementer's commit was likely false. Re-dispatch with explicit file path requirements.

### Issue: Immutability violations in GameContext reducer
**Symptom:** State mutations causing React re-render bugs
**Resolution:** Always use spread operators and create new objects/arrays. Never mutate `state` directly.

### Issue: CSS import failures
**Symptom:** Component imports non-existent CSS file
**Resolution:** Ensure CSS files are created before committing JSX that imports them.

### Issue: String literals vs GAME_PHASES constants
**Symptom:** Inconsistent phase routing (some use constants, some use strings)
**Resolution:** Always use GAME_PHASES from constants.js. String literals like 'inventory' or 'gemdex' should be added to GAME_PHASES.

### Issue: Build succeeds but component not found at runtime
**Symptom:** `npm run build` passes but app crashes
**Resolution:** Check import paths match file locations. Vite requires exact path matches.

### Context for This Project

The game is in `.worktrees/craft/` (feature branch for Craft phase). Current structure:
- `src/data/items.yaml` - All items (gems, minerals, ores, metals)
- `src/data/subareas.js` - 15 location tiers with loot tables
- `src/features/craft/components/Craft.jsx` - Crafting UI
- `src/features/process/components/ActiveProcessing.jsx` - Process UI with ore refining
- `src/features/inventory/components/Inventory.jsx` - Inventory with ores/metals tabs
- `src/context/GameContext.jsx` - Main state management

## Design Decisions (User-Approved 2026-03-28)

1. **Loot Tables:** Per-location loot objects with rarity tiers
2. **Discover Tabs:** UI tabs (not separate screens)
3. **Rewards Summary:** Show earned rewards with names

## Notes

- Follow conventional commits style for commit messages
- Use `pnpm` over `npm`
- Use `uv python` over `python`

## Testing Commands

```bash
# Build the project
pnpm build

# Run Playwright tests
pnpm playwright test

# Start dev server for manual testing
pnpm run dev
# Then open http://localhost:5173
```
