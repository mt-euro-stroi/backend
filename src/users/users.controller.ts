import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return { message: 'User created successfully', data: user };
  }

  @Get()
  async findAll(@Query() query: FindAllUsersDto) {
    const result = await this.usersService.findAll(query);
    return { message: 'Users retrieved successfully', data: result };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    const result = await this.usersService.findOne(id, req.user);
    return { message: 'User retrieved successfully', data: result };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const result = await this.usersService.update(id, req.user, updateUserDto);
    return { message: 'User updated successfully', data: result };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    await this.usersService.remove(id, req.user);
    return { message: 'User deleted successfully' };
  }
}
