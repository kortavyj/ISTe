import unittest
from urllib.parse import quote
from scripts.validate_iste_dev_backup_url import check_url

REF="jwzsawumiadlfxarvauc"
class ValidatorTests(unittest.TestCase):
    def test_direct(self):
        self.assertIsNone(check_url(f"postgresql://postgres:pw@db.{REF}.supabase.co:5432/postgres?sslmode=require"))
    def test_session_pooler(self):
        self.assertIsNone(check_url(f"postgresql://postgres.{REF}:pw@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"))
    def test_transaction_pooler(self):
        self.assertIsNone(check_url(f"postgresql://postgres.{REF}:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"))
    def test_encoded_password(self):
        self.assertIsNone(check_url(f"postgresql://postgres:{quote('a@b?c',safe='')}@db.{REF}.supabase.co/postgres?sslmode=require"))
    def test_wrong_project(self):
        self.assertEqual(check_url("postgresql://postgres.badproject:pw@aws-0-eu-central-1.pooler.supabase.com/postgres?sslmode=require"),"DEV_PROJECT_IDENTITY_MISMATCH")
    def test_fake_pooler_host(self):
        self.assertEqual(check_url(f"postgresql://postgres.{REF}:pw@evil.pooler.supabase.com.attacker.test/postgres?sslmode=require"),"DEV_PROJECT_IDENTITY_MISMATCH")
    def test_no_password(self):
        self.assertEqual(check_url(f"postgresql://postgres@db.{REF}.supabase.co/postgres?sslmode=require"),"MISSING_PASSWORD")
    def test_ssl(self):
        self.assertEqual(check_url(f"postgresql://postgres:pw@db.{REF}.supabase.co/postgres"),"SSL_REQUIRED")
    def test_db(self):
        self.assertEqual(check_url(f"postgresql://postgres:pw@db.{REF}.supabase.co/other?sslmode=require"),"INVALID_DB_NAME")
    def test_non_postgres(self):
        self.assertEqual(check_url("https://test"),"INVALID_SCHEME")
if __name__=="__main__":
    unittest.main()
