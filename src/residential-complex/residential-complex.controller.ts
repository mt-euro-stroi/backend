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
import { FindAllUsersDto } from 'src/users/dto/find-all-users.dto';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';

@Controller('residential-complex')
export class ResidentialComplexController {
  constructor(
    private readonly residentialComplexService: ResidentialComplexService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(FilesUploadInterceptor('./uploads/residential-complexes'))
  async create(
    @Body() createResidentialComplexDto: CreateResidentialComplexDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[],
  ) {
    return await this.residentialComplexService.create(
      createResidentialComplexDto,
      files.map((file) => file.filename),
    );
  }

  @Get()
  async findAll(@Query() query: FindAllUsersDto) {
    return await this.residentialComplexService.findAll(query);
  }

  @Get('by-id/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    return await this.residentialComplexService.findOneById(id);
  }

  @Get(':slug')
  async findOneBySlug(@Param('slug') slug: string) {
    return await this.residentialComplexService.findOneBySlug(slug);
  }

  @Patch(':slug')
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(FilesUploadInterceptor('./uploads/residential-complexes'))
  async update(
    @Param('slug') slug: string,
    @Body() updateResidentialComplexDto: UpdateResidentialComplexDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.residentialComplexService.update(
      slug,
      updateResidentialComplexDto,
      files?.map((file) => file.filename) ?? []
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.residentialComplexService.remove(id);
  }
}
