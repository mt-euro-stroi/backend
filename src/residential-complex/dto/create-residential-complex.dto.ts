import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateResidentialComplexDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  title: string;

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
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  developerName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completionDate?: Date;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
