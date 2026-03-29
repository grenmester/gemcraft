import { useState } from 'react';
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { LOCATION_TIERS, getUnlockedLocations } from '../../../data/locations';
import { canUnlockZone, getZoneRequirements } from '../../../shared/utils/zoneUnlock';
import { getItemById } from '../../../data/items';
import { getEquipmentById } from '../../../data/equipment';
import { GemIcon } from '../../../shared/components/ItemIcons';
import { FaStar, FaArrowLeft } from 'react-icons/fa';

const SHIFT_POINTS_PER_LEVEL = 100;

export default function LocationMap() {
  const { state, dispatch } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expandedLocation, setExpandedLocation] = useState(null);

  const playerLevel = Math.floor((state.player.shiftPoints || 0) / SHIFT_POINTS_PER_LEVEL);
  
  // Create player object for zone unlock checks
  const player = {
    level: playerLevel,
    inventory: state.player?.inventory || { minerals: [], gems: [], equipment: [] }
  };
  
  const unlockedZones = state.unlockedZones || [];

  const locationEntries = Object.entries(LOCATION_TIERS);

  const handleLocationSelect = (locationKey) => {
    const zoneStatus = canUnlockZone(player, locationKey);
    const isUnlocked = zoneStatus.unlocked || unlockedZones.includes(locationKey);
    
    if (isUnlocked) {
      setSelectedLocation(locationKey);
      setExpandedLocation(null);
    } else {
      setExpandedLocation(expandedLocation === locationKey ? null : locationKey);
    }
  };

  const handleStartMinigame = () => {
    if (!selectedLocation) return;
    dispatch({ type: 'SET_PHASE', payload: selectedLocation });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  };

  const renderRequirementProgress = (requirement, locationKey) => {
    if (requirement.type === 'level') {
      const progress = Math.min(100, (requirement.current / requirement.required) * 100);
      return (
        <div className="w-full flex flex-col gap-1 mt-1" key={requirement.type}>
          <span className="text-[0.65rem] text-gray-400">
            <FaStar className="text-yellow-400" /> Level {requirement.current}/{requirement.required}
          </span>
          <div className="w-full h-1.5 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-yellow-400 rounded transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      );
    }
    if (requirement.type === 'equipment') {
      const eqData = getEquipmentById(requirement.required);
      return (
        <div className={`text-[0.65rem] flex items-center gap-1 ${requirement.met ? 'text-teal-400' : 'text-red-400'}`} key={requirement.type}>
          🔧 {eqData?.name || requirement.required}
          {requirement.met ? ' ✓' : ' ✗'}
        </div>
      );
    }
    if (requirement.type === 'material') {
      const itemData = getItemById(requirement.id);
      const progress = Math.min(100, (requirement.current / requirement.required) * 100);
      return (
        <div className="w-full flex flex-col gap-1 mt-1" key={`material-${requirement.id}`}>
          <span className="text-[0.65rem] text-gray-400">
            <GemIcon className="text-blue-400" /> {itemData?.name || requirement.id}: {requirement.current}/{requirement.required}
          </span>
          <div className="w-full h-1.5 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col min-h-full p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-yellow-400 m-0">World Map</h2>
        <div className="flex gap-4 text-gray-400 text-sm">
          <span>Level: {playerLevel}</span>
          <span>Shift: {state.player.shiftPoints || 0}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-y-auto pb-24 md:pb-28">
        {locationEntries.map(([key, location]) => {
          const zoneStatus = canUnlockZone(player, key);
          const isUnlocked = zoneStatus.unlocked || unlockedZones.includes(key);
          const isSelected = selectedLocation === key;
          const isExpanded = expandedLocation === key;
          const requirements = zoneStatus.requirements;

          return (
            <div
              key={key}
              className={`
                relative bg-white/5 border-2 border-transparent rounded-xl p-4 text-center cursor-pointer transition-all min-h-[100px]
                flex flex-col items-center justify-center gap-1
                ${isUnlocked ? 'hover:bg-white/10 hover:-translate-y-0.5' : 'opacity-60 hover:opacity-80 hover:bg-white/5'}
                ${isSelected ? 'border-2 border-current bg-white/15' : ''}
                ${isExpanded && !isUnlocked ? 'opacity-100 border-yellow-400' : ''}
              `}
              style={{ borderColor: isSelected ? location.color : undefined }}
              onClick={() => handleLocationSelect(key)}
            >
              <div className="text-2xl md:text-3xl">
                {isUnlocked ? '🗺️' : '🔒'}
              </div>
              <div className="font-bold text-sm" style={{ color: location.color }}>{location.name}</div>

              {isUnlocked ? (
                <div className="text-xs text-gray-500">Lv. {location.unlockLevel}</div>
              ) : (
                <>
                  <div className="text-xs font-bold text-red-400">
                    Lv. {playerLevel}/{location.unlockLevel}
                  </div>
                  {requirements.map(req => renderRequirementProgress(req, key))}
                </>
              )}

              {isExpanded && !isUnlocked && (
                <div className="mt-2 pt-2 border-t border-white/10 w-full">
                  {requirements.map((req, i) => {
                    if (req.type === 'level') {
                      const needed = (req.required - req.current) * SHIFT_POINTS_PER_LEVEL;
                      return (
                        <div key={i} className="text-[0.65rem] text-red-400 text-center">
                          Need {needed} more shift points to unlock
                        </div>
                      );
                    }
                    if (req.type === 'equipment') {
                      const eqData = getEquipmentById(req.required);
                      return (
                        <div key={i} className="text-[0.65rem] text-red-400 text-center">
                          Need: {eqData?.name || req.required}
                        </div>
                      );
                    }
                    if (req.type === 'material') {
                      const itemData = getItemById(req.id);
                      return (
                        <div key={i} className="text-[0.65rem] text-red-400 text-center">
                          Need: {itemData?.name || req.id} x{req.required - req.current}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedLocation && (
        <div className="fixed bottom-20 md:bottom-24 left-4 md:left-6 right-4 md:right-6 p-3 bg-black/80 rounded-lg flex justify-center">
          <button className="bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 font-semibold px-6 py-3 rounded-lg hover:from-yellow-300 hover:to-amber-400 transition-all hover:-translate-y-0.5" onClick={handleStartMinigame}>
            Start {LOCATION_TIERS[selectedLocation].name}
          </button>
        </div>
      )}

      <button className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors" onClick={handleBack}>
        <FaArrowLeft /> Back to Discover
      </button>
    </div>
  );
}
