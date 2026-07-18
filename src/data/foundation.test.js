import { describe, it, expect } from 'vitest';

import { species, speciesById } from '../loaders/species.js';
import { cutTechniques, cutTechniquesById, cutSuccessAtLevel } from '../loaders/cutTechniques.js';
import { localities, localitiesById, getFindPoolSpecies } from '../loaders/localities.js';

import { speciesSchema } from '../schemas/species.js';
import { localitySchema, findPoolEntrySchema, gateGroupSchema } from '../schemas/localities.js';

// Walk a gate tree collecting leaf conditions.
function collectGateConditions(group, acc = []) {
  for (const key of ['allOf', 'anyOf']) {
    for (const node of group?.[key] ?? []) {
      if ('type' in node) acc.push(node);
      else collectGateConditions(node, acc);
    }
  }
  return acc;
}

describe('foundation: data loads', () => {
  it('loads species, cut techniques, and localities', () => {
    expect(species.length).toBeGreaterThan(0);
    expect(cutTechniques.length).toBeGreaterThan(0);
    expect(localities.length).toBeGreaterThan(0);
  });

  it('has unique ids in each dataset', () => {
    expect(new Set(species.map((s) => s.id)).size).toBe(species.length);
    expect(new Set(cutTechniques.map((t) => t.id)).size).toBe(cutTechniques.length);
    expect(new Set(localities.map((l) => l.id)).size).toBe(localities.length);
  });
});

describe('foundation: cross-references are intact', () => {
  it('every findPool species exists', () => {
    for (const loc of localities) {
      for (const speciesId of getFindPoolSpecies(loc.id)) {
        expect(speciesById[speciesId], `${loc.id} → ${speciesId}`).toBeDefined();
      }
    }
  });

  it('every suitableCut references a real cut technique', () => {
    for (const s of species) {
      for (const cutId of s.suitableCuts) {
        expect(cutTechniquesById[cutId], `${s.id} → ${cutId}`).toBeDefined();
      }
    }
  });

  it('every phenomenon is revealed by a cut the species can use, and that cut reveals it', () => {
    for (const s of species) {
      for (const phen of s.phenomena ?? []) {
        const cut = cutTechniquesById[phen.revealedBy];
        expect(cut, `${s.id} phenomenon → ${phen.revealedBy}`).toBeDefined();
        expect(s.suitableCuts).toContain(phen.revealedBy);
        expect(cut.revealsPhenomena).toContain(phen.type);
      }
    }
  });

  it('setComplete gates reference real localities / families', () => {
    const families = new Set(species.map((s) => s.family));
    for (const loc of localities) {
      for (const cond of collectGateConditions(loc.unlockGate)) {
        if (cond.type !== 'setComplete') continue;
        if (cond.setType === 'locality') {
          expect(localitiesById[cond.id], `${loc.id} gate → locality ${cond.id}`).toBeDefined();
        } else {
          expect(families.has(cond.id), `${loc.id} gate → family ${cond.id}`).toBe(true);
        }
      }
    }
  });

  it('starter localities exist (at least one empty gate)', () => {
    const starters = localities.filter((l) => collectGateConditions(l.unlockGate).length === 0);
    expect(starters.length).toBeGreaterThan(0);
  });
});

describe('foundation: cut success curve (§13.3)', () => {
  it('round brilliant runs ~0.50 at Lv1 and ~0.90 at Lv10', () => {
    const rb = cutTechniquesById.round_brilliant;
    expect(cutSuccessAtLevel(rb, 1)).toBeCloseTo(0.5, 2);
    expect(cutSuccessAtLevel(rb, 10)).toBeCloseTo(0.9, 2);
  });

  it('clamps below level 1 and above maxLevel', () => {
    const rb = cutTechniquesById.round_brilliant;
    expect(cutSuccessAtLevel(rb, 0)).toBeCloseTo(0.5, 2);
    expect(cutSuccessAtLevel(rb, 99)).toBeCloseTo(0.9, 2);
  });
});

describe('foundation: schemas reject malformed data', () => {
  const validSpecies = species[0];

  it('rejects hardness above the Mohs scale', () => {
    const bad = { ...validSpecies, hardness: 11 };
    expect(speciesSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a findPool range with min > max', () => {
    const bad = {
      species: 'quartz',
      weight: 1,
      caratRange: [1, 2],
      clarityRange: [90, 40],
      colorRange: [30, 70]
    };
    expect(findPoolEntrySchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown gate condition type', () => {
    const bad = { allOf: [{ type: 'phase_of_moon', value: 'full' }] };
    expect(gateGroupSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown keys in a gate group', () => {
    const bad = { allOf: [], somethingElse: true };
    expect(gateGroupSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts the seeded localities', () => {
    for (const loc of localities) {
      expect(localitySchema.safeParse(loc).success, loc.id).toBe(true);
    }
  });
});
