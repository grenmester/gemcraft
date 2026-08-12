import { describe, it, expect } from 'vitest';
import { methodProgress, siteView, descentView } from './diveView.js';
import { xpThreshold, levelForXp, breakChance, reachDepth, MAX_METHOD_LEVEL } from './dive.js';
import { localities } from '../../../data/localities/loader.js';

const creek = localities.find((l) => l.id === 'hidden_creek');       // maxDepth 3, panning
const pipe = localities.find((l) => l.id === 'kimberlite_pipe');     // maxDepth 5, hardrock

describe('methodProgress', () => {
  it('reports the level the experience actually buys', () => {
    const p = methodProgress(150);
    expect(p.level).toBe(levelForXp(150));
    expect(p.xp).toBe(150);
  });

  it('reports how much more is needed for the next level', () => {
    const p = methodProgress(100);
    expect(p.nextAt).toBe(xpThreshold(levelForXp(100) + 1));
    expect(p.toNext).toBe(p.nextAt - 100);
  });

  it('flags the cap instead of promising a level that cannot come', () => {
    const p = methodProgress(xpThreshold(MAX_METHOD_LEVEL));
    expect(p.level).toBe(MAX_METHOD_LEVEL);
    expect(p.atCap).toBe(true);
    expect(p.toNext).toBe(0);
  });
});

describe('siteView', () => {
  it('names the method this ground is worked by', () => {
    expect(siteView(creek, 0, false).method).toBe('panning');
    expect(siteView(pipe, 0, false).method).toBe('hardrock');
  });

  it('caps reach at the locality bedrock however skilled the player', () => {
    const v = siteView(creek, xpThreshold(MAX_METHOD_LEVEL), false);
    expect(v.bedrock).toBe(3);
    expect(v.reach).toBe(3);
  });

  it('hides the descent affordance entirely from a beginner', () => {
    // The ramp: at level 0-1 Explore is one button and nothing else.
    expect(siteView(creek, 0, false).showDescent).toBe(false);
    expect(siteView(creek, xpThreshold(2), false).showDescent).toBe(true);
  });

  it('grants the set-completion bonus without breaching bedrock', () => {
    const xp = xpThreshold(2); // reach 2
    expect(siteView(pipe, xp, true).reach).toBe(reachDepth(2) + 1);
    expect(siteView(creek, xpThreshold(4), true).reach).toBe(3); // bedrock 3
  });
});

describe('descentView', () => {
  it('offers the next stage down and quotes the risk from the rules module', () => {
    const xp = xpThreshold(4); // reach 3
    const v = descentView(creek, 1, xp, false);
    expect(v.targetDepth).toBe(2);
    expect(v.available).toBe(true);
    expect(v.chance).toBeCloseTo(breakChance(2, levelForXp(xp)), 10);
    expect(v.chanceText).toMatch(/%$/);
  });

  it('escalates the stated severity with depth', () => {
    const xp = xpThreshold(4);
    expect(descentView(creek, 1, xp, false).severity).toBe('cozy');
    expect(descentView(creek, 2, xp, false).severity).toBe('real');
  });

  it('refuses the descent at bedrock and says why', () => {
    const v = descentView(creek, 3, xpThreshold(MAX_METHOD_LEVEL), false);
    expect(v.available).toBe(false);
    expect(v.limitReason).toBe('bedrock');
  });

  it('refuses the descent past the player reach and says why', () => {
    // Level 2 reaches depth 2; the pipe's bedrock is 5, so the wall is skill.
    const v = descentView(pipe, 2, xpThreshold(2), false);
    expect(v.available).toBe(false);
    expect(v.limitReason).toBe('reach');
  });
});
