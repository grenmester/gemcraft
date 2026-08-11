import { describe, it, expect } from 'vitest';
import { gradeFactor, stoneValue, identifiedValue, roughGradeFactor, SHOP_GEAR, gearPrice, UNCUT_DISCOUNT, uncutDiscountFor } from './market.js';
import { speciesById } from '../../../loaders/species.js';

describe('gradeFactor', () => {
  it('maps score 0..100 to 0.5..1.5', () => {
    expect(gradeFactor(0)).toBeCloseTo(0.5, 5);
    expect(gradeFactor(100)).toBeCloseTo(1.5, 5);
    expect(gradeFactor(undefined)).toBeCloseTo(0.5, 5);
  });
});

describe('stoneValue', () => {
  it('scales a species baseValue by grade', () => {
    // sapphire baseValue 700; score 50 → 0.5+0.5 = 1.0 → 700
    expect(stoneValue({ score: 50 }, speciesById.sapphire)).toBe(700);
    // higher score → more value
    expect(stoneValue({ score: 90 }, speciesById.sapphire)).toBeGreaterThan(stoneValue({ score: 50 }, speciesById.sapphire));
  });
});

describe('identifiedValue', () => {
  it('is a discounted fraction of a good cut stone (cut is worth more)', () => {
    // Value now follows what was MEASURED, so this specimen must carry a full
    // revealed record to read as graded at all — an unmeasured stone prices
    // at the floor. caratWeight 4 (of the 5-ct saturation) normalises to 80,
    // matching colorGrade/clarity, so the three-way average is still exactly
    // 80 and the multiplier is unchanged from before carat was folded in.
    const specimen = {
      caratWeight: 4, colorGrade: 80, clarity: 80,
      revealed: {
        weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 4 },
        colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 80, band: 5 },
        clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 80, band: 5 }
      }
    };
    const idVal = identifiedValue(specimen, speciesById.sapphire); // 700 * 1.3 * 0.5 = 455
    expect(idVal).toBe(455);
    expect(idVal).toBeLessThan(stoneValue({ score: 80 }, speciesById.sapphire)); // cutting adds value
  });
});

describe('mineral specimens', () => {
  // clarity/colorGrade 70/70 (not 80/80): with quartz's baseValue of 5, an
  // 80/80 grade lands the full-value multiplier exactly on a .5 rounding
  // boundary (6.5), which rounds opposite to the discounted-then-reversed
  // path (round(3.25)/0.5 -> 6) and makes this assertion fail for ANY
  // correct implementation, not just a broken one. 70/70 avoids the boundary.
  // A full revealed record is required too: value now follows what was
  // measured, and an ungraded specimen would price at the floor regardless
  // of these numbers, defeating the point of this fixture.
  const base = {
    trueSpeciesId: 'quartz', caratWeight: 2, clarity: 70, colorGrade: 70,
    revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 70, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 70, band: 5 }
    }
  };

  it('sells a crystal on matrix at full value, with no uncut penalty', () => {
    // A matrix specimen cannot be cut, so charging it the cutter's-risk
    // discount would price it as something it can never become.
    const onMatrix = identifiedValue({ ...base, form: 'matrix' }, speciesById.quartz);
    const loose = identifiedValue({ ...base, form: 'fragment' }, speciesById.quartz);
    expect(onMatrix).toBe(Math.round(loose / UNCUT_DISCOUNT));
  });

  it('still discounts every other habit', () => {
    for (const form of ['waterworn', 'crystal', 'fragment', 'nodule', 'druzy', undefined]) {
      expect(uncutDiscountFor({ ...base, form }), `${form}`).toBe(UNCUT_DISCOUNT);
    }
  });
});

describe('shop', () => {
  it('prices the unlock gear', () => {
    expect(gearPrice('sieve')).toBe(120);
    expect(gearPrice('rock_hammer')).toBe(300);
    expect(gearPrice('nonsense')).toBeNull();
    expect(SHOP_GEAR.map((g) => g.id)).toEqual(['sieve', 'rock_hammer', 'rocker_box']);
  });

  it('sells a rocker box to leave working at a locality', () => {
    const box = SHOP_GEAR.find((g) => g.id === 'rocker_box');
    expect(box).toBeDefined();
    expect(gearPrice('rocker_box')).toBe(box.price);
  });
});

describe('value follows what was measured', () => {
  const quartz = speciesById.quartz;
  const base = { trueSpeciesId: 'quartz', caratWeight: 5, colorGrade: 99, clarity: 99, form: 'fragment' };
  const fully = {
    weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 5 },
    colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 99, band: 5 },
    clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 99, band: 5 }
  };

  it('prices an ungraded stone at the floor', () => {
    // A buyer cannot verify what you have not measured, so they assume the
    // worst. This substitution IS the ungraded discount.
    expect(roughGradeFactor({ ...base, revealed: {} })).toBeCloseTo(0.5, 10);
  });

  it('prices a fully graded stone at what it is actually worth', () => {
    expect(roughGradeFactor({ ...base, revealed: fully })).toBeGreaterThan(1.4);
  });

  it('never rewards a fine stone the player has not graded', () => {
    // The whole point: an ungraded superb stone must be worth no more than an
    // ungraded terrible one.
    const superb = { ...base, revealed: {} };
    const awful = { trueSpeciesId: 'quartz', caratWeight: 0.1, colorGrade: 2, clarity: 2, form: 'fragment', revealed: {} };
    expect(roughGradeFactor(superb)).toBe(roughGradeFactor(awful));
  });

  it('lifts the price with each trait graded', () => {
    const one = { ...base, revealed: { weigh: fully.weigh } };
    const two = { ...base, revealed: { weigh: fully.weigh, colour: fully.colour } };
    expect(roughGradeFactor(two)).toBeGreaterThan(roughGradeFactor(one));
    expect(roughGradeFactor(one)).toBeGreaterThan(roughGradeFactor({ ...base, revealed: {} }));
  });

  it('weighs carat, which rough value used to ignore entirely', () => {
    const heavy = { ...base, caratWeight: 5, revealed: { weigh: fully.weigh } };
    const light = { ...base, caratWeight: 0.5, revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 0.5 }
    } };
    expect(roughGradeFactor(heavy)).toBeGreaterThan(roughGradeFactor(light));
  });

  it('keeps the factor inside its historic range', () => {
    // 0.5 to 1.5, so this changes what drives value without inflating it.
    expect(roughGradeFactor({ ...base, revealed: {} })).toBeGreaterThanOrEqual(0.5);
    expect(roughGradeFactor({ ...base, revealed: fully })).toBeLessThanOrEqual(1.5);
  });

  it('carries through to what a buyer pays', () => {
    const ungraded = identifiedValue({ ...base, revealed: {} }, quartz);
    const graded = identifiedValue({ ...base, revealed: fully }, quartz);
    expect(graded).toBeGreaterThan(ungraded);
  });
});
