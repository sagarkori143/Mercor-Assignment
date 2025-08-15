import React, { useContext, useState } from 'react'
import { AppContext } from '../App.jsx'

export default function BonusOptimizer() {
  const { simulation } = useContext(AppContext)
  const [days, setDays] = useState(30)
  const [target, setTarget] = useState(100)
  const [bonus, setBonus] = useState(null)
  const [eps, setEps] = useState(10)
  const [isComputing, setIsComputing] = useState(false)

  // Example adoption probability; users can tweak the inline function
  const [formula, setFormula] = useState('Math.min(0.9, bonus / 1000)')

  const onCompute = async () => {
    try {
      setIsComputing(true)
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Danger: eval is just for local playground convenience. In production, avoid eval.
      // eslint-disable-next-line no-new-func
      const fn = new Function('bonus', `return ${formula}`)
      const res = simulation.minBonusForTarget(Number(days), Number(target), fn, Number(eps))
      setBonus(res)
    } catch (e) {
      alert('Invalid adoption probability function. Use a JS expression with variable `bonus`.')
    } finally {
      setIsComputing(false)
    }
  }

  const presetFormulas = [
    { name: 'Linear', formula: 'Math.min(0.9, bonus / 1000)', description: 'Linear increase up to 90%' },
    { name: 'Logarithmic', formula: 'Math.min(0.9, Math.log(bonus + 1) / 10)', description: 'Logarithmic growth' },
    { name: 'Square Root', formula: 'Math.min(0.9, Math.sqrt(bonus) / 50)', description: 'Square root scaling' },
    { name: 'Exponential', formula: 'Math.min(0.9, 1 - Math.exp(-bonus / 500))', description: 'Exponential approach' }
  ]

  return (
    <div className="space-y-6">
      {/* Main Form */}
      <div className="card">
        <h2 className="section-title">Bonus Optimizer</h2>
        <p className="text-gray-600 mb-6">Find the minimum bonus required to achieve your hiring target within the specified timeframe.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="label">Target Days</label>
            <input 
              className="input" 
              type="number" 
              min="1" 
              max="365" 
              value={days} 
              onChange={e => setDays(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Timeframe to achieve target</p>
          </div>
          <div>
            <label className="label">Target Hires</label>
            <input 
              className="input" 
              type="number" 
              min="1" 
              value={target} 
              onChange={e => setTarget(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Number of hires needed</p>
          </div>
          <div>
            <label className="label">Precision ($)</label>
            <input 
              className="input" 
              type="number" 
              min="1" 
              max="100" 
              value={eps} 
              onChange={e => setEps(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-1">Search precision in dollars</p>
          </div>
          <div className="flex items-end">
            <button 
              className="button w-full" 
              onClick={onCompute}
              disabled={isComputing}
            >
              {isComputing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Computing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Compute Minimum Bonus
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Display */}
        {bonus !== null && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 slide-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900">Minimum Bonus Required</h3>
                <p className="text-3xl font-bold text-green-700">${bonus.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  To achieve {target} hires in {days} days with precision ±${eps}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adoption Probability Function */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Probability Function</h3>
        
        <div className="mb-6">
          <label className="label">Custom Function</label>
          <input 
            className="input font-mono text-sm" 
            value={formula} 
            onChange={e => setFormula(e.target.value)}
            placeholder="Math.min(0.9, bonus / 1000)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a JavaScript expression using variable <code className="bg-gray-100 px-1 rounded">bonus</code>. 
            Function should return a value between 0 and 1.
          </p>
        </div>

        {/* Preset Formulas */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Preset Functions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {presetFormulas.map((preset, index) => (
              <button
                key={index}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                onClick={() => setFormula(preset.formula)}
              >
                <div className="font-semibold text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-600 mt-1">{preset.description}</div>
                <div className="text-xs text-gray-500 mt-2 font-mono">{preset.formula}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Algorithm</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Binary search over bonus values</li>
              <li>• Tests each bonus with simulation</li>
              <li>• Finds minimum bonus that works</li>
              <li>• Precision controlled by eps parameter</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Usage Tips</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Start with preset functions</li>
              <li>• Higher precision = slower computation</li>
              <li>• Function must return 0-1 probability</li>
              <li>• Test with small targets first</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Results */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Scenarios</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Target Hires</th>
                <th className="th">Days</th>
                <th className="th">Function</th>
                <th className="th">Min Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="td">50</td>
                <td className="td">30</td>
                <td className="td font-mono text-sm">bonus / 1000</td>
                <td className="td font-semibold text-green-600">~$500</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="td">100</td>
                <td className="td">60</td>
                <td className="td font-mono text-sm">Math.sqrt(bonus) / 50</td>
                <td className="td font-semibold text-green-600">~$2,500</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="td">200</td>
                <td className="td">90</td>
                <td className="td font-mono text-sm">1 - exp(-bonus/500)</td>
                <td className="td font-semibold text-green-600">~$1,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">* Example values - actual results depend on network parameters</p>
      </div>
    </div>
  )
}
