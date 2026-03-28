import { useState } from 'react';
import { useGame, CLEAR_DISCOVER_SELECTION, SELECT_LOCATION } from '../../../context/GameContext';
import { LOOT_TABLES } from '../../../data/lootTables';
import { canUnlockZone, getZoneRequirements } from '../../../shared/utils/zoneUnlock';
import { getItemById } from '../../../data/items';

function RequirementTooltip({ requirements, locationKey }) {
  const location = LOOT_TABLES[locationKey];
  
  return (
    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl min-w-[200px]">
      <div className="text-sm font-bold text-red-400 mb-2">🔒 Requirements:</div>
      {requirements.map((req, idx) => (
        <div key={idx} className="text-xs text-slate-300 mb-1">
          {req.type === 'level' && (
            <span>⭐ Level {req.required} (you: {req.current})</span>
          )}
          {req.type === 'equipment' && (
            <span>🔧 {req.requiredName || req.required}</span>
          )}
          {req.type === 'material' && (
            <span>
              💎 {getItemById(req.id)?.name || req.id}: {req.current}/{req.required}
            </span>
          )}
        </div>
      ))}
      {location?.type && (
        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
          Type: {location.type}
        </div>
      )}
    </div>
  );
}

export function LocationSelector() {
  const { state, dispatch } = useGame();
  const [hoveredLocation, setHoveredLocation] = useState(null);
  
  // Create player object for zone unlock checks
  const player = {
    level: Math.floor((state.player?.shiftPoints || 0) / 100),
    inventory: state.player?.inventory || { minerals: [], gems: [], equipment: [] }
  };

  // Get unlocked zones from state
  const unlockedZones = state.unlockedZones || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-yellow-400">Select Mine Location</h2>
        <button
          className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          onClick={() => dispatch({ type: CLEAR_DISCOVER_SELECTION })}
        >
          ← Back
        </button>
      </div>

      <div className="text-slate-400 mb-4">
        Your Level: {player.level} | Shift Points: {state.player?.shiftPoints || 0}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(LOOT_TABLES).map(([key, location]) => {
            // Check zone unlock status using the new system
            const zoneStatus = canUnlockZone(player, key);
            const isUnlocked = zoneStatus.unlocked || unlockedZones.includes(key);
            const requirements = zoneStatus.requirements;
            
            return (
              <div key={key} className="relative">
                <button
                  disabled={!isUnlocked}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isUnlocked
                      ? 'border-gray-600 bg-slate-800 hover:border-yellow-500 hover:bg-slate-700 cursor-pointer'
                      : 'border-gray-700 bg-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => isUnlocked && dispatch({ type: SELECT_LOCATION, payload: key })}
                  onMouseEnter={() => !isUnlocked && setHoveredLocation(key)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  <div className="text-3xl mb-2">🏔️</div>
                  <div className="font-bold text-white">{location.name}</div>
                  {isUnlocked ? (
                    <div className="text-xs text-green-400 mt-1">✓ Unlocked</div>
                  ) : (
                    <div className="text-sm text-slate-500 mt-1">
                      🔒 {requirements.length} requirement{requirements.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {location.type === 'mineral' && (
                    <div className="text-xs text-blue-400 mt-1">💎 Minerals</div>
                  )}
                  {location.type === 'gem' && (
                    <div className="text-xs text-purple-400 mt-1">✨ Gems</div>
                  )}
                </button>
                
                {/* Show requirements tooltip on hover for locked zones */}
                {!isUnlocked && hoveredLocation === key && requirements.length > 0 && (
                  <RequirementTooltip requirements={requirements} locationKey={key} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LocationSelector;
