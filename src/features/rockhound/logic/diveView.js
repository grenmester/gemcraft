import {
  levelForXp, xpThreshold, effectiveReach, breakChance, severityAt,
  MAX_METHOD_LEVEL
} from '../../../domain/dive.js';

// Read-only presentation shapes for the run UI. Every number here is
// produced by dive.js — this module chooses what to show and what to call
// it, never how to compute it.

/** Below this reach the descent affordance is not shown at all (the ramp). */
const DESCENT_VISIBLE_FROM_REACH = 2;

const asPercent = (fraction) => `${Math.round(fraction * 100)}%`;

export function methodProgress(xp) {
  const level = levelForXp(xp);
  const atCap = level >= MAX_METHOD_LEVEL;
  const nextAt = atCap ? xpThreshold(MAX_METHOD_LEVEL) : xpThreshold(level + 1);
  return { level, xp, nextAt, toNext: atCap ? 0 : nextAt - xp, atCap };
}

export function siteView(locality, xp, setComplete) {
  const level = levelForXp(xp);
  const reach = effectiveReach(level, locality.maxDepth, setComplete);
  return {
    method: locality.method,
    level,
    bedrock: locality.maxDepth,
    reach,
    showDescent: reach >= DESCENT_VISIBLE_FROM_REACH
  };
}

export function descentView(locality, currentDepth, xp, setComplete, damping = 0) {
  const level = levelForXp(xp);
  const reach = effectiveReach(level, locality.maxDepth, setComplete);
  const targetDepth = currentDepth + 1;
  const atBedrock = targetDepth > locality.maxDepth;
  const beyondReach = targetDepth > reach;
  const chance = breakChance(targetDepth, level, damping);
  return {
    targetDepth,
    available: !atBedrock && !beyondReach,
    // Bedrock is the harder wall: no amount of skill opens it, so report it
    // first when both apply.
    limitReason: atBedrock ? 'bedrock' : beyondReach ? 'reach' : null,
    chance,
    chanceText: asPercent(chance),
    severity: severityAt(targetDepth)
  };
}
