import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RockhoundProvider, useRockhound } from './RockhoundProvider.jsx';
import { ADD_ROUGH } from './actions.js';
import { initialRockhoundState } from './initialState.js';
import { createRough } from '../domain/rollRough.js';
import { huesForSpecies } from '../domain/hues.js';
import { speciesById } from '../data/species/loader.js';

const STORAGE_KEY = 'rockhound_save_v1';
const wrapper = ({ children }) => <RockhoundProvider>{children}</RockhoundProvider>;

describe('RockhoundContext persistence', () => {
  beforeEach(() => localStorage.clear());

  it('restores saved state on init (load-on-init)', () => {
    const saved = { ...initialRockhoundState, reputation: 42, gemdex: ['sapphire'] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useRockhound(), { wrapper });
    expect(result.current.state.reputation).toBe(42);
    expect(result.current.state.gemdex).toEqual(['sapphire']);
  });

  it('saves state to localStorage on change (save-on-change)', () => {
    const rough = createRough(
      { trueSpeciesId: 'quartz', caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'hidden_creek' },
      () => 'p1'
    );
    const { result } = renderHook(() => useRockhound(), { wrapper });
    act(() => result.current.dispatch({ type: ADD_ROUGH, payload: rough }));
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(persisted.rough).toHaveLength(1);
    expect(persisted.rough[0].instanceId).toBe('p1');
  });

  it('throws when useRockhound is used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useRockhound())).toThrow(/must be used within a RockhoundProvider/);
    spy.mockRestore();
  });

  describe('legacy rough backfill (Finding 1)', () => {
    // A save from before hues existed: no `hue` key at all, and no
    // `revealed` key either. Loading it must not leave the stone stranded.
    const legacyRough = {
      instanceId: 'legacy1', stage: 'rough', trueSpeciesId: 'ruby', identifiedAs: null,
      caratWeight: 1, clarity: 50, colorGrade: 50, origin: 'mogok_marble', foundDepth: 3, form: 'fragment'
    };

    it('gives a legacy rough with no hue one its species can actually show', () => {
      const saved = { ...initialRockhoundState, rough: [legacyRough] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const { result } = renderHook(() => useRockhound(), { wrapper });
      const loaded = result.current.state.rough[0];
      expect(huesForSpecies(speciesById.ruby)).toContain(loaded.hue);
    });

    it('leaves a rough that already has a hue untouched', () => {
      const alreadyHued = { ...legacyRough, instanceId: 'hued1', hue: 'red', revealed: {} };
      const saved = { ...initialRockhoundState, rough: [alreadyHued] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const { result } = renderHook(() => useRockhound(), { wrapper });
      expect(result.current.state.rough[0].hue).toBe('red');
    });

    it('gives a legacy rough with no revealed record an empty one', () => {
      const saved = { ...initialRockhoundState, rough: [legacyRough] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const { result } = renderHook(() => useRockhound(), { wrapper });
      expect(result.current.state.rough[0].revealed).toEqual({});
    });
  });
});
