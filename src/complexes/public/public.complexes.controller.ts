import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicComplexService } from './public.complexes.service';
import { PublicFindAllComplexesDto } from '../dto/public-find-all-complexes.dto';

@Controller('complexes')
export class PublicComplexController {
  constructor(private readonly publicComplexService: PublicComplexService) {}

  @Get()
  async findAll(@Query() query: PublicFindAllComplexesDto) {
    return await this.publicComplexService.findAll(query);
  }

  @Get(':slug')
  async findOneBySlug(@Param('slug') slug: string) {
    return await this.publicComplexService.findOne(slug);
  }
}
