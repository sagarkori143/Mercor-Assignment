import ReferralNetwork from '../source/ReferralNetwork.js';

describe('ReferralNetwork', () => {
  let network;

  beforeEach(() => {
    // Create a fresh network instance before each test
    network = new ReferralNetwork();
  });

  describe('addUser', () => {
    test('should add users to the network', () => {
      network.addUser('user1');
      network.addUser('user2');

      expect(network.users.has('user1')).toBe(true);
      expect(network.users.has('user2')).toBe(true);
      expect(network.users.size).toBe(2);
    });

    test('should initialize data structures for new users', () => {
      network.addUser('user1');

      expect(network.graph.has('user1')).toBe(true);
      expect(network.graph.get('user1')).toEqual([]);
      expect(network.directReferrals.has('user1')).toBe(true);
      expect(network.directReferrals.get('user1')).toBeInstanceOf(Set);
    });
  });

  describe('addReferral', () => {
    beforeEach(() => {
      // Add some users for testing referrals
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
    });

    test('should successfully add valid referrals', () => {
      const result = network.addReferral('user1', 'user2');
      
      expect(result).toBe(true);
      expect(network.getDirectReferrals('user1')).toContain('user2');
      expect(network.referrerOf.get('user2')).toBe('user1');
    });

    test('should reject self-referrals', () => {
      const result = network.addReferral('user1', 'user1');
      
      expect(result).toBe(false);
      expect(network.getDirectReferrals('user1')).toEqual([]);
      expect(network.referrerOf.has('user1')).toBe(false);
    });

    test('should reject duplicate referrers for the same candidate', () => {
      // First referral should succeed
      const result1 = network.addReferral('user1', 'user2');
      expect(result1).toBe(true);

      // Second referral to same candidate should fail
      const result2 = network.addReferral('user3', 'user2');
      expect(result2).toBe(false);

      // Verify only first referrer is recorded
      expect(network.referrerOf.get('user2')).toBe('user1');
      expect(network.getDirectReferrals('user1')).toContain('user2');
      expect(network.getDirectReferrals('user3')).not.toContain('user2');
    });

    test('should reject referrals that would create cycles', () => {
      // Create a chain: user1 -> user2 -> user3
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');

      // Try to create cycle: user3 -> user1 (should fail)
      const result = network.addReferral('user3', 'user1');
      expect(result).toBe(false);

      // Verify the cycle was not created
      expect(network.getDirectReferrals('user3')).toEqual([]);
      expect(network.referrerOf.has('user1')).toBe(false);
    });

    test('should throw error for non-existent referrer', () => {
      expect(() => {
        network.addReferral('nonexistent', 'user1');
      }).toThrow('Referrer nonexistent does not exist in the network');
    });

    test('should throw error for non-existent candidate', () => {
      expect(() => {
        network.addReferral('user1', 'nonexistent');
      }).toThrow('Candidate nonexistent does not exist in the network');
    });

    test('should handle complex cycle detection', () => {
      // Create a more complex network: user1 -> user2 -> user3 -> user4
      network.addUser('user4');
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');
      network.addReferral('user3', 'user4');

      // Try to create cycle: user4 -> user2 (should fail)
      const result = network.addReferral('user4', 'user2');
      expect(result).toBe(false);

      // Verify the cycle was not created
      expect(network.getDirectReferrals('user4')).toEqual([]);
    });
  });

  describe('getDirectReferrals', () => {
    test('should return empty array for user with no referrals', () => {
      network.addUser('user1');
      
      const referrals = network.getDirectReferrals('user1');
      expect(referrals).toEqual([]);
    });

    test('should return direct referrals for user', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');

      const referrals = network.getDirectReferrals('user1');
      expect(referrals).toContain('user2');
      expect(referrals).toContain('user3');
      expect(referrals.length).toBe(2);
    });

    test('should not include indirect referrals', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      
      // Create chain: user1 -> user2 -> user3
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');

      const referrals = network.getDirectReferrals('user1');
      expect(referrals).toContain('user2');
      expect(referrals).not.toContain('user3');
      expect(referrals.length).toBe(1);
    });

    test('should throw error for non-existent user', () => {
      expect(() => {
        network.getDirectReferrals('nonexistent');
      }).toThrow('User nonexistent does not exist in the network');
    });
  });

  describe('totalReferrals (Part 2)', () => {
    test('should return 0 for user with no referrals', () => {
      network.addUser('user1');
      
      const total = network.totalReferrals('user1');
      expect(total).toBe(0);
    });

    test('should count direct referrals only', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');

      const total = network.totalReferrals('user1');
      expect(total).toBe(2);
    });

    test('should count indirect referrals', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      network.addUser('user4');
      
      // Create chain: user1 -> user2 -> user3 -> user4
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');
      network.addReferral('user3', 'user4');

      const total = network.totalReferrals('user1');
      expect(total).toBe(3); // user2, user3, user4
    });

    test('should throw error for non-existent user', () => {
      expect(() => {
        network.totalReferrals('nonexistent');
      }).toThrow('User nonexistent does not exist in the network');
    });

    test('should handle complex network with multiple branches', () => {
      // Create network: user1 -> user2 -> user4
      //                    -> user3 -> user5
      //                              -> user6
      const users = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6'];
      users.forEach(user => network.addUser(user));
      
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');
      network.addReferral('user2', 'user4');
      network.addReferral('user3', 'user5');
      network.addReferral('user3', 'user6');

      expect(network.totalReferrals('user1')).toBe(5);
      expect(network.totalReferrals('user2')).toBe(1);
      expect(network.totalReferrals('user3')).toBe(2);
      expect(network.totalReferrals('user4')).toBe(0);
    });
  });

  describe('topKReferrers (Part 2)', () => {
    test('should return empty array for k <= 0', () => {
      network.addUser('user1');
      
      expect(network.topKReferrers(0)).toEqual([]);
      expect(network.topKReferrers(-1)).toEqual([]);
    });

    test('should return all users when k > number of users', () => {
      network.addUser('user1');
      network.addUser('user2');
      
      const result = network.topKReferrers(5);
      expect(result.length).toBe(2);
      expect(result[0].userId).toBeDefined();
      expect(result[1].userId).toBeDefined();
    });

    test('should rank users by total referrals', () => {
      // Create network: user1 -> user2 -> user4
      //                    -> user3 -> user5
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      users.forEach(user => network.addUser(user));
      
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');
      network.addReferral('user2', 'user4');
      network.addReferral('user3', 'user5');

      const result = network.topKReferrers(3);
      expect(result[0].userId).toBe('user1');
      expect(result[0].totalReferrals).toBe(4);
      expect(result[1].userId).toBe('user2');
      expect(result[1].totalReferrals).toBe(1);
      expect(result[2].userId).toBe('user3');
      expect(result[2].totalReferrals).toBe(1);
    });

    test('should handle ties in referral counts', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      network.addUser('user4');
      
      // user1 refers user2, user3 refers user4 - both should have equal total referrals
      network.addReferral('user1', 'user2');
      network.addReferral('user3', 'user4');

      const result = network.topKReferrers(4);
      // user1 and user3 should have 1 total referral each, user2 and user4 should have 0
      const user1Result = result.find(r => r.userId === 'user1');
      const user3Result = result.find(r => r.userId === 'user3');
      const user2Result = result.find(r => r.userId === 'user2');
      const user4Result = result.find(r => r.userId === 'user4');
      
      expect(user1Result.totalReferrals).toBe(1);
      expect(user3Result.totalReferrals).toBe(1);
      expect(user2Result.totalReferrals).toBe(0);
      expect(user4Result.totalReferrals).toBe(0);
    });
  });

  describe('uniqueReachExpansion (Part 3)', () => {
    test('should return empty array for empty network', () => {
      const result = network.uniqueReachExpansion();
      expect(result).toEqual([]);
    });

    test('should return single user for single user network', () => {
      network.addUser('user1');
      
      const result = network.uniqueReachExpansion();
      expect(result).toEqual(['user1']);
    });

    test('should select users with largest reach first', () => {
      // Create network: user1 -> user2 -> user4
      //                    -> user3 -> user5
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      users.forEach(user => network.addUser(user));
      
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');
      network.addReferral('user2', 'user4');
      network.addReferral('user3', 'user5');

      const result = network.uniqueReachExpansion();
      // user1 should be selected first as it has the largest reach
      expect(result[0]).toBe('user1');
      expect(result.length).toBe(5);
    });

    test('should maximize unique coverage', () => {
      // Create two separate branches with some overlap
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      users.forEach(user => network.addUser(user));
      
      // user1 -> user2 -> user4
      // user3 -> user2 -> user5 (overlap at user2)
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user4');
      network.addReferral('user3', 'user2');
      network.addReferral('user2', 'user5');

      const result = network.uniqueReachExpansion();
      // Should select users that maximize unique coverage
      expect(result.length).toBe(5);
    });
  });

  describe('flowCentrality (Part 3)', () => {
    test('should return empty array for empty network', () => {
      const result = network.flowCentrality();
      expect(result).toEqual([]);
    });

    test('should return empty array for single user network', () => {
      network.addUser('user1');
      
      const result = network.flowCentrality();
      expect(result).toEqual([]);
    });

    test('should identify central nodes in chain network', () => {
      // Create chain: user1 -> user2 -> user3
      const users = ['user1', 'user2', 'user3'];
      users.forEach(user => network.addUser(user));
      
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');

      const result = network.flowCentrality();
      // user2 should have highest centrality as it's on the path between user1 and user3
      expect(result.length).toBeGreaterThan(0);
      
      const user2Result = result.find(r => r.userId === 'user2');
      const user1Result = result.find(r => r.userId === 'user1');
      const user3Result = result.find(r => r.userId === 'user3');
      
      expect(user2Result.centralityScore).toBeGreaterThanOrEqual(user1Result.centralityScore);
      expect(user2Result.centralityScore).toBeGreaterThanOrEqual(user3Result.centralityScore);
    });

    test('should handle complex network structure', () => {
      // Create network with multiple paths
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      users.forEach(user => network.addUser(user));
      
      // user1 -> user2 -> user4
      // user1 -> user3 -> user4
      // user2 -> user5
      network.addReferral('user1', 'user2');
      network.addReferral('user1', 'user3');
      network.addReferral('user2', 'user4');
      network.addReferral('user3', 'user4');
      network.addReferral('user2', 'user5');

      const result = network.flowCentrality();
      expect(result.length).toBeGreaterThan(0);
      
      // All users should have centrality scores
      result.forEach(r => {
        expect(r.centralityScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('wouldCreateCycle', () => {
    beforeEach(() => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');
      network.addUser('user4');
    });

    test('should detect simple cycles', () => {
      // Create chain: user1 -> user2 -> user3
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');

      // Check if user3 -> user1 would create a cycle
      const wouldCreateCycle = network.wouldCreateCycle('user3', 'user1');
      expect(wouldCreateCycle).toBe(true);
    });

    test('should detect complex cycles', () => {
      // Create network: user1 -> user2 -> user3 -> user4
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');
      network.addReferral('user3', 'user4');

      // Check if user4 -> user2 would create a cycle
      const wouldCreateCycle = network.wouldCreateCycle('user4', 'user2');
      expect(wouldCreateCycle).toBe(true);
    });

    test('should not detect cycles when none would be created', () => {
      // Create chain: user1 -> user2 -> user3
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');

      // Check if user1 -> user4 would create a cycle (it wouldn't)
      const wouldCreateCycle = network.wouldCreateCycle('user1', 'user4');
      expect(wouldCreateCycle).toBe(false);
    });

    test('should handle disconnected components', () => {
      // Create two separate chains: user1 -> user2 and user3 -> user4
      network.addReferral('user1', 'user2');
      network.addReferral('user3', 'user4');

      // Connecting them shouldn't create a cycle
      const wouldCreateCycle = network.wouldCreateCycle('user2', 'user3');
      expect(wouldCreateCycle).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle empty network', () => {
      expect(network.users.size).toBe(0);
      expect(network.graph.size).toBe(0);
      expect(network.directReferrals.size).toBe(0);
      expect(network.referrerOf.size).toBe(0);
    });

    test('should handle single user network', () => {
      network.addUser('user1');
      
      expect(network.users.size).toBe(1);
      expect(network.users.has('user1')).toBe(true);
      expect(network.getDirectReferrals('user1')).toEqual([]);
    });

    test('should handle disconnected users', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');

      // No referrals between users
      expect(network.getDirectReferrals('user1')).toEqual([]);
      expect(network.getDirectReferrals('user2')).toEqual([]);
      expect(network.getDirectReferrals('user3')).toEqual([]);
    });

    test('should maintain data consistency after failed referrals', () => {
      network.addUser('user1');
      network.addUser('user2');
      network.addUser('user3');

      // Try to add a referral that would create a cycle
      network.addReferral('user1', 'user2');
      network.addReferral('user2', 'user3');
      
      const failedResult = network.addReferral('user3', 'user1');
      expect(failedResult).toBe(false);

      // Verify the network state is still consistent
      expect(network.getDirectReferrals('user1')).toContain('user2');
      expect(network.getDirectReferrals('user2')).toContain('user3');
      expect(network.getDirectReferrals('user3')).toEqual([]);
      expect(network.referrerOf.get('user1')).toBeUndefined();
    });
  });
});
