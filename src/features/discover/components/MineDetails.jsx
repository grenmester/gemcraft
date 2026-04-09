import { useGame, SELECT_SUBAREA, CLEAR_MINING_SELECTION } from '../../../context/GameContext';
import { LOCATION_TIERS } from '../../../loaders/locations';
import { FaArrowLeft, FaUsers, FaMapMarkedAlt, FaChevronRight, FaGem } from 'react-icons/fa';
import { getSubareasForMine, RARITY_COLORS } from '../../../data/subareas';

export default function MineDetails({ mineId }) {
  const { state, dispatch } = useGame();
  const location = LOCATION_TIERS[mineId];
  const workers = state.player?.workers || [];
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const subareas = getSubareasForMine(mineId);
  
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
