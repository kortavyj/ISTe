#!/usr/bin/env python3
"""Fail-closed DEV PostgreSQL URL identity validation; never print credentials."""
import os
import sys
from urllib.parse import parse_qs, urlsplit

DEV_ID = "jwzsawumiadlfxarvauc"

def check_url(url: str):
    if not url:
        return "DATABASE_URL_MISSING"
    try:
        parts = urlsplit(url)
        host = (parts.hostname or "").lower().rstrip(".")
        user = parts.username or ""
        options = parse_qs(parts.query, keep_blank_values=True)
        if parts.scheme not in {"postgres", "postgresql"}:
            return "INVALID_SCHEME"
        if not parts.password:
            return "MISSING_PASSWORD"
        if parts.path != "/postgres":
            return "INVALID_DB_NAME"
        if options.get("sslmode") != ["require"]:
            return "SSL_REQUIRED"
        direct = host == f"db.{DEV_ID}.supabase.co" and user == "postgres"
        # PostgreSQL pooler uses project-qualified username.
        pooler = (host.endswith(".pooler.supabase.com")
                  and host.count(".") >= 3 and user == f"postgres.{DEV_ID}")
        if not (direct or pooler):
            return "DEV_PROJECT_IDENTITY_MISMATCH"
    except (ValueError, TypeError):
        return "MALFORMED_DATABASE_URL"
    return None

def main():
    outcome = check_url(os.environ.get("DATABASE_URL", ""))
    if outcome:
        print(f"::error::{outcome}: DEV database URL did not pass the allowlist; no connection attempted.")
        return 1
    print("DEV database identity validated for encrypted backup; no credentials printed.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
