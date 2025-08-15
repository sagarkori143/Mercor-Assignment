import React, { useContext, useMemo, useState } from 'react'
import { AppContext } from '../App.jsx'

function SortHeader({ label, sortKey, current, onSort }) {
  const active = current.key === sortKey
  const dir = active ? (current.dir === 'asc' ? '↑' : '↓') : ''
  return (
    <th className="th" onClick={() => onSort(sortKey)}>
      <div className="flex items-center gap-2">
        {label}
        <span className="text-primary-600">{dir}</span>
      </div>
    </th>
  )
}

export default function InfluencerRankings() {
  const { network } = useContext(AppContext)
  const [ranking, setRanking] = useState([])
  const [sort, setSort] = useState({ key: 'userId', dir: 'asc' })
  const [activeMetric, setActiveMetric] = useState('')

  const users = useMemo(() => Array.from(network.users), [network])

  const computeReach = () => {
    const rows = users.map(u => ({ userId: u, score: network.totalReferrals(u) }))
    setRanking(rows)
    setActiveMetric('reach')
  }

  const computeUniqueReach = () => {
    const order = network.uniqueReachExpansion()
    // highest priority first; map to scores inversely
    const rows = order.map((u, idx) => ({ userId: u, score: order.length - idx }))
    setRanking(rows)
    setActiveMetric('unique')
  }

  const computeFlowCentrality = () => {
    const list = network.flowCentrality()
    const rows = list.map(x => ({ userId: x.userId, score: x.centralityScore }))
    setRanking(rows)
    setActiveMetric('flow')
  }

  const onSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const sorted = useMemo(() => {
    const arr = [...ranking]
    arr.sort((a, b) => {
      const vA = a[sort.key]
      const vB = b[sort.key]
      if (vA === vB) return 0
      if (sort.dir === 'asc') return vA > vB ? 1 : -1
      return vA < vB ? 1 : -1
    })
    return arr
  }, [ranking, sort])

  const maxScore = Math.max(...sorted.map(r => r.score), 1)

  const getMetricInfo = () => {
    switch (activeMetric) {
      case 'reach':
        return {
          title: 'Total Reach Analysis',
          description: 'Shows the total number of users each person can reach through direct and indirect referrals.',
          color: 'blue'
        }
      case 'unique':
        return {
          title: 'Unique Reach Expansion',
          description: 'Greedy selection algorithm that maximizes coverage of unique candidates.',
          color: 'green'
        }
      case 'flow':
        return {
          title: 'Flow Centrality',
          description: 'Measures how often a user lies on shortest paths between other users.',
          color: 'purple'
        }
      default:
        return { title: '', description: '', color: 'gray' }
    }
  }

  const metricInfo = getMetricInfo()

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <div className="card">
        <h2 className="section-title">Influencer Rankings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className={`button ${activeMetric === 'reach' ? '!bg-blue-600' : 'button-secondary'}`}
            onClick={computeReach}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Compute Reach
          </button>
          <button 
            className={`button ${activeMetric === 'unique' ? '!bg-green-600' : 'button-secondary'}`}
            onClick={computeUniqueReach}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Unique Reach Expansion
          </button>
          <button 
            className={`button ${activeMetric === 'flow' ? '!bg-purple-600' : 'button-secondary'}`}
            onClick={computeFlowCentrality}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Flow Centrality
          </button>
        </div>
      </div>

      {/* Metric Information */}
      {activeMetric && (
        <div className="card slide-in">
          <div className="flex items-start gap-4">
            <div className={`w-3 h-12 bg-${metricInfo.color}-500 rounded-full`}></div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{metricInfo.title}</h3>
              <p className="text-gray-600">{metricInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {sorted.length > 0 && (
        <div className="card slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Results</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <SortHeader label="Rank" sortKey="score" current={sort} onSort={onSort} />
                  <SortHeader label="User ID" sortKey="userId" current={sort} onSort={onSort} />
                  <SortHeader label="Score" sortKey="score" current={sort} onSort={onSort} />
                  <th className="th">Relative Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((row, index) => (
                  <tr key={row.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="td">
                      <span className="font-semibold text-primary-600">{row.userId}</span>
                    </td>
                    <td className="td">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        activeMetric === 'reach' ? 'bg-blue-100 text-blue-800' :
                        activeMetric === 'unique' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {row.score}
                      </span>
                    </td>
                    <td className="td">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            activeMetric === 'reach' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            activeMetric === 'unique' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                          style={{ width: `${(row.score / maxScore) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {((row.score / maxScore) * 100).toFixed(1)}% of max
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="card">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-600 mb-4">Select a metric above to compute influencer rankings for your network.</p>
          </div>
        </div>
      )}

      {/* Algorithm Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Total Reach</h4>
            <p className="text-sm text-blue-700">Uses BFS traversal to count all direct and indirect referrals for each user.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Unique Reach Expansion</h4>
            <p className="text-sm text-green-700">Greedy selection algorithm that maximizes coverage of unique candidates.</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Flow Centrality</h4>
            <p className="text-sm text-purple-700">Counts how often a user lies on shortest paths between other users.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
