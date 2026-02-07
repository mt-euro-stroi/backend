import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateResidentialComplexDto } from './dto/create-residential-complex.dto';
import { UpdateResidentialComplexDto } from './dto/update-residential-complex.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import {
  ResidentialComplexListItem,
  ResidentialComplexResponse,
} from './types/residential-complex-response.types';
import { FindAllResidentialComplexesDto } from './dto/find-all-residential-complex.dto';

@Injectable()
export class ResidentialComplexService {
  private readonly logger = new Logger(ResidentialComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createResidentialComplexDto: CreateResidentialComplexDto,
  ): Promise<ServiceDataResponse<ResidentialComplexListItem>> {
    const { slug } = createResidentialComplexDto;

    this.logger.log('Residential complex creation attempt started.');

    const bySlug = await this.prismaService.residentialComplex.findUnique({
      where: { slug },
    });

    if (bySlug) {
      this.logger.warn(
        'Residential complex creation conflict: slug already exists.',
      );
      throw new ConflictException(
        'Residential complex with this slug already exists',
      );
    }

    const residentialComplex =
      await this.prismaService.residentialComplex.create({
        data: {
          ...createResidentialComplexDto,
        },
      });

    this.logger.log(
      `Residential complex created successfully (residentialComplexId=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex created successfully',
      data: residentialComplex,
    };
  }

  async findAll(
    query: FindAllResidentialComplexesDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ResidentialComplexListItem>>> {
    this.logger.log('Residential complexes list request started.');

    const { search, isPublished } = query;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [residentialComplexes, total] = await this.prismaService.$transaction(
      [
        this.prismaService.residentialComplex.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            address: true,
            isPublished: true,
          },
        }),
        this.prismaService.residentialComplex.count({ where }),
      ],
    );

    this.logger.log(
      `Residential complexes list retrieved: items=${residentialComplexes.length}, total=${total}, page=${page}.`,
    );

    return {
      message: 'Residential complexes retrieved successfully.',
      data: {
        items: residentialComplexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOneById(
    id: number,
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log('Residential complex get by id attempt started.');

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { id },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex get by id failed: not found (id=${id}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    this.logger.log(
      `Residential complex retrieved successfully (id=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex retrieved successfully.',
      data: residentialComplex,
    };
  }

  async findOneBySlug(
    slug: string,
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log('Residential complex get by slug attempt started.');

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { slug },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex get by slug failed: not found (slug=${slug}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    this.logger.log(
      `Residential complex retrieved successfully (id=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex retrieved successfully.',
      data: residentialComplex,
    };
  }

  async update(
    slug: string,
    updateResidentialComplexDto: UpdateResidentialComplexDto,
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log('Residential complex update attempt started.');

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { slug },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex update failed: not found (slug=${slug}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const updatedResidentialComplex =
      await this.prismaService.residentialComplex.update({
        where: { slug },
        data: {
          ...updateResidentialComplexDto,
        },
      });

    this.logger.log(
      `Residential complex updated successfully (id=${updatedResidentialComplex.id}).`,
    );

    return {
      message: 'Residential complex updated successfully.',
      data: updatedResidentialComplex,
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log('Residential complex delete attempt started.');

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { id },
      });

    if (!residentialComplex) {
      this.logger.warn('Residential complex delete failed: not found.');
      throw new NotFoundException('Residential complex not found');
    }

    await this.prismaService.residentialComplex.delete({
      where: { id },
    });

    this.logger.log(`Residential complex deleted successfully (id=${id}).`);

    return {
      message: 'Residential complex deleted successfully',
    };
  }
}
