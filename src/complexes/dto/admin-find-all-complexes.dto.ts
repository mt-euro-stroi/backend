import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PublicFindAllComplexesDto } from './public-find-all-complexes.dto';

export class AdminFindAllComplexesDto extends PublicFindAllComplexesDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
