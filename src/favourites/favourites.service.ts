import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateFavouriteDto } from './dto/create-favourite.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthUser } from 'src/common/types/auth-user.type';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import {
  FavouriteListItem,
  FavouriteResponse,
} from './types/favourites-response.types';
import { FindAllFavouritesDto } from './dto/find-all-favourites.dto';
import { mapFavouriteApartment } from './mappers/favourite.mapper';

@Injectable()
export class FavouritesService {
  private readonly logger = new Logger(FavouritesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: CreateFavouriteDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<FavouriteResponse>> {
    const userId = authUser.sub;
    const { apartmentId } = dto;

    this.logger.log(
      `Favourite creation attempt (userId=${userId}, apartmentId=${apartmentId})`,
    );

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id: apartmentId },
      select: { id: true, isPublished: true },
    });

    if (!apartment) {
      this.logger.warn(
        `Favourite creation failed: apartment not found (apartmentId=${apartmentId})`,
      );
      throw new NotFoundException('Apartment not found');
    }

    if (!apartment.isPublished) {
      this.logger.warn(
        `Favourite creation failed: apartment not published (apartmentId=${apartmentId})`,
      );
      throw new ConflictException('Apartment is not available');
    }

    const existing = await this.prismaService.favourite.findUnique({
      where: {
        userId_apartmentId: {
          userId,
          apartmentId,
        },
      },
    });

    if (existing) {
      this.logger.warn(
        `Favourite already exists (userId=${userId}, apartmentId=${apartmentId})`,
      );
      throw new ConflictException('Apartment already in favourites');
    }

    const favourite = await this.prismaService.favourite.create({
      data: {
        userId,
        apartmentId,
      },
      include: {
        apartment: {
          include: {
            files: {
              select: { id: true, path: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    this.logger.log(`Favourite created successfully (id=${favourite.id})`);

    const formattedFavourite = {
      id: favourite.id,
      userId: favourite.userId,
      apartmentId: favourite.apartmentId,
      createdAt: favourite.createdAt,
      apartment: mapFavouriteApartment(favourite.apartment),
    };

    return {
      message: 'Apartment added to favourites',
      data: formattedFavourite,
    };
  }

  async findAll(
    query: FindAllFavouritesDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<PaginatedResult<FavouriteListItem>>> {
    const { page = 1, limit = 20 } = query;
    const userId = authUser.sub;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching favourites (userId=${userId})`);

    const [favourites, total] = await this.prismaService.$transaction([
      this.prismaService.favourite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          apartment: {
            include: {
              files: {
                select: { id: true, path: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      }),
      this.prismaService.favourite.count({
        where: { userId },
      }),
    ]);

    const formatted = favourites.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      apartment: mapFavouriteApartment(item.apartment),
    }));

    this.logger.log(
      `Favourites retrieved successfully (userId=${userId}, count=${formatted.length})`,
    );

    return {
      message: 'Favourites retrieved successfully',
      data: {
        items: formatted,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async remove(
    id: number,
    authUser: AuthUser,
  ): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(
      `Favourite removal attempt (userId=${userId}, apartmentId=${id})`,
    );

    const existing = await this.prismaService.favourite.findUnique({
      where: {
        userId_apartmentId: {
          userId,
          apartmentId: id,
        },
      },
    });

    if (!existing) {
      this.logger.warn(
        `Favourite removal failed: not found (userId=${userId}, apartmentId=${id})`,
      );
      throw new NotFoundException('Favourite not found');
    }

    await this.prismaService.favourite.delete({
      where: {
        userId_apartmentId: {
          userId,
          apartmentId: id,
        },
      },
    });

    this.logger.log(
      `Favourite removed successfully (userId=${userId}, apartmentId=${id})`,
    );

    return {
      message: 'Apartment removed from favourites',
    };
  }
}
