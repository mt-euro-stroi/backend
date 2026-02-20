import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { AdminUsersService } from './admin.users.service';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import type { AuthUser } from 'src/common/types/auth-user.type';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Админ: получить список пользователей' })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  async findAll(@Query() query: FindAllUsersDto) {
    return await this.adminUsersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Админ: получить пользователя по ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь' })
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return await this.adminUsersService.findOneById(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Админ: изменить роль пользователя' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.updateRole(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Админ: изменить статус пользователя' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({ status: 200, description: 'Статус обновлён' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Админ: удалить пользователя' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь удалён' })
  async removeUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.removeUserByAdmin(id, user);
  }
}
