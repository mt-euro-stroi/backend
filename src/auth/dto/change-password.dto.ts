import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'Current password must not contain spaces' })
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'New password must not contain spaces' })
  newPassword: string;
}
