import { useRef, useState, useCallback, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { getScoreTier, calculateRewards } from '../constants';
import MinigameResults from './MinigameResults';
import './SieveSort.css';

const GAME_DURATION = 60000;
const MAX_SCORE = 300;
const GRID_SIZE = 4;
const GEM_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#9b59b6'];

export default function SieveSort() {
  const { dispatch } = useGame();
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [results, setResults] = useState(null);
  const [grid, setGrid] = useState([]);
  const [targetColor, setTargetColor] = useState(0);
  const [combo, setCombo] = useState(0);

  const gameRef = useRef({
    startTime: 0,
    animationId: null
  });

  const generateGrid = useCallback(() => {
    const newGrid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        const isGem = Math.random() > 0.3;
        row.push({
          id: `${i}-${j}-${Date.now()}`,
          isGem,
          color: isGem ? GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)] : '#666',
          found: false
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setTargetColor(Math.floor(Math.random() * GEM_COLORS.length));
    setCombo(0);
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (gameState !== 'playing') return;
    const cell = grid[row]?.[col];
    if (!cell || cell.found) return;

    if (cell.isGem && cell.color === GEM_COLORS[targetColor]) {
      const newGrid = [...grid];
      newGrid[row][col] = { ...cell, found: true };
      setGrid(newGrid);
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 10 + (newCombo * 5);
      setScore(prev => prev + points);
      
      setTimeout(() => {
        setTargetColor(Math.floor(Math.random() * GEM_COLORS.length));
        setCombo(0);
      }, 500);
    } else if (cell.isGem) {
      setScore(prev => Math.max(0, prev - 10));
      setCombo(0);
    } else {
      setScore(prev => Math.max(0, prev - 3));
    }
  }, [gameState, grid, targetColor, combo]);

  const startGame = useCallback(() => {
    gameRef.current.startTime = Date.now();
    generateGrid();
    setScore(0);
    setTimeLeft(GAME_DURATION / 1000);
    setGameState('playing');
  }, [generateGrid]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - gameRef.current.startTime;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
        endGame();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  const endGame = useCallback(() => {
    const percentage = (score / MAX_SCORE) * 100;
    const tier = getScoreTier(percentage);
    const rewards = calculateRewards(score, tier, 1);

    if (rewards.coins > 0) {
      dispatch({ type: 'ADD_COINS', payload: rewards.coins });
    }
    if (rewards.shiftPoints > 0) {
      dispatch({ type: 'ADD_SHIFT_POINTS', payload: rewards.shiftPoints });
    }

    setResults({
      score,
      maxScore: MAX_SCORE,
      tier,
      rewards,
      locationName: 'Bavarian Fields'
    });
    setGameState('finished');
  }, [score, dispatch]);

  const handlePlayAgain = useCallback(() => {
    setResults(null);
    startGame();
  }, [startGame]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  }, [dispatch]);

  return (
    <div className="sieve-sort screen">
      <div className="minigame-header">
        <h2 className="minigame-title">Sieve & Sort</h2>
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
            <div className="stat">
              <span className="stat-label">Combo</span>
              <span className="stat-value">{combo}x</span>
            </div>
          </div>
        )}
      </div>

      <div className="minigame-container">
        {gameState === 'playing' && (
          <div className="target-indicator">
            <span>Find: </span>
            <span 
              className="target-color" 
              style={{ backgroundColor: GEM_COLORS[targetColor] }}
            />
          </div>
        )}

        <div className="grid-container">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.flat().map((cell, idx) => (
              <div
                key={cell.id}
                className={`grid-cell ${cell.isGem ? 'gem' : 'debris'} ${cell.found ? 'found' : ''}`}
                style={{ backgroundColor: cell.found ? 'transparent' : (cell.isGem ? cell.color : '#555') }}
                onClick={() => !cell.found && handleCellClick(Math.floor(idx / GRID_SIZE), idx % GRID_SIZE)}
              />
            ))}
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="minigame-overlay">
            <div className="overlay-content">
              <h3>Sieve & Sort</h3>
              <p>Click gems matching the target color!</p>
              <p>Build combos for bonus points!</p>
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
