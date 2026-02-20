import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { PublicUsersService } from './public.users.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class PublicUsersController {
  constructor(private readonly publicUsersService: PublicUsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async findMe(@CurrentUser() user: AuthUser) {
    return await this.publicUsersService.findMe(user);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.publicUsersService.updateMe(dto, user);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  async removeMe(@CurrentUser() user: AuthUser) {
    return await this.publicUsersService.removeMe(user);
  }
}
