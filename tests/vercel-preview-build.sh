#!/usr/bin/env bash
set -euo pipefail
script="scripts/vercel-ignore-build.sh"
set +e
output="$(VERCEL_GIT_COMMIT_REF=feature/cs2-tournaments-full-preview VERCEL_GIT_PREVIOUS_SHA= bash "$script" 2>&1)"
status=$?
set -e
if [[ "$status" -ne 1 ]] || [[ "$output" != *"CS2 preview branch: bypassing ignored build detection."* ]]; then
 echo "CS2 preview incorrectly ignored (exit=$status): $output" >&2
 exit 1
fi
echo "Feature-branch Preview correctly forces build."
