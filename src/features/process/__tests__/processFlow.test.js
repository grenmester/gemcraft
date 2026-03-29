import { describe, it, expect } from 'vitest';
import {
  calculateProcessingTime,
  isQueueProcessComplete,
  getRemainingTime,
  PROCESSING_TIMES,
} from '../../../shared/utils/queueProcessing';
import {
  calculateTumbleSortScore,
  mapScoreToQuality,
} from '../utils/minigameScoring';

/**
 * Process Flow Integration Tests
 * Tests the complete process flow including:
 * - Quality system integration with items
 * - Queue processing time calculations
 * - Equipment bonuses apply correctly
 * - Process state transitions
 */

describe('Process Flow Integration', () => {
  describe('Quality System Integration', () => {
    it('maps tumble sort score to quality percentage', () => {
      // Perfect play (100 score) should give high quality
      const results = {
        gemsCollected: 10,
        totalGems: 10,
        wrongClicks: 0,
        timeLeft: 75,
        maxTime: 75,
      };
      const score = calculateTumbleSortScore(results);
      expect(score).toBe(100);
      
      const quality = mapScoreToQuality(score);
      expect(quality).toBe(100);
    });

    it('calculates quality for partial performance', () => {
      const results = {
        gemsCollected: 5,
        totalGems: 10,
        wrongClicks: 1,
        timeLeft: 37.5,
        maxTime: 75,
      };
      const score = calculateTumbleSortScore(results);
      const quality = mapScoreToQuality(score);
      
      // Score calculation:
      // Collection: 5/10 * 70 = 35
      // Accuracy: 20 - 5 = 15
      // Speed: 37.5/75 * 10 = 5
      // Total: 55
      expect(score).toBe(55);
      
      // Quality: 40 + (55 * 0.6) = 73
      expect(quality).toBe(73);
    });

    it('enforces minimum quality of 40%', () => {
      // Worst case - no gems collected, many wrong clicks
      const results = {
        gemsCollected: 0,
        totalGems: 10,
        wrongClicks: 10,
        timeLeft: 0,
        maxTime: 75,
      };
      const score = calculateTumbleSortScore(results);
      expect(score).toBe(0);
      
      const quality = mapScoreToQuality(score);
      expect(quality).toBe(40);
    });

    it('caps quality at 110% with equipment bonus', () => {
      const perfectScore = 100;
      
      // Max bonus (10%) should cap at 110
      const qualityWithMaxBonus = mapScoreToQuality(perfectScore, 10);
      expect(qualityWithMaxBonus).toBe(110);
      
      // Over-max bonus should still cap at 110
      const qualityWithOverBonus = mapScoreToQuality(perfectScore, 20);
      expect(qualityWithOverBonus).toBe(110);
    });
  });

  describe('Queue Processing Time Calculations', () => {
    it('calculates processing time for cleaning process', () => {
      const itemId = 'test_mineral_1';
      const time = calculateProcessingTime(itemId, 'cleaning');
      
      // Cleaning: 5-15 minutes (300000-900000ms)
      expect(time).toBeGreaterThanOrEqual(300000);
      expect(time).toBeLessThanOrEqual(900000);
    });

    it('calculates processing time for cutting process', () => {
      const itemId = 'test_mineral_2';
      const time = calculateProcessingTime(itemId, 'cutting');
      
      // Cutting: 15-45 minutes (900000-2700000ms)
      expect(time).toBeGreaterThanOrEqual(900000);
      expect(time).toBeLessThanOrEqual(2700000);
    });

    it('calculates processing time for faceting process', () => {
      const itemId = 'test_mineral_3';
      const time = calculateProcessingTime(itemId, 'faceting');
      
      // Faceting: 30-90 minutes (1800000-5400000ms)
      expect(time).toBeGreaterThanOrEqual(1800000);
      expect(time).toBeLessThanOrEqual(5400000);
    });

    it('generates deterministic times for same itemId', () => {
      const itemId = 'consistent_item';
      const time1 = calculateProcessingTime(itemId, 'cutting');
      const time2 = calculateProcessingTime(itemId, 'cutting');
      
      expect(time1).toBe(time2);
    });

    it('generates different times for different itemIds', () => {
      const time1 = calculateProcessingTime('item_alpha', 'cutting');
      const time2 = calculateProcessingTime('item_beta', 'cutting');
      
      // Very likely to be different (probability of collision is very low)
      // We test that at least one pair is different
      const time3 = calculateProcessingTime('item_gamma', 'cutting');
      const hasVariation = !(time1 === time2 && time2 === time3);
      expect(hasVariation).toBe(true);
    });

    it('defaults to cutting times for unknown process types', () => {
      const itemId = 'test_item';
      const time = calculateProcessingTime(itemId, 'unknown_process');
      
      // Should default to cutting range
      expect(time).toBeGreaterThanOrEqual(900000);
      expect(time).toBeLessThanOrEqual(2700000);
    });

    it('exports correct PROCESSING_TIMES constants', () => {
      expect(PROCESSING_TIMES.cleaning.min).toBe(5 * 60 * 1000);
      expect(PROCESSING_TIMES.cleaning.max).toBe(15 * 60 * 1000);
      expect(PROCESSING_TIMES.cutting.min).toBe(15 * 60 * 1000);
      expect(PROCESSING_TIMES.cutting.max).toBe(45 * 60 * 1000);
      expect(PROCESSING_TIMES.faceting.min).toBe(30 * 60 * 1000);
      expect(PROCESSING_TIMES.faceting.max).toBe(90 * 60 * 1000);
    });
  });

  describe('Equipment Bonuses', () => {
    it('applies processing speed bonus to reduce time', () => {
      const itemId = 'speed_test_item';
      const baseTime = calculateProcessingTime(itemId, 'cutting');
      const bonusTime = calculateProcessingTime(itemId, 'cutting', {
        processingSpeedBonus: 0.2 // 20% faster
      });
      
      // With 20% bonus, time should be reduced by 20%
      expect(bonusTime).toBe(Math.round(baseTime * 0.8));
    });

    it('applies quality bonus to minigame score', () => {
      const baseScore = 80;
      const baseQuality = mapScoreToQuality(baseScore, 0);
      const bonusQuality = mapScoreToQuality(baseScore, 10);
      
      // 10% bonus should add 10 to quality
      expect(bonusQuality).toBe(baseQuality + 10);
    });

    it('handles zero processing speed bonus', () => {
      const itemId = 'no_bonus_item';
      const baseTime = calculateProcessingTime(itemId, 'cutting');
      const noBonusTime = calculateProcessingTime(itemId, 'cutting', {
        processingSpeedBonus: 0
      });
      
      expect(baseTime).toBe(noBonusTime);
    });

    it('handles missing equipment object', () => {
      const itemId = 'missing_equipment';
      const time = calculateProcessingTime(itemId, 'cutting');
      const timeWithUndefined = calculateProcessingTime(itemId, 'cutting', undefined);
      
      expect(time).toBe(timeWithUndefined);
    });

    it('cumulative equipment bonus caps at 110% quality', () => {
      // Perfect score with max bonus
      const quality = mapScoreToQuality(100, 10);
      expect(quality).toBe(110);
    });
  });

  describe('Process State Transitions', () => {
    describe('Queue Process Completion', () => {
      it('detects incomplete process', () => {
        const now = Date.now();
        const process = {
          startTime: now,
          estimatedCompletion: now + 60000, // 1 minute from now
        };
        
        expect(isQueueProcessComplete(process, now)).toBe(false);
      });

      it('detects complete process', () => {
        const now = Date.now();
        const process = {
          startTime: now - 60000,
          estimatedCompletion: now - 1000, // Completed 1 second ago
        };
        
        expect(isQueueProcessComplete(process, now)).toBe(true);
      });

      it('handles process at exact completion time', () => {
        const now = Date.now();
        const process = {
          startTime: now - 60000,
          estimatedCompletion: now, // Exactly now
        };
        
        expect(isQueueProcessComplete(process, now)).toBe(true);
      });

      it('returns false for null/undefined process', () => {
        expect(isQueueProcessComplete(null)).toBe(false);
        expect(isQueueProcessComplete(undefined)).toBe(false);
      });

      it('returns false for process without timing data', () => {
        expect(isQueueProcessComplete({})).toBe(false);
        expect(isQueueProcessComplete({ startTime: Date.now() })).toBe(false);
      });
    });

    describe('Remaining Time Calculation', () => {
      it('calculates positive remaining time', () => {
        const now = Date.now();
        const process = {
          startTime: now,
          estimatedCompletion: now + 60000, // 1 minute from now
        };
        
        const remaining = getRemainingTime(process, now);
        expect(remaining).toBe(60000);
      });

      it('returns zero for completed process', () => {
        const now = Date.now();
        const process = {
          startTime: now - 120000,
          estimatedCompletion: now - 60000, // Completed 1 minute ago
        };
        
        const remaining = getRemainingTime(process, now);
        expect(remaining).toBe(0);
      });

      it('returns zero for null/undefined process', () => {
        expect(getRemainingTime(null)).toBe(0);
        expect(getRemainingTime(undefined)).toBe(0);
      });

      it('returns zero for process without completion time', () => {
        expect(getRemainingTime({})).toBe(0);
      });
    });
  });

  describe('End-to-End Process Flow', () => {
    it('simulates complete quality workflow', () => {
      // 1. Player completes minigame with score around 77
      const minigameResults = {
        gemsCollected: 8,
        totalGems: 10,
        wrongClicks: 1,
        timeLeft: 50,
        maxTime: 75,
      };
      const score = calculateTumbleSortScore(minigameResults);
      // Collection: 8/10 * 70 = 56
      // Accuracy: 20 - 5 = 15
      // Speed: 50/75 * 10 = 6.67
      // Total: Math.floor(56 + 15 + 6.67) = 77
      expect(score).toBe(77);
      
      // 2. Calculate quality with equipment bonus
      const quality = mapScoreToQuality(score, 5); // 5% equipment bonus
      // Base: 40 + (77 * 0.6) = 86.2 → 86
      // With bonus: 86 + 5 = 91
      expect(quality).toBe(91);
    });

    it('simulates queue processing workflow', () => {
      const itemId = 'queued_gem_001';
      const processType = 'cutting';
      const equipment = { processingSpeedBonus: 0.15 }; // 15% speed bonus
      
      // 1. Calculate processing time
      const processingTime = calculateProcessingTime(itemId, processType, equipment);
      
      // 2. Create queue item with completion time
      const now = Date.now();
      const queueItem = {
        itemId,
        processType,
        startTime: now,
        estimatedCompletion: now + processingTime,
      };
      
      // 3. Verify process won't be complete immediately
      expect(isQueueProcessComplete(queueItem, now)).toBe(false);
      
      // 4. Calculate remaining time at start
      const remainingAtStart = getRemainingTime(queueItem, now);
      expect(remainingAtStart).toBe(processingTime);
      
      // 5. Simulate time passing to completion
      const afterCompletion = now + processingTime + 1000;
      expect(isQueueProcessComplete(queueItem, afterCompletion)).toBe(true);
      
      // 6. Remaining time after completion should be 0
      const remainingAfterComplete = getRemainingTime(queueItem, afterCompletion);
      expect(remainingAfterComplete).toBe(0);
    });

    it('handles multiple queue items with different times', () => {
      const items = ['gem_a', 'gem_b', 'gem_c'];
      const queueItems = items.map((itemId, index) => {
        const time = calculateProcessingTime(itemId, 'cleaning');
        const startTime = Date.now() + (index * 10000); // Stagger start times
        return {
          itemId,
          startTime,
          estimatedCompletion: startTime + time,
        };
      });
      
      // All items should be in the valid time range
      queueItems.forEach((item) => {
        expect(isQueueProcessComplete(item, item.startTime)).toBe(false);
      });
      
      // Items should have different completion times (deterministic but varied)
      const completionTimes = queueItems.map((item) => item.estimatedCompletion);
      const uniqueTimes = new Set(completionTimes);
      expect(uniqueTimes.size).toBe(items.length);
    });

    it('validates quality ranges across all score values', () => {
      for (let score = 0; score <= 100; score += 10) {
        const quality = mapScoreToQuality(score);
        expect(quality).toBeGreaterThanOrEqual(40);
        expect(quality).toBeLessThanOrEqual(100);
      }
    });

    it('validates equipment bonus integration', () => {
      const baseScore = 75;
      const baseQuality = mapScoreToQuality(baseScore);
      
      for (let bonus = 0; bonus <= 10; bonus += 2) {
        const quality = mapScoreToQuality(baseScore, bonus);
        expect(quality).toBeGreaterThanOrEqual(baseQuality);
        expect(quality).toBeLessThanOrEqual(110);
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles empty itemId gracefully', () => {
      const time = calculateProcessingTime('', 'cutting');
      expect(time).toBeGreaterThanOrEqual(900000);
      expect(time).toBeLessThanOrEqual(2700000);
    });

    it('handles special characters in itemId', () => {
      const time = calculateProcessingTime('gem_123-test', 'cutting');
      expect(time).toBeGreaterThanOrEqual(900000);
      expect(time).toBeLessThanOrEqual(2700000);
    });

    it('handles very long itemId', () => {
      const longId = 'a'.repeat(100);
      const time = calculateProcessingTime(longId, 'cutting');
      expect(time).toBeGreaterThanOrEqual(900000);
      expect(time).toBeLessThanOrEqual(2700000);
    });

    it('handles score at boundaries', () => {
      expect(mapScoreToQuality(0)).toBe(40);
      expect(mapScoreToQuality(100)).toBe(100);
    });

    it('handles fractional quality bonuses', () => {
      // Test that fractional bonuses work correctly
      const base = mapScoreToQuality(50, 0);
      const fractional = mapScoreToQuality(50, 0.5);
      expect(fractional).toBeGreaterThanOrEqual(base);
    });
  });
});
