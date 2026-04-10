import { useState } from 'react';
import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';
import { useProcess } from '../hooks/useProcess';
import ProcessQueue from './ProcessQueue';
import ActiveProcessing from './ActiveProcessing';
import ProcessEquipment from './ProcessEquipment';
import { FaBolt, FaHourglassHalf, FaArrowLeft, FaTools } from 'react-icons/fa';
import { TutorialModal, HelpButton, PROCESS_TUTORIAL_SECTIONS } from '../../../shared/components/TutorialModal';

export default function Process() {
  const { dispatch } = useGame();
  const { availableItems } = useProcess();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'idle' | 'equipment'
  const [showTutorial, setShowTutorial] = useState(false);

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="flex flex-col h-full relative">
      <HelpButton onClick={() => setShowTutorial(true)} />
      
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
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'equipment'
              ? 'bg-purple-500 text-slate-900'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
          onClick={() => setActiveTab('equipment')}
        >
          <FaTools /> Equipment
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'active' ? (
          <ActiveProcessing />
        ) : activeTab === 'idle' ? (
          <ProcessQueue />
        ) : (
          <ProcessEquipment />
        )}
      </div>
      
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        title="Process Guide"
        sections={PROCESS_TUTORIAL_SECTIONS}
      />
    </div>
  );
}
