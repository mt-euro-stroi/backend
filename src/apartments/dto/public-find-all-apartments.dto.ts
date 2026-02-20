import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApartmentStatus } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class PublicFindAllApartmentsDto {
  @ApiProperty({
    example: 1,
    description: 'Номер страницы (по умолчанию 1)',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Количество результатов на странице (по умолчанию 10)',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    example: 'комната с балконом',
    description: 'Поиск по описанию или номеру',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    example: 'euro-complex-1',
    description: 'Слаг комплекса для фильтрации',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  complexSlug?: string;

  @ApiProperty({
    example: 4000000,
    description: 'Минимальная цена (в рублях)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    example: 8000000,
    description: 'Максимальная цена (в рублях)',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    example: 2,
    description: 'Количество комнат',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rooms?: number;

  @ApiProperty({
    example: 3,
    description: 'Этаж',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floor?: number;

  @ApiProperty({
    example: 'AVAILABLE',
    description: 'Статус квартиры',
    enum: ApartmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApartmentStatus)
  status?: ApartmentStatus;
}
