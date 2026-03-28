import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import './Process.css';

export default function Process() {
  const { dispatch } = useGame();

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="process screen">
      <div className="placeholder-header">
        <h2 className="placeholder-title">Process</h2>
      </div>

      <div className="placeholder-content">
        <div className="placeholder-icon">⚙️</div>
        <h3 className="placeholder-status">Coming soon...</h3>
        <p className="placeholder-description">
          Transform rough gems through tumbling and faceting to enhance their beauty and value. 
          Choose cutting styles, control polishing levels, and watch your stones transform from raw to radiant.
        </p>
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
