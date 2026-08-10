export const BASE_ERROR = { hardness: 0.5, specificGravity: 0.3 };

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export function bandWidth({ property, mastery, instrument = 1, labPrep = 1, familiarity = 1, livePlay }) {
  const m = clamp(mastery / 100, 0.1, 1);
  const lp = clamp(livePlay, 0.6, 1);
  return BASE_ERROR[property] / (m * instrument * labPrep * familiarity * lp);
}

// How well the reading was taken. Working by hand beats the shortcut, and when
// an instrument minigame lands this is where its score arrives — nothing else
// in the model has to change.
//
// AUTO_LIVE_PLAY is the clamp floor in bandWidth, so the shortcut is exactly
// as good as the model allows a reading to be, and no better.
export const HAND_LIVE_PLAY = 1.0;
export const AUTO_LIVE_PLAY = 0.6;

/**
 * DEAD CODE, retained only so the suite stays green until Task 8 rewrites
 * Identify.jsx. This is the source of a live defect: the reading quality it
 * returns is pure noise, and RECORD_TEST_SCORE stores its running maximum, so
 * a player's "test mastery" climbs to 100 by attrition regardless of skill.
 * Task 8 deletes both this function and its last caller.
 */
export function livePlayFromRng(rng) {
  return 0.6 + rng() * 0.4;
}
