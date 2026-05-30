# 🦜🔗 LangChain Complete Showcase

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-1.3+-E2B93D.svg?style=for-the-badge)](https://www.langchain.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An ultra-premium, modular, and highly interactive **dark-mode glassmorphic** web application demonstrating advanced **LangChain** architectures integrated with a robust **FastAPI** backend. 

Designed with native ES6 modular JavaScript and structured Python package patterns, this application makes it easy to explore, audit, and experiment with cutting-edge LLM modules in real-time.

---

## 📁 Modular Codebase Structure

The project has been architected to adhere strictly to industry-standard modular design principles, separating endpoints, business logic, configuration states, and UI components:

```
langchain/
├── main.py              # Root-level entry point (mounts static/ and starts Uvicorn)
├── pyproject.toml       # Modern Python packaging configurations & dependencies
├── requirements.txt     # Locked production package dependencies
├── run.bat              # Windows single-click automated app launcher
├── .env.example         # Template guide for setting up API credentials
├── .gitignore           # Production-grade git excludes file
├── DOCUMENTATION.md     # In-depth internal developer setup & features guide
├── README.md            # Interactive repository showcase (this file)
│
├── app/                 # Backend FastAPI package
│   ├── __init__.py      # App package initializer
│   ├── main.py          # Central FastAPI instantiation, CORS configs, & router inclusions
│   ├── dependencies.py  # Shared Embeddings models, LLM factories, & shared in-memory caches
│   └── routers/         # API Endpoint Routers
│       ├── __init__.py
│       ├── chat.py      # Conversational Chat LLM playgrounds
│       ├── rag.py       # Document upload, vector index, and similarity Q&A search
│       ├── agent.py     # Tool-binding smart agents and execution thought loops
│       ├── prompt.py    # Visual template interpolations and sequential prompt chains
│       └── memory.py    # Buffer vs. Summary side-by-side memory comparisons
│
└── static/              # Frontend static web directory
    ├── index.html       # Sleek HTML dashboard structure (Outfit & Inter fonts)
    ├── styles.css       # Elegant glassmorphism, responsive grid, & glow accent animations
    └── js/              # ES6 Modular Javascript files
        ├── config.js    # Global client state variables, models DB, and headers builders
        ├── ui.js        # Notification alerts, spinners, and bubble generators
        ├── chat.js      # Chat playground user/AI messaging routines
        ├── rag.js       # File upload forms, vector indexing callbacks, and QA fetches
        ├── agent.js     # Agent executions and live monospaced terminal logs
        ├── prompt.js    # Dynamic templates chaining and node graphs
        ├── memory.js    # Comparative memory data mapping
        └── main.js      # Orchestrator binding Range events, Key blur toggles, & active tabs
```

---

## 🚀 Interactive Features

Explore five specialized Large Language Model (LLM) and LangChain modules inside the dashboard:

### 1. 💬 LLM Chat Playground
* Seamlessly swap active backend LLM providers (**Google Gemini**, **OpenAI**, **Groq**) and configurations in real-time.
* Custom-configure temperature ranges and test response behaviors using custom System Prompts.
* Premium conversational message bubbles styled with smooth fade-in animations.

### 2. 📄 Retrieval-Augmented Generation (RAG)
* Ingest standard text (`.txt`) or Markdown (`.md`) files using a sleek drag-and-drop zone.
* Documents are dynamically divided into semantic blocks (customizable chunk size & overlap) and vectorized using an **InMemoryVectorStore**.
* Fallback features support a robust local cosine similarity hash encoder if API keys are absent, ensuring offline functionality.
* Run semantic context queries and review retrieved document reference chunks and source names.

### 3. 🤖 AI Agents & Tool Calling
* Spawn intelligent agents equipped with a professional tool suite:
  1. **Math Calculator**: Safely sandboxed standard arithmetic interpreter.
  2. **Science KB**: Quick lookups for terms like Photosynthesis, Quantum Entanglement, CRISPR, etc.
  3. **DDG Web Search**: Simulated current facts and weather information lookups.
* Inspect the agent's live **thought loop stream** inside a realistic monospaced retro IDE terminal, tracing its thoughts, tool calls, tool responses, and final synthesized answers.

### 4. 🎛️ Prompt Chains Playground
* visually trace sequential template flows in a rendered graph.
* Prompt 1 outputs (e.g. generating a story protagonist's name) flow directly into Prompt 2 variables to build a movie plot outline.

### 5. 🧠 Memory Inspector
* Input multi-turn conversational records and inspect how they are compiled.
* Evaluates **Conversation Buffer Memory** (exact verbatim dialogues) side-by-side with **Conversation Summary Memory** (progressive summaries generated by a background LLM) to visually trace window context optimization.

---

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.10 or higher installed on your system.

### 1. Environment Setup
Create and activate a Python virtual environment:
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
Install locked dependencies:
```powershell
pip install -r requirements.txt
```

### 3. Configure Credentials
Duplicate [.env.example](file:///d:/Agentic%20AI/langchain/.env.example) and name it `.env` in the root folder, then populate your keys:
```env
GOOGLE_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
GROQ_API_KEY=your-groq-key-here
```
*Note: You can also keep this blank and paste your keys directly into the optional API Keys panel in the sidebar at runtime.*

---

## 💻 How to Run

### Method A: Single-Click Launcher (Windows)
Double-click the **`run.bat`** file in your root workspace. It will automatically check your Python environment, activate it, and start the FastAPI server on port `8000`.

### Method B: Manual Command
If executing from your terminal:
```powershell
# Activate environment if not active
.venv\Scripts\Activate.ps1

# Start FastAPI server
python main.py
```

Once running, navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🎨 UI & Architectural Highlights
* **Zero-Scroll Stacking Bugfix**: Transitioned tab panels to use a robust dynamic `display: none` toggle following a smooth `150ms` fade-out, eliminating layout overlays and excessive empty scroll heights.
* **Auto-Collapse API keys**: Made the API Keys optional panel start collapsed by default, and automatically slide shut the moment a user presses `Enter` inside any key field or blurs out.
* **Vector Nav SVGs**: Replaced all basic CSS icon shapes with elegant responsive SVG paths that scale (`transform: scale(1.1) rotate(2deg)`) and glow when selected.
* **Refined Typography**: Styled with geometric **Outfit** headings, legible **Inter** copy, and monospaced **Fira Code** outputs.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
