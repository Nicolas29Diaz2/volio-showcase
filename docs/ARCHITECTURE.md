# Volio Architecture Deep Dive

## Hexagonal Architecture Pattern (Ports & Adapters)

Volio's backend services strictly decouple business logic from external frameworks, databases, and third-party AI APIs.

### 1. Domain Layer (`src/backend/modules/ai-gen/domain/`)
- Contains enterprise business rules, entities, and port definitions (`IAIProvider`, `IProjectRepository`).
- Zero external dependencies: does not import NestJS, Prisma, AWS SDK, or Axios.
- Guarantees complete testability using standard unit tests and mock implementations.

### 2. Application Layer (`src/backend/modules/ai-gen/application/`)
- Contains orchestrating Use Cases (`GenerateAlbumUseCase`), Data Transfer Objects (DTOs), and mapping logic.
- Depends only on Domain Ports and abstractions.
- Emits atomic progress callbacks (`onProgress(pct, step)`) that decouple business execution from notification transports (BullMQ, WebSockets, or HTTP polling).

### 3. Infrastructure Layer (`src/backend/modules/ai-gen/infrastructure/`)
- Implements the Domain Ports via concrete adapters:
  - `GoogleGeminiProvider` implements `IAIProvider`.
  - `AlbumGenerationProcessor` consumes BullMQ jobs and invokes application use cases.
  - `R2StorageService` wraps AWS S3 client SDK to interface with Cloudflare R2.
  - Prisma repositories implement domain persistence interfaces.
