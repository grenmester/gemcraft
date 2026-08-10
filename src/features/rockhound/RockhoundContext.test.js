// src/features/rockhound/RockhoundContext.test.js
import { describe, it, expect } from 'vitest';
import {
  rockhoundReducer, initialRockhoundState,
  ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, REVEAL_TRAIT, CLEAR_NEW,
  UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT,
  SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL,
  DEBUG_SET_METHOD_LEVEL, DEBUG_ADD_CASH, DEBUG_RESET,
  PARK_SIEVE, COLLECT_SIEVE, DEBUG_REWIND_SIEVE
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';
import { species, speciesById } from '../../loaders/species.js';
import { localitiesById } from '../../loaders/localities.js';
import { METHOD_ENUM } from '../../schemas/localities.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { stoneValue, identifiedValue, gearPrice } from './logic/market.js';
import { levelForXp, MAX_METHOD_LEVEL } from './logic/dive.js';
import { BENCH_CAP } from './logic/bench.js';

const sapphireRough = createRough(
  { trueSpeciesId: 'sapphire', caratWeight: 1, clarity: 80, colorGrade: 80, origin: 'hidden_creek' },
  () => 'r1'
);

describe('rockhoundReducer', () => {
  it('adds rough to the bench', () => {
    const s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    expect(s.rough).toHaveLength(1);
    expect(s.rough[0].instanceId).toBe('r1');
  });

  it('does not double-count a species already in the gemdex', () => {
    const second = { ...sapphireRough, instanceId: 'r2' };
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: ADD_ROUGH, payload: second });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r2', guessId: 'sapphire' } });
    expect(s.gemdex).toEqual(['sapphire']);
    expect(s.reputation).toBe(70); // reputation still awarded per correct ID
  });

  it('clears newly-discovered flags', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    s = rockhoundReducer(s, { type: CLEAR_NEW });
    expect(s.newlyDiscovered).toEqual([]);
  });

  it('starts with no gear', () => {
    expect(initialRockhoundState.gear).toEqual([]);
  });

  it('grants rock_hammer once the hidden_creek set is complete', () => {
    // discover every hidden_creek species via correct commits
    const creekSpecies = localitiesById.hidden_creek.findPool.map((e) => e.species);
    let s = initialRockhoundState;
    creekSpecies.forEach((speciesId, i) => {
      const rough = { instanceId: `r${i}`, stage: 'rough', trueSpeciesId: speciesId, identifiedAs: null, caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek' };
      s = rockhoundReducer(s, { type: ADD_ROUGH, payload: rough });
      s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: `r${i}`, guessId: speciesId } });
    });
    expect(s.gemdex.sort()).toEqual([...creekSpecies].sort());
    expect(s.gear).toContain('rock_hammer'); // creek set complete
    expect(s.gear).toContain('sieve');       // creek rep total (70) >= tier-1 threshold (50)
  });

  const identifiedSapphire = {
    instanceId: 'g1', stage: 'identified', trueSpeciesId: 'sapphire', identifiedAs: 'sapphire',
    caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek'
  };
  const withIdentified = { ...initialRockhoundState, identified: [identifiedSapphire] };

  it('starts with empty cut state', () => {
    expect(initialRockhoundState.cutTechniqueLevel).toEqual({});
    expect(initialRockhoundState.bestSpecimens).toEqual({});
  });

  it('unlocks then levels a technique (capped at maxLevel)', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon).toBe(1);
    const max = cutTechniquesById.cabochon.successCurve.maxLevel;
    for (let i = 0; i < max + 3; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon).toBe(max);
  });

  it('will not level a technique that was never unlocked', () => {
    const s = rockhoundReducer(initialRockhoundState, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    expect(s.cutTechniqueLevel.cabochon ?? 0).toBe(0);
  });

  it('applying a winning cabochon cut trophies a starred sapphire and consumes the specimen', () => {
    let s = rockhoundReducer(withIdentified, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    for (let i = 0; i < 9; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } }); // level ~10
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.identified).toHaveLength(0);
    expect(s.bestSpecimens.sapphire).toBeTruthy();
    expect(s.bestSpecimens.sapphire.phenomena).toContain('asterism');
    expect(s.lastCutResult.outcome).toBe('success');
  });

  it('does not apply an un-unlocked technique', () => {
    const s = rockhoundReducer(withIdentified, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.identified).toHaveLength(1); // unchanged
    expect(s.bestSpecimens.sapphire).toBeUndefined();
  });

  it('APPLY_CUT is a no-op for a missing specimen', () => {
    const unlocked = rockhoundReducer(withIdentified, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    const after = rockhoundReducer(unlocked, { type: APPLY_CUT, payload: { instanceId: 'nope', techniqueId: 'cabochon', rng: () => 0 } });
    expect(after).toBe(unlocked); // unchanged reference
  });

  it('APPLY_CUT is a no-op when the technique cannot be applied to the species', () => {
    // agate.suitableCuts is [cabochon] only → round_brilliant is not applicable
    const agateRough = { instanceId: 'a1', stage: 'identified', trueSpeciesId: 'agate', identifiedAs: 'agate', caratWeight: 2, clarity: 60, colorGrade: 60, origin: 'amethyst_vug' };
    let s = { ...initialRockhoundState, identified: [agateRough] };
    s = rockhoundReducer(s, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'round_brilliant' } });
    const before = s;
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'a1', techniqueId: 'round_brilliant', rng: () => 0 } });
    expect(s).toBe(before);
    expect(s.identified).toHaveLength(1);
  });

  it('a shattered cut consumes the specimen but writes no trophy', () => {
    // topaz.cleavage 'perfect' + princess.catastrophicOnFail; rng 0.95 → fail (>p) and >0.9 → shatter
    const topazRough = { instanceId: 't1', stage: 'identified', trueSpeciesId: 'topaz', identifiedAs: 'topaz', caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'hidden_creek' };
    let s = { ...initialRockhoundState, identified: [topazRough] };
    s = rockhoundReducer(s, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'princess' } });
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 't1', techniqueId: 'princess', rng: () => 0.95 } });
    expect(s.identified).toHaveLength(0);
    expect(s.bestSpecimens.topaz).toBeUndefined();
    expect(s.lastCutResult.outcome).toBe('shattered');
  });

  it('a losing (non-shatter) cut still consumes the specimen and can set a first trophy', () => {
    // round_brilliant is NOT catastrophicOnFail; rng 0.999 forces a plain fail on sapphire
    let s = rockhoundReducer(withIdentified, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'round_brilliant' } });
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'round_brilliant', rng: () => 0.999 } });
    expect(s.identified).toHaveLength(0);
    expect(s.lastCutResult.outcome).toBe('fail');
    expect(s.bestSpecimens.sapphire).toBeTruthy();
  });

  it('starts with zero cash and no stones', () => {
    expect(initialRockhoundState.cash).toBe(0);
    expect(initialRockhoundState.stones).toEqual([]);
  });

  it('a successful cut adds a sellable stone to inventory', () => {
    let s = { ...initialRockhoundState, identified: [identifiedSapphire] };
    s = rockhoundReducer(s, { type: UNLOCK_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    for (let i = 0; i < 9; i++) s = rockhoundReducer(s, { type: LEVEL_TECHNIQUE, payload: { techniqueId: 'cabochon' } });
    s = rockhoundReducer(s, { type: APPLY_CUT, payload: { instanceId: 'g1', techniqueId: 'cabochon', rng: () => 0 } });
    expect(s.stones).toHaveLength(1);
    expect(s.stones[0].trueSpeciesId).toBe('sapphire');
  });

  it('sells an identified specimen for its identified value', () => {
    const s0 = { ...initialRockhoundState, identified: [identifiedSapphire] };
    const s1 = rockhoundReducer(s0, { type: SELL_IDENTIFIED, payload: { instanceId: 'g1' } });
    expect(s1.identified).toHaveLength(0);
    expect(s1.cash).toBe(identifiedValue(identifiedSapphire, speciesById.sapphire));
  });

  it('sells a cut stone for its stone value', () => {
    const stone = { instanceId: 'st1', trueSpeciesId: 'sapphire', cut: 'cabochon', cutQuality: 90, phenomena: ['asterism'], caratWeight: 2, caratRetained: 1.6, clarity: 80, colorGrade: 80, score: 88 };
    const s0 = { ...initialRockhoundState, stones: [stone] };
    const s1 = rockhoundReducer(s0, { type: SELL_STONE, payload: { instanceId: 'st1' } });
    expect(s1.stones).toHaveLength(0);
    expect(s1.cash).toBe(stoneValue(stone, speciesById.sapphire));
  });

  it('buys gear when affordable and not owned, and no-ops otherwise', () => {
    const rich = { ...initialRockhoundState, cash: 500 };
    const bought = rockhoundReducer(rich, { type: BUY_GEAR, payload: { gearId: 'sieve' } });
    expect(bought.gear).toContain('sieve');
    expect(bought.cash).toBe(500 - gearPrice('sieve'));
    // already owned → no-op
    expect(rockhoundReducer(bought, { type: BUY_GEAR, payload: { gearId: 'sieve' } })).toBe(bought);
    // too poor → no-op
    const poor = { ...initialRockhoundState, cash: 10 };
    expect(rockhoundReducer(poor, { type: BUY_GEAR, payload: { gearId: 'rock_hammer' } })).toBe(poor);
  });

  describe('COLLECT_HAUL', () => {
    const specimen = (id) => ({ instanceId: id, stage: 'rough', trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek', foundDepth: 1, form: 'waterworn' });

    it('starts every method at zero experience', () => {
      for (const m of METHOD_ENUM) {
        expect(initialRockhoundState.exploreMethodXp[m], m).toBe(0);
      }
    });

    it('adds a whole haul to the bench in one action', () => {
      const next = rockhoundReducer(initialRockhoundState, {
        type: COLLECT_HAUL,
        payload: { specimens: [specimen('a'), specimen('b')], method: 'panning', xp: 10 }
      });
      expect(next.rough.map((r) => r.instanceId)).toEqual(['a', 'b']);
    });

    it('credits experience to the method that earned it, and no other', () => {
      const next = rockhoundReducer(initialRockhoundState, {
        type: COLLECT_HAUL,
        payload: { specimens: [specimen('a')], method: 'geode', xp: 30 }
      });
      expect(next.exploreMethodXp.geode).toBe(30);
      expect(next.exploreMethodXp.panning).toBe(0);
      expect(next.exploreMethodXp.hardrock).toBe(0);
      expect(next.exploreMethodXp.surface).toBe(0);
    });

    it('accumulates experience across runs', () => {
      const once = rockhoundReducer(initialRockhoundState, {
        type: COLLECT_HAUL, payload: { specimens: [], method: 'panning', xp: 10 }
      });
      const twice = rockhoundReducer(once, {
        type: COLLECT_HAUL, payload: { specimens: [], method: 'panning', xp: 25 }
      });
      expect(twice.exploreMethodXp.panning).toBe(35);
    });

    it('keeps rough already on the bench', () => {
      const seeded = { ...initialRockhoundState, rough: [specimen('old')] };
      const next = rockhoundReducer(seeded, {
        type: COLLECT_HAUL, payload: { specimens: [specimen('new')], method: 'panning', xp: 10 }
      });
      expect(next.rough.map((r) => r.instanceId)).toEqual(['old', 'new']);
    });

    it('ignores an unknown method rather than corrupting the experience map', () => {
      const next = rockhoundReducer(initialRockhoundState, {
        type: COLLECT_HAUL, payload: { specimens: [specimen('a')], method: 'spelunking', xp: 10 }
      });
      expect(next.exploreMethodXp).toEqual(initialRockhoundState.exploreMethodXp);
      expect(next.rough).toHaveLength(1); // the stones are still real
    });
  });
});

describe('debug actions', () => {
  it('sets a method to the exact xp its level requires', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'geode', level: 6 }
    });
    // Stored as xp, never as a level — a stored level would be a second
    // source of truth that can drift from the xp that produced it.
    expect(levelForXp(next.exploreMethodXp.geode)).toBe(6);
    expect(next.exploreMethodXp.panning).toBe(0);
  });

  it('clamps a requested level into the real range', () => {
    const hi = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'panning', level: 99 }
    });
    const lo = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'panning', level: -5 }
    });
    expect(levelForXp(hi.exploreMethodXp.panning)).toBe(MAX_METHOD_LEVEL);
    expect(lo.exploreMethodXp.panning).toBe(0);
  });

  it('ignores an unknown method rather than inventing a track', () => {
    const next = rockhoundReducer(initialRockhoundState, {
      type: DEBUG_SET_METHOD_LEVEL, payload: { method: 'spelunking', level: 4 }
    });
    expect(next.exploreMethodXp).toEqual(initialRockhoundState.exploreMethodXp);
  });

  it('grants cash the Market can actually spend', () => {
    const next = rockhoundReducer({ ...initialRockhoundState, cash: 40 }, {
      type: DEBUG_ADD_CASH, payload: { amount: 1000 }
    });
    expect(next.cash).toBe(1040);
  });

  it('resets to a genuinely fresh state', () => {
    const dirty = { ...initialRockhoundState, cash: 999, gemdex: ['ruby'], reputation: 50 };
    expect(rockhoundReducer(dirty, { type: DEBUG_RESET })).toEqual(initialRockhoundState);
  });
});

describe('the idle sieve', () => {
  const HOUR = 3600000;
  const withBox = (over = {}) => ({
    ...initialRockhoundState,
    gear: ['rocker_box'],
    gemdex: ['quartz'],
    exploreMethodXp: { ...initialRockhoundState.exploreMethodXp, panning: 0 },
    ...over
  });
  // Deterministic stand-in for rollRough's `defaultId`: no Date.now(), no
  // shared mutable counter across tests. Each call site gets its own factory
  // so instance ids don't collide between independent tests.
  const makeIdFactory = () => {
    let n = 0;
    return () => `sieve-${++n}`;
  };

  it('parks the box at a locality and starts its clock', () => {
    const next = rockhoundReducer(withBox(), {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toEqual({ localityId: 'hidden_creek', since: 1000 });
  });

  it('refuses to park a box the player does not own', () => {
    const next = rockhoundReducer({ ...withBox(), gear: [] }, {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toBe(null);
  });

  it('catches only species already in the gemdex', () => {
    // THE central rule: automation must never advance discovery. Hidden Creek
    // pools quartz, garnet and sapphire at depth 1; only quartz is known.
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.rough.length).toBeGreaterThan(0);
    expect(next.rough.every((r) => r.trueSpeciesId === 'quartz')).toBe(true);
  });

  it('returns everything unidentified, granting no reputation and no gemdex entry', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.rough.every((r) => r.stage === 'rough')).toBe(true);
    expect(next.rough.every((r) => r.identifiedAs === null)).toBe(true);
    expect(next.reputation).toBe(state.reputation);
    expect(next.gemdex).toEqual(state.gemdex);
    expect(next.identified).toEqual([]);
  });

  it('restarts the clock when collected', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.sieve.since).toBe(8 * HOUR);
  });

  it('catches nothing where the player has catalogued nothing', () => {
    const state = withBox({ gemdex: [], sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.rough).toEqual([]);
  });

  it('refuses to collect onto a full bench, and keeps the accrued time', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const state = withBox({ rough: full, sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.rough).toHaveLength(BENCH_CAP);
    expect(next.sieve.since).toBe(0); // nothing lost — collect once there is room
  });

  it('collects what is pending before moving the box', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: PARK_SIEVE,
      payload: { localityId: 'gravel_bar', now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.rough.length).toBeGreaterThan(0);
    expect(next.sieve).toEqual({ localityId: 'gravel_bar', since: 8 * HOUR });
  });

  it('refuses to move the box on a full bench, so park-cycling cannot beat the cap', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const state = withBox({ rough: full, sieve: { localityId: 'hidden_creek', since: 0 } });
    const next = rockhoundReducer(state, {
      type: PARK_SIEVE,
      payload: { localityId: 'gravel_bar', now: 8 * HOUR, rng: Math.random, idFactory: makeIdFactory() }
    });
    expect(next.sieve.localityId).toBe('hidden_creek');
    expect(next.rough).toHaveLength(BENCH_CAP);
  });

  it('allows a first park on a full bench, since nothing is pending', () => {
    const full = Array.from({ length: BENCH_CAP }, (_, i) => ({ instanceId: `r${i}`, stage: 'rough' }));
    const next = rockhoundReducer(withBox({ rough: full }), {
      type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
    });
    expect(next.sieve).toEqual({ localityId: 'hidden_creek', since: 1000 });
  });

  it('rewinds the clock for testing without touching anything else', () => {
    const state = withBox({ sieve: { localityId: 'hidden_creek', since: 5 * HOUR } });
    const next = rockhoundReducer(state, {
      type: DEBUG_REWIND_SIEVE, payload: { hours: 8, now: 10 * HOUR }
    });
    expect(next.sieve.since).toBe(10 * HOUR - 8 * HOUR);
    expect(next.rough).toEqual(state.rough);
  });

  describe('reducer purity', () => {
    it('produces deeply equal output for two calls with the identical (state, action)', () => {
      // Pins the property that collectSieve's old `rollRough(..., undefined, ...)`
      // silently broke: Date.now() and a module-level id counter inside the
      // reducer's call stack meant the same (state, action) pair produced
      // different output each time. `rng` is a stateless deterministic
      // function (safe to share), but `idFactory` is a counter closure, so
      // each call gets its OWN fresh instance — mirroring how a real caller
      // reconstructs an equivalent action rather than literally sharing one
      // mutable closure across both invocations. Both actions are equal by
      // value, which is what "identical action" means for a purity check.
      const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
      const rng = () => 0.42;
      const makeAction = () => ({
        type: COLLECT_SIEVE,
        payload: { now: 8 * HOUR, rng, idFactory: makeIdFactory() }
      });
      const first = rockhoundReducer(state, makeAction());
      const second = rockhoundReducer(state, makeAction());
      expect(second).toEqual(first);
    });

    it('COLLECT_SIEVE with a parked box is a no-op when idFactory is missing', () => {
      const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
      const next = rockhoundReducer(state, {
        type: COLLECT_SIEVE, payload: { now: 8 * HOUR, rng: Math.random }
      });
      expect(next).toBe(state);
    });

    it('COLLECT_SIEVE with a parked box is a no-op when rng is missing', () => {
      const state = withBox({ sieve: { localityId: 'hidden_creek', since: 0 } });
      const next = rockhoundReducer(state, {
        type: COLLECT_SIEVE, payload: { now: 8 * HOUR, idFactory: makeIdFactory() }
      });
      expect(next).toBe(state);
    });

    it('a first park (no box parked yet) still succeeds with neither rng nor idFactory', () => {
      const next = rockhoundReducer(withBox(), {
        type: PARK_SIEVE, payload: { localityId: 'hidden_creek', now: 1000 }
      });
      expect(next.sieve).toEqual({ localityId: 'hidden_creek', since: 1000 });
    });
  });
});

describe('REVEAL_TRAIT', () => {
  // foundDepth must be >= ruby's minDepth (3) at mogok_marble (see
  // localities.yaml) — otherwise seedCandidates excludes ruby from its own
  // candidate pool, which falsely narrows the pool to spinel alone by hue
  // before any test even runs.
  const roughRuby = {
    instanceId: 'r1', stage: 'rough', trueSpeciesId: 'ruby', identifiedAs: null,
    caratWeight: 2, clarity: 80, colorGrade: 80, origin: 'mogok_marble',
    foundDepth: 3, form: 'fragment', hue: 'red', revealed: {}
  };
  const withStone = (over = {}) => ({ ...initialRockhoundState, rough: [roughRuby], ...over });

  it('records a reading the player can actually be shown', () => {
    const next = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const reading = next.rough[0].revealed.scratch;
    expect(reading.center).toBe(9);        // ruby's hardness
    expect(reading.band).toBeGreaterThan(0);
  });

  it('is deterministic — the same state and action twice give the same result', () => {
    // The reducer must never reach for Math.random or Date.now.
    const act = { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true } };
    expect(rockhoundReducer(withStone(), act)).toEqual(rockhoundReducer(withStone(), act));
  });

  it('reads more precisely by hand than by shortcut', () => {
    const hand = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const auto = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: false }
    });
    expect(hand.rough[0].revealed.scratch.band).toBeLessThan(auto.rough[0].revealed.scratch.band);
  });

  it('grows mastery by practice, and rewards hand work more than the shortcut', () => {
    const hand = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    const auto = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: false }
    });
    expect(hand.testMastery.scratch).toBeGreaterThan(initialRockhoundState.testMastery.scratch);
    expect(hand.testMastery.scratch).toBeGreaterThan(auto.testMastery.scratch);
  });

  it('never lets mastery exceed its ceiling', () => {
    const maxed = withStone({ testMastery: { ...initialRockhoundState.testMastery, scratch: 100 } });
    const next = rockhoundReducer(maxed, {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'scratch', byHand: true }
    });
    expect(next.testMastery.scratch).toBe(100);
  });

  it('leaves the stone unidentified while the readings are still ambiguous', () => {
    // At Mogok Marble a red stone could be ruby or spinel — sight alone
    // must not resolve it.
    const next = rockhoundReducer(withStone(), {
      type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId: 'uv', byHand: true }
    });
    expect(next.rough).toHaveLength(1);
    expect(next.identified).toHaveLength(0);
  });

  it('resolves the stone on its own once the readings are decisive', () => {
    // At Mogok Marble, ruby and spinel share hue, transparency, and even
    // fluorescence key (both red/none) — sight and UV alone never separate
    // them here. What does is hardness (9 vs 8): with the scratch test
    // already mastered, that one numeric reading narrows the band to ±0.5,
    // which is decisive.
    let state = withStone({ testMastery: { ...initialRockhoundState.testMastery, scratch: 100 } });
    for (const testId of ['scratch', 'heft', 'uv']) {
      state = rockhoundReducer(state, { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId, byHand: true } });
    }
    expect(state.rough).toHaveLength(0);
    expect(state.identified).toHaveLength(1);
    expect(state.identified[0].trueSpeciesId).toBe('ruby');
    expect(state.identified[0].stage).toBe('identified');
  });

  it('awards the same reputation and gemdex entry the old path did', () => {
    // Same decisive setup as above — mastered scratch test is what resolves
    // ruby against its Mogok Marble look-alike, spinel.
    let state = withStone({ testMastery: { ...initialRockhoundState.testMastery, scratch: 100 } });
    for (const testId of ['scratch', 'heft', 'uv']) {
      state = rockhoundReducer(state, { type: REVEAL_TRAIT, payload: { instanceId: 'r1', testId, byHand: true } });
    }
    expect(state.gemdex).toContain('ruby');
    expect(state.newlyDiscovered).toContain('ruby');
    expect(state.reputation).toBeGreaterThan(0);
  });

  it('ignores a stone that is not on the bench', () => {
    // Compare against the SAME object, not a freshly built one — the reducer
    // returns state unchanged, so identity is the assertion that matters.
    const before = withStone();
    const next = rockhoundReducer(before, {
      type: REVEAL_TRAIT, payload: { instanceId: 'nope', testId: 'scratch', byHand: true }
    });
    expect(next).toBe(before);
  });
});
