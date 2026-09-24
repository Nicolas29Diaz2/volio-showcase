# Volio System Design Specification

## End-to-End Multimodal Pipeline Flow

The AI Album generation process operates across distributed system boundaries:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser (Next.js)
    participant API as NestJS API Gateway
    participant Redis as Redis Queue (BullMQ)
    participant Worker as Background Worker
    participant LLM as Multimodal AI (Gemini)
    participant DB as PostgreSQL (Neon)
    participant R2 as Cloudflare R2 Storage

    User->>API: POST /ai-gen/album (Prompt + Photo URLs)
    API->>DB: INSERT Draft Album (Status: PENDING)
    API->>Redis: Enqueue Job (albumId, userId, prompt)
    API-->>User: 202 Accepted { albumId, jobId }

    Redis->>Worker: Dispatch Job
    Worker->>DB: UPDATE Status = PROCESSING (10%)
    
    Worker->>LLM: Step 1: Creative Brief & Narrative Arc
    LLM-->>Worker: Narrative JSON (Themes, Fonts, Palettes)
    Worker->>DB: UPDATE Progress = 25% (CREATIVE_BRIEF)

    Worker->>LLM: Step 2: Structured Page Layouts & Typography
    LLM-->>Worker: Layout Schema (Tailwind Spatials)
    Worker->>DB: UPDATE Progress = 60% (LAYOUT_DESIGN)

    Worker->>Worker: Step 3: Deterministic Canvas Engine Resolution
    Worker->>DB: Save CanvasState & UPDATE Status = COMPLETED (100%)
    
    loop Polling Status
        User->>API: GET /projects/:id/status
        API->>DB: Read Status & Progress
        API-->>User: { status: "COMPLETED", progress: 100 }
    end

    User->>R2: Stream Dynamic Assets & Video Textures into 3D Viewport
```

## Failure Recovery & State Isolation
- **Automatic Retries:** Jobs that encounter temporary rate limits or network partitions retry automatically with exponential backoff (delay: 3s).
- **Graceful Failure Tracking:** Failed jobs update database state to `FAILED` with sanitized error messages.
- **Rollback Safety:** If a brand-new generation job experiences an unrecoverable failure, empty draft entities are cleaned up to prevent orphaned records.
