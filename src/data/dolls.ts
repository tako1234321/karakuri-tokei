// からくり人形の定義。input が rotate なら歯車の軸に、
// linear ならカムかラックに取り付けて動かす。

export interface DollDef {
  key: string
  label: string
  input: 'rotate' | 'linear'
  hint: string
}

export const DOLL_DEFS: DollDef[] = [
  { key: 'dancer', label: 'くるくるダンサー', input: 'rotate', hint: 'はぐるまのじくにのせてね' },
  { key: 'waver', label: 'てをふるこ', input: 'rotate', hint: 'はぐるまのじくにのせてね' },
  { key: 'bower', label: 'おじぎにんぎょう', input: 'linear', hint: 'カムのうえにのせてね' },
  { key: 'cuckoo', label: 'とびだすことり', input: 'linear', hint: 'カムかラックにつけてね' },
]

export function dollDef(key: string): DollDef {
  return DOLL_DEFS.find(d => d.key === key) ?? DOLL_DEFS[0]
}
