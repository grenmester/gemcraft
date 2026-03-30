// src/features/process/components/TumbleSortGame.jsx

import { useState, useEffect, useRef, useCallback } from 'react';

const GAME_DURATION = 75; // seconds
const GEM_COUNT = 12;
const CLEAN_ZONE_WIDTH = 120; // pixels

const GEM_TYPES = [
  { type: 'quartz', color: '#E0E0E0', highlight: '#FFFFFF' },
  { type: 'amethyst', color: '#9C27B0', highlight: '#CE93D8' },
  { type: 'citrine', color: '#FF9800', highlight: '#FFE082' },
  { type: 'emerald', color: '#4CAF50', highlight: '#81C784' },
  { type: 'sapphire', color: '#2196F3', highlight: '#64B5F6' },
  { type: 'ruby', color: '#F44336', highlight: '#EF9A9A' },
  { type: 'topaz', color: '#FFC107', highlight: '#FFD54F' },
  { type: 'diamond', color: '#B2EBF2', highlight: '#E0F7FA' },
];

const WASTE_TYPES = [
  { type: 'matrix', color: '#5D4037', pattern: 'dirt' },
  { type: 'clay', color: '#8D6E63', pattern: 'clay' },
  { type: 'sand', color: '#D7CCC8', pattern: 'sand' },
];

/**
 * TumbleSortGame - The actual minigame component
 * A cleaning/tumbling simulation where players select gems from the tumbler
 */
export default function TumbleSortGame({ item, onComplete }) {
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [quality, setQuality] = useState(0);
  const [stats, setStats] = useState({
    gemsCollected: 0,
    correctClicks: 0,
    wrongClicks: 0,
    missedGems: 0,
  });
  const [tumblingItems, setTumblingItems] = useState([]);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const itemsRef = useRef([]);
  const startTimeRef = useRef(Date.now());
  const cleanZoneRef = useRef({ x: 0, y: 0, width: CLEAN_ZONE_WIDTH, height: 100 });
  const rotationRef = useRef(0);
  
  const totalGems = GEM_COUNT;

  // Initialize tumbling items
  const initializeItems = useCallback(() => {
    const items = [];
    const usedPositions = [];
    
    // Add gems (70% of items)
    const gemCount = Math.floor(totalGems * 0.7);
    for (let i = 0; i < gemCount; i++) {
      const gemType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      let x, y;
      let attempts = 0;
      do {
        x = 80 + Math.random() * 340;
        y = 100 + Math.random() * 200;
        attempts++;
      } while (attempts < 20 && usedPositions.some(p => Math.hypot(p.x - x, p.y - y) < 50));
      
      usedPositions.push({ x, y });
      
      items.push({
        id: `gem-${i}`,
        x,
        y,
        size: 25 + Math.random() * 15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        type: 'gem',
        gemType,
        collected: false,
        inCleanZone: false,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
    
    // Add waste/matrix (30% of items)
    const wasteCount = totalGems - gemCount;
    for (let i = 0; i < wasteCount; i++) {
      const wasteType = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
      let x, y;
      let attempts = 0;
      do {
        x = 80 + Math.random() * 340;
        y = 100 + Math.random() * 200;
        attempts++;
      } while (attempts < 20 && usedPositions.some(p => Math.hypot(p.x - x, p.y - y) < 50));
      
      usedPositions.push({ x, y });
      
      items.push({
        id: `waste-${i}`,
        x,
        y,
        size: 20 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        velocityX: (Math.random() - 0.5) * 1.5,
        velocityY: (Math.random() - 0.5) * 1.5,
        type: 'waste',
        wasteType,
        collected: false,
        inCleanZone: false,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }
    
    return items;
  }, [totalGems]);

  // Physics update for tumbling items
  const updatePhysics = useCallback((items, deltaTime, rotation) => {
    const bounds = { left: 60, right: 460, top: 80, bottom: 320 };
    const centerX = 260;
    const centerY = 200;
    const tumblerRadius = 140;
    
    return items.map(item => {
      if (item.collected) return item;
      
      // Add tumbling effect based on barrel rotation
      const tumbleForce = Math.sin((rotation + item.bobOffset) * 0.05) * 0.5;
      
      let newX = item.x + item.velocityX + tumbleForce;
      let newY = item.y + item.velocityY;
      let newVelocityX = item.velocityX;
      let newVelocityY = item.velocityY;
      
      // Bounce off walls with damping
      if (newX < bounds.left + item.size / 2) {
        newX = bounds.left + item.size / 2;
        newVelocityX = Math.abs(newVelocityX) * 0.8;
      }
      if (newX > bounds.right - item.size / 2) {
        newX = bounds.right - item.size / 2;
        newVelocityX = -Math.abs(newVelocityX) * 0.8;
      }
      if (newY < bounds.top + item.size / 2) {
        newY = bounds.top + item.size / 2;
        newVelocityY = Math.abs(newVelocityY) * 0.8;
      }
      if (newY > bounds.bottom - item.size / 2) {
        newY = bounds.bottom - item.size / 2;
        newVelocityY = -Math.abs(newVelocityY) * 0.8;
      }
      
      // Add slight gravity towards center (circular motion)
      const dx = centerX - newX;
      const dy = centerY - newY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > tumblerRadius) {
        const angle = Math.atan2(dy, dx);
        newX = centerX - Math.cos(angle) * tumblerRadius;
        newY = centerY - Math.sin(angle) * tumblerRadius;
        // Reflect velocity
        const normalX = dx / dist;
        const normalY = dy / dist;
        const dot = newVelocityX * normalX + newVelocityY * normalY;
        newVelocityX -= 2 * dot * normalX * 0.5;
        newVelocityY -= 2 * dot * normalY * 0.5;
      }
      
      return {
        ...item,
        x: newX,
        y: newY,
        velocityX: newVelocityX * 0.99, // Slight friction
        velocityY: newVelocityY * 0.99,
        rotation: item.rotation + item.rotationSpeed,
      };
    });
  }, []);

  // Check if item is in clean zone
  const isInCleanZone = useCallback((item, cleanZone) => {
    const inZoneX = item.x > cleanZone.x && item.x < cleanZone.x + cleanZone.width;
    const inZoneY = item.y > cleanZone.y && item.y < cleanZone.y + cleanZone.height;
    return inZoneX && inZoneY;
  }, []);

  // Handle click on canvas
  const handleCanvasClick = useCallback((e) => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    let clickedItem = null;
    let clickIndex = -1;
    
    // Find clicked item (reverse order for top-most)
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      if (item.collected) continue;
      
      const dist = Math.hypot(item.x - clickX, item.y - clickY);
      if (dist < item.size / 2 + 10) {
        clickedItem = item;
        clickIndex = i;
        break;
      }
    }
    
    if (clickedItem) {
      const updatedItems = [...itemsRef.current];
      
      if (clickedItem.type === 'gem') {
        // Correct click on gem
        updatedItems[clickIndex] = { ...clickedItem, collected: true };
        itemsRef.current = updatedItems;
        setTumblingItems(updatedItems);
        setStats(prev => ({
          ...prev,
          gemsCollected: prev.gemsCollected + 1,
          correctClicks: prev.correctClicks + 1,
        }));
        setScore(prev => prev + 10);
      } else {
        // Wrong click on waste - penalty
        updatedItems[clickIndex] = { ...clickedItem, collected: true };
        itemsRef.current = updatedItems;
        setTumblingItems(updatedItems);
        setStats(prev => ({
          ...prev,
          wrongClicks: prev.wrongClicks + 1,
        }));
        setScore(prev => Math.max(0, prev - 5));
      }
      
      // Check if all gems collected
      const remainingGems = updatedItems.filter(i => i.type === 'gem' && !i.collected).length;
      if (remainingGems === 0) {
        endGame();
      }
    }
  }, [gameState]);

  // Calculate quality based on performance
  const calculateQuality = useCallback(() => {
    const { gemsCollected, correctClicks, wrongClicks, missedGems } = stats;
    const totalGemsAvailable = GEM_COUNT * 0.7;
    
    // Base quality from gems collected
    const collectionRate = gemsCollected / totalGemsAvailable;
    let quality = collectionRate * 70; // 70% from collection
    
    // Accuracy bonus (correct clicks / total clicks)
    const totalClicks = correctClicks + wrongClicks;
    if (totalClicks > 0) {
      const accuracy = correctClicks / totalClicks;
      quality += accuracy * 20; // 20% from accuracy
    }
    
    // Speed bonus (time remaining)
    const timeBonus = (timeLeft / GAME_DURATION) * 10; // 10% from speed
    quality += timeBonus;
    
    // Cap at 100%
    quality = Math.min(100, Math.max(0, Math.round(quality)));
    
    // Apply equipment bonus from item
    const equipmentBonus = item?.equipmentBonus || 0;
    quality = Math.min(100, quality + equipmentBonus);
    
    return quality;
  }, [stats, timeLeft, item]);

  // End the game
  const endGame = useCallback(() => {
    setGameState('finished');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    const finalQuality = calculateQuality();
    setQuality(finalQuality);
  }, [calculateQuality]);

  // Handle completion callback
  useEffect(() => {
    if (gameState === 'finished' && onComplete) {
      const finalQuality = calculateQuality();
      // Delay to show results
      const timer = setTimeout(() => {
        onComplete(finalQuality);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, onComplete, calculateQuality]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    itemsRef.current = initializeItems();
    setTumblingItems(itemsRef.current);
    startTimeRef.current = Date.now();
    
    let lastTime = performance.now();
    let animationId;
    
    const gameLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update timer
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(Math.ceil(remaining));
      
      if (remaining <= 0) {
        endGame();
        return;
      }
      
      // Update barrel rotation using ref to avoid stale closure
      rotationRef.current += 1.5;
      
      // Update physics using ref value
      const updatedItems = updatePhysics(itemsRef.current, deltaTime, rotationRef.current);
      itemsRef.current = updatedItems;
      setTumblingItems(updatedItems);
      
      // Update clean zone position (bobbing)
      cleanZoneRef.current = {
        x: 170 + Math.sin(performance.now() / 500) * 20,
        y: 140 + Math.cos(performance.now() / 700) * 20,
        width: CLEAN_ZONE_WIDTH,
        height: 100,
      };
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    gameLoopRef.current = animationId;
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState, initializeItems, updatePhysics, endGame]);

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw tumbler barrel background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 60, 440, 280, 40);
    ctx.fillStyle = '#2d2d3a';
    ctx.fill();
    ctx.strokeStyle = '#444455';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    
    // Draw barrel ribs (rotating effect)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 60, 440, 280, 40);
    ctx.clip();
    
    for (let i = 0; i < 8; i++) {
      const angle = (rotationRef.current + i * 45) * Math.PI / 180;
      const x1 = 260 + Math.cos(angle) * 20;
      const y1 = 200 + Math.sin(angle) * 20;
      const x2 = 260 + Math.cos(angle) * 200;
      const y2 = 200 + Math.sin(angle) * 130;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(60, 60, 80, 0.5)';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    ctx.restore();
    
    // Draw tumbling items
    tumblingItems.forEach(item => {
      if (item.collected) return;
      
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      
      if (item.type === 'gem') {
        // Draw gem
        const { color, highlight } = item.gemType;
        const gradient = ctx.createRadialGradient(-item.size / 4, -item.size / 4, 0, 0, 0, item.size / 2);
        gradient.addColorStop(0, highlight);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, shadeColor(color, -30));
        
        ctx.beginPath();
        // Diamond/gem shape
        ctx.moveTo(0, -item.size / 2);
        ctx.lineTo(item.size / 2, 0);
        ctx.lineTo(0, item.size / 2);
        ctx.lineTo(-item.size / 2, 0);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Sparkle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-item.size / 4, -item.size / 4, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw waste/matrix
        ctx.beginPath();
        ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = item.wasteType.color;
        ctx.fill();
        
        // Texture pattern
        ctx.fillStyle = shadeColor(item.wasteType.color, -20);
        ctx.beginPath();
        ctx.arc(-item.size / 6, -item.size / 6, item.size / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
    
    // Draw clean zone indicator
    const cz = cleanZoneRef.current;
    ctx.save();
    
    // Glow effect
    const glowGradient = ctx.createRadialGradient(
      cz.x + cz.width / 2, cz.y + cz.height / 2, 0,
      cz.x + cz.width / 2, cz.y + cz.height / 2, cz.width / 2
    );
    glowGradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
    glowGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(cz.x - 20, cz.y - 20, cz.width + 40, cz.height + 40);
    
    // Zone border
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(cz.x, cz.y, cz.width, cz.height);
    ctx.setLineDash([]);
    
    // Zone label
    ctx.fillStyle = '#22D3EE';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN ZONE', cz.x + cz.width / 2, cz.y - 8);
    
    ctx.restore();
    
  }, [tumblingItems]);

  const handlePlayAgain = () => {
    setGameState('playing');
    setScore(0);
    setQuality(0);
    setTimeLeft(GAME_DURATION);
    setStats({
      gemsCollected: 0,
      correctClicks: 0,
      wrongClicks: 0,
      missedGems: 0,
    });
  };

  const handleBack = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    if (onComplete) {
      onComplete(0);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 bg-black/50">
        <h2 className="text-amber-400 text-xl m-0">Tumble Sort</h2>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase">Score</span>
            <span className="text-2xl font-bold text-white">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase">Time</span>
            <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-4">
        <div 
          ref={containerRef}
          className="relative w-full h-full max-w-[520px] mx-auto bg-slate-900/50 rounded-2xl overflow-hidden"
          style={{ aspectRatio: '520 / 380' }}
        >
          <canvas
            ref={canvasRef}
            width={520}
            height={380}
            className="w-full h-full cursor-crosshair"
            onClick={handleCanvasClick}
          />
          
          {/* Quality Meter */}
          <div className="absolute top-4 right-4 w-6 h-32 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-600">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-emerald-400 transition-all duration-200"
              style={{ height: `${quality}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white -rotate-90 whitespace-nowrap">
                Q:{quality}%
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg px-3 py-2">
            <div className="text-xs text-slate-400 mb-1">Gems</div>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(totalGems * 0.7) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    i < stats.gemsCollected 
                      ? 'bg-emerald-400' 
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Results Overlay */}
          {gameState === 'finished' && (
            <div className="absolute inset-0 bg-black/85 flex items-center justify-center">
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-amber-400 rounded-2xl p-6 text-center max-w-[320px]">
                <h3 className="text-2xl text-amber-400 mb-2">Tumbling Complete!</h3>
                
                {/* Quality Score */}
                <div className="my-6">
                  <div className="text-sm text-slate-400 uppercase mb-1">Quality Score</div>
                  <div className={`text-5xl font-bold ${getQualityColor(quality)}`}>
                    {quality}%
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="text-center">
                    <div className="text-emerald-400 font-bold text-lg">{stats.correctClicks}</div>
                    <div className="text-slate-400">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-lg">{stats.wrongClicks}</div>
                    <div className="text-slate-400">Wrong</div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    className="btn btn-gold w-full"
                    onClick={handlePlayAgain}
                  >
                    Play Again
                  </button>
                  <button
                    className="btn btn-secondary w-full"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="px-5 py-3 bg-slate-900/50 text-center">
        <p className="text-sm text-slate-400">
          Click gems when they enter the <span className="text-cyan-400 font-semibold">clean zone</span>
        </p>
      </div>
    </div>
  );
}

// Helper functions
function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

function getQualityColor(quality) {
  if (quality >= 80) return 'text-emerald-400';
  if (quality >= 60) return 'text-green-400';
  if (quality >= 40) return 'text-yellow-400';
  if (quality >= 20) return 'text-orange-400';
  return 'text-red-400';
}
