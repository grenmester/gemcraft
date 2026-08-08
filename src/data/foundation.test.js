import { describe, it, expect } from 'vitest';

import { species, speciesById } from '../loaders/species.js';
import { cutTechniques, cutTechniquesById, cutSuccessAtLevel } from '../loaders/cutTechniques.js';
import { localities, localitiesById, getFindPoolSpecies } from '../loaders/localities.js';

import { RARITY_ENUM, speciesSchema } from '../schemas/species.js';
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

  it('every species is obtainable from at least one locality find pool', () => {
    const pooled = new Set(localities.flatMap((l) => l.findPool.map((e) => e.species)));
    const missing = species.filter((s) => !pooled.has(s.id)).map((s) => s.id);
    expect(missing).toEqual([]);
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

describe('locality depth fields', () => {
  it('gives every locality a bedrock depth of at least 3', () => {
    for (const l of localities) {
      expect(l.maxDepth, `${l.id} maxDepth`).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every locality at least one deep-only find', () => {
    for (const l of localities) {
      const deepOnly = l.findPool.filter((e) => e.minDepth > 1);
      expect(deepOnly.length, `${l.id} deep-only entries`).toBeGreaterThan(0);
    }
  });

  it('never puts a find deeper than the locality goes', () => {
    for (const l of localities) {
      for (const e of l.findPool) {
        expect(e.minDepth, `${l.id}/${e.species} minDepth`).toBeLessThanOrEqual(l.maxDepth);
      }
    }
  });

  it('defaults depthBias to 1 and minDepth to 1 when unstated', () => {
    // hidden_creek's quartz entry states a bias; its garnet entry does not.
    const creek = localities.find((l) => l.id === 'hidden_creek');
    const garnet = creek.findPool.find((e) => e.species === 'almandine_garnet');
    expect(garnet.depthBias).toBe(1);
    expect(garnet.minDepth).toBe(1);
  });
});

describe('rarity tiers', () => {
  it('are owned by the species schema, in ascending order', () => {
    expect(RARITY_ENUM).toEqual(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  });

  it('cover every species in the roster', () => {
    for (const s of species) {
      expect(RARITY_ENUM, `${s.id} rarity`).toContain(s.rarity);
    }
  });
});
