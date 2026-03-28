import { useGame, SELECT_AREA, SET_REWARDS } from '../../../context/GameContext';
import { LOOT_TABLES, rollLoot, REWARD_MULTIPLIERS, getGemById } from '../../../data/lootTables';

const DIFFICULTY_CONFIG = {
  1: { label: 'Easy', color: '#4CAF50', multiplier: 1.0 },
  2: { label: 'Standard', color: '#2196F3', multiplier: 1.5 },
  3: { label: 'Difficult', color: '#9C27B0', multiplier: 2.0 }
};

export default function RewardsSelector() {
  const { state, dispatch } = useGame();
  const locationKey = state.discoverState.selectedLocation;
  const areaKey = state.discoverState.selectedArea;
  const location = LOOT_TABLES[locationKey];
  const area = location?.areas[areaKey];

  const handleSelectReward = (difficulty) => {
    if (!area || !locationKey || !areaKey) return;

    const multiplier = REWARD_MULTIPLIERS[difficulty];
    const gemsToRoll = Math.floor(area.baseRewards.gems * multiplier.gems);
    const { gems, coins, shift } = rollLoot(locationKey, areaKey, gemsToRoll, difficulty);
    
    const coinsEarned = Math.floor(area.baseRewards.coins * multiplier.coins);
    const shiftEarned = Math.floor(area.baseRewards.shift * multiplier.shift);
    
    // Add rewards to player
    dispatch({ type: 'ADD_COINS', payload: coinsEarned });
    dispatch({ type: 'ADD_SHIFT_POINTS', payload: shiftEarned });
    
    gems.forEach(gem => {
      dispatch({ type: 'DEBUG_ADD_GEM', payload: gem });
    });
    
    // Store for summary screen - App.jsx routing will show RewardsSummary when lastRewards is set
    dispatch({ 
      type: SET_REWARDS, 
      payload: { 
        coins: coinsEarned, 
        shift: shiftEarned, 
        gems,
        area: area.name,
        location: location.name
      } 
    });
  };
  
  const handleBack = () => {
    dispatch({ type: SELECT_AREA, payload: null });
  };

  if (!location || !area) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 to-slate-800 items-center justify-center">
        <p className="text-gray-400">No area selected</p>
        <button 
          className="mt-4 bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
          onClick={handleBack}
        >
          ← Back to Areas
        </button>
      </div>
    );
  }

  const difficultyOptions = [1, 2, 3].map(d => ({
    key: d,
    label: DIFFICULTY_CONFIG[d].label,
    color: DIFFICULTY_CONFIG[d].color,
    multiplier: DIFFICULTY_CONFIG[d].multiplier,
    unlocked: d <= area.difficulty
  }));

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 to-slate-800">
      <div className="flex justify-between items-center p-4 bg-black/50 border-b-2 border-yellow-400/30">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 m-0">{area.name}</h2>
          <p className="text-sm text-slate-400 m-0">{location.name}</p>
        </div>
        <span className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
          Difficulty {area.difficulty}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-base max-w-md mb-2">
            Select a difficulty to begin your expedition.
          </p>
          <p className="text-sm text-slate-500">
            Higher difficulty means greater rewards, but requires more skill.
          </p>
        </div>

        {/* Expected loot preview */}
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 w-full max-w-md">
          <p className="text-sm text-slate-400 mb-2">Possible finds:</p>
          <div className="flex flex-wrap gap-2">
            {area.gems.slice(0, 4).map((gem, idx) => {
              const gemData = getGemById(gem.id);
              return (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300"
                >
                  {gemData?.name || gem.id}
                </span>
              );
            })}
          </div>
        </div>

        {/* Base rewards display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20 w-full max-w-md">
          <p className="text-sm text-yellow-400 mb-2 font-medium">Base Rewards</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <span className="text-xl">💰</span>
              <p className="text-sm text-slate-300">{area.baseRewards.coins}</p>
            </div>
            <div className="text-center">
              <span className="text-xl">💎</span>
              <p className="text-sm text-slate-300">{area.baseRewards.gems} gems</p>
            </div>
            <div className="text-center">
              <span className="text-xl">⭐</span>
              <p className="text-sm text-slate-300">{area.baseRewards.shift}</p>
            </div>
          </div>
        </div>

        {/* Difficulty options */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          {difficultyOptions.map(({ key, label, color, multiplier, unlocked }) => (
            <button
              key={key}
              className={`
                flex flex-col items-center p-5 rounded-xl transition-all w-full
                ${unlocked 
                  ? 'bg-white/5 border-2 cursor-pointer hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0' 
                  : 'bg-white/5 border-2 border-slate-700 cursor-not-allowed opacity-50'
                }
              `}
              style={{ borderColor: unlocked ? color : undefined }}
              onClick={() => unlocked && handleSelectReward(key)}
              disabled={!unlocked}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold" style={{ color }}>{label}</span>
                {!unlocked && (
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                    Locked
                  </span>
                )}
              </div>
              
              {unlocked && (
                <>
                  <p className="text-xs text-slate-400 mb-3">
                    {multiplier}x rewards
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <span className="text-gray-200 text-sm">
                      💰 {Math.floor(area.baseRewards.coins * multiplier)} coins
                    </span>
                    <span className="text-gray-200 text-sm">
                      💎 {Math.floor(area.baseRewards.gems * multiplier)} gems
                    </span>
                    <span className="text-gray-200 text-sm">
                      ⭐ {Math.floor(area.baseRewards.shift * (key === 1 ? 1 : key === 2 ? 2 : 3))} shift
                    </span>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <button 
        className="bg-slate-700 text-white font-semibold px-6 py-3 mx-4 mb-4 rounded-lg hover:bg-slate-600 transition-colors"
        onClick={handleBack}
      >
        ← Back to Areas
      </button>
    </div>
  );
}
