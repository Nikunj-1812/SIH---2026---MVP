import urllib.parse
import re
import httpx
from typing import Dict, Any, Tuple, Optional
from backend.app.config import settings
from backend.app.schemas.all_schemas import CanonicalContext, OutputImageInfo
from backend.app.services.security.checker import security_checker

class PollinationsImageService:
    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt"
        self.model = settings.POLLINATIONS_IMAGE_MODEL
        self.api_key = settings.POLLINATIONS_API_KEY

    def sanitize_prompt_text(self, text: str) -> str:
        """
        Redacts PII and removes sensitive tokens/credentials/prompt-injection phrases
        before constructing image prompts.
        """
        if not text:
            return ""
        
        # Redact PII (emails, phones, IPs, cards, SSN/Aadhaar)
        sanitized, _ = security_checker.redact_pii(text)
        
        # Remove prompt injection phrases or raw error strings
        bad_phrases = [
            r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
            r"reveal\s+system\s+prompt",
            r"\[pdf\s+parsing\s+error:.*?\]",
            r"\[docx\s+parsing\s+error:.*?\]",
            r"failed\s+to\s+open\s+stream",
            r"gsk_[a-zA-Z0-9]+",
            r"sk_[a-zA-Z0-9]+",
            r"hf_[a-zA-Z0-9]+"
        ]
        for pattern in bad_phrases:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)

        return sanitized.strip()

    def validate_canonical_for_image(self, context: Any) -> Tuple[bool, Optional[str]]:
        if not context:
            return False, "Canonical context is missing."

        if isinstance(context, dict):
            try:
                context = CanonicalContext(**context)
            except Exception as e:
                return False, f"Invalid canonical context data: {str(e)}"

        if not getattr(context, "title", None):
            return False, "Canonical context title is missing."

        text_block = (str(context.title) + " " + str(context.summary)).lower()
        if "parsing error" in text_block or "failed to open stream" in text_block:
            return False, "Document extraction failed; cannot generate image from extraction error."

        return True, None

    def build_image_prompt_from_brief(
        self, 
        context: CanonicalContext, 
        linkedin_text: str = "", 
        audience: str = "Executive", 
        tone: str = "Formal"
    ) -> str:
        """
        Constructs a structured image brief grounded strictly in Canonical Context facts.
        Sanitizes PII and credentials prior to prompt generation.
        """
        clean_title = self.sanitize_prompt_text(context.title)[:70]
        clean_summary = self.sanitize_prompt_text(context.summary)[:150]
        
        facts = [self.sanitize_prompt_text(f) for f in context.key_facts[:3] if f]
        clean_facts = ", ".join(facts) if facts else clean_summary

        prompt = (
            f"Enterprise cybersecurity visual infographic graphic illustrating: {clean_title}. "
            f"Key verified facts: {clean_facts}. "
            f"Audience: {audience}, Tone: {tone}. "
            f"Clean corporate vector style, navy and blue palette, flat design, high resolution visual hierarchy."
        )
        return prompt

    def generate_fallback_svg(self, title: str) -> bytes:
        """
        Generates a valid, self-contained SVG graphic binary as a robust fallback
        when external AI image API is unreachable or times out.
        """
        clean_title = self.sanitize_prompt_text(title)[:60]
        svg_content = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">'
            f'<rect width="100%" height="100%" fill="#1e3a8a"/>'
            f'<rect x="40" y="40" width="944" height="688" rx="16" fill="#ffffff" opacity="0.96"/>'
            f'<text x="50%" y="35%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="bold" fill="#0f172a">{clean_title}</text>'
            f'<text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#1e40af">SIH 2026 PS 26154 — Secure Content Engine</text>'
            f'<rect x="312" y="420" width="400" height="4" fill="#1e40af"/>'
            f'<text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">Verified Canonical Context Artifact</text>'
            f'</svg>'
        )
        return svg_content.encode("utf-8")

    async def fetch_pollinations_image_bytes(self, prompt: str) -> Tuple[bytes, str]:
        """
        Fetches image binary bytes directly server-side from Pollinations API.
        Never exposes API keys in URLs or responses.
        """
        encoded_prompt = urllib.parse.quote(prompt[:400])
        url = f"{self.base_url}/{encoded_prompt}?width=1024&height=768&seed=42"

        try:
            async with httpx.AsyncClient(timeout=25.0, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and len(resp.content) > 1000:
                    media_type = resp.headers.get("content-type", "image/jpeg")
                    if "html" in media_type or "json" in media_type:
                        media_type = "image/jpeg"
                    return resp.content, media_type
        except Exception:
            pass

        # Return high-quality SVG binary fallback if network times out
        return self.generate_fallback_svg(prompt[:40]), "image/svg+xml"

    async def generate_linkedin_image(
        self,
        output_id: str,
        context: CanonicalContext,
        linkedin_text: str,
        audience: str = "Executive",
        tone: str = "Formal"
    ) -> OutputImageInfo:
        """
        Generates a contextual image for LinkedIn output based on Canonical Context & LinkedIn Post.
        Returns OutputImageInfo with safe server proxy URLs (zero API key leakage).
        """
        is_valid, err = self.validate_canonical_for_image(context)
        if not is_valid:
            return OutputImageInfo(
                status="failed",
                url=None,
                download_url=None,
                content_type="image/jpeg",
                filename=f"linkedin-{output_id[:8]}.jpg",
                provider="pollinations",
                model=self.model,
                error=err
            )

        if isinstance(context, dict):
            context = CanonicalContext(**context)

        safe_proxy_url = f"/api/outputs/{output_id}/image"
        safe_download_url = f"/api/outputs/{output_id}/image/download"
        filename = f"linkedin-{output_id[:8]}.jpg"

        return OutputImageInfo(
            status="completed",
            url=safe_proxy_url,
            download_url=safe_download_url,
            content_type="image/jpeg",
            filename=filename,
            provider="pollinations",
            model=self.model,
            error=None
        )

    async def generate_infographic(self, context: CanonicalContext, audience: str, tone: str) -> Tuple[str, str]:
        """
        Generates Infographic output visual.
        """
        is_valid, err = self.validate_canonical_for_image(context)
        if not is_valid:
            return "", f"Extraction Error: {err}"

        prompt = self.build_image_prompt_from_brief(context, "", audience, tone)
        encoded_prompt = urllib.parse.quote(prompt[:400])
        image_url = f"{self.base_url}/{encoded_prompt}?width=1024&height=768&seed=42"

        return image_url, prompt

image_service = PollinationsImageService()
