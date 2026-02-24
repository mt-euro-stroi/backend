import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminFindAllBookingsDto extends PaginationDto {
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
