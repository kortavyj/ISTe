# Independent encrypted backup — existing ISTe tournament DEV

Target: **jwzsawumiadlfxarvauc** (`kortavyj's Project`), **not** production `niwgrrprbcgbdaloijhq`.

This workflow is manual-only: `.github/workflows/iste-dev-backup.yml`.

## Required GitHub Actions secrets

- **NEW** `ISTE_DEV_BACKUP_DATABASE_URL`: DEV PostgreSQL URI (direct DB host or session pooler), database `postgres`, includes `sslmode=require`. Obtain from **DEV** Supabase dashboard > Connect. Do not disclose the secret in chats/screenshots.
- EXISTING `ISTE_BACKUP_PASSPHRASE`: GPG encryption key for the encrypted backup.
- EXISTING `ISTE_RCLONE_CONFIG_B64`: rclone Google Drive OAuth configuration for `iste_drive:`.

The workflow verifies that the DB URL identifies the **exact DEV project** before attempting any connection. A production URL fails before `pg_dump` starts.

## Procedure

1. Merge this PR after GitHub checks pass.
2. Add only `ISTE_DEV_BACKUP_DATABASE_URL` to GitHub repository Secrets and variables → Actions. **Do not overwrite `ISTE_BACKUP_DATABASE_URL`**.
3. Run Actions → **ISTe DEV Supabase encrypted backup (manual)** → Run workflow.
4. Verify run success, including archive integrity, GPG decrypt/hash check, and upload to `iste_drive:DEV/`.
5. Confirm there is an encrypted timestamped DEV dump in the existing ISTe backups Drive folder under `DEV/`. The production backup process remains unchanged.
6. Before applying migrations, perform a disposable restore smoke-test against this specific DEV archive. This workflow verifies archive integrity but **does not by itself validate full PostgreSQL/Supabase recovery**, including Auth/Storage and post-data objects.

**No dump or credential is committed to GitHub. No migration, table mutation, or Supabase production action is performed by the workflow.**
