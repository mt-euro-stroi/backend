import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { UsersService } from '../users.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Профиль обновлён' })
  async updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.updateMe(dto, user);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Удалить свой аккаунт' })
  @ApiResponse({ status: 200, description: 'Аккаунт удалён' })
  async deleteMe(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteMe(user);
  }
}
