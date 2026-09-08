import hashlib
import uuid
import datetime
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.services.ai.provider import get_ai_provider
from backend.app.services.generation.image_service import image_service
from backend.app.schemas.all_schemas import CanonicalContext, GenerationConfig, OutputItem, OutputImageInfo

class OutputGenerationEngine:
    def __init__(self):
        self.ai_provider = get_ai_provider()

    async def generate_single_output(
        self, 
        output_type: str, 
        context: CanonicalContext, 
        config: GenerationConfig,
        job_id: str,
        project_id: str
    ) -> OutputItem:
        
        system_prompt = (
            f"You are a professional content transformation generator.\n"
            f"AUDIENCE: {config.audience}\n"
            f"TONE: {config.tone}\n"
            f"LANGUAGE: {config.language}\n"
            f"DETAIL LEVEL: {config.detail}\n\n"
            f"CRITICAL RULES:\n"
            f"1. Generate content grounded ONLY in the canonical context facts below.\n"
            f"2. Never invent dates, numbers, or names not present in the canonical context.\n"
            f"3. Adapt the style and structure strictly to the target output format."
        )

        context_summary_text = (
            f"Title: {context.title}\n"
            f"Summary: {context.summary}\n"
            f"Key Facts: {', '.join(context.key_facts)}\n"
            f"Entities: {', '.join(context.entities)}\n"
            f"Dates: {', '.join(context.dates)}\n"
            f"Risks: {', '.join(context.risks)}\n"
            f"Recommendations: {', '.join(context.recommendations)}\n"
            f"Actions: {', '.join(context.actions)}"
        )

        output_id = str(uuid.uuid4())
        title = f"{output_type.replace('_', ' ').title()} - {context.title}"
        content = ""
        image_url = None
        image_info: Optional[OutputImageInfo] = None

        if output_type == "executive_summary":
            user_prompt = (
                f"Generate a formal Executive Summary based on this context:\n{context_summary_text}\n\n"
                f"Structure with headers:\n"
                f"## Executive Summary\n"
                f"### Situation\n"
                f"### Key Findings\n"
                f"### Impact & Risk Assessment\n"
                f"### Recommended Actions"
            )
            content = await self.ai_provider.generate_text(system_prompt, user_prompt)

        elif output_type == "advisory":
            user_prompt = (
                f"Generate an Operational Advisory based on this context:\n{context_summary_text}\n\n"
                f"Structure with headers:\n"
                f"## Operational Advisory\n"
                f"### Summary of Known Facts\n"
                f"### Technical Impact Analysis\n"
                f"### Actionable Recommendations\n"
                f"### Caveats & Uncertainties"
            )
            content = await self.ai_provider.generate_text(system_prompt, user_prompt)

        elif output_type == "linkedin":
            user_prompt = (
                f"Generate an engaging, professional LinkedIn Post based on this context:\n{context_summary_text}\n\n"
                f"Include key takeaways, clear paragraphs, and relevant professional hashtags. Do not share confidential raw data or PII."
            )
            content = await self.ai_provider.generate_text(system_prompt, user_prompt)

            # Generate matching contextual LinkedIn image
            image_info = await image_service.generate_linkedin_image(
                output_id=output_id,
                context=context,
                linkedin_text=content,
                audience=config.audience,
                tone=config.tone
            )
            image_url = image_info.url

        elif output_type == "x_thread":
            user_prompt = (
                f"Generate a concise 4-6 tweet X/Twitter Thread based on this context:\n{context_summary_text}\n\n"
                f"Format each tweet starting with number (1/, 2/, 3/, etc.). Keep each tweet under 280 characters."
            )
            content = await self.ai_provider.generate_text(system_prompt, user_prompt)

        elif output_type == "presentation":
            user_prompt = (
                f"Generate a Slide Presentation Outline based on this context:\n{context_summary_text}\n\n"
                f"Format as 5 slides:\n"
                f"Slide 1: Title & Overview\n"
                f"Slide 2: Background & Context\n"
                f"Slide 3: Key Findings & Metrics\n"
                f"Slide 4: Strategic Risks & Challenges\n"
                f"Slide 5: Next Steps & Action Plan"
            )
            content = await self.ai_provider.generate_text(system_prompt, user_prompt)

        elif output_type == "infographic":
            img_url, prompt_used = await image_service.generate_infographic(context, config.audience, config.tone)
            image_url = f"/api/outputs/{output_id}/image" if img_url else None
            image_info = OutputImageInfo(
                status="completed" if img_url else "failed",
                url=image_url,
                provider="pollinations",
                model=settings.POLLINATIONS_IMAGE_MODEL,
                error=None if img_url else "Infographic generation failed"
            )
            content = (
                f"## Generated Visual Infographic\n\n"
                f"**Infographic Topic:** {context.title}\n"
                f"**Audience Target:** {config.audience}\n"
                f"**Key Fact Focus:** {context.key_facts[0] if context.key_facts else 'Document Overview'}\n\n"
                f"![Infographic Graphic]({image_url})\n\n"
                f"*Generated server-side via Pollinations AI Provider using model `{settings.POLLINATIONS_IMAGE_MODEL}`.*"
            )

        # Fallback content generator if AI text response was empty
        if not content or content.startswith("[AI"):
            content = (
                f"## {output_type.replace('_', ' ').title()}\n\n"
                f"**Document Title:** {context.title}\n\n"
                f"### Overview\n{context.summary}\n\n"
                f"### Key Facts\n" + "\n".join([f"- {fact}" for fact in context.key_facts]) + "\n\n"
                f"### Recommendations\n" + "\n".join([f"- {rec}" for rec in context.recommendations])
            )

        # Compute Output SHA-256 Hash
        output_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        return OutputItem(
            id=output_id,
            generation_job_id=job_id,
            project_id=project_id,
            output_type=output_type,
            title=title,
            content=content,
            image_url=image_url,
            image=image_info,
            status="completed",
            validation_status="valid",
            validation_issues=[],
            output_hash=output_hash,
            created_at=datetime.datetime.utcnow().isoformat(),
            updated_at=datetime.datetime.utcnow().isoformat()
        )

generation_engine = OutputGenerationEngine()
