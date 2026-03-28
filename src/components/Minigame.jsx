import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import gemsData from '../data/gems.json';
import './Minigame.css';

const GAME_DURATION = 15000;
const SPAWN_INTERVAL = 600;
const GEM_CHANCE = 0.7;

const SCORE_TIERS = [
  { minScore: 0, maxScore: 30, shiftPoints: 1, label: 'Below Average' },
  { minScore: 31, maxScore: 60, shiftPoints: 3, label: 'Average' },
  { minScore: 61, maxScore: 100, shiftPoints: 5, label: 'Good' },
  { minScore: 101, maxScore: 150, shiftPoints: 8, label: 'Excellent' },
  { minScore: 151, maxScore: Infinity, shiftPoints: 15, label: 'Mastery!' },
];

const GEM_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#9b59b6', '#3498db', '#2ecc71'];
const DEBRIS_COLOR = '#8b7355';

export default function Minigame() {
  const { dispatch } = useGame();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [finalResults, setFinalResults] = useState(null);

  const gameRef = useRef({
    items: [],
    score: 0,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastPanX: 0,
    animationId: null,
    spawnTimer: null,
    gameTimer: null,
    startTime: 0,
    canvasWidth: 0,
    canvasHeight: 0
  });

  const spawnItem = useCallback(() => {
    const game = gameRef.current;
    const isGem = Math.random() < GEM_CHANCE;
    const size = isGem ? 30 + Math.random() * 20 : 25 + Math.random() * 15;
    const gemType = gemsData.gems[Math.floor(Math.random() * gemsData.gems.length)];

    game.items.push({
      x: Math.random() * (game.canvasWidth - size * 2) + size,
      y: -size,
      size,
      speed: 2 + Math.random() * 3,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      isGem,
      color: isGem ? GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)] : DEBRIS_COLOR,
      gemType,
      caught: false
    });
  }, []);

  const checkCollision = useCallback((item, panX, panY, panWidth, panHeight) => {
    if (item.caught) return false;
    const panLeft = panX - panWidth / 2;
    const panRight = panX + panWidth / 2;
    const panTop = panY - panHeight / 2;
    const panBottom = panY + panHeight / 2;

    const itemCenterX = item.x;
    const itemCenterY = item.y;
    const itemRadius = item.size / 2;

    return (
      itemCenterX + itemRadius > panLeft &&
      itemCenterX - itemRadius < panRight &&
      itemCenterY + itemRadius > panTop &&
      itemCenterY - itemRadius < panBottom
    );
  }, []);

  const drawGem = useCallback((ctx, item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);

    ctx.beginPath();
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
      const x = Math.cos(angle) * item.size / 2;
      const y = Math.sin(angle) * item.size / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, -item.size / 4, 0, 0, 0, item.size / 2);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.3, item.color);
    gradient.addColorStop(1, item.color);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawDebris = useCallback((ctx, item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.fillStyle = '#6b5344';
    ctx.beginPath();
    ctx.arc(-item.size / 6, -item.size / 6, item.size / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawPan = useCallback((ctx, panX, panY, panWidth, panHeight) => {
    ctx.save();

    ctx.beginPath();
    ctx.ellipse(panX, panY + panHeight / 3, panWidth / 2, panHeight / 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8b4513';
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(panX, panY, panWidth / 2, panHeight / 2, 0, 0, Math.PI * 2);
    const panGradient = ctx.createRadialGradient(panX, panY, 0, panX, panY, panWidth / 2);
    panGradient.addColorStop(0, '#cd853f');
    panGradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = panGradient;
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const game = gameRef.current;

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, game.canvasWidth, game.canvasHeight);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

    for (let i = game.items.length - 1; i >= 0; i--) {
      const item = game.items[i];
      
      if (!item.caught) {
        item.y += item.speed;
        item.rotation += item.rotationSpeed;
      }

      if (checkCollision(item, game.panX, game.panY, 120, 60)) {
        item.caught = true;
        if (item.isGem) {
          game.score += 10;
        } else {
          game.score = Math.max(0, game.score - 5);
        }
        setScore(game.score);
      }

      if (!item.caught && item.y > game.canvasHeight + item.size) {
        game.items.splice(i, 1);
        continue;
      }

      if (item.caught && item.y < game.canvasHeight + 50) {
        item.y += 8;
      } else if (item.caught && item.y >= game.canvasHeight + 50) {
        game.items.splice(i, 1);
        continue;
      }

      if (item.isGem) {
        drawGem(ctx, item);
      } else {
        drawDebris(ctx, item);
      }
    }

    drawPan(ctx, game.panX, game.panY, 120, 60);

    const elapsed = Date.now() - game.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    setTimeLeft(Math.ceil(remaining / 1000));

    if (remaining > 0) {
      game.animationId = requestAnimationFrame(gameLoop);
    } else {
      endGame();
    }
  }, [checkCollision, drawGem, drawDebris, drawPan]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const game = gameRef.current;
    game.items = [];
    game.score = 0;
    game.panX = canvas.width / 2;
    game.panY = canvas.height - 80;
    game.startTime = Date.now();
    game.canvasWidth = canvas.width;
    game.canvasHeight = canvas.height;
    game.isDragging = false;

    setScore(0);
    setTimeLeft(GAME_DURATION / 1000);
    setGameState('playing');

    game.spawnTimer = setInterval(spawnItem, SPAWN_INTERVAL);
    spawnItem();

    game.animationId = requestAnimationFrame(gameLoop);
  }, [spawnItem, gameLoop]);

  const calculateShiftPoints = (score) => {
    const tier = SCORE_TIERS.find(t => score >= t.minScore && score <= t.maxScore);
    return tier ? tier.shiftPoints : 1;
  };

  const getScoreTierLabel = (score) => {
    const tier = SCORE_TIERS.find(t => score >= t.minScore && score <= t.maxScore);
    return tier ? tier.label : 'Unknown';
  };

  const endGame = useCallback(() => {
    const game = gameRef.current;

    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
    if (game.spawnTimer) {
      clearInterval(game.spawnTimer);
    }
    if (game.gameTimer) {
      clearInterval(game.gameTimer);
    }

    const finalScore = game.score;
    const gemsFound = Math.floor(finalScore / 10);
    const hasBonus = finalScore > 100;
    const multiplier = hasBonus ? 1.5 : 1;
    const coinReward = Math.floor(finalScore * multiplier);
    const gemReward = Math.floor(gemsFound * multiplier);
    const shiftPointsEarned = calculateShiftPoints(finalScore);
    const tierLabel = getScoreTierLabel(finalScore);

    setFinalResults({
      score: finalScore,
      gemsFound,
      coinReward,
      gemReward,
      hasBonus,
      shiftPointsEarned,
      tierLabel
    });
    setGameState('finished');

    if (coinReward > 0) {
      dispatch({ type: 'ADD_COINS', payload: coinReward });
    }
    for (let i = 0; i < gemReward; i++) {
      const randomGem = gemsData.gems[Math.floor(Math.random() * gemsData.gems.length)];
      dispatch({
        type: 'ADD_GEM',
        payload: {
          id: `${randomGem.id}_${Date.now()}_${i}`,
          name: randomGem.name,
          mohs: randomGem.hardness,
          color: randomGem.type,
          facts: [],
          values: [randomGem.value]
        }
      });
    }
    dispatch({ type: 'ADD_SHIFT_POINTS', payload: shiftPointsEarned });
  }, [dispatch]);

  const handlePointerDown = useCallback((e) => {
    if (gameState !== 'playing') return;
    const game = gameRef.current;
    game.isDragging = true;
    game.lastPanX = e.clientX || e.touches?.[0]?.clientX || 0;
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (gameState !== 'playing') return;
    const game = gameRef.current;
    if (!game.isDragging) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const deltaX = clientX - game.lastPanX;
    game.panX = Math.max(60, Math.min(game.canvasWidth - 60, game.panX + deltaX));
    game.lastPanX = clientX;
  }, [gameState]);

  const handlePointerUp = useCallback(() => {
    gameRef.current.isDragging = false;
  }, []);

  const handleBack = useCallback(() => {
    const game = gameRef.current;
    if (game.animationId) cancelAnimationFrame(game.animationId);
    if (game.spawnTimer) clearInterval(game.spawnTimer);
    if (game.gameTimer) clearInterval(game.gameTimer);
    setGameState('ready');
    setFinalResults(null);
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  }, [dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchend', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const game = gameRef.current;
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
    }
    if (game.spawnTimer) {
      clearInterval(game.spawnTimer);
    }
  }, []);

  return (
    <div className="minigame screen">
      <div className="minigame-header">
        <h2 className="minigame-title">Gem Panning</h2>
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

      <div className="minigame-container" ref={containerRef}>
        <canvas ref={canvasRef} className="minigame-canvas" />

        {gameState === 'ready' && (
          <div className="minigame-overlay">
            <div className="overlay-content">
              <h3>Ready to Pan?</h3>
              <p>Swipe to catch gems and avoid debris!</p>
              <div className="rules">
                <div className="rule">
                  <span className="rule-icon gem-icon">💎</span>
                  <span>Gems = +10 points</span>
                </div>
                <div className="rule">
                  <span className="rule-icon debris-icon">🪨</span>
                  <span>Debris = -5 points</span>
                </div>
              </div>
              <button className="btn btn-gold" onClick={startGame}>
                Start Panning
              </button>
            </div>
          </div>
        )}

        {gameState === 'finished' && finalResults && (
          <div className="minigame-overlay">
            <div className="overlay-content results">
              <h3>Panning Complete!</h3>
              <div className="final-score">
                <span className="score-label">Final Score</span>
                <span className="score-value">{finalResults.score}</span>
              </div>
              <div className="tier-label">
                {finalResults.tierLabel}
              </div>
              <div className="rewards">
                <div className="reward">
                  <span className="reward-icon">🪙</span>
                  <span>+{finalResults.coinReward} Coins</span>
                </div>
                <div className="reward">
                  <span className="reward-icon">💎</span>
                  <span>+{finalResults.gemReward} Gems</span>
                </div>
                <div className="reward shift-reward">
                  <span className="reward-icon">⭐</span>
                  <span>+{finalResults.shiftPointsEarned} Shift Points</span>
                </div>
              </div>
              {finalResults.hasBonus && (
                <div className="bonus-notice">
                  🎉 1.5x Bonus Applied! (Score &gt; 100)
                </div>
              )}
              <button className="btn btn-gold" onClick={startGame}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Discover
      </button>
    </div>
  );
}
