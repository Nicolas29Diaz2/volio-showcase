import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  GenerateAlbumUseCase,
  PROJECT_REPOSITORY_TOKEN,
} from '../../application/use-cases/generate-album.use-case';
import type { IProjectRepository } from '../../domain/ports/project.repository.port';
import type { GenerateAlbumDto } from '../../application/dto/generate-album.dto';

export interface AlbumGenerationJobData {
  userId: string;
  albumId: string;
  input: GenerateAlbumDto;
}

/**
 * BullMQ Worker: Processes async AI album generation with bounded concurrency (3).
 * Decouples prolonged LLM inference & asset synthesis from the Node.js HTTP event loop.
 */
@Processor('album-generation', { concurrency: 3 })
@Injectable()
export class AlbumGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AlbumGenerationProcessor.name);

  constructor(
    private readonly generateAlbumUseCase: GenerateAlbumUseCase,
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
  ) {
    super();
  }

  async process(job: Job<AlbumGenerationJobData>): Promise<unknown> {
    const { userId, albumId, input } = job.data;
    this.logger.log(`[BullMQ Worker] Executing generation job ${job.id} for album ${albumId}`);

    try {
      // 1. Mark status as PROCESSING in persistence layer & job progress
      await this.projectRepository.updateForOwner(albumId, userId, {
        generationStatus: 'PROCESSING',
        generationProgress: 10,
        generationStep: 'INITIALIZING',
      });
      await job.updateProgress(10);

      // 2. Execute pipeline with real-time progress callbacks
      const onProgress = async (progressPct: number, stepName: string) => {
        await job.updateProgress(progressPct);
        await this.projectRepository.updateForOwner(albumId, userId, {
          generationProgress: progressPct,
          generationStep: stepName,
        });
      };

      await this.generateAlbumUseCase.processAsyncGeneration(
        userId,
        albumId,
        input,
        onProgress,
      );

      // 3. Mark COMPLETED
      await this.projectRepository.updateForOwner(albumId, userId, {
        generationStatus: 'COMPLETED',
        generationProgress: 100,
        generationStep: 'FINISHING',
        generationError: null,
      });
      await job.updateProgress(100);

      this.logger.log(`[BullMQ Worker] Job ${job.id} successfully finished.`);
      return { success: true, albumId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[BullMQ Worker] Job ${job.id} failed: ${errorMsg}`);

      // Update entity state with failure details
      await this.projectRepository.updateForOwner(albumId, userId, {
        generationStatus: 'FAILED',
        generationError: errorMsg,
      });

      throw error; // Re-throw to trigger BullMQ retry/exponential backoff
    }
  }
}
