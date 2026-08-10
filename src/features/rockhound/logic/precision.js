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
