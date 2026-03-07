import { Transform } from 'class-transformer';
import { Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailDto } from './base/email.dto';

export class VerifyEmailDto extends EmailDto {
  @ApiProperty({
    example: '123456',
    description: 'Код подтверждения из email (6 цифр)',
    pattern: '^\\d{6}$',
    minLength: 6,
    maxLength: 6,
  })
  @Transform(({ value }) => value?.trim())
  @Matches(/^\d+$/, { message: 'Код подтверждения должен состоять ровно из 6 цифр' })
  verificationCode: string;
}
