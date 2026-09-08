from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.app.schemas.all_schemas import GenerationRequest, GenerationJobResponse
from backend.app.api.sources import sources_db
from backend.app.services.ai.workflow import workflow_runner
from backend.app.services.integrity.engine import integrity_engine
from backend.app.services.security.audit import audit_logger

router = APIRouter(prefix="/api/generation", tags=["Generation"])

jobs_db: Dict[str, GenerationJobResponse] = {}
outputs_db: Dict[str, Any] = {}

@router.post("", response_model=GenerationJobResponse)
async def start_generation(req: GenerationRequest):
    source = sources_db.get(req.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source document not found.")

    audit_logger.log_event(
        user_id="usr-operator-01",
        action="GENERATION_STARTED",
        entity_type="generation_job",
        project_id=req.project_id,
        metadata={"requested_outputs": req.outputs, "audience": req.config.audience, "tone": req.config.tone}
    )

    # Execute LangGraph Workflow Pipeline passing extracted text directly
    job_response = await workflow_runner.execute_transformation_pipeline(
        request=req,
        source_filename=source["filename"],
        extracted_text=source["extracted_text"],
        user_id="usr-operator-01"
    )

    # Register SHA-256 integrity anchors for generated outputs
    for item in job_response.outputs:
        outputs_db[item.id] = item
        integrity_engine.register_integrity_anchor(
            output_id=item.id,
            source_hash=source["source_hash"],
            output_content=item.content
        )

    jobs_db[job_response.job_id] = job_response

    audit_logger.log_event(
        user_id="usr-operator-01",
        action="GENERATION_COMPLETED",
        entity_type="generation_job",
        entity_id=job_response.job_id,
        project_id=req.project_id,
        metadata={"status": job_response.status, "attempts": job_response.attempt_count, "output_count": len(job_response.outputs)}
    )

    return job_response

@router.get("/{job_id}", response_model=GenerationJobResponse)
def get_job_status(job_id: str):
    j = jobs_db.get(job_id)
    if not j:
        raise HTTPException(status_code=404, detail="Generation job not found.")
    return j
