import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GenerateAlbumDto } from '../../application/dto/generate-album.dto';
import type { IProjectRepository } from '../../domain/ports/project.repository.port';
import { PROJECT_REPOSITORY_TOKEN } from '../../application/use-cases/generate-album.use-case';

export interface EnqueueJobResponse {
  albumId: string;
  jobId: string;
  status: 'PENDING';
  message: string;
}

@Controller('ai-gen')
export class AiGenController {
  constructor(
    @InjectQueue('album-generation')
    private readonly albumQueue: Queue,
    @Inject(PROJECT_REPOSITORY_TOKEN)
    private readonly projectRepository: IProjectRepository,
  ) {}

  /**
   * Enqueues an AI album generation job into Redis via BullMQ.
   * Immediately returns HTTP 202 Accepted to prevent client gateway timeouts.
   */
  @Post('album')
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueueAlbumGeneration(
    @Body() dto: GenerateAlbumDto,
    // Note: User ID extracted via JWT Auth Guard in production
    userId = 'usr_demo_7721',
  ): Promise<EnqueueJobResponse> {
    // 1. Create album draft entity in persistence layer
    const draft = await this.projectRepository.createDraftForOwner(userId, {
      title: dto.title,
      format: dto.format,
      generationStatus: 'PENDING',
      generationProgress: 0,
      generationStep: 'ENQUEUED',
    });

    // 2. Dispatch background job to Redis
    const job = await this.albumQueue.add(
      'process-album',
      {
        userId,
        albumId: draft.id,
        input: dto,
      },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: { age: 3600 }, // Auto-clean completed jobs after 1 hour
        removeOnFail: { age: 86400 },    // Preserve failed jobs for 24h triage
      },
    );

    return {
      albumId: draft.id,
      jobId: job.id as string,
      status: 'PENDING',
      message: 'Album generation job accepted and dispatched to queue.',
    };
  }
}
