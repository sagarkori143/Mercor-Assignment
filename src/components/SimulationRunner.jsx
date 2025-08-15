import React, { useContext, useMemo, useState } from 'react'
import { AppContext } from '../App.jsx'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function SimulationRunner() {
  const { simulation } = useContext(AppContext)
  const [p, setP] = useState(0.1)
  const [days, setDays] = useState(30)
  const [series, setSeries] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const onRun = async () => {
    try {
      setIsRunning(true)
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const data = simulation.simulate(Number(p), Number(days))
      setSeries(data)
    } catch (e) {
      alert(e.message)
    } finally {
      setIsRunning(false)
    }
  }

  const chartData = useMemo(() => ({
    labels: series.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Cumulative Expected Referrals',
        data: series,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  }), [series])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: '600'
          }
        }
      },
      title: { 
        display: true, 
        text: 'Network Growth Simulation',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => `Day ${context[0].dataIndex + 1}`,
          label: (context) => `Referrals: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Days',
          font: { weight: '600' }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Cumulative Referrals',
          font: { weight: '600' }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          callback: (value) => value.toLocaleString()
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  const simulationStats = useMemo(() => {
    if (series.length === 0) return null
    
    const finalReferrals = series[series.length - 1]
    const avgDailyGrowth = series.length > 1 ? (finalReferrals - series[0]) / (series.length - 1) : 0
    const maxDailyGrowth = series.length > 1 ? Math.max(...series.slice(1).map((val, i) => val - series[i])) : 0
    
    return {
      finalReferrals,
      avgDailyGrowth: avgDailyGrowth.toFixed(1),
      maxDailyGrowth,
      totalGrowth: finalReferrals - series[0]
    }
  }, [series])

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <div className="card">
        <h2 className="section-title">Simulation Runner</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="label">Adoption Probability (p)</label>
            <input 
              className="input" 
              type="number" 
              min="0" 
              max="1" 
              step="0.01" 
              value={p} 
              onChange={e => setP(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Probability of successful referral per day (0-1)</p>
          </div>
          <div>
            <label className="label">Simulation Days</label>
            <input 
              className="input" 
              type="number" 
              min="1" 
              max="365" 
              step="1" 
              value={days} 
              onChange={e => setDays(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Number of days to simulate (1-365)</p>
          </div>
          <div className="flex items-end">
            <button 
              className="button w-full" 
              onClick={onRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run Simulation
                </>
              )}
            </button>
          </div>
          <div className="flex items-end">
            <button 
              className="button-secondary w-full"
              onClick={() => {
                setP(0.1)
                setDays(30)
                setSeries([])
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Statistics */}
      {simulationStats && (
        <div className="card slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-value">{simulationStats.finalReferrals.toLocaleString()}</div>
              <div className="metric-label">Final Referrals</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{simulationStats.avgDailyGrowth}</div>
              <div className="metric-label">Avg Daily Growth</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{simulationStats.maxDailyGrowth}</div>
              <div className="metric-label">Max Daily Growth</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{simulationStats.totalGrowth.toLocaleString()}</div>
              <div className="metric-label">Total Growth</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          {series.length > 0 ? (
            <div className="h-[500px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Simulation Data</h3>
                <p className="text-gray-600">Run a simulation to see the growth chart.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Model Assumptions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Initial active referrers: 100</li>
              <li>• Referral capacity per referrer: 10</li>
              <li>• Expected value calculation (not stochastic)</li>
              <li>• New referrers join from successful referrals</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Interpretation</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Higher p = faster network growth</li>
              <li>• Growth follows exponential pattern</li>
              <li>• Referrers become inactive after capacity</li>
              <li>• Results show cumulative expected values</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
