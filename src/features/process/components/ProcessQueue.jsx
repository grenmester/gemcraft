/**
 * ProcessQueue Component
 * Displays queue slots for idle processing with progress bars and actions
 */

import { useState, useEffect } from 'react';
import { useProcess } from '../hooks/useProcess';
import { getRemainingTime, isQueueProcessComplete } from '../../../shared/utils/queueProcessing';
import itemsData from '../../../data/items.json';

/**
 * Format milliseconds to human-readable time
 */
function formatTime(ms) {
  if (ms <= 0) return 'Ready!';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Get item display info from items data
 */
function getItemInfo(itemId) {
  const item = itemsData.items.find(i => i.id === itemId);
  if (!item) {
    return { name: itemId, icon: '❓', category: 'Unknown', rarity: 'Common' };
  }
  
  const icon = getItemIcon(item.category, item.rarity);
  return {
    name: item.name,
    icon,
    category: item.category,
    rarity: item.rarity
  };
}

/**
 * Get emoji icon based on item category and rarity
 */
function getItemIcon(category, rarity) {
  if (category === 'Mineral') {
    return '🪨';
  }
  
  // Gems get different icons based on rarity
  const rarityEmojis = {
    Common: '💎',
    Uncommon: '💎',
    Rare: '💠',
    Epic: '💜',
    Legendary: '⭐'
  };
  
  return rarityEmojis[rarity] || '💎';
}

/**
 * Get rarity color for styling
 */
function getRarityColor(rarity) {
  const colors = {
    Common: '#9CA3AF',
    Uncommon: '#22C55E',
    Rare: '#3B82F6',
    Epic: '#A855F7',
    Legendary: '#F59E0B'
  };
  return colors[rarity] || colors.Common;
}

export default function ProcessQueue() {
  const { 
    queue, 
    queueSlots, 
    activeProcess, 
    completedQueue,
    availableItems,
    addToQueue, 
    collectQueueItem, 
    cancelQueueItem 
  } = useProcess();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update current time every second for progress bars
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate total processing time for a queued item
  const getTotalTime = (item) => {
    if (!item.startTime || !item.estimatedCompletion) return 0;
    return item.estimatedCompletion - item.startTime;
  };
  
  // Calculate progress percentage for a queue item
  const getProgress = (item) => {
    const total = getTotalTime(item);
    if (total <= 0) return 100;
    const remaining = getRemainingTime(item, currentTime);
    return Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  };
  
  // Handle adding item to queue
  const handleAddToQueue = (processType = 'cutting') => {
    if (selectedItem) {
      addToQueue(selectedItem.gemId, processType);
      setSelectedItem(null);
      setShowAddModal(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-amber-400 mb-1">Process Queue</h3>
        <p className="text-sm text-slate-400">
          Queue items for processing while you play
        </p>
      </div>
      
      {/* Queue Slots */}
      <div className="space-y-3 mb-6">
        {Array.from({ length: queueSlots }).map((_, index) => {
          // Check if this slot has an active process
          const isActiveSlot = index === 0 && activeProcess;
          // Check if this slot has a queued item
          const queuedItem = queue[index];
          // Check if this slot has a completed item
          const completedItem = completedQueue[index];
          
          // Determine what's in this slot
          const slotContent = completedItem || (isActiveSlot ? activeProcess : queuedItem);
          const isComplete = completedItem || (activeProcess && index === 0 && isQueueProcessComplete(activeProcess, currentTime));
          const isProcessing = isActiveSlot && !isComplete;
          const isQueued = queuedItem && !isActiveSlot;
          
          const itemInfo = slotContent ? getItemInfo(slotContent.itemId) : null;
          const progress = slotContent && !isComplete ? getProgress(slotContent) : 100;
          const remainingTime = slotContent && !isComplete ? getRemainingTime(slotContent, currentTime) : 0;
          
          return (
            <div
              key={index}
              className={`
                rounded-xl p-4 border-2 transition-all
                ${isComplete 
                  ? 'bg-emerald-900/30 border-emerald-500/50' 
                  : isProcessing 
                    ? 'bg-amber-900/30 border-amber-500/50 animate-pulse'
                    : isQueued 
                      ? 'bg-slate-800/50 border-slate-600'
                      : 'bg-slate-900/50 border-slate-700 border-dashed'
                }
              `}
            >
              {slotContent ? (
                <>
                  {/* Item Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${getRarityColor(itemInfo.rarity)}20` }}
                    >
                      {itemInfo.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{itemInfo.name}</span>
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${getRarityColor(itemInfo.rarity)}30`,
                            color: getRarityColor(itemInfo.rarity)
                          }}
                        >
                          {itemInfo.rarity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {isComplete ? '✓ Complete' : isProcessing ? 'Processing...' : isQueued ? 'Queued' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">
                        {formatTime(remainingTime)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isProcessing ? 'remaining' : isQueued ? 'until start' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`
                        h-full transition-all duration-1000 rounded-full
                        ${isComplete 
                          ? 'bg-emerald-500' 
                          : isProcessing 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-cyan-500'
                        }
                      `}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {isComplete && (
                      <button
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                        onClick={() => collectQueueItem(index)}
                      >
                        Collect ✓
                      </button>
                    )}
                    {isQueued && (
                      <button
                        className="flex-1 py-2 px-4 bg-red-600/80 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                        onClick={() => cancelQueueItem(index)}
                      >
                        Cancel
                      </button>
                    )}
                    {isProcessing && (
                      <div className="flex-1 py-2 text-center text-amber-400 font-semibold">
                        In Progress...
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2 opacity-30">⬜</div>
                  <div className="text-sm text-slate-500">Empty Slot</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Add to Queue Button */}
      {queue.length < queueSlots && availableItems.length > 0 && (
        <button
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          onClick={() => setShowAddModal(true)}
        >
          <span>＋</span>
          <span>Add to Queue</span>
        </button>
      )}
      
      {queue.length >= queueSlots && (
        <div className="text-center py-3 text-slate-500 text-sm">
          Queue is full
        </div>
      )}
      
      {availableItems.length === 0 && (
        <div className="text-center py-3 text-slate-500 text-sm">
          No items in inventory
        </div>
      )}
      
      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-600">
            <h3 className="text-lg font-bold text-amber-400 mb-4">Add to Queue</h3>
            
            {/* Item Selection */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Select Item</label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {availableItems.map(item => {
                  const info = getItemInfo(item.gemId);
                  const isSelected = selectedItem?.gemId === item.gemId;
                  
                  return (
                    <button
                      key={item.gemId}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-amber-400 bg-amber-400/20' 
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                        }
                      `}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{info.name}</div>
                          <div className="text-xs text-slate-400">×{item.quantity}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Process Type Selection */}
            {selectedItem && (
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Process Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cleaning', name: 'Cleaning', time: '5-15m', icon: '🧹' },
                    { id: 'cutting', name: 'Cutting', time: '15-45m', icon: '✂️' },
                    { id: 'faceting', name: 'Faceting', time: '30-90m', icon: '💎' }
                  ].map(type => (
                    <button
                      key={type.id}
                      className="p-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:border-cyan-400 transition-colors text-center"
                      onClick={() => handleAddToQueue(type.id)}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="font-semibold text-sm">{type.name}</div>
                      <div className="text-xs text-slate-400">{type.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cancel Button */}
            <button
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              onClick={() => {
                setShowAddModal(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
