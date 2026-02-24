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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Bookings')
@ApiBearerAuth('bearer')
@Controller('bookings')
export class PublicBookingsController {
  constructor(private readonly publicBookingsService: PublicBookingsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Создать бронирование' })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Бронирование создано' })
  async create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.publicBookingsService.create(dto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Список бронирований текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список бронирований' })
  async findAll(@CurrentUser() user: AuthUser) {
    return this.publicBookingsService.findAll(user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Удалить бронирование' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID бронирования' })
  @ApiResponse({ status: 200, description: 'Бронирование удалено' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.publicBookingsService.remove(id, user);
  }
}
