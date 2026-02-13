import { PartialType } from '@nestjs/mapped-types';
import { CreateResidentialComplexDto } from './create-residential-complex.dto';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateResidentialComplexDto extends PartialType(
  CreateResidentialComplexDto,
) {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  deletedFileIds?: number[];
}
