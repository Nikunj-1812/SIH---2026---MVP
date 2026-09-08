from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user_id: str
    email: str
    full_name: str
    role: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "Operator"

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    created_at: str
    updated_at: str
    source_count: int = 0
    output_count: int = 0
    approved_count: int = 0

class SystemStatsResponse(BaseModel):
    active_projects_count: int
    sources_processed_count: int
    outputs_generated_count: int
    integrity_anchors_count: int
    approved_outputs_count: int

# --- Source Schemas ---
class SourceResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    mime_type: str
    size_bytes: int
    extracted_text: str
    source_hash: str
    status: str
    security_score: int = 100
    pii_findings: List[Dict[str, Any]] = []
    prompt_injection_detected: bool = False
    created_at: str

class RedactPIIRequest(BaseModel):
    source_id: str
    redact_types: Optional[List[str]] = None

# --- Canonical Context Schema ---
class CanonicalContext(BaseModel):
    title: str
    summary: str
    key_facts: List[str] = []
    entities: List[str] = []
    dates: List[str] = []
    locations: List[str] = []
    numbers: List[str] = []
    risks: List[str] = []
    recommendations: List[str] = []
    actions: List[str] = []
    source_sections: List[str] = []
    uncertainties: List[str] = []

# --- Generation Schemas ---
class GenerationConfig(BaseModel):
    audience: str = "Executive"  # Executive, Technical, General Public, Security Team
    tone: str = "Formal"        # Formal, Neutral, Urgent, Educational
    language: str = "English"   # English, Hindi
    detail: str = "Standard"    # Brief, Standard, Detailed

class GenerationRequest(BaseModel):
    project_id: str
    source_id: str
    outputs: List[str]          # executive_summary, advisory, linkedin, x_thread, presentation, infographic
    config: GenerationConfig

class OutputImageInfo(BaseModel):
    status: str = "completed"   # PENDING, GENERATING, COMPLETED, FAILED
    url: Optional[str] = None
    download_url: Optional[str] = None
    content_type: str = "image/jpeg"
    filename: str = ""
    provider: str = "pollinations"
    model: str = "qwen-image"
    error: Optional[str] = None

class OutputItem(BaseModel):
    id: str
    generation_job_id: str
    project_id: str
    output_type: str
    title: str
    content: str
    image_url: Optional[str] = None
    image: Optional[OutputImageInfo] = None
    status: str = "completed"
    approval_status: str = "DRAFT" # DRAFT, IN_REVIEW, APPROVED, REJECTED, CHANGES_REQUESTED
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    validation_status: str = "valid"
    validation_issues: List[str] = []
    output_hash: str
    created_at: str
    updated_at: str

class GenerationJobResponse(BaseModel):
    job_id: str
    project_id: str
    source_id: str
    status: str                 # queued, processing, completed, failed, needs_review
    attempt_count: int
    canonical_context: Optional[CanonicalContext] = None
    outputs: List[OutputItem] = []
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

# --- Output Management Schemas ---
class OutputUpdateRequest(BaseModel):
    content: str

class OutputReviewRequest(BaseModel):
    status: str                 # approved, rejected, needs_revision
    comment: Optional[str] = ""

class OutputApprovalRequest(BaseModel):
    approval_status: str        # APPROVED, REJECTED, DRAFT, CHANGES_REQUESTED
    approved_by: Optional[str] = "Operator User"
    comment: Optional[str] = ""

# --- Security & Integrity Schemas ---
class SecurityReportResponse(BaseModel):
    source_id: str
    file_security: str          # SAFE, WARNING, REJECTED
    file_validation_passed: bool
    pii_count: int
    pii_findings: List[Dict[str, Any]]
    prompt_injection_detected: bool
    security_score: int
    security_checks_matrix: Dict[str, str]

class IntegrityRecordResponse(BaseModel):
    output_id: str
    source_hash: str
    output_hash: str
    blockchain_status: str     # ANCHORED, PENDING, NOT_CONFIGURED, UNAVAILABLE, TAMPER_DETECTED
    network: str = "Hyperledger Fabric (integrity-channel / Org1MSP)"
    channel_name: str = "integrity-channel"
    chaincode_name: str = "integrity-anchor"
    organization: str = "Org1MSP"
    tx_hash: Optional[str] = None
    transaction_id: Optional[str] = None
    block_number: Optional[int] = None
    timestamp: str
    verified: bool

class IntegrityVerifyRequest(BaseModel):
    output_id: str
    current_content: str

# --- Audit Schemas ---
class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str
