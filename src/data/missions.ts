import type { App } from '../app'
import { handStatus } from '../core/check'
import { meshedWith } from '../core/propagate'

export interface Mission {
  id: string
  title: string
  text: string
  check: (app: App) => boolean
}

export const MISSIONS: Mission[] = [
  {
    id: 'mesh1',
    title: 'はぐるまを まわそう',
    text: 'モーター(⚡)と はぐるま(⚙️)を ばんめんに おいて、はを かみあわせてみよう!ちかづけると ピタッと くっつくよ。',
    check: app => app.sim.graph.meshes.some(m => {
      const a = app.world.byId(m.a)
      const b = app.world.byId(m.b)
      return a?.kind === 'motor' || b?.kind === 'motor'
    }),
  },
  {
    id: 'train3',
    title: 'はぐるまを つなごう',
    text: 'はぐるまを もうひとつ つないで、3つ いじょうが いっしょに まわるようにしよう。おおきさで はやさが、つなぐたびに まわるむきが かわるよ!',
    check: app => {
      let driven = 0
      for (const [, st] of app.sim.axles) if (st.driven && !st.jammed) driven++
      return driven >= 3
    },
  },
  {
    id: 'sec',
    title: 'びょうしんを うごかそう',
    text: 'びょうしん(あかいはり)を はぐるまのじくに のせて、「1ぷんで ちょうど1しゅう」まわるようにしよう。うえの「✔チェック」で たしかめられるよ!',
    check: app => handStatus(app.sim, 'sec').ok,
  },
  {
    id: 'compound',
    title: '2だんギアの ひみつ',
    text: '2だんギア(🔩 おおきいはと ちいさいはが いったいのはぐるま)をつかうと、はやさを おおきく かえられるよ。2だんギアの ちいさいほうにも はぐるまを かみあわせてみよう!',
    check: app => app.sim.graph.meshes.some(m => {
      const a = app.world.byId(m.a)
      const b = app.world.byId(m.b)
      const stA = app.sim.axles.get(m.a)
      const stB = app.sim.axles.get(m.b)
      return (a?.kind === 'gear' && a.wheels.length >= 2 && m.ai === 1 && !!stA?.driven) ||
             (b?.kind === 'gear' && b.wheels.length >= 2 && m.bi === 1 && !!stB?.driven)
    }),
  },
  {
    id: 'min',
    title: 'ふんしんを つくろう',
    text: 'はぐるまを くみあわせて「1/60に へらすしくみ(げんそくき)」をつくり、ふんしんを 60ぷんで1しゅうに しよう!ヒント: 1/6 × 1/10 = 1/60 だよ。',
    check: app => handStatus(app.sim, 'min').ok,
  },
  {
    id: 'hour',
    title: 'じしんを つくろう',
    text: 'ふんしんから さらに 1/12に へらして、じしんを 12じかんで1しゅうに しよう。ヒント: 1/3 × 1/4 = 1/12。これで とけいの かんせいだ!',
    check: app => handStatus(app.sim, 'hour').ok,
  },
  {
    id: 'pendulum',
    title: 'ふりこで うごかそう',
    text: 'こんどは モーターのかわりに ふりこ(🕰️)で びょうしんを うごかしてみよう!ふりこの ながさをかえると はやさが かわるよ。ながさ99cm・はが30まいなら ぴったりだ!',
    check: app => {
      const esc = app.world.parts.find(p => p.kind === 'escapement')
      if (!esc || meshedWith(app.sim.graph, esc.id).length === 0) return false
      return handStatus(app.sim, 'sec').ok
    },
  },
  {
    id: 'show',
    title: 'せいじの からくりショー',
    text: 'からくりモーター(♪)に はぐるまと にんぎょう(🎎)を つないで、「♪ショー」ボタンを おしてみよう!メロディにあわせて にんぎょうが うごいたら だいせいこう!',
    check: app => app.karakuriTested,
  },
]
