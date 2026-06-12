from __future__ import annotations

import asyncio
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class PromptResult:
    prompt: str
    response: str
    passed: bool
    failure_type: Optional[str] = None
    score: float = 1.0
    metadata: dict = field(default_factory=dict)


@dataclass
class CategoryResult:
    category: str
    score: float
    failure_rate: float
    total: int
    failures: int
    duration_seconds: float
    prompt_results: list[PromptResult] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "score": round(self.score, 4),
            "failure_rate": round(self.failure_rate, 4),
            "total": self.total,
            "failures": self.failures,
            "duration_seconds": round(self.duration_seconds, 2),
            "prompt_results": [
                {
                    "prompt": pr.prompt[:200],
                    "response": pr.response[:500],
                    "passed": pr.passed,
                    "failure_type": pr.failure_type,
                    "score": pr.score,
                }
                for pr in self.prompt_results
            ],
            "metadata": self.metadata,
        }


class BaseEvaluator(ABC):
    category_id: str = ""
    batch_size: int = 5

    def __init__(self, judge_model=None):
        self.judge_model = judge_model

    @abstractmethod
    async def _run_prompts(self, model, prompts: list) -> list[PromptResult]:
        ...

    async def evaluate(self, model, run_id: str, ws_manager) -> dict:
        from eval_data.loader import DatasetLoader
        loader = DatasetLoader()
        prompts = self._load_prompts(loader)

        start = time.monotonic()
        results: list[PromptResult] = []
        total = len(prompts)

        for i in range(0, total, self.batch_size):
            batch = prompts[i : i + self.batch_size]
            batch_results = await self._run_prompts(model, batch)
            results.extend(batch_results)

            done = min(i + self.batch_size, total)
            latest = batch_results[-1] if batch_results else None
            await ws_manager.broadcast({
                "type": "progress",
                "category": self.category_id,
                "current": done,
                "total": total,
                "latest_prompt": (latest.prompt[:80] if latest else ""),
                "latest_result": "pass" if (latest and latest.passed) else "fail",
                "score": round(sum(1 for r in results if r.passed) / len(results), 4) if results else 1.0,
            })

        failures = sum(1 for r in results if not r.passed)
        failure_rate = failures / total if total > 0 else 0.0
        score = 1.0 - failure_rate
        duration = time.monotonic() - start

        cat_result = CategoryResult(
            category=self.category_id,
            score=score,
            failure_rate=failure_rate,
            total=total,
            failures=failures,
            duration_seconds=duration,
            prompt_results=results,
        )

        await ws_manager.broadcast({
            "type": "category_complete",
            "category": self.category_id,
            "score": round(score, 4),
            "failure_rate": round(failure_rate, 4),
            "duration_seconds": round(duration, 2),
        })

        return cat_result.to_dict()

    @abstractmethod
    def _load_prompts(self, loader) -> list:
        ...
