import { TEST_DEFS, OBSERVED_TRAITS, consistentSpecies } from './tests.js';
import { revealedReadings } from './traits.js';
import { seedCandidates } from './candidates.js';

// The trait panel's shape. Every number comes from tests.js or traits.js —
// this module decides what to show and what to call it, never how to compute
// it.

const RESOLVED_COUNT = 1;

const freeRow = (trait, reading) => ({
  id: trait.id,
  label: trait.name,
  free: true,
  measured: Boolean(reading),
  value: reading ? reading.value : null,
  uncertainty: null
});

const testRow = (def, reading) => ({
  id: def.id,
  label: def.name,
  free: false,
  measured: Boolean(reading),
  value: reading ? (reading.kind === 'numeric' ? reading.center : reading.key) : null,
  uncertainty: reading && reading.kind === 'numeric' ? reading.band : null
});

export function traitPanel(specimen, species, speciesById, locality) {
  const readings = revealedReadings(specimen, species);
  const byId = Object.fromEntries(readings.map((r) => [r.testId, r]));

  const rows = [
    ...Object.values(OBSERVED_TRAITS).map((t) => freeRow(t, byId[t.id])),
    ...Object.values(TEST_DEFS).map((d) => testRow(d, byId[d.id]))
  ];

  const pool = locality
    ? seedCandidates(locality, specimen.foundDepth)
    : [specimen.trueSpeciesId];
  const consistent = consistentSpecies(pool, speciesById, readings);

  return { rows, consistent, resolved: consistent.length === RESOLVED_COUNT };
}
