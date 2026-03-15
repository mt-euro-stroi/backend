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
import { ComplexService } from '../complexes.service';
import { CreateComplexDto } from '../dto/create-complex.dto';
import { UpdateComplexDto } from '../dto/update-complex.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { FilesUploadInterceptor } from 'src/common/interceptors/files-upload.interceptor';
import { RequiredFilesPipe } from 'src/common/pipe/required-files.pipe';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';
import { AdminFindAllComplexesDto } from '../dto/admin-find-all-complexes.dto';
import { UpdateComplexStatusDto } from '../dto/update-complex-status.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Complexes')
@ApiBearerAuth('bearer')
@Controller('admin/complexes')
@UseGuards(AuthGuard, AdminGuard)
export class AdminComplexController {
  constructor(private readonly complexService: ComplexService) {}

  @Post()
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/complexes'),
    FileCleanupInterceptor,
  )
  @ApiOperation({ summary: 'Админ: создать комплекс' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Комплекс создан' })
  async create(
    @Body() dto: CreateComplexDto,
    @UploadedFiles(RequiredFilesPipe) files: Express.Multer.File[],
  ) {
    return this.complexService.create(
      dto,
      files.map((item) => item.filename),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Админ: список комплексов' })
  @ApiResponse({ status: 200, description: 'Список комплексов' })
  async findAllAdmin(@Query() query: AdminFindAllComplexesDto) {
    return this.complexService.findAllAdmin(query);
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Админ: получить комплекс по идентификатору или slug',
  })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'ID или slug комплекса',
  })
  @ApiResponse({ status: 200, description: 'Детали комплекса' })
  async findOneAdmin(@Param('identifier') identifier: string) {
    return this.complexService.findOneAdmin(identifier);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/complexes'),
    FileCleanupInterceptor,
  )
  @ApiOperation({ summary: 'Админ: обновить комплекс' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'number', description: 'ID комплекса' })
  @ApiResponse({ status: 200, description: 'Комплекс обновлен' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.complexService.update(
      id,
      dto,
      files?.map((item) => item.filename) ?? [],
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Админ: обновить статус публикации' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID комплекса' })
  @ApiBody({ type: UpdateComplexStatusDto })
  @ApiResponse({ status: 200, description: 'Статус обновлен' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComplexStatusDto,
  ) {
    return this.complexService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Админ: удалить комплекс' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID комплекса' })
  @ApiResponse({ status: 200, description: 'Комплекс удален' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.complexService.remove(id);
  }
}
