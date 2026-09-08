from fastapi import APIRouter
from typing import Dict, Any
from backend.app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=Dict[str, Any])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "llm_provider": settings.TEXT_LLM_PROVIDER,
        "llm_model": settings.TEXT_LLM_MODEL,
        "image_provider": settings.IMAGE_PROVIDER,
        "image_model": settings.POLLINATIONS_IMAGE_MODEL,
        "max_login_attempts": settings.MAX_LOGIN_ATTEMPTS,
        "max_generation_attempts": settings.MAX_GENERATION_ATTEMPTS,
        "security_features": {
            "file_validation": settings.ENABLE_FILE_VALIDATION,
            "pii_detection": settings.ENABLE_PII_DETECTION,
            "prompt_injection": settings.ENABLE_PROMPT_INJECTION_CHECK,
            "output_validation": settings.ENABLE_OUTPUT_VALIDATION,
            "integrity_hash": settings.ENABLE_INTEGRITY_HASH
        }
    }
