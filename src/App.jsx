import { GameProvider, useGame, GAME_PHASES } from './context/GameContext';
import Menu from './components/Menu';
import Discover from './components/Discover';
import Process from './components/Process';
import Craft from './components/Craft';
import Sell from './components/Sell';
import TempMinigame from './components/TempMinigame';
import LocationMap from './components/LocationMap';
import Gemdex from './components/Gemdex';
import Inventory from './components/Inventory';
import DebugPanel from './components/DebugPanel';
import './App.css';

function GameContent() {
  const { state } = useGame();
  const coins = state.player?.coins || 0;
  
  let phaseContent;
  switch (state.phase) {
    case GAME_PHASES.MENU:
      phaseContent = <Menu />;
      break;
    case GAME_PHASES.DISCOVER:
      phaseContent = <Discover />;
      break;
    case GAME_PHASES.PROCESS:
      phaseContent = <Process />;
      break;
    case GAME_PHASES.CRAFT:
      phaseContent = <Craft />;
      break;
    case GAME_PHASES.SELL:
      phaseContent = <Sell />;
      break;
    case GAME_PHASES.MINIGAME:
    case GAME_PHASES.TIER_1_B:
    case GAME_PHASES.TIER_1_C:
      phaseContent = <TempMinigame />;
      break;
    case 'location_map':
      phaseContent = <LocationMap />;
      break;
    case 'gemdex':
      phaseContent = <Gemdex />;
      break;
    case 'inventory':
      phaseContent = <Inventory />;
      break;
    default:
      phaseContent = <Menu />;
  }
  
  return (
    <>
      <main className="app-main flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
        {phaseContent}
      </main>
      <footer className="app-footer bg-slate-800 border-t border-slate-700 px-4 md:px-6 py-3 shrink-0">
        <div className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-400">
          <span className="text-xl">💎</span>
          <span>{coins}</span>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700 px-4 md:px-6 py-3 text-center shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-yellow-400">Gemstone Collector</h1>
        </header>
        <GameContent />
        <DebugPanel />
      </div>
    </GameProvider>
  );
}

export default App;
