import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PasswordDto {
  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Пароль',
    minLength: 6,
    maxLength: 255,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, {
    message: 'Password must not contain spaces',
  })
  password: string;
}
