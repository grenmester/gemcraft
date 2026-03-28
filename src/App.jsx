import { GameProvider, useGame, GAME_PHASES } from './context/GameContext';
import Menu from './shared/components/Menu';
import Discover from './components/Discover';
import Process from './features/process/components/Process';
import Craft from './features/craft/components/Craft';
import Sell from './features/sell/components/Sell';
import LocationSelector from './components/LocationSelector';
import SubareaSelector from './components/SubareaSelector';
import RewardsSelector from './components/RewardsSelector';
import RewardsSummary from './components/RewardsSummary';
import Gemdex from './features/inventory/components/Gemdex';
import Inventory from './features/inventory/components/Inventory';
import DebugPanel from './shared/components/DebugPanel';

function GameContent() {
  const { state } = useGame();
  const coins = state.player?.coins || 0;
  
  let phaseContent;
  switch (state.phase) {
    case GAME_PHASES.MENU:
      phaseContent = <Menu />;
      break;
    case GAME_PHASES.DISCOVER: {
      const { activeTab, selectedLocation, selectedArea, lastRewards } = state.discoverState || {};
      
      // If rewards exist, show summary
      if (lastRewards) {
        phaseContent = <RewardsSummary />;
      }
      // If area is selected, show rewards selector
      else if (selectedArea) {
        phaseContent = <RewardsSelector />;
      }
      // If location is selected (not null), show subarea selector
      else if (selectedLocation) {
        phaseContent = <SubareaSelector />;
      }
      // If activeTab is panning and no location selected, show location selector
      else if (activeTab === 'panning' && !selectedLocation) {
        phaseContent = <LocationSelector />;
      }
      // Default: show discover tabs
      else {
        phaseContent = <Discover />;
      }
      break;
    }
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
      // Redirect to discover flow with panning tab
      phaseContent = <Discover />;
      break;
    case 'location_map':
      // Redirect to location selector in discover
      phaseContent = <LocationSelector />;
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
      <main className="app-main flex-1 flex flex-col container mx-auto max-w-[1536px] w-full px-4 md:px-6 py-6 overflow-y-auto">
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
        <header className="bg-slate-800 border-b border-slate-700 shrink-0">
          <div className="container mx-auto max-w-[1536px] w-full px-4 md:px-6 py-3 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-yellow-400">Gemstone Collector</h1>
          </div>
        </header>
        <GameContent />
        <DebugPanel />
      </div>
    </GameProvider>
  );
}

export default App;
