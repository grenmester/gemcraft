import { describe, it, expect } from 'vitest';

import { species, speciesById } from './species/loader.js';
import { cutTechniques, cutTechniquesById, cutSuccessAtLevel } from './cutTechniques/loader.js';
import { localities, localitiesById, getFindPoolSpecies } from './localities/loader.js';

import { RARITY_ENUM, speciesSchema } from './species/schema.js';
import { localitySchema, findPoolEntrySchema, gateGroupSchema } from './localities/schema.js';

import { huesForSpecies } from '../domain/hues.js';
import { consistentSpecies } from '../domain/gemTests.js';
import { bandWidth, HAND_LIVE_PLAY } from '../domain/precision.js';
import { numericProperty, fluorescenceKey } from '../domain/properties.js';
import { backfillRough } from '../features/rockhound/RockhoundContext.jsx';
import { UNKNOWN_HUE } from '../domain/traits.js';

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

describe('identification is always possible', () => {
  // The narrowest band the model can ever produce, so this is the best case:
  // mastery 100 and hand-quality live play, delegated to bandWidth itself so
  // this guard can never silently drift from the rules it is guarding.
  const best = (species, property) => ({
    kind: 'numeric', property,
    center: numericProperty(species, property),
    band: bandWidth({ property, mastery: 100, livePlay: HAND_LIVE_PLAY })
  });

  const everything = (species, hue) => [
    { kind: 'hue', value: hue },
    { kind: 'transparency', value: species.transparency },
    best(species, 'hardness'),
    best(species, 'specificGravity'),
    { kind: 'categorical', property: 'fluorescence', key: fluorescenceKey(species) }
  ];

  it('every species declares a transparency', () => {
    // Without it, opal and obsidian are indistinguishable forever.
    for (const s of species) {
      expect(s.transparency, `${s.id} transparency`).toBeTruthy();
    }
  });

  it('no stone is unresolvable, at any locality, in any hue it can show', () => {
    // THE guard. A stone that never resolves can never be identified, cut or
    // sold at full value — a permanent dead end for the player.
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const id of pool) {
        for (const hue of huesForSpecies(speciesById[id])) {
          const survivors = consistentSpecies(pool, speciesById, everything(speciesById[id], hue));
          expect(survivors, `${loc.id}: a ${hue} ${id}`).toEqual([id]);
        }
      }
    }
  });

  it('backfill leaves nothing hueless, for every species in the roster', () => {
    // This guard always fed `everything()` a hue reading, so it never tested
    // the shape a pre-hue save actually has and could not have caught Finding
    // 1: a rough saved with no hue at all. Without a hue, several groups
    // never separate on the rest of the readings alone — e.g. a hueless ruby
    // stays [sapphire, ruby] even at maximum mastery with every test run —
    // so a rough that stays hueless is a permanent dead end exactly like the
    // guard above. The fix is to guarantee loadInitialState's backfill always
    // produces a real hue; this calls that backfill directly, against every
    // species, so it fails if the backfill is ever removed or broken.
    for (const s of species) {
      const legacy = { trueSpeciesId: s.id }; // no hue, no revealed — a pre-hue save
      const backfilled = backfillRough(legacy);
      expect(backfilled.hue, `${s.id} backfilled hue`).toBeTruthy();
      expect(backfilled.hue, `${s.id} backfilled hue`).not.toBe(UNKNOWN_HUE);
      expect(huesForSpecies(s), `${s.id} backfilled hue`).toContain(backfilled.hue);
      expect(backfilled.revealed, `${s.id} backfilled revealed`).toEqual({});
    }
  });

  it('lets a beginner resolve most stones, so nobody is stonewalled at the start', () => {
    // bandWidth clamps mastery at a floor of 0.1, so a beginner's numeric
    // readings are ten times wider than an expert's and contribute almost
    // nothing. Measured: 77% still resolve at mastery 0, on hue, transparency
    // and fluorescence alone. If a data change pushed this down, new players
    // would measure everything and watch nothing happen.
    const beginnerBand = (property) => bandWidth({ property, mastery: 0, livePlay: HAND_LIVE_PLAY });
    const beginner = (species, hue) => [
      { kind: 'hue', value: hue },
      { kind: 'transparency', value: species.transparency },
      { kind: 'numeric', property: 'hardness',
        center: numericProperty(species, 'hardness'),
        band: beginnerBand('hardness') },
      { kind: 'numeric', property: 'specificGravity', center: numericProperty(species, 'specificGravity'), band: beginnerBand('specificGravity') },
      { kind: 'categorical', property: 'fluorescence', key: fluorescenceKey(species) }
    ];
    let total = 0;
    let resolved = 0;
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const entry of loc.findPool) {
        const hues = huesForSpecies(speciesById[entry.species]);
        const share = entry.weight / hues.length;
        for (const hue of hues) {
          total += share;
          if (consistentSpecies(pool, speciesById, beginner(speciesById[entry.species], hue)).length === 1) {
            resolved += share;
          }
        }
      }
    }
    const pct = (resolved / total) * 100;
    expect(pct, `beginner-resolvable ${pct.toFixed(1)}%`).toBeGreaterThan(60);
  });

  it('keeps sight useful but not sufficient', () => {
    // The slice rests on most stones needing instruments. Measured at design
    // time: 40% sight-resolvable. A colour or find-pool edit that pushed this
    // far up would quietly make the instruments pointless.
    let total = 0;
    let resolved = 0;
    for (const loc of localities) {
      const pool = [...new Set(loc.findPool.map((e) => e.species))];
      for (const entry of loc.findPool) {
        const hues = huesForSpecies(speciesById[entry.species]);
        const share = entry.weight / hues.length;
        for (const hue of hues) {
          total += share;
          const sightOnly = [
            { kind: 'hue', value: hue },
            { kind: 'transparency', value: speciesById[entry.species].transparency }
          ];
          if (consistentSpecies(pool, speciesById, sightOnly).length === 1) resolved += share;
        }
      }
    }
    const pct = (resolved / total) * 100;
    expect(pct, `sight-resolvable ${pct.toFixed(1)}%`).toBeGreaterThan(25);
    expect(pct, `sight-resolvable ${pct.toFixed(1)}%`).toBeLessThan(55);
  });
});
