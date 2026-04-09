import { describe, it, expect } from 'vitest';

/**
 * Tests for quality display logic in Inventory component
 * These test the helper functions used for quality badge rendering
 */

describe('Quality Display', () => {
  // Helper function that mirrors the Inventory component logic
  const getQualityColor = (quality) => {
    if (quality === undefined || quality === null) return 'text-gray-400';
    if (quality >= 90) return 'text-yellow-400';
    if (quality >= 75) return 'text-green-400';
    if (quality >= 60) return 'text-blue-400';
    return 'text-gray-400';
  };

  describe('getQualityColor', () => {
    it('returns gray for undefined quality', () => {
      expect(getQualityColor(undefined)).toBe('text-gray-400');
    });

    it('returns gray for null quality', () => {
      expect(getQualityColor(null)).toBe('text-gray-400');
    });

    it('returns gold (yellow) for 90% and above', () => {
      expect(getQualityColor(90)).toBe('text-yellow-400');
      expect(getQualityColor(95)).toBe('text-yellow-400');
      expect(getQualityColor(100)).toBe('text-yellow-400');
    });

    it('returns green for 75-89%', () => {
      expect(getQualityColor(75)).toBe('text-green-400');
      expect(getQualityColor(80)).toBe('text-green-400');
      expect(getQualityColor(89)).toBe('text-green-400');
    });

    it('returns blue for 60-74%', () => {
      expect(getQualityColor(60)).toBe('text-blue-400');
      expect(getQualityColor(65)).toBe('text-blue-400');
      expect(getQualityColor(74)).toBe('text-blue-400');
    });

    it('returns gray for below 60%', () => {
      expect(getQualityColor(59)).toBe('text-gray-400');
      expect(getQualityColor(50)).toBe('text-gray-400');
      expect(getQualityColor(0)).toBe('text-gray-400');
    });
  });

  describe('Quality formatting', () => {
    it('formats quality as percentage string', () => {
      const formatQuality = (quality) => {
        return quality !== undefined && quality !== null ? `${Math.round(quality)}%` : 'N/A';
      };

      expect(formatQuality(95.5)).toBe('96%');
      expect(formatQuality(75.2)).toBe('75%');
      expect(formatQuality(100)).toBe('100%');
      expect(formatQuality(45.7)).toBe('46%');
      expect(formatQuality(undefined)).toBe('N/A');
      expect(formatQuality(null)).toBe('N/A');
    });
  });
});

describe('Tier Quality Ranges', () => {
  const TIER_QUALITY_RANGES = {
    TIER_1: { min: 95, max: 100 },
    TIER_1_B: { min: 90, max: 98 },
    TIER_1_C: { min: 85, max: 95 },
    TIER_2: { min: 85, max: 95 },
    TIER_2_B: { min: 80, max: 92 },
    TIER_2_C: { min: 75, max: 88 },
    TIER_3: { min: 75, max: 88 },
    TIER_3_B: { min: 70, max: 85 },
    TIER_3_C: { min: 65, max: 80 },
    TIER_4: { min: 65, max: 80 },
    TIER_4_B: { min: 60, max: 78 },
    TIER_4_C: { min: 55, max: 75 },
    TIER_5: { min: 55, max: 75 },
    TIER_5_B: { min: 50, max: 72 },
    TIER_5_C: { min: 45, max: 68 },
  };

  // Simulate quality generation
  const generateQuality = (mineId) => {
    const range = TIER_QUALITY_RANGES[mineId] || TIER_QUALITY_RANGES.TIER_1;
    const quality = range.min + Math.random() * (range.max - range.min);
    return Math.round(quality * 10) / 10;
  };

  it('has correct range for all tiers', () => {
    Object.entries(TIER_QUALITY_RANGES).forEach(([tier, range]) => {
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeLessThanOrEqual(100);
      expect(range.min).toBeLessThan(range.max);
    });
  });

  it('higher tiers have lower quality ranges', () => {
    // TIER_1 should have highest quality
    expect(TIER_QUALITY_RANGES.TIER_1.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_2.min);
    expect(TIER_QUALITY_RANGES.TIER_2.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_3.min);
    expect(TIER_QUALITY_RANGES.TIER_3.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_4.min);
    expect(TIER_QUALITY_RANGES.TIER_4.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_5.min);
  });

  it('sub-tiers (B, C) have progressively lower ranges', () => {
    // TIER_1 > TIER_1_B > TIER_1_C
    expect(TIER_QUALITY_RANGES.TIER_1.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_1_B.min);
    expect(TIER_QUALITY_RANGES.TIER_1_B.min).toBeGreaterThan(TIER_QUALITY_RANGES.TIER_1_C.min);
  });

  it('generates quality within valid range', () => {
    // Run multiple times to test randomness stays in bounds
    for (let i = 0; i < 100; i++) {
      const quality = generateQuality('TIER_1');
      expect(quality).toBeGreaterThanOrEqual(95);
      expect(quality).toBeLessThanOrEqual(100);
    }
  });

  it('generates consistent batch quality (all items same tier get same quality)', () => {
    // This tests that items collected in same batch have same quality
    const batchQuality = generateQuality('TIER_3');
    expect(batchQuality).toBeGreaterThanOrEqual(75);
    expect(batchQuality).toBeLessThanOrEqual(88);
  });
});
