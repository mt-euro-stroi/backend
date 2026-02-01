import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from 'src/common/types/auth-user.type';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthWithTokenResponse,
  BaseAuthResponse,
} from './types/auth-response.types';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';


@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prismaService: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  sendVerificationCode(email: string, verificationCode: string): void {
    this.mailService.sendVerificationCode(email, verificationCode)
      .catch(error => this.logger.error('Failed to send verification email', error.stack));
  }

  async signUp(signUpDto: SignUpDto): Promise<BaseAuthResponse> {
    this.logger.log('Sign up attempt');
  
    const byPhone = await this.prismaService.user.findUnique({
      where: {
        phone: signUpDto.phone,
      },
    });

    if (byPhone) {
      this.logger.warn('Sign up conflict: phone already exists');
      throw new ConflictException('User with this phone already exists');
    }

    const byEmail = await this.prismaService.user.findUnique({
      where: {
        email: signUpDto.email,
      },
    });

    if (byEmail) {
      this.logger.warn('Sign up conflict: email already exists');
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const verificationCode = this.generateVerificationCode();

    const user = await this.prismaService.user.create({
      data: {
        ...signUpDto,
        verificationCode,
        password: hashedPassword,
      },
    });

    this.sendVerificationCode(signUpDto.email, verificationCode);

    this.logger.log(`User created: id=${ user.id }`);

    return{ message: 'Registration successful. A verification code has been sent to your email.' };
  }

  async signIn(signInDto: SignInDto): Promise<AuthWithTokenResponse> {
    this.logger.log('Sign in attempt');

    const user = await this.prismaService.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) {
      this.logger.warn('Sign in failed: user not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn('Sign in failed: invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    });

    if (!user.isEmailVerified) {
      this.logger.warn(`Sign in completed with unverified email (userId=${ user.id })`);

      const verificationCode = this.generateVerificationCode();

      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
        },
      });

      this.sendVerificationCode(user.email, verificationCode);
      
      return { message: 'Email is not verified. A new verification code has been sent to your email.', data: { accessToken } };
    }

    this.logger.log(`Sign in success: userId=${ user.id }`);

    return { message: 'User signed in successfully', data: { accessToken } };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto, authUser: AuthUser): Promise<AuthWithTokenResponse> {
    const userId = authUser.sub;

    this.logger.log(`Email verification attempt started: userId=${ userId }`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Email verification failed: user not found (userId=${ userId })`);
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      this.logger.warn(`Email already verified (userId=${ userId })`);

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      });

      return {
        message: 'Email is already verified',
        data: { accessToken }
      };
    }

    if (!user.verificationCode) {
      this.logger.warn(`Email verification failed: no verification code (userId=${ userId })`);
      throw new BadRequestException('Verification code is missing');
    }

    if (user.verificationCode !== verifyEmailDto.verificationCode) {
      this.logger.warn(`Email verification failed: invalid code (userId=${ userId })`);
      throw new BadRequestException('Invalid verification code');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        verificationCode: null,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      isEmailVerified: true,
    });

    this.logger.log(`Email verified successfully (userId=${ userId })`);

    return {
      message: 'Email verified successfully',
      data: { accessToken }
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto, authUser: AuthUser): Promise<BaseAuthResponse> {
    const userId = authUser.sub;

    this.logger.log(`Password change attempt started (userId=${ userId })`);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Password change failed: user not found (userId=${ userId })`);
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isValid) {
      this.logger.warn(`Password change failed: invalid current password (userId=${ userId })`);
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: newHash,
      },
    });

    this.logger.log(`Password changed successfully (userId=${ userId })`);

    return { message: 'Password changed successfully' };
  }
}
