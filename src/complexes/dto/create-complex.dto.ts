import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateComplexDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @MinLength(3)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(2000)
  description?: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(5)
  @MaxLength(255)
  address: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completionDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  priceFrom?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
