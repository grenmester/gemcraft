export const PROCESS_EQUIPMENT = {
  // Cleaning Equipment
  BASIC_TUMBLER: {
    id: 'basic_tumbler',
    name: 'Basic Tumbler',
    type: 'cleaning',
    description: 'Standard equipment for cleaning raw gems',
    effects: {
      idleSpeedBonus: 0,
      idleQualityBonus: 0,
      activeQualityBonus: 0,
    },
    cost: 500,
    unlockLevel: 1,
  },
  VIBRATING_TUMBLER: {
    id: 'vibrating_tumbler',
    name: 'Vibrating Tumbler',
    type: 'cleaning',
    description: 'Automatic matrix removal speeds up cleaning',
    effects: {
      idleSpeedBonus: 0.10,
      idleQualityBonus: 5,
      activeQualityBonus: 5,
    },
    cost: 2000,
    unlockLevel: 5,
  },
  SONIC_CLEANER: {
    id: 'sonic_cleaner',
    name: 'Sonic Cleaner',
    type: 'cleaning',
    description: 'Ultrasonic cleaning preserves quality',
    effects: {
      idleSpeedBonus: 0.25,
      idleQualityBonus: 10,
      activeQualityBonus: 10,
      autoMatrixRemoval: true,
    },
    cost: 8000,
    unlockLevel: 15,
  },
  INDUSTRIAL_CLEANER: {
    id: 'industrial_cleaner',
    name: 'Industrial Cleaner',
    type: 'cleaning',
    description: 'Professional-grade cleaning maximizes gem potential',
    effects: {
      idleSpeedBonus: 0.40,
      idleQualityBonus: 15,
      activeQualityBonus: 15,
      autoMatrixRemoval: true,
    },
    cost: 25000,
    unlockLevel: 30,
  },

  // Cutting Equipment
  BASIC_CUTTER: {
    id: 'basic_cutter',
    name: 'Basic Cutter',
    type: 'cutting',
    description: 'Standard gem cutting wheel',
    effects: {
      cutSpeedBonus: 0,
      cutQualityBonus: 0,
      facetEfficiencyBonus: 0,
    },
    cost: 1000,
    unlockLevel: 1,
  },
  PRECISION_CUTTER: {
    id: 'precision_cutter',
    name: 'Precision Cutter',
    type: 'cutting',
    description: 'Laser-guided cutting for cleaner edges',
    effects: {
      cutSpeedBonus: 0.15,
      cutQualityBonus: 5,
      facetEfficiencyBonus: 0.05,
    },
    cost: 4000,
    unlockLevel: 10,
  },
  DIAMOND_CUTTER: {
    id: 'diamond_cutter',
    name: 'Diamond Cutter',
    type: 'cutting',
    description: 'Industrial diamond blade for flawless cuts',
    effects: {
      cutSpeedBonus: 0.30,
      cutQualityBonus: 12,
      facetEfficiencyBonus: 0.10,
    },
    cost: 15000,
    unlockLevel: 25,
  },
  QUANTUM_CUTTER: {
    id: 'quantum_cutter',
    name: 'Quantum Cutter',
    type: 'cutting',
    description: 'Molecular-level precision cutting',
    effects: {
      cutSpeedBonus: 0.50,
      cutQualityBonus: 20,
      facetEfficiencyBonus: 0.15,
    },
    cost: 50000,
    unlockLevel: 45,
  },

  // Faceting Equipment
  HAND_FACETER: {
    id: 'hand_faceter',
    name: 'Hand Faceter',
    type: 'faceting',
    description: 'Manual faceting for basic cuts',
    effects: {
      facetSpeedBonus: 0,
      facetQualityBonus: 0,
      brillianceBonus: 0,
    },
    cost: 1500,
    unlockLevel: 1,
  },
  AUTOMATIC_FACETER: {
    id: 'automatic_faceter',
    name: 'Automatic Faceter',
    type: 'faceting',
    description: 'Computer-controlled faceting machine',
    effects: {
      facetSpeedBonus: 0.20,
      facetQualityBonus: 8,
      brillianceBonus: 5,
    },
    cost: 6000,
    unlockLevel: 12,
  },
  MASTER_FACETER: {
    id: 'master_faceter',
    name: 'Master Faceter',
    type: 'faceting',
    description: 'Master-crafted faceting for exceptional brilliance',
    effects: {
      facetSpeedBonus: 0.35,
      facetQualityBonus: 15,
      brillianceBonus: 12,
    },
    cost: 20000,
    unlockLevel: 28,
  },
  BRILLIANCE_ENGINE: {
    id: 'brilliance_engine',
    name: 'Brilliance Engine',
    type: 'faceting',
    description: 'Maximizes light refraction for ultimate sparkle',
    effects: {
      facetSpeedBonus: 0.50,
      facetQualityBonus: 20,
      brillianceBonus: 20,
    },
    cost: 60000,
    unlockLevel: 50,
  },
};

/**
 * Get process equipment by ID
 * @param {string} id - Equipment ID
 * @returns {object|null} Equipment object or null if not found
 */
export function getProcessEquipmentById(id) {
  return Object.values(PROCESS_EQUIPMENT).find(e => e.id === id) || null;
}

/**
 * Get all owned process equipment from a list of IDs
 * @param {string[]} ownedIds - Array of owned equipment IDs
 * @returns {object[]} Array of equipment objects
 */
export function getOwnedProcessEquipment(ownedIds) {
  return ownedIds.map(id => getProcessEquipmentById(id)).filter(Boolean);
}

/**
 * Get equipment filtered by process type
 * @param {string} processType - Type of process (cleaning, cutting, faceting)
 * @returns {object[]} Array of equipment for the process type
 */
export function getEquipmentForProcess(processType) {
  return Object.values(PROCESS_EQUIPMENT).filter(e => e.type === processType);
}

/**
 * Get equipment available at a given level
 * @param {number} level - Player level
 * @returns {object[]} Array of equipment available at the level
 */
export function getAvailableProcessEquipment(level) {
  return Object.values(PROCESS_EQUIPMENT).filter(e => e.unlockLevel <= level);
}

/**
 * Check if player can afford equipment
 * @param {number} coins - Player's coins
 * @param {string} equipmentId - Equipment ID
 * @returns {boolean} Whether the player can afford the equipment
 */
export function canAffordProcessEquipment(coins, equipmentId) {
  const equipment = getProcessEquipmentById(equipmentId);
  if (!equipment) return false;
  return coins >= equipment.cost;
}
