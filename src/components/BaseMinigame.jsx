// src/components/BaseMinigame.jsx

import { useState, useCallback, useRef } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { getScoreTier, calculateRewards } from '../constants';
import MinigameResults from './MinigameResults';
import './BaseMinigame.css';

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
    <div className="base-minigame screen">
      <div className="minigame-header">
        <h2 className="minigame-title">{title}</h2>
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

      <div className="minigame-container">
        {typeof children === 'function' 
          ? children(props) 
          : children}
        
        {gameState === 'ready' && (
          <div className="minigame-overlay">
            <div className="overlay-content">
              <h3>{title}</h3>
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

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back
      </button>
    </div>
  );
}
