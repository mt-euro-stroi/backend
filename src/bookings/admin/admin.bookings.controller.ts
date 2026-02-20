import {
  Controller,
  Get,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import { AdminBookingsService } from './admin.bookings.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminFindAllBookingsDto } from '../dto/admin-find-all-bookings.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';

@Controller('admin/bookings')
@UseGuards(AuthGuard, AdminGuard)
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @Get()
  async findAll(
    @Query() query: AdminFindAllBookingsDto,
  ) {
    return this.adminBookingsService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminBookingsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.adminBookingsService.updateStatus(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminBookingsService.remove(id);
  }
}
