import { useState } from 'react';
import { useGame, MINE_SUBAREA, COLLECT_PENDING_MATERIALS, SELECT_SUBAREA, GAME_PHASES } from '../../../context/GameContext';
import { FaArrowLeft, FaGem, FaUsers, FaCoins, FaSyncAlt } from 'react-icons/fa';
import { getSubareaInfo, getLootForSubarea, RARITY_COLORS } from '../../../data/subareas';
import { itemsById } from '../../../loaders/items';

export default function SubareaDetails({ mineId, subareaId }) {
  const { state, dispatch } = useGame();
  const [message, setMessage] = useState(null);
  
  const workers = state.player?.workers || [];
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const pending = state.discoverState?.pendingMaterials?.[mineId] || [];
  const pendingCount = pending.reduce((sum, m) => sum + m.quantity, 0);
  
  const lootTable = getLootForSubarea(mineId, subareaId);
  const subareaInfo = getSubareaInfo(mineId, subareaId);
  
  useEffect(() => {
    const savedCooldowns = state.discoverState?.miningCooldowns || {};
    const key = `${mineId}_${subareaId}`;
    const saved = savedCooldowns[key] || {};
    setCooldownEnd(saved);
  }, [mineId, subareaId]);
  
  const handleBack = () => {
    dispatch({ type: SELECT_SUBAREA, payload: null });
  };
  
  const handleMine = (rewardSize) => {
    try {
      dispatch({ 
        type: MINE_SUBAREA, 
        payload: { mineId, subareaId, rewardSize } 
      });
      dispatch({ type: COLLECT_PENDING_MATERIALS, payload: { mineId } });
      setMessage({ type: 'success', text: `Mined ${rewardSize} reward!` });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };
  
  const handleCollect = () => {
    dispatch({ type: COLLECT_PENDING_MATERIALS, payload: { mineId } });
    setMessage({ type: 'success', text: 'Materials collected!' });
  };
  
  const handleGoToWorkers = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.WORKERS });
  };
  
  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white self-start transition-colors"
      >
        <FaArrowLeft /> Back to Mine
      </button>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-2xl text-white font-bold mb-2">{subareaInfo.name}</h2>
        <p className="text-slate-400">{subareaInfo.description}</p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaGem className="text-yellow-400" /> Loot Table
        </h3>
        
        <div className="space-y-2">
          {(() => {
            const totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
            return lootTable.map(item => {
              const chance = (item.weight / totalWeight) * 100;
              const itemData = itemsById[item.itemId];
              return (
                <div key={item.itemId} className="flex items-center gap-3">
                  <span className="text-slate-300 w-36">{itemData?.name || item.itemId}</span>
                  <div className="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all ${RARITY_COLORS[item.rarity] || 'bg-gray-600'}`}
                      style={{ width: `${chance}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm w-16 text-right">
                    {chance.toFixed(1)}%
                  </span>
                </div>
              );
            });
          })()}
        </div>
        
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
          <FaSyncAlt className="text-yellow-400" /> 5% chance for rarity upgrade
        </p>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaUsers className="text-yellow-400" /> Assigned Workers
        </h3>
        
        {assignedWorkers.length > 0 ? (
          <div className="space-y-2 mb-4">
            {assignedWorkers.map(w => (
              <div key={w.id} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{w.workerTypeId}</p>
                  <p className="text-slate-400 text-sm">Level {w.level}</p>
                </div>
                <span className="text-green-400 text-sm">Generating</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-4">No workers assigned to this mine</p>
        )}
        
        <button
          onClick={handleGoToWorkers}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          Manage Workers
        </button>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg text-white mb-4 flex items-center gap-2">
          <FaCoins className="text-yellow-400" /> Manual Mining
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {['small', 'medium', 'large'].map(size => {
            return (
              <button
                key={size}
                onClick={() => handleMine(size)}
                aria-label={`${size} reward`}
                className={`p-4 rounded-lg font-semibold transition-colors ${
                  size === 'small' ? 'bg-green-600 hover:bg-green-500 text-white' :
                    size === 'medium' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                    'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <p className="capitalize font-bold">{size} Reward</p>
                <p className="text-xs opacity-75">
                  {size === 'small' ? '1 item' : size === 'medium' ? '3 items' : '5 items'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white">Pending Materials</h3>
          <span className="text-slate-400">{pendingCount} items</span>
        </div>
        
        {pending.length > 0 ? (
          <div className="space-y-2 mb-4">
            {pending.map((m, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-300">{m.itemId}</span>
                <span className="text-white">×{m.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-4">No materials pending</p>
        )}
        
        <button
          onClick={handleCollect}
          disabled={pendingCount === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            pendingCount > 0
              ? 'bg-yellow-500 text-black hover:bg-yellow-400'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Collect Materials
        </button>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg text-center ${
          message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
