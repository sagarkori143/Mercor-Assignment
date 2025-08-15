# Mercor Challenge: Referral Network

A complete JavaScript implementation of a referral network system with influencer identification, network growth simulation, and bonus optimization capabilities.

## Language & Setup

This project is implemented in **JavaScript (Node.js LTS)**.

### Prerequisites
- Node.js LTS (v18 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mercor-challenge
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

## Running Tests

Execute all tests with a single command:
```bash
npm test
```

## Design Choices (Part 1)

### Data Structures
- **Map for Graph**: Used `Map` to store the referral graph as an adjacency list. This provides O(1) average case for adding edges and O(degree) for traversing neighbors.
- **Set for Users**: Used `Set` for storing users to ensure O(1) lookup and prevent duplicates.
- **Map for Direct Referrals**: Used `Map` with `Set` values for storing direct referrals to ensure O(1) lookup and prevent duplicates.
- **Map for Referrer Tracking**: Used `Map` to track who referred each user for constraint checking.

### API Design
- **Explicit User Creation**: `addUser()` must be called before adding referrals to ensure data integrity.
- **Constraint Validation**: All constraints (no cycles, no duplicate referrers, no self-referrals) are enforced at the API level.
- **Return Values**: Methods return meaningful data structures (arrays, objects) rather than just success/failure flags.
- **Error Handling**: Comprehensive error handling with descriptive error messages.

### Why These Choices?
- **Map Operations**: More efficient than plain objects for dynamic key-value operations.
- **Set Operations**: Efficient for checking reachability and preventing cycles.
- **Explicit Validation**: Prevents invalid states and provides clear error messages.
- **ES6+ Features**: Leverages modern JavaScript features for better performance and readability.

## Metric Comparison (Part 3)

### 1. Total Reach (totalReferrals)
- **Definition**: Total count of direct + indirect referrals for a user using BFS traversal
- **Business Use Case**: **Sales Performance Tracking** - Identify top performers for recognition and compensation. Useful for understanding individual contribution to network growth and setting performance benchmarks.

### 2. Unique Reach Expansion (uniqueReachExpansion)
- **Definition**: Greedy selection algorithm maximizing coverage of unique candidates by precomputing downstream reach sets
- **Business Use Case**: **Marketing Campaign Targeting** - Select influencers who can reach the most unique potential customers. Optimal for maximizing campaign reach with limited budget and avoiding redundant coverage.

### 3. Flow Centrality (flowCentrality)
- **Definition**: Count of times a user lies on shortest paths between other users, calculated using BFS from each node
- **Business Use Case**: **Network Infrastructure Planning** - Identify critical nodes whose removal would most disrupt information flow. Essential for understanding network resilience, identifying key connectors, and planning redundancy strategies.

### Comparison Summary
- **Total Reach**: Best for individual performance metrics and compensation planning
- **Unique Reach**: Best for maximizing coverage with limited resources and avoiding overlap
- **Flow Centrality**: Best for understanding network structure, critical nodes, and infrastructure planning

## Time Complexity Analysis (Part 5)

### minBonusForTarget() Complexity

**Overall Time Complexity**: O(log(B/ε) × T × D × N)

Where:
- B = maximum bonus range (10,000)
- ε = precision (default $10)
- T = target hires
- D = days to simulate
- N = initial active referrers (100)

**Breakdown**:
1. **Binary Search**: O(log(B/ε)) iterations
2. **Per Iteration**: O(T × D × N) for simulation
   - T: target hires to check
   - D: days to simulate
   - N: initial active referrers

**Space Complexity**: O(D × N) for storing simulation state

**Optimization Notes**:
- Binary search reduces complexity from O(B/ε) to O(log(B/ε))
- Early termination when target is reached
- Conservative upper bound prevents excessive iterations
- Verification step ensures result accuracy

## Project Structure

```
mercor-challenge/
├── README.md
├── .gitignore
├── package.json
├── source/
│   ├── ReferralNetwork.js
│   └── Simulation.js
└── tests/
    ├── referralNetwork.test.js
    └── simulation.test.js
```

## Usage Examples

### Basic Referral Network
```javascript
import ReferralNetwork from './source/ReferralNetwork.js';

const network = new ReferralNetwork();
network.addUser('user1');
network.addUser('user2');
network.addReferral('user1', 'user2');
console.log(network.getDirectReferrals('user1')); // ['user2']
```

### Network Analysis
```javascript
// Get total referrals for a user
const totalRefs = network.totalReferrals('user1');

// Get top 10 referrers
const topReferrers = network.topKReferrers(10);

// Get influencers using different metrics
const uniqueReach = network.uniqueReachExpansion();
const flowCentrality = network.flowCentrality();
```

### Network Growth Simulation
```javascript
import Simulation from './source/Simulation.js';

const sim = new Simulation();
const result = sim.simulate(0.1, 30);
const daysNeeded = sim.daysToTarget(0.1, 1000);
```

### Bonus Optimization
```javascript
const adoptionProb = (bonus) => Math.min(0.9, bonus / 1000);
const minBonus = sim.minBonusForTarget(30, 500, adoptionProb);
```

## Testing

The test suite covers:
- All constraint validations (no cycles, no duplicate referrers, no self-referrals)
- Edge cases (empty graph, single user, disconnected users)
- Correctness of BFS reach calculations
- Influencer metrics with small known graphs
- Simulation edge cases (p=0, p=1, minimal days)
- Bonus optimization scenarios

Run tests with: `npm test`

## Features

### Part 1: Referral Graph
- ✅ User management with `addUser()`
- ✅ Referral relationships with `addReferral()`
- ✅ Direct referral retrieval with `getDirectReferrals()`
- ✅ Constraint enforcement (no self-referrals, no duplicate referrers, no cycles)

### Part 2: Full Network Reach
- ✅ Total referrals calculation with `totalReferrals()`
- ✅ Top k referrers ranking with `topKReferrers()`

### Part 3: Identify Influencers
- ✅ Unique Reach Expansion algorithm
- ✅ Flow Centrality algorithm

### Part 4: Network Growth Simulation
- ✅ Network growth simulation with `simulate()`
- ✅ Days to target calculation with `daysToTarget()`

### Part 5: Referral Bonus Optimization
- ✅ Minimum bonus calculation with `minBonusForTarget()`
- ✅ Binary search optimization
- ✅ Custom precision support

