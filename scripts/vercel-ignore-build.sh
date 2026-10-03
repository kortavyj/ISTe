#!/usr/bin/env bash
# Vercel Ignored Build Step for the ISTe monorepo.
#
# Exit 0 = skip this web deployment.
# Exit 1 = continue with the Vercel build.
#
# We compare against the last successful Vercel deployment when available,
# so several bot-only commits in a row do not accidentally trigger the site.

set -u

BASE_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [ -z "$BASE_SHA" ] || ! git cat-file -e "$BASE_SHA^{commit}" 2>/dev/null; then
  if git rev-parse HEAD^ >/dev/null 2>&1; then
    BASE_SHA="$(git rev-parse HEAD^)"
  else
    echo "No comparison commit is available. Building to stay safe."
    exit 1
  fi
fi

WEB_PATHS=(
  "src"
  "api"
  "server"
  "shared"
  "public"
  "index.html"
  "package.json"
  "package-lock.json"
  "vite.config.js"
  "vercel.json"
  "scripts/vercel-ignore-build.sh"
)

if git diff --quiet "$BASE_SHA" HEAD -- "${WEB_PATHS[@]}"; then
  echo "No ISTe website files changed. Skipping Vercel build."
  exit 0
fi

echo "ISTe website files changed. Continuing Vercel build."
exit 1
