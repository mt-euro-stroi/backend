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
import { AdminComplexService } from './admin.complexes.service';
import { CreateComplexDto } from '../dto/create-complex.dto';
import { UpdateComplexDto } from '../dto/update-complex.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';
import { AdminFindAllComplexesDto } from '../dto/admin-find-all-complexes.dto';
import { UpdateComplexStatusDto } from '../dto/update-complex-status.dto';

@Controller('admin/complexes')
@UseGuards(AuthGuard, AdminGuard)
export class AdminComplexController {
  constructor(private readonly adminComplexService: AdminComplexService) {}

  @Post()
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/complexes'),
    FileCleanupInterceptor,
  )
  async create(
    @Body() dto: CreateComplexDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[],
  ) {
    return await this.adminComplexService.create(
      dto,
      files.map((item) => item.filename),
    );
  }

  @Get()
  async findAll(@Query() query: AdminFindAllComplexesDto) {
    return await this.adminComplexService.findAll(query);
  }

  @Get(':identifier')
  async findOneBySlug(@Param('identifier') identifier: string) {
    return await this.adminComplexService.findOne(identifier);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/complexes'),
    FileCleanupInterceptor,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.adminComplexService.update(
      id,
      dto,
      files?.map((item) => item.filename) ?? [],
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexStatusDto,
  ) {
    return await this.adminComplexService.updateStatus(
      id,
      dto,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.adminComplexService.remove(id);
  }
}
