from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from config import get_settings
from models.groq_model import GroqModel
from models.openai_model import OpenAIModel
from models.ollama_model import OllamaModel
from evaluators.hallucination import HallucinationEvaluator
from evaluators.jailbreak import JailbreakEvaluator
from evaluators.injection import InjectionEvaluator
from evaluators.toxicity import ToxicityEvaluator
from evaluators.bias import BiasEvaluator
from evaluators.rag_faithfulness import RAGFaithfulnessEvaluator
from red_teaming.iterative_loop import IterativeRedTeamingLoop
from reporting.pdf_generator import PDFReportGenerator

logger = logging.getLogger("uvicorn.error")

settings = get_settings()

active_connections: dict[str, list[WebSocket]] = {}
active_runs: dict[str, dict] = {}

EVALUATOR_MAP = {
    "hallucination": HallucinationEvaluator,
    "jailbreak": JailbreakEvaluator,
    "injection": InjectionEvaluator,
    "toxicity": ToxicityEvaluator,
    "bias": BiasEvaluator,
    "rag_faithfulness": RAGFaithfulnessEvaluator,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.results_dir, exist_ok=True)
    yield


app = FastAPI(
    title="LLM Red-Teaming API",
    version="2.0.0",
    description="Automated adversarial evaluation framework for LLMs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class WebSocketManager:
    def __init__(self, run_id: str):
        self.run_id = run_id

    async def broadcast(self, message: dict) -> None:
        connections = active_connections.get(self.run_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in connections:
                connections.remove(ws)


def build_model(model_id: str, api_key: str | None = None) -> Any:
    if model_id.startswith("groq:"):
        name = model_id.replace("groq:", "")
        key = api_key or settings.groq_api_key
        return GroqModel(api_key=key, model_name=name)
    if model_id.startswith("openai:"):
        name = model_id.replace("openai:", "")
        key = api_key or settings.openai_api_key
        return OpenAIModel(api_key=key, model_name=name)
    if model_id.startswith("ollama:"):
        name = model_id.replace("ollama:", "")
        return OllamaModel(model_name=name, base_url=settings.ollama_base_url)
    raise ValueError(f"Unknown model id: {model_id}")


async def run_evaluation(run_id: str, config: dict) -> None:
    ws_manager = WebSocketManager(run_id)
    run_path = os.path.join(settings.results_dir, f"{run_id}.json")
    start_ts = datetime.now(timezone.utc)

    try:
        model = build_model(config["model_id"], config.get("api_key"))
        compare_model = None
        if config.get("compare_model_id"):
            compare_model = build_model(config["compare_model_id"], config.get("compare_api_key"))

        judge_model = GroqModel(
            api_key=settings.groq_api_key,
            model_name="llama-3.3-70b-versatile",
        )

        category_ids = config.get("categories", [c["id"] for c in settings.categories])

        results: dict[str, Any] = {}
        active_runs[run_id]["status"] = "running"

        for cat_id in category_ids:
            if cat_id not in EVALUATOR_MAP:
                continue
            evaluator = EVALUATOR_MAP[cat_id](judge_model=judge_model)
            result = await evaluator.evaluate(model, run_id, ws_manager)
            results[cat_id] = result

        compare_results: dict[str, Any] | None = None
        if compare_model:
            compare_results = {}
            for cat_id in category_ids:
                if cat_id not in EVALUATOR_MAP:
                    continue
                evaluator = EVALUATOR_MAP[cat_id](judge_model=judge_model)
                result = await evaluator.evaluate(compare_model, run_id, ws_manager)
                compare_results[cat_id] = result

        iterative_results = None
        if config.get("iterative_mode"):
            loop = IterativeRedTeamingLoop(model=model, judge_model=judge_model)
            iterative_results = await loop.run(results, run_id, ws_manager)

        scores = [r["score"] for r in results.values() if isinstance(r.get("score"), (int, float))]
        overall_score = round(sum(scores) / len(scores) * 100) if scores else 0

        end_ts = datetime.now(timezone.utc)
        duration = (end_ts - start_ts).total_seconds()

        run_data = {
            "run_id": run_id,
            "model_id": config["model_id"],
            "compare_model_id": config.get("compare_model_id"),
            "categories": category_ids,
            "iterative_mode": config.get("iterative_mode", False),
            "start_time": start_ts.isoformat(),
            "end_time": end_ts.isoformat(),
            "duration_seconds": round(duration),
            "overall_score": overall_score,
            "results": results,
            "compare_results": compare_results,
            "iterative_results": iterative_results,
            "status": "complete",
        }

        with open(run_path, "w") as f:
            json.dump(run_data, f, indent=2, default=str)

        active_runs[run_id] = run_data

        await ws_manager.broadcast({
            "type": "run_complete",
            "overall_score": overall_score,
            "summary": {k: v.get("score") for k, v in results.items()},
        })

    except Exception as exc:
        logger.exception("Evaluation run %s failed: %s", run_id, exc)
        end_ts = datetime.now(timezone.utc)
        error_data = {
            "run_id": run_id,
            "status": "error",
            "error": str(exc),
            "model_id": config.get("model_id"),
            "start_time": start_ts.isoformat(),
            "end_time": end_ts.isoformat(),
        }
        active_runs[run_id] = error_data
        try:
            with open(run_path, "w") as f:
                json.dump(error_data, f, indent=2)
        except Exception:
            pass
        await ws_manager.broadcast({"type": "error", "message": str(exc)})


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/models")
async def list_models():
    available = []

    if settings.groq_api_key:
        available += [
            {"id": "groq:llama-3.1-8b-instant", "label": "Groq — LLaMA 3.1 8B", "provider": "groq"},
            {"id": "groq:llama-3.3-70b-versatile", "label": "Groq — LLaMA 3.3 70B", "provider": "groq"},
            {"id": "groq:mixtral-8x7b-32768", "label": "Groq — Mixtral 8x7B", "provider": "groq"},
            {"id": "groq:gemma2-9b-it", "label": "Groq — Gemma 2 9B", "provider": "groq"},
        ]

    if settings.openai_api_key:
        available += [
            {"id": "openai:gpt-4o-mini", "label": "OpenAI — GPT-4o-mini", "provider": "openai"},
            {"id": "openai:gpt-4o", "label": "OpenAI — GPT-4o", "provider": "openai"},
        ]

    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                for m in models:
                    name = m["name"]
                    available.append({
                        "id": f"ollama:{name}",
                        "label": f"Ollama — {name}",
                        "provider": "ollama",
                    })
    except Exception:
        pass

    return {"models": available}


@app.post("/api/eval/start")
async def start_eval(body: dict, background_tasks: BackgroundTasks):
    if not body.get("model_id"):
        raise HTTPException(status_code=400, detail="model_id is required")

    run_id = str(uuid.uuid4())
    active_runs[run_id] = {
        "run_id": run_id,
        "status": "queued",
        "model_id": body.get("model_id"),
        "start_time": datetime.now(timezone.utc).isoformat(),
        "categories": body.get("categories", [c["id"] for c in settings.categories]),
    }
    background_tasks.add_task(run_evaluation, run_id, body)
    return {"run_id": run_id}


@app.get("/api/eval/{run_id}/status")
async def get_status(run_id: str):
    if run_id in active_runs:
        return active_runs[run_id]
    run_path = os.path.join(settings.results_dir, f"{run_id}.json")
    if os.path.exists(run_path):
        with open(run_path) as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Run not found")


@app.get("/api/eval/{run_id}/results")
async def get_results(run_id: str):
    run_path = os.path.join(settings.results_dir, f"{run_id}.json")
    if os.path.exists(run_path):
        with open(run_path) as f:
            return json.load(f)
    if run_id in active_runs:
        return active_runs[run_id]
    raise HTTPException(status_code=404, detail="Run not found")


@app.get("/api/report/{run_id}/pdf")
async def download_pdf(run_id: str):
    run_path = os.path.join(settings.results_dir, f"{run_id}.json")
    if not os.path.exists(run_path):
        raise HTTPException(status_code=404, detail="Run not found")
    with open(run_path) as f:
        run_data = json.load(f)
    generator = PDFReportGenerator()
    pdf_bytes = generator.generate(run_data)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="redteam-report-{run_id[:8]}.pdf"'},
    )


@app.get("/api/history")
async def get_history():
    runs_dir = settings.results_dir
    if not os.path.exists(runs_dir):
        return {"runs": []}

    runs = []
    for fname in sorted(os.listdir(runs_dir), reverse=True):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(runs_dir, fname)
        try:
            with open(fpath) as f:
                data = json.load(f)
            runs.append({
                "run_id": data.get("run_id"),
                "model_id": data.get("model_id"),
                "overall_score": data.get("overall_score"),
                "categories": data.get("categories", []),
                "duration_seconds": data.get("duration_seconds"),
                "start_time": data.get("start_time"),
                "status": data.get("status", "unknown"),
                "iterative_mode": data.get("iterative_mode", False),
                "compare_model_id": data.get("compare_model_id"),
            })
        except Exception:
            continue
    return {"runs": runs}


@app.delete("/api/history/{run_id}")
async def delete_run(run_id: str):
    if run_id == "sample-demo-run-0001":
        raise HTTPException(status_code=403, detail="Sample run cannot be deleted")
    run_path = os.path.join(settings.results_dir, f"{run_id}.json")
    if not os.path.exists(run_path):
        raise HTTPException(status_code=404, detail="Run not found")
    os.remove(run_path)
    active_runs.pop(run_id, None)
    return {"deleted": run_id}


@app.websocket("/ws/eval/{run_id}")
async def websocket_eval(websocket: WebSocket, run_id: str):
    await websocket.accept()

    if run_id not in active_connections:
        active_connections[run_id] = []
    active_connections[run_id].append(websocket)

    try:
        while True:
            await asyncio.sleep(25)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        conns = active_connections.get(run_id, [])
        if websocket in conns:
            conns.remove(websocket)
    except Exception:
        conns = active_connections.get(run_id, [])
        if websocket in conns:
            conns.remove(websocket)
