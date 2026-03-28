import { GameProvider, useGame, GAME_PHASES } from './context/GameContext';
import Menu from './components/Menu';
import Discover from './components/Discover';
import Process from './components/Process';
import Craft from './components/Craft';
import Sell from './components/Sell';
import Minigame from './components/Minigame';
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
      phaseContent = <Minigame />;
      break;
    default:
      phaseContent = <Menu />;
  }
  
  return (
    <>
      <main className="app-main">
        {phaseContent}
      </main>
      <footer className="app-footer">
        <div className="coins-display">
          <span className="coin-icon">💎</span>
          <span className="coin-amount">{coins}</span>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <div className="app">
        <header className="app-header">
          <h1>Gemstone Collector</h1>
        </header>
        <GameContent />
      </div>
    </GameProvider>
  );
}

export default App;
