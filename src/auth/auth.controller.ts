import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  @Post('verify-email')
  @UseGuards(AuthGuard)
  async verifyEmail(
    @CurrentUser() user: AuthUser,
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    return await this.authService.verifyEmail(verifyEmailDto, user);
  }

  @Post('resend-verification-code')
  @UseGuards(AuthGuard)
  async resendVerificationCode(@CurrentUser() user: AuthUser) {
    return await this.authService.resendVerificationCode(user);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(changePasswordDto, user);
  }
}
