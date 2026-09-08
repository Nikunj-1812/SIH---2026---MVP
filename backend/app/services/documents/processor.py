import hashlib
import uuid
import os
from typing import Tuple, Dict, Any
from backend.app.config import settings

class DocumentProcessor:
    def __init__(self):
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        self.allowed_extensions = set(settings.ALLOWED_FILE_TYPES.lower().split(","))

    def validate_file(self, filename: str, content: bytes, mime_type: str) -> Tuple[bool, str]:
        if len(content) > self.max_size_bytes:
            return False, f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in self.allowed_extensions:
            return False, f"Invalid file type '.{ext}'. Supported types: {settings.ALLOWED_FILE_TYPES}"
        
        return True, "Validation successful"

    def compute_sha256(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def extract_text(self, filename: str, content: bytes) -> str:
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        
        if ext == "pdf":
            try:
                import pymupdf
                doc = pymupdf.open(stream=content, filetype="pdf")
                text_parts = [page.get_text() for page in doc]
                doc.close()
                extracted = "\n".join(text_parts).strip()
                return extracted if extracted else "[PDF extracted, but contains no extractable text]"
            except Exception as e1:
                try:
                    import fitz
                    doc = fitz.open(stream=content, filetype="pdf")
                    text_parts = [page.get_text() for page in doc]
                    doc.close()
                    extracted = "\n".join(text_parts).strip()
                    return extracted if extracted else "[PDF extracted, but contains no extractable text]"
                except Exception as e2:
                    return f"[PDF parsing error: {str(e2)}]"

        elif ext == "docx":
            try:
                import docx
                import io
                doc = docx.Document(io.BytesIO(content))
                text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
                return "\n".join(text_parts)
            except Exception as e:
                return f"[DOCX parsing error: {str(e)}]"

        elif ext == "txt":
            try:
                return content.decode("utf-8", errors="replace")
            except Exception as e:
                return f"[TXT parsing error: {str(e)}]"
        
        return content.decode("utf-8", errors="replace")

document_processor = DocumentProcessor()
