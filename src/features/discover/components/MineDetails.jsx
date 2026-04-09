import { useGame, SELECT_SUBAREA, CLEAR_MINING_SELECTION } from '../../../context/GameContext';
import { LOCATION_TIERS } from '../../../loaders/locations';
import { FaArrowLeft, FaUsers, FaMapMarkedAlt, FaChevronRight, FaGem } from 'react-icons/fa';

const SUBAREAS = {
  TIER_1: [
    { id: 'area_a', name: 'River Bend', description: 'A calm bend with excellent gem deposits', rarity: 'Common' },
    { id: 'area_b', name: 'Sandbar', description: 'Shallow waters with mixed minerals', rarity: 'Common' },
    { id: 'area_c', name: 'Rocky Shore', description: 'Challenging terrain with better finds', rarity: 'Uncommon' }
  ],
  TIER_1_B: [
    { id: 'area_a', name: 'Ozark Hollow', description: 'Hidden cave with crystal formations', rarity: 'Common' },
    { id: 'area_b', name: 'Hilltop Vista', description: 'Open terrain with surface deposits', rarity: 'Common' },
    { id: 'area_c', name: 'Creek Bed', description: 'Water-worn stones with embedded gems', rarity: 'Uncommon' }
  ],
  TIER_1_C: [
    { id: 'area_a', name: 'Field Edge', description: 'Border area with mixed deposits', rarity: 'Common' },
    { id: 'area_b', name: 'Bavarian Meadow', description: 'Fertile soil with mineral content', rarity: 'Common' },
    { id: 'area_c', name: 'Mountain Base', description: 'Rocky terrain with hidden treasures', rarity: 'Uncommon' }
  ],
  TIER_2_A: [
    { id: 'area_a', name: 'Ural Shore', description: 'Rocky beach with amethyst veins', rarity: 'Uncommon' },
    { id: 'area_b', name: 'Mineral Springs', description: 'Natural springs depositing minerals', rarity: 'Common' },
    { id: 'area_c', name: 'Crystal Cave', description: 'Underground cavern with quartz', rarity: 'Uncommon' }
  ],
  TIER_2_B: [
    { id: 'area_a', name: 'Quartz Vein', description: 'Rich vein of clear quartz', rarity: 'Common' },
    { id: 'area_b', name: 'Historic Shaft', description: 'Old mine workings with remnants', rarity: 'Uncommon' },
    { id: 'area_c', name: 'Gem Pocket', description: 'Hidden pocket of semi-precious stones', rarity: 'Uncommon' }
  ],
  TIER_2_C: [
    { id: 'area_a', name: 'Montana Ridge', description: 'Mountain ridge with garnet deposits', rarity: 'Uncommon' },
    { id: 'area_b', name: 'Stream Cut', description: 'Eroded bank with exposed minerals', rarity: 'Common' },
    { id: 'area_c', name: 'Drill Site', description: 'Active mining area with equipment', rarity: 'Uncommon' }
  ],
  TIER_3_A: [
    { id: 'area_a', name: 'Tourmaline Lode', description: 'Rich deposits of colored tourmaline', rarity: 'Rare' },
    { id: 'area_b', name: 'Emerald Field', description: 'Green mineral deposits', rarity: 'Uncommon' },
    { id: 'area_c', name: 'Topaz Hollow', description: 'Golden topaz in volcanic rock', rarity: 'Rare' }
  ],
  TIER_3_B: [
    { id: 'area_a', name: 'Ruby Streak', description: 'Famous red ruby deposits', rarity: 'Rare' },
    { id: 'area_b', name: 'Spinel Ridge', description: 'Pink spinel with ruby association', rarity: 'Rare' },
    { id: 'area_c', name: 'Sapphire Gorge', description: 'Blue sapphire in marble', rarity: 'Epic' }
  ],
  TIER_3_C: [
    { id: 'area_a', name: 'Ceylon Paddy', description: 'Rice paddy fields with gem gravels', rarity: 'Rare' },
    { id: 'area_b', name: 'Moonstone Beach', description: 'Beach with labradorite deposits', rarity: 'Rare' },
    { id: 'area_c', name: 'Catseye Valley', description: 'Rare chrysoberyl deposits', rarity: 'Epic' }
  ],
  TIER_4_A: [
    { id: 'area_a', name: 'Muzo Wall', description: 'Legendary emerald mine face', rarity: 'Epic' },
    { id: 'area_b', name: 'Alexandrite Ridge', description: 'Color-changing alexandrite deposits', rarity: 'Legendary' },
    { id: 'area_c', name: 'Colombian Deep', description: 'Deep shaft with rare finds', rarity: 'Epic' }
  ],
  TIER_4_B: [
    { id: 'area_a', name: 'Lapis Deposit', description: 'Deep blue lapis lazuli veins', rarity: 'Rare' },
    { id: 'area_b', name: 'Kashmir Sapphire', description: 'Premier Kashmir blue sapphire', rarity: 'Epic' },
    { id: 'area_c', name: 'Himalayan Deep', description: 'High altitude gem discovery', rarity: 'Epic' }
  ],
  TIER_4_C: [
    { id: 'area_a', name: 'Pink Diamond Zone', description: 'Rare pink diamond formation', rarity: 'Legendary' },
    { id: 'area_b', name: 'Argyle Pipe', description: 'Primary kimberlite pipe source', rarity: 'Epic' },
    { id: 'area_c', name: 'Fancy Color Vein', description: 'Champagne and cognac diamonds', rarity: 'Legendary' }
  ],
  TIER_5_A: [
    { id: 'area_a', name: 'Golconda Main', description: 'Historic diamond source', rarity: 'Legendary' },
    { id: 'area_b', name: 'Hope Vault', description: 'Rare blue diamond formation', rarity: 'Legendary' },
    { id: 'area_c', name: 'Koh-i-Noor Zone', description: 'Premier gem quality area', rarity: 'Legendary' }
  ],
  TIER_5_B: [
    { id: 'area_a', name: 'Androy Canyon', description: 'Grandidierite deposits', rarity: 'Legendary' },
    { id: 'area_b', name: 'Sapphire Flood', description: 'Alluvial blue sapphire deposits', rarity: 'Epic' },
    { id: 'area_c', name: 'Hidden Vein', description: 'Secret gem-bearing formation', rarity: 'Legendary' }
  ],
  TIER_5_C: [
    { id: 'area_a', name: 'Secret Valley', description: 'Legendary hidden gem location', rarity: 'Legendary' },
    { id: 'area_b', name: 'Burmese Deep', description: 'Premier ruby and sapphire source', rarity: 'Legendary' },
    { id: 'area_c', name: 'Panjshir Ridge', description: 'Famous emerald deposits', rarity: 'Legendary' }
  ]
};

const RARITY_COLORS = {
  Common: 'bg-gray-600',
  Uncommon: 'bg-green-600',
  Rare: 'bg-blue-600',
  Epic: 'bg-purple-600',
  Legendary: 'bg-yellow-600'
};

function getDefaultSubareas(mineId) {
  return SUBAREAS[mineId] || SUBAREAS.TIER_1;
}

export default function MineDetails({ mineId }) {
  const { state, dispatch } = useGame();
  const location = LOCATION_TIERS[mineId];
  const workers = state.player?.workers || [];
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const subareas = getDefaultSubareas(mineId);
  
  const handleBack = () => {
    dispatch({ type: CLEAR_MINING_SELECTION });
  };
  
  const handleSelectSubarea = (subareaId) => {
    dispatch({ type: SELECT_SUBAREA, payload: subareaId });
  };
  
  if (!location) {
    return <div className="text-white">Mine not found</div>;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white self-start transition-colors"
      >
        <FaArrowLeft /> Back to Mines
      </button>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <FaMapMarkedAlt className="text-yellow-400 text-xl" />
          <h2 className="text-2xl text-white font-bold">{location.name}</h2>
        </div>
        <p className="text-slate-400 mb-4">{location.description || 'A mining location.'}</p>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FaUsers />
          <span>Workers Assigned: {assignedWorkers.length}/3</span>
        </div>
        
        {assignedWorkers.length > 0 && (
          <div className="mt-3 space-y-2">
            {assignedWorkers.map(w => (
              <div key={w.id} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{w.workerTypeId}</p>
                  <p className="text-slate-400 text-sm">Level {w.level}</p>
                </div>
                <span className="text-yellow-400 text-sm">Active</span>
              </div>
            ))}
          </div>
        )}
        
        {assignedWorkers.length === 0 && (
          <p className="text-slate-500 text-sm mt-2">
            No workers assigned. Assign workers from the Idle tab.
          </p>
        )}
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaGem className="text-yellow-400" />
          Subareas
        </h3>
        
        <div className="space-y-3">
          {subareas.map(subarea => (
            <button
              key={subarea.id}
              onClick={() => handleSelectSubarea(subarea.id)}
              className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{subarea.name}</h4>
                  <p className="text-slate-400 text-sm">{subarea.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded text-white ${RARITY_COLORS[subarea.rarity] || 'bg-gray-600'}`}>
                    {subarea.rarity}
                  </span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    View Details <FaChevronRight />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
