import { useState } from 'react';
import { useGame, GAME_PHASES, SET_REWARDS } from '../../../context/GameContext';
import { rollLoot } from '../../../data/lootTables';

export default function TempMinigame() {
  const { state, dispatch } = useGame();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [currentRewards, setCurrentRewards] = useState(null);

  const { discoverState } = state;
  const location = discoverState.selectedLocation;
  const area = discoverState.selectedArea;

  const handleStartArea = () => {
    setIsPlaying(true);
  };

  const handleCompleteArea = () => {
    // Roll for rewards
    const rewards = rollLoot(location, area, 2, 1);
    
    // Update state with rewards
    dispatch({
      type: SET_REWARDS,
      payload: rewards
    });
    
    setCurrentRewards(rewards);
    setShowRewards(true);
  };

  const handleClaimRewards = () => {
    dispatch({ type: GAME_PHASES.DISCOVER });
    setIsPlaying(false);
    setShowRewards(false);
    setCurrentRewards(null);
  };

  // Show rewards summary screen
  if (showRewards && currentRewards) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">Area Completed!</h2>
          <p className="text-slate-400">{currentRewards.location} - {currentRewards.area}</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 w-full max-w-md mb-6">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-xl font-bold text-yellow-400">+{currentRewards.coins}</div>
              <div className="text-sm text-slate-400">coins earned</div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl">⭐</span>
            <div>
              <div className="text-xl font-bold text-purple-400">+{currentRewards.shift}</div>
              <div className="text-sm text-slate-400">shift points</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-3">Gems Found ({currentRewards.gems?.length || 0})</h3>
            <div className="grid grid-cols-2 gap-3">
              {currentRewards.gems?.map((gem, index) => (
                <div key={`${gem.id}-${index}`} className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">💎</div>
                  <div>
                    <div className="font-bold text-white text-sm">{gem.name || gem.id}</div>
                    <div className="text-xs font-semibold text-gray-400">{gem.rarity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            onClick={() => {
              dispatch({ type: GAME_PHASES.DISCOVER });
              setIsPlaying(false);
              setShowRewards(false);
            }}
          >
            ← Back to Discover
          </button>
          <button
            className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            onClick={handleClaimRewards}
          >
            Claim Rewards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">Area: {area}</h2>
        <p className="text-slate-400">Location: {location}</p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-8 w-full max-w-md text-center mb-6">
        {!isPlaying ? (
          <>
            <p className="text-slate-300 mb-6">Ready to explore this area?</p>
            <button
              className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-lg"
              onClick={handleStartArea}
            >
              Start Exploration
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-300 mb-6">Exploring the area...</p>
            <div className="animate-pulse">
              <span className="text-4xl">💎</span>
            </div>
            <button
              className="mt-6 px-8 py-4 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors text-lg"
              onClick={handleCompleteArea}
            >
              Complete Exploration
            </button>
          </>
        )}
      </div>

      <button
        className="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        onClick={() => dispatch({ type: GAME_PHASES.DISCOVER })}
      >
        ← Back to Discover
      </button>
    </div>
  );
}
