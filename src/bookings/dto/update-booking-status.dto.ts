import { IsEnum } from 'class-validator';
import { BookingStatus } from 'src/generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({
    example: 'CONFIRMED',
    description: 'Новый статус бронирования',
    enum: BookingStatus,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
