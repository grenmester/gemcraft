import { useGame, SET_PHASE } from '../context/GameContext';
import gemsData from '../data/gems.json';
import { LOCATION_TIERS } from '../constants';
import './TempMinigame.css';

const REWARD_CONFIG = {
  low: { coins: 50, gems: 1, shift: 1, label: 'Low', color: '#4CAF50' },
  medium: { coins: 100, gems: 2, shift: 3, label: 'Medium', color: '#2196F3' },
  high: { coins: 200, gems: 3, shift: 8, label: 'High', color: '#9C27B0' }
};

export default function TempMinigame() {
  const { state, dispatch } = useGame();
  const locationKey = state.phase;
  const location = LOCATION_TIERS[locationKey];

  const handleSelectReward = (tier) => {
    const rewards = REWARD_CONFIG[tier];
    
    dispatch({ type: 'ADD_COINS', payload: rewards.coins });
    dispatch({ type: 'ADD_SHIFT_POINTS', payload: rewards.shift });
    
    for (let i = 0; i < rewards.gems; i++) {
      const randomGem = gemsData.gems[Math.floor(Math.random() * gemsData.gems.length)];
      dispatch({ type: 'DEBUG_ADD_GEM', payload: { ...randomGem, instanceId: `temp_${Date.now()}_${i}` } });
    }
    
    dispatch({ type: SET_PHASE, payload: 'location_map' });
  };
  
  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: 'location_map' });
  };

  return (
    <div className="temp-minigame screen">
      <div className="temp-header">
        <h2 className="temp-title">{location?.name || 'Unknown Location'}</h2>
        <span className="temp-badge">Testing Mode</span>
      </div>

      <div className="temp-content">
        <p className="temp-description">
          Select a reward tier to simulate completing this location's minigame.
        </p>

        <div className="reward-options">
          {Object.entries(REWARD_CONFIG).map(([tier, config]) => (
            <button
              key={tier}
              className="reward-btn"
              style={{ '--reward-color': config.color }}
              onClick={() => handleSelectReward(tier)}
            >
              <span className="reward-tier">{config.label} Reward</span>
              <div className="reward-details">
                <span className="reward-item">💰 {config.coins} coins</span>
                <span className="reward-item">💎 {config.gems} gem(s)</span>
                <span className="reward-item">⭐ {config.shift} shift point(s)</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Map
      </button>
    </div>
  );
}
