import { useGame, SELECT_LOCATION, SELECT_AREA } from '../../../context/GameContext';
import { LOOT_TABLES } from '../../../data/lootTables';

function DifficultyStars({ difficulty }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= difficulty ? 'text-yellow-400' : 'text-slate-600'}>
          ★
        </span>
      ))}
    </div>
  );
}

export function SubareaSelector() {
  const { state, dispatch } = useGame();
  const location = LOOT_TABLES[state.discoverState.selectedLocation];

  if (!location) {
    return null;
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: location.color }}>
          {location.name}
        </h2>
        <button 
          className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          onClick={() => dispatch({ type: SELECT_LOCATION, payload: null })}
        >
          ← Locations
        </button>
      </div>
      
      <p className="text-slate-400 mb-6">Select an area to explore</p>
      
      {/* Area grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(location.areas).map(([areaKey, area]) => (
            <button
              key={areaKey}
              className="p-5 bg-slate-800 border-2 border-slate-600 rounded-xl hover:border-yellow-500 transition-all text-left"
              onClick={() => dispatch({ type: SELECT_AREA, payload: areaKey })}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white">{area.name}</h3>
                <DifficultyStars difficulty={area.difficulty} />
              </div>
              <div className="text-sm text-slate-400">
                {area.baseRewards.gems}-{area.baseRewards.gems * 2} gems • {area.gems.length} types
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubareaSelector;
