import { describe, it, expect } from 'vitest';
import { gradeFactor, stoneValue, identifiedValue, roughGradeFactor, SHOP_GEAR, gearPrice, UNCUT_DISCOUNT, uncutDiscountFor } from './market.js';
import { appraisedQuality } from './grading.js';
import { speciesById } from '../../../data/species/loader.js';

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
    // at the floor. caratWeight 4 (of the 5-ct saturation) normalises to 80.
    // Price now follows the APPRAISED edge, not the centre: a band of 5 on
    // colour/clarity prices them at 75, not 80, so the three-way average is
    // (80 + 75 + 75) / 3 = 76.667, not a flat 80.
    const specimen = {
      caratWeight: 4, colorGrade: 80, clarity: 80,
      revealed: {
        weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 4 },
        colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 80, band: 5 },
        clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 80, band: 5 }
      }
    };
    const idVal = identifiedValue(specimen, speciesById.sapphire); // 700 * 1.26667 * 0.5 = 443
    expect(idVal).toBe(443);
    expect(idVal).toBeLessThan(stoneValue({ score: 80 }, speciesById.sapphire)); // cutting adds value
  });
});

describe('mineral specimens', () => {
  // Price now follows the APPRAISED edge (center - band), not the centre, so
  // a colorGrade/clarity centre of 90 with a band of 5 appraises at 85, not
  // 90. carat 2 (of 5) normalises to 40, giving (40 + 85 + 85) / 3 = 70 and a
  // factor of exactly 1.2 — chosen, like the 70/70 fixture this replaces, so
  // that quartz's baseValue of 5 times the factor lands on a clean integer
  // (6, halving to 3) rather than a .5 rounding boundary that would round
  // opposite ways through the discounted-then-reversed path and fail this
  // assertion for ANY correct implementation, not just a broken one.
  // A full revealed record is required too: value now follows what was
  // measured, and an ungraded specimen would price at the floor regardless
  // of these numbers, defeating the point of this fixture.
  const base = {
    trueSpeciesId: 'quartz', caratWeight: 2, clarity: 90, colorGrade: 90,
    revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 90, band: 5 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 90, band: 5 }
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

describe('mastery moves money: the factor prices the pessimistic edge', () => {
  // A colour-91 stone read at progressively narrower bands as mastery rises.
  // Carat and clarity are held fixed throughout so only the colour band
  // drives the difference between factors.
  const bandedColour = (band) => ({
    caratWeight: 2, colorGrade: 91, clarity: 50,
    revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2 },
      clarity: { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 50, band: 5 },
      ...(band == null ? {} : {
        colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band }
      })
    }
  });

  it('rises monotonically as the band narrows — a novice and an expert must not price the same', () => {
    // Before this change, center was priced regardless of band, so a novice's
    // 91±50 and an expert's 91±5 grade produced the identical price. That
    // bug is exactly what this test would let slip back in.
    const unmeasured = roughGradeFactor(bandedColour(null));
    const novice = roughGradeFactor(bandedColour(50));
    const improving = roughGradeFactor(bandedColour(20));
    const expert = roughGradeFactor(bandedColour(5));
    expect(unmeasured).toBeLessThan(novice);
    expect(novice).toBeLessThan(improving);
    expect(improving).toBeLessThan(expert);
  });

  it('leaves carat untouched by mastery, even while colour is heavily discounted', () => {
    const wideband = { caratWeight: 4, colorGrade: 91, clarity: 50, revealed: {
      weigh: { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 4 },
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band: 80 }
    } };
    const tightband = { ...wideband, revealed: { ...wideband.revealed,
      colour: { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 91, band: 1 }
    } };
    // Colour's band swings the price a lot; carat — the exact reading, with
    // no band to narrow — must appraise identically either way.
    expect(appraisedQuality(wideband).caratWeight).toBe(appraisedQuality(tightband).caratWeight);
    expect(roughGradeFactor(wideband)).toBeLessThan(roughGradeFactor(tightband));
  });
});
