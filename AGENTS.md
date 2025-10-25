# AGENTS.md — Romancing SaGa風ゲーム（Jules/Codex向け）

> **目的**: 本リポジトリを AI コーディングエージェント（Jules / Codex / Claude Code / Copilot など）が安全かつ高速に理解・開発できるようにするための“機械可読 README”。**人間向け README は別途 `README.md`** に置く。

---

## 0. ゴール & 非ゴール

* **ゴール（MVP）**

  * ブラウザでワンクリック起動できる 2D RPG（Romancing SaGa 風）の**最小可動**。
  * マップ移動 → ランダムエンカウント → ターン制バトル → 勝利/敗北 → フィールド復帰 の一連フロー。
  * 主要データ（キャラ/スキル/アイテム/敵/フォーメーション）を **JSON** で管理し、再ビルドなしで差し替え可能。
* **非ゴール（初期段階ではやらない）**

  * オンライン要素・課金・セーブのクラウド保存・3D 表現・重いアニメ/サウンドの大量導入。

---

## 1. 技術スタック（原則）

* **最優先方針: 起動の簡単さ**

  * **Mode A: Static** … 依存なし。`web/index.html` を直接開いて起動。
  * **Mode B: Dev** … Node.js LTS（推奨 **v22**）。`vite` 開発サーバでホットリロード。
* **言語/ツール**

  * TypeScript / HTML5 / CSS（PostCSS 可）
  * Vite（dev & build）、Vitest（テスト）、ESLint + Prettier（静的解析）
* **ライセンス/依存制約**

  * **ゼロ予算**/オフラインで機能する OSS のみ。
  * ライセンスは MIT / Apache-2.0 / BSD 系を優先。GPL 依存は原則回避。

---

## 2. すぐ実行（Quick Start）

### Mode A: Static（最短）

1. `web/index.html` をダブルクリック（またはローカル HTTP サーバで `web/` を配信）
2. タイトル画面 → 「New Game」でフィールドに出ることを確認

### Mode B: Dev（開発者向け）

```bash
# Node.js 22.x 前提
npm ci
npm run dev      # http://localhost:5173
npm run build    # dist/ へ出力
npm run preview  # ローカルでビルド物を確認

# 品質ゲート
npm run lint
npm run test
npm run format
```

> Node が未導入の場合は Mode A を使うこと。`npm ci` で失敗したら、`package-lock.json` を再生成する前に PR を分けてください。

---

## 3. リポジトリ構成（想定）

> 既存構成がある場合は **尊重して適応**。存在しなければ **この構成で生成** してください。

```
/ web              # Static 起動用エントリ（依存ゼロ運用）
  ├─ index.html
  ├─ styles/      # CSS
  ├─ assets/      # 画像・効果音（権利クリア必須）
  └─ data/        # JSON データ（編集で即反映）
/ src              # TypeScript（Vite 用）
  ├─ main.ts      # エントリ
  ├─ core/        # エンジン（状態管理/シーン/イベント）
  ├─ battle/      # 戦闘ロジック（式/状態遷移）
  ├─ map/         # タイルマップ/移動/エンカウント
  ├─ ui/          # UI コンポーネント
  └─ systems/     # セーブ/ロード/入出力の抽象化
/ tests            # Vitest
/ docs             # 仕様/設計/ADR テンプレ
  ├─ DESIGN.md
  ├─ GAMEPLAY.md
  └─ adr/ADR-0001-initial-architecture.md
.eslintrc.cjs, .prettierrc, vite.config.ts, tsconfig.json
```

**変更禁止（ある場合）**: `/infra`, `/docs/legal`, `LICENSE` はオーナー承認なく改変しない。

---

## 4. ゲームデザイン概要（機械可読チートシート）

### 4.1 コアループ

1. **探索**（フィールド/町/ダンジョン）
2. **イベント発火**（フラグ管理 + 条件式）
3. **バトル**（ターン制、行動順は AGI 基本、閃き/熟練度あり）
4. **成長**（熟練度と HP、LP の上昇チャンス）

### 4.2 主要システム（MVP）

* **バトル**: ターン制、前衛/後衛、武器種（剣/大剣/槍/斧/弓/体術/杖）
* **ステータス**: STR/DEX/AGI/INT/WIL/CHA、HP、**LP**（0 で戦闘不能→拠点帰還）
* **スキル（技/術）**: コスト（WP/MP）、属性（斬/打/突/熱/冷/雷/陰/陽）
* **閃き**: 条件を満たすと戦闘中に新スキルを獲得（確率式は簡易で OK）
* **フォーメーション**: 例：デザートランス（前衛防御↑/後衛防御↓）
* **イベント**: `eventId`, `conditions[]`, `effects[]` をもつ簡易 DSL

### 4.3 データスキーマ（JSON）

```json
{
  "characters": [
    {"id":"hero","name":"主人公","stats":{"STR":10,"DEX":8,"AGI":9,"INT":7,"WIL":8,"CHA":7,"HP":120,"LP":8},
     "weapons":["sword"],"skills":["slash"],"formation":"desert_lance"}
  ],
  "skills": [
    {"id":"slash","name":"スラッシュ","type":"tech","weapon":"sword","cost":{"WP":1},
     "power":12,"element":"slash","effects":[{"kind":"damage","scale":"STR"}]}
  ],
  "enemies": [
    {"id":"goblin","name":"ゴブリン","stats":{"STR":7,"DEX":6,"AGI":6,"INT":3,"WIL":4,"CHA":2,"HP":60,"LP":3},
     "skills":["club"],"exp":6,"drops":[{"item":"herb","rate":0.3}]}
  ],
  "formations": [
    {"id":"desert_lance","rows":["F","B","B"],"modifiers":{"front":{"def":0.2},"back":{"def":-0.1}}}
  ]
}
```

### 4.4 ダメージ簡易式

```
Damage = (AttackerPower + StatScale) * SkillPower * ElementMod * FormationMod - DefenderDefense
```

※ 初期は **単純で OK**。数式は `src/battle/formulas.ts` に集中させる。

---

## 5. 受け入れ条件（Definition of Done）

* **起動**: Mode A で `web/index.html` を開くと **1 秒以内**にタイトルが描画される。
* **ゲーム進行**: New Game → フィールド移動 → ランダムエンカウント → バトル勝利/敗北 → 復帰 が可能。
* **データ熱交換**: `web/data/*.json` を編集 → リロードのみで反映（ビルド不要）。
* **品質**: `npm run test` と `npm run lint` が 0 エラー。バンドル後の初回ロード < **2.0 MB**。
* **セキュリティ**: 秘密情報や外部キーをコミットしない。通信は発生させない（ローカル JSON のみ）。

---

## 6. コーディング規約

* **言語**: 変数/関数名は英語、UI テキストは日本語可（`i18n/` へ抽出）。
* **構造**: `core`（状態/シーン）と `battle`（戦闘）を分離。副作用は `systems/` で一元化。
* **PR ルール**: 1 機能 1 PR、500±200 行目安、説明とスクショ/GIF を添付。
* **コミット**: Conventional Commits（例: `feat: add formation system`）。
* **禁止**: ランダム外部依存、重いアセットの大量追加、Minify 前提の難読化。

---

## 7. テスト方針（Vitest）

* `tests/battle.spec.ts`: ダメージ式・行動順・状態異常の最小検証
* `tests/data.spec.ts`: JSON 読み込みとスキーマ妥当性
* `tests/flow.spec.ts`: タイトル→新規→戦闘→復帰の E2E（jsdom 可）

---

## 8. アセット/著作権ポリシー

* 画像/音は **自作 or パブリックドメイン/CC0** のみ。出典は `docs/ASSETS.md` に追記。
* ファイルサイズ目安: 画像 ≤ 256 KB / ループ BGM ≤ 1 MB。大型追加は PR で分割。

---

## 9. Jules/Codex への依頼テンプレ（自動生成可）

**タスク雛形**

```
Task: 「バトルの行動順とダメージ式を実装」
Context: AGENTS.md を遵守。Mode A で動作。データは web/data/*.json。
Deliverables:
 1) src/battle/turn.ts, src/battle/formulas.ts の実装
 2) tests/battle.spec.ts の追加（3 ケース以上）
 3) PR 説明に起動手順・スクショ添付
Constraints:
 - 既存構成を尊重。副作用は systems/ に限定。
 - 外部通信/課金/分析ツールは不可。
Definition of Done:
 - npm run test / lint が 0 エラー、Mode A/B の両起動で確認。
```

**レート制御（Jules 100 calls/day）**

* 1 タスク = 1 設計コメント + 1 実装 PR + 1 修正までを上限目安。
* 連続エラー時は **設計に戻る**（ADR 追記→再計画）。

---

## 10. 環境変数/秘密情報

* `.env` は使用しないのが原則。必要時は `.env.example` のみ追加し、値は空にする。
* ログ/issue/PR に秘密情報を書かない。

---

## 11. パフォーマンス/アクセシビリティ

* 初期ロード < **2.0 MB**、インタラクティブまで < **2.0s**（ローカル計測）
* キーボード操作フル対応（矢印/WASD、Enter/Space、Esc）
* 重要 UI のコントラスト比 4.5:1 以上

---

## 12. 既知タスク（最初の 5 本）

1. **雛形生成**: Vite + TS セットアップ / Mode A と整合する `web/` を同時用意
2. **フィールド移動**: タイルマップ描画・衝突・ランダムエンカ
3. **バトル最小実装**: ターン順/通常攻撃/ガード/勝敗遷移
4. **JSON データ読み込み**: `web/data/*.json` の型定義とバリデーション
5. **テスト/CI 下地**: Vitest 3 本 + GitHub Actions（オフライン実行）

---

## 13. 変更管理

* `docs/adr/` に意思決定を 1 ファイル 1 トピックで追記。
* 破壊的変更は `CHANGELOG.md` に **BREAKING** 付きで記録。

---

## 付録 A: イベント DSL 最小例

```json
{
  "id": "meet_monk",
  "conditions": [
    {"var": "visited_town_A", "op": "==", "value": true},
    {"flag": "has_amulet", "op": "==", "value": true}
  ],
  "effects": [
    {"type": "dialog", "text": "修行僧: その護符…見せてもらえますか"},
    {"type": "give_item", "item": "blessing"},
    {"type": "set_flag", "flag": "met_monk", "value": true}
  ]
}
```

## 付録 B: 形成（フォーメーション）定義の例

```json
{
  "id": "desert_lance",
  "rows": ["F","B","B"],
  "modifiers": {
    "front": {"def": 0.2, "speed": -0.05},
    "back":  {"def": -0.1, "speed": 0.05}
  }
}
```

## 付録 C: ダメージ式テスト例（擬似）

```ts
expect(damage({atk:20, STR:10}, skill.slash, target)).toBeGreaterThan(0)
```

---

**最終メモ**: この AGENTS.md は “機械にやさしい運用ルール” です。疑義が出たら `docs/adr/` に短い ADR を追加し、ここへリンクしてください。
