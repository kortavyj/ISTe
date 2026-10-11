# Requires Docker Desktop on Windows.
# All data is isolated in a disposable Docker container. Production is untouched.
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "../.."))
$compose = "tests/pg/compose.yml"
$database = "iste-tournaments-local-test"

docker compose -f $compose up -d
if ($LASTEXITCODE -ne 0) { throw "Docker failed to start" }
for ($attempt = 0; $attempt -lt 40; $attempt++) {
  docker exec $database pg_isready -U postgres -d iste_tournaments_test *> $null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL not healthy" }

$files = @(
  "tests/pg/00_auth_fixture.sql",
  "db/migrations/20261011_cs2_tournaments_foundation.sql",
  "db/migrations/20261011_cs2_tournament_teams.sql",
  "db/migrations/20261011_cs2_matches.sql",
  "db/migrations/20261011_cs2_bracket_rpcs.sql",
  "tests/pg/10_tournament_e2e.sql"
)
foreach ($file in $files) {
  Write-Host "Testing: $file"
  Get-Content -LiteralPath $file -Raw -Encoding UTF8 |
    docker exec -i $database psql -X -U postgres -d iste_tournaments_test -v ON_ERROR_STOP=1
  if ($LASTEXITCODE -ne 0) { throw "Failed: $file" }
}
Write-Host "Tournament database integration tests PASSED."
Write-Host "Stop and delete container: docker compose -f tests/pg/compose.yml down"
