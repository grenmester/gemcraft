import { useGame, SET_PHASE } from '../context/GameContext';
import gemsData from '../data/gems.json';
import { LOCATION_TIERS } from '../constants';

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 to-slate-800">
      <div className="flex justify-between items-center p-4 bg-black/50 border-b-2 border-yellow-400/30">
        <h2 className="text-2xl font-bold text-yellow-400 m-0">{location?.name || 'Unknown Location'}</h2>
        <span className="bg-gradient-to-br from-red-400 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">Testing Mode</span>
      </div>

      <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
        <p className="text-gray-400 text-center mb-8 text-base max-w-md">
          Select a reward tier to simulate completing this location's minigame.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-md">
          {Object.entries(REWARD_CONFIG).map(([tier, config]) => (
            <button
              key={tier}
              className="flex flex-col items-center p-5 bg-white/5 border-2 rounded-xl cursor-pointer transition-all hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 w-full"
              style={{ borderColor: config.color }}
              onClick={() => handleSelectReward(tier)}
            >
              <span className="text-lg font-bold mb-3" style={{ color: config.color }}>{config.label} Reward</span>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="text-gray-200 text-sm">💰 {config.coins} coins</span>
                <span className="text-gray-200 text-sm">💎 {config.gems} gem(s)</span>
                <span className="text-gray-200 text-sm">⭐ {config.shift} shift point(s)</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="bg-slate-700 text-white font-semibold px-6 py-3 mx-4 mb-4 rounded-lg hover:bg-slate-600 transition-colors" onClick={handleBack}>
        ← Back to Map
      </button>
    </div>
  );
}
