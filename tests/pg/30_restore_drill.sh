#!/usr/bin/env bash
# Disposable CI PostgreSQL only. NEVER point this script at production.
set -euo pipefail
: "${PGDATABASE:?Set disposable test database}"
if [[ "${PGDATABASE}" != "iste_tournaments_ci" ]]; then
 echo "Refusing restoration drill on non-CI database" >&2
 exit 2
fi
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
pg_dump --format=custom --no-owner --no-acl --file="$tmpdir/backup.dump" "$PGDATABASE"
createdb iste_tournaments_restore_ci
trap 'dropdb --if-exists iste_tournaments_restore_ci >/dev/null 2>&1 || true; rm -rf "$tmpdir"' EXIT
pg_restore --no-owner --no-acl --dbname=iste_tournaments_restore_ci "$tmpdir/backup.dump"
actual="$(psql -X -At -d iste_tournaments_restore_ci -c "select count(*) from information_schema.tables where table_schema='public' and table_name in ('tournaments','tournament_matches','tournament_cs2_assignments','tournament_cs2_events')")"
if [[ "$actual" != "4" ]]; then
 echo "Restore drill failed: tournament tables missing" >&2
 exit 1
fi
psql -X -At -d iste_tournaments_restore_ci -c "select count(*) from pg_proc where proname='iste_assign_cs2_server'" | grep -qx 1
echo "Disposable PostgreSQL dump/restore drill passed"
