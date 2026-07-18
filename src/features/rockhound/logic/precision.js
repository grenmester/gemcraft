export const BASE_ERROR = { hardness: 0.5, specificGravity: 0.3 };

const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export function bandWidth({ property, mastery, instrument = 1, labPrep = 1, familiarity = 1, livePlay }) {
  const m = clamp(mastery / 100, 0.1, 1);
  const lp = clamp(livePlay, 0.6, 1);
  return BASE_ERROR[property] / (m * instrument * labPrep * familiarity * lp);
}

export function livePlayFromRng(rng) {
  return 0.6 + rng() * 0.4;
}
