# ISTe Tournaments V2 — architecture (Stage 1)

Status: proposed architecture, NO production database migration. The existing public /tournaments Beta remains unchanged.

## Routes and access
- `/tournaments`: public tournament listing and bracket (future read-only API).
- `/owner/tournaments-preview`: OwnerRoute-protected organizer sandbox (Stage 1), **browser state only**. Nothing submitted to server.
- Future `/owner/tournaments`: real CRUD gated at API level by verified owner identity; client route protection is not authorization.

## Data design (planned, no tables created)
- `tournaments`: id uuid, slug unique, title, game, format (single_elimination initially), best_of, capacity, timezone, registration_start/end, starts_at, status (draft|registration|checkin|live|finished|cancelled), created_by, timestamps.
- `tournament_teams`: id, tournament_id, name, captain_user_id, status (pending|approved|rejected|withdrawn|checked_in), seed, timestamps; unique(tournament_id, name) case-insensitive.
- `tournament_members`: tournament_team_id, user_id, faceit_player_id, role, is_captain; check membership and roster size.
- `tournament_matches`: id, tournament_id, round_index, match_index, team_a_id, team_b_id, score_a, score_b, best_of, status, winner_team_id, scheduled_at, version, timestamps; unique(tournament_id, round_index, match_index).
- `tournament_maps`: id, match_id, map_name, score_a, score_b, map_index.
- `tournament_audit_log`: id, actor_id, entity_type, entity_id, action, previous_data, new_data, timestamp.

## Security/invariants
- Supabase RLS: public can read only published tournaments and public match results; organizer writes through verified server-side role checks; captain may edit only own pending application until lock. Service credentials never sent to browser.
- Match score updates are transactional; require expected version, valid score, and explicit result confirmation. Advance winner only after confirmation; prevent overwriting later rounds without reset/rollback procedure.
- No winner for tied or unfinished matches; BYE handling explicit. Enforce capacity and unique entrant constraints at DB level; lock bracket after start.
- Store all times UTC with tournament timezone for display; record mutations in audit log.
- Registration endpoints require input validation and rate limits. Separate application status from match status.

## Delivery order
1. Owner-only organizer interface and data model agreement — this PR, all mock state.
2. Verify Supabase backup/export strategy; migration + RLS + transactional endpoints; no silent schema change.
3. Registration, owner moderation, check-in and seeding.
4. Bracket generation, match management, winner propagation and audit trail.
5. Connect published public UI, automate updates, test production permissions and monitoring.

## Stage 1 acceptance
- Owner page can create/edit a local demonstration tournament, manage local demo teams and score inputs, switch tabs, reset sandbox.
- Clear warning that demo changes are not persisted and are not real events.
- No edits to live /tournaments, owner permissions, existing rosters or Supabase.
