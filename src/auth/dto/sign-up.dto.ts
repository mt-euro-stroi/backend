import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  lastName: string;

  @IsPhoneNumber('RU')
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Matches(/^\+\d{11}$/, { message: 'Phone must be in format +7**********' })
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^\S+$/, { message: 'Password must not contain spaces' })
  password: string;
}
