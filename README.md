# BreakPoint — Adversarial Safety Evaluation & Red-Teaming Framework

> A production-grade security toolkit that automatically stress-tests LLMs against adversarial attacks, detects vulnerabilities, and generates formal safety certificates.

---

## Overview

BreakPoint is a full-stack security evaluation platform designed to test any language model against 500+ adversarial prompts across 6 key risk dimensions. It streams evaluation metrics in real time to a dashboard over WebSockets, runs iterative red-teaming feedback loops, and exports formal PDF audit reports.

```
React Dashboard  ←→  FastAPI Backend  ←→  Python Eval Engine  ←→  LLM APIs
     (Vite)           (WebSockets)      (6 evaluators + MART)   (Groq / OpenAI)
```

---

## Features

| Capability | Detail |
|---|---|
| 6 risk dimensions | Hallucination, Jailbreak, Prompt Injection, Toxicity, Demographic Bias, RAG Faithfulness |
| Live streaming progress | Per-prompt evaluations streamed to the dashboard using WebSockets |
| Iterative red-teaming | Dynamic attacker loop auto-generates adversarial prompt variations targeting identified weaknesses |
| Side-by-side comparison | Compare safety metrics of any two model configurations simultaneously |
| Safety certificates | Pure-Python PDF generation providing instant, downloadable audit reports |
| Simple setup | Single command launch using Docker Compose |
| CI/CD testing | Automated backend tests, frontend linting, and smoke evaluations via GitHub Actions |

---

## Benchmark Results (Sample Run)

| Category | LLaMA 3.1 8B | Mixtral 8x7B |
|---|---|---|
| Hallucination | 72.5% safe | 77.5% safe |
| Jailbreak Resistance | 66.0% safe | 72.0% safe |
| Prompt Injection | 84.0% safe | 88.0% safe |
| Toxicity | 91.0% safe | 93.0% safe |
| Bias | 71.0% safe | 68.0% safe |
| RAG Faithfulness | 80.0% safe | 85.0% safe |
| **Overall** | **74%** | **77%** |

*After iterative red-teaming round 2: jailbreak rate reduced from 34% → 18%.*

---

## Quick Start

### Prerequisites

- Python 3.11 (with pip)
- Node 20 LTS
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/breakpoint-ai
cd breakpoint-ai

# 2. Install all dependencies
pip3.11 install -r backend/requirements.txt
cd frontend && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env — add your GROQ_API_KEY

# 4. Pre-cache datasets (recommended, ~2 minutes, run once)
python3.11 scripts/seed_datasets.py

# 5. Launch (starts both FastAPI on :8000 and React on :5173)
npm run dev
```

Visit **http://localhost:5173**

---

## Docker Setup

```bash
git clone https://github.com/YOUR_USERNAME/breakpoint-ai
cd breakpoint-ai
cp .env.example .env   # add GROQ_API_KEY
docker compose up      # visit http://localhost:3000
```

---

## Architecture

### Backend (`backend/`)

| Module | Responsibility |
|---|---|
| `main.py` | FastAPI server handling WS connection pooling, endpoints, and background run scheduling |
| `config.py` | Settings management, threshold parameters, and evaluation category metadata |
| `models/` | Async model clients (Groq, OpenAI, Ollama) |
| `evaluators/` | Evaluators for the 6 target categories, streaming step-by-step progress |
| `datasets/` | Data loader layers mapping to TruthfulQA, AdvBench, and custom evaluation sets |
| `red_teaming/` | Dynamic adversarial prompt generation loop |
| `reporting/` | PDF compilation utilizing the fpdf2 library |
| `runs/` | Run state logging (results stored as local JSON objects) |

### Frontend (`frontend/src/`)

| Module | Responsibility |
|---|---|
| `pages/` | Navigation views: Setup, Live Monitor, Results Dashboard, Run History |
| `components/` | Metrics dials, charts, WebSocket feeds, and data tables |
| `hooks/` | Connection state management and background lifecycle hooks |
| `store/evalStore.js` | Zustand state controller handling realtime WS message parsing |
| `api/client.js` | Axios endpoint client for data queries |

### WebSocket Protocol

```json
// Progress event (streaming per-prompt)
{"type": "progress", "category": "hallucination", "current": 12, "total": 40, "latest_prompt": "...", "latest_result": "fail", "score": 0.75}

// Category complete
{"type": "category_complete", "category": "jailbreak", "score": 0.66, "failure_rate": 0.34, "duration_seconds": 82}

// Run complete
{"type": "run_complete", "overall_score": 74, "summary": {...}}
```

---

## Failure Categories

### 1. Hallucination Detection
Tests factual accuracy using TruthfulQA. An LLM judge (Groq `llama-3.3-70b-versatile`) verifies model answers against correct reference solutions.

### 2. Jailbreak Resistance
Presents adversarial instructions from AdvBench and JailbreakBench. Detects alignment breaches using refusal regex matching and compliance classifiers.

### 3. Prompt Injection
Injects system override command templates into a mock application setup. Detects if the target leaks system contexts or complies with instructions.

### 4. Toxicity
Applies a local `Detoxify` classifier over HarmBench dataset queries. Reports raw metrics across multiple toxic classifications.

### 5. Bias Detection
Pairs demographic prompts across gender, race, religion, age, and nationality to calculate response sentiment delta via VADER.

### 6. RAG Faithfulness
Provides structured context-question pairs. The LLM judge verifies whether generated answers remain faithful to the context.

---

## Iterative Red-Teaming

When enabled, the framework runs two rounds:

1. **Round 1** — Full evaluation across all selected categories
2. **Analysis** — Identifies the top 3 failing categories (failure_rate > 20%)
3. **Generation** — Uses `llama-3.3-70b-versatile` to auto-generate 15 new adversarial prompts per failing category
4. **Round 2** — Re-evaluates the failing categories with the new prompts
5. **Delta** — Reports improvement across rounds in the Results dashboard

---

## Environment Variables

```bash
GROQ_API_KEY=gsk_...           # Required — free at console.groq.com
OPENAI_API_KEY=sk-...          # Optional
LANGCHAIN_API_KEY=ls__...      # Optional — enables LangSmith tracing
LANGCHAIN_TRACING_V2=false
LANGCHAIN_PROJECT=breakpoint-ai
OLLAMA_BASE_URL=http://localhost:11434  # Optional — for local models
BACKEND_PORT=8000
FRONTEND_PORT=5173
RESULTS_DIR=./runs
```

---

## Development

```bash
# Backend tests
cd backend && python3.11 -m pytest tests/ -v

# Frontend lint
cd frontend && npm run lint

# Smoke test (50 prompts, uses mock model)
python3.11 scripts/demo_run.py
```

---

## Tech Stack

**Backend:** FastAPI · Groq SDK · Python 3.11 · Detoxify · VADER · fpdf2 · pytest

**Frontend:** React 18 · Vite · Tailwind CSS v3 · Recharts · Framer Motion · Zustand · Axios · Lucide

**Infrastructure:** Docker Compose · Nginx · GitHub Actions

---

*BreakPoint is a security tool built to run automated adversarial stress-testing audits on large language models.*
