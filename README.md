# ⚖️ LegiDocGPT — Clear, Accessible Legal Insight  

## 📌 Project Description  
**LegiDocGPT** is an **agentic AI platform** that ingests complex legal documents (PDF, Word, scanned text), extracts key clauses, risks, and obligations, then produces **plain-language summaries and actionable guidance**.  

It combines:  
- **Autonomous clause analyzer** for obligations, penalties, and hidden risks  
- **Interactive chatbot** that answers follow-up questions in simple terms  
- **Auto-generated visuals** (rights vs obligations, risk maps, timelines) for instant clarity  

**Who Benefits:**  
- **Everyday Citizens** — Understand rental, loan, or service agreements before signing  
- **Small Businesses** — Review vendor/client contracts faster and smarter  
- **Students & Learners** — Legal concepts explained without jargon  

---

## 🏗 ASCII Architecture Diagram  
  ┌──────────────────────────┐
  │   Frontend (React)       │
  │  Next.js + TailwindCSS   │
  │  shadcn/ui + Jotai       │
  │  Chart.js / Mermaid.js   │
  └───────────▲──────────────┘
              │ API Calls
              ▼
  ┌──────────────────────────┐
  │   Backend (FastAPI)      │
  │  LangChain + LangGraph   │
  │  RAG Workflows           │
  │  Gemini LLM              │
  │  Tavily API              │
  │  Redis Caching           │
  │  MongoDB Storage         │
  └───────────▲──────────────┘
              │
              ▼
  ┌──────────────────────────┐
  │   Data Sources            │
  │  PDFs / Word / Scanned    │
  │  OCR for image-based text │
  │  Legal Precedent APIs     │
  └──────────────────────────┘

---

## ⚙️ Setup Instructions  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/yourusername/legidocgpt.git
cd legidocgpt
cd backend
pip install -r requirements.txt
cd frontend
npm install

GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379
MONGO_URI=your_mongodb_connection
TAVILY_API_KEY=your_tavily_api_key


📦 Dependencies
Runtime dependencies

@google/generative-ai ^0.24.1

langgraph

@prisma/client ^6.8.2

@tavily/core ^0.5.2

cookie-parser ^1.4.7

cors ^2.8.5

express ^5.1.0

fs ^0.0.1-security

ioredis ^5.6.1

jsonwebtoken ^9.0.2

pdf-parse ^1.1.1

prisma ^6.8.2

typescript ^5.8.3

zod ^3.25.28

Development / TypeScript types

@types/cookie-parser ^1.4.8

@types/cors ^2.8.18

@types/express ^5.0.1

@types/ioredis ^5.0.0

@types/jsonwebtoken ^9.0.9

@types/pdf-parse ^1.1.5

typescript ^5.8.3
