import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class PaginationWithSearchDto extends PaginationDto {
  @ApiProperty({
    example: 'комната с балконом',
    description: 'Строка поиска',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const trimmed = value?.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @MaxLength(100)
  search?: string;
}
