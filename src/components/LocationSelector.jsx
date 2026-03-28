import { useGame, CLEAR_DISCOVER_SELECTION, SELECT_LOCATION } from '../context/GameContext';
import { LOOT_TABLES } from '../data/lootTables';

export function LocationSelector() {
  const { state, dispatch } = useGame();
  const playerLevel = Math.floor((state.player?.shiftPoints || 0) / 100);

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
        Your Level: {playerLevel} | Shift Points: {state.player?.shiftPoints || 0}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(LOOT_TABLES).map(([key, location]) => {
            const isUnlocked = playerLevel >= location.unlockLevel;
            
            return (
              <button
                key={key}
                disabled={!isUnlocked}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isUnlocked 
                    ? 'border-gray-600 bg-slate-800 hover:border-yellow-500 hover:bg-slate-700 cursor-pointer' 
                    : 'border-gray-700 bg-slate-900 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => isUnlocked && dispatch({ type: SELECT_LOCATION, payload: key })}
              >
                <div className="text-3xl mb-2">🏔️</div>
                <div className="font-bold text-white">{location.name}</div>
                {!isUnlocked && (
                  <div className="text-sm text-slate-500 mt-1">
                    🔒 Level {location.unlockLevel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LocationSelector;
