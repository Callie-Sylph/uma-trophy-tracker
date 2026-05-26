// Groups an array of races by name, preserving first-occurrence order.
// Returns an array of groups — each group is an array of races sharing the same name.
export function groupByName(races) {
  const nameToGroup = new Map()
  for (const race of races) {
    if (!nameToGroup.has(race.name)) nameToGroup.set(race.name, [])
    const group = nameToGroup.get(race.name)
    if (!group.some(r => r.id === race.id)) group.push(race)
  }
  const seen = new Set()
  return races
    .filter(race => {
      if (seen.has(race.name)) return false
      seen.add(race.name)
      return true
    })
    .map(race => nameToGroup.get(race.name))
}
