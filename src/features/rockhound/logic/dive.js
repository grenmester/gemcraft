// The Dive (§1-§5 of the Explore spec). Depth is the single axis carrying
// volume, quality and access; this module owns every number that depends on
// it. View modules must delegate here rather than restate a formula.

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
const round2 = (n) => Math.round(n * 100) / 100;

export const MAX_METHOD_LEVEL = 10;
export const LEVELS_PER_DEPTH = 2;
export const LEVELS_PER_EXTRA_STONE = 3;
export const BREAK_PER_DEPTH = 0.15;
export const BREAK_PER_LEVEL = 0.01;
export const MAX_BREAK_CHANCE = 0.6;
/** The depth at and below which a break costs stones, not just quality. */
export const REAL_LOSS_DEPTH = 3;
export const XP_PER_DEPTH = 10;
export const BREAK_XP_FRACTION = 0.5;
export const DEGRADE_CLARITY = 12;
export const DEGRADE_CARAT = 0.85;

export function reachDepth(level) {
  return 1 + Math.floor(level / LEVELS_PER_DEPTH);
}

/**
 * How deep this player can actually go here: their own reach, plus one for
 * knowing the ground, but never past the locality's bedrock.
 */
export function effectiveReach(level, maxDepth, setComplete) {
  return Math.min(reachDepth(level) + (setComplete ? 1 : 0), maxDepth);
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
    clarity: Math.max(1, specimen.clarity - DEGRADE_CLARITY),
    caratWeight: round2(specimen.caratWeight * DEGRADE_CARAT)
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
  return 20 * level * level + 20 * level;
}

export function levelForXp(xp) {
  let level = 0;
  while (level < MAX_METHOD_LEVEL && xp >= xpThreshold(level + 1)) level++;
  return level;
}
