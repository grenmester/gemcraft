import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import './Menu.css';

const menuButtons = [
  { label: 'Discover', phase: GAME_PHASES.DISCOVER, icon: '🔍' },
  { label: 'Process', phase: GAME_PHASES.PROCESS, icon: '⚙️' },
  { label: 'Craft', phase: GAME_PHASES.CRAFT, icon: '💎' },
  { label: 'Sell', phase: GAME_PHASES.SELL, icon: '💰' },
  { label: 'Gemdex', phase: 'gemdex', icon: '📖' },
  { label: 'Inventory', phase: 'inventory', icon: '🎒' }
];

export default function Menu() {
  const { dispatch } = useGame();

  const handleNavigation = (phase) => {
    dispatch({ type: SET_PHASE, payload: phase });
  };

  return (
    <div className="menu screen">
      <div className="menu-header">
        <h1 className="menu-title">Gemstone</h1>
        <p className="menu-tagline">Build your gem empire</p>
      </div>
      <nav className="menu-nav">
        {menuButtons.map(({ label, phase, icon }) => (
          <button
            key={phase}
            className="menu-btn btn btn-gold"
            onClick={() => handleNavigation(phase)}
          >
            <span className="menu-btn-icon">{icon}</span>
            <span className="menu-btn-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
