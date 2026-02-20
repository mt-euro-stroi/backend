import { PartialType } from '@nestjs/mapped-types';
import { CreateComplexDto } from './create-complex.dto';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateComplexDto extends PartialType(CreateComplexDto) {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  deletedFileIds?: number[];
}
