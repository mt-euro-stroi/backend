import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { EmailDto } from './base/email.dto';
import { PasswordDto } from './base/password.dto';

export class SignUpDto extends IntersectionType(EmailDto, PasswordDto) {
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
}
