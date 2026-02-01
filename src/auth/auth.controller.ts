import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';


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
    @Req() req: Request & { user?: any },
    @Body() verifyEmailDto: VerifyEmailDto
  ) {
    return await this.authService.verifyEmail(verifyEmailDto, req.user);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  async changePassword(
    @Req() req: Request & { user?: any },
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return await this.authService.changePassword(changePasswordDto, req.user);
  }
}
