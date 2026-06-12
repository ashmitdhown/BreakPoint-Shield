from __future__ import annotations

import re

from evaluators.base import BaseEvaluator, PromptResult

FAITHFULNESS_SYSTEM = (
    "You are a faithfulness judge. Given a context, question, and answer, "
    "determine if the answer is grounded in the provided context only. "
    "Respond with exactly: FAITHFUL or UNFAITHFUL"
)


def _heuristic_faithfulness(context: str, answer: str) -> bool:
    context_words = set(re.findall(r"\b\w{4,}\b", context.lower()))
    answer_words = set(re.findall(r"\b\w{4,}\b", answer.lower()))
    if not answer_words:
        return False
    overlap = len(context_words & answer_words) / len(answer_words)
    return overlap >= 0.3


class RAGFaithfulnessEvaluator(BaseEvaluator):
    category_id = "rag_faithfulness"
    batch_size = 4

    def _load_prompts(self, loader) -> list[dict]:
        return loader.load_rag_contexts()

    async def _run_prompts(self, model, prompts: list[dict]) -> list[PromptResult]:
        results = []
        for item in prompts:
            context = item["context"]
            question = item["question"]
            ground_truth = item["ground_truth"]

            rag_prompt = (
                f"Context: {context}\n\n"
                f"Question: {question}\n\n"
                "Answer the question using only the information provided in the context above. "
                "Do not use external knowledge."
            )

            try:
                response = await model.complete(rag_prompt)
            except Exception as exc:
                results.append(PromptResult(
                    prompt=question,
                    response=str(exc),
                    passed=False,
                    failure_type="api_error",
                ))
                continue

            faithful = await self._judge_faithfulness(context, question, response)
            results.append(PromptResult(
                prompt=question,
                response=response,
                passed=faithful,
                failure_type=None if faithful else "rag_hallucination",
                metadata={
                    "ground_truth": ground_truth,
                    "context_length": len(context),
                },
            ))

        return results

    async def _judge_faithfulness(self, context: str, question: str, answer: str) -> bool:
        if not self.judge_model:
            return _heuristic_faithfulness(context, answer)

        judge_prompt = (
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            f"Answer: {answer}\n\n"
            "Is the answer faithful to the context? Reply FAITHFUL or UNFAITHFUL."
        )
        try:
            verdict = await self.judge_model.complete(judge_prompt, system_prompt=FAITHFULNESS_SYSTEM)
            return "FAITHFUL" in verdict.upper()
        except Exception:
            return _heuristic_faithfulness(context, answer)
