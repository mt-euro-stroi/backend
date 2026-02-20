import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApartmentStatus } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApartmentDto {
  @ApiProperty({
    example: 'euro-complex-1',
    description: 'Слаг комплекса',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  @MaxLength(255)
  complexSlug: string;

  @ApiProperty({
    example: 1,
    description: 'Номер подъезда',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entrance: number;

  @ApiProperty({
    example: 15,
    description: 'Номер квартиры',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({
    example: 3,
    description: 'Количество комнат',
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  rooms: number;

  @ApiProperty({
    example: 85.5,
    description: 'Площадь квартиры (м²)',
    minimum: 10,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(1000)
  area: number;

  @ApiProperty({
    example: 3,
    description: 'Этаж',
    minimum: 0,
    maximum: 200,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  floor: number;

  @ApiProperty({
    example: 5500000,
    description: 'Цена квартиры (в рублях)',
    minimum: 0,
    maximum: 1000000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  price: number;

  @ApiProperty({
    example: 'AVAILABLE',
    description: 'Статус квартиры',
    enum: ApartmentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ApartmentStatus)
  status?: ApartmentStatus;

  @ApiProperty({
    example: 'Просторная квартира с видом на парк',
    description: 'Описание квартиры',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Опубликована ли квартира',
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
