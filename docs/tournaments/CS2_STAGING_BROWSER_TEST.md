# ISTe CS2 — isolated beta browser validation

**Status:** procedure only; no live staging deployment or Supabase clone verified. Do not run on production.

## Prerequisites

- A **separate** Supabase staging project, recoverable backup and isolated website preview, with its own cookie domain and owner login using MFA AAL2.
- Apply the tournament migration files in the same order as `.github/workflows/tournaments-ci.yml`, including match rooms, team applications and roster profile lookup. Apply these only to staging.
- Set `ISTE_CS2_ROOM_ENCRYPTION_KEY` in the server-only staging deployment to a randomly generated base64 32-byte key. Keep it out of `VITE_*`, GitHub and public logs.
- Use an organizer account, two distinct team captains, at least two players, an unrelated logged-in user and an unauthenticated browser. Use an organizer-controlled test server with disposable connection credentials.

## Browser test matrix

| Actor / state | Action | Expected result |
|---|---|---|
| Anonymous | Open match room / request private room API | Public matchup renders, private endpoint returns 401; no address or password |
| Unrelated signed-in user | Request private room API | 403; no password |
| Pending applicant | Request private room API | 403 until captain approves |
| Captain | Accept player application | Player appears in approved roster |
| Rejected applicant | Request private room API | 403 |
| Approved player assigned to match | Request private room API before connect time | Only availability and release time; no server credentials |
| Approved player after connect time | Request private room API | Address, map and decrypted password returned only to authorized session |
| Captain of another match | Request private room API | 403 |
| Blocked participant | Request private room API | 403 |
| Owner without MFA AAL2 | Save room settings | Rejected |
| Authorized owner with MFA AAL2 | Save room settings | Ciphertext stored (prefix `enc1:`); response never contains plaintext |
| Authorized player | Click “Копировать connect” | Clipboard contains `connect HOST:PORT`, not password |
| Authorized player | Click “Копировать пароль” | Clipboard contains password only after authorization |

Check raw HTTP requests, not only hidden buttons. Do not share passwords in screenshots or issue reports. Inspect network caching: `Cache-Control: no-store` on private responses.

## Evidence and sign-off

Record test date, staging project identifier, frontend deployment commit SHA, test accounts' roles (not tokens), screenshots with secrets redacted, HTTP statuses and reproducible failures. Passing isolated CI is **not** proof of these browser outcomes.

### Remaining release blockers

- No verified real staging deployment and end-to-end browser run yet.
- Encryption key backup/rotation and recovery procedure require review.
- No real MatchZy server callback has been tested.
- Production backup/restore, owner MFA, WAF and separate migration/release authorization remain mandatory.
