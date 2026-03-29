import { useState } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';
import { useProcess } from '../hooks/useProcess';
import ProcessQueue from './ProcessQueue';
import TumbleSort from './TumbleSort';

export default function Process() {
  const { dispatch } = useGame();
  const { activeProcess, availableItems } = useProcess();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'idle'

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  const handleTumbleSortComplete = (quality) => {
    console.log('Tumble sort complete with quality:', quality);
    // The minigame handles completing the process
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          className="text-gray-400 hover:text-white transition-colors"
          onClick={handleBack}
        >
          ← Menu
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Process</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          onClick={() => setActiveTab('active')}
        >
          ⚡ Active
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'idle'
              ? 'bg-cyan-500 text-slate-900'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          onClick={() => setActiveTab('idle')}
        >
          ⏳ Idle Queue
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'active' ? (
          <ActiveProcessing 
            activeProcess={activeProcess}
            availableItems={availableItems}
            onComplete={handleTumbleSortComplete}
          />
        ) : (
          <ProcessQueue />
        )}
      </div>
    </div>
  );
}

function ActiveProcessing({ activeProcess, availableItems, onComplete }) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (activeProcess) {
    return (
      <TumbleSort 
        item={{ id: activeProcess.itemId }}
        onComplete={(quality) => {
          onComplete(quality);
        }}
      />
    );
  }

  if (selectedItem) {
    return (
      <TumbleSort 
        item={selectedItem}
        onComplete={(quality) => {
          onComplete(quality);
          setSelectedItem(null);
        }}
      />
    );
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-4">⚡</div>
      <h3 className="text-xl text-amber-400 mb-2">Active Processing</h3>
      <p className="text-gray-400 mb-6">Select an item to process</p>

      {availableItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {availableItems.slice(0, 8).map((item) => (
            <button
              key={item.id}
              className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 border border-slate-600 hover:border-amber-500 transition-all"
              onClick={() => setSelectedItem(item)}
            >
              <div className="text-2xl mb-2">
                {item.type === 'mineral' ? '🪨' : '💎'}
              </div>
              <div className="text-sm text-white truncate">{item.id}</div>
              <div className="text-xs text-gray-400">x{item.quantity}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-slate-800/50 rounded-lg">
          <p className="text-gray-400">
            No items to process. Visit Discover to find some gems!
          </p>
        </div>
      )}
    </div>
  );
}
