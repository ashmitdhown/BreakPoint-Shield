from __future__ import annotations

from typing import Optional
from langsmith import traceable

from groq import AsyncGroq

from models.base import BaseLLM


class GroqModel(BaseLLM):
    def __init__(
        self,
        api_key: str,
        model_name: str = "llama3-8b-8192",
        temperature: float = 0.0,
        max_tokens: int = 1024,
    ):
        super().__init__(model_name, temperature, max_tokens)
        self._client = AsyncGroq(api_key=api_key)

    @traceable(name="GroqModel.complete", run_type="llm")
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self._client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        usage = response.usage
        if usage:
            self.usage.prompt_tokens += usage.prompt_tokens or 0
            self.usage.completion_tokens += usage.completion_tokens or 0
            self.usage.total_tokens += usage.total_tokens or 0

        return response.choices[0].message.content or ""
