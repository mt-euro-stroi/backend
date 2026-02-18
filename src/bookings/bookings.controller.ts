import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { FindAllBookingsDto } from './dto/find-all-bookings.dto';
import { RoleGuard } from 'src/common/guards/role.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.create(createBookingDto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @Query() query: FindAllBookingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.findAll(user, query);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.remove(id, user);
  }
}
