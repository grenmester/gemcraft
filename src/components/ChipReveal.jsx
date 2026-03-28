import { useRef, useState, useCallback, useEffect } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { getScoreTier, calculateRewards } from '../constants';
import MinigameResults from './MinigameResults';
import './ChipReveal.css';

const GAME_DURATION = 45000;
const MAX_SCORE = 200;

export default function ChipReveal() {
  const { dispatch } = useGame();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [results, setResults] = useState(null);

  const gameRef = useRef({
    crystals: [],
    startTime: 0,
    animationId: null,
    canvasWidth: 0,
    canvasHeight: 0
  });

  const generateLevel = useCallback((width, height) => {
    const game = gameRef.current;
    game.crystals = [];

    const crystalCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < crystalCount; i++) {
      game.crystals.push({
        x: 50 + Math.random() * (width - 100),
        y: 50 + Math.random() * (height - 100),
        radius: 20 + Math.random() * 15,
        found: false,
        flashTime: Date.now() + 2000 + Math.random() * 3000
      });
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const game = gameRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

    const now = Date.now();
    game.crystals.forEach(crystal => {
      if (crystal.found) return;

      const isFlashing = now >= crystal.flashTime && now < crystal.flashTime + 500;
      const alpha = isFlashing ? 0.5 + Math.sin(now / 100) * 0.5 : 0.2;

      ctx.beginPath();
      ctx.moveTo(crystal.x, crystal.y - crystal.radius);
      ctx.lineTo(crystal.x + crystal.radius * 0.8, crystal.y);
      ctx.lineTo(crystal.x, crystal.y + crystal.radius * 0.5);
      ctx.lineTo(crystal.x - crystal.radius * 0.8, crystal.y);
      ctx.closePath();

      ctx.fillStyle = `rgba(147, 112, 219, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(200, 150, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isFlashing) {
        ctx.shadowColor = '#9370db';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }, []);

  const gameLoop = useCallback(() => {
    draw();
    const elapsed = Date.now() - gameRef.current.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    setTimeLeft(Math.ceil(remaining / 1000));

    if (remaining > 0) {
      gameRef.current.animationId = requestAnimationFrame(gameLoop);
    } else {
      endGame();
    }
  }, [draw]);

  const endGame = useCallback(() => {
    const { animationId } = gameRef.current;
    if (animationId) cancelAnimationFrame(animationId);

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
      locationName: 'Ozark Hills'
    });
    setGameState('finished');
  }, [score, dispatch]);

  const handleClick = useCallback((e) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const game = gameRef.current;

    let hit = false;
    for (const crystal of game.crystals) {
      if (crystal.found) continue;
      const dist = Math.hypot(x - crystal.x, y - crystal.y);
      if (dist <= crystal.radius + 10) {
        crystal.found = true;
        const points = 15 + Math.floor(Math.random() * 10);
        setScore(prev => prev + points);
        hit = true;
        break;
      }
    }

    if (!hit) {
      setScore(prev => Math.max(0, prev - 5));
    }
  }, [gameState]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const game = gameRef.current;
    game.canvasWidth = canvas.width;
    game.canvasHeight = canvas.height;
    game.startTime = Date.now();

    generateLevel(canvas.width, canvas.height);
    setScore(0);
    setTimeLeft(GAME_DURATION / 1000);
    setGameState('playing');
    gameRef.current.animationId = requestAnimationFrame(gameLoop);
  }, [generateLevel, gameLoop]);

  const handlePlayAgain = useCallback(() => {
    setResults(null);
    startGame();
  }, [startGame]);

  const handleBack = useCallback(() => {
    if (gameRef.current.animationId) {
      cancelAnimationFrame(gameRef.current.animationId);
    }
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, []);

  return (
    <div className="chip-reveal screen">
      <div className="minigame-header">
        <h2 className="minigame-title">Chip & Reveal</h2>
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
        <canvas 
          ref={canvasRef} 
          className="minigame-canvas"
          onClick={handleClick}
        />
        {gameState === 'ready' && (
          <div className="minigame-overlay">
            <div className="overlay-content">
              <h3>Chip & Reveal</h3>
              <p>Tap crystals when they flash to reveal them!</p>
              <p>Avoid empty areas (-5 points)</p>
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
