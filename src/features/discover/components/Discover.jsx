import { useState, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { useDiscover } from '../hooks/useDiscover';
import { Gem } from '../../../models/Gem';
import gemsData from '../../../data/gems.json';

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
  const { discoverState, setActiveTab } = useDiscover();
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
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MINIGAME });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MENU });
  };

  const handleSelectLocation = () => {
    dispatch({ type: 'SELECT_LOCATION', payload: null });
  };

  const activeTab = discoverState?.activeTab || 'idle';

  return (
    <div className="flex flex-col gap-8 pt-4 h-full">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <h2 className="text-4xl font-bold text-yellow-500 m-0 text-glow-yellow">
          Discover
        </h2>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
            <span className="text-xl">💎</span>
            <span className="text-lg font-bold text-yellow-500">{coins}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
            <span className="text-xl">🎒</span>
            <span className="text-lg font-bold text-yellow-500">{inventoryCount}/{inventoryCapacity}</span>
          </div>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-2">
        <button 
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'idle' 
              ? 'bg-yellow-500 text-black' 
              : 'bg-slate-700 text-slate-300'
          }`}
          onClick={() => setActiveTab('idle')}
        >
          ⏰ Idle
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'panning' 
              ? 'bg-yellow-500 text-black' 
              : 'bg-slate-700 text-slate-300'
          }`}
          onClick={() => setActiveTab('panning')}
        >
          🔍 Panning
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'idle' ? (
        /* Idle Tab Content */
        <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
          {/* Shift Tier Section */}
          <section className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-md">
            <h3 className="text-2xl text-white m-0">⭐ Shift Tier: {currentTier.label}</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-yellow-500">{currentTier.rate}</span>
                <span className="text-slate-400">gems/hr when idle</span>
              </div>
              
              {nextTier && (
                <div className="flex flex-col gap-2">
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${progressToNext}%`,
                        backgroundColor: currentTier.color
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 text-center">
                    {shiftPoints} / {nextTier.threshold} Shift Points to {nextTier.label}
                  </span>
                </div>
              )}
              
              {currentTier.rate > 0 && (
                <p className="text-sm" style={{ color: currentTier.color }}>
                  You're earning {currentTier.rate} gems per hour of idle time!
                </p>
              )}
              
              {currentTier.rate === 0 && (
                <p className="text-sm text-red-500">
                  Play mini-games to earn Shift Points and unlock idle collection!
                </p>
              )}
            </div>
          </section>

          {/* Idle Gems Collection */}
          {idleGems.length > 0 && (
            <section className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-lg text-slate-300 m-0">
                  {idleGems.length} gem(s) ready to collect!
                </p>
                <button className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors" onClick={collectIdleGems}>
                  Collect Gems
                </button>
              </div>
            </section>
          )}

          {/* Back Button */}
          <button 
            className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            onClick={handleBack}
          >
            ← Back to Menu
          </button>
        </div>
      ) : (
        /* Panning Tab Content */
        <div className="flex flex-col items-center gap-6 max-w-xl mx-auto w-full">
          <section className="bg-slate-800 rounded-xl p-8 flex flex-col items-center gap-6 shadow-md w-full">
            <h3 className="text-2xl text-white m-0">🔍 Panning</h3>
            
            <p className="text-slate-400 text-center m-0">
              Select a mine location to start panning for gems and Shift Points!
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                className="w-full px-6 py-4 bg-yellow-500 text-black text-lg font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-md"
                onClick={handleSelectLocation}
              >
                🌍 Select Mine Location
              </button>
              
              <button 
                className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                onClick={handleStartPanning}
              >
                🔍 Start Panning (Quick)
              </button>
            </div>
          </section>

          {/* Back Button */}
          <button 
            className="px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
            onClick={handleBack}
          >
            ← Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}
