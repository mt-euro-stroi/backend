import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllUsersDto {
  @ApiProperty({
    example: 1,
    description: 'Номер страницы',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Лимит на страницу',
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    example: 'ivan',
    description: 'Поисковый запрос (имя/почта)',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(100)
  search?: string;

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
