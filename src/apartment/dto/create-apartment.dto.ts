import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApartmentStatus } from 'src/generated/prisma/enums';

export class CreateApartmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  complexId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  entrance: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  number: number;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  title: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  rooms: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  area: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(ApartmentStatus)
  status?: ApartmentStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}