/**
 * Queue Processing Utilities
 * Handles time calculations and completion checks for queued processes
 */

import { PROCESS_EQUIPMENT } from '../../data/processEquipment';

// Processing time ranges in milliseconds
export const PROCESSING_TIMES = {
  cleaning: { min: 5 * 60 * 1000, max: 15 * 60 * 1000 },   // 5-15 minutes
  cutting: { min: 15 * 60 * 1000, max: 45 * 60 * 1000 },   // 15-45 minutes
  faceting: { min: 30 * 60 * 1000, max: 90 * 60 * 1000 }, // 30-90 minutes
};

// Idle processing quality ranges (percentage)
export const IDLE_QUALITY_RANGES = {
  cleaning: { min: 50, max: 75 },   // 50-75% for idle cleaning
  cutting: { min: 45, max: 70 },   // 45-70% for idle cutting
  faceting: { min: 40, max: 65 },  // 40-65% for idle faceting
};

/**
 * Get the speed bonus for a process type based on equipped tool
 * @param {string} processType - Type of process
 * @param {string} equipmentId - ID of equipped equipment
 * @returns {number} Speed bonus multiplier (0-0.5)
 */
export function getSpeedBonus(processType, equipmentId) {
  const eq = PROCESS_EQUIPMENT[equipmentId];
  if (!eq) return 0;
  
  // Map process type to equipment effect property
  const speedProps = {
    cleaning: 'idleSpeedBonus',
    cutting: 'cutSpeedBonus',
    faceting: 'facetSpeedBonus'
  };
  
  return eq.effects[speedProps[processType]] || 0;
}

/**
 * Get the quality bonus for a process type based on equipped tool
 * @param {string} processType - Type of process
 * @param {string} equipmentId - ID of equipped equipment
 * @returns {number} Quality bonus percentage
 */
export function getQualityBonus(processType, equipmentId) {
  const eq = PROCESS_EQUIPMENT[equipmentId];
  if (!eq) return 0;
  
  // Map process type to equipment effect property
  const qualityProps = {
    cleaning: 'idleQualityBonus',
    cutting: 'cutQualityBonus',
    faceting: 'facetQualityBonus'
  };
  
  return eq.effects[qualityProps[processType]] || 0;
}

/**
 * Calculate idle processing quality for an item
 * @param {string} processType - Type of process
 * @param {string} equipmentId - ID of equipped equipment
 * @returns {number} Quality percentage
 */
export function calculateIdleQuality(processType, equipmentId) {
  const range = IDLE_QUALITY_RANGES[processType];
  if (!range) return 50;
  
  // Generate deterministic quality based on process type and equipment
  const hash = (processType + equipmentId).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const ratio = (hash % 100) / 100;
  let baseQuality = range.min + ratio * (range.max - range.min);
  
  // Apply equipment quality bonus
  const qualityBonus = getQualityBonus(processType, equipmentId);
  baseQuality = Math.min(85, baseQuality + qualityBonus); // Cap at 85% for idle
  
  return Math.round(baseQuality);
}

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
