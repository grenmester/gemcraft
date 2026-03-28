import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import './Craft.css';

export default function Craft() {
  const { dispatch } = useGame();

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="craft screen">
      <div className="placeholder-header">
        <h2 className="placeholder-title">Craft</h2>
      </div>

      <div className="placeholder-content">
        <div className="placeholder-icon">💍</div>
        <h3 className="placeholder-status">Coming soon...</h3>
        <p className="placeholder-description">
          Set your gems into stunning jewelry pieces. Select from rings, necklaces, earrings, and bracelets. 
          Mix and match metals, add inscriptions, and create custom pieces to sell or keep.
        </p>
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
