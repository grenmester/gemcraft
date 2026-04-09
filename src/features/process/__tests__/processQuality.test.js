import { describe, it, expect } from 'vitest';

/**
 * Tests for useProcess hook quality functionality
 * These test that quality is properly passed through the processing system
 */

describe('Process Quality Flow', () => {
  // Simulate the availableItems transformation from useProcess
  const transformInventoryToItems = (inventory) => {
    return [
      ...(inventory.minerals || []).map(m => ({ 
        id: m.id, 
        gemId: m.id, 
        quantity: m.quantity, 
        quality: m.quality, 
        type: 'mineral' 
      })),
      ...(inventory.gems || []).map(g => ({ 
        id: g.gemId, 
        gemId: g.gemId, 
        quantity: g.quantity, 
        quality: g.quality, 
        type: 'gem' 
      }))
    ];
  };

  describe('Available items transformation', () => {
    it('includes quality in mineral items', () => {
      const inventory = {
        minerals: [
          { id: 'clear_quartz', quantity: 5, quality: 95.5 },
          { id: 'hematite', quantity: 3, quality: 87.2 }
        ],
        gems: []
      };

      const items = transformInventoryToItems(inventory);
      
      const quartz = items.find(i => i.id === 'clear_quartz');
      expect(quartz.quality).toBe(95.5);
      expect(quartz.type).toBe('mineral');
      
      const hematite = items.find(i => i.id === 'hematite');
      expect(hematite.quality).toBe(87.2);
      expect(hematite.type).toBe('mineral');
    });

    it('includes quality in gem items', () => {
      const inventory = {
        minerals: [],
        gems: [
          { gemId: 'diamond', quantity: 2, quality: 92.1 },
          { gemId: 'ruby', quantity: 1, quality: 78.5 }
        ]
      };

      const items = transformInventoryToItems(inventory);
      
      const diamond = items.find(i => i.id === 'diamond');
      expect(diamond.quality).toBe(92.1);
      expect(diamond.type).toBe('gem');
      
      const ruby = items.find(i => i.id === 'ruby');
      expect(ruby.quality).toBe(78.5);
      expect(ruby.type).toBe('gem');
    });

    it('handles items without quality (backward compatibility)', () => {
      const inventory = {
        minerals: [
          { id: 'clear_quartz', quantity: 5 } // No quality field
        ],
        gems: []
      };

      const items = transformInventoryToItems(inventory);
      
      const quartz = items.find(i => i.id === 'clear_quartz');
      expect(quartz.quality).toBeUndefined();
    });

    it('combines minerals and gems correctly', () => {
      const inventory = {
        minerals: [
          { id: 'clear_quartz', quantity: 5, quality: 95 }
        ],
        gems: [
          { gemId: 'diamond', quantity: 1, quality: 90 }
        ]
      };

      const items = transformInventoryToItems(inventory);
      
      expect(items.length).toBe(2);
      expect(items.find(i => i.type === 'mineral')).toBeDefined();
      expect(items.find(i => i.type === 'gem')).toBeDefined();
    });

    it('handles empty inventory', () => {
      const inventory = {
        minerals: [],
        gems: []
      };

      const items = transformInventoryToItems(inventory);
      
      expect(items.length).toBe(0);
    });
  });
});

describe('Quality Level Processing', () => {
  const QUALITY_CONFIG = {
    low: { base: 40, variance: 20, cooldown: 3000 },    // 40-60%, 3s cooldown
    medium: { base: 60, variance: 20, cooldown: 8000 }, // 60-80%, 8s cooldown
    high: { base: 80, variance: 20, cooldown: 15000 }   // 80-100%, 15s cooldown
  };

  const calculateProcessingQuality = (qualityLevel) => {
    const config = QUALITY_CONFIG[qualityLevel] || QUALITY_CONFIG.low;
    const quality = config.base + Math.random() * config.variance;
    return Math.round(quality * 10) / 10;
  };

  describe('Quality generation by level', () => {
    it('low quality level generates 40-60%', () => {
      for (let i = 0; i < 100; i++) {
        const quality = calculateProcessingQuality('low');
        expect(quality).toBeGreaterThanOrEqual(40);
        expect(quality).toBeLessThanOrEqual(60);
      }
    });

    it('medium quality level generates 60-80%', () => {
      for (let i = 0; i < 100; i++) {
        const quality = calculateProcessingQuality('medium');
        expect(quality).toBeGreaterThanOrEqual(60);
        expect(quality).toBeLessThanOrEqual(80);
      }
    });

    it('high quality level generates 80-100%', () => {
      for (let i = 0; i < 100; i++) {
        const quality = calculateProcessingQuality('high');
        expect(quality).toBeGreaterThanOrEqual(80);
        expect(quality).toBeLessThanOrEqual(100);
      }
    });

    it('invalid level defaults to low', () => {
      const quality = calculateProcessingQuality('invalid');
      expect(quality).toBeGreaterThanOrEqual(40);
      expect(quality).toBeLessThanOrEqual(60);
    });
  });

  describe('Masterwork detection', () => {
    const isMasterwork = (quality) => quality >= 90;

    it('identifies masterwork at 90%', () => {
      expect(isMasterwork(90)).toBe(true);
    });

    it('identifies masterwork above 90%', () => {
      expect(isMasterwork(95)).toBe(true);
      expect(isMasterwork(100)).toBe(true);
    });

    it('does not identify masterwork below 90%', () => {
      expect(isMasterwork(89)).toBe(false);
      expect(isMasterwork(80)).toBe(false);
      expect(isMasterwork(60)).toBe(false);
    });
  });

  describe('Value calculation with quality', () => {
    const calculateValue = (baseValue, quality) => {
      const qualityMultiplier = quality / 100;
      const qualityAdjustedValue = Math.round(baseValue * qualityMultiplier);
      const isMasterwork = quality >= 90;
      return isMasterwork 
        ? Math.round(qualityAdjustedValue * 1.25) 
        : qualityAdjustedValue;
    };

    it('applies quality multiplier correctly', () => {
      // Note: At 100% quality, isMasterwork is true (100 >= 90), so it gets 1.25x bonus
      // 100% of 100 = 100, then 25% bonus = 125
      expect(calculateValue(100, 100)).toBe(125);
      // 75% = no masterwork bonus
      expect(calculateValue(100, 75)).toBe(75);   // 75% = 3/4
      // 50% = no masterwork bonus
      expect(calculateValue(100, 50)).toBe(50);   // 50% = half
    });

    it('applies masterwork bonus at 90%+', () => {
      // 90% of 100 = 90, then 25% bonus = 112.5 rounded = 113
      expect(calculateValue(100, 90)).toBe(113);
      // 95% of 100 = 95, then 25% bonus = 118.75 rounded = 119
      expect(calculateValue(100, 95)).toBe(119);
    });

    it('no masterwork bonus below 90%', () => {
      // 89% of 100 = 89, no bonus
      expect(calculateValue(100, 89)).toBe(89);
      // 80% of 100 = 80, no bonus
      expect(calculateValue(100, 80)).toBe(80);
    });
  });
});
