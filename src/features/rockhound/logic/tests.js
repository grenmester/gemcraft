import { numericProperty, fluorescenceKey } from './properties.js';
import { bandWidth } from './precision.js';

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

export function survivesReading(candidate, reading) {
  if (reading.kind === 'numeric') {
    return Math.abs(numericProperty(candidate, reading.property) - reading.center) <= reading.band;
  }
  return fluorescenceKey(candidate) === reading.key;
}

export function eliminate(candidateIds, speciesById, reading) {
  return candidateIds.filter((id) => survivesReading(speciesById[id], reading));
}
