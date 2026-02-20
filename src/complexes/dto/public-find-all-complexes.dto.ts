import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PublicFindAllComplexesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(100)
  search?: string;
}
