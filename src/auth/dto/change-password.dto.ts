import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'Current password must not contain spaces' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'New password must not contain spaces' })
  newPassword: string;
}
