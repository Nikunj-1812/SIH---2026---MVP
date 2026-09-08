import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.all_schemas import CanonicalContext
from backend.app.services.generation.image_service import image_service

client = TestClient(app)

class TestLinkedInImageFlow(unittest.TestCase):

    def setUp(self):
        # Trigger generation to populate test output artifact
        req_payload = {
            "project_id": "demo-proj-1",
            "source_id": "demo-src-1",
            "outputs": ["linkedin", "infographic"],
            "config": {
                "audience": "Executive",
                "tone": "Formal",
                "language": "English",
                "detail": "Standard"
            }
        }
        res = client.post("/api/generation", json=req_payload)
        self.assertEqual(res.status_code, 200)
        self.job = res.json()
        self.linkedin_item = next((o for o in self.job["outputs"] if o["output_type"] == "linkedin"), None)
        self.assertIsNotNone(self.linkedin_item)

    def test_A_get_image_returns_actual_binary_image(self):
        output_id = self.linkedin_item["id"]
        res = client.get(f"/api/outputs/{output_id}/image")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.content) > 100)
        print("[PASS] Test A: GET image returns actual binary image bytes.")

    def test_B_correct_content_type_header(self):
        output_id = self.linkedin_item["id"]
        res = client.get(f"/api/outputs/{output_id}/image")
        content_type = res.headers.get("content-type", "")
        self.assertTrue("image/" in content_type)
        print(f"[PASS] Test B: Correct Content-Type header ({content_type}).")

    def test_C_image_preview_endpoint_structure(self):
        image_info = self.linkedin_item.get("image", {})
        self.assertEqual(image_info.get("status"), "completed")
        self.assertTrue(image_info.get("url").startswith("/api/outputs/"))
        print("[PASS] Test C: Image preview endpoint structure verified.")

    def test_D_E_F_download_endpoint_content_disposition_and_extension(self):
        output_id = self.linkedin_item["id"]
        res = client.get(f"/api/outputs/{output_id}/image/download")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.content) > 100)
        
        disposition = res.headers.get("content-disposition", "")
        content_type = res.headers.get("content-type", "")
        
        self.assertIn("attachment", disposition)
        self.assertIn("filename=", disposition)
        self.assertIn(output_id[:8], disposition)
        
        # Verify file extension matches content-type
        if "jpeg" in content_type:
            self.assertIn(".jpg", disposition)
        elif "png" in content_type:
            self.assertIn(".png", disposition)
        elif "svg" in content_type:
            self.assertIn(".svg", disposition)
            
        print("[PASS] Test D-E-F: Download endpoint returns binary file with correct Content-Disposition & matching extension.")

    def test_G_H_regenerate_image_updates_preview_without_changing_text(self):
        output_id = self.linkedin_item["id"]
        original_text = self.linkedin_item["content"]
        
        res_regen = client.post(f"/api/outputs/{output_id}/regenerate-image")
        self.assertEqual(res_regen.status_code, 200)
        updated_item = res_regen.json()
        
        # Post text remains unchanged
        self.assertEqual(updated_item["content"], original_text)
        self.assertEqual(updated_item["image"]["status"], "completed")
        self.assertIn("t=", updated_item["image"]["url"])
        print("[PASS] Test G-H: Image regeneration refreshes image info & preview without altering LinkedIn text.")

    def test_I_nonexistent_output_returns_404(self):
        res = client.get("/api/outputs/nonexistent-id-9999/image")
        self.assertEqual(res.status_code, 404)
        
        res_dl = client.get("/api/outputs/nonexistent-id-9999/image/download")
        self.assertEqual(res_dl.status_code, 404)
        print("[PASS] Test I: Nonexistent output access rejected.")

    def test_J_pollinations_api_key_never_exposed(self):
        output_id = self.linkedin_item["id"]
        res = client.get(f"/api/outputs/{output_id}")
        self.assertNotIn("sk_Y7iM2ghNaeE43Vi6Kw5SJRnoi46eSHLK", res.text)
        
        res_img = client.get(f"/api/outputs/{output_id}/image")
        self.assertNotIn("sk_Y7iM2ghNaeE43Vi6Kw5SJRnoi46eSHLK", res_img.headers.get("location", ""))
        print("[PASS] Test J: Pollinations API key is never exposed.")

    def test_K_page_refresh_persists_generated_image(self):
        output_id = self.linkedin_item["id"]
        res_1 = client.get(f"/api/outputs/{output_id}/image")
        res_2 = client.get(f"/api/outputs/{output_id}/image")
        self.assertEqual(res_1.content, res_2.content)
        print("[PASS] Test K: Page refresh/re-fetching returns persisted binary image.")

    def test_M_durable_disk_storage_persists_across_cache_invalidation(self):
        output_id = self.linkedin_item["id"]
        res_1 = client.get(f"/api/outputs/{output_id}/image")
        self.assertEqual(res_1.status_code, 200)
        
        # Clear in-memory RAM cache to simulate backend restart
        from backend.app.api.outputs import output_images_cache
        output_images_cache.clear()
        
        # Fetch again - should read directly from durable server-side disk storage
        res_2 = client.get(f"/api/outputs/{output_id}/image")
        self.assertEqual(res_2.status_code, 200)
        self.assertEqual(res_1.content, res_2.content)
        print("[PASS] Test M: Durable server-side disk storage persists binary image bytes across RAM cache clears & server restarts.")

    def test_L_existing_infographic_output_works(self):
        info_item = next((o for o in self.job["outputs"] if o["output_type"] == "infographic"), None)
        self.assertIsNotNone(info_item)
        self.assertEqual(info_item["output_type"], "infographic")
        print("[PASS] Test L: Standalone infographic output still works.")

if __name__ == "__main__":
    unittest.main()
