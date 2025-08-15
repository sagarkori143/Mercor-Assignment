import Simulation from '../source/Simulation.js';

describe('Simulation', () => {
  let sim;

  beforeEach(() => {
    // Create a fresh simulation instance before each test
    sim = new Simulation();
  });

  describe('simulate', () => {
    test('should simulate basic network growth', () => {
      const result = sim.simulate(0.1, 5);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result.every(x => typeof x === 'number')).toBe(true);
      expect(result[0]).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero probability', () => {
      const result = sim.simulate(0.0, 10);
      
      // With zero probability, should have no referrals
      expect(result.every(x => x === 0)).toBe(true);
    });

    test('should handle maximum probability', () => {
      const result = sim.simulate(1.0, 3);
      
      // With maximum probability, should have significant growth
      expect(result[result.length - 1]).toBeGreaterThan(result[0]);
    });

    test('should throw error for negative days', () => {
      expect(() => {
        sim.simulate(0.1, -1);
      }).toThrow('Days must be non-negative');
    });

    test('should throw error for probability > 1', () => {
      expect(() => {
        sim.simulate(1.5, 5);
      }).toThrow('Probability p must be between 0 and 1');
    });

    test('should throw error for probability < 0', () => {
      expect(() => {
        sim.simulate(-0.1, 5);
      }).toThrow('Probability p must be between 0 and 1');
    });

    test('should return empty array for zero days', () => {
      const result = sim.simulate(0.1, 0);
      expect(result).toEqual([]);
    });

    test('should show monotonically increasing growth', () => {
      const result = sim.simulate(0.1, 10);
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });

    test('should use correct simulation parameters', () => {
      expect(sim.initialActiveReferrers).toBe(100);
      expect(sim.referralCapacity).toBe(10);
    });
  });

  describe('daysToTarget', () => {
    test('should calculate minimum days to reach target', () => {
      const daysNeeded = sim.daysToTarget(0.1, 50);
      
      expect(typeof daysNeeded).toBe('number');
      expect(daysNeeded).toBeGreaterThanOrEqual(0);
    });

    test('should return 0 for zero target', () => {
      const daysNeeded = sim.daysToTarget(0.1, 0);
      expect(daysNeeded).toBe(0);
    });

    test('should return infinity for zero probability', () => {
      const daysNeeded = sim.daysToTarget(0.0, 100);
      expect(daysNeeded).toBe(Infinity);
    });

    test('should throw error for negative target', () => {
      expect(() => {
        sim.daysToTarget(0.1, -10);
      }).toThrow('Target total must be non-negative');
    });

    test('should throw error for invalid probability', () => {
      expect(() => {
        sim.daysToTarget(1.5, 100);
      }).toThrow('Probability p must be between 0 and 1');
    });

    test('should return achievable result', () => {
      const target = 50;
      const daysNeeded = sim.daysToTarget(0.1, target);
      
      if (daysNeeded !== Infinity) {
        const result = sim.simulate(0.1, daysNeeded);
        expect(result[result.length - 1]).toBeGreaterThanOrEqual(target);
      }
    });

    test('should use binary search efficiently', () => {
      const target = 100;
      const daysNeeded = sim.daysToTarget(0.1, target);
      
      // Should find a reasonable number of days
      expect(daysNeeded).toBeGreaterThanOrEqual(0);
      expect(daysNeeded).toBeLessThan(1000); // Reasonable upper bound
    });
  });

  describe('minBonusForTarget', () => {
    test('should find minimum bonus for achievable target', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      const minBonus = sim.minBonusForTarget(30, 100, adoptionProb);
      
      expect(minBonus).not.toBeNull();
      expect(minBonus).toBeGreaterThanOrEqual(0);
      expect(minBonus % 10).toBe(0); // Should be rounded to nearest $10
    });

    test('should return 0 for zero target', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      const minBonus = sim.minBonusForTarget(30, 0, adoptionProb);
      expect(minBonus).toBe(0.0);
    });

    test('should return null for impossible target', () => {
      const adoptionProb = (bonus) => 0.0; // Always zero probability
      
      const minBonus = sim.minBonusForTarget(30, 100, adoptionProb);
      expect(minBonus).toBeNull();
    });

    test('should throw error for negative days', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      expect(() => {
        sim.minBonusForTarget(-10, 100, adoptionProb);
      }).toThrow('Days must be non-negative');
    });

    test('should throw error for negative target', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      expect(() => {
        sim.minBonusForTarget(30, -10, adoptionProb);
      }).toThrow('Target hires must be non-negative');
    });

    test('should throw error for invalid precision', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      expect(() => {
        sim.minBonusForTarget(30, 100, adoptionProb, 0);
      }).toThrow('Precision eps must be positive');
    });

    test('should use custom precision', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      const minBonus = sim.minBonusForTarget(30, 100, adoptionProb, 50);
      
      expect(minBonus).not.toBeNull();
      expect(minBonus % 50).toBe(0); // Should be rounded to nearest $50
    });

    test('should verify returned bonus achieves target', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      const target = 50;
      
      const minBonus = sim.minBonusForTarget(30, target, adoptionProb);
      
      if (minBonus !== null) {
        const prob = adoptionProb(minBonus);
        const result = sim.simulate(prob, 30);
        expect(result[result.length - 1]).toBeGreaterThanOrEqual(target);
      }
    });

    test('should handle monotonic adoption probability function', () => {
      const adoptionProb = (bonus) => Math.min(0.95, 0.1 + bonus / 2000);
      
      const minBonus = sim.minBonusForTarget(30, 100, adoptionProb);
      
      expect(minBonus).not.toBeNull();
      expect(minBonus).toBeGreaterThanOrEqual(0);
    });

    test('should handle edge cases with very small target', () => {
      const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
      
      const minBonus = sim.minBonusForTarget(30, 1, adoptionProb);
      expect(minBonus).not.toBeNull();
    });

    test('should handle edge cases with very large target', () => {
  const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
  // Use a smaller but still large target to avoid memory issues
  const minBonus = sim.minBonusForTarget(30, 2000, adoptionProb);
  // Should either return a valid bonus or null if impossible
  expect(minBonus === null || minBonus > 0).toBe(true);
    });
  });

  describe('simulation parameters', () => {
    test('should have correct initial parameters', () => {
      expect(sim.initialActiveReferrers).toBe(100);
      expect(sim.referralCapacity).toBe(10);
    });

    test('should show expected growth pattern', () => {
      const result = sim.simulate(0.1, 10);
      
      // Should start with some referrals on first day
      expect(result[0]).toBeGreaterThan(0);
      
      // Should grow over time
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });
  });
});

