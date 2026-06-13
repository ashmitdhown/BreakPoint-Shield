# BreakPoint

BreakPoint is an automated red-teaming tool for Large Language Models. It throws hundreds of adversarial prompts at your LLM and streams the failures to a real-time dashboard so you can see exactly where the model breaks before you put it in production.

It currently evaluates models across 6 categories: Hallucinations, Jailbreaks, Prompt Injections, Toxicity, Demographic Bias, and RAG Faithfulness.

## How it works

1. **Select a target:** Point BreakPoint at an OpenAI, Groq, or local Ollama model.
2. **Run the gauntlet:** The Python engine sends concurrent adversarial prompts across your selected categories.
3. **Live Dashboard:** Results stream into the React UI over WebSockets in real-time.
4. **Iterative Red-Teaming (MART):** If enabled, the system uses an LLM judge to analyze the failures from Round 1 and automatically generates new, targeted attacks for Round 2.
5. **Reporting:** Exports a PDF audit report of the run.

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Groq API key (used for the LLM judge, get one free at [console.groq.com](https://console.groq.com))

### Local Setup

```bash
git clone https://github.com/ashmitdhown/BreakPoint-Shield.git
cd BreakPoint-Shield

# Install root dependencies for concurrently
npm install

# Install all backend and frontend dependencies
npm run install:all

# Configure environment
cp .env.example .env 
# Add your GROQ_API_KEY to the .env file now!

# Optional but recommended: pre-cache the evaluation datasets (~2 mins)
npm run seed

# Run the dev servers (starts both FastAPI and Vite concurrently)
npm run dev
```

Visit **http://localhost:5173** to access the dashboard.

### Docker Setup

If you prefer Docker:
```bash
git clone https://github.com/ashmitdhown/BreakPoint-Shield.git
cd BreakPoint-Shield
cp .env.example .env # Don't forget your Groq API key
npm run docker:up
```
Visit http://localhost:3000.

## Configuration (.env)

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required. Used for the LLM judge (`llama-3.3-70b-versatile`). |
| `OPENAI_API_KEY` | Optional. If you want to evaluate OpenAI models. |
| `OLLAMA_BASE_URL` | Optional. Defaults to `http://localhost:11434` for local models. |
| `LANGCHAIN_API_KEY` | Optional. Set this and `LANGCHAIN_TRACING_V2=true` to enable LangSmith tracing. |

## Development Commands

```bash
# Run backend tests
cd backend && pytest tests/ -v

# Run a quick terminal smoke test without the UI
npm run demo
```

## Tech Stack
- **Backend:** FastAPI, Python, Pytest, fpdf2, LangSmith
- **Frontend:** React, Vite, Tailwind CSS, Zustand, Recharts
- **Infrastructure:** Docker Compose
