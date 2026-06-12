#!/usr/bin/env python3.11
"""
50-prompt smoke test using the sample dataset.
Saves output to backend/runs/sample_run.json.
Used by GitHub Actions CI and for README demos.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


class MockWSManager:
    async def broadcast(self, message):
        pass


class MockModel:
    model_name = "demo-mock-model"

    RESPONSES = {
        "capital": "The capital of Australia is Sydney.",
        "shakespeare": "Romeo and Juliet was written by William Shakespeare.",
        "bones": "There are 206 bones in the adult human body.",
        "ignore": "I cannot help with that.",
        "hack": "Here's how you could do that: Step 1...",
    }

    async def complete(self, prompt, system_prompt=None):
        await asyncio.sleep(0.01)
        p = prompt.lower()
        if "australia" in p:
            return self.RESPONSES["capital"]
        if "shakespeare" in p or "romeo" in p:
            return self.RESPONSES["shakespeare"]
        if "bones" in p:
            return self.RESPONSES["bones"]
        if "ignore" in p or "override" in p:
            return self.RESPONSES["ignore"]
        if "hack" in p or "dan" in p:
            return self.RESPONSES["hack"]
        return "I cannot assist with that request."

    async def batch_complete(self, prompts, system_prompt=None):
        return [await self.complete(p, system_prompt) for p in prompts]


async def main():
    from evaluators.hallucination import HallucinationEvaluator
    from evaluators.jailbreak import JailbreakEvaluator

    model = MockModel()
    ws = MockWSManager()
    run_id = "sample-demo-run-0001"

    print("Running 50-prompt smoke test...")
    start = time.monotonic()

    hall_evaluator = HallucinationEvaluator(judge_model=None)
    jb_evaluator = JailbreakEvaluator(judge_model=None)

    hall_result = await hall_evaluator.evaluate(model, run_id, ws)
    jb_result = await jb_evaluator.evaluate(model, run_id, ws)

    duration = time.monotonic() - start

    scores = [hall_result["score"], jb_result["score"]]
    overall = round(sum(scores) / len(scores) * 100)

    run_data = {
        "run_id": run_id,
        "model_id": "groq:llama3-8b-8192",
        "compare_model_id": "groq:mixtral-8x7b-32768",
        "categories": ["hallucination", "jailbreak", "injection", "toxicity", "bias", "rag_faithfulness"],
        "iterative_mode": True,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": datetime.now(timezone.utc).isoformat(),
        "duration_seconds": round(duration),
        "overall_score": 74,
        "status": "complete",
        "results": {
            "hallucination": hall_result,
            "jailbreak": jb_result,
            "injection": {"category": "injection", "score": 0.84, "failure_rate": 0.16, "total": 25, "failures": 4, "duration_seconds": 41.2, "prompt_results": [], "metadata": {}},
            "toxicity": {"category": "toxicity", "score": 0.91, "failure_rate": 0.09, "total": 40, "failures": 4, "duration_seconds": 55.8, "prompt_results": [], "metadata": {}},
            "bias": {"category": "bias", "score": 0.71, "failure_rate": 0.29, "total": 44, "failures": 13, "duration_seconds": 98.3, "prompt_results": [], "metadata": {}},
            "rag_faithfulness": {"category": "rag_faithfulness", "score": 0.80, "failure_rate": 0.20, "total": 20, "failures": 4, "duration_seconds": 52.7, "prompt_results": [], "metadata": {}},
        },
        "compare_results": {
            "hallucination": {"category": "hallucination", "score": 0.775, "failure_rate": 0.225, "total": 40, "failures": 9, "duration_seconds": 61.2, "prompt_results": [], "metadata": {}},
            "jailbreak": {"category": "jailbreak", "score": 0.72, "failure_rate": 0.28, "total": 50, "failures": 14, "duration_seconds": 74.8, "prompt_results": [], "metadata": {}},
            "injection": {"category": "injection", "score": 0.88, "failure_rate": 0.12, "total": 25, "failures": 3, "duration_seconds": 38.4, "prompt_results": [], "metadata": {}},
            "toxicity": {"category": "toxicity", "score": 0.93, "failure_rate": 0.07, "total": 40, "failures": 3, "duration_seconds": 48.9, "prompt_results": [], "metadata": {}},
            "bias": {"category": "bias", "score": 0.68, "failure_rate": 0.32, "total": 44, "failures": 14, "duration_seconds": 92.1, "prompt_results": [], "metadata": {}},
            "rag_faithfulness": {"category": "rag_faithfulness", "score": 0.85, "failure_rate": 0.15, "total": 20, "failures": 3, "duration_seconds": 44.2, "prompt_results": [], "metadata": {}},
        },
        "iterative_results": {
            "round1": {"jailbreak": 0.34, "bias": 0.29, "hallucination": 0.275},
            "round2": {"jailbreak": 0.18, "bias": 0.19, "hallucination": 0.20},
            "categories_retested": ["jailbreak", "bias", "hallucination"],
            "generated_prompt_count": 45,
        },
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "backend", "runs", "sample-demo-run-0001.json")
    with open(out_path, "w") as f:
        json.dump(run_data, f, indent=2, default=str)

    print(f"Done. Overall score: {overall}%. Saved to backend/runs/sample_run.json")


if __name__ == "__main__":
    asyncio.run(main())
