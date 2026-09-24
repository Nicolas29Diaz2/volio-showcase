import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IAIProvider } from '../../domain/ports/ai-provider.port';
import type { IProjectRepository } from '../../domain/ports/project.repository.port';
import type { GenerateAlbumDto } from '../dto/generate-album.dto';

export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');
export const PROJECT_REPOSITORY_TOKEN = Symbol('PROJECT_REPOSITORY_TOKEN');

export type ProgressCallback = (percent: number, step: string) => Promise<void>;

/**
 * Use Case: Multimodal AI Album Generation Pipeline
 *
 * Orchestrates the end-to-end multi-stage pipeline:
 * 1. Narrative & Creative Briefing
 * 2. Secondary Asset Aggregation
 * 3. Spatial Layout & Canvas Translation
 */
@Injectable()
export class GenerateAlbumUseCase {
  private readonly logger = new Logger(GenerateAlbumUseCase.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAIProvider,
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async processAsyncGeneration(
    userId: string,
    albumId: string,
    dto: GenerateAlbumDto,
    onProgress: ProgressCallback,
  ): Promise<void> {
    this.logger.log(`Starting generation pipeline for album ${albumId} (user: ${userId})`);

    // Stage 1: Creative Director (Narrative Briefing)
    await onProgress(25, 'CREATIVE_BRIEF');
    const brief = await this.aiProvider.generateNarrativeBrief(dto.prompt, dto.photoUrls);
    this.logger.debug(`Narrative brief generated: "${brief.title}" with ${brief.pages.length} pages`);

    // Stage 2: Layout & Visual Design
    await onProgress(60, 'LAYOUT_DESIGN');
    const layouts = await this.aiProvider.generateStructuredLayouts(brief, dto.photoUrls);

    // Stage 3: Deterministic Canvas Engine Translation & Persistence
    await onProgress(85, 'CANVAS_COMPOSITION');
    await this.projectRepository.updateForOwner(albumId, userId, {
      title: brief.title || dto.title,
      generationProgress: 90,
      generationStep: 'FINALIZING',
    });

    // Stage 4: Mark Complete
    await onProgress(100, 'COMPLETED');
    this.logger.log(`Pipeline finished successfully for album ${albumId}`);
  }
}
