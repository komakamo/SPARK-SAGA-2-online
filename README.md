# README.md
# SPARK SAGA（仮）
“SaGa-like”自由度JRPG。**ブラウザ1クリック起動**／**PWAオフライン対応**／**データ駆動（JSON）**  
開発は**GoogleのAIエージェント Jules**が実装とPRを担当し、企画・レビュー・データ編集のみで運用します。

---

## 特長
- GitHub Pagesで**URLを開くだけ**で起動（PWAでオフライン可）
- **多主人公×非線形**、戦闘中の**閃き（Spark）**、**LP/陣形**の戦術性
- **0円運用**：OSSとCC0/CC-BYアセットのみ
- **データ駆動**：敵/スキル/イベント/陣形/ショップ/派閥/ERをすべてJSONで管理

---

## クイックスタート（最短・無料）
> コーディングは不要。**JulesにIssueを渡す**だけで雛形→公開まで到達します。

1. **リポジトリ作成**  
   - 新規リポジトリを作成（公開推奨）。ブランチは`dev`（開発）と`main`（公開）を用意
2. **Pagesの有効化**  
   - Settings → Pages → Source: `GitHub Actions` を選択
3. **Julesを接続**  
   - Julesから当該リポジトリにアクセス権を付与（Read/Write/PR作成可）
4. **最初のIssueを3件だけ作成**（コピペ可）
   - **#1 雛形＋Pages＋PWA**  
     目的：URLを開くと即起動＆オフライン起動  
     受入：LighthouseでPWA installable、オフライン起動OK、初期バンドル<1.5MB
   - **#2 データローダ＋スキーマ検証**  
     目的：`/data/*.json`の型検証と参照整合（未定義参照はビルド失敗）
   - **#3 戦闘最小＆ログ**  
     目的：1体vs1体の攻撃→被ダメ→撃破まで通す（ログ表示）
5. **Julesを実行**（1日100回まで）  
   - PRが届いたらレビュー→コメント→再実行→`dev`へマージ  
   - 安定後に`main`へマージ＝**自動でPages公開**

---

## リポジトリ構成（想定）
/public # 画像/音/フォント（CC0/CC-BY）
/src # 実装（Jules担当）
/data # すべてJSON（コンテンツ定義）
/tests # 単体/E2E
.github/workflows # CI（ビルド/テスト/Pages）
index.html
Spec.md
CREDITS.md

yaml
コードをコピーする

---

## 実行（任意：ローカル閲覧）
> 開発者でなくても、プレビュー用にローカルサーバを立てられます（無料）。
例（Nodeがある場合）
npm ci
npm run dev # 開発サーバ
npm run build # 静的ビルド

yaml
コードをコピーする
※あなたは実行しなくてもOK。Pages公開URLで遊べます。

---

## ゲームの概要
- **コアループ**：探索→イベント/戦闘→閃き/成長→拠点整備→探索
- **リソース**：HP/LP/WP/JP、LPは戦闘不能リスクの根幹
- **非線形進行**：ER0/1/2/3で世界の出現テーブルが変化
- **派閥**：商会/鉱山組合/祠守/傭兵団（-100〜+100）

詳細は**Spec.md**参照（戦闘式、確率、ER閾値、JSONスキーマ等を完全記載）。

---

## JSONデータ編集ガイド（ノーコードで拡張）
> 文章編集と同じ感覚で**コンテンツを追加**できます（PRはJulesが整合チェック）。

### 1) スキルを追加する
- `data/skill.json`に以下のような項目を追記
```json
{
  "id": "axe_whirlwind",
  "name": "旋風斬",
  "category": "weapon",
  "weapon_type": "axe",
  "cost": {"wp": 6, "jp": 0},
  "power": 40,
  "speed_mod": +10,
  "tags": ["slash", "aoe"],
  "inflict": [],
  "spark_conditions": [{"enemy_tag": "carapace"}],
  "learn_source": ["spark","scroll"],
  "animation": "axe_whirl",
  "desc": "周囲の敵を斬り払う。"
}
注意：weapon_typeやstatus名は他のJSONと整合させること（CIが検知）

2) 敵を追加する
data/enemy.jsonに追記。tags（例："carapace","flying","spirit"）で耐性/特効と連動

3) イベント/クエを追加する
data/event.jsonにノード型で追記（分岐、フラグ、戦闘、報酬）。

data/quest.jsonに開始/進行/完了の3段階を定義

4) 陣形・派閥・ショップ
data/formation.json、data/faction.json、data/shop.jsonを編集。

需給ONの場合はdemand_index（-10〜+10）で価格が±10%

開発フロー（Jules中心）
Issue作成（小粒、1成果物=1PR）

Jules実行（自動でブランチ作成→PR）

レビュー（受入条件：CI緑、Lighthouse基準、バンドルサイズ）

devへマージ→安定後mainへマージ（Pages自動公開）

1日の回し方（例）

朝：Issueを15〜25件まとめて起票

昼：Jules実行（~60回）→PRレビュー

夕：再実行（残り40回）→dev統合

夜：mainへリリース（1日1回）

品質基準
パフォーマンス：初回≤6秒、再訪≤3秒（平均的4G環境）

Lighthouse：PWA installable / Performance≥70 / Accessibility≥90

テスト：単体20本以上緑、E2Eスモーク（新規→最初のボス撃破）成功

アクセシビリティ：文字サイズ・色覚モード・点滅軽減・入力リマップ

アセット方針（0円）
画像/音：CC0/CC-BYのみ使用。出典・作者・URL・改変有無をCREDITS.mdに記録

禁止：商用不可/NC、SA強制、出典不明、再配布不可

取り込み時にライセンスファイル存在をCIで検査（Julesに実装依頼）

トラブルシューティング
真っ白で起動しない：Service Workerの古いキャッシュ→ブラウザのキャッシュ削除か、ビルド番号を更新

オフライン起動しない：manifest.jsonとプリキャッシュリストに漏れがないか

スマホで重い：設定→演出簡略化ON、解像度スケールを下げる

日本語フォントが崩れる：Noto Sans JPを確実に同梱/事前読み込み

ライセンス
コード：MIT（LICENSE参照）

アセット：CREDITS.mdにライセンス/出典を明記（CC0/CC-BYのみ）

貢献
PRはdevに対して作成。Issueテンプレを使用（目的/要件/受入/制約/参考）

受入基準：CI緑、Lighthouse基準、バンドル<2MB（初期）

参考：Issueテンプレ（コピペ可）
diff
コードをコピーする
### 目的
（ユーザ視点で何ができるようになるか）

### 要件
- 入出力・UI変更点
- 参照データ（/data/*.json のキー、ID）
- 非機能（パフォ、サイズ、PWA要件）

### 受入条件
- [ ] CI緑（ビルド/テスト）
- [ ] Lighthouse基準クリア
- [ ] バンドルサイズ上限内
- [ ] 動作確認（画面名： ）
- [ ] テスト（項目名： ）

### 制約
- ライセンス：CC0/CC-BYのみ
- 依存禁止：重いフレームワーク追加不可

### 参考
リンク/既存実装/関連Issue
