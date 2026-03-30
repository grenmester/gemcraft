import { describe, it, expect } from 'vitest';
import { gameReducer } from '../GameContext.jsx';
import { GAME_PHASES } from '../GameContext.jsx';
import { Player } from '../../models/Player.js';

// Helper to create initial state
function createInitialState(customState = {}) {
  const initialPlayer = new Player();
  return {
    player: initialPlayer.toJSON(),
    migrationVersion: 4,
    phase: GAME_PHASES.MENU,
    activeMinigame: null,
    discoverState: {
      activeTab: 'idle',
      selectedLocation: null,
      selectedArea: null,
      lastRewards: null
    },
    unlockedZones: [],
    processState: {
      activeProcess: null,
      queue: [],
      queueSlots: 2,
      completedQueue: [],
      processingStats: {
        totalProcessed: 0,
        masterworksCreated: 0,
        bestQuality: 0,
      }
    },
    ...customState
  };
}

// Helper to add item to inventory for testing
function addToInventory(state, itemId, category = 'gems', quantity = 1) {
  const inv = state.player.inventory || { minerals: [], gems: [], equipment: [], currency: { coins: 0 } };
  const items = [...(inv[category] || [])];
  const existing = items.find(i => i.gemId === itemId || i.id === itemId);

  if (existing) {
    const idx = items.indexOf(existing);
    items[idx] = { ...existing, quantity: existing.quantity + quantity };
  } else {
    items.push(category === 'minerals' ? { id: itemId, quantity } : { gemId: itemId, quantity });
  }

  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...inv,
        [category]: items
      }
    }
  };
}

describe('GameContext Process Actions', () => {

  describe('START_ACTIVE_PROCESS', () => {
    it('should remove item from inventory and set activeProcess', () => {
      let state = createInitialState();
      state = addToInventory(state, 'clear_quartz', 'minerals', 1);

      const action = {
        type: 'START_ACTIVE_PROCESS',
        payload: { itemId: 'clear_quartz', processType: 'cut', quality: 50 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).toEqual({
        itemId: 'clear_quartz',
        processType: 'cut',
        startTime: expect.any(Number),
        quality: 50
      });
      expect(newState.player.inventory.minerals).toHaveLength(0);
    });

    it('should return original state if item not in inventory', () => {
      let state = createInitialState();

      const action = {
        type: 'START_ACTIVE_PROCESS',
        payload: { itemId: 'clear_quartz', processType: 'cut' }
      };

      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
      expect(newState.processState.activeProcess).toBeNull();
    });

    it('should handle gem items', () => {
      let state = createInitialState();
      state = addToInventory(state, 'amethyst', 'gems', 1);

      const action = {
        type: 'START_ACTIVE_PROCESS',
        payload: { itemId: 'amethyst', processType: 'polish' }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).not.toBeNull();
      expect(newState.player.inventory.gems).toHaveLength(0);
    });

    it('should decrement quantity when multiple items exist', () => {
      let state = createInitialState();
      state = addToInventory(state, 'hematite', 'minerals', 3);

      const action = {
        type: 'START_ACTIVE_PROCESS',
        payload: { itemId: 'hematite', processType: 'grind' }
      };

      const newState = gameReducer(state, action);

      expect(newState.player.inventory.minerals).toHaveLength(1);
      expect(newState.player.inventory.minerals[0].quantity).toBe(2);
    });
  });

  describe('COMPLETE_ACTIVE_PROCESS', () => {
    it('should return item to inventory and clear activeProcess', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'ruby', processType: 'cut', startTime: Date.now(), quality: 0 }
        }
      };

      const action = {
        type: 'COMPLETE_ACTIVE_PROCESS',
        payload: { quality: 85 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).toBeNull();
      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].gemId).toBe('ruby');
      expect(newState.player.inventory.gems[0].quantity).toBe(1);
    });

    it('should update processingStats correctly', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'fluorite', processType: 'grind', startTime: Date.now(), quality: 0 },
          processingStats: { totalProcessed: 5, masterworksCreated: 1, bestQuality: 75 }
        }
      };

      const action = {
        type: 'COMPLETE_ACTIVE_PROCESS',
        payload: { quality: 95 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.processingStats).toEqual({
        totalProcessed: 6,
        masterworksCreated: 2, // quality >= 90, so masterworksCreated + 1
        bestQuality: 95
      });
    });

    it('should not increment masterworks if quality < 90', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'obsidian', processType: 'cut', startTime: Date.now(), quality: 0 },
          processingStats: { totalProcessed: 10, masterworksCreated: 2, bestQuality: 80 }
        }
      };

      const action = {
        type: 'COMPLETE_ACTIVE_PROCESS',
        payload: { quality: 75 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.processingStats.masterworksCreated).toBe(2);
      expect(newState.processState.processingStats.bestQuality).toBe(80);
    });

    it('should return original state if no activeProcess', () => {
      let state = createInitialState();

      const action = {
        type: 'COMPLETE_ACTIVE_PROCESS',
        payload: { quality: 100 }
      };

      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should add to existing gem stack if already present', () => {
      let state = createInitialState();
      state = addToInventory(state, 'amethyst', 'gems', 2);
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'amethyst', processType: 'polish', startTime: Date.now(), quality: 0 }
        }
      };

      const action = { type: 'COMPLETE_ACTIVE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].quantity).toBe(3);
    });
  });

  describe('QUEUE_ITEM', () => {
    it('should add item to queue if slots available', () => {
      let state = createInitialState();

      const action = {
        type: 'QUEUE_ITEM',
        payload: { itemId: 'lapis_lazuli', processType: 'cut', estimatedCompletion: Date.now() + 5000 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.queue).toHaveLength(1);
      expect(newState.processState.queue[0].itemId).toBe('lapis_lazuli');
    });

    it('should respect queueSlots limit', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'item1', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 1000 },
            { itemId: 'item2', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 2000 }
          ]
        }
      };

      const action = {
        type: 'QUEUE_ITEM',
        payload: { itemId: 'item3', processType: 'cut', estimatedCompletion: Date.now() + 3000 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.queue).toHaveLength(2); // Still 2, item3 rejected
    });

    it('should accept item when queue has space', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'item1', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 1000 }
          ]
        }
      };

      const action = {
        type: 'QUEUE_ITEM',
        payload: { itemId: 'item2', processType: 'cut', estimatedCompletion: Date.now() + 2000 }
      };

      const newState = gameReducer(state, action);

      expect(newState.processState.queue).toHaveLength(2);
    });
  });

  describe('START_QUEUE_PROCESS', () => {
    it('should move first queue item to activeProcess and remove from inventory', () => {
      let state = createInitialState();
      state = addToInventory(state, 'malachite', 'minerals', 1);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'malachite', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).toEqual({
        itemId: 'malachite',
        processType: 'cut',
        startTime: expect.any(Number),
        estimatedCompletion: expect.any(Number),
        quality: 0
      });
      expect(newState.processState.queue).toHaveLength(0);
      expect(newState.player.inventory.minerals).toHaveLength(0);
    });

    it('should return original state if queue is empty', () => {
      let state = createInitialState();

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should decrement quantity from inventory when multiple exist', () => {
      let state = createInitialState();
      state = addToInventory(state, 'azurite', 'gems', 3);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'azurite', processType: 'polish', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).not.toBeNull();
      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].quantity).toBe(2);
    });

    it('should remove item from queue even if inventory removal fails', () => {
      // Queue has item but inventory does not have it (inconsistency)
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'nonexistent', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).toBeNull();
      expect(newState.processState.queue).toHaveLength(1); // Still has the item
    });
  });

  describe('COMPLETE_QUEUE_PROCESS', () => {
    it('should move activeProcess to completedQueue', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'labradorite', processType: 'grind', startTime: Date.now(), quality: 0 }
        }
      };

      const action = { type: 'COMPLETE_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.processState.activeProcess).toBeNull();
      expect(newState.processState.completedQueue).toHaveLength(1);
      expect(newState.processState.completedQueue[0].itemId).toBe('labradorite');
    });

    it('should return original state if no activeProcess', () => {
      let state = createInitialState();

      const action = { type: 'COMPLETE_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should preserve other activeProcess properties', () => {
      let state = createInitialState();
      const startTime = Date.now();
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: {
            itemId: 'celestite',
            processType: 'cut',
            startTime: startTime,
            estimatedCompletion: Date.now() + 10000,
            quality: 0
          }
        }
      };

      const action = { type: 'COMPLETE_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      expect(newState.processState.completedQueue[0]).toEqual({
        itemId: 'celestite',
        processType: 'cut',
        startTime: startTime,
        estimatedCompletion: expect.any(Number),
        quality: 0
      });
    });
  });

  describe('COLLECT_QUEUE_ITEM', () => {
    it('should collect completed item and add to inventory', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          completedQueue: [
            { itemId: 'diamond', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 1000, quality: 95 }
          ]
        }
      };

      const action = { type: 'COLLECT_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.processState.completedQueue).toHaveLength(0);
      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].gemId).toBe('diamond');
    });

    it('should handle mineral items', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          completedQueue: [
            { itemId: 'hematite', processType: 'grind', startTime: Date.now(), estimatedCompletion: Date.now() + 1000, quality: 80 }
          ]
        }
      };

      const action = { type: 'COLLECT_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.player.inventory.minerals).toHaveLength(1);
      expect(newState.player.inventory.minerals[0].id).toBe('hematite');
    });

    it('should return original state for invalid index', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          completedQueue: [{ itemId: 'obsidian', processType: 'cut' }]
        }
      };

      const action = { type: 'COLLECT_QUEUE_ITEM', payload: { index: 5 } };
      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should return original state if index is undefined', () => {
      let state = createInitialState();

      const action = { type: 'COLLECT_QUEUE_ITEM', payload: {} };
      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should add to existing stack if item already in inventory', () => {
      let state = createInitialState();
      state = addToInventory(state, 'amethyst', 'gems', 2);
      state = {
        ...state,
        processState: {
          ...state.processState,
          completedQueue: [
            { itemId: 'amethyst', processType: 'polish', startTime: Date.now(), estimatedCompletion: Date.now() + 1000, quality: 85 }
          ]
        }
      };

      const action = { type: 'COLLECT_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].quantity).toBe(3);
    });
  });

  describe('CANCEL_QUEUE_ITEM', () => {
    it('should cancel queued item and return to inventory', () => {
      let state = createInitialState();
      state = addToInventory(state, 'fluorite', 'minerals', 1); // Add to inventory first
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'fluorite', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'CANCEL_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.processState.queue).toHaveLength(0);
      expect(newState.player.inventory.minerals).toHaveLength(1);
    });

    it('should return original state for invalid index', () => {
      let state = createInitialState();
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [{ itemId: 'pyrite', processType: 'cut' }]
        }
      };

      const action = { type: 'CANCEL_QUEUE_ITEM', payload: { index: 5 } };
      const newState = gameReducer(state, action);

      expect(newState).toEqual(state);
    });

    it('should handle gem items', () => {
      let state = createInitialState();
      state = addToInventory(state, 'emerald', 'gems', 1);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'emerald', processType: 'polish', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'CANCEL_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].gemId).toBe('emerald');
    });

    it('should not modify other queue items', () => {
      let state = createInitialState();
      state = addToInventory(state, 'gem1', 'gems', 1);
      state = addToInventory(state, 'gem2', 'gems', 1);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'gem1', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 },
            { itemId: 'gem2', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 6000 }
          ]
        }
      };

      const action = { type: 'CANCEL_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.processState.queue).toHaveLength(1);
      expect(newState.processState.queue[0].itemId).toBe('gem2');
      expect(newState.player.inventory.gems).toHaveLength(2);
    });

    it('should add to existing stack if item already in inventory', () => {
      let state = createInitialState();
      state = addToInventory(state, 'ruby', 'gems', 2);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'ruby', processType: 'polish', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'CANCEL_QUEUE_ITEM', payload: { index: 0 } };
      const newState = gameReducer(state, action);

      expect(newState.player.inventory.gems).toHaveLength(1);
      expect(newState.player.inventory.gems[0].quantity).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inventory gracefully', () => {
      let state = createInitialState();
      // Try to start process with item not in inventory
      const action = {
        type: 'START_ACTIVE_PROCESS',
        payload: { itemId: 'nonexistent', processType: 'cut' }
      };

      const newState = gameReducer(state, action);
      expect(newState).toEqual(state);
    });

    it('should handle malformed queue items', () => {
      let state = createInitialState();
      // First add the item to inventory so START_QUEUE_PROCESS can remove it
      state = addToInventory(state, 'obsidian', 'minerals', 1);
      state = {
        ...state,
        processState: {
          ...state.processState,
          queue: [
            { itemId: 'obsidian', processType: 'grind' } // Missing estimatedCompletion but that's ok
          ]
        }
      };

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      // Should still process the item since it's in inventory
      expect(newState.processState.activeProcess).not.toBeNull();
      expect(newState.processState.activeProcess.itemId).toBe('obsidian');
    });

    it('should not modify state if activeProcess already exists when starting queue process', () => {
      let state = createInitialState();
      state = addToInventory(state, 'quartz', 'minerals', 1);
      state = {
        ...state,
        processState: {
          ...state.processState,
          activeProcess: { itemId: 'existing', processType: 'cut', startTime: Date.now() },
          queue: [
            { itemId: 'quartz', processType: 'cut', startTime: Date.now(), estimatedCompletion: Date.now() + 5000 }
          ]
        }
      };

      const action = { type: 'START_QUEUE_PROCESS' };
      const newState = gameReducer(state, action);

      // Should still start the queued process (moves from queue to active)
      expect(newState.processState.activeProcess.itemId).toBe('quartz');
      expect(newState.processState.queue).toHaveLength(0);
    });
  });

});
