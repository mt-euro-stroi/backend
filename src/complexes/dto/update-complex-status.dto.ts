import { IsBoolean } from 'class-validator';

export class UpdateComplexStatusDto {
  @IsBoolean()
  isPublished: boolean;
}
