import json
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from backend.app.config import settings

class AIProvider(ABC):
    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        pass

    @abstractmethod
    async def generate_structured(self, system_prompt: str, user_prompt: str, schema_description: str) -> Dict[str, Any]:
        pass

class GroqProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.TEXT_LLM_MODEL
        self.base_url = settings.GROQ_BASE_URL.rstrip('/')

    async def generate_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
        if not self.api_key or self.api_key == "gsk_placeholder":
            return "[Groq API key not configured. Using deterministic transformation fallback]"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "max_tokens": 4096
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    import re
                    content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                    return content
                else:
                    return f"[AI Provider Error ({response.status_code}): {response.text}]"
            except Exception as e:
                return f"[AI Generation Request Failed: {str(e)}]"

    async def generate_structured(self, system_prompt: str, user_prompt: str, schema_description: str) -> Dict[str, Any]:
        enhanced_system_prompt = (
            f"{system_prompt}\n\n"
            f"IMPORTANT: You MUST respond ONLY with a valid JSON object strictly conforming to this schema:\n"
            f"{schema_description}\n"
            f"Do NOT include markdown formatting like ```json or trailing commentary. Return raw JSON."
        )
        
        response_text = await self.generate_text(enhanced_system_prompt, user_prompt, temperature=0.1)
        
        # Clean JSON response if wrapped in markdown
        cleaned = response_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except Exception:
            # Fallback regex extraction of JSON object
            import re
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except Exception:
                    pass
            return {"error": "Failed to parse structured JSON response from LLM", "raw_response": response_text}

# Factory to get active provider
def get_ai_provider() -> AIProvider:
    return GroqProvider()
