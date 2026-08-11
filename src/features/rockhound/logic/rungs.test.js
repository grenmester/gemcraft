import { describe, it, expect } from 'vitest';
import { RUNGS, stoneRung, rungLabel } from './rungs.js';

const graded = {
  weigh: { testId: 'weigh', kind: 'quality-exact', property: 'caratWeight', value: 2 },
  colour: { testId: 'colour', kind: 'quality-band', property: 'colorGrade', center: 70, band: 5 },
  clarity: { testId: 'clarity', kind: 'quality-band', property: 'clarity', center: 70, band: 5 }
};

describe('stoneRung', () => {
  it('starts unidentified', () => {
    expect(stoneRung({ revealed: {} }, false)).toBe('unidentified');
  });

  it('reaches identified without any grading', () => {
    // Knowing what a stone IS and knowing what it is WORTH are separate axes.
    // A fully identified, completely ungraded stone is a normal state.
    expect(stoneRung({ revealed: {} }, true)).toBe('identified');
  });

  it('reaches graded only once identified as well', () => {
    // Grading an unidentified stone does not promote it — you cannot price
    // what you cannot name.
    expect(stoneRung({ revealed: graded }, false)).toBe('unidentified');
    expect(stoneRung({ revealed: graded }, true)).toBe('graded');
  });

  it('does not promote on partial grading', () => {
    const partial = { revealed: { weigh: graded.weigh, colour: graded.colour } };
    expect(stoneRung(partial, true)).toBe('identified');
  });
});

describe('RUNGS', () => {
  it('is ordered from least to most known', () => {
    expect(RUNGS).toEqual(['unidentified', 'identified', 'graded']);
  });

  it('gives every rung a player-facing label', () => {
    for (const r of RUNGS) expect(rungLabel(r).length).toBeGreaterThan(0);
  });
});
