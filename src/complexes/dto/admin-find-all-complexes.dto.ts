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
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'Фильтр по публикации (админ)',
    required: false,
    type: 'boolean',
  })
  isPublished?: boolean;
}
