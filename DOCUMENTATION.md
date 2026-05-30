# LangChain Complete Showcase Application

A premium, interactive, and fully modular web interface demonstrating advanced **LangChain** concepts integrated with a robust **FastAPI** backend. 

---

## 📁 Project Architecture & Structure

The codebase is designed using a clean separation of concerns. Both backend endpoints and frontend client scripts are fully modularized:

### 1. Backend Architecture (`app/` package)
The FastAPI backend is structured as an extensible Python package:
```
app/
├── __init__.py
├── main.py              # Central FastAPI app assembly, middlewares, and routing inclusion
├── dependencies.py      # Embedding cache, custom local Embeddings class, and LLM factories
└── routers/
    ├── __init__.py
    ├── chat.py          # /api/chat - Conversational LLM endpoints
    ├── rag.py           # /api/rag/* - Ingesting documents, listing files, and Q&A retrieval
    ├── agent.py         # /api/agent/* - Tool bindings and Agent Executor thought loops
    ├── prompt.py        # /api/prompt/* - Dynamic prompt templates chain execution
    └── memory.py        # /api/memory/* - Buffer vs. Summary progressive comparisons
```

### 2. Frontend Architecture (`static/js/` ES6 Modules)
The browser client utilizes modern browser-native ES6 JavaScript modules loaded dynamically in `index.html`:
```
static/
├── index.html           # Renders UI container and loads type="module" js/main.js
├── styles.css           # Premium glassmorphism design variables and visuals
└── js/
    ├── config.js        # Manages global state variables, model indices, and header credentials
    ├── ui.js            # Standard UI helper actions (loading spinners, custom notifications, bubble styling)
    ├── chat.js          # Chat interactions and response mappings
    ├── rag.js           # Drag-and-drop document upload and RAG search actions
    ├── agent.js         # Preset executions and terminal thought-loop streams
    ├── prompt.js        # Sequential prompt variables mapping andvisual outputs
    ├── memory.js        # Comparative history turn logs mapping
    └── main.js          # Entrypoint that binds DOM nodes, initializes storage, and switches tabs
```

---

## 🚀 Features

This application showcases five core LLM and LangChain architectures in real-time:

1. **LLM Chat Playground**:
   - Seamlessly switch between **Google Gemini**, **OpenAI**, and **Groq** models.
   - Adjust temperatures and roles using a customized System Prompt.
   - Live stream status indicators and loading states.

2. **Retrieval-Augmented Generation (RAG)**:
   - Upload text (`.txt`) and Markdown (`.md`) files.
   - Files are automatically split into overlapping semantic chunks and vectorized using either local Fallback Embeddings or Google/OpenAI embeddings (based on API keys provided).
   - Query indexed documents and review exact retrieved reference chunks and source document names.

3. **AI Agents & Tool Calling**:
   - Executes smart agents utilizing tool bindings.
   - Equipped with standard **Math Calculator**, **DuckDuckGo Web Search**, and a **Science Reference Knowledge Base**.
   - Review a full monospaced terminal logs stream displaying the agent's internal thought patterns, tool calls, tool responses, and final answers step-by-step.

4. **Prompt Playground & Chains**:
   - Render and chain sequential prompts together visually.
   - The output of Prompt 1 (e.g. generating a protagonist's name) flows dynamically into the variables of Prompt 2 (generating a movie plot starring that character).

5. **Memory Inspector**:
   - Contrast memory retention layers side-by-side.
   - Inspect exact progressive prompt contexts compiled under `ConversationBufferMemory` versus `ConversationSummaryMemory`.

---

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.10 or higher installed on your system.

### 1. Environment Setup
Clone the repository or navigate to the project directory, then create a Python virtual environment:
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
Install all required LangChain, FastAPI, and model packages:
```powershell
pip install -r requirements.txt
```

### 3. API Key Configuration
We have provided an [.env.example](file:///d:/Agentic%20AI/langchain/.env.example) file outlining required variables. To configure your keys:
1. Make a copy of `.env.example` and rename it to `.env`.
2. Open `.env` and fill in your model API keys:
   ```env
   GOOGLE_API_KEY=your-gemini-key
   OPENAI_API_KEY=your-openai-key
   GROQ_API_KEY=your-groq-key
   ```
*(Alternatively, you can leave `.env` blank and paste your keys directly into the sidebar's optional settings pane during runtime).*

---

## 💻 How to Run the Application

We have created an automated launcher script called [run.bat](file:///d:/Agentic%20AI/langchain/run.bat) for Windows users to start the app with a single click.

### Method A: Single-Click Launcher (Windows)
Double-click the **`run.bat`** file in your root workspace. It will automatically activate your virtual environment and start the FastAPI server.

### Method B: Manual Execution
If executing manually from your shell:
```powershell
# Activate environment if not already activated
.venv\Scripts\Activate.ps1

# Run the startup script
python main.py
```

Open your web browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---