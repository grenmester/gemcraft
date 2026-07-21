// src/features/rockhound/RockhoundContext.test.js
import { describe, it, expect } from 'vitest';
import {
  rockhoundReducer, initialRockhoundState,
  ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW,
  UNLOCK_TECHNIQUE, LEVEL_TECHNIQUE, APPLY_CUT
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';
import { species } from '../../loaders/species.js';
import { localitiesById } from '../../loaders/localities.js';
import { cutTechniquesById } from '../../loaders/cutTechniques.js';

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
});
