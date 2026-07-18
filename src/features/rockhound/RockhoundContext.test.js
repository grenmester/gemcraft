// src/features/rockhound/RockhoundContext.test.js
import { describe, it, expect } from 'vitest';
import {
  rockhoundReducer, initialRockhoundState,
  ADD_ROUGH, RECORD_TEST_SCORE, COMMIT_IDENTIFY, CLEAR_NEW
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';

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
});
