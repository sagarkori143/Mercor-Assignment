import React, { useMemo, useState, createContext } from 'react'
import ReferralManager from './components/ReferralManager.jsx'
import InfluencerRankings from './components/InfluencerRankings.jsx'
import SimulationRunner from './components/SimulationRunner.jsx'
import BonusOptimizer from './components/BonusOptimizer.jsx'

// Import the provided modules directly (ESM)
import ReferralNetwork from '../source/ReferralNetwork.js'
import Simulation from '../source/Simulation.js'

export const AppContext = createContext(null)

// Simple icon components
const NetworkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const SimulationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function App() {
  // Keep single instances in state so UI re-renders on changes
  const [network] = useState(() => new ReferralNetwork())
  const [simulation] = useState(() => new Simulation())
  const [activeTab, setActiveTab] = useState('referrals')

  // Preload a few users to play with
  useMemo(() => {
    const seedUsers = ['A', 'B', 'C', 'D', 'E']
    seedUsers.forEach(u => network.addUser(u))
    network.addReferral('A', 'B')
    network.addReferral('A', 'C')
    network.addReferral('B', 'D')
  }, [network])

  const ctxValue = useMemo(() => ({ network, simulation }), [network, simulation])

  const navItems = [
    { id: 'referrals', label: 'Referral Manager', icon: NetworkIcon },
    { id: 'influencers', label: 'Influencer Rankings', icon: ChartIcon },
    { id: 'simulation', label: 'Simulation Runner', icon: SimulationIcon },
    { id: 'bonus', label: 'Bonus Optimizer', icon: SettingsIcon }
  ]

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-10">
          <div className="container py-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                  <NetworkIcon />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Referral Network Playground
                  </h1>
                  <p className="text-gray-600 text-sm">Interactive network analysis and simulation</p>
                </div>
              </div>
              
              <nav className="flex gap-2 bg-gray-100 p-2 rounded-xl">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`nav-button ${activeTab === id ? 'active' : ''} flex items-center gap-2`}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <div className="fade-in">
            {activeTab === 'referrals' && <ReferralManager />} 
            {activeTab === 'influencers' && <InfluencerRankings />} 
            {activeTab === 'simulation' && <SimulationRunner />} 
            {activeTab === 'bonus' && <BonusOptimizer />} 
          </div>
        </main>

        
      </div>
    </AppContext.Provider>
  )
}
