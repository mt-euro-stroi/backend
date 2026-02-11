import { PartialType } from '@nestjs/mapped-types';
import { CreateResidentialComplexDto } from './create-residential-complex.dto';
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class UpdateResidentialComplexDto extends PartialType(
  CreateResidentialComplexDto,
) {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  deletedFileIds?: number[];
}