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
import { ApiProperty } from '@nestjs/swagger';

export class AdminFindAllComplexesDto extends PublicFindAllComplexesDto {
  @ApiProperty({
    example: true,
    description: 'Фильтр по публикации (админ)',
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;
}
