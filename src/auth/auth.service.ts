import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { generateVerificationCode } from 'src/common/utils/verification-code.util';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { ServiceMessageResponse } from 'src/common/types/service-response.types';
import { AuthWithTokenResponse } from './types/auth-response.types';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  sendVerificationCode(email: string, verificationCode: string): void {
    this.mailService
      .sendVerificationCode(email, verificationCode)
      .catch((error) =>
        this.logger.error('Failed to send verification email', error.stack),
      );
  }

  async signUp(signUpDto: SignUpDto): Promise<ServiceMessageResponse> {
    this.logger.log('Sign up attempt started.');

    const { phone, email, password } = signUpDto;

    const byPhone = await this.prismaService.user.findUnique({
      where: { phone },
    });

    if (byPhone) {
      this.logger.warn('Sign up conflict: phone already exists.');
      throw new ConflictException('User with this phone already exists.');
    }

    const byEmail = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (byEmail) {
      this.logger.warn('Sign up conflict: email already exists.');
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await this.prismaService.user.create({
      data: {
        ...signUpDto,
        verificationCode,
        password: hashedPassword,
      },
    });

    this.sendVerificationCode(email, verificationCode);

    this.logger.log(`User created successfully (userId=${user.id}).`);

    return {
      message:
        'Registration successful. A verification code has been sent to your email.',
    };
  }

  async signIn(
    signInDto: SignInDto,
  ): Promise<ServiceMessageResponse | AuthWithTokenResponse> {
    this.logger.log('Sign in attempt for email.');

    const { email, password } = signInDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Sign in failed: email not found.');
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      this.logger.warn(
        `Sign in blocked: inactive account (userId=${user.id}).`,
      );
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Sign in failed: invalid password (userId=${user.id}).`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isEmailVerified) {
      this.logger.log(`Unverified email login (userId=${user.id}).`);

      const verificationCode = generateVerificationCode();

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { verificationCode },
      });

      this.sendVerificationCode(user.email, verificationCode);

      return {
        message:
          'Email is not verified. A new verification code has been sent to your email.',
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Sign in successful (userId=${user.id}).`);

    return { message: 'User signed in successfully.', data: { accessToken } };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<ServiceMessageResponse | AuthWithTokenResponse> {
    this.logger.log('Email verification attempt started.');

    const { email, verificationCode } = verifyEmailDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Verification failed: email not found.');
      throw new BadRequestException('Invalid verification code.');
    }

    if (user.isEmailVerified) {
      this.logger.log(`Email already verified (userId=${user.id}).`);
      return { message: 'Email is already verified.' };
    }

    if (!user.verificationCode) {
      this.logger.warn(
        `Verification failed: code expired (userId=${user.id}).`,
      );
      throw new BadRequestException('Invalid verification code.');
    }

    if (user.verificationCode !== verificationCode) {
      this.logger.warn(
        `Verification failed: code mismatch (userId=${user.id}).`,
      );
      throw new BadRequestException('Invalid verification code.');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    this.logger.log(`Email verified successfully (userId=${updatedUser.id}).`);

    return {
      message: 'Email verified successfully.',
      data: { accessToken },
    };
  }

  async resendVerificationCode(
    resendVerificationCodeDto: ResendVerificationCodeDto,
  ): Promise<ServiceMessageResponse> {
    this.logger.log('Resend verification code attempt started.');

    const { email } = resendVerificationCodeDto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Resend failed: email not found.');
      return {
        message:
          'If the email exists and requires verification, a new code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      this.logger.warn(`Resend skipped: already verified (userId=${user.id}).`);
      return {
        message:
          'If the email exists and requires verification, a new code has been sent.',
      };
    }

    const verificationCode = generateVerificationCode();

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { verificationCode },
    });

    this.sendVerificationCode(user.email, verificationCode);

    this.logger.log(`Verification code resent (userId=${user.id}).`);

    return {
      message:
        'If the email exists and requires verification, a new code has been sent.',
    };
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`Password change attempt started (userId=${userId}).`);

    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(
        `Password change failed: authenticated user missing (userId=${userId}).`,
      );
      throw new UnauthorizedException('Please sign in again to continue.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      this.logger.warn(
        `Password change failed: current password incorrect (userId=${userId}).`,
      );
      throw new BadRequestException('Current password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    this.logger.log(`Password changed successfully (userId=${userId}).`);

    return { message: 'Password changed successfully.' };
  }
}
