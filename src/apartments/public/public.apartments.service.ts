import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicFindAllApartmentsDto } from '../dto/public-find-all-apartments.dto';
import {
  PaginatedResult,
  ServiceDataResponse,
} from 'src/common/types/service-response.types';
import { ApartmentResponse } from '../types/apartment-response.types';
import { apartmentInclude } from '../prisma/apartment.include';
import { mapApartment } from '../mappers/apartment.mapper';

@Injectable()
export class PublicApartmentService {
  private readonly logger = new Logger(PublicApartmentService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: PublicFindAllApartmentsDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ApartmentResponse>>> {
    const {
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      rooms,
      floor,
      status,
      search,
    } = query;

    this.logger.log(
      `Public apartments list request started (page=${page}, limit=${limit})`,
    );

    const skip = (page - 1) * limit;

    const priceFilter =
      minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {};

    const where = {
      isPublished: true,
      ...(status !== undefined && { status }),
      ...(rooms !== undefined && { rooms }),
      ...(floor !== undefined && { floor }),
      ...priceFilter,
      ...(search?.trim() && {
        OR: [{ description: { search } }],
      }),
    };

    const [apartments, total] = await this.prismaService.$transaction([
      this.prismaService.apartment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: apartmentInclude,
      }),
      this.prismaService.apartment.count({ where }),
    ]);

    const formatted = apartments.map((item) => mapApartment(item));

    this.logger.log(
      `Public apartments retrieved successfully (items=${formatted.length}, total=${total})`,
    );

    return {
      message: 'Квартиры были успешно получены',
      data: {
        items: formatted,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<ServiceDataResponse<ApartmentResponse>> {
    this.logger.log(`Public apartment retrieval attempt started (id=${id})`);

    const apartment = await this.prismaService.apartment.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: apartmentInclude,
    });

    if (!apartment) {
      this.logger.warn(`Public apartment not found or unpublished (id=${id})`);
      throw new NotFoundException('Квартира не найдена');
    }

    this.logger.log(`Public apartment retrieved successfully (id=${id})`);

    return {
      message: 'Квартира успешно получена',
      data: mapApartment(apartment),
    };
  }
}
