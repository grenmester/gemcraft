/**
 * ProcessEquipment Component
 * UI for managing process equipment (buying and equipping)
 */

import { useState } from 'react';
import { useGame, UPGRADE_PROCESS_EQUIPMENT, EQUIP_PROCESS_TOOL } from '../../../context/GameContext';
import { PROCESS_EQUIPMENT, getEquipmentForProcess } from '../../../data/processEquipment';
import { FaTools, FaCheck, FaLock } from 'react-icons/fa';

const PROCESS_TYPES = [
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', description: 'Tumble & clean raw gems' },
  { id: 'cutting', name: 'Cutting', icon: '✂️', description: 'Shape gems for processing' },
  { id: 'faceting', name: 'Faceting', icon: '💎', description: 'Add brilliance to gems' },
];

function getRarityColor(rarity) {
  const colors = {
    Common: '#9CA3AF',
    Uncommon: '#22C55E',
    Rare: '#3B82F6',
    Epic: '#A855F7',
    Legendary: '#F59E0B'
  };
  return colors[rarity] || colors.Common;
}

export default function ProcessEquipment() {
  const { state, dispatch } = useGame();
  const { player, processState } = state;
  const { equippedTools } = processState;
  
  const inventory = player?.inventory || {};
  const ownedEquipment = inventory.processEquipment || [];
  const coins = player?.coins || 0;
  const level = player?.level || 1;
  
  const [selectedProcess, setSelectedProcess] = useState('cleaning');
  
  const handleEquip = (equipmentId) => {
    dispatch({
      type: EQUIP_PROCESS_TOOL,
      payload: { processType: selectedProcess, equipmentId }
    });
  };
  
  const handleBuy = (equipmentId) => {
    const eq = PROCESS_EQUIPMENT[equipmentId];
    if (!eq) return;
    
    if (coins >= eq.cost) {
      dispatch({
        type: UPGRADE_PROCESS_EQUIPMENT,
        payload: { processType: selectedProcess, newEquipmentId: equipmentId }
      });
    }
  };
  
  const processEquipment = getEquipmentForProcess(selectedProcess);
  const currentEquipped = equippedTools?.[selectedProcess] || `basic_${selectedProcess.slice(0, -3)}`;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-amber-400 mb-1">Process Equipment</h3>
        <p className="text-sm text-slate-400">
          Upgrade your tools for better quality and speed
        </p>
      </div>
      
      {/* Process Type Tabs */}
      <div className="flex gap-2 mb-4">
        {PROCESS_TYPES.map(type => (
          <button
            key={type.id}
            className={`
              flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${selectedProcess === type.id
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }
            `}
            onClick={() => setSelectedProcess(type.id)}
          >
            <span className="mr-1">{type.icon}</span>
            {type.name}
          </button>
        ))}
      </div>
      
      {/* Currently Equipped */}
      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
        <div className="text-xs text-slate-400 mb-1">Currently Equipped</div>
        <div className="flex items-center gap-2">
          <FaTools className="text-amber-400" />
          <span className="font-semibold text-white">
            {PROCESS_EQUIPMENT[currentEquipped]?.name || 'Basic Equipment'}
          </span>
          {currentEquipped !== `basic_${selectedProcess.slice(0, -3)}` && (
            <span className="text-xs text-amber-400">(Upgraded)</span>
          )}
        </div>
        {PROCESS_EQUIPMENT[currentEquipped] && (
          <div className="text-xs text-slate-400 mt-1">
            {PROCESS_EQUIPMENT[currentEquipped].description}
          </div>
        )}
      </div>
      
      {/* Equipment List */}
      <div className="flex-1 overflow-auto space-y-2">
        {processEquipment.map(eq => {
          const isOwned = ownedEquipment.includes(eq.id);
          const isEquipped = currentEquipped === eq.id;
          const canAfford = coins >= eq.cost;
          const isLocked = level < eq.unlockLevel;
          const isUpgrade = getUpgradeLevel(eq.id) > getUpgradeLevel(currentEquipped);
          
          return (
            <div
              key={eq.id}
              className={`
                rounded-lg p-3 border transition-all
                ${isEquipped 
                  ? 'bg-amber-900/30 border-amber-500/50' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }
                ${isLocked ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{eq.name}</span>
                    {isEquipped && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <FaCheck /> Equipped
                      </span>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <FaLock /> Lv.{eq.unlockLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{eq.description}</div>
                </div>
                
                {!isOwned && !isLocked && (
                  <button
                    className={`
                      py-1 px-3 rounded text-sm font-medium transition-colors
                      ${canAfford 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }
                    `}
                    onClick={() => handleBuy(eq.id)}
                    disabled={!canAfford}
                  >
                    {eq.cost.toLocaleString()} coins
                  </button>
                )}
                
                {isOwned && !isEquipped && (
                  <button
                    className={`
                      py-1 px-3 rounded text-sm font-medium transition-colors
                      ${isUpgrade
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }
                    `}
                    onClick={() => handleEquip(eq.id)}
                  >
                    {isUpgrade ? 'Equip (Upgrade)' : 'Equip'}
                  </button>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-2 text-xs">
                {eq.effects.idleSpeedBonus > 0 && (
                  <span className="bg-cyan-900/50 text-cyan-400 px-2 py-0.5 rounded">
                    +{Math.round(eq.effects.idleSpeedBonus * 100)}% Speed
                  </span>
                )}
                {eq.effects.idleQualityBonus > 0 && (
                  <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded">
                    +{eq.effects.idleQualityBonus}% Quality
                  </span>
                )}
                {eq.effects.activeQualityBonus > 0 && (
                  <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">
                    +{eq.effects.activeQualityBonus}% Active Quality
                  </span>
                )}
                {eq.effects.autoMatrixRemoval && (
                  <span className="bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">
                    Auto Matrix Removal
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getUpgradeLevel(equipmentId) {
  const levels = {
    // Cleaning
    basic_tumbler: 1,
    vibrating_tumbler: 2,
    sonic_cleaner: 3,
    industrial_cleaner: 4,
    // Cutting
    basic_cutter: 1,
    precision_cutter: 2,
    diamond_cutter: 3,
    quantum_cutter: 4,
    // Faceting
    hand_faceter: 1,
    automatic_faceter: 2,
    master_faceter: 3,
    brilliance_engine: 4,
  };
  return levels[equipmentId] || 0;
}
