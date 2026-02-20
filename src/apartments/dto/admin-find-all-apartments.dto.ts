import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PublicFindAllApartmentsDto } from './public-find-all-apartments.dto';

export class AdminFindAllApartmentsDto extends PublicFindAllApartmentsDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;
}
