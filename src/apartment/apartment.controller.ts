import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, ParseIntPipe } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';

@Controller('apartment')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor
  )
  async create(
    @Body() createApartmentDto: CreateApartmentDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[]
  ) {
    return await this.apartmentService.create(
      createApartmentDto,
      files.map((item) => item.filename)
    );
  }

  @Get()
  async findAll() {
    return await this.apartmentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.apartmentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApartmentDto: UpdateApartmentDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return await this.apartmentService.update(
      id,
      updateApartmentDto,
      files?.map((item) => item.filename) ?? [],
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.apartmentService.remove(id);
  }
}
