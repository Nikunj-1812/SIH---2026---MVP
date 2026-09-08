import asyncio
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["max_login_attempts"] == 5
    assert data["max_generation_attempts"] == 3
    print("[PASS] Health Check Passed")

def test_auth_login_and_rate_limit():
    # Success Login
    res = client.post("/api/auth/login", json={"email": "operator@ntro.gov.in", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "Operator"
    assert "token" in data

    # 5 Failed Attempts Trigger Lock
    bad_email = "testlock@ntro.gov.in"
    for i in range(4):
        res_fail = client.post("/api/auth/login", json={"email": bad_email, "password": "wrongpassword"})
        assert res_fail.status_code == 401
    
    # 5th attempt triggers 429 Too Many Requests Lock
    res_locked = client.post("/api/auth/login", json={"email": bad_email, "password": "wrongpassword"})
    assert res_locked.status_code == 429
    assert "locked" in res_locked.json()["detail"].lower()
    print("[PASS] Auth & 5-Attempt Rate Limiting Lock Passed")

def test_projects_crud():
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1

    res_create = client.post("/api/projects", json={"name": "Test Project", "description": "Test description"})
    assert res_create.status_code == 200
    created = res_create.json()
    assert created["name"] == "Test Project"
    print("[PASS] Projects CRUD Passed")

def test_document_and_security_pipeline():
    # Test uploading source file
    file_content = b"CRITICAL SECURITY ADVISORY 2026\nVulnerability discovered in REST server.\nContact: admin@ntro.gov.in, phone: +91-9999999999."
    files = {"file": ("advisory_test.txt", file_content, "text/plain")}
    data = {"project_id": "demo-proj-1"}
    
    res_upload = client.post("/api/sources/upload", data=data, files=files)
    assert res_upload.status_code == 200
    source_data = res_upload.json()
    assert source_data["filename"] == "advisory_test.txt"
    assert len(source_data["pii_findings"]) >= 1

    # Test PII Redaction
    source_id = source_data["id"]
    res_redact = client.post(f"/api/sources/{source_id}/redact", json={"source_id": source_id})
    assert res_redact.status_code == 200
    redacted_data = res_redact.json()
    assert "[EMAIL_REDACTED]" in redacted_data["extracted_text"] or "[PHONE_REDACTED]" in redacted_data["extracted_text"] or len(redacted_data["pii_findings"]) == 0
    print("[PASS] Document Extraction & PII Redaction Pipeline Passed")

def test_generation_and_integrity_pipeline():
    req_payload = {
        "project_id": "demo-proj-1",
        "source_id": "demo-src-1",
        "outputs": ["executive_summary", "advisory", "linkedin", "x_thread", "infographic"],
        "config": {
            "audience": "Executive",
            "tone": "Formal",
            "language": "English",
            "detail": "Standard"
        }
    }
    
    res_gen = client.post("/api/generation", json=req_payload)
    assert res_gen.status_code == 200
    gen_data = res_gen.json()
    assert gen_data["status"] in ["completed", "needs_review"]
    assert len(gen_data["outputs"]) >= 4
    
    # Test Output Export
    output_id = gen_data["outputs"][0]["id"]
    res_export = client.get(f"/api/outputs/{output_id}/export?format=txt")
    assert res_export.status_code == 200
    assert len(res_export.content) > 20

    # Test Integrity Verification
    res_verify = client.post(f"/api/integrity/{output_id}/verify", json={"output_id": output_id, "current_content": gen_data["outputs"][0]["content"]})
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["verified"] == True
    assert verify_data["blockchain_status"] in ["ANCHORED", "NOT_CONFIGURED (Fabric Gateway Standby)", "NOT_CONFIGURED (Mock / Reference Mode)"]
    print("[PASS] Multi-Output LangGraph Generation, Export & Integrity Verification Passed")

if __name__ == "__main__":
    test_health_check()
    test_auth_login_and_rate_limit()
    test_projects_crud()
    test_document_and_security_pipeline()
    test_generation_and_integrity_pipeline()
    print("\n==========================================")
    print(" ALL CORE INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==========================================")
