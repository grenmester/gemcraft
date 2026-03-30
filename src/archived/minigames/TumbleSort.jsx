// src/features/process/components/TumbleSort.jsx

import { useState } from 'react';
import TumbleSortGame from './TumbleSortGame';

/**
 * TumbleSort Wrapper Component
 * Shows item details, equipment bonuses, and start button before minigame
 */
export default function TumbleSort({ item, onComplete }) {
  const [gameStarted, setGameStarted] = useState(false);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-4">💎</div>
          <p>No item selected for tumbling</p>
        </div>
      </div>
    );
  }

  // Calculate projected quality range based on equipment
  const baseQuality = 50;
  const equipmentBonus = item.equipmentBonus || 0;
  const minQuality = baseQuality + equipmentBonus - 15;
  const maxQuality = baseQuality + equipmentBonus + 30;

  const handleStartTumbling = () => {
    setGameStarted(true);
  };

  const handleGameComplete = (quality) => {
    setGameStarted(false);
    if (onComplete) {
      onComplete(quality);
    }
  };

  if (gameStarted) {
    return <TumbleSortGame item={item} onComplete={handleGameComplete} />;
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-amber-400 mb-2">Tumble Sort</h2>
        <p className="text-slate-400 text-sm">Clean and polish your gems</p>
      </div>

      {/* Item Card */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-3xl">
            {getItemEmoji(item.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{item.name || item.id}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: getRarityBgColor(item.rarity), color: getRarityColor(item.rarity) }}
              >
                {item.rarity || 'Common'}
              </span>
              <span className="text-slate-400">
                Hardness: {item.hardness || '?'} Mohs
              </span>
            </div>
          </div>
        </div>

        {/* Item Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase mb-1">Base Value</div>
            <div className="text-lg font-bold text-white">{item.baseValue || item.value || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase mb-1">Type</div>
            <div className="text-lg font-bold text-white capitalize">{item.type || 'Gem'}</div>
          </div>
        </div>
      </div>

      {/* Projected Quality Range */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Projected Quality Range</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              style={{ 
                width: '100%',
                clipPath: `polygon(0 0, ${minQuality}% 0, ${minQuality}% 100%, 0 100%)`
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-400">
            Min: <span className="text-red-400 font-semibold">{minQuality}%</span>
          </span>
          <span className="text-slate-400">
            Max: <span className="text-green-400 font-semibold">{maxQuality}%</span>
          </span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-amber-400">
            Equipment Bonus: +{equipmentBonus}%
          </span>
        </div>
      </div>

      {/* Equipment Bonuses */}
      {item.equipmentBonus > 0 && (
        <div className="bg-amber-500/10 rounded-xl p-4 mb-6 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400">⚡</span>
            <h4 className="text-sm font-semibold text-amber-400">Equipment Bonus</h4>
          </div>
          <p className="text-sm text-slate-300">
            Your tumbling equipment adds <span className="text-amber-400 font-bold">+{item.equipmentBonus}%</span> to quality
          </p>
        </div>
      )}

      {/* How to Play */}
      <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">How to Play</h4>
        <ul className="text-sm text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">1.</span>
            <span>Watch gems tumble inside the barrel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">2.</span>
            <span>Click gems when they enter the <span className="text-cyan-400">clean zone</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">3.</span>
            <span>Avoid clicking matrix/waste material</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">4.</span>
            <span>Complete within time for speed bonus</span>
          </li>
        </ul>
      </div>

      {/* Start Button */}
      <div className="mt-auto">
        <button
          className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:from-amber-300 hover:to-orange-400 transition-all active:scale-98 shadow-lg shadow-amber-500/25"
          onClick={handleStartTumbling}
        >
          <span className="flex items-center justify-center gap-2">
            <span>Start Tumbling</span>
            <span>🔄</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function getItemEmoji(type) {
  const emojis = {
    quartz: '💎',
    garnet: '🔴',
    beryl: '💚',
    topaz: '🟡',
    corundum: '💠',
    diamond: '💎',
    feldspar: '🌙',
    tourmaline: '🌈',
    zoisite: '💜',
    chrysoberyl: '💚',
    borate: '⚫',
    mineral: '🪨',
    matrix: '🪨',
    default: '💎'
  };
  return emojis[type] || emojis.default;
}

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

function getRarityBgColor(rarity) {
  const colors = {
    Common: 'rgba(156, 163, 175, 0.2)',
    Uncommon: 'rgba(34, 197, 94, 0.2)',
    Rare: 'rgba(59, 130, 246, 0.2)',
    Epic: 'rgba(168, 85, 247, 0.2)',
    Legendary: 'rgba(245, 158, 11, 0.2)'
  };
  return colors[rarity] || colors.Common;
}
