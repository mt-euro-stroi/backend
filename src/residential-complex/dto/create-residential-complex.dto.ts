import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateResidentialComplexDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  name: string;

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(100)
  city: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  developerName?: string;

  @IsOptional()
  @IsISO8601()
  completionDate?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
