/**
 * Hexagonal Port: Project & Album Repository Interface
 *
 * Defines persistence operations required by the album generation domain
 * while insulating domain services from Prisma, SQL, or specific databases.
 */
export interface AlbumEntity {
  id: string;
  userId: string;
  title: string;
  format: 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE' | 'WIDE';
  generationStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  generationProgress: number;
  generationStep?: string | null;
  generationError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectRepository {
  createDraftForOwner(
    userId: string,
    initialData: Partial<AlbumEntity>,
  ): Promise<AlbumEntity>;

  findByIdAndOwner(
    id: string,
    userId: string,
  ): Promise<AlbumEntity | null>;

  updateForOwner(
    id: string,
    userId: string,
    patch: Partial<AlbumEntity>,
  ): Promise<AlbumEntity>;

  deleteForOwner(
    id: string,
    userId: string,
  ): Promise<void>;
}
