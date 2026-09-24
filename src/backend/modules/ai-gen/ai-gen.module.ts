import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AiGenController } from './infrastructure/controllers/ai-gen.controller';
import {
  GenerateAlbumUseCase,
  AI_PROVIDER_TOKEN,
  PROJECT_REPOSITORY_TOKEN,
} from './application/use-cases/generate-album.use-case';
import { GoogleGeminiProvider } from './infrastructure/providers/google-gemini.provider';
import { AlbumGenerationProcessor } from './infrastructure/queues/album-generation.processor';

/**
 * NestJS AiGenModule:
 * Highlights Dependency Injection, Provider Factories, and BullMQ registration.
 */
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'album-generation',
    }),
  ],
  controllers: [AiGenController],
  providers: [
    GenerateAlbumUseCase,
    AlbumGenerationProcessor,
    // Factory-based AI Provider Swapping (Strategy Pattern)
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService) => {
        // Dynamically instantiates the appropriate adapter based on runtime configuration
        return new GoogleGeminiProvider();
      },
      inject: [ConfigService],
    },
    // Mock/Adapter for Project Repository
    {
      provide: PROJECT_REPOSITORY_TOKEN,
      useValue: {
        createDraftForOwner: async (userId: string, data: any) => ({
          id: `alb_${Date.now()}`,
          userId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        updateForOwner: async (id: string, userId: string, patch: any) => ({
          id,
          userId,
          ...patch,
        }),
      },
    },
  ],
  exports: [GenerateAlbumUseCase],
})
export class AiGenModule {}
