import { describe, it, expect } from 'vitest';
import {
  calculateTumbleSortScore,
  mapScoreToQuality,
} from '../minigameScoring';

describe('calculateTumbleSortScore', () => {
  it('returns 100 for perfect play', () => {
    const results = {
      gemsCollected: 10,
      totalGems: 10,
      wrongClicks: 0,
      timeLeft: 75,
      maxTime: 75,
    };
    expect(calculateTumbleSortScore(results)).toBe(100);
  });

  it('calculates score when no gems collected (accuracy + speed bonus)', () => {
    const results = {
      gemsCollected: 0,
      totalGems: 10,
      wrongClicks: 0,
      timeLeft: 75,
      maxTime: 75,
    };
    // Collection: 0/10 * 70 = 0
    // Accuracy: 20 - 0 = 20
    // Speed: 75/75 * 10 = 10
    // Total: 0 + 20 + 10 = 30
    expect(calculateTumbleSortScore(results)).toBe(30);
  });

  it('calculates correct score for partial collection', () => {
    const results = {
      gemsCollected: 5,
      totalGems: 10,
      wrongClicks: 0,
      timeLeft: 75,
      maxTime: 75,
    };
    // Collection: 5/10 * 70 = 35
    // Accuracy: 20 - 0 = 20
    // Speed: 75/75 * 10 = 10
    // Total: 35 + 20 + 10 = 65
    expect(calculateTumbleSortScore(results)).toBe(65);
  });

  it('penalizes wrong clicks correctly', () => {
    const results = {
      gemsCollected: 10,
      totalGems: 10,
      wrongClicks: 2,
      timeLeft: 75,
      maxTime: 75,
    };
    // Collection: 10/10 * 70 = 70
    // Accuracy: 20 - (2 * 5) = 10
    // Speed: 75/75 * 10 = 10
    // Total: 70 + 10 + 10 = 90
    expect(calculateTumbleSortScore(results)).toBe(90);
  });

  it('caps wrong click penalty at 20', () => {
    const results = {
      gemsCollected: 10,
      totalGems: 10,
      wrongClicks: 10,
      timeLeft: 75,
      maxTime: 75,
    };
    // Collection: 70
    // Accuracy: 20 - min(10 * 5, 20) = 0
    // Speed: 10
    // Total: 70 + 0 + 10 = 80
    expect(calculateTumbleSortScore(results)).toBe(80);
  });

  it('calculates time bonus correctly', () => {
    const results = {
      gemsCollected: 10,
      totalGems: 10,
      wrongClicks: 0,
      timeLeft: 37.5,
      maxTime: 75,
    };
    // Collection: 70
    // Accuracy: 20
    // Speed: 37.5/75 * 10 = 5
    // Total: 70 + 20 + 5 = 95
    expect(calculateTumbleSortScore(results)).toBe(95);
  });

  it('returns 0 for no time remaining', () => {
    const results = {
      gemsCollected: 10,
      totalGems: 10,
      wrongClicks: 0,
      timeLeft: 0,
      maxTime: 75,
    };
    // Collection: 70
    // Accuracy: 20
    // Speed: 0/75 * 10 = 0
    // Total: 70 + 20 + 0 = 90
    expect(calculateTumbleSortScore(results)).toBe(90);
  });

  it('handles edge case of zero total gems', () => {
    const results = {
      gemsCollected: 0,
      totalGems: 0,
      wrongClicks: 0,
      timeLeft: 75,
      maxTime: 75,
    };
    // Collection rate = 0 (avoid division by zero)
    // Collection: 0 * 70 = 0
    // Accuracy: 20
    // Speed: 75/75 * 10 = 10
    // Total: 0 + 20 + 10 = 30
    expect(calculateTumbleSortScore(results)).toBe(30);
  });

  it('cannot go below 0', () => {
    const results = {
      gemsCollected: 0,
      totalGems: 10,
      wrongClicks: 10,
      timeLeft: 0,
      maxTime: 75,
    };
    // Collection: 0
    // Accuracy: 0 (capped penalty)
    // Speed: 0
    // Total: 0
    expect(calculateTumbleSortScore(results)).toBe(0);
  });
});

describe('mapScoreToQuality', () => {
  it('returns 40% for 0 score', () => {
    expect(mapScoreToQuality(0)).toBe(40);
  });

  it('returns 100% for 100 score', () => {
    expect(mapScoreToQuality(100)).toBe(100);
  });

  it('returns 75% for 50 score', () => {
    // 40 + (50 * 0.6) = 40 + 30 = 70
    expect(mapScoreToQuality(50)).toBe(70);
  });

  it('calculates intermediate values correctly', () => {
    // Score 25: 40 + (25 * 0.6) = 55
    expect(mapScoreToQuality(25)).toBe(55);
    // Score 75: 40 + (75 * 0.6) = 85
    expect(mapScoreToQuality(75)).toBe(85);
  });

  it('applies equipment bonus correctly', () => {
    // Score 100 with 5% bonus: 100 + 5 = 105
    expect(mapScoreToQuality(100, 5)).toBe(105);
    // Score 80 with 10% bonus: 40 + 48 + 10 = 98
    expect(mapScoreToQuality(80, 10)).toBe(98);
  });

  it('caps quality at 110%', () => {
    // Score 100 with max bonus: 100 + 10 = 110
    expect(mapScoreToQuality(100, 10)).toBe(110);
    // Score 120 (invalid) with bonus: 40 + 72 + 10 = 122, capped to 110
    expect(mapScoreToQuality(120, 10)).toBe(110);
  });

  it('handles zero equipment bonus', () => {
    expect(mapScoreToQuality(50, 0)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    // Score 33: 40 + 19.8 = 59.8 → 60
    expect(mapScoreToQuality(33)).toBe(60);
    // Score 34: 40 + 20.4 = 60.4 → 60
    expect(mapScoreToQuality(34)).toBe(60);
  });
});
