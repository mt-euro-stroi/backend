import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FavouritesService } from './favourites.service';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/auth-user.decorator';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { FindAllFavouritesDto } from './dto/find-all-favourites.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Favourites')
@ApiBearerAuth('bearer')
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Добавить в избранное' })
  @ApiBody({ type: CreateFavouriteDto })
  @ApiResponse({ status: 201, description: 'Квартира добавлена в избранное' })
  async create(@Body() dto: CreateFavouriteDto, @CurrentUser() user: AuthUser) {
    return this.favouritesService.create(dto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Список избранных квартир' })
  @ApiResponse({ status: 200, description: 'Список избранных' })
  async findAll(
    @Query() query: FindAllFavouritesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.favouritesService.findAll(query, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Удалить из избранного' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID квартиры, которую нужно удалить из избранного',
  })
  @ApiResponse({ status: 200, description: 'Удалено из избранного' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.favouritesService.remove(id, user);
  }
}
