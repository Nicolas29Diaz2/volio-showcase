/**
 * Hexagonal Port: Cloud Storage Service Interface
 *
 * Exposes storage operations decoupled from specific cloud vendors (Cloudflare R2, AWS S3, GCP).
 */
export interface IStorageService {
  /**
   * Generates a signed PUT URL allowing the client to upload binary media directly
   * to Cloudflare R2 without passing heavy streams through the Node.js API server.
   */
  generatePresignedUploadUrl(
    key: string,
    mimeType: string,
    size: number,
    expiresInSeconds?: number,
  ): Promise<string>;

  /**
   * Deletes an object from the bucket.
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Deletes multiple objects in a single batch operation.
   */
  deleteObjects(keys: string[]): Promise<void>;

  /**
   * Copies an object within the storage bucket server-side.
   */
  copyObject(sourceKey: string, destinationKey: string): Promise<void>;
}
