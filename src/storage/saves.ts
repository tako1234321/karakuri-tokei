import type { Part, SaveData } from '../core/types'
import type { World } from '../core/world'

const PREFIX = 'karakuri:save:'
export const SLOT_COUNT = 5

export function saveSlot(slot: number | 'auto', world: World, melody: string, name = ''): void {
  const data: SaveData = {
    version: 1,
    name: name || `さくひん ${typeof slot === 'number' ? slot + 1 : ''}`.trim(),
    createdAt: new Date().toISOString(),
    parts: world.parts,
    melody,
  }
  try {
    localStorage.setItem(PREFIX + slot, JSON.stringify(data))
  } catch { /* 容量オーバーなどは無視 */ }
}

export function loadSlot(slot: number | 'auto'): SaveData | null {
  try {
    const s = localStorage.getItem(PREFIX + slot)
    if (!s) return null
    return validate(JSON.parse(s))
  } catch {
    return null
  }
}

export function slotList(): (SaveData | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(i))
}

export function exportJson(world: World, melody: string): string {
  const data: SaveData = {
    version: 1,
    name: 'かきだしさくひん',
    createdAt: new Date().toISOString(),
    parts: world.parts,
    melody,
  }
  return JSON.stringify(data)
}

export function importJson(text: string): SaveData | null {
  try {
    return validate(JSON.parse(text))
  } catch {
    return null
  }
}

function validate(d: unknown): SaveData | null {
  if (!d || typeof d !== 'object') return null
  const data = d as SaveData
  if (data.version !== 1 || !Array.isArray(data.parts)) return null
  const kinds = new Set(['motor', 'gear', 'escapement', 'karakuriMotor', 'hand', 'rack', 'cam', 'doll', 'dial'])
  const parts = (data.parts as Part[]).filter(p =>
    p && typeof p === 'object' && kinds.has(p.kind) &&
    typeof p.id === 'string' && p.pos && typeof p.pos.x === 'number' && typeof p.pos.y === 'number')
  return { ...data, parts, melody: typeof data.melody === 'string' ? data.melody : 'westminster' }
}
