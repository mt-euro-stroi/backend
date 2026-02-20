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
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FindAllUsersDto } from '../dto/find-all-users.dto';
import { AdminUsersService } from './admin.users.service';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll(@Query() query: FindAllUsersDto) {
    return await this.adminUsersService.findAll(query);
  }

  @Get(':id')
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return await this.adminUsersService.findOneById(id);
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.updateRole(id, dto, user);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.updateStatus(
      id,
      dto,
      user,
    );
  }

  @Delete(':id')
  async removeUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.adminUsersService.removeUserByAdmin(id, user);
  }
}
