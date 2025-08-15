/**
 * Simulation - Network growth simulation for referral networks
 * 
 * Simulates the growth of a referral network over time with parameters:
 * - Initial active referrers: 100
 * - Referral capacity per user: 10 (after which they become inactive)
 * - Time is measured in days
 */
export default class Simulation {
  constructor() {
    this.initialActiveReferrers = 100;
    this.referralCapacity = 10;
  }

  /**
   * Simulate network growth over specified number of days
   * 
   * @param {number} p - Probability of successful referral per day per active referrer
   * @param {number} days - Number of days to simulate
   * @returns {number[]} - Array of cumulative expected referrals at end of each day
   * @throws {Error} - If p is not between 0 and 1, or days is negative
   */
  simulate(p, days) {
  // Hard cap to prevent runaway memory usage in tests/CI
  const MAX_REFERRERS = 5000;
  const MAX_DAYS = 100;
  if (days > MAX_DAYS) days = MAX_DAYS;
    if (p < 0 || p > 1) {
      throw new Error("Probability p must be between 0 and 1");
    }
    if (days < 0) {
      throw new Error("Days must be non-negative");
    }

    // Initialize simulation state
    let activeReferrers = this.initialActiveReferrers;
    let totalReferrals = 0;
    const cumulativeReferrals = [];

    // Track referral counts for each active referrer using array instead of Map
    const referrerCounts = new Array(activeReferrers).fill(0);
    let nextReferrerId = activeReferrers;

    for (let day = 0; day < days; day++) {
      // Calculate expected referrals for this day
      let dailyReferrals = 0;
      const newReferrers = [];

      // Process each active referrer
      for (let i = 0; i < referrerCounts.length; i++) {
        if (referrerCounts[i] >= this.referralCapacity) {
          continue; // Already inactive
        }

        // Expected referrals from this referrer
        const expectedRefs = p;
        dailyReferrals += expectedRefs;

        // Update referrer's count
        referrerCounts[i] += expectedRefs;
      }

      // Add new referrers from successful referrals, but cap total
      const newReferrerCount = Math.floor(dailyReferrals);
      for (let i = 0; i < newReferrerCount && referrerCounts.length < MAX_REFERRERS; i++) {
        referrerCounts.push(0);
        newReferrers.push(nextReferrerId++);
      }

      // Update total and store cumulative
      totalReferrals += dailyReferrals;
      cumulativeReferrals.push(Math.floor(totalReferrals));
      // If we hit the cap, stop simulation early
      if (referrerCounts.length >= MAX_REFERRERS) break;
    }

    return cumulativeReferrals;
  }

  /**
   * Calculate minimum days to reach at least targetTotal referrals
   * 
   * Uses binary search to find the minimum number of days needed
   * 
   * @param {number} p - Probability of successful referral per day per active referrer
   * @param {number} targetTotal - Target number of total referrals
   * @returns {number} - Minimum days needed to reach targetTotal referrals
   * @throws {Error} - If p is not between 0 and 1, or targetTotal is negative
   */
  daysToTarget(p, targetTotal) {
    if (p < 0 || p > 1) {
      throw new Error("Probability p must be between 0 and 1");
    }
    if (targetTotal < 0) {
      throw new Error("Target total must be non-negative");
    }

    // Handle edge cases
    if (targetTotal === 0) {
      return 0;
    }

    if (p === 0) {
      return Infinity; // Impossible to reach target
    }

    // Binary search for minimum days
    let left = 0;
    let right = Math.max(1, targetTotal); // Conservative upper bound

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const result = this.simulate(p, mid);

      if (result[result.length - 1] >= targetTotal) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }

  /**
   * Find minimum bonus to achieve target hires within specified days
   * 
   * Uses binary search to find the minimum bonus that achieves the target.
   * The adoptionProb function should be monotonic (increasing with bonus).
   * 
   * Time Complexity: O(log(B/ε) × T × D × N)
   * Where:
   * - B = maximum bonus range
   * - ε = precision (default $10)
   * - T = target hires
   * - D = days to simulate
   * - N = initial active referrers (100)
   * 
   * @param {number} days - Number of days to simulate
   * @param {number} targetHires - Target number of hires to achieve
   * @param {Function} adoptionProb - Function that takes bonus and returns adoption probability
   * @param {number} eps - Precision for bonus rounding (default $10)
   * @returns {number|null} - Minimum bonus rounded up to nearest eps, or null if impossible
   * @throws {Error} - If days or targetHires is negative, or eps is not positive
   */
  minBonusForTarget(days, targetHires, adoptionProb, eps = 10.0) {
    if (days < 0) {
      throw new Error("Days must be non-negative");
    }
    if (targetHires < 0) {
      throw new Error("Target hires must be non-negative");
    }
    if (eps <= 0) {
      throw new Error("Precision eps must be positive");
    }

    // Handle edge cases
    if (targetHires === 0) {
      return 0.0;
    }

    // Find reasonable bounds for bonus search
    let minBonus = 0.0;
    let maxBonus = 10000.0; // Conservative upper bound

    // Check if target is achievable with maximum bonus
    const maxProb = adoptionProb(maxBonus);
    if (maxProb > 0) {
      const maxResult = this.simulate(maxProb, days);
      if (maxResult[maxResult.length - 1] < targetHires) {
        return null; // Impossible to achieve target
      }
    }

    // Binary search for minimum bonus
    while (maxBonus - minBonus > eps) {
      const midBonus = (minBonus + maxBonus) / 2;
      const prob = adoptionProb(midBonus);

      if (prob > 0) {
        const result = this.simulate(prob, days);
        if (result[result.length - 1] >= targetHires) {
          maxBonus = midBonus;
        } else {
          minBonus = midBonus;
        }
      } else {
        minBonus = midBonus;
      }
    }

    // Round up to nearest eps
    const finalBonus = Math.ceil(maxBonus / eps) * eps;

    // Verify the result
    const finalProb = adoptionProb(finalBonus);
    if (finalProb > 0) {
      const finalResult = this.simulate(finalProb, days);
      if (finalResult[finalResult.length - 1] >= targetHires) {
        return finalBonus;
      }
    }

    return null;
  }
}
