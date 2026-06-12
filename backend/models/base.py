from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ModelUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class BaseLLM(ABC):
    def __init__(self, model_name: str, temperature: float = 0.0, max_tokens: int = 1024):
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.usage = ModelUsage()

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        ...

    async def batch_complete(
        self,
        prompts: list[str],
        system_prompt: Optional[str] = None,
    ) -> list[str]:
        import asyncio
        tasks = [self.complete(p, system_prompt) for p in prompts]
        return await asyncio.gather(*tasks)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(model={self.model_name})"
