import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ResidentialComplexService } from './residential-complex.service';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';

@Controller('residential-complex')
export class ResidentialComplexController {
  constructor(
    private readonly residentialComplexService: ResidentialComplexService,
  ) {}

  @Post()
  async create(
    @Body() createResidentialComplexDto: CreateResidentialComplexDto,
  ) {
    return await this.residentialComplexService.create(
      createResidentialComplexDto,
    );
  }

  @Get()
  async findAll() {
    return await this.residentialComplexService.findAll();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return await this.residentialComplexService.findOne(slug);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResidentialComplexDto: UpdateResidentialComplexDto,
  ) {
    return await this.residentialComplexService.update(
      id,
      updateResidentialComplexDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.residentialComplexService.remove(id);
  }
}
