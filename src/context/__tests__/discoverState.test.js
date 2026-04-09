import { describe, it, expect } from 'vitest';
import { 
  gameReducer, 
  SELECT_MINE, 
  SELECT_SUBAREA, 
  MINE_SUBAREA, 
  COLLECT_PENDING_MATERIALS, 
  CLEAR_MINING_SELECTION,
  SET_DISCOVER_TAB
} from '../GameContext.jsx';

describe('Discover State', () => {
  const baseState = {
    player: {
      coins: 1000,
      inventory: { minerals: [], gems: [], equipment: [], currency: { coins: 1000 } }
    },
    discoverState: {
      activeTab: 'panning',
      selectedMine: null,
      selectedSubarea: null,
      pendingMaterials: {},
      miningCooldowns: {},
      lastRewards: null
    }
  };

  describe('SET_DISCOVER_TAB', () => {
    it('sets active tab to panning', () => {
      const action = { type: SET_DISCOVER_TAB, payload: 'panning' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.activeTab).toBe('panning');
    });

    it('sets active tab to idle', () => {
      const action = { type: SET_DISCOVER_TAB, payload: 'idle' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.activeTab).toBe('idle');
    });
  });

  describe('SELECT_MINE', () => {
    it('sets selected mine', () => {
      const action = { type: SELECT_MINE, payload: 'TIER_1' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.selectedMine).toBe('TIER_1');
    });

    it('resets selected subarea when changing mine', () => {
      const withSubarea = { 
        ...baseState, 
        discoverState: { 
          ...baseState.discoverState, 
          selectedSubarea: 'area_a' 
        } 
      };
      const action = { type: SELECT_MINE, payload: 'TIER_2' };
      const newState = gameReducer(withSubarea, action);
      expect(newState.discoverState.selectedMine).toBe('TIER_2');
      expect(newState.discoverState.selectedSubarea).toBeNull();
    });
  });

  describe('SELECT_SUBAREA', () => {
    it('sets selected subarea', () => {
      const action = { type: SELECT_SUBAREA, payload: 'area_a' };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.selectedSubarea).toBe('area_a');
    });

    it('can change subarea', () => {
      const withSubarea = { 
        ...baseState, 
        discoverState: { 
          ...baseState.discoverState, 
          selectedSubarea: 'area_a' 
        } 
      };
      const action = { type: SELECT_SUBAREA, payload: 'area_b' };
      const newState = gameReducer(withSubarea, action);
      expect(newState.discoverState.selectedSubarea).toBe('area_b');
    });
  });

  describe('CLEAR_MINING_SELECTION', () => {
    it('clears both mine and subarea', () => {
      const withSelection = { 
        ...baseState, 
        discoverState: { 
          ...baseState.discoverState, 
          selectedMine: 'TIER_1', 
          selectedSubarea: 'area_a' 
        } 
      };
      const action = { type: CLEAR_MINING_SELECTION };
      const newState = gameReducer(withSelection, action);
      expect(newState.discoverState.selectedMine).toBeNull();
      expect(newState.discoverState.selectedSubarea).toBeNull();
    });
  });

  describe('MINE_SUBAREA', () => {
    it('adds materials to pending pile for small reward', () => {
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } 
      };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.pendingMaterials.TIER_1).toBeDefined();
      expect(newState.discoverState.pendingMaterials.TIER_1.length).toBeGreaterThan(0);
    });

    it('sets cooldown for small mining', () => {
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } 
      };
      const newState = gameReducer(baseState, action);
      expect(newState.discoverState.miningCooldowns.TIER_1_area_a?.small).toBeDefined();
      expect(newState.discoverState.miningCooldowns.TIER_1_area_a?.small).toBeGreaterThan(0);
    });

    it('throws on cooldown for small', () => {
      const withCooldown = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          miningCooldowns: {
            TIER_1_area_a: { small: Date.now() - 1000 } // 1 second ago (cooldown is 5s)
          }
        }
      };
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } 
      };
      expect(() => gameReducer(withCooldown, action)).toThrow('cooldown');
    });

    it('throws on cooldown for medium', () => {
      const withCooldown = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          miningCooldowns: {
            TIER_1_area_a: { medium: Date.now() - 1000 } // 1 second ago (cooldown is 15s)
          }
        }
      };
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'medium' } 
      };
      expect(() => gameReducer(withCooldown, action)).toThrow('cooldown');
    });

    it('throws on cooldown for large', () => {
      const withCooldown = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          miningCooldowns: {
            TIER_1_area_a: { large: Date.now() - 1000 } // 1 second ago (cooldown is 30s)
          }
        }
      };
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'large' } 
      };
      expect(() => gameReducer(withCooldown, action)).toThrow('cooldown');
    });

    it('accumulates pending materials', () => {
      const withPending = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          pendingMaterials: {
            TIER_1: [{ itemId: 'clear_quartz', quantity: 1 }]
          }
        }
      };
      const action = { 
        type: MINE_SUBAREA, 
        payload: { mineId: 'TIER_1', subareaId: 'area_a', rewardSize: 'small' } 
      };
      const newState = gameReducer(withPending, action);
      expect(newState.discoverState.pendingMaterials.TIER_1.length).toBe(2);
    });
  });

  describe('COLLECT_PENDING_MATERIALS', () => {
    it('moves pending to inventory', () => {
      const withPending = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          pendingMaterials: {
            TIER_1: [{ itemId: 'clear_quartz', quantity: 5 }]
          }
        }
      };
      const action = { type: COLLECT_PENDING_MATERIALS, payload: { mineId: 'TIER_1' } };
      const newState = gameReducer(withPending, action);
      expect(newState.player.inventory.minerals).toContainEqual({ id: 'clear_quartz', quantity: 5 });
      expect(newState.discoverState.pendingMaterials.TIER_1).toHaveLength(0);
    });

    it('does nothing when no pending materials', () => {
      const action = { type: COLLECT_PENDING_MATERIALS, payload: { mineId: 'TIER_1' } };
      const newState = gameReducer(baseState, action);
      expect(newState).toEqual(baseState);
    });

    it('accumulates minerals in inventory', () => {
      const withExisting = {
        ...baseState,
        player: {
          ...baseState.player,
          inventory: {
            ...baseState.player.inventory,
            minerals: [{ id: 'clear_quartz', quantity: 3 }]
          }
        }
      };
      const withPending = {
        ...withExisting,
        discoverState: {
          ...withExisting.discoverState,
          pendingMaterials: {
            TIER_1: [{ itemId: 'clear_quartz', quantity: 2 }]
          }
        }
      };
      const action = { type: COLLECT_PENDING_MATERIALS, payload: { mineId: 'TIER_1' } };
      const newState = gameReducer(withPending, action);
      expect(newState.player.inventory.minerals).toContainEqual({ id: 'clear_quartz', quantity: 5 });
    });

    it('handles multiple different items', () => {
      const withPending = {
        ...baseState,
        discoverState: {
          ...baseState.discoverState,
          pendingMaterials: {
            TIER_1: [
              { itemId: 'clear_quartz', quantity: 2 },
              { itemId: 'raw_obsidian', quantity: 3 }
            ]
          }
        }
      };
      const action = { type: COLLECT_PENDING_MATERIALS, payload: { mineId: 'TIER_1' } };
      const newState = gameReducer(withPending, action);
      expect(newState.player.inventory.minerals).toContainEqual({ id: 'clear_quartz', quantity: 2 });
      expect(newState.player.inventory.minerals).toContainEqual({ id: 'raw_obsidian', quantity: 3 });
      expect(newState.discoverState.pendingMaterials.TIER_1).toHaveLength(0);
    });
  });
});
