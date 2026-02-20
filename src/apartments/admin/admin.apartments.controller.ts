import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AdminApartmentService } from './admin.apartments.service';
import { CreateApartmentDto } from '../dto/create-apartment.dto';
import { UpdateApartmentDto } from '../dto/update-apartment.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';
import { AdminFindAllApartmentsDto } from '../dto/admin-find-all-apartments.dto';
import { UpdateApartmentStatusDto } from '../dto/update-apartment-status.dto';

@Controller('admin/apartments')
@UseGuards(AuthGuard, AdminGuard)
export class AdminApartmentController {
  constructor(private readonly adminApartmentService: AdminApartmentService) {}

  @Post()
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor,
  )
  async create(
    @Body() dto: CreateApartmentDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[],
  ) {
    return await this.adminApartmentService.create(
      dto,
      files.map((item) => item.filename),
    );
  }

  @Get()
  async findAll(@Query() query: AdminFindAllApartmentsDto) {
    return await this.adminApartmentService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.adminApartmentService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApartmentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.adminApartmentService.update(
      id,
      dto,
      files?.map((item) => item.filename) ?? [],
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApartmentStatusDto,
  ) {
    return await this.adminApartmentService.updateStatus(
      id,
      dto,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.adminApartmentService.remove(id);
  }
}
