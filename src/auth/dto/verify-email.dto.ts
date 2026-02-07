import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @Matches(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' })
  verificationCode: string;
}
