import uuid
import datetime
from typing import Dict, Any, List
from backend.app.config import settings
from backend.app.services.documents.processor import document_processor
from backend.app.services.security.checker import security_checker
from backend.app.services.ai.canonical import canonical_engine
from backend.app.services.generation.engine import generation_engine
from backend.app.services.generation.validator import output_validator
from backend.app.schemas.all_schemas import (
    GenerationRequest, GenerationJobResponse, OutputItem, CanonicalContext
)

class LangGraphWorkflowRunner:
    def __init__(self):
        self.max_attempts = settings.MAX_GENERATION_ATTEMPTS  # 3 attempts limit

    async def execute_transformation_pipeline(
        self,
        request: GenerationRequest,
        source_filename: str,
        extracted_text: str,
        user_id: str
    ) -> GenerationJobResponse:
        
        job_id = str(uuid.uuid4())
        created_at = datetime.datetime.utcnow().isoformat()

        # Step 1: Security Check
        sec_audit = security_checker.run_security_audit(source_filename, extracted_text)
        if sec_audit["file_security"] == "REJECTED":
            return GenerationJobResponse(
                job_id=job_id,
                project_id=request.project_id,
                source_id=request.source_id,
                status="failed",
                attempt_count=1,
                error_message="Security Check Failed: Prompt injection detected in source document.",
                created_at=created_at,
                completed_at=datetime.datetime.utcnow().isoformat()
            )

        # Step 2: Canonical Context Creation (Understand once from actual extracted text)
        canonical_ctx = await canonical_engine.build_canonical_context(extracted_text, source_filename)

        # Step 3: Multi-Output Generation Loop with Attempt Limit (Max 3)
        attempt_count = 0
        final_outputs: List[OutputItem] = []
        is_all_valid = False

        while attempt_count < self.max_attempts and not is_all_valid:
            attempt_count += 1
            generated_items: List[OutputItem] = []
            all_valid_this_attempt = True

            for output_type in request.outputs:
                item = await generation_engine.generate_single_output(
                    output_type=output_type,
                    context=canonical_ctx,
                    config=request.config,
                    job_id=job_id,
                    project_id=request.project_id
                )
                
                # Validate output
                valid, issues = output_validator.validate_output(output_type, item.content, canonical_ctx)
                item.validation_status = "valid" if valid else "needs_review"
                item.validation_issues = issues

                if not valid:
                    all_valid_this_attempt = False

                generated_items.append(item)

            final_outputs = generated_items
            if all_valid_this_attempt:
                is_all_valid = True
                break

        # Determine Final Job Status
        final_status = "completed" if is_all_valid else "needs_review"

        return GenerationJobResponse(
            job_id=job_id,
            project_id=request.project_id,
            source_id=request.source_id,
            status=final_status,
            attempt_count=attempt_count,
            canonical_context=canonical_ctx,
            outputs=final_outputs,
            error_message=None if is_all_valid else f"Validation warnings flagged after {attempt_count} attempts. Please review generated outputs.",
            created_at=created_at,
            completed_at=datetime.datetime.utcnow().isoformat()
        )

workflow_runner = LangGraphWorkflowRunner()
