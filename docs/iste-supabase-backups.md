# ISTe: encrypted Supabase backups to Google Drive

## Status
Automation is prepared, **not active until the three GitHub Actions secrets are supplied and a successful manual run is checked**. Backups are made using PostgreSQL 17's pg_dump and GPG AES-256 encryption. No plaintext database dump is uploaded.

Drive folder: https://drive.google.com/drive/folders/1YXmez3UPGklessRoXHg5j1TblSbtVHtf

## GitHub Actions secrets (Settings → Secrets and variables → Actions)
1. `ISTE_BACKUP_DATABASE_URL`: PostgreSQL connection string (use Supabase Dashboard → Connect → Session Pooler for CI if direct database IPv6 is unavailable). Requires a database role with enough privileges to read the intended schemas. Use SSL via `?sslmode=require`. **Do not paste credentials into chats, source code, screenshots or logs.** Consider a least-privilege dedicated backup role.
2. `ISTE_BACKUP_PASSPHRASE`: long unique encryption password. Keep an offline copy: without it backups cannot be restored.
3. `ISTE_RCLONE_CONFIG_B64`: base64 of a complete rclone.conf with a Google Drive OAuth remote called `iste_drive`, configured with `root_folder_id=1YXmez3UPGklessRoXHg5j1TblSbtVHtf`. Set it up locally using `rclone config`, authenticate the Google account, and verify write access to the folder. A Google service account on free personal My Drive can encounter storage quota constraints; user OAuth is preferred. On Windows, use `[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\\path\\to\\rclone.conf"))` in PowerShell and place only the resulting encoded string in GitHub Actions secrets, not in the repository.

Do not turn on public sharing for the backup folder. Google Drive access tokens and refresh tokens are secrets.

## Activation
1. Test the configured rclone remote from your machine: `rclone lsf iste_drive:`.
2. Set three GitHub Actions secrets.
3. Merge this PR and run Actions → Encrypted Supabase backup to Google Drive → Run workflow.
4. Confirm green workflow **and** a nonempty `*.dump.gpg` in Drive.
5. Download a test backup and use `gpg --decrypt ... > database.dump` in a secured environment. Verify with PostgreSQL 17 `pg_restore --list database.dump`; then test an **actual restore in an isolated throwaway PostgreSQL instance**, not live Supabase.
6. Only after tested restore should the ISTe Tournaments V2 schema migration proceed.

## Scope and caveats
- `pg_dump` backs up the connected PostgreSQL database content and objects accessible to that login. It **does not back up the actual bytes of objects stored in Supabase Storage** or external OAuth/SMTP/Supabase project settings. Those require separate backups. It also does not include cluster-wide roles and other global objects, so role/privilege recreation needs separate planning.
- `--no-owner --no-acl` improves portable restores but does not preserve original owners and grants.
- Daily schedule at 02:25 UTC (~05:25 Kyiv during summer / ~04:25 winter). GitHub scheduled runs can be delayed.
- **Retention is not yet implemented**: do not delete old backups until an agreed retention schedule, storage limits, and tested recovery exist.
- Encrypt-at-rest password and OAuth config are kept in GitHub Secrets, never in repository.
- `pg_restore --list` and hash equality are format/integrity checks, **not** a full recovery test. A working database restore is required.
