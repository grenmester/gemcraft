import { describe, it, expect } from 'vitest';
import { measuredQuality, isGraded, gradedCount, isMeasured, WORST_CASE } from './grading.js';

const weighed = { testId: 'weigh', axis: 'quality', kind: 'quality-exact', property: 'caratWeight', value: 2.4 };
const colour = { testId: 'colour', axis: 'quality', kind: 'quality-band', property: 'colorGrade', center: 78, band: 5 };
const clarity = { testId: 'clarity', axis: 'quality', kind: 'quality-band', property: 'clarity', center: 64, band: 5 };
const stone = (revealed = {}) => ({ caratWeight: 2.4, colorGrade: 78, clarity: 64, revealed });

describe('measuredQuality', () => {
  it('counts an unmeasured trait as its worst case', () => {
    // The buyer cannot verify what you have not measured, so they assume the
    // worst. This substitution IS the ungraded discount.
    const q = measuredQuality(stone());
    expect(q.colorGrade).toBe(WORST_CASE);
    expect(q.clarity).toBe(WORST_CASE);
    expect(q.caratWeight).toBe(WORST_CASE);
  });

  it('uses the real value once measured', () => {
    const q = measuredQuality(stone({ weigh: weighed, colour, clarity }));
    expect(q.caratWeight).toBe(2.4);
    expect(q.colorGrade).toBe(78);
    expect(q.clarity).toBe(64);
  });

  it('takes the centre of an uncertain grade, not its edges', () => {
    // The player's best estimate is what a buyer trades on.
    expect(measuredQuality(stone({ colour })).colorGrade).toBe(78);
  });

  it('substitutes only the traits that are missing', () => {
    const q = measuredQuality(stone({ weigh: weighed }));
    expect(q.caratWeight).toBe(2.4);
    expect(q.colorGrade).toBe(WORST_CASE);
  });

  it('never reads the true value of an unmeasured trait', () => {
    // The whole point: a stone with a superb colour the player has not graded
    // must be worth no more than one with a terrible colour they have not graded.
    const superb = measuredQuality({ caratWeight: 5, colorGrade: 99, clarity: 99, revealed: {} });
    const awful = measuredQuality({ caratWeight: 0.1, colorGrade: 3, clarity: 3, revealed: {} });
    expect(superb).toEqual(awful);
  });
});

describe('isGraded', () => {
  it('is false until every quality trait is measured', () => {
    expect(isGraded(stone())).toBe(false);
    expect(isGraded(stone({ weigh: weighed }))).toBe(false);
    expect(isGraded(stone({ weigh: weighed, colour }))).toBe(false);
  });

  it('is true once all three are measured', () => {
    expect(isGraded(stone({ weigh: weighed, colour, clarity }))).toBe(true);
  });

  it('ignores diagnostic readings — grading is its own axis', () => {
    const withDiagnostics = stone({ scratch: { testId: 'scratch', axis: 'diagnostic', kind: 'numeric', center: 9, band: 0.5 } });
    expect(isGraded(withDiagnostics)).toBe(false);
  });
});

describe('gradedCount', () => {
  it('counts how many quality traits are measured', () => {
    expect(gradedCount(stone())).toBe(0);
    expect(gradedCount(stone({ weigh: weighed, colour }))).toBe(2);
  });
});

describe('isMeasured', () => {
  it('is false for a trait that has never been measured', () => {
    expect(isMeasured(stone(), 'colour')).toBe(false);
  });

  it('is true once that trait has a reading', () => {
    expect(isMeasured(stone({ colour }), 'colour')).toBe(true);
  });

  it('checks only the requested trait, not the whole specimen', () => {
    const s = stone({ colour });
    expect(isMeasured(s, 'clarity')).toBe(false);
    expect(isMeasured(s, 'weigh')).toBe(false);
  });

  it('treats a specimen with no revealed record at all as unmeasured', () => {
    expect(isMeasured({ caratWeight: 2.4, colorGrade: 78, clarity: 64 }, 'colour')).toBe(false);
  });
});
