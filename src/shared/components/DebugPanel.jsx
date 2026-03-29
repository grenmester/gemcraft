import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import gemsData from '../../data/gems.json';
import { PROCESS_EQUIPMENT } from '../../data/processEquipment.js';

export const DEBUG_KEY = 'debug_mode';

export default function DebugPanel() {
  const { state, dispatch } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        setIsOpen(false);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        if (isVisible) setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isOpen]);

  if (!isVisible) return null;

  const handleUnlockAllGems = () => {
    gemsData.gems.forEach(gem => {
      dispatch({ type: 'DEBUG_ADD_GEM', payload: gem });
    });
  };

  const handleAddCoins = (amount) => {
    dispatch({ type: 'ADD_COINS', payload: amount });
  };

  const handleUnlockAllLocations = () => {
    dispatch({ type: 'DEBUG_UNLOCK_ALL_LOCATIONS' });
    // Also give all process equipment for testing
    const allProcessEquipmentIds = Object.keys(PROCESS_EQUIPMENT);
    allProcessEquipmentIds.forEach(eqId => {
      dispatch({ type: 'BUY_PROCESS_EQUIPMENT', payload: eqId });
    });
  };

  const handleMaxInventory = () => {
    dispatch({ type: 'DEBUG_MAX_INVENTORY' });
  };

  const handleResetProgress = () => {
    dispatch({ type: 'DEBUG_RESET' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-slate-800 border-2 border-red-400 rounded-lg shadow-lg min-w-[280px] max-w-md text-sm" style={{ boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 107, 107, 0.3)' }}>
      <div className="flex justify-between items-center p-3 bg-slate-700 cursor-pointer select-none hover:bg-red-400 hover:text-white transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-bold text-red-400 hover:text-white">🔧 Debug Mode</span>
        <span className="text-xs opacity-70">{isOpen ? '▼' : '▲'}</span>
      </div>
      
      {isOpen && (
        <div className="p-4 flex flex-col gap-4">
          <div className="border-b border-slate-700 pb-3">
            <h4 className="m-0 mb-2 text-xs uppercase tracking-wide text-gray-400">Current Stats</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
              <span className="whitespace-nowrap">💎 {state.player.coins?.toLocaleString() || 0}</span>
              <span className="whitespace-nowrap">📦 Gems: {state.player.gems?.length || 0}</span>
              <span className="whitespace-nowrap">📖 Gemdex: {state.player.gemdex?.length || 0}/{gemsData.gems.length}</span>
            </div>
          </div>

          <div className="border-b border-slate-700 pb-3">
            <h4 className="m-0 mb-2 text-xs uppercase tracking-wide text-gray-400">Resources</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleAddCoins(1000)} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">+1K Coins</button>
              <button onClick={() => handleAddCoins(10000)} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">+10K Coins</button>
              <button onClick={() => handleAddCoins(100000)} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">+100K Coins</button>
            </div>
          </div>

          <div className="border-b border-slate-700 pb-3">
            <h4 className="m-0 mb-2 text-xs uppercase tracking-wide text-gray-400">Progression</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleUnlockAllLocations} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">Unlock All Locations</button>
            </div>
          </div>

          <div className="border-b border-slate-700 pb-3">
            <h4 className="m-0 mb-2 text-xs uppercase tracking-wide text-gray-400">Gems & Items</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleUnlockAllGems} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">Unlock All Gems</button>
              <button onClick={handleMaxInventory} className="px-3 py-1.5 text-xs bg-slate-700 border border-teal-400 rounded text-white hover:bg-teal-400 hover:text-slate-900 transition-all">Max Inventory (100 gems)</button>
            </div>
          </div>

          <div className="pb-3">
            <h4 className="m-0 mb-2 text-xs uppercase tracking-wide text-red-400">Danger Zone</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleResetProgress} className="px-3 py-1.5 text-xs bg-slate-700 border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-white transition-all">Reset All Progress</button>
            </div>
          </div>

          <div className="text-center text-gray-400 opacity-70 pt-2 text-xs">
            Shortcuts: Ctrl+Shift+D toggle | Ctrl+Shift+O open/close
          </div>
        </div>
      )}
    </div>
  );
}
