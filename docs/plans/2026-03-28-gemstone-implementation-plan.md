# Gemstone: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable prototype with core loop (Acquire→Process→Craft→Sell), one mini-game prototype, idle system, and gem data model.

**Architecture:** Modular game architecture with separated systems:
- Core Loop Controller (game state machine)
- Mini-Game Engine (pluggable mini-games)
- Idle System (background processing)
- Data Layer (gems, player state, progression)

**Tech Stack:** Framework-agnostic (vanilla JS + HTML5 Canvas recommended for prototype, framework decision deferred)

---

## Phase 1: Project Foundation

### Task 1: Project Setup

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/main.js`
- Create: `js/game-state.js`
- Create: `js/constants.js`
- Create: `data/gems.json`

**Step 1: Create basic HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemstone</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="game-container">
        <div id="header"></div>
        <div id="main-view"></div>
        <div id="minigame-view"></div>
    </div>
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 2: Create basic CSS framework**

```css
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: system-ui, sans-serif;
    background: #1a1a2e;
    color: #eee;
    min-height: 100vh;
}

#game-container {
    max-width: 500px;
    margin: 0 auto;
    min-height: 100vh;
}
```

**Step 3: Create constants file with game configuration**

```js
export const MOHASE_SCALE = {
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
    TICK_INTERVAL: 1000, // 1 second
    SAVE_INTERVAL: 30000 // 30 seconds
};
```

**Step 4: Verify project loads**

Run: Open `index.html` in browser
Expected: Page loads with dark background, no console errors

---

### Task 2: Core Data Model

**Files:**
- Create: `js/models/gem.js`
- Create: `js/models/player.js`
- Create: `js/models/inventory.js`
- Create: `data/gems.json`

**Step 1: Create gem model**

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
        this.quality = 1.0; // 0.0 to 1.0
    }
    
    getDisplayValue() {
        const base = this.processed ? this.processedValue : this.rawValue;
        return Math.floor(base * this.quality);
    }
}
```

**Step 2: Create gems data file**

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

**Step 3: Create player model**

```js
export class Player {
    constructor() {
        this.coins = 100;
        this.gems = []; // Array of Gem objects
        this.processedGems = [];
        this.completedPieces = [];
        this.gemdex = {}; // { gemId: { discovered: true, timesSeen: 0 } }
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

**Step 4: Create inventory system**

```js
export class Inventory {
    constructor(capacity = 50) {
        this.capacity = capacity;
        this.items = [];
    }
    
    add(item) {
        if (this.items.length >= this.capacity) {
            return false; // Inventory full
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

## Phase 2: Core Loop Implementation

### Task 3: Game State Machine

**Files:**
- Modify: `js/game-state.js`

**Step 1: Define game phases**

```js
export const GAME_PHASES = {
    MENU: 'menu',
    DISCOVER: 'discover',
    PROCESS: 'process',
    CRAFT: 'craft',
    SELL: 'sell',
    MINIGAME: 'minigame'
};
```

**Step 2: Create game controller**

```js
export class GameController {
    constructor() {
        this.phase = GAME_PHASES.MENU;
        this.player = new Player();
        this.inventory = new Inventory();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('btn-discover')?.addEventListener('click', () => this.setPhase(GAME_PHASES.DISCOVER));
        document.getElementById('btn-process')?.addEventListener('click', () => this.setPhase(GAME_PHASES.PROCESS));
        document.getElementById('btn-craft')?.addEventListener('click', () => this.setPhase(GAME_PHASES.CRAFT));
        document.getElementById('btn-sell')?.addEventListener('click', () => this.setPhase(GAME_PHASES.SELL));
    }
    
    setPhase(newPhase) {
        this.phase = newPhase;
        this.render();
    }
    
    render() {
        const mainView = document.getElementById('main-view');
        mainView.innerHTML = this.getPhaseTemplate();
        this.attachPhaseListeners();
    }
    
    getPhaseTemplate() {
        switch(this.phase) {
            case GAME_PHASES.MENU:
                return `
                    <h1>Gemstone</h1>
                    <p>Build your gem empire</p>
                    <div class="menu-buttons">
                        <button id="btn-discover">Discover</button>
                        <button id="btn-process">Process</button>
                        <button id="btn-craft">Craft</button>
                        <button id="btn-sell">Sell</button>
                    </div>
                `;
            default:
                return `<h2>${this.phase}</h2><button onclick="game.setPhase('menu')">Back</button>`;
        }
    }
    
    attachPhaseListeners() {
        this.setupEventListeners();
    }
}
```

---

### Task 4: Discover Phase (Idle + Active)

**Files:**
- Create: `js/phases/discover.js`
- Create: `js/minigames/panning.js`

**Step 1: Create discover phase module**

```js
import { Gem } from '../models/gem.js';
import { GEMS_DATA } from '../../data/gems.json';

export class DiscoverPhase {
    constructor(gameController) {
        this.controller = gameController;
        this.miningActive = false;
        this.miningProgress = 0;
        this.miningDuration = 5000; // 5 seconds base
    }
    
    render(container) {
        container.innerHTML = `
            <div class="discover-phase">
                <h2>Prospector</h2>
                <div class="resources">
                    <span>Coins: ${this.controller.player.coins}</span>
                    <span>Inventory: ${this.controller.inventory.count}/50</span>
                </div>
                
                <div class="idle-section">
                    <h3>Mining (Idle)</h3>
                    <button id="btn-start-mining">Start Mining</button>
                    <div id="mining-progress"></div>
                </div>
                
                <div class="active-section">
                    <h3>Panning (Active)</h3>
                    <button id="btn-start-panning">Start Panning Mini-game</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-start-mining').addEventListener('click', () => this.startMining());
        document.getElementById('btn-start-panning').addEventListener('click', () => this.startPanning());
    }
    
    startMining() {
        if (this.miningActive) return;
        this.miningActive = true;
        this.miningProgress = 0;
        
        const updateInterval = setInterval(() => {
            this.miningProgress += 100;
            const percent = Math.floor((this.miningProgress / this.miningDuration) * 100);
            document.getElementById('mining-progress').textContent = `Mining... ${percent}%`;
            
            if (this.miningProgress >= this.miningDuration) {
                clearInterval(updateInterval);
                this.completeMining();
            }
        }, 100);
    }
    
    completeMining() {
        this.miningActive = false;
        const foundGem = this.generateRandomGem();
        if (this.controller.inventory.add(foundGem)) {
            this.controller.player.addGem(foundGem);
            document.getElementById('mining-progress').textContent = 
                `Found: ${foundGem.name}!`;
        } else {
            document.getElementById('mining-progress').textContent = 
                `Inventory full!`;
        }
    }
    
    generateRandomGem() {
        const commonGems = GEMS_DATA.gems.filter(g => g.mohs <= 7);
        const random = commonGems[Math.floor(Math.random() * commonGems.length)];
        return new Gem(random);
    }
    
    startPanning() {
        // Transition to panning mini-game
        this.controller.setPhase('minigame');
        this.controller.activeMinigame = 'panning';
    }
}
```

**Step 2: Create panning mini-game**

```js
export class PanningMiniGame {
    constructor(gameController) {
        this.controller = gameController;
        this.canvas = document.getElementById('minigame-canvas');
        this.ctx = this.canvas?.getContext('2d');
        this.score = 0;
        this.items = [];
        this.gameActive = false;
        this.duration = 15000; // 15 seconds
        this.startTime = 0;
    }
    
    setup() {
        const container = document.getElementById('minigame-view');
        container.innerHTML = `
            <div class="minigame-container">
                <h2>Panning</h2>
                <p>Swipe to catch gems, avoid debris!</p>
                <canvas id="minigame-canvas" width="400" height="300"></canvas>
                <div id="score-display">Score: 0</div>
                <div id="timer-display">Time: 15s</div>
                <button id="btn-start-game">Start</button>
            </div>
        `;
        
        this.canvas = document.getElementById('minigame-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        document.getElementById('btn-start-game').addEventListener('click', () => this.start());
        
        // Touch/mouse events
        this.setupInputHandlers();
    }
    
    setupInputHandlers() {
        let isDragging = false;
        let lastPos = { x: 0, y: 0 };
        
        const handleStart = (e) => {
            isDragging = true;
            const pos = e.touches ? e.touches[0] : e;
            lastPos = { x: pos.clientX, y: pos.clientY };
        };
        
        const handleMove = (e) => {
            if (!isDragging || !this.gameActive) return;
            e.preventDefault();
            
            const pos = e.touches ? e.touches[0] : e;
            const dx = pos.clientX - lastPos.x;
            const dy = pos.clientY - lastPos.y;
            
            // Check collisions with items
            this.checkSwipeCollisions(lastPos.x, lastPos.y, pos.clientX, pos.clientY);
            
            lastPos = { x: pos.clientX, y: pos.clientY };
        };
        
        const handleEnd = () => {
            isDragging = false;
        };
        
        this.canvas.addEventListener('mousedown', handleStart);
        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('touchstart', handleStart);
        this.canvas.addEventListener('touchmove', handleMove);
        this.canvas.addEventListener('touchend', handleEnd);
    }
    
    start() {
        this.gameActive = true;
        this.score = 0;
        this.items = [];
        this.startTime = Date.now();
        
        // Spawn items
        this.spawnInterval = setInterval(() => this.spawnItem(), 500);
        
        // Game loop
        this.gameLoop();
    }
    
    spawnItem() {
        const isGem = Math.random() > 0.3; // 70% gems, 30% debris
        this.items.push({
            x: Math.random() * this.canvas.width,
            y: -20,
            type: isGem ? 'gem' : 'debris',
            color: isGem ? this.getRandomGemColor() : '#666',
            speed: 2 + Math.random() * 2,
            radius: isGem ? 15 : 10
        });
    }
    
    getRandomGemColor() {
        const colors = ['#9b59b6', '#f39c12', '#27ae60', '#e74c3c', '#3498db'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    checkSwipeCollisions(x1, y1, x2, y2) {
        const rect = this.canvas.getBoundingClientRect();
        const swipeStart = { x: x1 - rect.left, y: y1 - rect.top };
        const swipeEnd = { x: x2 - rect.left, y: y2 - rect.top };
        
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dist = this.pointToLineDistance(item, swipeStart, swipeEnd);
            
            if (dist < item.radius + 20) {
                if (item.type === 'gem') {
                    this.score += 10;
                } else {
                    this.score = Math.max(0, this.score - 5);
                }
                this.items.splice(i, 1);
                this.updateScore();
            }
        }
    }
    
    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateScore() {
        document.getElementById('score-display').textContent = `Score: ${this.score}`;
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, Math.ceil((this.duration - elapsed) / 1000));
        document.getElementById('timer-display').textContent = `Time: ${remaining}s`;
        
        if (elapsed >= this.duration) {
            this.end();
            return;
        }
        
        // Update items
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;
            
            // Draw
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = item.color;
            this.ctx.fill();
            
            // Remove if off screen
            if (item.y > this.canvas.height + 20) {
                this.items.splice(i, 1);
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    end() {
        this.gameActive = false;
        clearInterval(this.spawnInterval);
        
        // Calculate rewards
        const gemsFound = Math.floor(this.score / 10);
        const bonus = this.score > 100 ? 1.5 : 1;
        
        alert(`Panning complete!\nScore: ${this.score}\nGems found: ${gemsFound}\n\nReturning to Discover phase...`);
        this.controller.setPhase('discover');
    }
}
```

---

## Phase 3: Idle System

### Task 5: Background Processing

**Files:**
- Create: `js/systems/idle-system.js`

**Step 1: Create idle system**

```js
export class IdleSystem {
    constructor(gameController) {
        this.controller = gameController;
        this.tickInterval = null;
        this.lastTick = Date.now();
        this.miningQueue = [];
    }
    
    start() {
        this.tickInterval = setInterval(() => this.tick(), 1000);
        window.addEventListener('focus', () => this.handleReturn());
        window.addEventListener('blur', () => this.handleAway());
    }
    
    tick() {
        const now = Date.now();
        const delta = now - this.lastTick;
        this.lastTick = now;
        
        // Process mining queue
        for (const mining of this.miningQueue) {
            mining.progress += delta;
            if (mining.progress >= mining.duration) {
                this.completeMining(mining);
            }
        }
        
        // Clean completed
        this.miningQueue = this.miningQueue.filter(m => m.progress < m.duration);
        
        // Calculate offline gains
        this.applyOfflineGains();
    }
    
    addToQueue(duration) {
        this.miningQueue.push({
            startTime: Date.now(),
            duration: duration,
            progress: 0
        });
    }
    
    completeMining(mining) {
        // Award random gem from available pool
        const gems = this.controller.getAvailableGems();
        if (gems.length > 0) {
            const randomGem = gems[Math.floor(Math.random() * gems.length)];
            const gem = new Gem(randomGem);
            gem.quality = 0.7 + Math.random() * 0.3; // 70-100% quality
            this.controller.player.addGem(gem);
            this.controller.inventory.add(gem);
        }
    }
    
    handleReturn() {
        const awayTime = Date.now() - this.lastTick;
        if (awayTime > 60000) { // More than 1 minute away
            this.calculateOfflineEarnings(awayTime);
        }
    }
    
    handleAway() {
        this.lastTick = Date.now();
    }
    
    calculateOfflineEarnings(awayTimeMs) {
        const maxOffline = 8 * 60 * 60 * 1000; // 8 hours max
        const effectiveTime = Math.min(awayTimeMs, maxOffline);
        
        // Calculate base earnings per hour
        const baseGemsPerHour = 5 * this.controller.player.pathProgress.prospector;
        const bonusMultiplier = this.controller.player.calibrationBonus;
        
        const gemsEarned = Math.floor(
            (effectiveTime / (60 * 60 * 1000)) * baseGemsPerHour * bonusMultiplier
        );
        
        if (gemsEarned > 0) {
            // Show "welcome back" message
            this.showOfflineEarnings(gemsEarned);
        }
    }
    
    showOfflineEarnings(gemsEarned) {
        // This would trigger a UI popup showing earnings
        console.log(`Welcome back! You earned ${gemsEarned} gems while away.`);
    }
    
    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
    }
}
```

---

## Phase 4: Save/Load System

### Task 6: Persistence

**Files:**
- Create: `js/systems/save-system.js`

**Step 1: Create save system**

```js
export class SaveSystem {
    constructor(gameController) {
        this.controller = gameController;
        this.saveKey = 'gemstone_save';
        this.autoSaveInterval = null;
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => this.save(), 30000);
        window.addEventListener('beforeunload', () => this.save());
    }
    
    save() {
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            player: this.controller.player.toJSON(),
            phase: this.controller.phase
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('Game saved');
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.saveKey);
            if (!data) return false;
            
            const saveData = JSON.parse(data);
            
            // Restore player state
            this.controller.player.coins = saveData.player.coins;
            this.controller.player.gemdex = saveData.player.gemdex;
            this.controller.player.pathProgress = saveData.player.pathProgress;
            this.controller.player.calibrationBonus = saveData.player.calibrationBonus;
            
            // Calculate offline earnings
            const offlineTime = Date.now() - saveData.timestamp;
            this.controller.idleSystem.calculateOfflineEarnings(offlineTime);
            
            return true;
        } catch (e) {
            console.error('Failed to load:', e);
            return false;
        }
    }
    
    reset() {
        localStorage.removeItem(this.saveKey);
        this.controller.player = new Player();
        this.controller.inventory = new Inventory();
    }
}
```

---

## Phase 5: UI Polish

### Task 7: Main Menu and Navigation

**Files:**
- Modify: `css/styles.css`
- Modify: `js/game-state.js`

**Step 1: Update CSS with proper styling**

```css
:root {
    --bg-dark: #1a1a2e;
    --bg-card: #16213e;
    --accent-primary: #e94560;
    --accent-secondary: #0f3460;
    --text-primary: #eee;
    --text-secondary: #aaa;
}

#game-container {
    max-width: 500px;
    margin: 0 auto;
    min-height: 100vh;
    background: var(--bg-dark);
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

.menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 30px;
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
}

button:hover {
    background: var(--accent-primary);
    transform: scale(1.02);
}

button:active {
    transform: scale(0.98);
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

.idle-section, .active-section {
    margin-top: 20px;
}

.minigame-container {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
}

#minigame-canvas {
    background: #000;
    border-radius: 8px;
    margin: 20px 0;
    touch-action: none;
}

#score-display, #timer-display {
    font-size: 20px;
    margin: 10px 0;
}
```

---

## Summary: What's Been Built

| Component | Status |
|-----------|--------|
| Project scaffolding | Complete |
| Gem data model | Complete |
| Player/inventory models | Complete |
| Discover phase (idle mining) | Complete |
| Panning mini-game | Complete |
| Idle processing system | Complete |
| Save/load system | Complete |
| Basic UI | Complete |

## Next Steps (Not in This Plan)

1. **Process Phase** - Tumbling, cabbing, faceting mini-games
2. **Craft Phase** - Setting and metalwork mini-games
3. **Sell Phase** - Client orders, negotiation mini-game
4. **Museum/Prestige System** - Display pieces for passive income
5. **Calibration Puzzle** - Towers of Hanoi integration
6. **Gemdex UI** - Encyclopedia view with discovered facts
7. **Path Progression System** - Skill trees per path

---

**Plan Complete**

Saved to: `docs/plans/2026-03-28-gemstone-implementation-plan.md`
