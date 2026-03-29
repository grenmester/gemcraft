import { useGame, SELECT_LOCATION, SELECT_AREA } from '../../../context/GameContext';
import { LOOT_TABLES } from '../../../data/lootTables';
import { getItemById } from '../../../data/items';
import { GemIcon } from '../../../shared/components/ItemIcons';
import { FaArrowLeft } from 'react-icons/fa';

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

function AreaItemPreview({ items }) {
  // Get unique items and separate gems from minerals
  const uniqueItems = [];
  const seen = new Set();
  
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      uniqueItems.push(item);
    }
    if (uniqueItems.length >= 4) break;
  }
  
  const gems = uniqueItems.filter(i => {
    const data = getItemById(i.id);
    return data?.category === 'Gem';
  });
  
  const minerals = uniqueItems.filter(i => {
    const data = getItemById(i.id);
    return data?.category === 'Mineral';
  });

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {gems.slice(0, 2).map((item, idx) => {
        const data = getItemById(item.id);
        return (
          <span key={`gem-${idx}`} className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded">
            <GemIcon className="text-purple-400 text-sm" /> {data?.name || item.id}
          </span>
        );
      })}
      {minerals.slice(0, 2).map((item, idx) => {
        const data = getItemById(item.id);
        return (
          <span key={`mineral-${idx}`} className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">
            <GemIcon className="text-blue-400 text-sm" /> {data?.name || item.id}
          </span>
        );
      })}
      {items.length > 4 && (
        <span className="text-xs text-slate-500">+{items.length - 4} more</span>
      )}
    </div>
  );
}

export function SubareaSelector() {
  const { state, dispatch } = useGame();
  const location = LOOT_TABLES[state.discoverState.selectedLocation];

  if (!location) {
    return null;
  }

  const playerLevel = Math.floor((state.player?.shiftPoints || 0) / 100);

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
          <FaArrowLeft /> Locations
        </button>
      </div>

      {/* Location type indicator */}
      <div className="flex gap-4 mb-4">
        <span className={`text-sm px-2 py-1 rounded ${
          location.type === 'gem' ? 'bg-purple-900/50 text-purple-300' :
          location.type === 'mineral' ? 'bg-blue-900/50 text-blue-300' :
          'bg-slate-700 text-slate-300'
        }`}>
          {location.type === 'gem' && <><GemIcon className="text-purple-400" /> Gems Only</>}
          {location.type === 'mineral' && <><GemIcon className="text-blue-400" /> Minerals Only</>}
          {location.type === 'mixed' && <><GemIcon className="text-amber-400" /> Mixed (Gems & Minerals)</>}
        </span>
      </div>

      <p className="text-slate-400 mb-6">Select an area to explore</p>

      {/* Area grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(location.areas).map(([areaKey, area]) => {
            // Calculate gems vs minerals in this area
            const gemCount = area.items.filter(i => getItemById(i.id)?.category === 'Gem').length;
            const mineralCount = area.items.filter(i => getItemById(i.id)?.category === 'Mineral').length;
            
            return (
              <button
                key={areaKey}
                className="p-5 bg-slate-800 border-2 border-slate-600 rounded-xl hover:border-yellow-500 transition-all text-left"
                onClick={() => dispatch({ type: SELECT_AREA, payload: areaKey })}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white">{area.name}</h3>
                  <DifficultyStars difficulty={area.difficulty} />
                </div>
                
                {/* Rewards preview */}
                <div className="text-sm text-slate-400 mb-2">
                  {area.baseRewards.coins} coins • {area.baseRewards.items} item{area.baseRewards.items !== 1 ? 's' : ''}
                </div>
                
                {/* Gem/Mineral breakdown */}
                <div className="flex gap-3 text-xs mb-1">
                  {gemCount > 0 && (
                    <span className="text-purple-400"><GemIcon className="text-purple-400 text-xs" /> {gemCount} gem{gemCount !== 1 ? 's' : ''}</span>
                  )}
                  {mineralCount > 0 && (
                    <span className="text-blue-400"><GemIcon className="text-blue-400 text-xs" /> {mineralCount} mineral{mineralCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
                
                {/* Item preview */}
                <AreaItemPreview items={area.items} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubareaSelector;
