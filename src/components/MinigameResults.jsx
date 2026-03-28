// src/components/MinigameResults.jsx

import './MinigameResults.css';

export default function MinigameResults({ results, onPlayAgain, onBack }) {
  const { score, maxScore, tier, rewards, locationName } = results;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="results-overlay">
      <div className="results-card">
        <h2 className="results-title">{locationName}</h2>
        <div className="results-tier" style={{ color: getTierColor(tier.label) }}>
          {tier.label}
        </div>
        
        <div className="results-score">
          <div className="score-display">
            <span className="score-current">{score}</span>
            <span className="score-divider">/</span>
            <span className="score-max">{maxScore}</span>
          </div>
          <div className="score-percentage">{percentage}%</div>
        </div>

        <div className="results-rewards">
          <div className="reward-item">
            <span className="reward-icon">🪙</span>
            <span className="reward-value">+{rewards.coins}</span>
            <span className="reward-label">Coins</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">💎</span>
            <span className="reward-value">+{rewards.gems}</span>
            <span className="reward-label">Gems</span>
          </div>
          <div className="reward-item shift">
            <span className="reward-icon">⭐</span>
            <span className="reward-value">+{rewards.shiftPoints}</span>
            <span className="reward-label">Shift</span>
          </div>
        </div>

        <div className="results-actions">
          <button className="btn btn-gold" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            Back to Map
          </button>
        </div>
      </div>
    </div>
  );
}

function getTierColor(label) {
  const colors = {
    'Poor': '#888',
    'Average': '#4CAF50',
    'Good': '#2196F3',
    'Excellent': '#9C27B0',
    'Mastery': '#FF9800'
  };
  return colors[label] || '#FFF';
}
