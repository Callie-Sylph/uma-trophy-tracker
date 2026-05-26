import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')

const MANIFEST_URL = 'https://gametora.com/data/manifests/umamusume.json'
const BASE_URL = 'https://gametora.com/data/umamusume'

const GRADE_LABEL = { 100: 'G1', 200: 'G2', 300: 'G3' }
const TERRAIN_LABEL = { 1: 'Turf', 2: 'Dirt' }
const DIRECTION_LABEL = { 1: 'Right', 2: 'Left', 4: 'Straight' }

async function fetchJson(url) {
  console.log(`Fetching ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true })

  const manifest = await fetchJson(MANIFEST_URL)

  const racesHash = manifest['races']
  const charsHash = manifest['characters']

  if (!racesHash) throw new Error('No "races" key in manifest')
  if (!charsHash) throw new Error('No "characters" key in manifest')

  const uraRacesHash = manifest['ura-races']
  if (!uraRacesHash) throw new Error('No "ura-races" key in manifest')

  const [rawRaces, rawChars, rawUraRaces] = await Promise.all([
    fetchJson(`${BASE_URL}/races.${racesHash}.json`),
    fetchJson(`${BASE_URL}/characters.${charsHash}.json`),
    fetchJson(`${BASE_URL}/ura-races.${uraRacesHash}.json`),
  ])

  // --- Timing: build map from raw race id → [{year, month, half}, ...] ---
  const uraRacesArray = Array.isArray(rawUraRaces) ? rawUraRaces : Object.values(rawUraRaces)
  const timingMap = new Map()
  for (const r of uraRacesArray) {
    if (!timingMap.has(r.instance)) timingMap.set(r.instance, [])
    timingMap.get(r.instance).push({ year: r.year, month: r.month, half: r.half })
  }

  // --- Races: filter to G1/G2/G3 ---
  const racesArray = Array.isArray(rawRaces) ? rawRaces : Object.values(rawRaces)
  const races = racesArray
    .filter(r => r.grade in GRADE_LABEL)
    .map(r => {
      const dates = timingMap.get(r.id) // r.id is the raw compound id (e.g. 100101)
      return {
        id: r.race_id ?? r.id,
        name: r.name_en || r.name_jp,
        grade: GRADE_LABEL[r.grade],
        distance: r.distance,
        terrain: TERRAIN_LABEL[r.terrain] ?? String(r.terrain),
        direction: DIRECTION_LABEL[r.direction] ?? String(r.direction),
        ...(dates ? { dates } : {}),
      }
    })
    .sort((a, b) => {
      const gradeOrder = { G1: 0, G2: 1, G3: 2 }
      return gradeOrder[a.grade] - gradeOrder[b.grade] || a.distance - b.distance || a.name.localeCompare(b.name)
    })

  console.log(`Races: ${races.length} G1/G2/G3 found (${races.filter(r => r.grade === 'G1').length} G1, ${races.filter(r => r.grade === 'G2').length} G2, ${races.filter(r => r.grade === 'G3').length} G3)`)

  // --- Characters: filter to Global-available playable Umas ---
  const charsArray = Array.isArray(rawChars) ? rawChars : Object.values(rawChars)
  const characters = charsArray
    .filter(c => c.race === 'uma' && (c.active_en || c.playable_en))
    .map(c => ({
      id: c.char_id,
      name: c.en_name,
      urlName: c.url_name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  console.log(`Characters: ${characters.length} Global-available Umas`)

  writeFileSync(join(DATA_DIR, 'races.json'), JSON.stringify(races, null, 2))
  writeFileSync(join(DATA_DIR, 'characters.json'), JSON.stringify(characters, null, 2))

  console.log('Done. Data written to src/data/')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
