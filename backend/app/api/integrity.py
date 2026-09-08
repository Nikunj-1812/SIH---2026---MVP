from fastapi import APIRouter, HTTPException
from backend.app.schemas.all_schemas import IntegrityRecordResponse, IntegrityVerifyRequest
from backend.app.services.integrity.engine import integrity_engine
from backend.app.api.generation import outputs_db
from backend.app.services.security.audit import audit_logger

router = APIRouter(prefix="/api/integrity", tags=["Integrity"])

@router.get("/{output_id}", response_model=IntegrityRecordResponse)
def get_integrity_record(output_id: str):
    item = outputs_db.get(output_id)
    content = item.content if item else "Sample content"
    return integrity_engine.verify_output_integrity(output_id, content)

@router.post("/{output_id}/verify", response_model=IntegrityRecordResponse)
def verify_output_integrity(output_id: str, req: IntegrityVerifyRequest):
    result = integrity_engine.verify_output_integrity(output_id, req.current_content)
    
    audit_logger.log_event(
        user_id="usr-operator-01",
        action="INTEGRITY_VERIFIED",
        entity_type="output",
        entity_id=output_id,
        metadata={"verified": result.verified, "status": result.blockchain_status}
    )

    return result
