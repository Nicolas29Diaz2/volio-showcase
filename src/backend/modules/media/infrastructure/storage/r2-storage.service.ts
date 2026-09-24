import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageService } from '../../domain/ports/storage.service.port';

/**
 * Concrete Adapter: Cloudflare R2 Object Storage
 *
 * Implements S3-compatible protocol using @aws-sdk/client-s3 against Cloudflare R2.
 * Benefits: Zero data egress fees, global edge performance, and presigned direct uploads.
 */
@Injectable()
export class R2StorageService implements IStorageService {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID') || 'demo_account';
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || 'demo_key';
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || 'demo_secret';

    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'volio-media';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async generatePresignedUploadUrl(
    key: string,
    mimeType: string,
    size: number,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3.send(command);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    });
    await this.s3.send(command);
  }

  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `${this.bucketName}/${encodeURIComponent(sourceKey)}`,
      Key: destinationKey,
    });
    await this.s3.send(command);
  }
}
