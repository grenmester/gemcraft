import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  RockhoundProvider, useRockhound, ADD_ROUGH, initialRockhoundState
} from './RockhoundContext.jsx';
import { createRough } from './logic/rollRough.js';

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
});
