import { Transform } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123',
    description: 'Текущий пароль',
    minLength: 6,
    maxLength: 255,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'New password must not contain spaces' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword123',
    description: 'Новый пароль',
    minLength: 6,
    maxLength: 255,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'New password must not contain spaces' })
  newPassword: string;
}
