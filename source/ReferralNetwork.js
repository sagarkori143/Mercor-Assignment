/**
 * ReferralNetwork - A class to manage referral relationships between users
 * 
 * This class enforces the following constraints:
 * - No self-referrals
 * - A candidate can only be referred by one referrer
 * - The graph remains acyclic (no cycles allowed)
 */
export default class ReferralNetwork {
  constructor() {
    // Adjacency list representation of the referral graph
    // graph[userId] = array of users directly referred by userId
    this.graph = new Map();
    
    // Set of all users in the network for O(1) lookup
    this.users = new Set();
    
    // Track direct referrals for O(1) lookup
    // directReferrals[userId] = Set of users directly referred by userId
    this.directReferrals = new Map();
    
    // Track who referred each user (for constraint checking)
    // referrerOf[candidateId] = referrerId
    this.referrerOf = new Map();
  }

  /**
   * Add a user to the network
   * @param {string} userId - Unique identifier for the user
   */
  addUser(userId) {
    this.users.add(userId);
    
    // Initialize empty sets/maps for the new user
    if (!this.graph.has(userId)) {
      this.graph.set(userId, []);
    }
    if (!this.directReferrals.has(userId)) {
      this.directReferrals.set(userId, new Set());
    }
  }

  /**
   * Add a referral relationship between two users
   * 
   * Enforces constraints:
   * - No self-referrals
   * - A candidate can only be referred by one referrer
   * - Graph remains acyclic
   * 
   * @param {string} referrerId - ID of the user making the referral
   * @param {string} candidateId - ID of the user being referred
   * @returns {boolean} - True if referral was added successfully, false otherwise
   * @throws {Error} - If either user doesn't exist in the network
   */
  addReferral(referrerId, candidateId) {
    // Validate that both users exist
    if (!this.users.has(referrerId)) {
      throw new Error(`Referrer ${referrerId} does not exist in the network`);
    }
    if (!this.users.has(candidateId)) {
      throw new Error(`Candidate ${candidateId} does not exist in the network`);
    }

    // Constraint 1: No self-referrals
    if (referrerId === candidateId) {
      return false;
    }

    // Constraint 2: A candidate can only be referred by one referrer
    if (this.referrerOf.has(candidateId)) {
      return false;
    }

    // Constraint 3: Check if adding this edge would create a cycle
    if (this.wouldCreateCycle(referrerId, candidateId)) {
      return false;
    }

    // Add the referral relationship
    this.graph.get(referrerId).push(candidateId);
    this.directReferrals.get(referrerId).add(candidateId);
    this.referrerOf.set(candidateId, referrerId);

    return true;
  }

  /**
   * Check if adding an edge from referrerId to candidateId would create a cycle
   * 
   * Uses DFS to detect cycles by checking if there's a path from candidateId back to referrerId
   * 
   * @param {string} referrerId - The referrer
   * @param {string} candidateId - The candidate
   * @returns {boolean} - True if adding the edge would create a cycle, false otherwise
   */
  wouldCreateCycle(referrerId, candidateId) {
    // If candidateId can reach referrerId, adding the edge would create a cycle
    const visited = new Set();

    const dfs = (node) => {
      // If we reach the referrer, we've found a cycle
      if (node === referrerId) {
        return true;
      }
      
      // If we've already visited this node, no cycle found from this path
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);

      // Check all neighbors of the current node
      const neighbors = this.graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }

      return false;
    };

    return dfs(candidateId);
  }

  /**
   * Get the list of users directly referred by the given user
   * 
   * @param {string} userId - ID of the user
   * @returns {string[]} - Array of user IDs directly referred by userId
   * @throws {Error} - If userId doesn't exist in the network
   */
  getDirectReferrals(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} does not exist in the network`);
    }

    // Return array of direct referrals (convert Set to Array)
    const directRefs = this.directReferrals.get(userId);
    return directRefs ? Array.from(directRefs) : [];
  }

  /**
   * Calculate the total number of direct and indirect referrals for a user
   * 
   * Uses BFS to traverse the entire subtree rooted at userId and count all reachable nodes
   * 
   * @param {string} userId - ID of the user
   * @returns {number} - Total count of direct + indirect referrals
   * @throws {Error} - If userId doesn't exist in the network
   */
  totalReferrals(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`User ${userId} does not exist in the network`);
    }

    // BFS to count all reachable nodes
    const queue = [userId];
    const visited = new Set([userId]);
    let count = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      
      // Get all direct referrals of the current user
      const neighbors = this.graph.get(current) || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Get the top k users ranked by total referral count
   * 
   * @param {number} k - Number of top referrers to return
   * @returns {Array<{userId: string, totalReferrals: number}>} - Array of objects with userId and totalReferrals, sorted in descending order
   * 
   * Note on choosing k:
   * - For leaderboards and recognition: k = 5-20 (manageable list for display)
   * - For performance analysis: k = 50-100 (broader analysis)
   * - For compensation planning: k = 10-25 (focus on top performers)
   * - For network analysis: k = 100+ (comprehensive view)
   * Choose based on your specific use case and the size of your network
   */
  topKReferrers(k) {
    if (k <= 0) {
      return [];
    }

    // Calculate total referrals for all users
    const userScores = [];
    for (const user of this.users) {
      const totalRefs = this.totalReferrals(user);
      userScores.push({
        userId: user,
        totalReferrals: totalRefs
      });
    }

    // Sort by total referrals (descending) and return top k
    userScores.sort((a, b) => b.totalReferrals - a.totalReferrals);
    return userScores.slice(0, k);
  }

  /**
   * Implement Unique Reach Expansion algorithm
   * 
   * Precomputes downstream reach sets for all users and uses greedy selection
   * to maximize coverage of unique candidates.
   * 
   * @returns {string[]} - Ranked list of selected users that maximize unique coverage
   */
  uniqueReachExpansion() {
    if (this.users.size === 0) {
      return [];
    }

    // Precompute downstream reach sets for all users
    const reachSets = new Map();
    for (const user of this.users) {
      reachSets.set(user, this.getReachSet(user));
    }

    // Greedy selection
    const selected = [];
    const covered = new Set();

    while (selected.length < this.users.size) {
      let bestUser = null;
      let bestCoverage = 0;

      for (const user of this.users) {
        if (selected.includes(user)) {
          continue;
        }

        // Calculate new coverage this user would add
        const userReach = reachSets.get(user);
        const newCoverage = new Set([...userReach].filter(x => !covered.has(x)));
        
        if (newCoverage.size > bestCoverage) {
          bestCoverage = newCoverage.size;
          bestUser = user;
        }
      }

      if (bestUser === null || bestCoverage === 0) {
        // Add remaining users even if they don't add new coverage
        for (const user of this.users) {
          if (!selected.includes(user)) {
            selected.push(user);
          }
        }
        break;
      }

      selected.push(bestUser);
      const bestUserReach = reachSets.get(bestUser);
      for (const user of bestUserReach) {
        covered.add(user);
      }
    }

    return selected;
  }

  /**
   * Get the set of all users reachable from userId (including userId itself)
   * 
   * @param {string} userId - ID of the user
   * @returns {Set<string>} - Set of all reachable user IDs
   */
  getReachSet(userId) {
    const reachable = new Set([userId]);
    const queue = [userId];

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = this.graph.get(current) || [];

      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return reachable;
  }

  /**
   * Implement Flow Centrality algorithm
   * 
   * Precomputes shortest paths between all user pairs using BFS from each node.
   * For each (s, t, v) checks if dist(s, v) + dist(v, t) === dist(s, t).
   * Counts how often v lies on shortest paths and ranks accordingly.
   * 
   * @returns {Array<{userId: string, centralityScore: number}>} - List of users ranked by centrality score
   */
  flowCentrality() {
    if (this.users.size <= 1) {
      return [];
    }

    // Precompute shortest paths from each node to all other nodes
    const shortestPaths = new Map();
    for (const source of this.users) {
      shortestPaths.set(source, this.bfsShortestPaths(source));
    }

    // Calculate flow centrality for each node
    const centrality = new Map();
    for (const user of this.users) {
      centrality.set(user, 0);
    }

    for (const s of this.users) {
      for (const t of this.users) {
        if (s === t) {
          continue;
        }

        // Get shortest path distance from s to t
        const sPaths = shortestPaths.get(s);
        if (sPaths.has(t)) {
          const distST = sPaths.get(t);

          // Check if each node v lies on a shortest path from s to t
          for (const v of this.users) {
            if (v === s || v === t) {
              continue;
            }

            // Check if v lies on shortest path from s to t
            const vPaths = shortestPaths.get(v);
            if (sPaths.has(v) && vPaths.has(t)) {
              const distSV = sPaths.get(v);
              const distVT = vPaths.get(t);
              
              if (distSV + distVT === distST) {
                centrality.set(v, centrality.get(v) + 1);
              }
            }
          }
        }
      }
    }

    // Convert to array and sort by centrality score
    const centralityList = [];
    for (const [user, score] of centrality) {
      centralityList.push({
        userId: user,
        centralityScore: score
      });
    }

    centralityList.sort((a, b) => b.centralityScore - a.centralityScore);
    return centralityList;
  }

  /**
   * Compute shortest path distances from source to all other nodes using BFS
   * 
   * @param {string} source - Source node
   * @returns {Map<string, number>} - Map from node to shortest path distance from source
   */
  bfsShortestPaths(source) {
    const distances = new Map();
    distances.set(source, 0);
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = this.graph.get(current) || [];

      for (const neighbor of neighbors) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, distances.get(current) + 1);
          queue.push(neighbor);
        }
      }
    }

    return distances;
  }
}
