import { useGame, CLEAR_DISCOVER_SELECTION, GAME_PHASES } from '../../../context/GameContext';
import { getItemById } from '../../../data/lootTables';

export default function RewardsSummary() {
  const { state, dispatch } = useGame();
  const rewards = state.discoverState.lastRewards;

  if (!rewards) {
    return (
      <div className="p-4 text-center">
        No rewards found.{' '}
        <button
          onClick={() => dispatch({ type: CLEAR_DISCOVER_SELECTION })}
          className="text-yellow-400 hover:text-yellow-300 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const rarityColors = {
    COMMON: '#A0A0A0',
    UNCOMMON: '#4CAF50',
    RARE: '#2196F3',
    EPIC: '#9C27B0',
    LEGENDARY: '#FF9800'
  };

  // Separate gems and minerals for display
  const gems = rewards.gems || [];
  const minerals = rewards.minerals || [];
  const totalItems = gems.length + minerals.length;

  return (
    <div className="flex flex-col h-full items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">Area Completed!</h2>
        <p className="text-slate-400">{rewards.location} - {rewards.area}</p>
      </div>

      {/* Reward summary card */}
      <div className="bg-slate-800/50 rounded-2xl p-6 w-full max-w-md mb-6">
        {/* Coins */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700">
          <span className="text-3xl">💰</span>
          <div>
            <div className="text-xl font-bold text-yellow-400">+{rewards.coins}</div>
            <div className="text-sm text-slate-400">coins earned</div>
          </div>
        </div>

        {/* Items found summary */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl">📦</span>
          <div>
            <div className="text-xl font-bold text-emerald-400">+{totalItems}</div>
            <div className="text-sm text-slate-400">items found</div>
          </div>
        </div>

        {/* Gems */}
        {gems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-purple-400 mb-3">
              ✨ Gems ({gems.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {gems.map((gem, index) => {
                const gemData = getItemById(gem.id);
                return (
                  <div key={`gem-${gem.id}-${index}`} className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center text-xl">
                      ✨
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{gemData?.name || gem.id}</div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: rarityColors[gem.rarity] }}
                      >
                        {gem.rarity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Minerals */}
        {minerals.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-3">
              💎 Minerals ({minerals.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {minerals.map((mineral, index) => {
                const mineralData = getItemById(mineral.id);
                return (
                  <div key={`mineral-${mineral.id}-${index}`} className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-xl">
                      💎
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{mineralData?.name || mineral.id}</div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: rarityColors[mineral.rarity] }}
                      >
                        {mineral.rarity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No items found message */}
        {totalItems === 0 && (
          <div className="text-center py-4 text-slate-500">
            No items found this time. Better luck next expedition!
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          onClick={() => dispatch({ type: CLEAR_DISCOVER_SELECTION })}
        >
          ← Back to Discover
        </button>
        <button
          className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          onClick={() => dispatch({ type: CLEAR_DISCOVER_SELECTION })}
        >
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
}
