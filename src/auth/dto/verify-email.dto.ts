import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
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
    example: '123456',
    description: 'Код подтверждения из email (6 цифр)',
    pattern: '^\\d{6}$',
    minLength: 6,
    maxLength: 6,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' })
  verificationCode: string;
}
