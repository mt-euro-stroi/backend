import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApartmentStatusDto {
  @ApiProperty({
    example: true,
    description: 'Опубликована ли квартира',
    type: 'boolean',
  })
  @IsBoolean()
  isPublished: boolean;
}
