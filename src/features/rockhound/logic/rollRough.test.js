import { describe, it, expect } from 'vitest';
import { numericProperty, fluorescenceKey } from './properties.js';
import { createRough, rollRough, effectivePool, rollHaul, bestOf, catchablePool } from './rollRough.js';
import { haulSize } from './dive.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById, localities } from '../../../loaders/localities.js';

describe('properties', () => {
  it('returns the midpoint for a hardness range', () => {
    expect(numericProperty(speciesById.almandine_garnet, 'hardness')).toBeCloseTo(7.25, 2);
  });
  it('returns a point hardness unchanged', () => {
    expect(numericProperty(speciesById.sapphire, 'hardness')).toBe(9);
  });
  it('reads specific gravity', () => {
    expect(numericProperty(speciesById.quartz, 'specificGravity')).toBeCloseTo(2.65, 2);
  });
  it('keys fluorescence, inert when null', () => {
    expect(fluorescenceKey(speciesById.quartz)).toBe('inert');
    expect(fluorescenceKey(speciesById.fluorite)).toBe('blue/violet');
  });
});

describe('rollRough', () => {
  // rng is called in order: [speciesPick, carat, clarity, color, form].
  // carat/clarity/color are each `bestOf(depth, rng)`, which consumes one
  // draw per level of depth, so at depth 1 the full sequence is exactly
  // five draws: speciesPick, carat, clarity, color, form. `stubRng` throws
  // if asked for a value it wasn't given, so an under-supplied array fails
  // loudly instead of silently returning `undefined`.
  const stubRng = (values) => {
    let i = 0;
    return () => {
      if (i >= values.length) {
        throw new Error(`stubRng exhausted: requested draw ${i + 1} but only ${values.length} value(s) were supplied`);
      }
      return values[i++];
    };
  };

  it('picks the first find-pool species when the pick roll is 0', () => {
    const loc = localitiesById.hidden_creek; // first entry: quartz
    // hidden_creek uses method 'panning' -> form pool [waterworn 70, fragment 20, crystal 10].
    // A form roll of 0 genuinely lands on the first entry (waterworn) via the
    // weighted loop; the old fallback-on-exhaustion bug always produced the
    // *last* entry (crystal), so this assertion would catch a regression.
    const spec = rollRough(loc, 1, stubRng([0, 0, 0, 0, 0]), () => 'id-1');
    expect(spec.trueSpeciesId).toBe('quartz');
    expect(spec.origin).toBe('hidden_creek');
    expect(spec.stage).toBe('rough');
    expect(spec.identifiedAs).toBe(null);
    expect(spec.instanceId).toBe('id-1');
    expect(spec.form).toBe('waterworn');
  });

  it('rolls stats within the find-pool ranges', () => {
    const loc = localitiesById.hidden_creek;
    // Form roll of 0.8 walks past waterworn (70) and lands in fragment (20),
    // a MIDDLE entry. That matters: crystal is the last entry, so expecting
    // crystal here would agree with the last-entry value a running-dry stub
    // coincidentally produces, and the assertion could not tell a working
    // weighted loop from a broken one.
    const spec = rollRough(loc, 1, stubRng([0, 1, 1, 1, 0.8]), () => 'id-2');
    // quartz entry: caratRange [0.5,4.0], clarityRange [40,90], colorRange [30,70]
    expect(spec.caratWeight).toBeGreaterThanOrEqual(0.5);
    expect(spec.caratWeight).toBeLessThanOrEqual(4.0);
    expect(spec.clarity).toBe(90);
    expect(spec.colorGrade).toBe(70);
    expect(spec.form).toBe('fragment');
  });

  it('createRough fills defaults', () => {
    const s = createRough({ trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'x' }, () => 'z');
    expect(s).toMatchObject({ stage: 'rough', identifiedAs: null, trueSpeciesId: 'quartz', instanceId: 'z' });
  });
});

describe('depth-aware extraction', () => {
  const creek = localities.find((l) => l.id === 'hidden_creek');

  it('hides deep-only finds from shallow digging', () => {
    // Hidden Creek's topaz is minDepth 2.
    const shallow = effectivePool(creek.findPool, 1).map((e) => e.species);
    expect(shallow).not.toContain('topaz');
    expect(effectivePool(creek.findPool, 2).map((e) => e.species)).toContain('topaz');
  });

  it('thins commons and concentrates prizes as depth grows', () => {
    const shareOf = (species, depth) => {
      const pool = effectivePool(creek.findPool, depth);
      const total = pool.reduce((s, e) => s + e.effectiveWeight, 0);
      return pool.find((e) => e.species === species).effectiveWeight / total;
    };
    expect(shareOf('quartz', 3)).toBeLessThan(shareOf('quartz', 1));
    expect(shareOf('sapphire', 3)).toBeGreaterThan(shareOf('sapphire', 1));
  });

  it('records the depth a stone came from', () => {
    const s = rollRough(creek, 2, () => 0.5);
    expect(s.foundDepth).toBe(2);
  });

  it('gives every stone a crystal form', () => {
    const s = rollRough(creek, 1, () => 0.5);
    expect(typeof s.form).toBe('string');
    expect(s.form.length).toBeGreaterThan(0);
  });

  it('takes the best of `depth` draws, so deeper ground gives better material', () => {
    // Tested directly rather than through rollRough: a whole roll consumes a
    // depth-dependent number of random values, so comparing two rollRough
    // calls on one scripted stream compares different points in the stream
    // and proves nothing.
    const from = (xs) => { let i = 0; return () => xs[i++]; };
    expect(bestOf(1, from([0.2, 0.9, 0.9]))).toBeCloseTo(0.2, 10);
    expect(bestOf(3, from([0.2, 0.9, 0.4]))).toBeCloseTo(0.9, 10);
  });

  it('consumes exactly one draw per level of depth for each stat', () => {
    // Guards the property the test above relies on: if bestOf stopped
    // scaling with depth, this count would not change.
    const count = (depth) => { let n = 0; bestOf(depth, () => { n++; return 0.5; }); return n; };
    expect(count(1)).toBe(1);
    expect(count(4)).toBe(4);
  });

  it('returns a full haul sized by depth and level', () => {
    expect(rollHaul(creek, 1, 0, () => 0.5)).toHaveLength(haulSize(1, 0));
    expect(rollHaul(creek, 3, 6, () => 0.5)).toHaveLength(haulSize(3, 6));
  });

  it('stamps every stone in a haul with the same depth', () => {
    const haul = rollHaul(creek, 2, 3, () => 0.5);
    expect(haul.every((s) => s.foundDepth === 2)).toBe(true);
  });

  it('gives each stone in a haul its own id', () => {
    const haul = rollHaul(creek, 3, 6, Math.random);
    expect(new Set(haul.map((s) => s.instanceId)).size).toBe(haul.length);
  });
});

describe('species filtering', () => {
  const creek = localities.find((l) => l.id === 'hidden_creek');

  it('keeps only the allowed species in the pool', () => {
    const pool = catchablePool(creek.findPool, 1, new Set(['quartz']));
    expect(pool.map((e) => e.species)).toEqual(['quartz']);
  });

  it('is the whole depth pool when no filter is given', () => {
    const filtered = catchablePool(creek.findPool, 1, null);
    const plain = effectivePool(creek.findPool, 1);
    expect(filtered.map((e) => e.species)).toEqual(plain.map((e) => e.species));
  });

  it('still honours minDepth inside the filter', () => {
    // Hidden Creek's topaz is minDepth 2, so allowing it changes nothing at depth 1.
    expect(catchablePool(creek.findPool, 1, new Set(['topaz']))).toHaveLength(0);
    expect(catchablePool(creek.findPool, 2, new Set(['topaz']))).toHaveLength(1);
  });

  it('rolls only species the filter allows, whatever the random stream does', () => {
    for (let i = 0; i < 50; i++) {
      const s = rollRough(creek, 1, () => i / 50, undefined, new Set(['sapphire']));
      expect(s.trueSpeciesId).toBe('sapphire');
    }
  });

  it('returns nothing when the filter leaves the pool empty', () => {
    // A sieve parked where the player has catalogued nothing catches nothing.
    expect(rollRough(creek, 1, () => 0.5, undefined, new Set())).toBe(null);
  });

  it('is unchanged for callers that pass no filter', () => {
    const a = rollRough(creek, 1, () => 0.5, () => 'id-1');
    const b = rollRough(creek, 1, () => 0.5, () => 'id-1', null);
    expect(a).toEqual(b);
  });
});
