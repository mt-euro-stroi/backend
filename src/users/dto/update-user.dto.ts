import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber('RU')
  @Transform(({ value }) => value?.trim())
  @Matches(/^\+\d{11}$/, { message: 'Phone must be in format +7**********' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255)
  email?: string;
}
