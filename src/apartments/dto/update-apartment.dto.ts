import { PartialType } from '@nestjs/mapped-types';
import { CreateApartmentDto } from './create-apartment.dto';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateApartmentDto extends PartialType(CreateApartmentDto) {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  deletedFileIds?: number[];
}