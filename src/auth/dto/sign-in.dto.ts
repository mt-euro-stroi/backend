import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    example: 'ivan.petrov@example.com',
    description: 'Адрес электронной почты',
    format: 'email',
  })
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Пароль',
    minLength: 6,
    maxLength: 255,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'Password must not contain spaces' })
  password: string;
}
