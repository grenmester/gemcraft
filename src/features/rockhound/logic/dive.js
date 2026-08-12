// The Dive (§1-§5 of the Explore spec). Depth is the single axis carrying
// volume, quality and access; this module owns every number that depends on
// it. View modules must delegate here rather than restate a formula.

import { clamp, round2 } from '../../../shared/math.js';

export const MAX_METHOD_LEVEL = 10;
const LEVELS_PER_DEPTH = 2;
const LEVELS_PER_EXTRA_STONE = 3;
const BREAK_PER_DEPTH = 0.15;
const BREAK_PER_LEVEL = 0.01;
export const MAX_BREAK_CHANCE = 0.6;
/** The depth at and below which a break costs stones, not just quality. */
const REAL_LOSS_DEPTH = 3;
const XP_PER_DEPTH = 10;
const BREAK_XP_FRACTION = 0.5;
const DEGRADE_CLARITY = 12;
const DEGRADE_CARAT = 0.85;
/** Depth bonus granted once a locality's stone set is complete. */
const SET_COMPLETE_BONUS_DEPTH = 1;
/** Degraded clarity can never drop below this. */
const MIN_CLARITY = 1;
/** Degraded caratWeight can never drop to (or below) zero — the locality
 * schema requires every caratRange to be strictly positive. */
const MIN_CARAT_WEIGHT = 0.01;
/** Coefficient of the quadratic XP curve: L1 40, L2 120, L5 600, L10 2200. */
const XP_CURVE_COEFFICIENT = 20;

export function reachDepth(level) {
  return 1 + Math.floor(level / LEVELS_PER_DEPTH);
}

/**
 * How deep this player can actually go here: their own reach, plus one for
 * knowing the ground, but never past the locality's bedrock.
 */
export function effectiveReach(level, maxDepth, setComplete) {
  return Math.min(reachDepth(level) + (setComplete ? SET_COMPLETE_BONUS_DEPTH : 0), maxDepth);
}

export function haulSize(depth, level) {
  return 1 + (depth - 1) + Math.floor(level / LEVELS_PER_EXTRA_STONE);
}

/** `targetDepth` is the depth being descended TO — the risky one. */
export function breakChance(targetDepth, level, damping = 0) {
  const raw = (targetDepth - 1) * BREAK_PER_DEPTH - level * BREAK_PER_LEVEL - damping;
  return clamp(raw, 0, MAX_BREAK_CHANCE);
}

export function severityAt(targetDepth) {
  if (targetDepth <= 1) return 'none';
  return targetDepth >= REAL_LOSS_DEPTH ? 'real' : 'cozy';
}

export function degradeSpecimen(specimen) {
  return {
    ...specimen,
    clarity: Math.max(MIN_CLARITY, specimen.clarity - DEGRADE_CLARITY),
    caratWeight: Math.max(MIN_CARAT_WEIGHT, round2(specimen.caratWeight * DEGRADE_CARAT))
  };
}

export function breakConsequence(haul, targetDepth) {
  if (haul.length === 0) return { kept: [], lost: [] };
  if (severityAt(targetDepth) !== 'real') {
    return { kept: haul.map(degradeSpecimen), lost: [] };
  }
  const deepest = Math.max(...haul.map((s) => s.foundDepth));
  return {
    kept: haul.filter((s) => s.foundDepth !== deepest).map(degradeSpecimen),
    lost: haul.filter((s) => s.foundDepth === deepest)
  };
}

export function xpForStage(depth) {
  return XP_PER_DEPTH * depth;
}

export function xpForRun(depths, broke) {
  const total = depths.reduce((sum, d) => sum + xpForStage(d), 0);
  return broke ? Math.round(total * BREAK_XP_FRACTION) : total;
}

/** Quadratic curve: L1 40, L2 120, L5 600, L10 2200. */
export function xpThreshold(level) {
  return XP_CURVE_COEFFICIENT * level * level + XP_CURVE_COEFFICIENT * level;
}

export function levelForXp(xp) {
  let level = 0;
  while (level < MAX_METHOD_LEVEL && xp >= xpThreshold(level + 1)) level++;
  return level;
}
