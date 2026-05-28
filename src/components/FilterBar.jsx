// Distance range buckets matching Uma Musume's official aptitude categories
export const DISTANCE_RANGES = [
  { label: 'Sprint', min: 1000, max: 1400 },
  { label: 'Mile', min: 1500, max: 1800 },
  { label: 'Medium', min: 1900, max: 2400 },
  { label: 'Long', min: 2401, max: 9999 },
]

export const GRADES = ['G1', 'G2', 'G3']
export const TERRAINS = ['Turf', 'Dirt']

function ToggleGroup({ label, options, selected, onChange }) {
  const allSelected = options.every(o => selected.has(o))

  const toggle = (value) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(next)
  }

  const toggleAll = () => {
    onChange(allSelected ? new Set() : new Set(options))
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">{label}</span>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            selected.has(opt)
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
          }`}
        >
          {opt}
        </button>
      ))}
      <button
        onClick={toggleAll}
        className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
      >
        {allSelected ? 'none' : 'all'}
      </button>
    </div>
  )
}

export default function FilterBar({ filters, onChange }) {
  const update = (key) => (value) => onChange({ ...filters, [key]: value })

  const distanceOptions = DISTANCE_RANGES.map(r => r.label)

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <ToggleGroup label="Grade" options={GRADES} selected={filters.grades} onChange={update('grades')} />
      <ToggleGroup label="Surface" options={TERRAINS} selected={filters.terrains} onChange={update('terrains')} />
      <ToggleGroup label="Distance" options={distanceOptions} selected={filters.distances} onChange={update('distances')} />
    </div>
  )
}
