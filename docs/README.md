# 🏛️ Claims Copilot — Architecture & Deep Dive

This document provides in-depth technical documentation, architectural sequence diagrams, and database schemas for **Claims Copilot**.

---

## 📑 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Document → RAG Pipeline](#2-document--rag-pipeline)
3. [User Navigation & Flow](#3-user-navigation--flow)
4. [Database ER Diagram](#4-database-er-diagram)
5. [Structured Analysis Flow](#5-structured-analysis-flow)

---

## 1. System Architecture

The following diagram illustrates the high-level architecture of Claims Copilot, showing interactions between the Next.js frontend/backend, Supabase services, vector embeddings engine, and LLM inference provider.

```mermaid
graph TD
    subgraph Client ["Client (Browser)"]
        UI["Next.js App Router (React 19)"]
        CTX["AppContext (React Context)"]
        UI --- CTX
    end

    subgraph Server ["Next.js Server API Routes"]
        AUTH_MW["Supabase SSR Auth Middleware"]
        UP_API["/api/documents/upload"]
        DOC_API["/api/documents & /api/documents/[id]"]
        CHAT_API["/api/chat (RAG Execution)"]
        SESS_API["/api/analysis-sessions"]
    end

    subgraph Data ["Supabase Cloud Storage & Postgres"]
        S_AUTH["Supabase Auth (JWT)"]
        S_STOR["Supabase Storage ('documents' bucket)"]
        PG["Supabase Postgres DB (pgvector)"]
        RPC["RPC match_document_chunks()"]
        PG --- RPC
    end

    subgraph AI ["External AI Services"]
        HF["Hugging Face Inference API (BAAI/bge-small-en-v1.5)"]
        GROQ["Groq Inference API (openai/gpt-oss-120b)"]
    end

    UI -->|"HTTP Request"| AUTH_MW
    AUTH_MW -->|"Validate Session"| S_AUTH
    
    UP_API -->|"Store File"| S_STOR
    UP_API -->|"Extract & Chunk"| UP_API
    UP_API -->|"Generate Embeddings"| HF
    UP_API -->|"Save Metadata & Chunks"| PG

    DOC_API -->|"CRUD Metadata"| PG

    CHAT_API -->|"Generate Question Embedding"| HF
    CHAT_API -->|"Vector Search Query"| RPC
    CHAT_API -->|"Grounded Prompt + Context"| GROQ
    CHAT_API -->|"Response + Sources"| UI

    SESS_API -->|"Manage Structured Sessions"| PG
```

---

## 2. Document → RAG Pipeline

Below is the end-to-end data transformation pipeline when a user uploads an insurance policy or claim document.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Documents View
    participant API as /api/documents/upload
    participant Storage as Supabase Storage
    participant DB as Supabase Postgres
    participant Extract as unpdf / Tesseract.js
    participant HF as Hugging Face API
    participant RAG as /api/chat
    participant Groq as Groq API

    User->>UI: Select PDF / PNG / JPEG file & Upload
    UI->>API: POST multipart/form-data (File, document_type)
    API->>API: Validate user auth & file size (≤10MB)
    API->>Storage: Upload to user-isolated path (`{user_id}/{uuid}-{filename}`)
    API->>DB: Insert row into `documents` table (status: 'processing')
    
    alt File type == PDF
        API->>Extract: Parse text using unpdf
    else File type == PNG / JPEG
        API->>Extract: Perform OCR using Tesseract.js
    end
    Extract-->>API: Extracted text content

    API->>API: Split text into chunks (~2000 chars, 200 overlap)

    loop For each text chunk
        API->>HF: POST text to BAAI/bge-small-en-v1.5
        HF-->>API: 384-dimensional vector embedding
    end

    API->>DB: Batch insert rows into `document_chunks` (content + vector)
    API->>DB: Update `documents` status to 'complete'
    API-->>UI: { documentId, chunksCreated, ocrStatus: 'complete' }

    note over User, Groq: Retrieval & Response Phase
    User->>UI: Ask question in AI Copilot
    UI->>RAG: POST /api/chat { messages, activeClaimId, activePolicyId }
    RAG->>HF: Generate vector embedding for question
    HF-->>RAG: Question vector (384-dim)
    RAG->>DB: Execute RPC `match_document_chunks` (vector similarity + RLS check)
    DB-->>RAG: Top matching chunks with similarity scores
    RAG->>Groq: Generate text with grounded context & system prompt
    Groq-->>RAG: Grounded 1-3 sentence response
    RAG-->>UI: Return answer, confidence level, and cited sources
```

---

## 3. User Navigation & Flow

The user interface follows a streamlined navigation structure focused on document analysis, grounded chat, and claim timeline management.

```mermaid
flowchart LR
    A["🔐 Sign In / Sign Up"] --> B["◈ Dashboard"]
    
    B --> C["▧ Documents"]
    B --> D["◆ AI Copilot"]
    B --> E["⊞ Analysis"]
    B --> F["◎ Claim Timeline"]
    B --> G["◧ Settings"]

    C -->|"Upload PDF/Image"| C1["Document Ingestion & Indexing"]
    C1 -->|"Processed"| D
    C1 -->|"Processed"| E

    D -->|"Ask Question"| D1["Vector Retrieval & Citations"]
    D1 -->|"View Source"| D2["Grounded Document Snippet"]

    E -->|"Run Task"| E1["Coverage, Exclusions, Missing Docs, Discrepancies"]
    E1 -->|"Save Result"| E2["Analysis History & Export TXT"]

    F -->|"Record Event"| F1["Claim Milestones & Timeline Progression"]
```

---

## 4. Database ER Diagram

The database schema enforced via Supabase migrations uses PostgreSQL with the `pgvector` extension.

```mermaid
erDiagram
    auth_users ||--o{ documents : "owns (1:N)"
    auth_users ||--o{ analysis_sessions : "creates (1:N)"
    documents ||--o{ document_chunks : "contains (1:N)"
    documents ||--o| analysis_sessions : "referenced as policy_doc (0:1)"
    documents ||--o| analysis_sessions : "referenced as claim_doc (0:1)"

    auth_users {
        uuid id PK
        string email
        timestamp created_at
    }

    documents {
        uuid id PK
        string storage_path
        string original_filename
        bigint file_size
        string file_type
        uuid user_id FK
        uuid claim_id
        uuid policy_id
        string document_type
        string ocr_status
        timestamp created_at
        timestamp updated_at
    }

    document_chunks {
        uuid id PK
        uuid document_id FK
        integer chunk_index
        text content
        vector_384 embedding
    }

    analysis_sessions {
        uuid id PK
        uuid user_id FK
        string title
        string status
        uuid policy_document_id FK
        uuid claim_document_id FK
        jsonb policy_extracted_data
        jsonb claim_extracted_data
        jsonb comparison_data
        jsonb discrepancy_data
        jsonb assessment_data
        jsonb timeline_data
        timestamp created_at
        timestamp updated_at
    }
```

---

## 5. Structured Analysis Flow

For multi-step document verification (comparing policy rules against submitted claim details), the application uses Zod schemas to guarantee structured JSON output.

```mermaid
flowchart TD
    A["Select Policy & Claim Documents"] --> B["POST /api/analysis-sessions/[id]/extract"]
    B -->|"Policy Schema"| C["Extract Policy Terms, Coverages, Limits, Exclusions"]
    B -->|"Claim Schema"| D["Extract Claim Amounts, Incident Dates, Damages"]
    
    C & D --> E["POST /api/analysis-sessions/[id]/compare"]
    E -->|"Comparison Schema"| F["Evaluate Coverage Match & Limit Sufficiency"]
    
    F --> G["POST /api/analysis-sessions/[id]/discrepancies"]
    G -->|"Discrepancy Schema"| H["Identify Date, Amount, or Evidence Conflicts"]
    
    H --> I["POST /api/analysis-sessions/[id]/assessment"]
    I -->|"Assessment Schema"| J["Final Coverage Status & Recommendations"]
```
