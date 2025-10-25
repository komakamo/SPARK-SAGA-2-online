# SPARK SAGA (仮) — SaGa-like JRPG (Web/PWA)

**目的:** ロマサガ風の“多主人公×自由探索×閃き”体験を、**ブラウザ1クリック起動**で公開。実装は Google の AI コーディングエージェント *Jules* に任せ、あなたは企画・仕様・レビューに専念します。

## まずはこれだけ（0円運用）
1. GitHub Pages を **Settings → Pages → Source: GitHub Actions** に設定
2. このリポジトリを `main` ブランチに push すると、Actions が走って公開されます
3. 公開URLは Actions 実行後にここへ追記してください → **（[(https://komakamo.github.io/SPARK-SAGA-2-online/)）】**

## 構成
- `docs/spec.md` … 完全仕様書（このプロジェクトの真実のソース）
- `docs/backlog-initial-issues.md` … Julesへ渡す初期バックログ（コピペ用）
- `.github/ISSUE_TEMPLATE/` … Jules向けIssueテンプレ・バグ報告テンプレ
- `.github/pull_request_template.md` … 受け入れ基準チェックリスト
- `.github/workflows/pages.yml` … GitHub Pages（Actions）用WF
- `index.html` / `public/manifest.json` / `sw.js` … **最低限のPWA**（オフラインでプレースホルダが起動）
- `ASSETS_LICENSE.md`, `CREDITS.md`, `LICENSE` … ライセンス台帳

