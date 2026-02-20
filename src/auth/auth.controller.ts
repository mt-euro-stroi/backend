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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({
    summary: 'Регистрация пользователя',
    description:
      'Создает новый аккаунт пользователя и отправляет код подтверждения на email',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      example: {
        message: 'User created successfully. Please verify your email',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные или структура запроса',
  })
  @ApiConflictResponse({
    description: 'Email уже зарегистрирован',
  })
  async signUp(@Body() dto: SignUpDto) {
    return await this.authService.signUp(dto);
  }

  @Post('sign-in')
  @ApiOperation({
    summary: 'Вход в систему',
    description:
      'Проверяет учетные данные и возвращает JWT токен для аутентификации',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешная аутентификация',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          email: 'user@example.com',
          firstName: 'Иван',
          lastName: 'Петров',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Некорректный email или пароль',
  })
  @ApiConflictResponse({
    description: 'Email не подтвержден',
  })
  async signIn(@Body() dto: SignInDto) {
    return await this.authService.signIn(dto);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Подтверждение email',
    description: 'Проверяет код подтверждения и активирует аккаунт',
  })
  @ApiResponse({
    status: 201,
    description: 'Email успешно подтвержден',
  })
  @ApiBadRequestResponse({
    description: 'Неверный или истекший код подтверждения',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.authService.verifyEmail(dto);
  }

  @Post('resend-verification-code')
  @ApiOperation({
    summary: 'Повторная отправка кода подтверждения',
    description: 'Отправляет новый код подтверждения на email пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Код подтверждения отправлен',
  })
  @ApiBadRequestResponse({
    description: 'Email не найден или уже подтвержден',
  })
  async resendVerificationCode(@Body() dto: ResendVerificationCodeDto) {
    return await this.authService.resendVerificationCode(dto);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Изменение пароля',
    description: 'Изменяет пароль текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно изменен',
  })
  @ApiBadRequestResponse({
    description: 'Неверный текущий пароль',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.authService.changePassword(dto, user);
  }
}
