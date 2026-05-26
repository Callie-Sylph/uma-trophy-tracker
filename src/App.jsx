import { useState, useEffect } from 'react'
import umas from './data/characters.json'
import allRaces from './data/races.json'
import trophyOrder from './data/trophy-order.json'
import UmaSelector from './components/UmaSelector'
import RaceChecklist from './components/RaceChecklist'

// Keep only races that correspond to a known trophy slot (by name match within grade)
function canonicalRaces(races) {
  const knownNames = new Set()
  for (const [grade, ids] of Object.entries(trophyOrder)) {
    const idSet = new Set(ids)
    for (const r of races) {
      if (r.grade === grade && idSet.has(r.id)) knownNames.add(r.name)
    }
  }
  return races.filter(r => knownNames.has(r.name))
}

const races = canonicalRaces(allRaces)

function getUmasWithData(umas) {
  return new Set(
    umas
      .filter(u => {
        try {
          const raw = localStorage.getItem(`uma_progress_${u.id}`)
          return raw && JSON.parse(raw).length > 0
        } catch { return false }
      })
      .map(u => u.id)
  )
}

export default function App() {
  const [selectedUmaId, setSelectedUmaId] = useState(null)
  const [umasWithData, setUmasWithData] = useState(() => getUmasWithData(umas))

  // Refresh when returning to the selector so newly-tracked umas appear
  useEffect(() => {
    if (selectedUmaId === null) setUmasWithData(getUmasWithData(umas))
  }, [selectedUmaId])

  const selectedUma = umas.find(u => u.id === selectedUmaId) ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Uma Trophy Checklist</h1>
            <p className="text-xs text-gray-400">Track G1/G2/G3 race wins per Uma — Global</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Uma Selector */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Uma</h2>
          <UmaSelector
            umas={umas}
            selectedId={selectedUmaId}
            umasWithData={umasWithData}
            onSelect={(id) => setSelectedUmaId(prev => prev === id ? null : id)}
          />
        </section>

        {/* Checklist */}
        {selectedUma ? (
          <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <RaceChecklist key={selectedUma.id} uma={selectedUma} races={races} />
          </section>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🐎</p>
            <p className="text-sm">Select an Uma above to view their race checklist.</p>
          </div>
        )}
      </main>
    </div>
  )
}
