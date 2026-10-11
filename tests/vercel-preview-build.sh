#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
script="$repo_root/scripts/vercel-ignore-build.sh"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

cd "$workdir"
git init -q
git config user.email ci@example.invalid
git config user.name "ISTe CI"
mkdir -p src tests/pg
printf 'export default 1;\n' > src/app.js
printf '%s\n' '-- baseline' > tests/pg/example.sql
git add .
git commit -qm baseline
base="$(git rev-parse HEAD)"

# Changing only CI SQL must not trigger a Vercel Preview build.
printf '%s\n' '-- modified' >> tests/pg/example.sql
git add .
git commit -qm sql-only
set +e
VERCEL_GIT_COMMIT_REF=feature/cs2-tournaments-full-preview \
  VERCEL_GIT_PREVIOUS_SHA="$base" bash "$script" >/dev/null 2>&1
sql_status=$?
set -e
if [[ "$sql_status" -ne 0 ]]; then
  echo "SQL-only commit unexpectedly triggered Preview (exit=$sql_status)" >&2
  exit 1
fi

# Changes in src must still trigger a Preview build.
base="$(git rev-parse HEAD)"
printf 'export default 2;\n' > src/app.js
git add .
git commit -qm frontend-change
set +e
VERCEL_GIT_COMMIT_REF=feature/cs2-tournaments-full-preview \
  VERCEL_GIT_PREVIOUS_SHA="$base" bash "$script" >/dev/null 2>&1
web_status=$?
set -e
if [[ "$web_status" -ne 1 ]]; then
  echo "Frontend change incorrectly skipped Preview (exit=$web_status)" >&2
  exit 1
fi

echo "Vercel Preview skip/build behavior verified."
