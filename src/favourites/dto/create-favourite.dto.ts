import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFavouriteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  apartmentId: number;
}
