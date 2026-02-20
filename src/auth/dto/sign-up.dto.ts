import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'Иван',
    description: 'Имя пользователя',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Петров',
    description: 'Фамилия пользователя',
    minLength: 2,
    maxLength: 50,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: '+79991234567',
    description: 'Номер телефона в формате +7XXXXXXXXXX',
    pattern: '^\\+7\\d{10}$',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Phone must be in format +7XXXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    example: 'ivan.petrov@example.com',
    description: 'Адрес электронной почты',
    format: 'email',
  })
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Пароль (минимум 8 символов, без пробелов)',
    minLength: 8,
    maxLength: 255,
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^\S+$/, {
    message: 'Password must not contain spaces',
  })
  password: string;
}
