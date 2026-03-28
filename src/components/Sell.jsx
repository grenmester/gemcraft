import { useGame, GAME_PHASES, SET_PHASE } from '../context/GameContext';
import './Sell.css';

export default function Sell() {
  const { dispatch } = useGame();

  const handleBack = () => {
    dispatch({ type: SET_PHASE, payload: GAME_PHASES.MENU });
  };

  return (
    <div className="sell screen">
      <div className="placeholder-header">
        <h2 className="placeholder-title">Sell</h2>
      </div>

      <div className="placeholder-content">
        <div className="placeholder-icon">🏪</div>
        <h3 className="placeholder-status">Coming soon...</h3>
        <p className="placeholder-description">
          Find buyers for your gems and jewelry. Negotiate prices with clients, fulfill special orders, 
          or sell at the marketplace. Build relationships with collectors and maximize your profits.
        </p>
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Menu
      </button>
    </div>
  );
}
