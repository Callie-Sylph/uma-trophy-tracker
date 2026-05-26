import { useState } from 'react'

export default function UmaSelector({ umas, selectedId, umasWithData, onSelect }) {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  const filtered = umas.filter(u => {
    if (query) return u.name.toLowerCase().includes(query)
    return umasWithData.has(u.id) || u.id === selectedId
  })

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Search Uma..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
      <div className="flex flex-wrap gap-2">
        {filtered.map(uma => (
          <button
            key={uma.id}
            onClick={() => onSelect(uma.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              selectedId === uma.id
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-700'
            }`}
          >
            {uma.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400">
            {query ? 'No Umas match your search.' : 'Search above to find an Uma.'}
          </p>
        )}
      </div>
    </div>
  )
}
