/** Numeric helpers shared across domain rules. Extracted because four
 *  modules carried byte-identical copies. */

export const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export const round2 = (n) => Math.round(n * 100) / 100;
