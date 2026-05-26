import { useState, useCallback } from 'react'

const storageKey = (umaId) => `uma_progress_${umaId}`

function loadProgress(umaId) {
  try {
    const raw = localStorage.getItem(storageKey(umaId))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveProgress(umaId, completed) {
  localStorage.setItem(storageKey(umaId), JSON.stringify([...completed]))
}

export function useProgress(umaId) {
  const [completed, setCompleted] = useState(() => loadProgress(umaId))

  const toggle = useCallback((raceId) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(raceId)) {
        next.delete(raceId)
      } else {
        next.add(raceId)
      }
      saveProgress(umaId, next)
      return next
    })
  }, [umaId])

  const reset = useCallback(() => {
    setCompleted(new Set())
    saveProgress(umaId, new Set())
  }, [umaId])

  return { completed, toggle, reset }
}
