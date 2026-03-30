const SHIFT_POINTS_PER_LEVEL = 100;

export function checkLocationRequirements(location, playerState) {
  if (!location || !playerState) {
    return { met: false, requirements: [] };
  }

  const requirements = [];
  const level = Math.floor((playerState.shiftPoints || 0) / SHIFT_POINTS_PER_LEVEL);
  
  // Level requirement
  requirements.push({
    type: 'level',
    needed: location.unlockLevel,
    current: level,
    met: level >= location.unlockLevel
  });
  
  // Equipment requirement (if any)
  if (location.requiredEquipment) {
    requirements.push({
      type: 'equipment',
      equipmentId: location.requiredEquipment,
      met: playerState.equipment?.includes(location.requiredEquipment) || false
    });
  }
  
  return {
    met: requirements.every(r => r.met),
    requirements
  };
}

export function getRequirementIcon(type) {
  const icons = {
    level: '⭐',
    equipment: '🔧',
    resource: '💎', // Future: resource gathering requirements
    time: '⏱️',     // Future: time-limited locations
    score: '🎯'     // Future: score-based unlocks
  };
  return icons[type] || '📋';
}
