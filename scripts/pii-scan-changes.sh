#!/usr/bin/env bash
set -euo pipefail

if (($# > 0)); then
  comparison=("$1" HEAD)
else
  comparison=(HEAD)
fi

# pii-hound v0.1.9 treats JSONC as JSON and can hang on comments. Pass only
# formats it supports instead of relying on its broader suffix matching.
git diff --name-only --diff-filter=ACMR -z "${comparison[@]}" -- \
  '*.csv' '*.env*' '*.json' '*.jsonl' '*.log' '*.parquet' '*.tfstate' \
  '*.txt' '*.xlsm' '*.xlsx' '*.yaml' '*.yml' |
  xargs --null --no-run-if-empty pii-hound scan --fail-on-pii --
