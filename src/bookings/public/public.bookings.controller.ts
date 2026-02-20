import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PublicBookingsService } from './public.bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import type { AuthUser } from 'src/common/types/auth-user.type';

@Controller('bookings')
export class PublicBookingsController {
  constructor(private readonly publicBookingsService: PublicBookingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.publicBookingsService.create(dto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @CurrentUser() user: AuthUser,
  ) {
    return this.publicBookingsService.findAll(user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.publicBookingsService.remove(id, user);
  }
}
