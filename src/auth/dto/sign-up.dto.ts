import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  firstName: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  lastName: string;

  @IsPhoneNumber('RU')
  @Transform(({ value }) => value?.trim())
  @Matches(/^\+\d{11}$/, { message: 'Phone must be in format +7**********' })
  phone: string;

  @IsEmail()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'Password must not contain spaces' })
  password: string;
}
