# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「からくりとけい」— 小学校低学年向けのからくり時計シミュレーターPWA。モーター・歯車・振り子(脱進機)・カム・ラック&ピニオンを盤面にドラッグ配置して噛み合わせ、時計の針やからくり人形を動かす教育アプリ。iPhone/iPad の Safari(ホーム画面追加)がメインターゲット。

- UI文言は**全ひらがな**(漢字を使わない)。ユーザー向けメッセージ・ラベルを追加するときもひらがなで書く
- ランタイム依存ゼロ(Vanilla TS + Canvas 2D + Web Audio)。ライブラリ追加は原則しない

## コマンド

```
npm run dev        # 開発サーバー(--host付き。iPad実機は http://<PCのIP>:5173)
npm run build      # tsc --noEmit + vite build + PWA生成(dist/)
npm run preview    # dist/ の確認(Service Worker検証はこちらで)
npm run icons      # public/icons/ のPNGを再生成(scripts/make-icons.mjs、依存なし)
npx tsc --noEmit   # 型チェックのみ
```

テストフレームワークはない。動作確認は Playwright MCP でブラウザを操作して行う。`window.__app` にアプリ全体の状態(world/sim/camera等)が公開されているので、`page.evaluate` からパーツを直接組んで検証できる(src/main.ts 末尾)。

Windows環境の注意: git が PATH にない場合は `C:\Program Files\Git\cmd\git.exe` を使う。

## デプロイ

main へ push すると GitHub Actions(.github/workflows/deploy.yml)が自動ビルドして GitHub Pages に公開する。
公開URL: https://tako1234321.github.io/karakuri-tokei/(リポジトリ: tako1234321/karakuri-tokei)

## アーキテクチャ

レイヤー構成(依存方向は下から上へ一方向):

- **src/core/** — 純粋ロジック。DOM/Canvas に依存しない。シミュレーションの心臓部
- **src/render/** — Canvas 2D 描画。`renderer.ts` が毎フレーム全体を描く
- **src/ui/** — DOMベースのUI(パレット、インスペクタ、トップバー、ガイド等)
- **src/data/** — 人形・針・文字盤・ミッションの宣言的定義
- **src/audio/** — Web Audio 合成(音源ファイルなし)
- **src/main.ts** — `App` オブジェクト(src/app.ts の interface)を組み立て、rAFループを回す

### コアの設計原則(複数ファイルにまたがる不変条件)

1. **回転は「角度の伝播」で計算する**(core/propagate.ts)。毎フレーム、噛み合いグラフを幾何から作り直し(`buildGraph`: 中心距離 ≒ ピッチ円半径の和)、動力(モーター/脱進機/からくりモーター)から BFS で各軸の絶対角度を決める。角速度の積分はしないので累積誤差が出ない。位相オフセットの式により歯と谷が見た目にも正しく噛み合う。ループの角速度矛盾や動力競合は連結成分ごと `jammed` にする(「ギギギ…」演出)

2. **減速比は有理数で厳密判定**(core/ratio.ts, check.ts)。針の速さチェックは浮動小数でなく歯数の分数演算(`rpmFrac`)で行う。目標は秒針 1/1・分針 1/60・時針 1/720(1シミュ分あたりの回転数)。振り子駆動など周期が無理数の場合のみ数値比較(許容1.2%)にフォールバック

3. **単位系**: 歯車のモジュールは全パーツ共通の `MODULE`(core/types.ts)。ピッチ円半径 = MODULE×歯数/2。Canvas の正の回転角 = 画面上の時計回り。`rpm` は「1シミュ分あたりの回転数」

4. **時間は2系統**(core/clock.ts): `simT`(連続シミュ秒、モーター角度の基準)と `seconds`(1日内の時刻、正時イベント発火)。倍速(×60/×600)は両方に効く。からくりモーターのショーだけは実時間(dtReal)で動く

5. **取り付け(mount)システム**: 針・カム・人形は `mountId` で軸パーツ(またはカム/ラック)に取り付く。位置は `World.syncMounts()` が毎フレーム追従させる。ドラッグ開始で自動的に外れ、ドロップ時の `World.snapPart()` が再取り付け・噛み合い吸着を行う

6. **パーツの追加手順**: core/types.ts の Part union に型を足す → ui/palette.ts の ITEMS → render/renderer.ts の描画 → ui/inspector.ts の編集UI → storage/saves.ts の validate の kinds。保存データ(localStorage, version:1)は parts の幾何だけを持ち、噛み合いグラフは読込時に再計算される

### iOS Safari 固有の対応(壊さないこと)

- 音は必ずユーザー操作後: タイトル画面「はじめる」タップで `AudioEngine.unlock()`
- キャンバスとパレットの `touch-action` 設定(パレットは上部の横スクロールバー。pan-x = 横スクロール/下へのドラッグ配置の両立。左端に置くと Safari の戻るスワイプ等と衝突するため上部固定にした経緯がある)
- タップのヒット判定順(ui/pointer.ts の hitOrder)は renderer.ts の描画順と一致させる(最前面優先)
- 画面左端32pxの `touchstart` を preventDefault(戻るエッジスワイプ対策、main.ts)
- ミューテーション系のUI操作は実行前に `world.pushUndo()` を呼ぶ(↩ボタンの整合性)
