import { GameProvider, useGame, GAME_PHASES } from './context/GameContext';
import './App.css';

const Menu = () => <div className="screen"><h2>Menu</h2></div>;
const Discover = () => <div className="screen"><h2>Discover</h2></div>;
const Process = () => <div className="screen"><h2>Process</h2></div>;
const Craft = () => <div className="screen"><h2>Craft</h2></div>;
const Sell = () => <div className="screen"><h2>Sell</h2></div>;
const Minigame = () => <div className="screen"><h2>Minigame</h2></div>;

function GameContent() {
  const { state } = useGame();
  
  switch (state.phase) {
    case GAME_PHASES.MENU:
      return <Menu />;
    case GAME_PHASES.DISCOVER:
      return <Discover />;
    case GAME_PHASES.PROCESS:
      return <Process />;
    case GAME_PHASES.CRAFT:
      return <Craft />;
    case GAME_PHASES.SELL:
      return <Sell />;
    case GAME_PHASES.MINIGAME:
      return <Minigame />;
    default:
      return <Menu />;
  }
}

function App() {
  return (
    <GameProvider>
      <div className="app">
        <header className="app-header">
          <h1>Gemstone Collector</h1>
        </header>
        <main className="app-main">
          <GameContent />
        </main>
        <footer className="app-footer">
          <div className="coins-display">
            <span className="coin-icon">💎</span>
            <span className="coin-amount">0</span>
          </div>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
