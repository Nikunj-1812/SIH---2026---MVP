from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import uuid
import datetime
from backend.app.schemas.all_schemas import ProjectCreate, ProjectResponse, SystemStatsResponse
from backend.app.services.security.audit import audit_logger
from backend.app.api.sources import sources_db
from backend.app.api.generation import outputs_db
from backend.app.services.integrity.engine import integrity_engine

router = APIRouter(prefix="/api/projects", tags=["Projects"])

# In-memory database of projects (with seed demo data)
projects_db: Dict[str, Dict[str, Any]] = {
    "demo-proj-1": {
        "id": "demo-proj-1",
        "name": "SIH 2026 Advisory Transformation",
        "description": "Secure GenAI transformation of NTRO Cyber Security Operational Advisory report into multi-channel outputs.",
        "owner_id": "usr-operator-01",
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat(),
        "source_count": 1,
        "output_count": 5,
        "approved_count": 0
    }
}

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    result = []
    for p in projects_db.values():
        p_copy = dict(p)
        p_outputs = [i for i in outputs_db.values() if getattr(i, "project_id", "") == p["id"]]
        p_copy["output_count"] = len(p_outputs) if p_outputs else p.get("output_count", 0)
        p_copy["approved_count"] = len([i for i in p_outputs if getattr(i, "approval_status", "") == "APPROVED"])
        result.append(ProjectResponse(**p_copy))
    return result

@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats():
    sources_count = len(sources_db)
    outputs_count = len(outputs_db)
    approved_count = len([i for i in outputs_db.values() if getattr(i, "approval_status", "") == "APPROVED"])
    integrity_count = len(integrity_engine.records_db)
    return SystemStatsResponse(
        active_projects_count=len(projects_db),
        sources_processed_count=sources_count if sources_count > 0 else 1,
        outputs_generated_count=outputs_count if outputs_count > 0 else 5,
        integrity_anchors_count=integrity_count if integrity_count > 0 else 5,
        approved_outputs_count=approved_count
    )

@router.post("", response_model=ProjectResponse)
def create_project(req: ProjectCreate):
    proj_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()
    project = {
        "id": proj_id,
        "name": req.name,
        "description": req.description or "",
        "owner_id": "usr-operator-01",
        "created_at": now,
        "updated_at": now,
        "source_count": 0,
        "output_count": 0,
        "approved_count": 0
    }
    projects_db[proj_id] = project
    audit_logger.log_event(user_id="usr-operator-01", action="PROJECT_CREATED", entity_type="project", entity_id=proj_id, project_id=proj_id)
    return ProjectResponse(**project)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    p = projects_db.get(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    p_copy = dict(p)
    p_outputs = [i for i in outputs_db.values() if getattr(i, "project_id", "") == project_id]
    p_copy["output_count"] = len(p_outputs) if p_outputs else p.get("output_count", 0)
    p_copy["approved_count"] = len([i for i in p_outputs if getattr(i, "approval_status", "") == "APPROVED"])
    return ProjectResponse(**p_copy)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    if project_id in projects_db:
        del projects_db[project_id]
        audit_logger.log_event(user_id="usr-operator-01", action="PROJECT_DELETED", entity_type="project", entity_id=project_id)
        return {"status": "deleted", "id": project_id}
    raise HTTPException(status_code=404, detail="Project not found")
