import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationCodeDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  email: string;
}
