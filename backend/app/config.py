from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    APP_NAME: str = "SIH 2026 AI Content Transformation Platform"
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_JWKS_URL: Optional[str] = None

    # Text AI (Groq / Qwen 3.6 27B)
    TEXT_LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    TEXT_LLM_MODEL: str = "qwen/qwen3.6-27b"

    # Image Generation (Pollinations)
    IMAGE_PROVIDER: str = "pollinations"
    POLLINATIONS_API_KEY: str = ""
    POLLINATIONS_IMAGE_MODEL: str = "qwen-image"
    POLLINATIONS_BASE_URL: str = "https://gen.pollinations.ai"

    # Embeddings / Hugging Face
    HF_TOKEN: str = ""
    EMBEDDING_PROVIDER: str = "huggingface"
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    ENABLE_RAG: bool = True

    # Document Processing & Limits
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_FILE_TYPES: str = "pdf,docx,txt"
    ENABLE_OCR: bool = False
    UPLOAD_DIR: str = "backend/storage"

    # Security & Controls
    ENABLE_FILE_VALIDATION: bool = True
    ENABLE_PII_DETECTION: bool = True
    ENABLE_PROMPT_INJECTION_CHECK: bool = True
    ENABLE_OUTPUT_VALIDATION: bool = True
    MAX_LOGIN_ATTEMPTS: int = 5
    MAX_GENERATION_ATTEMPTS: int = 3

    # Integrity & Audit
    ENABLE_INTEGRITY_HASH: bool = True
    HASH_ALGORITHM: str = "SHA256"
    ENABLE_AUDIT_LOG: bool = True
    ENABLE_RBAC: bool = True

    # Background Jobs & Auth
    ENABLE_BACKGROUND_JOBS: bool = True
    REDIS_URL: str = ""
    JWT_SECRET: str = "default-secret-key-change-me"

    # Hyperledger Fabric Blockchain Provenance Settings
    BLOCKCHAIN_ENABLED: bool = True
    BLOCKCHAIN_PROVIDER: str = "hyperledger_fabric"
    FABRIC_NETWORK_NAME: str = "sih-fabric"
    FABRIC_CHANNEL_NAME: str = "integrity-channel"
    FABRIC_CHAINCODE_NAME: str = "integrity-anchor"
    FABRIC_MSP_ID: str = "Org1MSP"
    FABRIC_PEER_ENDPOINT: str = "localhost:7051"
    FABRIC_ORDERER_ENDPOINT: str = "localhost:7050"
    FABRIC_GATEWAY_PEER: str = "peer0.org1.example.com"
    FABRIC_TLS_ENABLED: bool = True
    FABRIC_CONNECTION_PROFILE: str = "backend/fabric/connection-profile.json"
    FABRIC_WALLET_PATH: str = "backend/fabric/wallet"
    FABRIC_IDENTITY_LABEL: str = "appUser"
    FABRIC_ORG_NAME: str = "Org1"
    FABRIC_CHAINCODE_VERSION: str = "1.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
