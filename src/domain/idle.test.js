import { describe, it, expect } from 'vitest';
import {
  idleDepth, idleRate, accruedHours, pendingCount,
  IDLE_CAP_HOURS, IDLE_RISK_TOLERANCE, MS_PER_HOUR
} from './idle.js';
import { breakChance, MAX_METHOD_LEVEL } from './dive.js';

const DEEP = 9; // a locality deeper than idle could ever reach

describe('idleDepth', () => {
  it('works the surface until the second stage becomes risk-free', () => {
    expect(idleDepth(0, DEEP)).toBe(1);
    expect(idleDepth(4, DEEP)).toBe(1);
    expect(idleDepth(5, DEEP)).toBe(2);
    expect(idleDepth(MAX_METHOD_LEVEL, DEEP)).toBe(2);
  });

  it('never reaches the depth where losses become real, at any level', () => {
    // This is the guarantee that keeps deep-only species active-only.
    for (let l = 0; l <= MAX_METHOD_LEVEL; l++) {
      expect(idleDepth(l, DEEP), `level ${l}`).toBeLessThan(3);
    }
  });

  it('never quotes a depth the locality does not have', () => {
    expect(idleDepth(MAX_METHOD_LEVEL, 1)).toBe(1);
  });

  it('only ever picks a stage whose risk is within tolerance', () => {
    for (let l = 0; l <= MAX_METHOD_LEVEL; l++) {
      expect(breakChance(idleDepth(l, DEEP), l), `level ${l}`).toBeLessThanOrEqual(IDLE_RISK_TOLERANCE);
    }
  });

  it('goes deeper once damping gear reduces the risk', () => {
    // damping is threaded but always 0 today; this proves the sieve will
    // follow the risk-free line down when slice 1b lands. Asserted against
    // the undamped baseline as well as an exact value, so it cannot pass by
    // coincidence if the baseline itself changes.
    expect(idleDepth(0, DEEP, 0)).toBe(1);
    expect(idleDepth(0, DEEP, 0.15)).toBe(2);
    expect(idleDepth(0, DEEP, 0.25)).toBe(3);
    expect(idleDepth(0, DEEP, 0.25)).toBeGreaterThan(idleDepth(0, DEEP, 0));
  });

  it('still refuses any stage whose risk exceeds tolerance, damped or not', () => {
    // The guarantee is about RISK, not about a fixed depth: whatever damping
    // does, the chosen stage must always sit inside the tolerance.
    for (const damping of [0, 0.05, 0.15, 0.25]) {
      const d = idleDepth(0, DEEP, damping);
      expect(breakChance(d, 0, damping), `damping ${damping}`).toBeLessThanOrEqual(IDLE_RISK_TOLERANCE);
    }
  });
});

describe('idleRate', () => {
  it('rises with the method level', () => {
    expect(idleRate(0)).toBeCloseTo(1, 10);
    expect(idleRate(10)).toBeCloseTo(2.5, 10);
    expect(idleRate(10)).toBeGreaterThan(idleRate(0));
  });
});

describe('accruedHours', () => {
  it('measures elapsed hours', () => {
    expect(accruedHours(0, 3 * MS_PER_HOUR)).toBeCloseTo(3, 10);
  });

  it('stops accruing at the cap', () => {
    expect(accruedHours(0, 50 * MS_PER_HOUR)).toBe(IDLE_CAP_HOURS);
  });

  it('never goes negative if the clock moves backwards', () => {
    // A device clock change must not produce negative yield.
    expect(accruedHours(5 * MS_PER_HOUR, 0)).toBe(0);
  });
});

describe('pendingCount', () => {
  it('yields a handful over a full session, more at higher level', () => {
    const full = 50 * MS_PER_HOUR; // past the cap
    expect(pendingCount(0, 0, full)).toBe(8);
    expect(pendingCount(5, 0, full)).toBe(14);
    expect(pendingCount(10, 0, full)).toBe(20);
  });

  it('yields nothing before a whole stone has accrued', () => {
    expect(pendingCount(0, 0, MS_PER_HOUR / 2)).toBe(0);
  });

  it('never yields a fraction of a stone', () => {
    expect(Number.isInteger(pendingCount(7, 0, 3.7 * MS_PER_HOUR))).toBe(true);
  });
});
