import { useGame, GAME_PHASES, SET_PHASE } from '../../../context/GameContext';

export default function Craft() {
  const { dispatch } = useGame();

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="flex flex-col items-center p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl text-[#ffd700] m-0">Craft</h2>
      </div>

      <div className="text-center max-w-[400px] p-8 bg-white/[0.05] rounded-xl mb-8">
        <div className="text-[4rem] mb-4">💍</div>
        <h3 className="text-[#4ecdc4] m-0 mb-4">Coming soon...</h3>
        <p className="text-[#ccc] leading-[1.6]">
          Set your gems into stunning jewelry pieces. Select from rings, necklaces, earrings, and bracelets. 
          Mix and match metals, add inscriptions, and create custom pieces to sell or keep.
        </p>
      </div>

      <button className="btn btn-secondary mt-auto" onClick={handleBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
