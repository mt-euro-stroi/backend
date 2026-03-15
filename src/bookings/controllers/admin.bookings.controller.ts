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
import { BookingsService } from '../bookings.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminFindAllBookingsDto } from '../dto/admin-find-all-bookings.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Bookings')
@ApiBearerAuth('bearer')
@Controller('admin/bookings')
@UseGuards(AuthGuard, AdminGuard)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Админ: получить список бронирований' })
  @ApiResponse({ status: 200, description: 'Список бронирований' })
  async findAllAdmin(@Query() query: AdminFindAllBookingsDto) {
    return this.bookingsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Админ: получить бронирование по ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID бронирования' })
  @ApiResponse({ status: 200, description: 'Бронирование' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Админ: обновить статус бронирования' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID бронирования' })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({ status: 200, description: 'Статус обновлен' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Админ: удалить бронирование' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID бронирования' })
  @ApiResponse({ status: 200, description: 'Бронирование удалено' })
  async removeAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.removeAdmin(id);
  }
}
