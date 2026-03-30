/**
 * Minigame scoring utilities for Tumble Sort game
 */

/**
 * Calculate performance score from Tumble Sort minigame results
 * @param {object} results - Minigame performance data
 * @returns {number} Score 0-100
 */
export function calculateTumbleSortScore(results) {
  const {
    gemsCollected,    // Number of gems correctly selected
    totalGems,       // Total gems available
    wrongClicks,     // Times selected wrong item (matrix/waste)
    timeLeft,        // Seconds remaining
    maxTime,         // Maximum allowed time (75s)
  } = results;
  
  // Collection rate (70% weight)
  const collectionRate = totalGems > 0 ? gemsCollected / totalGems : 0;
  const collectionScore = collectionRate * 70;
  
  // Accuracy (20% weight) - penalize wrong clicks
  const maxPenalty = 20;
  const penaltyPerWrong = 5;
  const penalty = Math.min(wrongClicks * penaltyPerWrong, maxPenalty);
  const accuracyScore = 20 - penalty;
  
  // Speed bonus (10% weight) - bonus for finishing early
  const speedRatio = Math.max(0, timeLeft / maxTime);
  const speedScore = speedRatio * 10;
  
  return Math.max(0, Math.floor(collectionScore + accuracyScore + speedScore));
}

/**
 * Map a score (0-100) to a quality percentage (40-110%)
 * @param {number} score - Performance score from minigame (0-100)
 * @param {number} equipmentBonus - Bonus from equipment (0-10%)
 * @returns {number} Quality percentage (40-110%)
 */
export function mapScoreToQuality(score, equipmentBonus = 0) {
  // Base quality from score
  const baseQuality = 40 + (score * 0.6); // 40-100 range
  // Apply equipment bonus (0-10%)
  const quality = Math.min(110, baseQuality + equipmentBonus);
  return Math.round(quality);
}
