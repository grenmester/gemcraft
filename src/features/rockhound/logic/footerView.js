import { METHOD_ENUM } from '../../../schemas/localities.js';
import { localities } from '../../../loaders/localities.js';
import { methodProgress } from './diveView.js';
import { reachDepth, xpThreshold, effectiveReach, MAX_METHOD_LEVEL } from './dive.js';

// Presentation shape for the status footer. Every number is produced by
// dive.js / diveView.js — this module chooses what to show, never how to
// compute it.

/**
 * The deepest bedrock any locality using this method actually offers. Reach
 * is locality-agnostic (dive.js), but no site lets a player descend past its
 * own maxDepth, so the footer must not promise a depth the method can never
 * reach anywhere. Derived from the loader so it tracks localities.yaml.
 */
const deepestBedrockByMethod = Object.fromEntries(
  METHOD_ENUM.map((method) => [
    method,
    Math.max(...localities.filter((l) => l.method === method).map((l) => l.maxDepth))
  ])
);

/** How far through the current level's xp span this player is, 0-100. */
function progressPct(level, xp) {
  const floor = xpThreshold(level);
  const ceil = xpThreshold(level + 1);
  if (ceil <= floor) return 100;
  return Math.round(((xp - floor) / (ceil - floor)) * 100);
}

/**
 * The next level that actually increases reach, or null at the cap. Reach
 * steps every other level, so the level immediately above the current one
 * frequently buys no depth at all; naming it would promise nothing.
 */
function nextDepthLevel(level) {
  for (let l = level + 1; l <= MAX_METHOD_LEVEL; l++) {
    if (reachDepth(l) > reachDepth(level)) return l;
  }
  return null;
}

export function methodTracks(exploreMethodXp = {}) {
  return METHOD_ENUM.map((method) => {
    const xp = exploreMethodXp[method] ?? 0;
    const p = methodProgress(xp);
    return {
      method,
      level: p.level,
      xp,
      toNext: p.toNext,
      atCap: p.atCap,
      // Progress across the CURRENT level's span, not from zero: at level 4
      // (400xp) heading for level 5 (600xp), 500xp must read 50%, not 83%.
      pct: p.atCap ? 100 : progressPct(p.level, xp),
      // No setComplete bonus here: the footer speaks for the method in
      // general, not any one locality's completion state.
      reach: effectiveReach(p.level, deepestBedrockByMethod[method], false),
      nextDepthAt: nextDepthLevel(p.level)
    };
  });
}
