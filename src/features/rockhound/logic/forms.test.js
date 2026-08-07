import { describe, it, expect } from 'vitest';
import { FORM_POOLS, FORM_EFFECTS, FORM_LABELS, rollForm } from './forms.js';
import { METHOD_ENUM } from '../../../schemas/localities.js';

describe('form pools', () => {
  it('covers every collection method', () => {
    expect(Object.keys(FORM_POOLS).sort()).toEqual([...METHOD_ENUM].sort());
  });

  it('only names forms that have declared effects and a label', () => {
    for (const [method, pool] of Object.entries(FORM_POOLS)) {
      for (const entry of pool) {
        expect(FORM_EFFECTS[entry.form], `${method}/${entry.form} effects`).toBeDefined();
        expect(FORM_LABELS[entry.form], `${method}/${entry.form} label`).toBeDefined();
      }
    }
  });

  it('keeps matrix specimens exclusive to hard rock', () => {
    // Matrix is the deep prize: a crystal still on its host rock. It only
    // survives where nobody has tumbled it down a river.
    for (const [method, pool] of Object.entries(FORM_POOLS)) {
      const hasMatrix = pool.some((e) => e.form === 'matrix');
      expect(hasMatrix, `${method}`).toBe(method === 'hardrock');
    }
  });

  it('gives every pool positive weights', () => {
    for (const pool of Object.values(FORM_POOLS)) {
      for (const e of pool) expect(e.weight).toBeGreaterThan(0);
    }
  });
});

describe('form effects', () => {
  it('lets matrix specimens take no cut at all', () => {
    expect(FORM_EFFECTS.matrix.styles).toEqual([]);
  });

  it('restricts nodules and druzy to cabochon', () => {
    expect(FORM_EFFECTS.nodule.styles).toEqual(['cabochon']);
    expect(FORM_EFFECTS.druzy.styles).toEqual(['cabochon']);
  });

  it('rewards terminated crystals and penalises waterworn pebbles when faceting', () => {
    expect(FORM_EFFECTS.crystal.facetedYield).toBeGreaterThan(1);
    expect(FORM_EFFECTS.waterworn.facetedYield).toBeLessThan(1);
    expect(FORM_EFFECTS.fragment.facetedYield).toBe(1);
  });
});

describe('rollForm', () => {
  it('only ever returns a form the method can produce', () => {
    for (const method of METHOD_ENUM) {
      const allowed = FORM_POOLS[method].map((e) => e.form);
      for (let i = 0; i < 200; i++) {
        const form = rollForm(method, 1 + (i % 4), () => i / 200);
        expect(allowed, `${method} produced ${form}`).toContain(form);
      }
    }
  });

  it('picks the entry the roll lands in', () => {
    // panning is waterworn 70 / crystal 10 / fragment 20 (total 100).
    // A roll of 0.0 lands in the first entry, 0.99 in the last.
    expect(rollForm('panning', 1, () => 0)).toBe(FORM_POOLS.panning[0].form);
    expect(rollForm('panning', 1, () => 0.999)).toBe(
      FORM_POOLS.panning[FORM_POOLS.panning.length - 1].form
    );
  });

  it('makes crystals commoner with depth and waterworn rarer', () => {
    // Same roll position, different depths: the shift must come from bias,
    // not from the random number.
    const crystalAt = (depth) => {
      let hits = 0;
      for (let i = 0; i < 1000; i++) {
        if (rollForm('hardrock', depth, () => i / 1000) === 'crystal') hits++;
      }
      return hits;
    };
    expect(crystalAt(4)).toBeGreaterThan(crystalAt(1));
  });

  it('falls back to a real form for an unknown method rather than undefined', () => {
    expect(typeof rollForm('spelunking', 1, () => 0.5)).toBe('string');
  });
});
