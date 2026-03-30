// src/components/BaseMinigame.jsx

import { useState, useCallback, useRef } from 'react';
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { getScoreTier, calculateRewards } from '../../../constants';
import MinigameResults from './MinigameResults';

export default function BaseMinigame({ 
  title,
  locationName,
  locationTier,
  maxScore = 200,
  duration = 15000,
  children,
  onGameUpdate,
  onGameEnd
}) {
  const { dispatch } = useGame();
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [results, setResults] = useState(null);

  const gameRef = useRef({ startTime: 0, animationId: null });

  const handleScoreUpdate = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleEndGame = useCallback((finalScore) => {
    const percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
    const tier = getScoreTier(percentage);
    const rewards = calculateRewards(finalScore, tier, locationTier);

    if (rewards.coins > 0) {
      dispatch({ type: 'ADD_COINS', payload: rewards.coins });
    }
    if (rewards.shiftPoints > 0) {
      dispatch({ type: 'ADD_SHIFT_POINTS', payload: rewards.shiftPoints });
    }
    
    setResults({
      score: finalScore,
      maxScore,
      tier,
      rewards,
      locationName
    });
    setGameState('finished');
  }, [maxScore, locationTier, locationName, dispatch]);

  const handlePlayAgain = useCallback(() => {
    setResults(null);
    setScore(0);
    setTimeLeft(duration / 1000);
    setGameState('playing');
  }, [duration]);

  const handleBack = useCallback(() => {
    if (gameRef.current.animationId) {
      cancelAnimationFrame(gameRef.current.animationId);
    }
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  }, [dispatch]);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(duration / 1000);
    setGameState('playing');
  }, [duration]);

  const props = {
    gameState,
    score,
    setScore,
    timeLeft,
    setTimeLeft,
    maxScore,
    duration,
    onScoreUpdate: handleScoreUpdate,
    onEndGame: handleEndGame,
    onStartGame: startGame,
    gameRef
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <div className="flex justify-between items-center px-5 py-4 bg-black/50">
        <h2 className="text-[#ffd93d] text-xl m-0">{title}</h2>
        {gameState === 'playing' && (
          <div className="minigame-stats">
            <div className="stat">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Time</span>
              <span className="stat-value">{timeLeft}s</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        {typeof children === 'function' 
          ? children(props) 
          : children}
        
        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <h3 className="text-[28px] mb-6 text-[#ffd93d]">{title}</h3>
              <button className="btn btn-gold" onClick={startGame}>
                Start Game
              </button>
            </div>
          </div>
        )}
        
        {gameState === 'finished' && results && (
          <MinigameResults
            results={results}
            onPlayAgain={handlePlayAgain}
            onBack={handleBack}
          />
        )}
      </div>

      <button className="btn btn-secondary mx-5 my-4" onClick={handleBack}>
        ← Back
      </button>
    </div>
  );
}
