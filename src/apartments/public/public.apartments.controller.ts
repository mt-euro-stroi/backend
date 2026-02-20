import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PublicApartmentService } from './public.apartments.service';
import { PublicFindAllApartmentsDto } from '../dto/public-find-all-apartments.dto';

@Controller('apartments')
export class PublicApartmentController {
  constructor(
    private readonly publicApartmentService: PublicApartmentService,
  ) {}

  @Get()
  async findAll(@Query() query: PublicFindAllApartmentsDto) {
    return await this.publicApartmentService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.publicApartmentService.findOne(id);
  }
}
