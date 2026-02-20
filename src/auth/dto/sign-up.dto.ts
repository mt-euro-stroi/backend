import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @Matches(/^\+7\d{10}$/, {
    message: 'Phone must be in format +7XXXXXXXXXX',
  })
  phone: string;

  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @Matches(/^\S+$/, {
    message: 'Password must not contain spaces',
  })
  password: string;
}
