import { PartialType } from '@nestjs/mapped-types';
import { CreateComplexDto } from './create-complex.dto';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateComplexDto extends PartialType(CreateComplexDto) {
  @ApiProperty({
    example: [1, 2],
    description: 'ID файлов для удаления',
    required: false,
    type: [Number],
    maxItems: 100,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  deletedFileIds?: number[];
}
