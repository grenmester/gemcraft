import { useState, useEffect } from 'react';
import { useGame, MINE_SUBAREA, COLLECT_PENDING_MATERIALS, SELECT_SUBAREA, GAME_PHASES } from '../../../context/GameContext';
import { FaArrowLeft, FaGem, FaUsers, FaCoins, FaSyncAlt } from 'react-icons/fa';

const COOLDOWNS = {
  small: 5,
  medium: 15,
  large: 30
};

const LOOT_TABLES = {
  TIER_1: {
    area_a: [
      { itemId: 'clear_quartz', chance: 0.40, name: 'Clear Quartz' },
      { itemId: 'raw_obsidian', chance: 0.30, name: 'Raw Obsidian' },
      { itemId: 'raw_fluorite', chance: 0.25, name: 'Raw Fluorite' },
      { itemId: 'rough_amethyst', chance: 0.05, name: 'Rough Amethyst' }
    ],
    area_b: [
      { itemId: 'clear_quartz', chance: 0.35, name: 'Clear Quartz' },
      { itemId: 'raw_fluorite', chance: 0.30, name: 'Raw Fluorite' },
      { itemId: 'raw_obsidian', chance: 0.25, name: 'Raw Obsidian' },
      { itemId: 'rough_amethyst', chance: 0.10, name: 'Rough Amethyst' }
    ],
    area_c: [
      { itemId: 'raw_fluorite', chance: 0.30, name: 'Raw Fluorite' },
      { itemId: 'rough_amethyst', chance: 0.25, name: 'Rough Amethyst' },
      { itemId: 'raw_obsidian', chance: 0.25, name: 'Raw Obsidian' },
      { itemId: 'clear_quartz', chance: 0.20, name: 'Clear Quartz' }
    ]
  }
};

const SUBAREA_INFO = {
  TIER_1: {
    area_a: { name: 'River Bend', description: 'A calm bend in the river with excellent gem deposits in the shallow water.' },
    area_b: { name: 'Sandbar', description: 'Shallow waters with mixed minerals and occasional surprises.' },
    area_c: { name: 'Rocky Shore', description: 'Challenging terrain but with better potential finds.' }
  },
  TIER_1_B: {
    area_a: { name: 'Ozark Hollow', description: 'Hidden cave with crystal formations.' },
    area_b: { name: 'Hilltop Vista', description: 'Open terrain with surface deposits.' },
    area_c: { name: 'Creek Bed', description: 'Water-worn stones with embedded gems.' }
  },
  TIER_1_C: {
    area_a: { name: 'Field Edge', description: 'Border area with mixed deposits.' },
    area_b: { name: 'Bavarian Meadow', description: 'Fertile soil with mineral content.' },
    area_c: { name: 'Mountain Base', description: 'Rocky terrain with hidden treasures.' }
  }
};

function getDefaultLoot(mineId, subareaId) {
  return LOOT_TABLES[mineId]?.[subareaId] || LOOT_TABLES.TIER_1[subareaId] || [];
}

function getSubareaInfo(mineId, subareaId) {
  return SUBAREA_INFO[mineId]?.[subareaId] || { name: subareaId, description: 'A mining subarea.' };
}

export default function SubareaDetails({ mineId, subareaId }) {
  const { state, dispatch } = useGame();
  const [cooldownEnd, setCooldownEnd] = useState({});
  const [message, setMessage] = useState(null);
  
  const workers = state.player?.workers || [];
  const assignedWorkers = workers.filter(w => w.assignedArea === mineId);
  const pending = state.discoverState?.pendingMaterials?.[mineId] || [];
  const pendingCount = pending.reduce((sum, m) => sum + m.quantity, 0);
  
  const lootTable = getDefaultLoot(mineId, subareaId);
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
    const now = Date.now();
    const cooldownMs = COOLDOWNS[rewardSize] * 1000;
    
    if (cooldownEnd[rewardSize] && now < cooldownEnd[rewardSize]) {
      const remaining = Math.ceil((cooldownEnd[rewardSize] - now) / 1000);
      setMessage({ type: 'error', text: `Cooldown: ${remaining}s remaining` });
      return;
    }
    
    try {
      dispatch({ 
        type: MINE_SUBAREA, 
        payload: { mineId, subareaId, rewardSize } 
      });
      setCooldownEnd(prev => ({ ...prev, [rewardSize]: now + cooldownMs }));
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
  
  const getCooldownRemaining = (size) => {
    const end = cooldownEnd[size] || 0;
    const remaining = end - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
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
          {lootTable.map(item => (
            <div key={item.itemId} className="flex items-center gap-3">
              <span className="text-slate-300 w-36">{item.name}</span>
              <div className="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${item.chance * 100}%` }}
                />
              </div>
              <span className="text-slate-400 text-sm w-16 text-right">
                {(item.chance * 100).toFixed(0)}%
              </span>
            </div>
          ))}
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
            const remaining = getCooldownRemaining(size);
            const isOnCooldown = remaining > 0;
            
            return (
              <button
                key={size}
                onClick={() => handleMine(size)}
                disabled={isOnCooldown}
                className={`p-4 rounded-lg font-semibold transition-colors ${
                  isOnCooldown
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : size === 'small' ? 'bg-green-600 hover:bg-green-500 text-white' :
                      size === 'medium' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                      'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <p className="capitalize font-bold">{size} Reward</p>
                <p className="text-xs opacity-75">
                  {size === 'small' ? '1 item' : size === 'medium' ? '3 items' : '5 items'}
                </p>
                {isOnCooldown ? (
                  <p className="text-xs mt-1">{remaining}s</p>
                ) : (
                  <p className="text-xs mt-1">+{COOLDOWNS[size]}s</p>
                )}
              </button>
            );
          })}
        </div>
        
        <p className="text-xs text-slate-500 mt-3">Cooldowns reset after mining</p>
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
