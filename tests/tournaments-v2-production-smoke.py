#!/usr/bin/env python3
"""Read-only unauthenticated production smoke test. Never sends POST or cookies."""
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPRedirectHandler

BASE = os.environ.get("ISTE_SMOKE_BASE_URL", "https://www.istesport.com").rstrip("/")
UUID = "00000000-0000-4000-8000-000000000001"

READ = {
    "/api/tournaments-owner": {401, 403},
    f"/api/tournaments-team-list?tournamentId={UUID}": {401, 403},
    f"/api/tournaments-bracket?tournamentId={UUID}": {401, 403},
}
POST_ONLY = [
    "/api/tournaments-match-confirm",
    "/api/tournaments-team-apply",
    "/api/tournaments-team-review",
    "/api/tournaments-bracket-generate",
    "/api/tournaments-status-transition",
]

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None

opener = build_opener(NoRedirect())
failures = []
for path, allowed in list(READ.items()) + [(path, {405}) for path in POST_ONLY]:
    request = Request(BASE + path, method="GET", headers={"Accept": "application/json", "User-Agent": "ISTe-API-Smoke/1.0"})
    try:
        response = opener.open(request, timeout=15)
        status, content_type = response.status, response.headers.get("content-type", "")
        body = response.read(4096).decode("utf-8", errors="replace")
    except HTTPError as error:
        status, content_type = error.code, error.headers.get("content-type", "")
        body = error.read(4096).decode("utf-8", errors="replace")
    except (URLError, TimeoutError, OSError) as error:
        failures.append(f"{path}: network failure: {type(error).__name__}: {error}")
        continue
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        payload = None
    error_code = payload.get("error") if isinstance(payload, dict) else None
    print(f"{path}: HTTP {status}; content-type={content_type}; error={error_code}")
    if status not in allowed:
        failures.append(f"{path}: expected HTTP {sorted(allowed)}, got {status}")
    if "application/json" not in content_type.lower() or not isinstance(payload, dict):
        failures.append(f"{path}: expected JSON object, not SPA HTML/redirect")
    elif payload.get("ok") is not False or not isinstance(error_code, str):
        failures.append(f"{path}: expected explicit ok=false and error code")
    if status in {301, 302, 303, 307, 308}:
        failures.append(f"{path}: redirect should not replace JSON API errors")
if failures:
    for failure in failures:
        print("FAIL:", failure, file=sys.stderr)
    sys.exit(1)
print("PASS: all 8 tournament routes reject unauthenticated/invalid-method requests.")
