import { useState } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { LOCATION_TIERS, getUnlockedLocations } from '../constants';
import { checkLocationRequirements, getRequirementIcon } from '../utils/requirements';
import './LocationMap.css';

const SHIFT_POINTS_PER_LEVEL = 100;

export default function LocationMap() {
  const { state, dispatch } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expandedLocation, setExpandedLocation] = useState(null);

  const playerLevel = Math.floor((state.player.shiftPoints || 0) / SHIFT_POINTS_PER_LEVEL);
  const unlockedLocations = getUnlockedLocations(playerLevel);

  const locationEntries = Object.entries(LOCATION_TIERS);

  const handleLocationSelect = (locationKey) => {
    if (unlockedLocations.includes(locationKey)) {
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

  const renderRequirementProgress = (requirement) => {
    if (requirement.type === 'level') {
      const progress = Math.min(100, (requirement.current / requirement.needed) * 100);
      return (
        <div className="requirement-progress" key={requirement.type}>
          <span className="requirement-label">
            {getRequirementIcon('level')} Level {requirement.current}/{requirement.needed}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      );
    }
    if (requirement.type === 'equipment') {
      return (
        <div className={`requirement-item ${requirement.met ? 'met' : ''}`} key={requirement.type}>
          {getRequirementIcon('equipment')} {requirement.equipmentId}
          {requirement.met ? ' ✓' : ' ✗'}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="location-map screen">
      <div className="map-header">
        <h2>World Map</h2>
        <div className="player-info">
          <span>Level: {playerLevel}</span>
          <span>Shift: {state.player.shiftPoints || 0}</span>
        </div>
      </div>

      <div className="locations-grid">
        {locationEntries.map(([key, location]) => {
          const isUnlocked = unlockedLocations.includes(key);
          const isSelected = selectedLocation === key;
          const isExpanded = expandedLocation === key;
          const requirements = checkLocationRequirements(location, state.player);

          return (
            <div
              key={key}
              className={`location-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => handleLocationSelect(key)}
              style={{ '--location-color': location.color }}
            >
              <div className="location-icon">
                {isUnlocked ? '🗺️' : '🔒'}
              </div>
              <div className="location-name">{location.name}</div>
              
              {isUnlocked ? (
                <div className="location-level">Lv. {location.unlockLevel}</div>
              ) : (
                <>
                  <div className="location-level locked-level">
                    Lv. {playerLevel}/{location.unlockLevel}
                  </div>
                  {requirements.requirements.map(renderRequirementProgress)}
                </>
              )}

              {isExpanded && !isUnlocked && (
                <div className="location-details">
                  {requirements.requirements.map((req, i) => {
                    if (req.type === 'level') {
                      const needed = req.needed - req.current;
                      return (
                        <div key={i} className="detail-item">
                          Need {needed} more shift points to unlock
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
        <div className="location-actions">
          <button className="btn btn-gold" onClick={handleStartMinigame}>
            Start {LOCATION_TIERS[selectedLocation].name}
          </button>
        </div>
      )}

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Discover
      </button>
    </div>
  );
}
