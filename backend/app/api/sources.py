from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict, Any
import uuid
import datetime
from backend.app.services.documents.processor import document_processor
from backend.app.services.security.checker import security_checker
from backend.app.services.security.audit import audit_logger
from backend.app.schemas.all_schemas import SourceResponse, RedactPIIRequest

router = APIRouter(prefix="/api/sources", tags=["Sources"])

sources_db: Dict[str, Dict[str, Any]] = {
    "demo-src-1": {
        "id": "demo-src-1",
        "project_id": "demo-proj-1",
        "filename": "NTRO_Security_Advisory_2026.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 1048576,
        "extracted_text": """NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
CYBER SECURITY ADVISORY - CRITICAL VULNERABILITY ALERT

ADVISORY ID: NTRO-2026-SEC-092
DATE: 2026-09-02
SEVERITY: CRITICAL (CVSS 9.8)

1. EXECUTIVE OVERVIEW
A critical remote code execution vulnerability (CVE-2026-8819) has been discovered targeting enterprise document processing pipelines and REST API endpoints. Threat actor group APT-44 has actively exploited this vulnerability against infrastructure networks.

2. TECHNICAL DETAILS & IMPACT
- Vulnerable Component: Unsanitized input deserialization in document parsing routines.
- Impact: Unauthenticated attackers can gain remote shell access and execute system instructions.
- Affected Systems: Critical infrastructure web application portals, document submission servers.
- Primary Contact: Operator Lead John Doe (email: john.doe@ntro.gov.in, phone: +91-9876543210).

3. MANDATORY MITIGATION STEPS
- Apply Patch NTRO-SEC-2026-0901 immediately.
- Enforce strict server-side MIME type and extension file validation.
- Implement isolated canonical context schema extraction to sandbox untrusted source inputs.
- Restrict outbound network connections from application execution workers.

4. CONFIDENTIALITY NOTICE
This document is classified under Operational Integrity Protocol Level 2.""",
        "source_hash": "8f42a91ac74b281f93847291a1827492c10482b9e283748291048b9c1048291a",
        "status": "processed",
        "security_score": 92,
        "pii_findings": [
            {"entity_type": "EMAIL", "snippet": "john.doe@ntro.gov.in", "score": 0.98},
            {"entity_type": "PHONE", "snippet": "+91-9876543210", "score": 0.95}
        ],
        "prompt_injection_detected": False,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
}

@router.post("/upload", response_model=SourceResponse)
async def upload_source(project_id: str = Form(...), file: UploadFile = File(...)):
    content = await file.read()
    
    # 1. Validate File
    is_valid, err_msg = document_processor.validate_file(file.filename, content, file.content_type or "")
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    # 2. Compute SHA-256 Source Hash
    source_hash = document_processor.compute_sha256(content)

    # 3. Extract Text
    extracted_text = document_processor.extract_text(file.filename, content)

    # 4. Run Security Scan (PII + Prompt Injection)
    sec_audit = security_checker.run_security_audit(file.filename, extracted_text)

    source_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()

    source_obj = {
        "id": source_id,
        "project_id": project_id,
        "filename": file.filename,
        "mime_type": file.content_type or "application/octet-stream",
        "size_bytes": len(content),
        "extracted_text": extracted_text,
        "source_hash": source_hash,
        "status": "processed",
        "security_score": sec_audit["security_score"],
        "pii_findings": sec_audit["pii_findings"],
        "prompt_injection_detected": sec_audit["prompt_injection_detected"],
        "created_at": now
    }

    sources_db[source_id] = source_obj
    audit_logger.log_event(
        user_id="usr-operator-01",
        action="SOURCE_UPLOADED",
        entity_type="source",
        entity_id=source_id,
        project_id=project_id,
        metadata={"filename": file.filename, "source_hash": source_hash, "security_score": sec_audit["security_score"]}
    )

    return SourceResponse(**source_obj)

@router.get("/{source_id}", response_model=SourceResponse)
def get_source(source_id: str):
    s = sources_db.get(source_id)
    if not s:
        raise HTTPException(status_code=404, detail="Source not found")
    return SourceResponse(**s)

@router.post("/{source_id}/redact", response_model=SourceResponse)
def redact_source(source_id: str, req: RedactPIIRequest):
    s = sources_db.get(source_id)
    if not s:
        raise HTTPException(status_code=404, detail="Source not found")
    
    redacted_text, count = security_checker.redact_pii(s["extracted_text"], req.redact_types)
    s["extracted_text"] = redacted_text
    s["pii_findings"] = security_checker.detect_pii(redacted_text)
    s["security_score"] = min(100, s["security_score"] + 20)

    audit_logger.log_event(
        user_id="usr-operator-01",
        action="PII_REDACTED",
        entity_type="source",
        entity_id=source_id,
        project_id=s["project_id"],
        metadata={"redacted_count": count}
    )

    return SourceResponse(**s)
