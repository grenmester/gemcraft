/**
 * useProcess Hook
 * Provides state and actions for queue-based processing
 */

import { useCallback } from 'react';
import { useGame, QUEUE_ITEM, COLLECT_QUEUE_ITEM, CANCEL_QUEUE_ITEM } from '../../../context/GameContext';
import { calculateProcessingTime } from '../../../shared/utils/queueProcessing';

export function useProcess() {
  const { state, dispatch } = useGame();
  const { processState, player } = state;
  
  const { queue, queueSlots, activeProcess, completedQueue } = processState;
  
  const inventory = player?.inventory || { minerals: [], gems: [], equipment: [] };
  
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
    
    const equipment = inventory.equipment || [];
    const processingTime = calculateProcessingTime(itemId, processType, { processingSpeedBonus: 0 });
    const estimatedCompletion = Date.now() + processingTime;
    
    dispatch({
      type: QUEUE_ITEM,
      payload: {
        itemId,
        processType,
        startTime: Date.now(),
        estimatedCompletion
      }
    });
    
    return true;
  }, [dispatch, queue.length, queueSlots, inventory.equipment]);
  
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
   * Get available items that can be queued
   * Returns items that are currently in inventory
   */
  const availableItems = [
    ...(inventory.minerals || []).map(m => ({ id: m.id, gemId: m.id, quantity: m.quantity, quality: m.quality, type: 'mineral' })),
    ...(inventory.gems || []).map(g => ({ id: g.gemId, gemId: g.gemId, quantity: g.quantity, quality: g.quality, type: 'gem' }))
  ];
  
  return {
    queue,
    queueSlots,
    activeProcess,
    completedQueue,
    availableItems,
    addToQueue,
    collectQueueItem,
    cancelQueueItem
  };
}
