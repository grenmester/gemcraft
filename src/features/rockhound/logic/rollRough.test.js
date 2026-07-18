import { describe, it, expect } from 'vitest';
import { numericProperty, fluorescenceKey } from './properties.js';
import { createRough, rollRough } from './rollRough.js';
import { speciesById } from '../../../loaders/species.js';
import { localitiesById } from '../../../loaders/localities.js';

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
  // rng is called in order: [speciesPick, carat, clarity, color]
  const stubRng = (values) => {
    let i = 0;
    return () => values[i++];
  };

  it('picks the first find-pool species when the pick roll is 0', () => {
    const loc = localitiesById.hidden_creek; // first entry: quartz
    const spec = rollRough(loc, stubRng([0, 0, 0, 0]), () => 'id-1');
    expect(spec.trueSpeciesId).toBe('quartz');
    expect(spec.origin).toBe('hidden_creek');
    expect(spec.stage).toBe('rough');
    expect(spec.identifiedAs).toBe(null);
    expect(spec.instanceId).toBe('id-1');
  });

  it('rolls stats within the find-pool ranges', () => {
    const loc = localitiesById.hidden_creek;
    const spec = rollRough(loc, stubRng([0, 1, 1, 1]), () => 'id-2');
    // quartz entry: caratRange [0.5,4.0], clarityRange [40,90], colorRange [30,70]
    expect(spec.caratWeight).toBeGreaterThanOrEqual(0.5);
    expect(spec.caratWeight).toBeLessThanOrEqual(4.0);
    expect(spec.clarity).toBe(90);
    expect(spec.colorGrade).toBe(70);
  });

  it('createRough fills defaults', () => {
    const s = createRough({ trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'x' }, () => 'z');
    expect(s).toMatchObject({ stage: 'rough', identifiedAs: null, trueSpeciesId: 'quartz', instanceId: 'z' });
  });
});
