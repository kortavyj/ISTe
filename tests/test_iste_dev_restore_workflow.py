from pathlib import Path
import yaml
import unittest

DEV = Path(".github/workflows/iste-verify-dev-backup-restore.yml")
PROD = Path(".github/workflows/iste-verify-backup-restore.yml")

class DevRestoreWorkflowTests(unittest.TestCase):
    def test_dev_workflow_is_manual_and_isolated(self):
        s = DEV.read_text()
        workflow = yaml.safe_load(s)
        self.assertIn('jobs', workflow)
        self.assertEqual(len(workflow['jobs']), 1)
        self.assertEqual(len(workflow['jobs']['verify']['steps']), 7)
        self.assertEqual(s.count('      - name: Retrieve newest encrypted backup'), 1)
        self.assertIn("workflow_dispatch:", s)
        self.assertNotIn("pull_request:", s)
        self.assertIn("iste_drive:DEV/", s)
        self.assertIn("iste-dev-jwzsawumiadlfxarvauc-", s)
        self.assertNotIn("iste-supabase-", s)
        self.assertIn("postgres:17-alpine", s)
        self.assertIn("pg_restore --list", s)
        self.assertIn("--section=pre-data --section=data", s)
        self.assertIn("iste_restore_test", s)
        self.assertIn("if: always()", s)

    def test_production_restore_workflow_untouched(self):
        self.assertIn("iste-supabase-", PROD.read_text())
        self.assertNotIn("iste_drive:DEV/", PROD.read_text())

if __name__ == "__main__":
    unittest.main()
