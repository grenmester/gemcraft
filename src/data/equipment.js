export const EQUIPMENT = {
  NONE: { id: 'NONE', name: 'None', cost: 0, unlockLevel: 0 },
  BASIC_PICKAXE: { id: 'BASIC_PICKAXE', name: 'Basic Pickaxe', cost: 0, unlockLevel: 5 },
  DIAMOND_DRILL: { id: 'DIAMOND_DRILL', name: 'Diamond Drill', cost: 500, unlockLevel: 15 },
  HEAVY_MACHINERY: { id: 'HEAVY_MACHINERY', name: 'Heavy Machinery', cost: 2000, unlockLevel: 40 },
  MINING_DYNASTY: { id: 'MINING_DYNASTY', name: 'Mining Dynasty', cost: 5000, unlockLevel: 55 },
  ELITE_OPERATIONS: { id: 'ELITE_OPERATIONS', name: 'Elite Operations', cost: 15000, unlockLevel: 70 }
};

export const getEquipmentById = (id) => EQUIPMENT[id];

export const getOwnedEquipment = (level, ownedIds = []) => {
  return Object.values(EQUIPMENT).filter(eq => 
    eq.unlockLevel <= level && (eq.id === 'NONE' || ownedIds.includes(eq.id))
  );
};
