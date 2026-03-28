import { useGame, GAME_PHASES, SET_PHASE } from '../../context/GameContext';

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
    <div className="flex-1 flex flex-col items-center justify-center gap-8 md:gap-12 p-4 md:p-6 w-full max-w-screen-sm mx-auto">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400" style={{ textShadow: '0 0 30px rgba(255, 217, 61, 0.5)', letterSpacing: '0.1em' }}>
          Gemstone
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mt-2" style={{ letterSpacing: '0.05em' }}>
          Build your gem empire
        </p>
      </div>
      <nav className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full max-w-md md:max-w-lg">
        {menuButtons.map(({ label, phase, icon }) => (
          <button
            key={phase}
            className="flex flex-col items-center justify-center gap-2 p-4 md:p-6 text-lg font-semibold min-w-[120px] bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 rounded-lg hover:from-yellow-300 hover:to-amber-400 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            onClick={() => handleNavigation(phase)}
          >
            <span className="text-2xl md:text-3xl">{icon}</span>
            <span className="text-center">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
