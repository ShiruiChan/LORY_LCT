// ===================== Types =====================
export type BuildingType = 'house' | 'factory' | 'shop'


export type Building = {
id: string
type: BuildingType
x: number
y: number
level: number
baseIncomePerMinute: number
}


export type GameSnapshot = {
coins: number
buildings: Building[]
lastTickISO: string // ISO string to compute offline gains
}


export type GameAPI = GameSnapshot & {
// economy
addCoins: (amount: number) => void
canSpend: (amount: number) => boolean
spend: (amount: number) => boolean


// buildings
addBuilding: (b: Omit<Building, 'id' | 'level' | 'baseIncomePerMinute'> & { id?: string; level?: number; baseIncomePerMinute?: number }) => Building
removeBuilding: (id: string) => void
upgradeBuilding: (id: string) => void


// maintenance
reset: () => void
}


// ===================== Persistence =====================
const STORAGE_KEY = 'game:v1'


function load(): GameSnapshot | null {
try {
const raw = localStorage.getItem(STORAGE_KEY)
if (!raw) return null
const obj = JSON.parse(raw) as Partial<GameSnapshot>
if (typeof obj.coins !== 'number' || !Array.isArray(obj.buildings)) return null
return {
coins: obj.coins ?? 0,
buildings: (obj.buildings ?? []) as Building[],
lastTickISO: obj.lastTickISO ?? new Date().toISOString(),
}
} catch {
return null
}
}


function save(state: GameSnapshot) {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
} catch {}
}


// ===================== Tiny store core =====================
let state: GameSnapshot =
load() ?? {
coins: 100,
buildings: [],
lastTickISO: new Date().toISOString(),
}


const listeners = new Set<() => void>()


function setState(patch: Partial<GameSnapshot> | ((s: GameSnapshot) => Partial<GameSnapshot>)) {
const nextPatch = typeof patch === 'function' ? patch(state) : patch
state = { ...state, ...nextPatch }
save(state)
listeners.forEach((l) => l())
}