import React, { useContext, useMemo, useRef, useState, useEffect } from 'react'
import { AppContext } from '../App.jsx'
import { DataSet, Network } from 'vis-network/standalone'

export default function ReferralManager() {
  const { network } = useContext(AppContext)
  const [referrerId, setReferrerId] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  // Build a snapshot of users and metrics for display
  const users = useMemo(() => Array.from(network.users), [network])
  const metrics = useMemo(() => {
    return users.map(u => ({
      userId: u,
      direct: network.getDirectReferrals(u).length,
      total: network.totalReferrals(u)
    }))
  }, [users, network])

  // Network statistics
  const networkStats = useMemo(() => {
    const totalReferrals = Array.from(network.directReferrals.values()).reduce((acc, set) => acc + set.size, 0)
    const avgDirectReferrals = users.length > 0 ? totalReferrals / users.length : 0
    const maxTotalReach = Math.max(...metrics.map(m => m.total), 0)
    
    return {
      totalUsers: users.length,
      totalReferrals,
      avgDirectReferrals: avgDirectReferrals.toFixed(1),
      maxTotalReach
    }
  }, [users, metrics, network])

  // vis-network graph rendering
  const containerRef = useRef(null)
  useEffect(() => {
    if (!containerRef.current) return

    const nodes = new DataSet(users.map(u => ({ 
      id: u, 
      label: u,
      color: {
        background: '#3b82f6',
        border: '#1d4ed8',
        highlight: { background: '#2563eb', border: '#1e40af' }
      },
      font: { color: '#ffffff', size: 16, face: 'Inter' },
      shape: 'circle',
      size: 30
    })))
    
    const edgesData = []
    users.forEach(u => {
      const children = network.getDirectReferrals(u)
      children.forEach(c => edgesData.push({ 
        from: u, 
        to: c, 
        arrows: 'to',
        color: { color: '#6b7280', width: 2 },
        smooth: { type: 'curvedCW', roundness: 0.2 }
      }))
    })
    const edges = new DataSet(edgesData)

    const networkGraph = new Network(containerRef.current, { nodes, edges }, {
      physics: { 
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4
        }
      },
      nodes: { 
        shape: 'circle',
        size: 30,
        borderWidth: 2,
        shadow: true
      },
      edges: { 
        color: '#6b7280',
        width: 2,
        shadow: true
      },
      interaction: {
        hover: true,
        tooltipDelay: 200
      },
      layout: {
        improvedLayout: true
      }
    })

    return () => networkGraph?.destroy()
  }, [users, network])

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const onAddUser = () => {
    if (!candidateId.trim()) {
      showMessage('Enter a userId to add.', 'error')
      return
    }
    if (network.users.has(candidateId.trim())) {
      showMessage('User already exists.', 'error')
      return
    }
    network.addUser(candidateId.trim())
    showMessage(`Added user ${candidateId.trim()}`, 'success')
    setCandidateId('')
  }

  const onAddReferral = () => {
    try {
      const ok = network.addReferral(referrerId.trim(), candidateId.trim())
      if (ok) {
        showMessage(`Added referral ${referrerId.trim()} → ${candidateId.trim()}`, 'success')
      } else {
        showMessage('Referral rejected (self-referral, duplicate referrer, or cycle detected).', 'error')
      }
      setReferrerId('')
      setCandidateId('')
    } catch (e) {
      showMessage(e.message, 'error')
    }
  }

  const getMessageClass = () => {
    switch (messageType) {
      case 'success': return 'success-message'
      case 'error': return 'error-message'
      default: return 'info-message'
    }
  }

  return (
    <div className="space-y-6">
      {/* Network Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value">{networkStats.totalUsers}</div>
          <div className="metric-label">Total Users</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{networkStats.totalReferrals}</div>
          <div className="metric-label">Total Referrals</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{networkStats.avgDirectReferrals}</div>
          <div className="metric-label">Avg Direct Referrals</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{networkStats.maxTotalReach}</div>
          <div className="metric-label">Max Total Reach</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Network Graph */}
          <div className="card">
            <h2 className="section-title">Network Graph</h2>
            <div className="graph-container">
              <div ref={containerRef} className="w-full h-[500px]" />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Interactive visualization of the referral network. Drag nodes to rearrange, hover for details.
            </p>
          </div>

          {/* Users Table */}
          <div className="card">
            <h2 className="section-title">User Metrics</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">User ID</th>
                    <th className="th">Direct Referrals</th>
                    <th className="th">Total Reach</th>
                    <th className="th">Network Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics.map(m => (
                    <tr key={m.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="td font-semibold text-primary-600">{m.userId}</td>
                      <td className="td">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {m.direct}
                        </span>
                      </td>
                      <td className="td">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {m.total}
                        </span>
                      </td>
                      <td className="td">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((m.total / Math.max(networkStats.maxTotalReach, 1)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Add User Form */}
          <div className="card">
            <h2 className="section-title">Add User</h2>
            <div className="space-y-4">
              <div>
                <label className="label">User ID</label>
                <input 
                  className="input" 
                  value={candidateId} 
                  onChange={e => setCandidateId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && onAddUser()}
                  placeholder="e.g., U123, John, etc." 
                />
              </div>
              <button className="button w-full" onClick={onAddUser}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
              </button>
            </div>
          </div>

          {/* Add Referral Form */}
          <div className="card">
            <h2 className="section-title">Add Referral</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Referrer ID</label>
                <input 
                  className="input" 
                  value={referrerId} 
                  onChange={e => setReferrerId(e.target.value)}
                  placeholder="Who is referring?" 
                />
              </div>
              <div>
                <label className="label">Candidate ID</label>
                <input 
                  className="input" 
                  value={candidateId} 
                  onChange={e => setCandidateId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && onAddReferral()}
                  placeholder="Who is being referred?" 
                />
              </div>
              <button className="button w-full" onClick={onAddReferral}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Add Referral
              </button>
            </div>
            
            {message && (
              <div className={`mt-4 ${getMessageClass()}`}>
                {message}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Constraints:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• No self-referrals allowed</li>
                <li>• Each candidate can have only one referrer</li>
                <li>• No cycles in the referral chain</li>
                <li>• Both users must exist in the network</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
