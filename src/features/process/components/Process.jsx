import { useState } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';
import { useProcess } from '../hooks/useProcess';
import ProcessQueue from './ProcessQueue';
import ProcessSelector from './ProcessSelector';
import { FaBolt, FaHourglassHalf, FaArrowLeft } from 'react-icons/fa';

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
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          onClick={handleBack}
        >
          <FaArrowLeft /> Menu
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Process</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          onClick={() => setActiveTab('active')}
        >
          <FaBolt /> Active
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'idle'
              ? 'bg-cyan-500 text-slate-900'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          onClick={() => setActiveTab('idle')}
        >
          <FaHourglassHalf /> Idle Queue
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
  // Use ProcessSelector for now (temporary replacement for TumbleSort minigame)
  return <ProcessSelector />;
}
