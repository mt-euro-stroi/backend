import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Иван',
    description: 'Имя пользователя',
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    example: 'Петров',
    description: 'Фамилия пользователя',
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    example: '+79991234567',
    description: 'Номер телефона в формате +7XXXXXXXXXX',
    required: false,
    pattern: '^\\+7\\d{10}$',
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Phone must be in format +7XXXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    example: 'ivan.petrov@example.com',
    description: 'Email пользователя',
    required: false,
    format: 'email',
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Пароль (минимум 6 символов)',
    required: false,
    minLength: 6,
    maxLength: 255,
  })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, {
    message: 'Password must not contain spaces',
  })
  password?: string;
}
