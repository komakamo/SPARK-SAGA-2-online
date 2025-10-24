#!/usr/bin/env bash
# 必要: GitHub CLI (gh) がログイン済み。実行場所: リポジトリのルート。
set -e
if ! command -v gh >/dev/null; then
  echo "gh コマンドが必要です: https://cli.github.com/"
  exit 1
fi
echo "Creating labels..."
cat docs/labels.json | jq -c '.[]' | while read -r line; do
  name=$(echo "$line" | jq -r '.name')
  color=$(echo "$line" | jq -r '.color')
  desc=$(echo "$line" | jq -r '.description')
  gh label create "$name" --color "$color" --description "$desc" || gh label edit "$name" --color "$color" --description "$desc"
done
echo "Done."
