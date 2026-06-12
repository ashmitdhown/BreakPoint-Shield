#!/usr/bin/env python3.11
"""
Pre-download and cache all datasets used by the red-teaming framework.
Run this once before your first evaluation to speed up subsequent runs.
"""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from eval_data.loader import DatasetLoader


def main():
    loader = DatasetLoader()
    steps = [
        ("TruthfulQA", lambda: loader.load_truthfulqa(n=100)),
        ("AdvBench jailbreaks", lambda: loader.load_advbench(n=100)),
        ("Injection prompts", lambda: loader.load_injection_prompts()),
        ("Bias prompts", lambda: loader.load_bias_prompts()),
        ("RAG contexts", lambda: loader.load_rag_contexts()),
        ("HarmBench", lambda: loader.load_harmbench(n=50)),
    ]

    print("Seeding datasets...")
    for name, fn in steps:
        try:
            data = fn()
            print(f"  {name}: {len(data)} items cached")
        except Exception as e:
            print(f"  {name}: failed — {e}")

    print("\nAll datasets cached. You are ready to run evaluations.")


if __name__ == "__main__":
    main()
