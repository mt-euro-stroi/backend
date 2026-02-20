import { IsBoolean } from 'class-validator';

export class UpdateApartmentStatusDto {
  @IsBoolean()
  isPublished: boolean;
}
