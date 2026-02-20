import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationCodeDto {
  @ApiProperty({
    example: 'ivan.petrov@example.com',
    description: 'Адрес электронной почты для отправки кода подтверждения',
    format: 'email',
  })
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}
