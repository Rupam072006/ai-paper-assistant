# AI Research Paper Assistant

> **AI-Powered Scientific Literature Review & Research Intelligence Platform**  
> An end-to-end, publication-grade platform for multi-paper synthesis, automated metadata and metric extraction, semantic comparison, grounded RAG Q&A, research gap discovery, and PDF report generation.

---

## 🌟 Overview & Workflow

The **AI Research Paper Assistant** transforms dense academic PDFs into structured, actionable intelligence. It replaces tedious manual reading and spreadsheet tracking with an automated, AI-driven literature review workflow:

```
[Upload 1–10 Research Papers (PDF)]
               │
               ▼
[Automated NLP & RAG Pipeline]
  ├── PyMuPDF Text & Structure Extraction
  ├── Section & Page-Level Chunking (~500 tokens)
  ├── Sentence-Transformers (`all-MiniLM-L6-v2`) Embedding Generation
  ├── FAISS Vector Store Indexing
  └── Gemini 2.5 Flash / Local Heuristic Analysis
               │
               ▼
[Interactive Dashboard & Modules]
  ├── 📊 Literature Matrix & Technical Synthesis (Single-Paper & Multi-Paper)
  ├── 🤖 Research Copilot (Grounded Chat with Slash Commands & Suggested Follow-ups)
  ├── 📑 Publication-Grade PDF Report Export (Interactive Print Preview & Citations)
  └── 🔍 Research Gap & Opportunity Discovery
```

---

## 🚀 Key Modules & Capabilities

### 1. 📤 Upload Papers & Real-Time Processing Pipeline
- **Drag-and-Drop Multi-File Ingestion**: Upload individual or batch PDF manuscripts (up to 50MB per paper).
- **Live Multi-Stage Pipeline Progress**: Real-time visual progress monitoring covering:
  - Manuscript metadata parsing & DOI resolution
  - Executive summary and problem statement extraction
  - Architectural models, algorithms, and benchmark extraction
  - Dataset name, sample size, and feature extraction
  - Quantitative performance metrics extraction (Accuracy, F1-Score, AUC-ROC, BLEU, ROUGE, RMSE, R²)
  - Critical limitation detection & future research directions
- **Demo Benchmark Seeding**: One-click demo loader to immediately populate the workspace with real-world AI/ML papers for instant exploration.

### 2. 📊 Literature Matrix & Technical Synthesis
- **Dynamic Scope Selector**: Filter all dashboard metrics, charts, and breakdown sections dynamically for either **"All Uploaded Papers"** or any **Specific Single Paper**.
- **Real-Time KPI Metric Cards**:
  - **Active Scope / Total Papers**: Total loaded papers in view.
  - **Algorithms**: Number of distinct models & neural architectures identified.
  - **Datasets**: Number of benchmark datasets & corpora referenced.
  - **Gaps Found**: Number of distinct research limitations discovered.
  - **Metric Score**: Normalized empirical score or paper-specific metric (Accuracy, F1, etc.).
- **Single-Paper Deep Dive Layout**:
  - **Target Paper Banner**: Executive summary callout box with publication venue, authors, and problem statement.
  - **Evaluation Metrics & Key Findings**: Structured quantitative badges with metric formulation and baseline comparison callouts.
  - **Datasets & Methodological Rigor**: Primary datasets, sample sizes, preprocessing pipelines, novel contributions, and research boundaries.
- **Multi-Paper Comparative Matrix**: Side-by-side technical evaluation table across all uploaded papers with one-click inspection and copilot navigation.

### 3. 🤖 Research Copilot (Grounded AI Q&A)
- **Context-Aware RAG Engine**: Grounded responses powered by Google Gemini (Gemini 2.5 Flash / Flash Lite) with fallback to backend vector similarity search.
- **Scope-Filtered Context**: Switch between asking questions across the entire literature corpus or focusing strictly on a single selected manuscript.
- **Interactive Slash Commands**:
  - `/summarize` — Generate structured abstract & key contributions.
  - `/critique` — Analyze methodology weaknesses, biases, and research gaps.
  - `/data` — Extract dataset specifics, sample sizes, and preprocessing steps.
- **Dynamic Follow-Up Questions**: Contextually generated suggested question pills with one-click execution.
- **LocalStorage History Persistence**: Persists conversations across sessions with one-click history clearing.

### 4. 📑 Publication-Grade Export Reports & Citations
- **Individual Paper PDF Synthesis Reports**: Generates structured, publication-ready PDF reports containing executive summaries, technical breakdowns, experimental metrics, and risk assessments.
- **Interactive A4 Print Preview Modal**: Inspect exact document styling, layouts, and page breaks before downloading.
- **Page Break & Overlap Protection**: Client-side rendering using `html2canvas` and `jsPDF` with `break-inside: avoid;` CSS rules, clean A4 margins, and multi-page pagination.
- **Multi-Format Academic Citations**: One-click formatted citations in **IEEE**, **APA**, **MLA**, and **BibTeX** formats.

---

## 🎨 Modern Dark Glassmorphism Design System

The application features a sleek dark UI built with modern aesthetics:
- **Palette**: Deep slate and zinc tones (`bg-[#0B0F17]` root canvas, `bg-[#0F172A]` sidebars and headers).
- **Glassmorphic Overlays**: `backdrop-blur-xl bg-slate-900/50 border border-slate-800/80` with micro-borders.
- **Accent Glows**: Indigo-to-purple glowing accents (`from-indigo-500/20 to-purple-600/0`), glowing focus rings, and custom scrollbars.
- **Crisp Typography**: High-contrast, legible typography scale with balanced hierarchy and responsive layouts.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                    REACT 18 + VITE FRONTEND                │
│  Tailwind CSS • Lucide Icons • jsPDF • html2canvas • Axios │
└─────────────────────────────┬──────────────────────────────┘
                              │ REST APIs / JSON
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    FASTAPI ASYNC BACKEND                   │
│  Pydantic v2 • SQLAlchemy 2.0 Async ORM • PyMuPDF (fitz)   │
└──────────────┬──────────────────────────────┬──────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│     AI & VECTOR PIPELINE     │ │     DATABASE STORAGE      │
│  Sentence-Transformers       │ │  XAMPP MySQL (aiomysql)   │
│  FAISS Vector Index          │ │  SQLite (aiosqlite)       │
│  Gemini 2.5 Flash / OpenAI   │ │  10 Relational Tables     │
└──────────────────────────────┘ └───────────────────────────┘
```

### Technology Highlights:
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, `html2canvas`, `jsPDF`.
- **Backend**: Python 3.9+, FastAPI, Pydantic, SQLAlchemy 2.0 (Async), PyMuPDF (`fitz`), ReportLab.
- **Embeddings & Vector Search**: Sentence-Transformers (`all-MiniLM-L6-v2`), FAISS.
- **LLM Integration**: Provider-agnostic router supporting **Google Gemini API**, **OpenAI**, **Ollama**, and **Local Heuristic Synthesizer**.

---

## 🗄️ Database Setup & Configuration

The application is configured to connect to **XAMPP MySQL** out of the box via SQLAlchemy 2.0 Async ORM (`aiomysql` driver), while also supporting SQLite and PostgreSQL.

### Option 1: XAMPP MySQL (Default)
1. Open **XAMPP Control Panel** and click **Start** next to **MySQL** (Default port `3306`).
2. The root `.env` file is pre-configured with:
   ```env
   DATABASE_URL="mysql+aiomysql://root:@localhost:3306/ai_research_db"
   ```
3. When you run `python app/main.py`, the backend automatically creates the `ai_research_db` database on your XAMPP MySQL server and initializes all tables automatically.
4. You can open `http://localhost/phpmyadmin` to view tables.

### Option 2: SQLite (Zero Setup Fallback)
If XAMPP is not running, set `DATABASE_URL` in `.env` to:
```env
DATABASE_URL="sqlite+aiosqlite:///./ai_research.db"
```

### Option 3: PostgreSQL
```env
DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/ai_research_db"
```

---

### 📊 Database Relational Schema (10 Tables)

| Table Name | Description | Key Attributes |
|---|---|---|
| `users` | User accounts | `id`, `email`, `password_hash`, `full_name`, `created_at` |
| `projects` | Research workspaces | `id`, `user_id`, `name`, `description`, `created_at` |
| `papers` | Uploaded PDF manuscripts | `id`, `project_id`, `title`, `file_name`, `file_path`, `authors`, `publication_year`, `abstract`, `raw_text` |
| `paper_analysis` | Extracted NLP metadata | `id`, `paper_id`, `research_problem`, `methodology`, `algorithms`, `dataset_name`, `dataset_size`, `accuracy`, `f1_score`, `limitations`, `future_work` |
| `chunks` | Text chunks for RAG | `id`, `paper_id`, `chunk_index`, `content`, `page_number`, `section_name` |
| `questions` | Copilot Q&A history | `id`, `project_id`, `question`, `answer`, `sources`, `created_at` |
| `comparisons` | Saved multi-paper matrices | `id`, `project_id`, `title`, `synthesis_text`, `created_at` |
| `comparison_papers`| Junction table | `comparison_id`, `paper_id` |
| `research_insights`| Discovered gaps & directions | `id`, `project_id`, `insight_type`, `title`, `description`, `confidence` |
| `job_statuses` | Background job tracker | `id`, `paper_id`, `status`, `progress`, `stage`, `error_message` |

---

## ⚙️ Quick Start Installation & Setup

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** & **npm**
- **XAMPP** (optional for MySQL)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python app/main.py
```
> The FastAPI backend server will start on **`http://localhost:8000`** with interactive Swagger documentation at **`http://localhost:8000/docs`**.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
> The React Vite dashboard will launch on **`http://localhost:5173`**.

---

## 🔑 Environment Variables Configuration

Create or update the `.env` file in the `backend/` directory:

```env
# Database Configuration (XAMPP MySQL default)
DATABASE_URL="mysql+aiomysql://root:@localhost:3306/ai_research_db"

# Optional: Google Gemini API Key (for Copilot Q&A & Analysis)
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: OpenAI API Key
OPENAI_API_KEY=""

# Server Configuration
PORT=8000
HOST="127.0.0.1"
ENVIRONMENT="development"
```

---

## 📂 Project Directory Structure

```text
AI Research/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (papers, chat, analytics, export)
│   │   ├── core/            # App configuration, database connection, security
│   │   ├── models/          # SQLAlchemy async database models
│   │   ├── schemas/         # Pydantic request/response validation schemas
│   │   ├── services/        # PDF extraction, NLP, RAG vector indexing, Gemini LLM
│   │   └── main.py          # Application entrypoint
│   ├── uploads/             # Stored PDF manuscripts
│   ├── requirements.txt     # Backend Python dependencies
│   └── .env                 # Backend environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, CustomPaperDropdown, ReportPreviewModal
│   │   ├── pages/           # Upload, Dashboard (Matrix), Chat (Copilot), Reports
│   │   ├── services/        # API clients, Gemini service, PDF export generator
│   │   ├── App.jsx          # Main application layout & navigation routing
│   │   ├── index.css        # Tailwind CSS & Glassmorphism Design System
│   │   └── main.jsx         # React application entrypoint
│   ├── package.json         # Frontend npm dependencies & scripts
│   ├── tailwind.config.js   # Tailwind configuration
│   └── vite.config.js       # Vite bundler configuration
└── README.md                # Project documentation
```

---

## 🛡️ License & Academic Usage
Created as a major project for **BE CSE (AI & ML)**. Designed for researchers, academics, and students conducting scientific literature reviews and multi-paper comparative synthesis.
