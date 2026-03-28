// src/components/MinigameResults.jsx

export default function MinigameResults({ results, onPlayAgain, onBack }) {
  const { score, maxScore, tier, rewards, locationName } = results;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-[100]">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-[#ffd93d] rounded-2xl p-8 text-center max-w-[400px] w-[90%]">
        <h2 className="text-2xl text-[#ffd93d] mb-2">{locationName}</h2>
        <div className="text-lg font-bold mb-6" style={{ color: getTierColor(tier.label) }}>
          {tier.label}
        </div>
        
        <div className="mb-6">
          <div className="text-[48px] font-bold">
            <span className="text-[#ffd93d]">{score}</span>
            <span className="text-[#666] mx-2">/</span>
            <span className="text-[#888]">{maxScore}</span>
          </div>
          <div className="text-xl text-[#4ecdc4]">{percentage}%</div>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[32px]">🪙</span>
            <span className="text-2xl font-bold text-white">+{rewards.coins}</span>
            <span className="text-xs text-[#888]">Coins</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[32px]">💎</span>
            <span className="text-2xl font-bold text-white">+{rewards.gems}</span>
            <span className="text-xs text-[#888]">Gems</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[32px]">⭐</span>
            <span className="text-2xl font-bold text-[#ffd93d]">+{rewards.shiftPoints}</span>
            <span className="text-xs text-[#888]">Shift</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
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
