import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApartmentStatus } from 'src/generated/prisma/enums';

export class CreateApartmentDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(1)
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
  @Min(0)
  rooms: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  area: number;

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
