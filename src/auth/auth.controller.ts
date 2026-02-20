import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto) {
    return await this.authService.signUp(dto);
  }

  @Post('sign-in')
  async signIn(@Body() dto: SignInDto) {
    return await this.authService.signIn(dto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.authService.verifyEmail(dto);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(
    @Body() dto: ResendVerificationCodeDto,
  ) {
    return await this.authService.resendVerificationCode(
      dto,
    );
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.authService.changePassword(dto, user);
  }
}
