# Gemstone: React Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable React prototype with core loop (Acquire→Process→Craft→Sell), one mini-game prototype, idle system, and gem data model.

**Architecture:** React SPA with modular components:
- GameProvider (global state management)
- Phase controllers (Discover, Process, Craft, Sell)
- Mini-game engine (pluggable mini-games)
- IdleSystem hook
- Data layer (gems, player state, progression)

**Tech Stack:** React 18 + Vite + CSS Modules

---

## Phase 1: Project Foundation

### Task 1: React Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/App.css`
- Create: `src/constants.js`
- Create: `src/data/gems.json`

**Step 1: Create package.json**

```json
{
  "name": "gemstone",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

**Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gemstone</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 5: Create src/constants.js**

```js
export const MOHSCALE = {
  talc: 1,
  gypsum: 2,
  calcite: 3,
  fluorite: 4,
  apatite: 5,
  orthoclase: 6,
  quartz: 7,
  topaz: 8,
  corundum: 9,
  diamond: 10
};

export const GEM_TIERS = {
  COMMON: { min: 1, max: 4 },
  UNCOMMON: { min: 5, max: 6 },
  RARE: { min: 7, max: 8 },
  EPIC: { min: 9, max: 9 },
  LEGENDARY: { min: 10, max: 10 }
};

export const GAME_CONFIG = {
  MAX_IDLE_HOURS: 8,
  TICK_INTERVAL: 1000,
  SAVE_INTERVAL: 30000
};

export const GAME_PHASES = {
  MENU: 'menu',
  DISCOVER: 'discover',
  PROCESS: 'process',
  CRAFT: 'craft',
  SELL: 'sell',
  MINIGAME: 'minigame'
};
```

**Step 6: Create src/data/gems.json**

```json
{
  "gems": [
    {
      "id": "quartz_clear",
      "name": "Clear Quartz",
      "mineral": "quartz",
      "mohs": 7,
      "crystalSystem": "trigonal",
      "color": "#ffffff",
      "facts": ["Six-fold symmetry", "Piezoelectric properties"],
      "rawValue": 5,
      "processedValue": 15
    },
    {
      "id": "amethyst",
      "name": "Amethyst",
      "mineral": "quartz",
      "mohs": 7,
      "crystalSystem": "trigonal",
      "color": "#9b59b6",
      "facts": ["February birthstone", "Color caused by iron impurities"],
      "rawValue": 12,
      "processedValue": 35
    },
    {
      "id": "citrine",
      "name": "Citrine",
      "mineral": "quartz",
      "mohs": 7,
      "crystalSystem": "trigonal",
      "color": "#f39c12",
      "facts": ["November birthstone", "Often heat-treated amethyst"],
      "rawValue": 15,
      "processedValue": 45
    },
    {
      "id": "garnet",
      "name": "Garnet",
      "mineral": "garnet",
      "mohs": 7,
      "crystalSystem": "cubic",
      "color": "#c0392b",
      "facts": ["January birthstone", "Commonly found with diamonds"],
      "rawValue": 25,
      "processedValue": 75
    },
    {
      "id": "emerald",
      "name": "Emerald",
      "mineral": "beryl",
      "mohs": 7.5,
      "crystalSystem": "hexagonal",
      "color": "#27ae60",
      "facts": ["May birthstone", "Often contains inclusions called 'jardin'"],
      "rawValue": 200,
      "processedValue": 500
    }
  ]
}
```

**Step 7: Verify React project builds**

Run: `npm install && npm run dev`
Expected: Development server starts, page loads with "Gemstone" or empty app

---

### Task 2: Core Data Models

**Files:**
- Create: `src/models/Gem.js`
- Create: `src/models/Player.js`
- Create: `src/models/Inventory.js`

**Step 1: Create Gem model**

```js
export class Gem {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.mineral = data.mineral;
    this.mohs = data.mohs;
    this.crystalSystem = data.crystalSystem;
    this.color = data.color;
    this.facts = data.facts;
    this.rawValue = data.rawValue;
    this.processedValue = data.processedValue;
    this.processed = false;
    this.quality = 1.0;
  }
  
  getDisplayValue() {
    const base = this.processed ? this.processedValue : this.rawValue;
    return Math.floor(base * this.quality);
  }
}
```

**Step 2: Create Player model**

```js
export class Player {
  constructor() {
    this.coins = 100;
    this.gems = [];
    this.processedGems = [];
    this.completedPieces = [];
    this.gemdex = {};
    this.pathProgress = {
      prospector: 1,
      lapidary: 1,
      jeweler: 1,
      dealer: 1
    };
    this.calibrationBonus = 1.0;
    this.lastSave = Date.now();
  }
  
  addGem(gem) {
    this.gems.push(gem);
    this.discoverGem(gem.id);
  }
  
  discoverGem(gemId) {
    if (!this.gemdex[gemId]) {
      this.gemdex[gemId] = { discovered: true, timesSeen: 1 };
    } else {
      this.gemdex[gemId].timesSeen++;
    }
  }
  
  toJSON() {
    return {
      coins: this.coins,
      gems: this.gems.map(g => ({ ...g })),
      gemdex: this.gemdex,
      pathProgress: this.pathProgress,
      calibrationBonus: this.calibrationBonus,
      lastSave: Date.now()
    };
  }
}
```

**Step 3: Create Inventory model**

```js
export class Inventory {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.items = [];
  }
  
  add(item) {
    if (this.items.length >= this.capacity) {
      return false;
    }
    this.items.push(item);
    return true;
  }
  
  remove(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      return this.items.splice(index, 1)[0];
    }
    return null;
  }
  
  get count() {
    return this.items.length;
  }
}
```

---

## Phase 2: Game State Management

### Task 3: Game Context Provider

**Files:**
- Create: `src/context/GameContext.jsx`

**Step 1: Create GameContext**

```jsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { Player } from '../models/Player';
import { Inventory } from '../models/Inventory';
import { Gem } from '../models/Gem';
import { GAME_PHASES } from '../constants';
import gemsData from '../data/gems.json';

const GameContext = createContext(null);

const initialState = {
  phase: GAME_PHASES.MENU,
  player: new Player(),
  inventory: new Inventory(),
  activeMinigame: null,
  idleSystem: null
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_MINIGAME':
      return { ...state, activeMinigame: action.payload };
    case 'ADD_GEM': {
      const gem = action.payload;
      state.player.addGem(gem);
      state.inventory.add(gem);
      return { ...state };
    }
    case 'ADD_COINS':
      return { ...state, player: { ...state.player, coins: state.player.coins + action.payload }};
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Load saved game on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemstone_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const player = new Player();
        player.coins = data.player.coins;
        player.gemdex = data.player.gemdex;
        player.pathProgress = data.player.pathProgress;
        player.calibrationBonus = data.player.calibrationBonus;
        
        const inventory = new Inventory();
        inventory.items = data.player.gems || [];
        
        dispatch({ 
          type: 'LOAD_STATE', 
          payload: { player, inventory, phase: data.phase || GAME_PHASES.MENU }
        });
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
  }, []);
  
  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      const saveData = {
        version: 1,
        timestamp: Date.now(),
        player: state.player.toJSON(),
        phase: state.phase
      };
      localStorage.setItem('gemstone_save', JSON.stringify(saveData));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [state.player, state.phase]);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
```

---

## Phase 3: Core Loop Implementation

### Task 4: Main Menu & Navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Step 1: Create App.jsx**

```jsx
import { GameProvider, useGame } from './context/GameContext';
import { GAME_PHASES } from './constants';
import Menu from './components/Menu';
import Discover from './components/Discover';
import Process from './components/Process';
import Craft from './components/Craft';
import Sell from './components/Sell';
import Minigame from './components/Minigame';

function GameContent() {
  const { state } = useGame();
  
  switch (state.phase) {
    case GAME_PHASES.MENU:
      return <Menu />;
    case GAME_PHASES.DISCOVER:
      return <Discover />;
    case GAME_PHASES.PROCESS:
      return <Process />;
    case GAME_PHASES.CRAFT:
      return <Craft />;
    case GAME_PHASES.SELL:
      return <Sell />;
    case GAME_PHASES.MINIGAME:
      return <Minigame />;
    default:
      return <Menu />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <div className="app">
        <GameContent />
      </div>
    </GameProvider>
  );
}
```

**Step 2: Create App.css**

```css
:root {
  --bg-dark: #1a1a2e;
  --bg-card: #16213e;
  --accent-primary: #e94560;
  --accent-secondary: #0f3460;
  --text-primary: #eee;
  --text-secondary: #aaa;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg-dark);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 20px;
}

h1 {
  color: var(--accent-primary);
  text-align: center;
  margin-bottom: 10px;
}

h2 {
  color: var(--text-primary);
  margin-bottom: 15px;
}

button {
  background: var(--accent-secondary);
  color: var(--text-primary);
  border: 2px solid var(--accent-primary);
  padding: 15px 30px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-bottom: 10px;
}

button:hover {
  background: var(--accent-primary);
  transform: scale(1.02);
}

button:active {
  transform: scale(0.98);
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.phase-container {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.resources {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
}

.section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
```

---

### Task 5: Menu Component

**Files:**
- Create: `src/components/Menu.jsx`

**Step 1: Create Menu component**

```jsx
import { useGame } from '../context/GameContext';
import { GAME_PHASES } from '../constants';

export default function Menu() {
  const { dispatch } = useGame();
  
  const setPhase = (phase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  };
  
  return (
    <div className="menu">
      <h1>Gemstone</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        Build your gem empire
      </p>
      
      <div className="menu-buttons">
        <button onClick={() => setPhase(GAME_PHASES.DISCOVER)}>
          Discover
        </button>
        <button onClick={() => setPhase(GAME_PHASES.PROCESS)}>
          Process
        </button>
        <button onClick={() => setPhase(GAME_PHASES.CRAFT)}>
          Craft
        </button>
        <button onClick={() => setPhase(GAME_PHASES.SELL)}>
          Sell
        </button>
      </div>
    </div>
  );
}
```

---

### Task 6: Discover Phase

**Files:**
- Create: `src/components/Discover.jsx`

**Step 1: Create Discover component**

```jsx
import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Gem } from '../models/Gem';
import gemsData from '../data/gems.json';
import { GAME_PHASES } from '../constants';

export default function Discover() {
  const { state, dispatch } = useGame();
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const generateRandomGem = () => {
    const commonGems = gemsData.gems.filter(g => g.mohs <= 7);
    const random = commonGems[Math.floor(Math.random() * commonGems.length)];
    return new Gem({ ...random, quality: 0.7 + Math.random() * 0.3 });
  };
  
  const startMining = () => {
    if (mining) return;
    setMining(true);
    setProgress(0);
    
    const duration = 5000;
    const interval = setInterval(() => {
      setProgress(p => {
        const newProgress = p + 100;
        if (newProgress >= duration) {
          clearInterval(interval);
          const gem = generateRandomGem();
          if (state.inventory.add(gem)) {
            state.player.addGem(gem);
            dispatch({ type: 'SET_MINIGAME', payload: null });
          }
          setMining(false);
          return 0;
        }
        return newProgress;
      });
    }, 100);
  };
  
  const startPanning = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MINIGAME });
    dispatch({ type: 'SET_MINIGAME', payload: 'panning' });
  };
  
  const backToMenu = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MENU });
  };
  
  return (
    <div className="phase-container">
      <button onClick={backToMenu} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '14px' }}>
        ← Back
      </button>
      
      <h2>Prospector</h2>
      
      <div className="resources">
        <span>Coins: {state.player.coins}</span>
        <span>Inventory: {state.inventory.count}/50</span>
      </div>
      
      <div className="section">
        <h3>Mining (Idle)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Automatically find gems over time
        </p>
        <button onClick={startMining} disabled={mining}>
          {mining ? `Mining... ${Math.floor((progress / 5000) * 100)}%` : 'Start Mining'}
        </button>
      </div>
      
      <div className="section">
        <h3>Panning (Active)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Swipe to catch gems, avoid debris!
        </p>
        <button onClick={startPanning}>
          Start Panning Mini-game
        </button>
      </div>
    </div>
  );
}
```

---

### Task 7: Panning Mini-Game

**Files:**
- Create: `src/components/Minigame.jsx`

**Step 1: Create Minigame component**

```jsx
import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Gem } from '../models/Gem';
import gemsData from '../data/gems.json';
import { GAME_PHASES } from '../constants';

export default function Minigame() {
  const { state, dispatch } = useGame();
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready, playing, finished
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const itemsRef = useRef([]);
  const scoreRef = useRef(0);
  const gameActiveRef = useRef(false);
  
  const generateRandomGem = () => {
    const commonGems = gemsData.gems.filter(g => g.mohs <= 7);
    const random = commonGems[Math.floor(Math.random() * commonGems.length)];
    return new Gem({ ...random, quality: 0.9 + Math.random() * 0.1 });
  };
  
  const getRandomGemColor = () => {
    const colors = ['#9b59b6', '#f39c12', '#27ae60', '#e74c3c', '#3498db', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(15);
    itemsRef.current = [];
    setGameState('playing');
    gameActiveRef.current = true;
  };
  
  const endGame = () => {
    gameActiveRef.current = false;
    setGameState('finished');
    
    // Calculate rewards
    const gemsFound = Math.floor(scoreRef.current / 10);
    const bonus = scoreRef.current > 100 ? 1.5 : 1;
    
    // Add gems to inventory
    for (let i = 0; i < gemsFound; i++) {
      const gem = generateRandomGem();
      if (state.inventory.add(gem)) {
        state.player.addGem(gem);
      }
    }
    
    // Award bonus coins
    const coinsEarned = Math.floor(gemsFound * 5 * bonus);
    state.player.coins += coinsEarned;
  };
  
  const backToDiscover = () => {
    dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.DISCOVER });
    dispatch({ type: 'SET_MINIGAME', payload: null });
  };
  
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Spawn items
    const spawnInterval = setInterval(() => {
      if (!gameActiveRef.current) return;
      
      const isGem = Math.random() > 0.3;
      itemsRef.current.push({
        x: Math.random() * canvas.width,
        y: -20,
        type: isGem ? 'gem' : 'debris',
        color: isGem ? getRandomGemColor() : '#666666',
        speed: 2 + Math.random() * 2,
        radius: isGem ? 15 : 10
      });
    }, 500);
    
    // Game loop
    let animationId;
    let timerId;
    
    const gameLoop = () => {
      if (!gameActiveRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw items
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        item.y += item.speed;
        
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        
        // Glow effect for gems
        if (item.type === 'gem') {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = item.color + '40';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Remove if off screen
        if (item.y > canvas.height + 20) {
          itemsRef.current.splice(i, 1);
        }
      }
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    // Timer
    timerId = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    gameLoop();
    
    return () => {
      clearInterval(spawnInterval);
      clearInterval(timerId);
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);
  
  // Handle input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    
    const handleStart = (e) => {
      isDragging = true;
      const pos = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      lastPos = { x: pos.clientX - rect.left, y: pos.clientY - rect.top };
    };
    
    const handleMove = (e) => {
      if (!isDragging || !gameActiveRef.current) return;
      e.preventDefault();
      
      const pos = e.touches ? e.touches[0] : e;
      const rect = canvas.getBoundingClientRect();
      const currentPos = { x: pos.clientX - rect.left, y: pos.clientY - rect.top };
      
      // Check collisions
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        const dist = Math.sqrt(
          Math.pow(item.x - currentPos.x, 2) + 
          Math.pow(item.y - currentPos.y, 2)
        );
        
        if (dist < item.radius + 20) {
          if (item.type === 'gem') {
            scoreRef.current += 10;
            setScore(s => s + 10);
          } else {
            scoreRef.current = Math.max(0, scoreRef.current - 5);
            setScore(s => Math.max(0, s - 5));
          }
          itemsRef.current.splice(i, 1);
        }
      }
      
      lastPos = currentPos;
    };
    
    const handleEnd = () => {
      isDragging = false;
    };
    
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);
    
    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, []);
  
  const gemsEarned = gameState === 'finished' ? Math.floor(score / 10) : 0;
  const bonus = score > 100 ? 1.5 : 1;
  const coinsEarned = Math.floor(gemsEarned * 5 * bonus);
  
  return (
    <div className="phase-container" style={{ textAlign: 'center' }}>
      <button onClick={backToDiscover} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '14px' }}>
        ← Back
      </button>
      
      <h2>Panning</h2>
      
      {gameState === 'ready' && (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Swipe to catch gems, avoid debris!
          </p>
          <button onClick={startGame} style={{ width: '200px' }}>
            Start Game
          </button>
        </>
      )}
      
      {gameState === 'playing' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
          </div>
          <canvas 
            ref={canvasRef} 
            width="350" 
            height="300"
            style={{ 
              background: '#0a0a15', 
              borderRadius: '8px',
              touchAction: 'none',
              cursor: 'crosshair'
            }}
          />
        </>
      )}
      
      {gameState === 'finished' && (
        <>
          <h3>Game Over!</h3>
          <p>Score: {score}</p>
          <p>Gems found: {gemsEarned}</p>
          <p style={{ color: '#27ae60' }}>Coins earned: {coinsEarned}</p>
          <button onClick={startGame} style={{ marginTop: '20px', width: '200px' }}>
            Play Again
          </button>
          <button onClick={backToDiscover} style={{ width: '200px' }}>
            Back to Discover
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Phase 4: Additional Phases (Placeholders)

### Task 8: Process/Craft/Sell Phases

**Files:**
- Create: `src/components/Process.jsx`
- Create: `src/components/Craft.jsx`
- Create: `src/components/Sell.jsx`

**Step 1: Create Process component**

```jsx
import { useGame } from '../context/GameContext';

export default function Process() {
  const { state, dispatch } = useGame();
  
  return (
    <div className="phase-container">
      <button onClick={() => dispatch({ type: 'SET_PHASE', payload: 'menu' })} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '14px' }}>
        ← Back
      </button>
      <h2>Process</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Transform rough gems into polished stones
      </p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p>Coming soon...</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '10px' }}>
          Tumbling, cabochon cutting, and faceting mini-games
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Create Craft component**

```jsx
import { useGame } from '../context/GameContext';

export default function Craft() {
  const { state, dispatch } = useGame();
  
  return (
    <div className="phase-container">
      <button onClick={() => dispatch({ type: 'SET_PHASE', payload: 'menu' })} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '14px' }}>
        ← Back
      </button>
      <h2>Craft</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Create jewelry from processed gems
      </p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p>Coming soon...</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '10px' }}>
          Settings, soldering, and design composition
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Create Sell component**

```jsx
import { useGame } from '../context/GameContext';

export default function Sell() {
  const { state, dispatch } = useGame();
  
  return (
    <div className="phase-container">
      <button onClick={() => dispatch({ type: 'SET_PHASE', payload: 'menu' })} style={{ marginBottom: '20px', padding: '8px 16px', fontSize: '14px' }}>
        ← Back
      </button>
      <h2>Sell</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Sell your gems and jewelry
      </p>
      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p>Coming soon...</p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '10px' }}>
          Client orders, auctions, and negotiation
        </p>
      </div>
    </div>
  );
}
```

---

## Summary

| Task | Description | Files Created |
|------|-------------|--------------|
| 1 | React Project Setup | package.json, vite.config.js, index.html, main.jsx, constants.js, gems.json |
| 2 | Core Data Models | Gem.js, Player.js, Inventory.js |
| 3 | Game Context | GameContext.jsx |
| 4 | App & Navigation | App.jsx, App.css |
| 5 | Menu | Menu.jsx |
| 6 | Discover Phase | Discover.jsx |
| 7 | Panning Mini-game | Minigame.jsx |
| 8 | Process/Craft/Sell | Process.jsx, Craft.jsx, Sell.jsx |

**What's Built:**
- Full React app with game state management
- Menu with 4 phase buttons
- Discover phase with idle mining + progress bar
- Panning mini-game (15s, swipe to catch gems)
- Inventory system with 50-slot cap
- Auto-save to localStorage
- Placeholder phases for Process/Craft/Sell

**Next Features (Not in Plan):**
- Process phase with tumbling/faceting mini-games
- Craft phase with settings/metalwork
- Sell phase with client orders/negotiation
- Museum/prestige system
- Gemdex UI
- Path progression system
