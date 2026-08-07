import { describe, it, expect } from 'vitest';
import {
  reachDepth, effectiveReach, haulSize, breakChance, severityAt,
  degradeSpecimen, breakConsequence, xpForStage, xpForRun,
  xpThreshold, levelForXp, MAX_METHOD_LEVEL, MAX_BREAK_CHANCE
} from './dive.js';

const stone = (foundDepth, over = {}) => ({
  instanceId: `s${foundDepth}${over.tag ?? ''}`, foundDepth,
  clarity: 60, caratWeight: 2.0, ...over
});

describe('reach', () => {
  it('starts every player at depth 1 and adds a depth every two levels', () => {
    expect(reachDepth(0)).toBe(1);
    expect(reachDepth(1)).toBe(1);
    expect(reachDepth(2)).toBe(2);
    expect(reachDepth(4)).toBe(3);
    expect(reachDepth(10)).toBe(6);
  });

  it('never lets a player dig past the locality bedrock', () => {
    expect(effectiveReach(10, 3, false)).toBe(3);
  });

  it('grants one extra depth once the locality set is complete', () => {
    expect(effectiveReach(2, 4, true)).toBe(3);
    expect(effectiveReach(2, 4, false)).toBe(2);
  });

  it('does not let the set bonus breach bedrock either', () => {
    expect(effectiveReach(10, 3, true)).toBe(3);
  });
});

describe('haul size', () => {
  it('yields exactly one stone at depth 1 for a new player', () => {
    // This is the pre-Dive behaviour, preserved byte for byte.
    expect(haulSize(1, 0)).toBe(1);
  });

  it('grows with depth and with level', () => {
    expect(haulSize(3, 0)).toBe(3);
    expect(haulSize(1, 6)).toBe(3);
    expect(haulSize(3, 6)).toBe(5);
  });
});

describe('break chance', () => {
  it('is always zero at depth 1, so a new player can never lose anything', () => {
    expect(breakChance(1, 0)).toBe(0);
    expect(breakChance(1, 10)).toBe(0);
  });

  it('rises with target depth', () => {
    expect(breakChance(2, 0)).toBeCloseTo(0.15, 10);
    expect(breakChance(3, 0)).toBeCloseTo(0.30, 10);
  });

  it('is reduced by level and by damping', () => {
    expect(breakChance(3, 10)).toBeCloseTo(0.20, 10);
    expect(breakChance(3, 0, 0.05)).toBeCloseTo(0.25, 10);
  });

  it('never falls below zero or exceeds the cap', () => {
    expect(breakChance(2, 10, 0.9)).toBe(0);
    expect(breakChance(9, 0)).toBe(MAX_BREAK_CHANCE);
  });
});

describe('severity', () => {
  it('escalates from harmless to cozy to real', () => {
    expect(severityAt(1)).toBe('none');
    expect(severityAt(2)).toBe('cozy');
    expect(severityAt(3)).toBe('real');
    expect(severityAt(5)).toBe('real');
  });
});

describe('break consequences', () => {
  it('at cozy depth degrades everything and loses nothing', () => {
    const haul = [stone(1), stone(2)];
    const { kept, lost } = breakConsequence(haul, 2);
    expect(lost).toEqual([]);
    expect(kept).toHaveLength(2);
    expect(kept[0].clarity).toBeLessThan(60);
    expect(kept[0].caratWeight).toBeLessThan(2.0);
  });

  it('at real depth loses the deepest stage and degrades the rest', () => {
    const haul = [stone(1), stone(2, { tag: 'a' }), stone(2, { tag: 'b' })];
    const { kept, lost } = breakConsequence(haul, 3);
    expect(lost.map((s) => s.foundDepth)).toEqual([2, 2]);
    expect(kept.map((s) => s.foundDepth)).toEqual([1]);
    expect(kept[0].clarity).toBeLessThan(60);
  });

  it('handles an empty haul without producing a nonsense depth', () => {
    expect(breakConsequence([], 3)).toEqual({ kept: [], lost: [] });
  });

  it('never degrades clarity below 1', () => {
    expect(degradeSpecimen({ clarity: 3, caratWeight: 0.1 }).clarity).toBeGreaterThanOrEqual(1);
  });
});

describe('experience', () => {
  it('pays more for deeper stages', () => {
    expect(xpForStage(1)).toBe(10);
    expect(xpForStage(3)).toBe(30);
  });

  it('sums the stages of a completed run', () => {
    expect(xpForRun([1, 2, 3], false)).toBe(60);
  });

  it('still teaches you something when the shaft breaks', () => {
    expect(xpForRun([1, 2, 3], true)).toBe(30);
  });

  it('maps experience onto levels and stops at the cap', () => {
    expect(levelForXp(0)).toBe(0);
    expect(levelForXp(39)).toBe(0);
    expect(levelForXp(40)).toBe(1);
    expect(levelForXp(120)).toBe(2);
    expect(levelForXp(999999)).toBe(MAX_METHOD_LEVEL);
  });

  it('has a threshold for every level that levelForXp agrees with', () => {
    for (let l = 1; l <= MAX_METHOD_LEVEL; l++) {
      expect(levelForXp(xpThreshold(l)), `level ${l}`).toBe(l);
      expect(levelForXp(xpThreshold(l) - 1), `just below level ${l}`).toBe(l - 1);
    }
  });
});
