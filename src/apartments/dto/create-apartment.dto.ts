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

export class CreateApartmentDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  @MaxLength(255)
  complexSlug: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  entrance: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  number: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  rooms: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(1000)
  area: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  floor: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  price: number;

  @IsOptional()
  @IsEnum(ApartmentStatus)
  status?: ApartmentStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
