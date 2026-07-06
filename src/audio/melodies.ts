// メロディの譜面データ(すべてパブリックドメインの曲)
// n: 音名(null は休符)、d: 拍数
// voice: リード音色(bell=オルゴール / flute=笛 / strings=弦)
// accomp: 伴奏トラック(小さめのベルで鳴る)

export type Voice = 'bell' | 'flute' | 'strings'

export interface MelodyNote { n: string | null; d: number }

export interface Melody {
  key: string
  label: string
  bpm: number
  notes: MelodyNote[]
  voice?: Voice
  accomp?: MelodyNote[]
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
    // A
    { n: 'C4', d: 1 }, { n: 'C4', d: 1 }, { n: 'G4', d: 1 }, { n: 'G4', d: 1 },
    { n: 'A4', d: 1 }, { n: 'A4', d: 1 }, { n: 'G4', d: 2 },
    { n: 'F4', d: 1 }, { n: 'F4', d: 1 }, { n: 'E4', d: 1 }, { n: 'E4', d: 1 },
    { n: 'D4', d: 1 }, { n: 'D4', d: 1 }, { n: 'C4', d: 2 },
    // B ×2
    { n: 'G4', d: 1 }, { n: 'G4', d: 1 }, { n: 'F4', d: 1 }, { n: 'F4', d: 1 },
    { n: 'E4', d: 1 }, { n: 'E4', d: 1 }, { n: 'D4', d: 2 },
    { n: 'G4', d: 1 }, { n: 'G4', d: 1 }, { n: 'F4', d: 1 }, { n: 'F4', d: 1 },
    { n: 'E4', d: 1 }, { n: 'E4', d: 1 }, { n: 'D4', d: 2 },
    // A
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
    // Aメロ 1回目
    { n: 'A4', d: 1 }, { n: 'C5', d: 2 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1.5 }, { n: 'F5', d: 0.5 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 }, { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 2 }, { n: 'A4', d: 1 }, { n: 'A4', d: 1.5 }, { n: 'G#4', d: 0.5 }, { n: 'A4', d: 1 },
    { n: 'B4', d: 2 }, { n: 'G#4', d: 1 }, { n: 'E4', d: 2 },
    // Aメロ 2回目(おわりかたが違う)
    { n: 'A4', d: 1 }, { n: 'C5', d: 2 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1.5 }, { n: 'F5', d: 0.5 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 }, { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 1.5 }, { n: 'B4', d: 0.5 }, { n: 'A4', d: 1 }, { n: 'G#4', d: 1.5 }, { n: 'F#4', d: 0.5 }, { n: 'G#4', d: 1 },
    { n: 'A4', d: 3 },
    // サビ
    { n: 'G5', d: 3 }, { n: 'G5', d: 1.5 }, { n: 'F#5', d: 0.5 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 }, { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 2 }, { n: 'A4', d: 1 }, { n: 'A4', d: 1.5 }, { n: 'G#4', d: 0.5 }, { n: 'A4', d: 1 },
    { n: 'B4', d: 2 }, { n: 'G#4', d: 1 }, { n: 'E4', d: 2 },
    { n: 'G5', d: 3 }, { n: 'G5', d: 1.5 }, { n: 'F#5', d: 0.5 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 }, { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 1.5 }, { n: 'B4', d: 0.5 }, { n: 'A4', d: 1 }, { n: 'G#4', d: 1.5 }, { n: 'F#4', d: 0.5 }, { n: 'G#4', d: 1 },
    { n: 'A4', d: 3 },
  ],
}

// トロイメライ(シューマン)
const traumerei: Melody = {
  key: 'traumerei',
  label: 'トロイメライ',
  bpm: 63,
  notes: [
    // 1フレーズ目
    { n: 'C4', d: 1 },
    { n: 'F4', d: 2 }, { n: 'A4', d: 0.5 }, { n: 'C5', d: 0.5 },
    { n: 'F5', d: 2 }, { n: 'E5', d: 2 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'A#4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'G4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'F4', d: 2.5 },
    // 2フレーズ目(高くのぼって、ゆっくりおりてくる)
    { n: 'C4', d: 1 },
    { n: 'F4', d: 2 }, { n: 'A4', d: 0.5 }, { n: 'C5', d: 0.5 },
    { n: 'F5', d: 2 }, { n: 'E5', d: 2 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'F5', d: 1 }, { n: 'E5', d: 1 }, { n: 'D5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'A4', d: 1.5 }, { n: 'G4', d: 0.5 }, { n: 'F4', d: 3 },
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
    // くりかえし+のぼっていくおわり
    { n: 'E4', d: 1.5 }, { n: 'C4', d: 0.5 }, { n: 'C4', d: 2 },
    { n: 'D4', d: 1.5 }, { n: 'B3', d: 0.5 }, { n: 'B3', d: 2 },
    { n: 'C4', d: 1 }, { n: 'D4', d: 1 }, { n: 'E4', d: 1 }, { n: 'F4', d: 1 },
    { n: 'G4', d: 1 }, { n: 'A4', d: 1 }, { n: 'B4', d: 1 }, { n: 'C5', d: 1 },
    { n: 'C5', d: 1 }, { n: 'G4', d: 1 }, { n: 'E4', d: 1 }, { n: 'G4', d: 1 },
    { n: 'C4', d: 3 },
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
    { n: 'D4', d: 1 }, { n: 'G4', d: 1 }, { n: 'B4', d: 1 },
    { n: 'B4', d: 2 }, { n: null, d: 1 },
    { n: 'B5', d: 1 }, { n: 'B5', d: 1 }, { n: null, d: 1 },
    { n: 'G5', d: 1 }, { n: 'G5', d: 1 }, { n: null, d: 1 },
    { n: 'E4', d: 1 }, { n: 'A4', d: 1 }, { n: 'C#5', d: 1 },
    { n: 'C#5', d: 2 }, { n: null, d: 1 },
    { n: 'A5', d: 1 }, { n: 'A5', d: 1 }, { n: null, d: 1 },
    { n: 'E5', d: 1 }, { n: 'E5', d: 1 }, { n: null, d: 1 },
    // フィナーレ
    { n: 'F#5', d: 1 }, { n: 'E5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'E5', d: 1 }, { n: 'C#5', d: 1 }, { n: 'A4', d: 1 },
    { n: 'D5', d: 3 },
  ],
}

// 人形の夢と目覚め(エステン)— 目覚めておどりだす明るい部分
const dollsDream: Melody = {
  key: 'dollsdream',
  label: 'にんぎょうのゆめ',
  bpm: 168,
  notes: [
    { n: 'G4', d: 0.5 }, { n: 'C5', d: 0.5 },
    { n: 'E5', d: 1 }, { n: 'E5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'E5', d: 1 }, { n: 'D5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'D5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 1 }, { n: 'C5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'G5', d: 1 }, { n: 'G5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'F5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'C5', d: 2 }, { n: 'G4', d: 0.5 }, { n: 'C5', d: 0.5 },
    // 2回目はもっと高くはずむ
    { n: 'E5', d: 1 }, { n: 'E5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'E5', d: 1 }, { n: 'D5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'F5', d: 1 }, { n: 'F5', d: 1 }, { n: 'F5', d: 1 },
    { n: 'F5', d: 1 }, { n: 'E5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'G5', d: 1 }, { n: 'E5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'A4', d: 1 }, { n: 'D5', d: 1 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 2 }, { n: null, d: 1 },
    // しめくくりのファンファーレ
    { n: 'C5', d: 0.5 }, { n: 'E5', d: 0.5 }, { n: 'G5', d: 1 },
    { n: 'E5', d: 0.5 }, { n: 'G5', d: 0.5 }, { n: 'C6', d: 1 },
    { n: 'G5', d: 1 }, { n: 'E5', d: 1 }, { n: 'C5', d: 2 },
  ],
}

// ---------- RE511B(SEIKO DREAMLAND)ゆかりの曲 ----------

// カノン(パッヘルベル)
const canon: Melody = {
  key: 'canon',
  label: 'カノン',
  bpm: 56,
  voice: 'strings',
  notes: [
    { n: 'F#5', d: 2 }, { n: 'E5', d: 2 }, { n: 'D5', d: 2 }, { n: 'C#5', d: 2 },
    { n: 'B4', d: 2 }, { n: 'A4', d: 2 }, { n: 'B4', d: 2 }, { n: 'C#5', d: 2 },
    { n: 'D5', d: 1 }, { n: 'C#5', d: 1 }, { n: 'B4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'G4', d: 1 }, { n: 'F#4', d: 1 }, { n: 'G4', d: 1 }, { n: 'E4', d: 1 },
    { n: 'D4', d: 4 },
  ],
  accomp: [
    { n: 'D3', d: 2 }, { n: 'A3', d: 2 }, { n: 'B3', d: 2 }, { n: 'F#3', d: 2 },
    { n: 'G3', d: 2 }, { n: 'D3', d: 2 }, { n: 'G3', d: 2 }, { n: 'A3', d: 2 },
    { n: 'D3', d: 2 }, { n: 'A3', d: 2 }, { n: 'B3', d: 2 }, { n: 'F#3', d: 2 },
    { n: 'D3', d: 4 },
  ],
}

// 春の歌(メンデルスゾーン)
const springSong: Melody = {
  key: 'spring',
  label: 'はるのうた',
  bpm: 72,
  voice: 'flute',
  notes: [
    { n: 'A4', d: 0.5 }, { n: 'B4', d: 0.5 }, { n: 'C#5', d: 0.5 }, { n: 'D5', d: 0.5 },
    { n: 'E5', d: 1.5 }, { n: 'E5', d: 0.5 }, { n: 'D5', d: 1 }, { n: 'C#5', d: 1 },
    { n: 'B4', d: 1.5 }, { n: 'C#5', d: 0.5 }, { n: 'B4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'G#4', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'B4', d: 1 }, { n: 'E4', d: 1 },
    { n: 'A4', d: 3 },
  ],
}

// ウィーンの森の物語(ヨハン・シュトラウス2世)
const viennaWoods: Melody = {
  key: 'vienna',
  label: 'ウィーンのもり',
  bpm: 170,
  voice: 'strings',
  notes: [
    { n: 'G4', d: 1 }, { n: 'C5', d: 1 }, { n: 'C5', d: 1 },
    { n: 'C5', d: 2 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 1 }, { n: 'E5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'D5', d: 1 },
    { n: 'E5', d: 1 }, { n: 'G5', d: 1 }, { n: 'G5', d: 1 },
    { n: 'G5', d: 2 }, { n: 'F5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'D5', d: 1 }, { n: 'C5', d: 3 },
  ],
}

// メヌエット(ボッケリーニ)
const minuet: Melody = {
  key: 'minuet',
  label: 'メヌエット',
  bpm: 104,
  voice: 'strings',
  notes: [
    { n: 'A4', d: 0.5 }, { n: 'B4', d: 0.5 }, { n: 'C#5', d: 0.5 }, { n: 'D5', d: 0.5 },
    { n: 'E5', d: 1 }, { n: 'A4', d: 1 }, { n: 'A4', d: 1 },
    { n: 'B4', d: 0.5 }, { n: 'C#5', d: 0.5 }, { n: 'D5', d: 0.5 }, { n: 'E5', d: 0.5 },
    { n: 'F#5', d: 1 }, { n: 'B4', d: 1 }, { n: 'B4', d: 1 },
    { n: 'E5', d: 1 }, { n: 'F#5', d: 0.5 }, { n: 'E5', d: 0.5 }, { n: 'D5', d: 0.5 }, { n: 'C#5', d: 0.5 },
    { n: 'B4', d: 1 }, { n: 'C#5', d: 0.5 }, { n: 'B4', d: 0.5 }, { n: 'A4', d: 0.5 }, { n: 'G#4', d: 0.5 },
    { n: 'A4', d: 3 },
  ],
}

// ジュ・トゥ・ヴ(サティ)
const jeTeVeux: Melody = {
  key: 'jeteveux',
  label: 'ジュ・トゥ・ヴ',
  bpm: 152,
  voice: 'flute',
  notes: [
    { n: 'G4', d: 1 },
    { n: 'C5', d: 1 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'G5', d: 2 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'C5', d: 1 }, { n: 'D5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'C5', d: 1 },
    { n: 'A4', d: 1 }, { n: 'B4', d: 1 }, { n: 'C5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'D5', d: 1 },
    { n: 'C5', d: 2 }, { n: 'B4', d: 1 }, { n: 'C5', d: 3 },
  ],
}

// 花の歌(ランゲ)
const flowerSong: Melody = {
  key: 'flower',
  label: 'はなのうた',
  bpm: 84,
  voice: 'flute',
  notes: [
    { n: 'C4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'A4', d: 0.5 }, { n: 'C5', d: 0.5 },
    { n: 'F5', d: 1.5 }, { n: 'E5', d: 0.5 }, { n: 'D5', d: 1 },
    { n: 'C5', d: 1.5 }, { n: 'A4', d: 0.5 }, { n: 'F4', d: 1 },
    { n: 'G4', d: 1 }, { n: 'A4', d: 0.5 }, { n: 'G4', d: 0.5 }, { n: 'F4', d: 1 }, { n: 'E4', d: 1 },
    { n: 'F4', d: 3 },
  ],
}

// 調子の良い鍛冶屋(ヘンデル)
const blacksmith: Melody = {
  key: 'blacksmith',
  label: 'かじやのうた',
  bpm: 96,
  voice: 'bell',
  notes: [
    { n: 'E4', d: 0.5 }, { n: 'F4', d: 0.5 },
    { n: 'G4', d: 1 }, { n: 'G4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'G4', d: 0.5 }, { n: 'E4', d: 0.5 },
    { n: 'F4', d: 1 }, { n: 'F4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'D4', d: 0.5 },
    { n: 'E4', d: 1 }, { n: 'E4', d: 0.5 }, { n: 'D4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'C4', d: 0.5 },
    { n: 'D4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'D4', d: 0.5 }, { n: 'C4', d: 2 },
  ],
}

// 女学生(ワルトトイフェル「エステュディアンティナ」)
const estudiantina: Melody = {
  key: 'estudiantina',
  label: 'じょがくせい',
  bpm: 168,
  voice: 'strings',
  notes: [
    { n: 'A4', d: 1 },
    { n: 'D5', d: 2 }, { n: 'F#5', d: 1 },
    { n: 'A5', d: 2 }, { n: 'F#5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'G5', d: 1 },
    { n: 'F#5', d: 3 },
    { n: 'D5', d: 2 }, { n: 'F#5', d: 1 },
    { n: 'A5', d: 2 }, { n: 'F#5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'C#5', d: 1 },
    { n: 'D5', d: 3 },
  ],
}

// 舞踏の時間に(かろやかなサロンワルツ)
const danceHour: Melody = {
  key: 'dancehour',
  label: 'ぶとうのじかんに',
  bpm: 160,
  voice: 'flute',
  notes: [
    { n: 'G4', d: 1 },
    { n: 'E5', d: 1 }, { n: 'E5', d: 1 }, { n: 'F5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'C5', d: 1 },
    { n: 'D5', d: 1 }, { n: 'D5', d: 1 }, { n: 'E5', d: 1 },
    { n: 'D5', d: 2 }, { n: 'B4', d: 1 },
    { n: 'C5', d: 1 }, { n: 'E5', d: 1 }, { n: 'G5', d: 1 },
    { n: 'E5', d: 2 }, { n: 'D5', d: 1 },
    { n: 'C5', d: 3 },
  ],
}

export const MELODIES: Melody[] = [
  // RE511B ゆかりのならび
  danceHour, dollsDream, estudiantina, springSong, viennaWoods,
  minuet, jeTeVeux, canon, flowerSong, blacksmith,
  // これまでの曲
  westminster, kirakira, greensleeves, traumerei, hoursDance, danube,
]

export function melodyByKey(key: string): Melody {
  return MELODIES.find(m => m.key === key) ?? westminster
}
