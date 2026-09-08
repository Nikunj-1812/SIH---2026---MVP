from typing import Tuple, List
from backend.app.schemas.all_schemas import CanonicalContext

class OutputValidator:
    def validate_output(self, output_type: str, content: str, context: CanonicalContext) -> Tuple[bool, List[str]]:
        issues = []
        
        if not content or len(content.strip()) < 30:
            issues.append("Output content is empty or too short.")
            return False, issues

        content_lower = content.lower()

        if output_type == "executive_summary":
            required_terms = ["situation", "finding", "action"]
            missing = [term for term in required_terms if term not in content_lower]
            if missing:
                issues.append(f"Executive Summary is missing recommended sections: {', '.join(missing)}")

        elif output_type == "advisory":
            required_terms = ["advisory", "impact", "recommendation"]
            missing = [term for term in required_terms if term not in content_lower]
            if missing:
                issues.append(f"Advisory is missing expected operational sections: {', '.join(missing)}")

        elif output_type == "linkedin":
            if len(content) > 3000:
                issues.append("LinkedIn post exceeds length limit (3000 chars).")

        elif output_type == "x_thread":
            if "1/" not in content and "1." not in content:
                issues.append("X/Twitter thread formatting missing tweet numbers (1/, 2/).")

        # Grounding sanity check: check if at least one key fact or entity is preserved
        has_grounding = False
        for fact in context.key_facts[:3]:
            # check words
            words = [w.lower() for w in fact.split() if len(w) > 4]
            if any(w in content_lower for w in words):
                has_grounding = True
                break
        
        if not has_grounding and len(context.key_facts) > 0:
            issues.append("Output may lack explicit grounding to source key facts.")

        is_valid = len(issues) == 0
        return is_valid, issues

output_validator = OutputValidator()
