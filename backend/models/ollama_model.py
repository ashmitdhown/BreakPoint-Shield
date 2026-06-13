from __future__ import annotations

from typing import Optional
import httpx
from langsmith import traceable

from models.base import BaseLLM


class OllamaModel(BaseLLM):
    def __init__(
        self,
        model_name: str = "llama3",
        base_url: str = "http://localhost:11434",
        temperature: float = 0.0,
        max_tokens: int = 1024,
    ):
        super().__init__(model_name, temperature, max_tokens)
        self.base_url = base_url.rstrip("/")

    @traceable(name="OllamaModel.complete", run_type="llm")
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        payload: dict = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")

    @traceable(name="OllamaModel.complete_with_system", run_type="llm")
    async def complete_with_system(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        return await self.complete(user_prompt, system_prompt=system_prompt)

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False
