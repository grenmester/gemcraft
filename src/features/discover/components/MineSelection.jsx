import { useGame, SELECT_MINE } from '../../../context/GameContext';
import { LOCATION_TIERS } from '../../../loaders/locations';
import { FaMapMarkedAlt, FaChevronRight, FaLock } from 'react-icons/fa';

const TIER_COLORS = {
  1: { bg: 'bg-slate-600', text: 'text-slate-200', label: 'Beginner' },
  2: { bg: 'bg-green-700', text: 'text-green-200', label: 'Novice' },
  3: { bg: 'bg-purple-700', text: 'text-purple-200', label: 'Journeyman' },
  4: { bg: 'bg-yellow-700', text: 'text-yellow-200', label: 'Expert' },
  5: { bg: 'bg-red-700', text: 'text-red-200', label: 'Master' }
};

const TIER_DESCRIPTIONS = {
  TIER_1: 'A gentle stream where beginners find their first gems.',
  TIER_1_B: 'Rolling hills with hidden mineral deposits.',
  TIER_1_C: 'Fertile fields with gem-bearing soil.',
  TIER_2_A: 'Shorelines rich in amethyst deposits.',
  TIER_2_B: 'Historic mines with quartz crystals.',
  TIER_2_C: 'Mountain streambeds with mixed minerals.',
  TIER_3_A: 'Brazilian mines famous for tourmaline.',
  TIER_3_B: 'Legendary Burmese valley of rubies.',
  TIER_3_C: 'Ceylonese gem-rich paddy fields.',
  TIER_4_A: 'Colombian highlands with emeralds.',
  TIER_4_B: 'Himalayan slopes with lapis lazuli.',
  TIER_4_C: 'Australian caves of pink diamonds.',
  TIER_5_A: 'Ancient Golconda mines of India.',
  TIER_5_B: 'Madagascar\'s gem-filled dunes.',
  TIER_5_C: 'Legendary Burmese secret valley.'
};

function getTierFromId(id) {
  if (id.startsWith('TIER_5')) return 5;
  if (id.startsWith('TIER_4')) return 4;
  if (id.startsWith('TIER_3')) return 3;
  if (id.startsWith('TIER_2')) return 2;
  return 1;
}

export default function MineSelection() {
  const { state, dispatch } = useGame();
  const unlockedZones = state.unlockedZones || [];
  
  const handleSelectMine = (mineId) => {
    dispatch({ type: SELECT_MINE, payload: mineId });
  };
  
  const isUnlocked = (mineId) => {
    return unlockedZones.includes(mineId) || mineId === 'TIER_1';
  };
  
  const getTier = (mineId) => getTierFromId(mineId);
  const tierStyle = (mineId) => TIER_COLORS[getTier(mineId)] || TIER_COLORS[1];
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg text-white flex items-center gap-2">
          <FaMapMarkedAlt className="text-yellow-400" />
          Mine Selection
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(LOCATION_TIERS).map(([id, location]) => {
          const unlocked = isUnlocked(id);
          const tier = getTier(id);
          const style = tierStyle(id);
          const description = TIER_DESCRIPTIONS[id] || location.description || 'A mining location.';
          
          return (
            <button
              key={id}
              onClick={() => unlocked && handleSelectMine(id)}
              disabled={!unlocked}
              className={`relative p-4 rounded-xl text-left transition-all ${
                unlocked
                  ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 cursor-pointer'
                  : 'bg-slate-900 opacity-60 cursor-not-allowed border border-slate-800'
              }`}
            >
              {!unlocked && (
                <div className="absolute top-2 right-2">
                  <FaLock className="text-slate-500" size={16} />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                {unlocked && <FaChevronRight className="text-slate-500" />}
              </div>
              
              <h4 className={`font-bold mb-1 ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                {location.name}
              </h4>
              
              <p className={`text-xs ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                {unlocked ? description : `Unlocks at Level ${location.unlockLevel}`}
              </p>
              
              {!unlocked && location.unlockEquipment && location.unlockEquipment !== 'NONE' && (
                <div className="mt-2 text-xs text-slate-500">
                  Requires: {location.unlockEquipment.replace('_', ' ')}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
