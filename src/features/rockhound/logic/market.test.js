import { describe, it, expect } from 'vitest';
import { gradeFactor, stoneValue, identifiedValue, SHOP_GEAR, gearPrice, UNCUT_DISCOUNT } from './market.js';
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
    const specimen = { colorGrade: 80, clarity: 80 };
    const idVal = identifiedValue(specimen, speciesById.sapphire); // 700 * 1.3 * 0.5 = 455
    expect(idVal).toBe(455);
    expect(idVal).toBeLessThan(stoneValue({ score: 80 }, speciesById.sapphire)); // cutting adds value
  });
});

describe('shop', () => {
  it('prices the unlock gear', () => {
    expect(gearPrice('sieve')).toBe(120);
    expect(gearPrice('rock_hammer')).toBe(300);
    expect(gearPrice('nonsense')).toBeNull();
    expect(SHOP_GEAR.map((g) => g.id)).toEqual(['sieve', 'rock_hammer']);
  });
});
