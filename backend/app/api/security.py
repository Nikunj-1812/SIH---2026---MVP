from fastapi import APIRouter, HTTPException
from backend.app.schemas.all_schemas import SecurityReportResponse
from backend.app.api.sources import sources_db
from backend.app.services.security.checker import security_checker

router = APIRouter(prefix="/api/security", tags=["Security"])

@router.get("/sources/{source_id}", response_model=SecurityReportResponse)
def get_source_security_report(source_id: str):
    source = sources_db.get(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source document not found.")

    sec_audit = security_checker.run_security_audit(source["filename"], source["extracted_text"])

    return SecurityReportResponse(
        source_id=source_id,
        file_security=sec_audit["file_security"],
        file_validation_passed=sec_audit["file_validation_passed"],
        pii_count=sec_audit["pii_count"],
        pii_findings=sec_audit["pii_findings"],
        prompt_injection_detected=sec_audit["prompt_injection_detected"],
        security_score=sec_audit["security_score"],
        security_checks_matrix=sec_audit["security_checks_matrix"]
    )
