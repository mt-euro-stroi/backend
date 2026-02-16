import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ResidentialComplexService } from './residential-complex.service';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';
import { FindAllResidentialComplexesDto } from './dto/find-all-residential-complexes.dto';

@Controller('residential-complex')
export class ResidentialComplexController {
  constructor(
    private readonly residentialComplexService: ResidentialComplexService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/residential-complexes'),
    FileCleanupInterceptor,
  )
  async create(
    @Body() createResidentialComplexDto: CreateResidentialComplexDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[],
  ) {
    return await this.residentialComplexService.create(
      createResidentialComplexDto,
      files.map((item) => item.filename),
    );
  }

  @Get()
  async findAll(@Query() query: FindAllResidentialComplexesDto) {
    return await this.residentialComplexService.findAll(query);
  }

  @Get(':identifier')
  async findOneBySlug(@Param('identifier') identifier: string) {
    return await this.residentialComplexService.findOne(identifier);
  }

  @Patch(':slug')
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/residential-complexes'),
    FileCleanupInterceptor,
  )
  async update(
    @Param('slug') slug: string,
    @Body() updateResidentialComplexDto: UpdateResidentialComplexDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.residentialComplexService.update(
      slug,
      updateResidentialComplexDto,
      files?.map((item) => item.filename) ?? [],
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.residentialComplexService.remove(id);
  }
}
