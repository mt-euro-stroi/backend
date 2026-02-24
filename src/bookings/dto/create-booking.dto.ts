import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: 123,
    description: 'ID квартиры для бронирования',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  apartmentId: number;
}
