import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicComplexService } from './public.complexes.service';
import { PublicFindAllComplexesDto } from '../dto/public-find-all-complexes.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Complexes')
@Controller('complexes')
export class PublicComplexController {
  constructor(private readonly publicComplexService: PublicComplexService) {}

  @Get()
  @ApiOperation({ summary: 'Список комплексов' })
  @ApiResponse({ status: 200, description: 'Список комплексов' })
  async findAll(@Query() query: PublicFindAllComplexesDto) {
    return await this.publicComplexService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Детали комплекса по slug' })
  @ApiResponse({ status: 200, description: 'Детали комплекса' })
  async findOneBySlug(@Param('slug') slug: string) {
    return await this.publicComplexService.findOne(slug);
  }
}
