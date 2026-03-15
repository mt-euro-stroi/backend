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
import { User } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
  private readonly RESEND_COOLDOWN_MS = 60_000;

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

  private async generateAccessToken(user: User) {
    return this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });
  }

  async signUp(dto: SignUpDto): Promise<ServiceMessageResponse> {
    this.logger.log('Sign up attempt started');

    const { phone, email, password } = dto;

    const byPhone = await this.prismaService.user.findUnique({
      where: { phone },
    });

    if (byPhone) {
      this.logger.warn('Sign up conflict: phone already exists');
      throw new ConflictException(
        'Пользователь с таким email или номером телефона уже существует',
      );
    }

    const byEmail = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (byEmail) {
      this.logger.warn('Sign up conflict: email already exists');
      throw new ConflictException(
        'Пользователь с таким email или номером телефона уже существует',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.VERIFICATION_CODE_TTL_MS);

    const user = await this.prismaService.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        verificationCode,
        verificationCodeSentAt: now,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    this.sendVerificationCode(email, verificationCode);

    this.logger.log(`User created successfully (userId=${user.id})`);

    return {
      message:
        'Регистрация прошла успешно. На ваш адрес электронной почты отправлен код подтверждения',
    };
  }

  async signIn(
    dto: SignInDto,
  ): Promise<ServiceMessageResponse | AuthWithTokenResponse> {
    this.logger.log('Sign in attempt for email');

    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Sign in failed: email not found');
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isActive) {
      this.logger.warn(`Sign in blocked: inactive account (userId=${user.id})`);
      throw new UnauthorizedException(
        'Ваша учетная запись деактивирована. Пожалуйста, обратитесь в службу поддержки',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Sign in failed: invalid password (userId=${user.id})`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (!user.isEmailVerified) {
      const now = new Date();

      if (
        user.verificationCodeSentAt &&
        now.getTime() - user.verificationCodeSentAt.getTime() <
          this.RESEND_COOLDOWN_MS
      ) {
        throw new ConflictException(
          'Email не подтвержден. Пожалуйста, проверьте свой email',
        );
      }

      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(now.getTime() + this.VERIFICATION_CODE_TTL_MS);

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeSentAt: now,
          verificationCodeExpiresAt: expiresAt,
        },
      });

      this.sendVerificationCode(user.email, verificationCode);

      throw new ConflictException(
        'Email не подтверждена. Вам отправлен новый код подтверждения',
      );
    }

    const accessToken = await this.generateAccessToken(user);

    this.logger.log(`Sign in successful (userId=${user.id})`);

    return {
      message: 'Вход в систему выполнен успешно',
      data: { accessToken },
    };
  }

  async verifyEmail(
    dto: VerifyEmailDto,
  ): Promise<ServiceMessageResponse | AuthWithTokenResponse> {
    this.logger.log('Email verification attempt started');

    const { email, verificationCode } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Verification failed: email not found');
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (user.isEmailVerified) {
      this.logger.log(`Email already verified (userId=${user.id})`);
      return { message: 'Email уже подтвержден' };
    }

    if (!user.verificationCode) {
      this.logger.warn(`Verification failed: code expired (userId=${user.id})`);
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (user.verificationCode !== verificationCode) {
      this.logger.warn(
        `Verification failed: code mismatch (userId=${user.id})`,
      );
      throw new BadRequestException('Неверный код подтверждения');
    }

    if (
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      this.logger.warn(
        `Verification failed: code expired by TTL (userId=${user.id})`,
      );
      throw new BadRequestException('Неверный код подтверждения');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeSentAt: null,
        verificationCodeExpiresAt: null,
      },
    });

    const accessToken = await this.generateAccessToken(updatedUser);

    this.logger.log(`Email verified successfully (userId=${updatedUser.id})`);

    return {
      message: 'Email успешно подтвержден',
      data: { accessToken },
    };
  }

  async resendVerificationCode(
    dto: ResendVerificationCodeDto,
  ): Promise<ServiceMessageResponse> {
    this.logger.log('Resend verification code attempt started');

    const { email } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Resend failed: email not found');
      return {
        message:
          'Если email существует и требует подтверждения, новый код был отправлен',
      };
    }

    if (user.isEmailVerified) {
      this.logger.warn(`Resend skipped: already verified (userId=${user.id})`);
      return {
        message:
          'Если email существует и требует подтверждения, новый код был отправлен',
      };
    }

    const now = new Date();

    if (
      user.verificationCodeSentAt &&
      now.getTime() - user.verificationCodeSentAt.getTime() <
        this.RESEND_COOLDOWN_MS
    ) {
      throw new ConflictException(
        'Код подтверждения был отправлен недавно. Пожалуйста, подождите, прежде чем запрашивать новый',
      );
    }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + this.VERIFICATION_CODE_TTL_MS);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeSentAt: now,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    this.sendVerificationCode(user.email, verificationCode);

    this.logger.log(`Verification code resent (userId=${user.id})`);

    return {
      message:
        'Если email существует и требует подтверждения, новый код был отправлен',
    };
  }

  async changePassword(
    dto: ChangePasswordDto,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`Password change attempt started (userId=${userId})`);

    const { currentPassword, newPassword } = dto;

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      this.logger.warn(
        `Password change failed: current password incorrect (userId=${userId})`,
      );
      throw new BadRequestException('Текущий пароль неверен');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: newHash },
    });

    this.logger.log(`Password changed successfully (userId=${userId})`);

    return { message: 'Пароль успешно изменен' };
  }
}
