# Mini-Game System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Expand the mini-game system to support 16+ location-based mini-games with a modular architecture.

**Architecture:** 
- Registry pattern for mini-game registration (name, component, location, mechanics, rewards)
- Location system with unlock progression
- Base Minigame component with shared UI, delegating to game-specific implementations
- Score-to-reward mapping with tier-based bonuses

**Tech Stack:** React, Canvas API, existing GameContext

---

## Task 1: Mini-Game Registry & Location System

**Files:**
- Create: `src/data/minigames.js`
- Create: `src/data/locations.js`
- Create: `src/hooks/useMinigameRegistry.js`
- Modify: `src/constants.js`

**Step 1: Create minigames.js with base registry**

```javascript
// src/data/minigames.js

export const MINIGAME_TYPES = {
  PAN_CATCH: 'pan_catch',
  CHIP_REVEAL: 'chip_reveal',
  SIEVE_SORT: 'sieve_sort',
  CLIMB_COLLECT: 'climb_collect',
  TUNNEL_TRACE: 'tunnel_trace',
  READ_FLOW: 'read_flow',
  SHAKE_TABLE: 'shake_table',
  MARBLE_EXTRACT: 'marble_extract',
  EXCAVATE_REVEAL: 'excavate_reveal',
  VEIN_TRACE: 'vein_trace',
  ICE_CLIMB: 'ice_climb',
  PIPE_DROP: 'pipe_drop',
  DIAMOND_GRADE: 'diamond_grade',
  DUST_DISCOVER: 'dust_discover',
  MASTER_CHALLENGE: 'master_challenge',
};

export const SCORE_TIERS = [
  { min: 0, max: 25, label: 'Poor', shiftPoints: 1, multiplier: 0.5 },
  { min: 26, max: 50, label: 'Average', shiftPoints: 3, multiplier: 1.0 },
  { min: 51, max: 75, label: 'Good', shiftPoints: 5, multiplier: 1.25 },
  { min: 76, max: 90, label: 'Excellent', shiftPoints: 8, multiplier: 1.5 },
  { min: 91, max: 100, label: 'Mastery', shiftPoints: 15, multiplier: 2.0 },
];

export const getScoreTier = (percentage) => {
  return SCORE_TIERS.find(t => percentage >= t.min && percentage <= t.max) || SCORE_TIERS[0];
};

export const calculateRewards = (baseScore, tier, locationTier) => {
  const gemsFound = Math.floor(baseScore / 10);
  return {
    coins: Math.floor(baseScore * tier.multiplier),
    gems: Math.floor(gemsFound * tier.multiplier),
    shiftPoints: tier.shiftPoints,
    gemTier: tier.multiplier >= 1.5 ? locationTier + 1 : locationTier
  };
};
```

**Step 2: Create locations.js with location data**

```javascript
// src/data/locations.js

export const LOCATION_TIERS = {
  TIER_1: { name: 'River Panning', color: '#87CEEB', unlockLevel: 0 },
  TIER_1_B: { name: 'Ozark Hills', color: '#228B22', unlockLevel: 1 },
  TIER_1_C: { name: 'Bavarian Fields', color: '#DAA520', unlockLevel: 2 },
  TIER_2_A: { name: 'Ural Shores', color: '#8B4513', unlockLevel: 3 },
  TIER_2_B: { name: 'Bahia Mines', color: '#2F4F4F', unlockLevel: 5 },
  TIER_2_C: { name: 'Montana Streambed', color: '#4682B4', unlockLevel: 7 },
  TIER_3_A: { name: 'Minas Gerais', color: '#9932CC', unlockLevel: 10 },
  TIER_3_B: { name: 'Mogok Valley', color: '#DC143C', unlockLevel: 15 },
  TIER_3_C: { name: 'Sri Lanka Fields', color: '#FF8C00', unlockLevel: 20 },
  TIER_4_A: { name: 'Muzo Highlands', color: '#00FF7F', unlockLevel: 25 },
  TIER_4_B: { name: 'Kashmir Heights', color: '#4169E1', unlockLevel: 30 },
  TIER_4_C: { name: 'Argyle Caverns', color: '#FF1493', unlockLevel: 40 },
  TIER_5_A: { name: 'Golconda Depths', color: '#FFD700', unlockLevel: 50 },
  TIER_5_B: { name: 'Androy Dunes', color: '#9400D3', unlockLevel: 60 },
  TIER_5_C: { name: 'Mogok Hidden', color: '#FF0000', unlockLevel: 75 },
};

export const getLocationForTier = (tierKey) => LOCATION_TIERS[tierKey];
export const getUnlockedLocations = (level) => {
  return Object.entries(LOCATION_TIERS)
    .filter(([_, loc]) => loc.unlockLevel <= level)
    .map(([key, _]) => key);
};
```

**Step 3: Create useMinigameRegistry hook**

```javascript
// src/hooks/useMinigameRegistry.js

import { useState, useCallback } from 'react';

const registeredMinigames = new Map();

export const registerMinigame = (type, config) => {
  registeredMinigames.set(type, config);
};

export const getMinigame = (type) => {
  return registeredMinigames.get(type);
};

export const getAllMinigames = () => {
  return Array.from(registeredMinigames.values());
};

export function useMinigameRegistry() {
  const [activeMinigame, setActiveMinigame] = useState(null);

  const startMinigame = useCallback((type) => {
    const minigame = getMinigame(type);
    if (minigame) {
      setActiveMinigame(minigame);
    }
  }, []);

  const endMinigame = useCallback(() => {
    setActiveMinigame(null);
  }, []);

  return {
    activeMinigame,
    startMinigame,
    endMinigame,
    getMinigame,
    getAllMinigames,
  };
}
```

**Step 4: Update constants.js with new exports**

```javascript
// Add to src/constants.js

export { MINIGAME_TYPES, SCORE_TIERS, getScoreTier, calculateRewards } from '../data/minigames.js';
export { LOCATION_TIERS, getLocationForTier, getUnlockedLocations } from '../data/locations.js';
```

**Step 5: Commit**

```bash
cd .worktrees/prototype && git add src/data/minigames.js src/data/locations.js src/hooks/useMinigameRegistry.js src/constants.js && git commit -m "feat: add minigame registry and location system"
```

---

## Task 2: Base Minigame Component with Results Screen

**Files:**
- Create: `src/components/BaseMinigame.jsx`
- Create: `src/components/MinigameResults.jsx`
- Create: `src/components/MinigameResults.css`
- Modify: `src/components/Minigame.jsx`

**Step 1: Create MinigameResults component**

```javascript
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
```

**Step 2: Create MinigameResults.css**

```css
/* src/components/MinigameResults.css */

.results-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.results-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ffd93d;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.results-title {
  font-size: 24px;
  color: #ffd93d;
  margin-bottom: 8px;
}

.results-tier {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 24px;
}

.results-score {
  margin-bottom: 24px;
}

.score-display {
  font-size: 48px;
  font-weight: bold;
}

.score-current {
  color: #ffd93d;
}

.score-divider {
  color: #666;
  margin: 0 8px;
}

.score-max {
  color: #888;
}

.score-percentage {
  font-size: 20px;
  color: #4ecdc4;
}

.results-rewards {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.reward-icon {
  font-size: 32px;
}

.reward-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.reward-label {
  font-size: 12px;
  color: #888;
}

.reward-item.shift .reward-value {
  color: #ffd93d;
}

.results-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

**Step 3: Create BaseMinigame component**

```javascript
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
  onGameLoop,
  onInit,
  gameComponent: GameComponent
}) {
  const { dispatch } = useGame();
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const [results, setResults] = useState(null);
  
  const gameRef = useRef({ startTime: 0, animationId: null });
  const canvasRef = useRef(null);

  const handleGameUpdate = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleGameEnd = useCallback((finalScore) => {
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
    if (onInit) onInit();
  }, [duration, onInit]);

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
    if (onInit) onInit();
  }, [duration, onInit]);

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
        <canvas ref={canvasRef} className="minigame-canvas" />
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
```

**Step 4: Create BaseMinigame.css**

```css
/* src/components/BaseMinigame.css */

.base-minigame {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0a0f;
}

.base-minigame .minigame-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.5);
}

.base-minigame .minigame-title {
  color: #ffd93d;
  font-size: 20px;
  margin: 0;
}

.base-minigame .minigame-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.base-minigame .minigame-canvas {
  width: 100%;
  height: 100%;
}

.base-minigame .minigame-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.base-minigame .overlay-content {
  text-align: center;
  color: #fff;
}

.base-minigame .overlay-content h3 {
  font-size: 28px;
  margin-bottom: 24px;
  color: #ffd93d;
}

.base-minigame .back-btn {
  margin: 16px 20px;
}
```

**Step 5: Commit**

```bash
cd .worktrees/prototype && git add src/components/BaseMinigame.jsx src/components/MinigameResults.jsx src/components/*.css && git commit -m "feat: add base minigame component and results screen"
```

---

## Task 3: Chip & Reveal Mini-Game (Ozark Hills)

**Files:**
- Create: `src/components/ChipReveal.jsx`
- Create: `src/components/ChipReveal.css`
- Modify: `src/App.jsx`

**Step 1: Create ChipReveal minigame**

```javascript
// src/components/ChipReveal.jsx

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
    rocks: [],
    crystals: [],
    clicks: [],
    startTime: 0,
    animationId: null,
    canvasWidth: 0,
    canvasHeight: 0
  });

  const generateLevel = useCallback((width, height) => {
    const game = gameRef.current;
    game.rocks = [];
    game.crystals = [];
    game.clicks = [];

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

    game.rocks.forEach(rock => {
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#5a5a7a';
      ctx.fill();
      ctx.strokeStyle = '#3d3d5a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

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

    game.clicks.push({ x, y, time: Date.now() });
    
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

    for (const rock of game.rocks) {
      const dist = Math.hypot(x - rock.x, y - rock.y);
      if (dist <= rock.radius) {
        if (!hit) {
          setScore(prev => Math.max(0, prev - 5));
        }
        break;
      }
    }

    if (!hit) {
      game.rocks.push({ x, y, radius: 15 + Math.random() * 10 });
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
    game.rocks = [];
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
              <p>Avoid hitting the rocks!</p>
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
```

**Step 2: Create ChipReveal.css**

```css
/* src/components/ChipReveal.css */

.chip-reveal.screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0a0f;
}

.chip-reveal .minigame-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.5);
}

.chip-reveal .minigame-title {
  color: #228B22;
  font-size: 20px;
  margin: 0;
}

.chip-reveal .minigame-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chip-reveal .minigame-canvas {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.chip-reveal .minigame-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.chip-reveal .overlay-content {
  text-align: center;
  color: #fff;
  max-width: 300px;
}

.chip-reveal .overlay-content h3 {
  font-size: 28px;
  margin-bottom: 16px;
  color: #228B22;
}

.chip-reveal .overlay-content p {
  margin-bottom: 8px;
  color: #aaa;
}

.chip-reveal .back-btn {
  margin: 16px 20px;
}
```

**Step 3: Update App.jsx to include ChipReveal**

```javascript
// In src/App.jsx, add import and case:
import ChipReveal from './components/ChipReveal';

// In GameContent switch, add:
case 'chip_reveal':
  return <ChipReveal />;
```

**Step 4: Commit**

```bash
cd .worktrees/prototype && git add src/components/ChipReveal.jsx src/components/ChipReveal.css src/App.jsx && git commit -m "feat: add Chip & Reveal minigame for Ozark Hills"
```

---

## Task 4: Sieve & Sort Mini-Game (Bavarian Fields)

**Files:**
- Create: `src/components/SieveSort.jsx`
- Create: `src/components/SieveSort.css`
- Modify: `src/App.jsx`

**Step 1: Create SieveSort minigame**

```javascript
// src/components/SieveSort.jsx

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
    animationId: null,
    lastSpawn: 0,
    spawnInterval: 2000
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
    gameRef.current.lastSpawn = 0;
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
```

**Step 2: Create SieveSort.css**

```css
/* src/components/SieveSort.css */

.sieve-sort.screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
}

.sieve-sort .minigame-title {
  color: #DAA520;
}

.sieve-sort .target-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  color: #fff;
}

.sieve-sort .target-color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #fff;
  animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.sieve-sort .grid-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.sieve-sort .grid {
  display: grid;
  gap: 8px;
  max-width: 400px;
  width: 100%;
}

.sieve-sort .grid-cell {
  aspect-ratio: 1;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.3s;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.sieve-sort .grid-cell:hover {
  transform: scale(1.05);
}

.sieve-sort .grid-cell.found {
  opacity: 0.2;
  cursor: default;
}

.sieve-sort .grid-cell.debris {
  background: linear-gradient(135deg, #555 0%, #333 100%);
}

.sieve-sort .combo-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: bold;
  color: #ffd93d;
  animation: comboPopup 0.5s ease-out forwards;
}

@keyframes comboPopup {
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 0; transform: translate(-50%, -100%) scale(1.5); }
}
```

**Step 3: Update App.jsx to include SieveSort**

**Step 4: Commit**

```bash
cd .worktrees/prototype && git add src/components/SieveSort.jsx src/components/SieveSort.css src/App.jsx && git commit -m "feat: add Sieve & Sort minigame for Bavarian Fields"
```

---

## Task 5: Location Selection Screen

**Files:**
- Create: `src/components/LocationMap.jsx`
- Create: `src/components/LocationMap.css`
- Modify: `src/App.jsx`

**Step 1: Create LocationMap component**

```javascript
// src/components/LocationMap.jsx

import { useState } from 'react';
import { useGame, GAME_PHASES } from '../context/GameContext';
import { LOCATION_TIERS, getUnlockedLocations } from '../constants';
import './LocationMap.css';

export default function LocationMap() {
  const { state, dispatch } = useGame();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const playerLevel = Math.floor((state.player.shiftPoints || 0) / 100);
  const unlockedLocations = getUnlockedLocations(playerLevel);

  const locationEntries = Object.entries(LOCATION_TIERS);

  const handleLocationSelect = (locationKey) => {
    if (!unlockedLocations.includes(locationKey)) return;
    setSelectedLocation(locationKey);
  };

  const handleStartMinigame = () => {
    if (!selectedLocation) return;
    dispatch({ type: 'SET_PHASE', payload: selectedLocation });
  };

  const getMinigameForLocation = (locationKey) => {
    const mapping = {
      TIER_1: 'minigame',
      TIER_1_B: 'chip_reveal',
      TIER_1_C: 'sieve_sort',
      TIER_2_A: 'climb_collect',
      TIER_2_B: 'tunnel_trace',
      TIER_2_C: 'read_flow',
      TIER_3_A: 'shake_table',
      TIER_3_B: 'marble_extract',
      TIER_3_C: 'excavate_reveal',
      TIER_4_A: 'vein_trace',
      TIER_4_B: 'ice_climb',
      TIER_4_C: 'pipe_drop',
      TIER_5_A: 'diamond_grade',
      TIER_5_B: 'dust_discover',
      TIER_5_C: 'master_challenge',
    };
    return mapping[locationKey] || 'minigame';
  };

  const handleBack = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
  };

  return (
    <div className="location-map screen">
      <div className="map-header">
        <h2>World Map</h2>
        <div className="player-info">
          <span>Level: {playerLevel}</span>
          <span>Shift: {state.player.shiftPoints || 0}</span>
        </div>
      </div>

      <div className="locations-grid">
        {locationEntries.map(([key, location]) => {
          const isUnlocked = unlockedLocations.includes(key);
          return (
            <div
              key={key}
              className={`location-card ${isUnlocked ? 'unlocked' : 'locked'} ${selectedLocation === key ? 'selected' : ''}`}
              onClick={() => handleLocationSelect(key)}
              style={{ '--location-color': location.color }}
            >
              <div className="location-icon">
                {isUnlocked ? '🗺️' : '🔒'}
              </div>
              <div className="location-name">{location.name}</div>
              <div className="location-level">Lv. {location.unlockLevel}</div>
            </div>
          );
        })}
      </div>

      {selectedLocation && (
        <div className="location-actions">
          <button className="btn btn-gold" onClick={handleStartMinigame}>
            Start {LOCATION_TIERS[selectedLocation].name}
          </button>
        </div>
      )}

      <button className="btn btn-secondary back-btn" onClick={handleBack}>
        ← Back to Discover
      </button>
    </div>
  );
}
```

**Step 2: Create LocationMap.css**

```css
/* src/components/LocationMap.css */

.location-map.screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
}

.location-map .map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.location-map .map-header h2 {
  color: #ffd93d;
  margin: 0;
}

.location-map .player-info {
  display: flex;
  gap: 16px;
  color: #aaa;
}

.location-map .locations-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding-bottom: 80px;
}

.location-map .location-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.location-map .location-card.unlocked:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.location-map .location-card.selected {
  border-color: var(--location-color);
  background: rgba(255, 255, 255, 0.15);
}

.location-map .location-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-map .location-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.location-map .location-name {
  color: var(--location-color);
  font-weight: bold;
  margin-bottom: 4px;
}

.location-map .location-level {
  font-size: 12px;
  color: #888;
}

.location-map .location-actions {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
}

.location-map .back-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
}
```

**Step 3: Update App.jsx to include LocationMap**

**Step 4: Update Discover.jsx to navigate to LocationMap**

**Step 5: Commit**

```bash
cd .worktrees/prototype && git add src/components/LocationMap.jsx src/components/LocationMap.css src/App.jsx src/components/Discover.jsx && git commit -m "feat: add location selection map"
```

---

## Task 6: Final Integration & Testing

**Files:**
- Modify: `src/data/gems.json` (expand with location-specific gems)
- Modify: `src/components/Minigame.jsx` (update to use base system)
- Test: Verify all minigames work

**Step 1: Update gems.json with more variety**

```json
{
  "gems": [
    { "id": "quartz_clear", "name": "Clear Quartz", "hardness": 7, "type": "quartz", "value": 5, "locations": ["TIER_1"] },
    { "id": "amethyst", "name": "Amethyst", "hardness": 7, "type": "quartz", "value": 15, "locations": ["TIER_1", "TIER_2_A"] },
    { "id": "garnet", "name": "Garnet", "hardness": 7, "type": "garnet", "value": 25, "locations": ["TIER_1_B", "TIER_2_C"] },
    { "id": "citrine", "name": "Citrine", "hardness": 7, "type": "quartz", "value": 30, "locations": ["TIER_1_B"] },
    { "id": "tourmaline", "name": "Tourmaline", "hardness": 7.5, "type": "tourmaline", "value": 50, "locations": ["TIER_2_B"] },
    { "id": "aquamarine", "name": "Aquamarine", "hardness": 7.5, "type": "beryl", "value": 75, "locations": ["TIER_2_B"] },
    { "id": "emerald", "name": "Emerald", "hardness": 7.5, "type": "beryl", "value": 200, "locations": ["TIER_3_A", "TIER_4_A"] },
    { "id": "sapphire", "name": "Sapphire", "hardness": 9, "type": "corundum", "value": 150, "locations": ["TIER_2_C", "TIER_4_B"] },
    { "id": "ruby", "name": "Ruby", "hardness": 9, "type": "corundum", "value": 250, "locations": ["TIER_3_B", "TIER_4_B"] },
    { "id": "diamond", "name": "Diamond", "hardness": 10, "type": "diamond", "value": 500, "locations": ["TIER_4_C", "TIER_5_A"] },
    { "id": "alexandrite", "name": "Alexandrite", "hardness": 8.5, "type": "chrysoberyl", "value": 1000, "locations": ["TIER_5_C"] }
  ]
}
```

**Step 2: Verify build works**

```bash
cd .worktrees/prototype && npm run build
```

Expected: Build succeeds with 0 errors

**Step 3: Run dev server test**

```bash
cd .worktrees/prototype && npm run dev &
sleep 3
curl -s http://localhost:5173 | head -20
```

Expected: Dev server starts, HTML served

**Step 4: Commit**

```bash
cd .worktrees/prototype && git add src/data/gems.json && git commit -m "feat: expand gem data with location-specific gems"
```

---

**Plan complete and saved to `docs/plans/2026-03-28-minigame-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
