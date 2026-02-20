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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Apartments')
@Controller('admin/apartments')
@UseGuards(AuthGuard, AdminGuard)
export class AdminApartmentController {
  constructor(private readonly adminApartmentService: AdminApartmentService) {}

  @Post()
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor,
  )
  @ApiOperation({
    summary: 'Создание новой квартиры',
    description:
      'Создает новую квартиру с загрузкой изображений (требуется admin роль)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Квартира успешно создана',
  })
  @ApiBadRequestResponse({
    description: 'Некорректные данные или отсутствуют файлы',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
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
  @ApiOperation({
    summary: 'Получение списка всех квартир',
    description: 'Получает список квартир с фильтрацией и пагинацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Список квартир успешно получен',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
  async findAll(@Query() query: AdminFindAllApartmentsDto) {
    return await this.adminApartmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получение деталей квартиры',
    description: 'Получает полную информацию о квартире по ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID квартиры',
  })
  @ApiResponse({
    status: 200,
    description: 'Деталь квартиры успешно получена',
  })
  @ApiNotFoundResponse({
    description: 'Квартира не найдена',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.adminApartmentService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesUploadInterceptor('./uploads/apartments'),
    FileCleanupInterceptor,
  )
  @ApiOperation({
    summary: 'Обновление квартиры',
    description: 'Обновляет информацию о квартире и может заменить изображения',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID квартиры',
  })
  @ApiResponse({
    status: 200,
    description: 'Квартира успешно обновлена',
  })
  @ApiNotFoundResponse({
    description: 'Квартира не найдена',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
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
  @ApiOperation({
    summary: 'Обновление статуса квартиры',
    description: 'Изменяет статус квартиры (AVAILABLE, SOLD, RESERVED)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID квартиры',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус успешно обновлен',
  })
  @ApiNotFoundResponse({
    description: 'Квартира не найдена',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApartmentStatusDto,
  ) {
    return await this.adminApartmentService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление квартиры',
    description: 'Удаляет квартиру и все связанные файлы',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID квартиры',
  })
  @ApiResponse({
    status: 200,
    description: 'Квартира успешно удалена',
  })
  @ApiNotFoundResponse({
    description: 'Квартира не найдена',
  })
  @ApiUnauthorizedResponse({
    description: 'Не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Недостаточно прав (требуется admin)',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.adminApartmentService.remove(id);
  }
}
