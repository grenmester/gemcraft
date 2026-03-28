# AGENTS.md

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

The game is in `.worktrees/prototype/`. Current structure:
- `src/data/gems.json` - 20 gems with `locations` array (tier keys)
- `src/data/locations.js` - 15 location tiers (TIER_1 to TIER_5_C)
- `src/components/Discover.jsx` - Currently broken (needs tab fix)
- `src/components/TempMinigame.jsx` - Placeholder, will be replaced with real flow
- `src/context/GameContext.jsx` - Main state management

## Design Decisions (User-Approved 2026-03-28)

1. **Loot Tables:** Per-location loot objects with rarity tiers
2. **Discover Tabs:** UI tabs (not separate screens)
3. **Rewards Summary:** Show earned rewards with names
