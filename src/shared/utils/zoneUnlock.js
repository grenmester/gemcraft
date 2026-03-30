import { LOCATION_TIERS } from '../../loaders/locations.js';
import { EQUIPMENT, getEquipmentById } from '../../loaders/equipment.js';

/**
 * Check if a player can unlock a specific zone
 * @param {Object} player - Player object with level and inventory
 * @param {string} locationKey - The zone key (e.g., 'TIER_1_B')
 * @returns {Object} - { unlocked: boolean, requirements: Array }
 */
export const canUnlockZone = (player, locationKey) => {
  const location = LOCATION_TIERS[locationKey];
  if (!location) return { unlocked: false, requirements: [{ type: 'invalid_zone' }] };

  const checks = [];

  // Level check
  if (player.level < location.unlockLevel) {
    checks.push({
      type: 'level',
      required: location.unlockLevel,
      current: player.level
    });
  }

  // Equipment check
  if (location.unlockEquipment && location.unlockEquipment !== 'NONE') {
    const ownedEquipment = player.inventory?.equipment || [];
    if (!ownedEquipment.includes(location.unlockEquipment)) {
      checks.push({
        type: 'equipment',
        required: location.unlockEquipment,
        requiredName: getEquipmentById(location.unlockEquipment)?.name
      });
    }
  }

  // Materials check
  if (location.unlockMaterials) {
    for (const [materialId, required] of Object.entries(location.unlockMaterials)) {
      const current = player.inventory?.minerals?.find(m => m.id === materialId)?.quantity || 0;
      if (current < required) {
        checks.push({
          type: 'material',
          id: materialId,
          required,
          current
        });
      }
    }
  }

  return {
    unlocked: checks.length === 0,
    requirements: checks
  };
};

/**
 * Get the requirements for a specific zone
 * @param {string} locationKey - The zone key
 * @returns {Object|null} - Zone requirements or null if invalid
 */
export const getZoneRequirements = (locationKey) => {
  const location = LOCATION_TIERS[locationKey];
  if (!location) return null;

  return {
    level: location.unlockLevel,
    equipment: location.unlockEquipment,
    materials: location.unlockMaterials
  };
};

/**
 * Get the full status of a zone for a player
 * @param {Object} player - Player object
 * @param {string} locationKey - The zone key
 * @returns {Object} - Full status including requirements and location key
 */
export const getZoneStatus = (player, locationKey) => {
  const result = canUnlockZone(player, locationKey);
  return {
    ...result,
    locationKey
  };
};
