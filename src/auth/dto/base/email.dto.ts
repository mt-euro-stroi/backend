import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class EmailDto {
  @ApiProperty({
    example: 'ivan.petrov@example.com',
    description: 'Адрес электронной почты',
    format: 'email',
  })
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  @MaxLength(255)
  email: string;
}
