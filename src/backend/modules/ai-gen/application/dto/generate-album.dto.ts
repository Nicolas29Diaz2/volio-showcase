import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export enum AlbumFormat {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE',
  SQUARE = 'SQUARE',
  WIDE = 'WIDE',
}

export class GenerateAlbumDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(1000)
  prompt: string;

  @IsEnum(AlbumFormat)
  format: AlbumFormat;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  photoUrls: string[];

  @IsOptional()
  @IsString()
  stylePreset?: string;
}
