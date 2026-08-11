import { TEST_DEFS, GRADE_DEFS, OBSERVED_TRAITS, consistentSpecies } from './tests.js';
import { revealedReadings } from './traits.js';
import { seedCandidates } from './candidates.js';
import { stoneRung, rungLabel } from './rungs.js';

// The stone sheet's shape. Every number comes from tests.js, traits.js,
// grading.js or rungs.js — this module decides what to show and what to call
// it, never how to compute it.

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

const gradeRow = (def, reading) => ({
  id: def.id,
  label: def.name,
  free: false,
  measured: Boolean(reading),
  value: reading ? (reading.kind === 'quality-exact' ? reading.value : reading.center) : null,
  uncertainty: reading && reading.kind === 'quality-band' ? reading.band : null
});

export function traitPanel(specimen, species, speciesById, locality, identified = false) {
  const readings = revealedReadings(specimen, species);
  const byId = Object.fromEntries(readings.map((r) => [r.testId, r]));

  const diagnostics = [
    ...Object.values(OBSERVED_TRAITS).map((t) => freeRow(t, byId[t.id])),
    ...Object.values(TEST_DEFS).map((d) => testRow(d, byId[d.id]))
  ];
  const qualities = Object.values(GRADE_DEFS).map((d) => gradeRow(d, byId[d.id]));

  const pool = locality
    ? seedCandidates(locality, specimen.foundDepth)
    : [specimen.trueSpeciesId];
  const consistent = consistentSpecies(pool, speciesById, readings);
  const rung = stoneRung(specimen, identified);

  return {
    diagnostics,
    qualities,
    // Temporary alias so the CURRENT Identify screen keeps behaving exactly as
    // it did until Task 6 replaces it with the two-section sheet. Deliberately
    // diagnostics only: including qualities here would half-introduce grading
    // into a screen that cannot label or explain it. Delete this and its last
    // consumer together — nothing new should read `rows`.
    rows: diagnostics,
    consistent,
    resolved: consistent.length === RESOLVED_COUNT,
    rung,
    rungLabel: rungLabel(rung)
  };
}

/** Every stone the player can pick up, and how far each one has got. */
export function benchStrip(stones, speciesById) {
  const total = Object.keys(GRADE_DEFS).length + Object.keys(TEST_DEFS).length;
  return stones.map((s) => {
    const identified = Boolean(s.identifiedAs);
    const rung = stoneRung(s, identified);
    return {
      instanceId: s.instanceId,
      speciesId: identified ? s.trueSpeciesId : null,
      name: identified ? speciesById[s.trueSpeciesId]?.name ?? null : null,
      hue: s.hue,
      rung,
      rungLabel: rungLabel(rung),
      measured: Object.keys(s.revealed ?? {}).length,
      total
    };
  });
}
