// src/features/rockhound/RockhoundContext.test.js
import { describe, it, expect } from 'vitest';
import {
  rockhoundReducer, initialRockhoundState,
  ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW,
  UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT,
  SELL_IDENTIFIED, SELL_STONE, BUY_GEAR, COLLECT_HAUL
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';
import { species, speciesById } from '../../loaders/species.js';
import { localitiesById } from '../../loaders/localities.js';
import { METHOD_ENUM } from '../../schemas/localities.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';
import { stoneValue, identifiedValue, gearPrice } from './logic/market.js';

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

  it('records a test score as a running best', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: RECORD_TEST_SCORE, payload: { testId: 'scratch', score: 60 } });
    s = rockhoundReducer(s, { type: RECORD_TEST_SCORE, payload: { testId: 'scratch', score: 40 } });
    expect(s.testMastery.scratch).toBe(60);
  });

  it('a correct commit discovers the species and awards reputation', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'sapphire' } });
    expect(s.rough).toHaveLength(0);
    expect(s.identified).toHaveLength(1);
    expect(s.gemdex).toContain('sapphire');
    expect(s.newlyDiscovered).toContain('sapphire');
    expect(s.reputation).toBe(35);
  });

  it('a wrong commit leaves the rough in place and awards nothing', () => {
    let s = rockhoundReducer(initialRockhoundState, { type: ADD_ROUGH, payload: sapphireRough });
    s = rockhoundReducer(s, { type: COMMIT_IDENTIFY, payload: { instanceId: 'r1', guessId: 'quartz' } });
    expect(s.rough).toHaveLength(1);
    expect(s.gemdex).toHaveLength(0);
    expect(s.reputation).toBe(0);
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
