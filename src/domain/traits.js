// What the player has observed about one stone. Kept on the specimen rather
// than in component state, so measuring a trait is not undone by switching
// tabs.

/** A hue the game could not determine — specimens saved before hues existed. */
export const UNKNOWN_HUE = 'unknown';

export function isRevealed(revealed, traitId) {
  return Boolean(revealed?.[traitId]);
}

/**
 * Fold a new reading into the record. The narrower reading always wins, so
 * re-measuring with better mastery improves what you know and can never make
 * a stone less resolved than it already was.
 */
export function mergeReading(revealed, reading) {
  const existing = revealed?.[reading.testId];
  if (existing && existing.band != null && reading.band != null && existing.band <= reading.band) {
    return revealed;
  }
  return { ...revealed, [reading.testId]: reading };
}

/**
 * Everything observed about this stone: the two free observations plus every
 * measured reading. Transparency is a property of the species, not of the
 * individual stone, so it is read from the species rather than rolled.
 */
export function revealedReadings(specimen, species) {
  const free = [];
  if (specimen.hue && specimen.hue !== UNKNOWN_HUE) {
    free.push({ testId: 'hue', axis: 'diagnostic', kind: 'hue', value: specimen.hue });
  }
  if (species?.transparency) {
    free.push({ testId: 'transparency', axis: 'diagnostic', kind: 'transparency', value: species.transparency });
  }
  return [...free, ...Object.values(specimen.revealed ?? {})];
}
