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
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplexDto {
  @ApiProperty({
    example: 'ЖК Евро',
    description: 'Название комплекса',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'euro-complex-1',
    description: 'Слаг (латиница, цифры, дефис)',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @MinLength(3)
  @MaxLength(255)
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiProperty({
    example: 'Современный комплекс рядом с парком',
    description: 'Описание комплекса',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: 'Москва',
    description: 'Город',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: 'ул. Ленина, д.1',
    description: 'Адрес',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(5)
  @MaxLength(255)
  address: string;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Дата завершения (ISO)',
    required: false,
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completionDate?: Date;

  @ApiProperty({
    example: 3500000,
    description: 'Цена от (в рублях)',
    required: false,
    minimum: 0,
    maximum: 1000000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  priceFrom?: number;

  @ApiProperty({
    example: true,
    description: 'Опубликован ли комплекс',
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
