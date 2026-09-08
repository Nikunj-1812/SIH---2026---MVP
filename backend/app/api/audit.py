from fastapi import APIRouter, Query
from typing import List, Optional
from backend.app.schemas.all_schemas import AuditLogResponse
from backend.app.services.security.audit import audit_logger

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(project_id: Optional[str] = Query(None), limit: int = 50):
    return audit_logger.get_logs(project_id=project_id, limit=limit)
