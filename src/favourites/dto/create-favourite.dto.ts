import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavouriteDto {
  @ApiProperty({
    example: 123,
    description: 'ID квартиры для добавления в избранное',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  apartmentId: number;
}
