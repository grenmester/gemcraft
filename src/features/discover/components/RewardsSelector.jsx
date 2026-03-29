import { useGame, SELECT_AREA, SET_REWARDS, ADD_MINERAL, ADD_TO_INVENTORY } from '../../../context/GameContext';
import { LOOT_TABLES, rollLoot, REWARD_MULTIPLIERS, getItemById, calculateEquipmentBonus } from '../../../data/lootTables';
import { EQUIPMENT } from '../../../data/equipment';
import { GemIcon } from '../../../shared/components/ItemIcons';
import { FaCoins, FaBox, FaArrowLeft } from 'react-icons/fa';

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
    const itemsToRoll = Math.floor(area.baseRewards.items * multiplier.items);

    // Get player's equipment for bonus calculation
    const playerEquipment = state.player?.inventory?.equipment || [];
    // Find the best equipment the player has (for drop rate bonuses)
    const activeEquipment = playerEquipment.filter(eqId => EQUIPMENT[eqId]);

    const { coins, items, bonusesApplied } = rollLoot(locationKey, areaKey, itemsToRoll, difficulty, {
      equipmentIds: activeEquipment,
    });

    const coinsEarned = Math.floor(area.baseRewards.coins * multiplier.coins);

    // Add coins to player
    dispatch({ type: 'ADD_COINS', payload: coinsEarned });

    // Separate gems and minerals for proper dispatch
    const gems = [];
    const minerals = [];

    items.forEach(item => {
      const itemData = getItemById(item.id);
      if (itemData?.category === 'Gem') {
        gems.push(item);
        // Add gem to inventory
        dispatch({ type: ADD_TO_INVENTORY, payload: { category: 'gems', gemId: item.id, quantity: 1 } });
      } else if (itemData?.category === 'Mineral') {
        minerals.push(item);
        // Add mineral to inventory using ADD_MINERAL action
        dispatch({ type: ADD_MINERAL, payload: { mineralId: item.id, quantity: 1 } });
      }
    });

    // Store for summary screen - includes both gems and minerals
    dispatch({
      type: SET_REWARDS,
      payload: {
        coins: coinsEarned,
        gems,
        minerals,
        items, // Keep full items array for reference
        area: area.name,
        location: location.name,
        bonusesApplied, // Include bonus info for display
      }
    });
  };

  const handleBack = () => {
    dispatch({ type: SELECT_AREA, payload: null });
  };

  if (!location || !area) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-gray-400">No area selected</p>
        <button
          className="mt-4 bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
          onClick={handleBack}
        >
          <FaArrowLeft /> Back to Areas
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

  // Separate items into gems and minerals for display
  const previewGems = area.items.filter(i => getItemById(i.id)?.category === 'Gem').slice(0, 2);
  const previewMinerals = area.items.filter(i => getItemById(i.id)?.category === 'Mineral').slice(0, 2);

  return (
      <div className="flex flex-col h-full">
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
          
          {/* Gems */}
          {previewGems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {previewGems.map((item, idx) => {
                const itemData = getItemById(item.id);
                return (
                  <span
                    key={`gem-${idx}`}
                    className="px-2 py-1 bg-purple-900/30 rounded text-xs text-purple-300"
                  >
                    <GemIcon className="text-purple-400 text-xs" /> {itemData?.name || item.id}
                  </span>
                );
              })}
            </div>
          )}
          
          {/* Minerals */}
          {previewMinerals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewMinerals.map((item, idx) => {
                const itemData = getItemById(item.id);
                return (
                  <span
                    key={`mineral-${idx}`}
                    className="px-2 py-1 bg-blue-900/30 rounded text-xs text-blue-300"
                  >
                    <GemIcon className="text-blue-400 text-xs" /> {itemData?.name || item.id}
                  </span>
                );
              })}
            </div>
          )}
          
          {area.items.length > 4 && (
            <p className="text-xs text-slate-500 mt-2">+{area.items.length - 4} more items</p>
          )}
        </div>

        {/* Base rewards display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20 w-full max-w-md">
          <p className="text-sm text-yellow-400 mb-2 font-medium">Base Rewards</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <span className="text-xl"><FaCoins /></span>
              <p className="text-sm text-slate-300">{area.baseRewards.coins}</p>
            </div>
            <div className="text-center">
              <span className="text-xl"><FaBox /></span>
              <p className="text-sm text-slate-300">{area.baseRewards.items} item{area.baseRewards.items !== 1 ? 's' : ''}</p>
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
                      <FaCoins /> {Math.floor(area.baseRewards.coins * multiplier)} coins
                    </span>
                    <span className="text-gray-200 text-sm">
                      <FaBox /> {Math.ceil(area.baseRewards.items * multiplier)} items
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
        <FaArrowLeft /> Back to Areas
      </button>
    </div>
  );
}
