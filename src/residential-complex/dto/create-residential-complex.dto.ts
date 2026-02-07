import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateResidentialComplexDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @MaxLength(255)
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @MaxLength(100)
  city: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @MaxLength(255)
  address: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MaxLength(255)
  developerName?: string;

  @IsOptional()
  @IsISO8601()
  completionDate?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
