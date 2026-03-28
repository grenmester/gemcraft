import { useState } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { LOCATION_TIERS, getUnlockedLocations } from '../constants';
import './LocationMap.css';

export default function LocationMap() {
  const { state, dispatch } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  const unlockedLocations = getUnlockedLocations(playerLevel);

  const locationEntries = Object.entries(LOCATION_TIERS);

  const handleLocationSelect = (locationKey) => {
    if (!unlockedLocations.includes(locationKey)) return;
    setSelectedLocation(locationKey);
  };

  const handleStartMinigame = () => {
    if (!selectedLocation) return;
    dispatch({ type: 'SET_PHASE', payload: selectedLocation });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
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
          return (
            <div
              key={key}
              className={`location-card ${isUnlocked ? 'unlocked' : 'locked'} ${selectedLocation === key ? 'selected' : ''}`}
              onClick={() => handleLocationSelect(key)}
              style={{ '--location-color': location.color }}
            >
              <div className="location-icon">
                {isUnlocked ? '🗺️' : '🔒'}
              </div>
              <div className="location-name">{location.name}</div>
              <div className="location-level">Lv. {location.unlockLevel}</div>
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
