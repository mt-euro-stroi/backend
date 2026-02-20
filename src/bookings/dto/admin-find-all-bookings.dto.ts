import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class AdminFindAllBookingsDto {
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
    example: 42,
    description: 'ID пользователя для фильтрации (опционально)',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiProperty({
    example: 'PENDING',
    description: 'Статус бронирования',
    required: false,
    enum: BookingStatus,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
