import { PartialType } from '@nestjs/mapped-types';
import { CreateApartmentDto } from './create-apartment.dto';
import { ArrayMaxSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApartmentDto extends PartialType(CreateApartmentDto) {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'ID файлов для удаления (опционально)',
    type: [Number],
    required: false,
    maxItems: 100,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  deletedFileIds?: number[];
}
