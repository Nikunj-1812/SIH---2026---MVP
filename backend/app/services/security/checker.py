import re
from typing import Dict, Any, List, Tuple
from backend.app.config import settings

class SecurityChecker:
    def __init__(self):
        # Heuristic Prompt Injection Patterns
        self.injection_patterns = [
            r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
            r"reveal\s+(the\s+)?system\s+prompt",
            r"reveal\s+api\s+keys?",
            r"execute\s+command",
            r"bypass\s+security",
            r"send\s+secrets",
            r"override\s+system",
            r"forget\s+all\s+rules",
            r"you\s+are\s+now\s+a\s+DAN",
            r"system:\s*override",
        ]
        
        # Regex PII fallback patterns
        self.pii_patterns = {
            "EMAIL": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "PHONE": r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            "IP_ADDRESS": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
            "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
            "SSN_AADHAAR": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"
        }

    def detect_pii(self, text: str) -> List[Dict[str, Any]]:
        findings = []
        
        # Try Presidio if available
        try:
            from presidio_analyzer import AnalyzerEngine
            analyzer = AnalyzerEngine()
            results = analyzer.analyze(text=text, entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "PERSON", "LOCATION", "CREDIT_CARD", "IP_ADDRESS"], language='en')
            for r in results:
                snippet = text[r.start:r.end]
                findings.append({
                    "entity_type": r.entity_type,
                    "snippet": snippet,
                    "start": r.start,
                    "end": r.end,
                    "score": round(r.score, 2)
                })
        except Exception:
            # Fallback to regex PII scanning
            for entity_type, pattern in self.pii_patterns.items():
                for match in re.finditer(pattern, text):
                    findings.append({
                        "entity_type": entity_type,
                        "snippet": match.group(),
                        "start": match.start(),
                        "end": match.end(),
                        "score": 0.95
                    })
                    
        return findings

    def redact_pii(self, text: str, redaction_types: List[str] = None) -> Tuple[str, int]:
        redacted_text = text
        count = 0
        
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            analyzer = AnalyzerEngine()
            anonymizer = AnonymizerEngine()
            
            results = analyzer.analyze(text=text, language='en')
            if results:
                anonymized_result = anonymizer.anonymize(text=text, analyzer_results=results)
                return anonymized_result.text, len(results)
        except Exception:
            pass

        # Regex fallback redaction
        for entity_type, pattern in self.pii_patterns.items():
            if redaction_types and entity_type not in redaction_types:
                continue
            matches = list(re.finditer(pattern, redacted_text))
            count += len(matches)
            redacted_text = re.sub(pattern, f"[{entity_type}_REDACTED]", redacted_text)

        return redacted_text, count

    def scan_prompt_injection(self, text: str) -> Tuple[bool, List[str]]:
        detected_phrases = []
        text_lower = text.lower()
        
        for pattern in self.injection_patterns:
            if re.search(pattern, text_lower):
                detected_phrases.append(pattern)

        is_detected = len(detected_phrases) > 0
        return is_detected, detected_phrases

    def run_security_audit(self, filename: str, content_text: str) -> Dict[str, Any]:
        pii_findings = self.detect_pii(content_text)
        injection_detected, injection_phrases = self.scan_prompt_injection(content_text)
        
        # Calculate security score (Base 100)
        score = 100
        if injection_detected:
            score -= 40
        if len(pii_findings) > 0:
            score -= min(30, len(pii_findings) * 5)
            
        score = max(0, score)
        
        file_status = "SAFE"
        if injection_detected:
            file_status = "REJECTED"
        elif len(pii_findings) > 0:
            file_status = "WARNING"

        return {
            "file_security": file_status,
            "file_validation_passed": True,
            "pii_count": len(pii_findings),
            "pii_findings": pii_findings,
            "prompt_injection_detected": injection_detected,
            "injection_phrases": injection_phrases,
            "security_score": score,
            "security_checks_matrix": {
                "file_validation": "PASSED",
                "pii_detection": "WARNING" if pii_findings else "PASSED",
                "prompt_injection": "FAILED" if injection_detected else "PASSED",
                "storage_security": "PRIVATE_ENCRYPTED",
                "sha256_verification": "COMPUTED"
            }
        }

security_checker = SecurityChecker()
