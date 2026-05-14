# Permit Radar AI

AI-powered permit, zoning, and regulatory compliance monitoring for Quebec small businesses and construction projects.

Permit Radar AI helps founders, operators, and project teams understand which regulations may apply to a proposed business or construction project. Users can describe a project, upload supporting documents, receive a structured compliance snapshot, ask follow-up questions, and monitor new legal updates against stored project documents at the clause level.

> Built as a full-stack AI product prototype with Next.js, TypeScript, OpenAI, PostgreSQL, and pgvector.

## Why This Project Matters

Small businesses and construction teams often lose time and money because permit, zoning, lease, heritage, fire-safety, payment, and municipal requirements are difficult to track. Permit Radar AI turns scattered project details and regulatory text into a practical decision-support workflow:

- Extract the key facts from a business or construction project.
- Match the project to relevant regulations and recent alerts.
- Generate a clear risk report with recommended next steps.
- Store uploaded documents as searchable structured clauses.
- Detect which document clauses may be affected when a law changes.
- Provide a citation-aware chat experience over regulatory and project context.

The result is a recruiter-friendly demonstration of product thinking, AI integration, retrieval-augmented generation, data modeling, and polished frontend execution.

## Core Features

### AI Project Analysis

- Accepts a natural-language project description.
- Extracts a structured project profile, including business type, location, activities, scale, and special considerations.
- Produces a personalized compliance snapshot with applicable regulations, risk levels, recent alerts, and recommended actions.

### Document-Aware RAG Pipeline

- Parses supported uploaded files such as PDF, TXT, and Markdown.
- Breaks documents into structured clauses and subclauses.
- Generates deterministic local embeddings for demos or OpenAI embeddings for live usage.
- Stores document chunks in PostgreSQL with `pgvector`.
- Retrieves relevant clauses using vector search plus BM25-style reranking.

### Law Update Monitoring

- Stores structured law and regulation updates.
- Embeds new legal updates and searches across project document chunks.
- Identifies affected subclauses and drafts project-specific notifications.
- Persists notifications for dashboard review.

### Regulatory Chat

- Answers user questions using retrieved regulatory sources, seeded demo legal excerpts, laws, alerts, and uploaded project document clauses.
- Returns citations and matched excerpts.
- Falls back gracefully when OpenAI is unavailable.

### Recruiter-Focused Product UI

- Modern Next.js dashboard with project history, project switching, renaming, and deletion.
- Risk summary cards, alert views, compliance snapshots, and chat.
- Local file persistence for uploaded project files.
- Responsive interface built with Tailwind CSS, shadcn-style components, and Lucide icons.

## Tech Stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn-style UI components, Lucide React |
| AI | OpenAI chat completions and embeddings |
| Retrieval | pgvector, hybrid vector + keyword reranking |
| Database | PostgreSQL, SQL schema migrations |
| File Parsing | PDF parsing, plain text, Markdown |
| Tooling | ESLint, Docker Compose, npm |

## Architecture

```text
User project description / uploaded documents
        |
        v
Next.js API routes
        |
        v
AI project profile extraction
        |
        +--> Regulation and alert matching
        |        |
        |        v
        |   Compliance snapshot + risk report
        |
        +--> Document parsing and clause extraction
                 |
                 v
            Embedding generation
                 |
                 v
      PostgreSQL document_chunks with pgvector
                 |
                 v
Law update -> vector retrieval -> BM25 rerank -> AI impact analysis
                 |
                 v
       Affected subclauses + dashboard notifications
```

## Notable Implementation Details

- **Separation of concerns:** AI calls, file parsing, database access, matching logic, document structure, retrieval, impact analysis, and chat are split into focused modules under `lib/`.
- **Local-first demo mode:** `MOCK_EMBEDDINGS=true` enables deterministic embeddings without requiring paid embedding calls.
- **Production-shaped data model:** Projects, documents, chunks, laws, and notifications are persisted in PostgreSQL with indexes and cascading relationships.
- **Hybrid retrieval:** Candidate chunks are retrieved by vector similarity and reranked with BM25-style keyword scoring to improve legal-text precision.
- **Graceful AI fallback:** Several flows include deterministic fallback behavior so the app can still demonstrate core logic when the OpenAI API is unavailable.
- **Structured outputs:** Prompts request strict JSON for project profiles, risk reports, law structures, and impact scans, making AI responses easier to validate and use in the UI.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop
- Optional: OpenAI API key for live AI analysis

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local`:

```bash
DATABASE_URL=postgres://permit_radar:permit_radar@localhost:5433/permit_radar
MOCK_EMBEDDINGS=true
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=
```

For local demos, keep `MOCK_EMBEDDINGS=true`. Add `OPENAI_API_KEY` when you want live OpenAI analysis and reasoning.

### 3. Start PostgreSQL

```bash
docker compose up -d
npm run db:init
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

```bash
npm run dev       # Start the Next.js development server
npm run build     # Create a production build
npm run start     # Run the production server
npm run lint      # Run ESLint
npm run db:init   # Initialize the local PostgreSQL schema
```

## API Overview

| Route | Purpose |
| --- | --- |
| `POST /api/analyze` | Analyze a project description and optional uploaded documents. |
| `POST /api/chat` | Answer compliance questions using retrieved context. |
| `GET /api/laws` | List stored law updates. |
| `POST /api/laws` | Create a law update and run monitoring across projects. |
| `POST /api/impact-scan` | Scan one project against one law update. |
| `GET /api/notifications` | Fetch generated impact notifications. |
| `POST /api/laws/seed-demo` | Seed demo law/regulatory updates. |

## Project Structure

```text
app/                     Next.js App Router pages and API routes
components/permit-radar/ Product dashboard and onboarding UI
components/ui/           Reusable UI primitives
data/                    Demo regulations, alerts, and legal excerpts
db/init/                 PostgreSQL and pgvector schema
lib/                     AI, database, RAG, matching, parsing, and project logic
scripts/                 Local setup scripts
```

## Demo Flow

1. Start the database and development server.
2. Enter a project description, such as a bakery in Plateau-Mont-Royal or a heritage renovation in Montreal.
3. Review the generated compliance snapshot, alerts, and risk report.
4. Upload supported project documents to create searchable document clauses.
5. Seed or create a law update.
6. Review generated notifications that identify affected document subclauses.
7. Use the chat tab to ask project-specific regulatory questions.

## What This Demonstrates

This project highlights the ability to:

- Design and implement an end-to-end AI product workflow.
- Build clean TypeScript modules around complex AI behavior.
- Combine LLM reasoning with retrieval and deterministic fallback logic.
- Model real application data in PostgreSQL with vector search.
- Translate a domain problem into a usable, polished product experience.
- Ship a recruiter-ready full-stack application with practical setup instructions.

## Disclaimer

Permit Radar AI provides legal and permitting information for demonstration purposes. It is not legal advice. Real permitting, zoning, construction, and regulatory decisions should be reviewed by qualified legal, municipal, or permitting professionals.
