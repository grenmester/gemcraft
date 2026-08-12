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
      axis: 'diagnostic',
      kind: 'numeric',
      property: def.property,
      center: numericProperty(trueSpecies, def.property),
      band: bandWidth({ property: def.property, mastery, livePlay, familiarity })
    };
  }
  return { testId, axis: 'diagnostic', kind: 'categorical', property: def.property, key: fluorescenceKey(trueSpecies) };
}

/** The two traits a player observes for free, just by looking at the stone. */
export const OBSERVED_TRAITS = {
  hue: { id: 'hue', name: 'Hue', kind: 'hue' },
  transparency: { id: 'transparency', name: 'Transparency', kind: 'transparency' }
};

/**
 * Grading observations. Unlike a diagnostic test, these read the SPECIMEN
 * rather than its species: every corundum has the same specific gravity, but
 * this stone's carat is its own. They say what a stone is worth, never what
 * it is.
 */
export const GRADE_DEFS = {
  weigh: { id: 'weigh', name: 'Weigh', kind: 'quality-exact', property: 'caratWeight' },
  colour: { id: 'colour', name: 'Grade Colour', kind: 'quality-band', property: 'colorGrade' },
  clarity: { id: 'clarity', name: 'Grade Clarity', kind: 'quality-band', property: 'clarity' }
};

export function runGrading(gradeId, specimen, { mastery, livePlay }) {
  const def = GRADE_DEFS[gradeId];
  if (def.kind === 'quality-exact') {
    return { testId: def.id, axis: 'quality', kind: def.kind, property: def.property, value: specimen[def.property] };
  }
  return {
    testId: def.id,
    axis: 'quality',
    kind: def.kind,
    property: def.property,
    center: specimen[def.property],
    band: bandWidth({ property: def.property, mastery, livePlay })
  };
}

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

/** Every candidate still consistent with everything observed so far. Quality
 *  readings are skipped: a heavy stone is not a different mineral. */
export function consistentSpecies(candidateIds, speciesById, readings) {
  const diagnostics = readings.filter((r) => r.axis !== 'quality');
  return candidateIds.filter((id) =>
    diagnostics.every((r) => consistentWithSpecies(speciesById[id], r))
  );
}
