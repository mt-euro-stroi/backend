import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PublicApartmentService } from './public.apartments.service';
import { PublicFindAllApartmentsDto } from '../dto/public-find-all-apartments.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Apartments')
@Controller('apartments')
export class PublicApartmentController {
  constructor(
    private readonly publicApartmentService: PublicApartmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Публично: получить список квартир' })
  @ApiResponse({ status: 200, description: 'Список квартир' })
  async findAll(@Query() query: PublicFindAllApartmentsDto) {
    return this.publicApartmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Публично: получить детали квартиры по ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID квартиры' })
  @ApiResponse({ status: 200, description: 'Детали квартиры' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicApartmentService.findOne(id);
  }
}
