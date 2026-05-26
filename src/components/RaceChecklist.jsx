import { useMemo, useState, useCallback } from 'react'
import FilterBar, { DISTANCE_RANGES } from './FilterBar'
import TrophyGrid from './TrophyGrid'
import { useProgress } from '../hooks/useProgress'
import { groupByName } from '../utils/groupRaces'

const GRADE_COLORS = {
  G1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  G2: 'bg-purple-100 text-purple-800 border-purple-200',
  G3: 'bg-blue-100 text-blue-800 border-blue-200',
}

const YEAR_LABEL = { 1: 'Y1', 2: 'Y2', 3: 'Y3' }
const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function allDates(group) {
  const seen = new Map()
  for (const r of group) {
    for (const d of r.dates ?? []) {
      const key = `${d.year}-${d.month}-${d.half}`
      if (!seen.has(key)) seen.set(key, d)
    }
  }
  return [...seen.values()].sort((a, b) => a.year - b.year || a.month - b.month || a.half - b.half)
}

function timingSort(group) {
  const dates = allDates(group)
  if (!dates.length) return Infinity
  const d = dates[0]
  return d.year * 10000 + d.month * 100 + d.half
}

function distanceBucket(distance) {
  return DISTANCE_RANGES.find(r => distance >= r.min && distance <= r.max)?.label
}

function RaceItem({ group, done, onToggle }) {
  const primary = group[0]
  const dates = allDates(group)
  const sameDirection = group.every(r => r.direction === primary.direction)
  return (
    <label className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${done ? 'bg-green-50' : 'bg-white hover:bg-gray-50'} border border-gray-100`}>
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(group, done)}
        className="w-4 h-4 rounded accent-pink-500 cursor-pointer flex-shrink-0"
      />
      <span className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {primary.name}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {dates.length > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">
            {dates.map(d => `Y${d.year} ${MONTH_ABBR[d.month]} ${d.half}`).join(', ')}
          </span>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${GRADE_COLORS[primary.grade]}`}>
          {primary.grade}
        </span>
        <span className="text-xs text-gray-500">{primary.terrain}</span>
        <span className="text-xs text-gray-400">{distanceBucket(primary.distance)}</span>
        {sameDirection && <span className="text-xs text-gray-400">{primary.direction}</span>}
      </div>
    </label>
  )
}

export default function RaceChecklist({ uma, races }) {
  const { completed, toggle, reset } = useProgress(uma.id)

  const [viewMode, setViewMode] = useState('list')

  const [filters, setFilters] = useState({
    grades: new Set(['G1', 'G2', 'G3']),
    terrains: new Set(['Turf', 'Dirt']),
    distances: new Set(['Sprint', 'Mile', 'Medium', 'Long']),
  })

  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false)

  // Deduplicated totals for the header
  const allGroups = useMemo(() => groupByName(races), [races])
  const totalAll = allGroups.length
  const completedAll = allGroups.filter(g => g.some(r => completed.has(r.id))).length

  const filtered = useMemo(() => {
    return races.filter(r => {
      if (!filters.grades.has(r.grade)) return false
      if (!filters.terrains.has(r.terrain)) return false
      const bucket = distanceBucket(r.distance)
      if (!filters.distances.has(bucket)) return false
      return true
    })
  }, [races, filters])

  const filteredGroups = useMemo(() => {
    let groups = groupByName(filtered)
    if (showOnlyIncomplete) groups = groups.filter(g => !g.some(r => completed.has(r.id)))
    return [...groups].sort((a, b) => timingSort(a) - timingSort(b))
  }, [filtered, completed, showOnlyIncomplete])

  const totalFiltered = filteredGroups.length
  const completedFiltered = filteredGroups.filter(g => g.some(r => completed.has(r.id))).length

  const toggleGroup = useCallback((group, isDone) => {
    if (isDone) {
      group.forEach(r => { if (completed.has(r.id)) toggle(r.id) })
    } else {
      toggle(group[0].id)
    }
  }, [completed, toggle])

  const confirmReset = () => {
    if (window.confirm(`Reset all progress for ${uma.name}?`)) reset()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{uma.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {completedAll} / {totalAll} trophies completed overall
          </p>
        </div>
        <button
          onClick={confirmReset}
          className="text-xs text-red-400 hover:text-red-600 underline cursor-pointer"
        >
          Reset progress
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-pink-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: totalAll ? `${(completedAll / totalAll) * 100}%` : '0%' }}
        />
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 self-start">
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          List
        </button>
        <button
          onClick={() => setViewMode('trophy')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${viewMode === 'trophy' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🏆 Trophy
        </button>
      </div>

      {viewMode === 'trophy' ? (
        <TrophyGrid races={races} completed={completed} toggle={toggle} />
      ) : (
        <>
          {/* Filters */}
          <FilterBar filters={filters} onChange={setFilters} />

          {/* Incomplete toggle + filtered count */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyIncomplete}
                onChange={e => setShowOnlyIncomplete(e.target.checked)}
                className="rounded accent-pink-500"
              />
              Show incomplete only
            </label>
            <span className="text-sm text-gray-400">
              {completedFiltered} / {totalFiltered} shown
            </span>
          </div>

          {/* Race list */}
          <div className="flex flex-col gap-1.5">
            {filteredGroups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No races match the current filters.</p>
            ) : (
              filteredGroups.map((group, i) => (
                <RaceItem
                  key={`${group[0].id}-${i}`}
                  group={group}
                  done={group.some(r => completed.has(r.id))}
                  onToggle={toggleGroup}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
