// メロディの譜面データ(すべてパブリックドメインの曲)
// n: 音名(null は休符)、d: 拍数

export interface MelodyNote { n: string | null; d: number }

export interface Melody {
  key: string
  label: string
  bpm: number
  notes: MelodyNote[]
}

const westminster: Melody = {
  key: 'westminster',
  label: 'ウェストミンスター',
  bpm: 84,
  notes: [
    { n: 'G#4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'E4', d: 1 }, { n: 'B3', d: 2 }, { n: null, d: 1 },
    { n: 'E4', d: 1 }, { n: 'G#4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'B3', d: 2 }, { n: null, d: 1 },
    { n: 'E4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'G#4', d: 1 }, { n: 'E4', d: 2 }, { n: null, d: 1 },
    { n: 'G#4', d: 1 }, { n: 'E4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'B3', d: 2 }, { n: null, d: 1 },
  ],
}

const kirakira: Melody = {
  key: 'kirakira',
  label: 'きらきらぼし',
  bpm: 108,
  notes: [
    { n: 'C4', d: 1 }, { n: 'C4', d: 1 }, { n: 'G4', d: 1 }, { n: 'G4', d: 1 },
    { n: 'A4', d: 1 }, { n: 'A4', d: 1 }, { n: 'G4', d: 2 },
    { n: 'F4', d: 1 }, { n: 'F4', d: 1 }, { n: 'E4', d: 1 }, { n: 'E4', d: 1 },
    { n: 'D4', d: 1 }, { n: 'D4', d: 1 }, { n: 'C4', d: 2 },
  ],
}

const greensleeves: Melody = {
  key: 'greensleeves',
  label: 'グリーンスリーブス',
  bpm: 132,
  notes: [
    { n: 'A4', d: 1 }, { n: 'C5', d: 2 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1.5 }, { n: 'F5', d: 0.5 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 }, { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 2 }, { n: 'A4', d: 1 }, { n: 'A4', d: 1.5 }, { n: 'G#4', d: 0.5 }, { n: 'A4', d: 1 },
    { n: 'B4', d: 2 }, { n: 'G#4', d: 1 }, { n: 'E4', d: 3 },
  ],
}

// トロイメライ(シューマン)
const traumerei: Melody = {
  key: 'traumerei',
  label: 'トロイメライ',
  bpm: 63,
  notes: [
    { n: 'C4', d: 1 },
    { n: 'F4', d: 2 }, { n: 'A4', d: 0.5 }, { n: 'C5', d: 0.5 },
    { n: 'F5', d: 2 }, { n: 'E5', d: 2 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'A#4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'F4', d: 3 },
  ],
}

// 時の踊り(ポンキエッリ「ジョコンダ」より)
const hoursDance: Melody = {
  key: 'hours',
  label: 'ときのおどり',
  bpm: 116,
  notes: [
    { n: 'E4', d: 1.5 }, { n: 'C4', d: 0.5 }, { n: 'C4', d: 2 },
    { n: 'D4', d: 1.5 }, { n: 'B3', d: 0.5 }, { n: 'B3', d: 2 },
    { n: 'C4', d: 1 }, { n: 'D4', d: 1 }, { n: 'E4', d: 1 }, { n: 'F4', d: 1 },
    { n: 'G4', d: 1 }, { n: 'E4', d: 1 }, { n: 'C4', d: 2 },
    { n: 'G4', d: 1 }, { n: 'A4', d: 1 }, { n: 'G4', d: 1 }, { n: 'F4', d: 1 },
    { n: 'E4', d: 1 }, { n: 'D4', d: 1 }, { n: 'C4', d: 2 },
  ],
}

// 美しく青きドナウ(ヨハン・シュトラウス2世)
const danube: Melody = {
  key: 'danube',
  label: 'あおきドナウ',
  bpm: 168,
  notes: [
    { n: 'D4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'A4', d: 2 }, { n: null, d: 1 },
    { n: 'A5', d: 1 }, { n: 'A5', d: 1 }, { n: null, d: 1 },
    { n: 'F#5', d: 1 }, { n: 'F#5', d: 1 }, { n: null, d: 1 },
    { n: 'D4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'A4', d: 2 }, { n: null, d: 1 },
    { n: 'B5', d: 1 }, { n: 'B5', d: 1 }, { n: null, d: 1 },
    { n: 'G5', d: 1 }, { n: 'G5', d: 1 }, { n: null, d: 1 },
    { n: 'F#5', d: 1 }, { n: 'E5', d: 1 }, { n: 'D5', d: 3 },
  ],
}

// 人形の夢と目覚め(エステン)— めざめのワルツの部分
const dollsDream: Melody = {
  key: 'dollsdream',
  label: 'にんぎょうのゆめ',
  bpm: 138,
  notes: [
    { n: 'G4', d: 1 },
    { n: 'E5', d: 1 }, { n: 'E5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'E5', d: 1 }, { n: 'D5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'D5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 2 }, { n: 'G4', d: 1 },
    { n: 'E5', d: 1 }, { n: 'C5', d: 1 }, { n: 'G4', d: 1 },
    { n: 'A4', d: 1 }, { n: 'B4', d: 1 }, { n: 'C5', d: 3 },
  ],
}

export const MELODIES: Melody[] = [
  westminster, kirakira, greensleeves,
  traumerei, hoursDance, danube, dollsDream,
]

export function melodyByKey(key: string): Melody {
  return MELODIES.find(m => m.key === key) ?? westminster
}
