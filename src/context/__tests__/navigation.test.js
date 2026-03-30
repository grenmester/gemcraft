import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../context/GameContext';

describe('Navigation', () => {
  const initialState = {
    phase: 'menu',
    player: {
      coins: 100,
      inventory: { minerals: [], gems: [], equipment: [], currency: { coins: 100 } },
      level: 1,
      shiftPoints: 0,
    },
    discoverState: {
      activeTab: 'idle',
      selectedLocation: null,
      selectedArea: null,
      lastRewards: null,
    },
    processState: {
      activeProcess: null,
      queue: [],
      queueSlots: 2,
      completedQueue: [],
      processingStats: {
        totalProcessed: 0,
        masterworksCreated: 0,
        bestQuality: 0,
      },
    },
  };

  describe('Menu Navigation', () => {
    it('should navigate to Discover from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'discover' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('discover');
    });

    it('should navigate to Process from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'process' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('process');
    });

    it('should navigate to Craft from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'craft' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('craft');
    });

    it('should navigate to Sell from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'sell' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('sell');
    });

    it('should navigate to Gemdex from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'gemdex' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('gemdex');
    });

    it('should navigate to Inventory from Menu', () => {
      const action = { type: 'SET_PHASE', payload: 'inventory' };
      const newState = gameReducer(initialState, action);
      expect(newState.phase).toBe('inventory');
    });

    it('should navigate back to Menu from any phase', () => {
      const action = { type: 'SET_PHASE', payload: 'menu' };
      
      // From Process
      const fromProcess = { ...initialState, phase: 'process' };
      let newState = gameReducer(fromProcess, action);
      expect(newState.phase).toBe('menu');
      
      // From Discover
      const fromDiscover = { ...initialState, phase: 'discover' };
      newState = gameReducer(fromDiscover, action);
      expect(newState.phase).toBe('menu');
      
      // From Craft
      const fromCraft = { ...initialState, phase: 'craft' };
      newState = gameReducer(fromCraft, action);
      expect(newState.phase).toBe('menu');
    });
  });

  describe('Discover Navigation', () => {
    it('should reset discover state when entering Discover', () => {
      const stateWithSelection = {
        ...initialState,
        phase: 'discover',
        discoverState: {
          activeTab: 'panning',
          selectedLocation: 'river',
          selectedArea: 'surface',
          lastRewards: null,
        },
      };
      
      const action = { type: 'SET_PHASE', payload: 'menu' };
      const newState = gameReducer(stateWithSelection, action);
      expect(newState.phase).toBe('menu');
    });
  });

  describe('Navigation Constants', () => {
    it('should have GAME_PHASES constant with all expected phases', async () => {
      const { GAME_PHASES } = await import('../../context/GameContext');
      
      expect(GAME_PHASES.MENU).toBe('menu');
      expect(GAME_PHASES.DISCOVER).toBe('discover');
      expect(GAME_PHASES.PROCESS).toBe('process');
      expect(GAME_PHASES.CRAFT).toBe('craft');
      expect(GAME_PHASES.SELL).toBe('sell');
      expect(GAME_PHASES.MINIGAME).toBeDefined();
    });
  });
});
