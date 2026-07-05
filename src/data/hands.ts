export interface HandDesignDef { key: string; label: string }

export const HAND_DESIGNS: HandDesignDef[] = [
  { key: 'classic', label: 'クラシック' },
  { key: 'sword', label: 'けんがた' },
  { key: 'bar', label: 'シンプル' },
  { key: 'breguet', label: 'ブレゲふう' },
]

export const HAND_LABEL: Record<string, string> = {
  sec: 'びょうしん',
  min: 'ふんしん',
  hour: 'じしん',
}
