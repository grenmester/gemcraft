import { useRef, useState, useCallback, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../../../context/GameContext';
import { getScoreTier, calculateRewards } from '../../../constants';
import MinigameResults from './MinigameResults';

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
    <div className="flex flex-col h-screen bg-[#1a1a2e]">
      <div className="flex justify-between items-center px-5 py-4 bg-black/50">
        <h2 className="text-[#DAA520] text-xl m-0">Sieve & Sort</h2>
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

      <div className="flex-1 relative overflow-hidden">
        {gameState === 'playing' && (
          <div className="flex items-center justify-center gap-3 p-4 bg-black/50 text-[24px] text-white">
            <span>Find: </span>
            <span 
              className="w-10 h-10 rounded-full border-3 border-white animate-[pulse_0.5s_ease-in-out_infinite_alternate]"
              style={{ backgroundColor: GEM_COLORS[targetColor] }}
            />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-5">
          <div className="grid gap-2 max-w-[400px] w-full" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.flat().map((cell, idx) => (
              <div
                key={cell.id}
                className={`aspect-square rounded-xl cursor-pointer transition-transform duration-100 transition-opacity duration-300 border-2 border-white/20 hover:scale-105 ${cell.found ? 'opacity-20 cursor-default' : ''} ${cell.isGem ? 'gem' : 'bg-gradient-to-br from-[#555] to-[#333]'}`}
                style={{ backgroundColor: cell.found ? 'transparent' : (cell.isGem ? cell.color : '#555') }}
                onClick={() => !cell.found && handleCellClick(Math.floor(idx / GRID_SIZE), idx % GRID_SIZE)}
              />
            ))}
          </div>
        </div>

        {gameState === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-8">
              <h3 className="text-[1.75rem] text-[#DAA520] mb-2">Sieve & Sort</h3>
              <p className="text-gray-400 mb-6">Click gems matching the target color!</p>
              <p className="text-gray-400 mb-6">Build combos for bonus points!</p>
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
