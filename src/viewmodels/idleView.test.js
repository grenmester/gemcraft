import { describe, it, expect } from 'vitest';
import { catchView, sieveView } from './idleView.js';
import { localities, localitiesById } from '../data/localities/loader.js';
import { xpThreshold } from '../domain/dive.js';
import { IDLE_CAP_HOURS, MS_PER_HOUR, pendingCount } from '../domain/idle.js';
import { BENCH_CAP } from '../domain/bench.js';

const creek = localities.find((l) => l.id === 'hidden_creek');
const zeroXp = { panning: 0, hardrock: 0, geode: 0, surface: 0 };
const rough = (n) => Array.from({ length: n }, (_, i) => ({ instanceId: `r${i}` }));

describe('catchView', () => {
  it('counts how many of a locality\'s species the sieve could actually catch', () => {
    // Hidden Creek pools 4 species; 3 are reachable at depth 1 (topaz is
    // minDepth 2). Knowing one of them means the sieve can catch one.
    const v = catchView(creek, ['quartz'], 0);
    expect(v.catchable).toBe(1);
    expect(v.total).toBe(3);
    expect(v.canCatch).toBe(true);
  });

  it('reports plainly when the sieve would catch nothing', () => {
    // The trap this exists to prevent: a box parked where nothing is known
    // sits for hours and returns empty.
    const v = catchView(creek, [], 0);
    expect(v.catchable).toBe(0);
    expect(v.canCatch).toBe(false);
  });

  it('counts deeper species once the level reaches them', () => {
    // Topaz is minDepth 2, which idle reaches from method level 5.
    expect(catchView(creek, ['topaz'], 0).catchable).toBe(0);
    expect(catchView(creek, ['topaz'], xpThreshold(5)).catchable).toBe(1);
  });
});

describe('sieveView', () => {
  it('is nothing at all when no box is parked', () => {
    expect(sieveView(null, localitiesById, [], zeroXp, [], 0)).toBe(null);
  });

  it('is nothing when the parked locality no longer exists', () => {
    // A save can name a locality that has since been removed from the data.
    // Returning a view for it would crash the banner on locality.name.
    const stale = { localityId: 'sunken_reef', since: 0 };
    expect(sieveView(stale, localitiesById, ['quartz'], zeroXp, [], 8 * MS_PER_HOUR)).toBe(null);
  });

  it('names where the box is working and what it holds', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 3 * MS_PER_HOUR);
    expect(v.localityName).toBe('Hidden Creek');
    expect(v.pending).toBe(pendingCount(0, 0, 3 * MS_PER_HOUR));
    expect(v.canCollect).toBe(true);
  });

  it('says when the box has filled up and stopped', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 50 * MS_PER_HOUR);
    expect(v.hours).toBe(IDLE_CAP_HOURS);
    expect(v.atCap).toBe(true);
  });

  it('refuses collection on a full bench and says which problem it is', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, rough(BENCH_CAP), 8 * MS_PER_HOUR);
    expect(v.benchBlocked).toBe(true);
    expect(v.canCollect).toBe(false);
  });

  it('offers no collection when nothing has accrued yet', () => {
    const v = sieveView({ localityId: 'hidden_creek', since: 0 }, localitiesById,
      ['quartz'], zeroXp, [], 0);
    expect(v.pending).toBe(0);
    expect(v.canCollect).toBe(false);
  });
});
