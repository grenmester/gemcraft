import { useState, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { Gem } from '../models/Gem';
import gemsData from '../data/gems.json';
import './Discover.css';

const SHIFT_TIERS = [
  { threshold: 0, rate: 0, label: 'No Idle Collection', color: '#666' },
  { threshold: 10, rate: 1, label: 'Tier 1', color: '#7f8c8d' },
  { threshold: 30, rate: 3, label: 'Tier 2', color: '#3498db' },
  { threshold: 75, rate: 8, label: 'Tier 3', color: '#9b59b6' },
  { threshold: 150, rate: 15, label: 'Tier 4', color: '#f39c12' },
  { threshold: 300, rate: 25, label: 'Tier 5', color: '#e74c3c' },
];

export default function Discover() {
  const { state, dispatch } = useGame();
  const [lastMinedGem, setLastMinedGem] = useState(null);
  const [idleGems, setIdleGems] = useState([]);

  const coins = state.player?.coins || 0;
  const inventoryCount = state.inventory?.items?.length || 0;
  const inventoryCapacity = state.inventory?.capacity || 20;
  const shiftPoints = state.player?.shiftPoints || 0;
  
  const currentTier = SHIFT_TIERS.reduce((tier, t) => 
    shiftPoints >= t.threshold ? t : tier, SHIFT_TIERS[0]);
  const nextTier = SHIFT_TIERS.find(t => t.threshold > shiftPoints) || null;
  const progressToNext = nextTier 
    ? ((shiftPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;

  useEffect(() => {
    if (currentTier.rate === 0) return;
    
    const interval = setInterval(() => {
      if (state.inventory.items.length < inventoryCapacity) {
        const randomGem = generateRandomGem();
        setIdleGems(prev => [...prev, randomGem]);
      }
    }, 3600000 / currentTier.rate);

    return () => clearInterval(interval);
  }, [currentTier.rate, inventoryCapacity]);

  const generateRandomGem = () => {
    const gems = gemsData.gems;
    const randomIndex = Math.floor(Math.random() * gems.length);
    const gemData = gems[randomIndex];
    return new Gem({
      id: `${gemData.id}_idle_${Date.now()}`,
      name: gemData.name,
      mohs: gemData.hardness || 7,
      color: gemData.type || '#888',
      facts: [],
      values: [gemData.value || 10]
    });
  };

  const collectIdleGems = () => {
    idleGems.forEach(gem => {
      if (state.inventory.items.length < inventoryCapacity) {
        dispatch({ type: 'ADD_GEM', payload: gem });
      }
    });
    setIdleGems([]);
  };

  const handleStartPanning = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MINIGAME });
  };

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="discover screen">
      <div className="discover-header">
        <h2 className="discover-title">Discover</h2>
        <div className="resources-bar">
          <div className="resource-item">
            <span className="resource-icon">💎</span>
            <span className="resource-value">{coins}</span>
          </div>
          <div className="resource-item">
            <span className="resource-icon">🎒</span>
            <span className="resource-value">{inventoryCount}/{inventoryCapacity}</span>
          </div>
        </div>
      </div>

      <div className="discover-sections">
        <section className="discover-section shift-section">
          <h3 className="section-title">⭐ Shift Tier: {currentTier.label}</h3>
          
          <div className="shift-info">
            <div className="shift-rate">
              <span className="rate-value">{currentTier.rate}</span>
              <span className="rate-label">gems/hr when idle</span>
            </div>
            
            {nextTier && (
              <div className="shift-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${progressToNext}%`,
                      backgroundColor: currentTier.color
                    }}
                  />
                </div>
                <span className="progress-text">
                  {shiftPoints} / {nextTier.threshold} Shift Points to {nextTier.label}
                </span>
              </div>
            )}
            
            {currentTier.rate > 0 && (
              <p className="shift-description" style={{ color: currentTier.color }}>
                You're earning {currentTier.rate} gems per hour of idle time!
              </p>
            )}
            
            {currentTier.rate === 0 && (
              <p className="shift-description" style={{ color: '#e74c3c' }}>
                Play mini-games to earn Shift Points and unlock idle collection!
              </p>
            )}
          </div>

          {idleGems.length > 0 && (
            <div className="idle-gems-ready">
              <p>{idleGems.length} gem(s) ready to collect!</p>
              <button className="btn btn-primary" onClick={collectIdleGems}>
                Collect Gems
              </button>
            </div>
          )}
        </section>

        <section className="discover-section panning-section">
          <h3 className="section-title">🔍 Panning (Active)</h3>
          <p className="section-description">
            Play the mini-game to earn gems and Shift Points!
          </p>
          <button 
            className="btn btn-gold panning-btn"
            onClick={handleStartPanning}
          >
            Start Panning
          </button>
        </section>
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
