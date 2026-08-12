import { describe, it, expect } from 'vitest';
import { methodTracks } from './footerView.js';
import { xpThreshold, reachDepth, MAX_METHOD_LEVEL } from './dive.js';
import { METHOD_ENUM } from '../../../data/localities/schema.js';
import { localities } from '../../../data/localities/loader.js';

/** The deepest bedrock any locality using this method actually offers. */
function deepestBedrockFor(method) {
  return Math.max(...localities.filter((l) => l.method === method).map((l) => l.maxDepth));
}

const zeroed = { panning: 0, hardrock: 0, geode: 0, surface: 0 };

describe('methodTracks', () => {
  it('reports every collection method, always, so an untouched track is visible', () => {
    // A track sitting at zero is exactly the thing a player needs to see:
    // it explains why a site offers no descent.
    expect(methodTracks(zeroed).map((t) => t.method)).toEqual(METHOD_ENUM);
  });

  it('derives level and reach from experience', () => {
    const t = methodTracks({ ...zeroed, geode: xpThreshold(6) }).find((x) => x.method === 'geode');
    expect(t.level).toBe(6);
    expect(t.reach).toBe(reachDepth(6));
  });

  it('names the next level that actually buys a depth, skipping the ones that buy nothing', () => {
    // Level 5 grants no reach over level 4; the next real depth is at 6.
    const t = methodTracks({ ...zeroed, panning: xpThreshold(4) }).find((x) => x.method === 'panning');
    expect(t.nextDepthAt).toBe(6);
  });

  it('promises no further depth at the cap', () => {
    const t = methodTracks({ ...zeroed, surface: xpThreshold(MAX_METHOD_LEVEL) }).find((x) => x.method === 'surface');
    expect(t.atCap).toBe(true);
    expect(t.nextDepthAt).toBe(null);
  });

  it('reports progress toward the next level as a 0-100 fraction', () => {
    const half = Math.round((xpThreshold(1) + xpThreshold(2)) / 2);
    const t = methodTracks({ ...zeroed, panning: half }).find((x) => x.method === 'panning');
    expect(t.pct).toBeGreaterThan(0);
    expect(t.pct).toBeLessThan(100);
  });

  it('treats a missing track as zero rather than crashing', () => {
    // Saves written before per-method experience existed carry no map.
    expect(methodTracks({})[0].level).toBe(0);
  });

  it('measures progress against the CURRENT level span, not from zero xp', () => {
    // Level 4 is reached at 400xp, level 5 at 600xp. At 500xp the player is
    // halfway through level 4's span (50%), not 500/600 of the way from
    // scratch (83%) — a from-zero calculation would also satisfy the
    // "between 0 and 100" test above, so this pins the exact arithmetic.
    const t = methodTracks({ ...zeroed, panning: xpThreshold(4) + 100 }).find((x) => x.method === 'panning');
    expect(t.level).toBe(4);
    expect(t.pct).toBe(50);
  });

  it('clamps a maxed-out panning track to the deepest panning bedrock, not the raw formula', () => {
    // Raw reachDepth(MAX_METHOD_LEVEL) is 6, but no panning site (hidden_creek,
    // gravel_bar) goes past 3 — the footer must not promise a depth panning
    // can never actually reach at any site.
    const expectedDepth = deepestBedrockFor('panning');
    const t = methodTracks({ ...zeroed, panning: xpThreshold(MAX_METHOD_LEVEL) })
      .find((x) => x.method === 'panning');
    expect(t.reach).toBe(expectedDepth);
    expect(t.reach).toBeLessThan(reachDepth(MAX_METHOD_LEVEL));
  });

  it('clamps a maxed-out hardrock track to the deepest hardrock bedrock (kimberlite_pipe)', () => {
    const expectedDepth = deepestBedrockFor('hardrock');
    const t = methodTracks({ ...zeroed, hardrock: xpThreshold(MAX_METHOD_LEVEL) })
      .find((x) => x.method === 'hardrock');
    expect(t.reach).toBe(expectedDepth);
  });
});
