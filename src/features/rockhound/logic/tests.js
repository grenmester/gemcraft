import { numericProperty, fluorescenceKey } from './properties.js';
import { bandWidth } from './precision.js';
import { huesForSpecies } from './hues.js';

export const TEST_DEFS = {
  scratch: { id: 'scratch', name: 'Scratch Test', kind: 'numeric', property: 'hardness', gear: 'hardness_picks' },
  heft: { id: 'heft', name: 'Heft in Water', kind: 'numeric', property: 'specificGravity', gear: 'scale' },
  uv: { id: 'uv', name: 'UV Light', kind: 'categorical', property: 'fluorescence', gear: 'uv_light' }
};

export function runTest(testId, trueSpecies, { mastery, livePlay, familiarity = 1 }) {
  const def = TEST_DEFS[testId];
  if (def.kind === 'numeric') {
    return {
      testId,
      kind: 'numeric',
      property: def.property,
      center: numericProperty(trueSpecies, def.property),
      band: bandWidth({ property: def.property, mastery, livePlay, familiarity })
    };
  }
  return { testId, kind: 'categorical', property: def.property, key: fluorescenceKey(trueSpecies) };
}

/** The two traits a player observes for free, just by looking at the stone. */
export const OBSERVED_TRAITS = {
  hue: { id: 'hue', name: 'Hue', kind: 'hue' },
  transparency: { id: 'transparency', name: 'Transparency', kind: 'transparency' }
};

/**
 * Whether this species could have produced this reading. The player is shown
 * the reading, and the species list is derived from it rather than mutated
 * by it.
 */
export function consistentWithSpecies(species, reading) {
  switch (reading.kind) {
    case 'numeric':
      return Math.abs(numericProperty(species, reading.property) - reading.center) <= reading.band;
    case 'categorical':
      return fluorescenceKey(species) === reading.key;
    case 'hue':
      return huesForSpecies(species).includes(reading.value);
    case 'transparency':
      return species.transparency === reading.value;
    default:
      return true;
  }
}

/** Every candidate still consistent with everything observed so far. */
export function consistentSpecies(candidateIds, speciesById, readings) {
  return candidateIds.filter((id) =>
    readings.every((r) => consistentWithSpecies(speciesById[id], r))
  );
}
