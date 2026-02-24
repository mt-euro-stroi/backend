import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PublicFindAllApartmentsDto } from './public-find-all-apartments.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AdminFindAllApartmentsDto extends PublicFindAllApartmentsDto {
  @ApiProperty({
    example: true,
    description: 'Фильтр по статусу публикации (только для админов)',
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
