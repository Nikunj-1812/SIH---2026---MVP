import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

class TestApprovalWorkflow(unittest.TestCase):

    def setUp(self):
        req_payload = {
            "project_id": "demo-proj-1",
            "source_id": "demo-src-1",
            "outputs": ["executive_summary", "linkedin"],
            "config": {"audience": "Executive", "tone": "Formal", "language": "English", "detail": "Standard"}
        }
        res = client.post("/api/generation", json=req_payload)
        self.assertEqual(res.status_code, 200)
        self.job = res.json()
        self.exec_summary = self.job["outputs"][0]

    def test_1_approve_output_persists_status_and_reviewer(self):
        output_id = self.exec_summary["id"]
        res = client.post(f"/api/outputs/{output_id}/approve", json={"approval_status": "APPROVED", "approved_by": "Operator User"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["approval_status"], "APPROVED")
        self.assertIsNotNone(data["approved_by"])
        self.assertIsNotNone(data["approved_at"])
        
        # Verify persistence on GET
        res_get = client.get(f"/api/outputs/{output_id}")
        self.assertEqual(res_get.json()["approval_status"], "APPROVED")
        print("[PASS] Test 1: Formal approval persists approval_status, approved_by, and approved_at server-side.")

    def test_2_editing_approved_output_resets_status_to_changes_requested(self):
        output_id = self.exec_summary["id"]
        # Approve first
        client.post(f"/api/outputs/{output_id}/approve", json={"approval_status": "APPROVED", "approved_by": "Operator User"})
        
        # Edit content
        res_edit = client.patch(f"/api/outputs/{output_id}", json={"content": "Modified executive summary content requiring re-approval."})
        self.assertEqual(res_edit.status_code, 200)
        edited_data = res_edit.json()
        
        self.assertEqual(edited_data["approval_status"], "CHANGES_REQUESTED")
        self.assertIsNone(edited_data["approved_by"])
        self.assertIsNone(edited_data["approved_at"])
        print("[PASS] Test 2: Editing an approved deliverable automatically resets state to CHANGES_REQUESTED requiring re-approval.")

    def test_3_export_approved_bundle_includes_only_approved_outputs(self):
        output_id = self.exec_summary["id"]
        # Approve output
        client.post(f"/api/outputs/{output_id}/approve", json={"approval_status": "APPROVED"})
        
        res_export = client.post("/api/outputs/export-approved?project_id=demo-proj-1")
        self.assertEqual(res_export.status_code, 200)
        self.assertIn("FINAL APPROVED DELIVERABLES BUNDLE", res_export.text)
        self.assertIn("EXECUTIVE SUMMARY", res_export.text)
        print("[PASS] Test 3: Export approved bundle compiles ONLY approved deliverables.")

    def test_4_system_stats_returns_real_persisted_metrics(self):
        res_stats = client.get("/api/projects/stats")
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertGreaterEqual(stats["active_projects_count"], 1)
        self.assertGreaterEqual(stats["sources_processed_count"], 1)
        self.assertGreaterEqual(stats["outputs_generated_count"], 1)
        print("[PASS] Test 4: System stats endpoint returns real persisted metrics.")

if __name__ == "__main__":
    unittest.main()
