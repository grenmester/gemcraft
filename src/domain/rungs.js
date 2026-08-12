import { isGraded } from './grading.js';

// How completely a stone is known. There is deliberately no `variety` rung:
// in all four multi-variety families the varieties have disjoint hues, and hue
// is free — so the instant the diagnostics settle the family, the free hue has
// already settled the variety. Ruby versus sapphire IS red versus blue.
// `graded` is the real second rung, and it is the one that makes measuring
// quality worth doing.

export const RUNGS = ['unidentified', 'identified', 'graded'];

const LABELS = {
  unidentified: 'Unidentified',
  identified: 'Identified',
  graded: 'Graded'
};

export function rungLabel(rung) {
  return LABELS[rung] ?? rung;
}

/** You cannot price what you cannot name, so grading never promotes an
 *  unidentified stone. */
export function stoneRung(specimen, identified) {
  if (!identified) return 'unidentified';
  return isGraded(specimen) ? 'graded' : 'identified';
}
