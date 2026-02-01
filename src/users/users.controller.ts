import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Request } from 'express';
import { UsersService } from './users.service';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, EmailVerifiedGuard, RoleGuard)
  async findAll(@Query() query: FindAllUsersDto) {
    return await this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    return await this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.update(id, req.user, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, EmailVerifiedGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    return await this.usersService.remove(id, req.user);
  }
}
