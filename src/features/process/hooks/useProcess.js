/**
 * useProcess Hook
 * Provides state and actions for queue-based processing
 */

import { useCallback } from 'react';
import { useGame, QUEUE_ITEM, COLLECT_QUEUE_ITEM, CANCEL_QUEUE_ITEM, EQUIP_PROCESS_TOOL } from '../../../context/GameContext';
import { calculateProcessingTime, getSpeedBonus, getQualityBonus } from '../../../shared/utils/queueProcessing';

export function useProcess() {
  const { state, dispatch } = useGame();
  const { processState, player } = state;
  
  const { queue, queueSlots, activeProcess, completedQueue, equippedTools } = processState;
  
  const inventory = player?.inventory || { minerals: [], gems: [], equipment: [], processEquipment: [] };
  
  /**
   * Add an item to the processing queue
   * @param {string} itemId - The item to process
   * @param {string} processType - Type of process (cleaning, cutting, faceting)
   */
  const addToQueue = useCallback((itemId, processType = 'cutting') => {
    if (queue.length >= queueSlots) {
      console.warn('Queue is full');
      return false;
    }
    
    const equippedId = equippedTools[processType] || `basic_${processType.slice(0, -3)}`;
    const speedBonus = getSpeedBonus(processType, equippedId);
    const processingTime = calculateProcessingTime(itemId, processType, { processingSpeedBonus: speedBonus });
    const estimatedCompletion = Date.now() + processingTime;
    
    dispatch({
      type: QUEUE_ITEM,
      payload: {
        itemId,
        processType,
        startTime: Date.now(),
        estimatedCompletion,
        quality: 0 // Will be calculated on completion
      }
    });
    
    return true;
  }, [dispatch, queue.length, queueSlots, equippedTools]);
  
  /**
   * Collect a completed queue item
   * @param {number} index - Index of the completed item to collect
   */
  const collectQueueItem = useCallback((index) => {
    dispatch({
      type: COLLECT_QUEUE_ITEM,
      payload: { index }
    });
  }, [dispatch]);
  
  /**
   * Cancel a queued item (returns it to inventory)
   * @param {number} index - Index of the queued item to cancel
   */
  const cancelQueueItem = useCallback((index) => {
    dispatch({
      type: CANCEL_QUEUE_ITEM,
      payload: { index }
    });
  }, [dispatch]);
  
  /**
   * Equip a process tool
   * @param {string} processType - Type of process (cleaning, cutting, faceting)
   * @param {string} equipmentId - ID of the equipment to equip
   */
  const equipTool = useCallback((processType, equipmentId) => {
    dispatch({
      type: EQUIP_PROCESS_TOOL,
      payload: { processType, equipmentId }
    });
  }, [dispatch]);
  
  /**
   * Get available items that can be queued
   * Returns items that are currently in inventory, grouped by quality tier
   * Items with different qualities appear as separate entries
   */
  const availableItems = [
    ...(inventory.minerals || []).map((m, idx) => ({ 
      id: m.id, 
      gemId: m.id, 
      quantity: m.quantity, 
      quality: m.quality, 
      type: 'mineral',
      stackId: `${m.id}-${m.quality || 'unprocessed'}-${idx}` // Unique key for React
    })),
    ...(inventory.gems || []).map((g, idx) => ({ 
      id: g.gemId, 
      gemId: g.gemId, 
      quantity: g.quantity, 
      quality: g.quality, 
      type: 'gem',
      stackId: `${g.gemId}-${g.quality || 'unprocessed'}-${idx}` // Unique key for React
    }))
  ];
  
  /**
   * Get equipped tool info for a process type
   */
  const getEquippedTool = (processType) => {
    return equippedTools[processType] || `basic_${processType.slice(0, -3)}`;
  };
  
  return {
    queue,
    queueSlots,
    activeProcess,
    completedQueue,
    equippedTools,
    availableItems,
    addToQueue,
    collectQueueItem,
    cancelQueueItem,
    equipTool,
    getEquippedTool
  };
}
