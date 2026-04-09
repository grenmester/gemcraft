import { useGame, SET_DISCOVER_TAB, CLEAR_MINING_SELECTION, SELECT_SUBAREA, GAME_PHASES } from '../../../context/GameContext';
import { useDiscover } from '../hooks/useDiscover';
import { FaArrowLeft, FaMapMarkedAlt, FaHourglassHalf, FaCoins } from 'react-icons/fa';
import MineSelection from './MineSelection';
import MineDetails from './MineDetails';
import SubareaDetails from './SubareaDetails';
import IdleMineSelection from './IdleMineSelection';

export default function Discover() {
  const { state, dispatch } = useGame();
  const { discoverState, setActiveTab } = useDiscover();
  
  const coins = state.player?.coins || 0;
  const activeTab = discoverState?.activeTab || 'panning';
  const selectedMine = discoverState?.selectedMine;
  const selectedSubarea = discoverState?.selectedSubarea;
  
  const handleBack = () => {
    if (selectedSubarea) {
      dispatch({ type: SELECT_SUBAREA, payload: null });
    } else if (selectedMine) {
      dispatch({ type: CLEAR_MINING_SELECTION });
    } else {
      dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MENU });
    }
  };
  
  const getBackText = () => {
    if (selectedSubarea) return 'Back to Mine';
    if (selectedMine) return 'Back to Mines';
    return 'Menu';
  };
  
  return (
    <div className="flex flex-col gap-6 pt-4 h-full">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          onClick={handleBack}
        >
          <FaArrowLeft /> {getBackText()}
        </button>
        <h2 className="text-2xl text-yellow-400 font-bold">Discover</h2>
        <div className="flex items-center gap-2 text-yellow-400">
          <FaCoins />
          <span>{coins.toLocaleString()}</span>
        </div>
      </div>

      {!selectedMine && (
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'panning'
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setActiveTab('panning')}
          >
            <FaMapMarkedAlt /> Panning
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'idle'
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setActiveTab('idle')}
          >
            <FaHourglassHalf /> Idle
          </button>
        </div>
      )}

      {activeTab === 'panning' && !selectedMine && (
        <MineSelection />
      )}
      
      {activeTab === 'panning' && selectedMine && !selectedSubarea && (
        <MineDetails mineId={selectedMine} />
      )}
      
      {activeTab === 'panning' && selectedMine && selectedSubarea && (
        <SubareaDetails mineId={selectedMine} subareaId={selectedSubarea} />
      )}
      
      {activeTab === 'idle' && (
        <IdleMineSelection />
      )}
    </div>
  );
}
