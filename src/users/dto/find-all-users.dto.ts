import {
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationWithSearchDto } from 'src/common/dto/pagination-with-search.dto';

export class FindAllUsersDto extends PaginationWithSearchDto {
  @ApiProperty({
    example: true,
    description: 'Фильтр по активности',
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
