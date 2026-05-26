import { useState, useMemo, useEffect } from 'react'
import trophyOrder from '../data/trophy-order.json'
import { groupByName } from '../utils/groupRaces'

const PAGE_SIZE = 15

const GRADE_COLORS = {
  G1: {
    active: 'bg-yellow-400 text-white border-yellow-400',
    inactive: 'bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50',
  },
  G2: {
    active: 'bg-purple-500 text-white border-purple-500',
    inactive: 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50',
  },
  G3: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50',
  },
}

function TrophyCard({ group, done, onToggle }) {
  const primary = group[0]
  const sameDirection = group.every(r => r.direction === primary.direction)

  return (
    <button
      onClick={() => onToggle(group, done)}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 w-full h-20 transition-all cursor-pointer text-center
        ${done ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-100 border-gray-200'}`}
    >
      <span className={`text-xl leading-none ${done ? '' : 'opacity-20 grayscale'}`}>🏆</span>
      <span className={`text-[10px] font-medium leading-tight ${done ? 'text-gray-800' : 'text-gray-300'}`}>
        {primary.name}
      </span>
      <span className={`text-[9px] leading-none ${done ? 'text-gray-400' : 'text-gray-200'}`}>
        {primary.terrain}{sameDirection ? ` · ${primary.direction}` : ''}
      </span>
    </button>
  )
}

function EmptySlot() {
  return <div className="h-20 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50" />
}

function buildGroups(races, grade, order) {
  const gradeRaces = races.filter(r => r.grade === grade)
  const orderIndex = new Map(order.map((id, i) => [id, i]))

  // Collect names of races that have a known trophy slot
  const knownNames = new Set(
    gradeRaces.filter(r => orderIndex.has(r.id)).map(r => r.name)
  )

  // Only include races with a known name (drops extras with no game trophy slot)
  const sorted = gradeRaces
    .filter(r => knownNames.has(r.name))
    .sort((a, b) => {
      const ai = orderIndex.has(a.id) ? orderIndex.get(a.id) : Infinity
      const bi = orderIndex.has(b.id) ? orderIndex.get(b.id) : Infinity
      return ai - bi
    })

  return groupByName(sorted)
}

export default function TrophyGrid({ races, completed, toggle }) {
  const [activeGrade, setActiveGrade] = useState('G1')
  const [page, setPage] = useState(0)

  const groups = useMemo(
    () => buildGroups(races, activeGrade, trophyOrder[activeGrade] ?? []),
    [races, activeGrade]
  )

  const pageCount = Math.ceil(groups.length / PAGE_SIZE)

  // Reset to page 0 whenever grade changes
  useEffect(() => { setPage(0) }, [activeGrade])

  const gradeCounts = useMemo(() => {
    const result = {}
    for (const grade of ['G1', 'G2', 'G3']) {
      const gradeGroups = buildGroups(races, grade, trophyOrder[grade] ?? [])
      result[grade] = {
        total: gradeGroups.length,
        done: gradeGroups.filter(g => g.some(r => completed.has(r.id))).length,
      }
    }
    return result
  }, [races, completed])

  const handleToggle = (group, isDone) => {
    if (isDone) {
      group.forEach(r => { if (completed.has(r.id)) toggle(r.id) })
    } else {
      toggle(group[0].id)
    }
  }

  const pageGroups = groups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const slots = [
    ...pageGroups,
    ...Array(PAGE_SIZE - pageGroups.length).fill(null),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Grade tabs */}
      <div className="flex gap-2">
        {['G1', 'G2', 'G3'].map(grade => {
          const { done, total } = gradeCounts[grade]
          const isActive = activeGrade === grade
          const colors = GRADE_COLORS[grade]
          return (
            <button
              key={grade}
              onClick={() => setActiveGrade(grade)}
              className={`flex-1 py-2 px-3 rounded-lg border-2 font-bold text-sm transition-colors cursor-pointer flex flex-col items-center
                ${isActive ? colors.active : colors.inactive}`}
            >
              {grade}
              <span className="text-xs font-normal opacity-80">{done}/{total}</span>
            </button>
          )
        })}
      </div>

      {/* Trophy grid — fixed 5×3, with side arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || pageCount <= 1}
          className="text-2xl text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default cursor-pointer leading-none flex-shrink-0"
        >
          ‹
        </button>

        <div className="grid grid-cols-3 gap-2 flex-1">
          {slots.map((group, i) =>
            group ? (
              <TrophyCard
                key={`${group[0].id}-${i}`}
                group={group}
                done={group.some(r => completed.has(r.id))}
                onToggle={handleToggle}
              />
            ) : (
              <EmptySlot key={`empty-${i}`} />
            )
          )}
        </div>

        <button
          onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
          disabled={page === pageCount - 1 || pageCount <= 1}
          className="text-2xl text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default cursor-pointer leading-none flex-shrink-0"
        >
          ›
        </button>
      </div>

      {/* Page dots */}
      {pageCount > 1 && (
        <div className="flex justify-center items-center gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded-full transition-all cursor-pointer ${
                i === page
                  ? 'w-2.5 h-2.5 bg-pink-500'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
