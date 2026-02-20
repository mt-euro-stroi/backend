import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
} from 'src/common/types/service-response.types';
import {
  ComplexListItem,
  ComplexResponse,
} from '../types/complex-response.types';
import { PublicFindAllComplexesDto } from '../dto/public-find-all-complexes.dto';
import { complexFilesInclude } from '../prisma/complex.include';

@Injectable()
export class PublicComplexService {
  private readonly logger = new Logger(PublicComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: PublicFindAllComplexesDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ComplexListItem>>> {
    const { page = 1, limit = 20, search } = query;

    this.logger.log(
      `Public complexes list request started (page=${page}, limit=${limit}).`,
    );

    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [complexes, total] = await this.prismaService.$transaction([
      this.prismaService.complex.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: complexFilesInclude,
      }),
      this.prismaService.complex.count({ where }),
    ]);

    const formattedComplexes = complexes.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      city: item.city,
      address: item.address,
      priceFrom: item.priceFrom,
      isPublished: item.isPublished,
      files: item.files,
    }));

    this.logger.log(
      `Public complexes retrieved (items=${formattedComplexes.length}, total=${total}).`,
    );

    return {
      message: 'Complexes retrieved successfully.',
      data: {
        items: formattedComplexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string): Promise<ServiceDataResponse<ComplexResponse>> {
    this.logger.log(`Public complex get attempt started (slug=${slug}).`);

    const complex = await this.prismaService.complex.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        ...complexFilesInclude,
        apartments: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            entrance: true,
            number: true,
            rooms: true,
            area: true,
            floor: true,
            price: true,
            status: true,
            isPublished: true,
            files: {
              select: { id: true, path: true },
              orderBy: { createdAt: 'asc' as const },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!complex) {
      this.logger.warn(
        `Public complex get failed: not found or unpublished (slug=${slug}).`,
      );
      throw new NotFoundException('Complex not found');
    }

    const formattedApartments = complex.apartments.map((item) => ({
      ...item,
      area: Number(item.area),
    }));

    this.logger.log(
      `Public complex retrieved successfully (id=${complex.id}, slug=${slug}).`,
    );

    return {
      message: 'Complex retrieved successfully.',
      data: {
        ...complex,
        apartments: formattedApartments,
      },
    };
  }
}
