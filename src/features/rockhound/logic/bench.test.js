import { describe, it, expect } from 'vitest';
import { BENCH_CAP, benchFull } from './bench.js';

const rough = (n) => Array.from({ length: n }, (_, i) => ({ instanceId: `r${i}` }));

describe('bench cap', () => {
  it('caps the unidentified pile at fifty stones', () => {
    expect(BENCH_CAP).toBe(50);
  });

  it('is not full one stone below the cap, and is full at it', () => {
    expect(benchFull(rough(BENCH_CAP - 1))).toBe(false);
    expect(benchFull(rough(BENCH_CAP))).toBe(true);
  });

  it('stays full past the cap, since banking a haul may overshoot', () => {
    // Banking always succeeds even if it pushes the player over — the block
    // is on acquiring more, never on keeping work already done.
    expect(benchFull(rough(BENCH_CAP + 7))).toBe(true);
  });
});
