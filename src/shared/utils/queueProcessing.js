/**
 * Queue Processing Utilities
 * Handles time calculations and completion checks for queued processes
 */

// Processing time ranges in milliseconds
export const PROCESSING_TIMES = {
  cleaning: { min: 5 * 60 * 1000, max: 15 * 60 * 1000 },   // 5-15 minutes
  cutting: { min: 15 * 60 * 1000, max: 45 * 60 * 1000 },   // 15-45 minutes
  faceting: { min: 30 * 60 * 1000, max: 90 * 60 * 1000 }, // 30-90 minutes
};

/**
 * Calculate the processing time for an item
 * @param {string} itemId - The item identifier
 * @param {string} processType - Type of process (cleaning, cutting, faceting)
 * @param {Object} equipment - Equipment object with bonuses
 * @returns {number} Processing time in milliseconds
 */
export function calculateProcessingTime(itemId, processType, equipment = {}) {
  const timeRange = PROCESSING_TIMES[processType];
  
  if (!timeRange) {
    console.warn(`Unknown process type: ${processType}, defaulting to cutting times`);
    return calculateProcessingTime(itemId, 'cutting', equipment);
  }
  
  // Generate a deterministic time based on itemId to ensure consistency
  const hash = itemId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Use hash to get a value between 0 and 1, then scale to the time range
  const ratio = (hash % 1000) / 1000;
  let baseTime = timeRange.min + ratio * (timeRange.max - timeRange.min);
  
  // Apply equipment speed bonus (processingSpeedBonus reduces time)
  const speedBonus = equipment.processingSpeedBonus || 0;
  if (speedBonus > 0) {
    // Speed bonus is a percentage reduction (e.g., 0.2 = 20% faster)
    baseTime = baseTime * (1 - speedBonus);
  }
  
  return Math.round(baseTime);
}

/**
 * Check if a queue process is complete
 * @param {Object} process - The process object with startTime and estimatedCompletion
 * @param {number} now - Current timestamp (defaults to Date.now())
 * @returns {boolean} True if the process is complete
 */
export function isQueueProcessComplete(process, now = Date.now()) {
  if (!process || !process.startTime || !process.estimatedCompletion) {
    return false;
  }
  
  return now >= process.estimatedCompletion;
}

/**
 * Get the remaining time until a process completes
 * @param {Object} process - The process object with estimatedCompletion
 * @param {number} now - Current timestamp (defaults to Date.now())
 * @returns {number} Remaining time in milliseconds (0 if already complete)
 */
export function getRemainingTime(process, now = Date.now()) {
  if (!process || !process.estimatedCompletion) {
    return 0;
  }
  
  const remaining = process.estimatedCompletion - now;
  return Math.max(0, remaining);
}
