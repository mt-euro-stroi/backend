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
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, RoleGuard)
  async findAll(@Query() query: FindAllUsersDto) {
    return await this.usersService.findAll(query);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async findMe(@CurrentUser() user: AuthUser) {
    return await this.usersService.findMe(user);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RoleGuard)
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOneById(id);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateMe(user, updateUserDto);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  async removeMe(@CurrentUser() user: AuthUser) {
    return await this.usersService.removeMe(user);
  }
}
