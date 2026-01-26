import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignInDto {
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
