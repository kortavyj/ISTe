from pathlib import Path
import unittest

ROOT = Path("supabase/rollout/tournaments-v2")
MIGRATIONS = Path("supabase/migrations")
FILES = [
 "20261014_iste_tournaments_v2_foundation.sql",
 "20261014_iste_tournament_owner_create_rpc.sql",
 "20261014_iste_tournament_team_apply_rpc.sql",
 "20261014_iste_tournament_team_review_rpc.sql",
 "20261014_iste_tournament_owner_list_teams_rpc.sql",
 "20261014_iste_tournament_generate_bracket_rpc.sql",
 "20261014_iste_tournament_confirm_match_rpc.sql",
 "20261014_iste_tournament_owner_get_bracket_rpc.sql",
 "20261014_iste_tournament_status_transition_rpc.sql",
 "20261014_iste_tournament_owner_list_all_rpc.sql",
]
class RolloutSafety(unittest.TestCase):
 def test_all_migrations_present_and_documented_in_order(self):
  content=(ROOT/"README.md").read_text()
  indices=[content.index("`"+name+"`") for name in FILES]
  self.assertEqual(indices,sorted(indices))
  for name in FILES:
   self.assertTrue((MIGRATIONS/name).is_file(),name)
 def test_preflight_does_not_mutate(self):
  sql=(ROOT/"dev-preflight-readonly.sql").read_text().lower()
  import re
  no_comments="\n".join(line for line in sql.splitlines() if not line.lstrip().startswith("--"))
  for keyword in ["create ","alter ","drop ","insert ","update ","delete ","truncate ","grant ","revoke "]:
   self.assertNotRegex(no_comments,r"\b"+keyword.strip()+r"\s")
 def test_explicit_approval_and_no_blind_rollback(self):
  doc=(ROOT/"README.md").read_text()
  self.assertIn("explicit owner approval",doc)
  self.assertIn("not include an executable DROP script",doc)
if __name__=="__main__":unittest.main()
