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

@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() createFavouriteDto: CreateFavouriteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.favouritesService.create(createFavouriteDto, user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(
    @Query() query: FindAllFavouritesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.favouritesService.findAll(user, query);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.favouritesService.remove(id, user);
  }
}
