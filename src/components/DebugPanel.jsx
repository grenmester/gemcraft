import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import gemsData from '../data/gems.json';
import './DebugPanel.css';

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

  const handleMaxShiftPoints = () => {
    dispatch({ type: 'DEBUG_SET_SHIFT', payload: 500 });
  };

  const handleSetLevel = (level) => {
    const shiftPoints = level * 100;
    dispatch({ type: 'DEBUG_SET_SHIFT', payload: shiftPoints });
  };

  const handleUnlockAllLocations = () => {
    dispatch({ type: 'DEBUG_UNLOCK_ALL_LOCATIONS' });
  };

  const handleMaxInventory = () => {
    dispatch({ type: 'DEBUG_MAX_INVENTORY' });
  };

  const handleResetProgress = () => {
    dispatch({ type: 'DEBUG_RESET' });
  };

  return (
    <div className="debug-panel">
      <div className="debug-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="debug-title">🔧 Debug Mode</span>
        <span className="debug-toggle">{isOpen ? '▼' : '▲'}</span>
      </div>
      
      {isOpen && (
        <div className="debug-content">
          <div className="debug-section">
            <h4>Current Stats</h4>
            <div className="debug-stats">
              <span>💎 {state.player.coins?.toLocaleString() || 0}</span>
              <span>✨ Shift: {state.player.shiftPoints || 0}</span>
              <span>📦 Gems: {state.player.gems?.length || 0}</span>
              <span>📖 Gemdex: {state.player.gemdex?.length || 0}/{gemsData.gems.length}</span>
            </div>
          </div>

          <div className="debug-section">
            <h4>Resources</h4>
            <div className="debug-buttons">
              <button onClick={() => handleAddCoins(1000)}>+1K Coins</button>
              <button onClick={() => handleAddCoins(10000)}>+10K Coins</button>
              <button onClick={() => handleAddCoins(100000)}>+100K Coins</button>
              <button onClick={handleMaxShiftPoints}>Max Shift (500)</button>
            </div>
          </div>

          <div className="debug-section">
            <h4>Progression</h4>
            <div className="debug-buttons">
              <button onClick={() => handleSetLevel(5)}>Level 5</button>
              <button onClick={() => handleSetLevel(10)}>Level 10</button>
              <button onClick={() => handleSetLevel(25)}>Level 25</button>
              <button onClick={() => handleSetLevel(50)}>Level 50</button>
              <button onClick={handleUnlockAllLocations}>Unlock All Locations</button>
            </div>
          </div>

          <div className="debug-section">
            <h4>Gems & Items</h4>
            <div className="debug-buttons">
              <button onClick={handleUnlockAllGems}>Unlock All Gems</button>
              <button onClick={handleMaxInventory}>Max Inventory (100 gems)</button>
            </div>
          </div>

          <div className="debug-section danger">
            <h4>Danger Zone</h4>
            <div className="debug-buttons">
              <button onClick={handleResetProgress} className="danger">Reset All Progress</button>
            </div>
          </div>

          <div className="debug-shortcuts">
            <small>Shortcuts: Ctrl+Shift+D toggle | Ctrl+Shift+O open/close</small>
          </div>
        </div>
      )}
    </div>
  );
}
