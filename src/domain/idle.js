import { breakChance } from './dive.js';
import { clamp } from '../shared/math.js';

// The idle sieve (§1-§2 of the idle spec). It works the shallows and never
// gambles: it descends only while the risk stays inside tolerance. That is
// what keeps it permanently behind active play without a balance constant —
// pushing past the risk-free line is a decision, and an absent player makes
// no decisions.
//
// Risk itself is dive.js's rule; this module only asks it questions.

export const MS_PER_HOUR = 3600000;
export const IDLE_CAP_HOURS = 8;
export const IDLE_RISK_TOLERANCE = 0.10;
export const IDLE_BASE_RATE = 1;
export const IDLE_RATE_PER_LEVEL = 0.15;

/** The deepest stage whose risk is within tolerance, never past bedrock. */
export function idleDepth(level, maxDepth, damping = 0) {
  let depth = 1;
  while (depth < maxDepth && breakChance(depth + 1, level, damping) <= IDLE_RISK_TOLERANCE) {
    depth++;
  }
  return depth;
}

/** Stones per hour. Scales with the same level that sets idleDepth. */
export function idleRate(level) {
  return IDLE_BASE_RATE + level * IDLE_RATE_PER_LEVEL;
}

export function accruedHours(since, now) {
  return clamp((now - since) / MS_PER_HOUR, 0, IDLE_CAP_HOURS);
}

export function pendingCount(level, since, now) {
  return Math.floor(accruedHours(since, now) * idleRate(level));
}
