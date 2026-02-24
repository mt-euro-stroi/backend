import { IntersectionType } from '@nestjs/swagger';
import { EmailDto } from './base/email.dto';
import { PasswordDto } from './base/password.dto';

export class SignInDto extends IntersectionType(EmailDto, PasswordDto) {}
