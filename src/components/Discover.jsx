import { useState } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import { Gem } from '../models/Gem';
import gemsData from '../data/gems.json';
import './Discover.css';

const MINING_DURATION = 5000;

export default function Discover() {
  const { state, dispatch } = useGame();
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [lastMinedGem, setLastMinedGem] = useState(null);

  const coins = state.player?.coins || 0;
  const inventoryCount = state.inventory?.items?.length || 0;
  const inventoryCapacity = state.inventory?.capacity || 20;

  const getRandomGem = () => {
    const gems = gemsData.gems;
    const randomIndex = Math.floor(Math.random() * gems.length);
    const gemData = gems[randomIndex];
    return new Gem({
      id: gemData.id,
      name: gemData.name,
      mohs: gemData.hardness,
      color: gemData.type,
      facts: [],
      values: [gemData.value]
    });
  };

  const handleStartMining = () => {
    if (isMining) return;
    
    setIsMining(true);
    setMiningProgress(0);
    setLastMinedGem(null);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / MINING_DURATION) * 100, 100);
      setMiningProgress(progress);

      if (elapsed >= MINING_DURATION) {
        clearInterval(progressInterval);
        const minedGem = getRandomGem();
        setLastMinedGem(minedGem);
        dispatch({ type: SET_PHASE + '_ADD_GEM', payload: minedGem });
        dispatch({ 
          type: 'ADD_GEM', 
          payload: { 
            id: minedGem.id,
            name: minedGem.name,
            mohs: minedGem.mohs,
            color: minedGem.color,
            facts: [],
            values: [minedGem.values[0]]
          }
        });
        setIsMining(false);
        setMiningProgress(0);
      }
    }, 100);
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
        <section className="discover-section mining-section">
          <h3 className="section-title">⛏️ Mining (Idle)</h3>
          <p className="section-description">
            Wait while you mine for gems. A random gem will be found!
          </p>
          
          <div className="mining-container">
            {isMining && (
              <div className="mining-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${miningProgress}%` }}
                  />
                </div>
                <span className="progress-text">Mining... {Math.round(miningProgress)}%</span>
              </div>
            )}
            
            {lastMinedGem && (
              <div className="mined-gem">
                <span className="gem-icon">
                  {gemsData.gems.find(g => g.id === lastMinedGem.id)?.icon || '💎'}
                </span>
                <span className="gem-name">{lastMinedGem.name}</span>
                <span className="gem-value">{lastMinedGem.getDisplayValue().formattedValue}</span>
              </div>
            )}

            {!isMining && !lastMinedGem && (
              <p className="mining-idle-text">Ready to mine!</p>
            )}

            <button 
              className="btn btn-primary mining-btn"
              onClick={handleStartMining}
              disabled={isMining}
            >
              {isMining ? 'Mining...' : 'Start Mining'}
            </button>
          </div>
        </section>

        <section className="discover-section panning-section">
          <h3 className="section-title">🔍 Panning (Active)</h3>
          <p className="section-description">
            Try your luck panning for gems in the mini-game!
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
