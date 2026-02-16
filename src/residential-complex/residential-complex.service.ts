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
import { FindAllResidentialComplexesDto } from './dto/find-all-residential-complexes.dto';
import { removeUploadedFiles } from 'src/common/utils/remove-uploaded-files.util';

@Injectable()
export class ResidentialComplexService {
  private readonly logger = new Logger(ResidentialComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private readonly complexFilesInclude = {
    files: {
      select: { id: true, path: true },
      orderBy: { createdAt: 'asc' as const },
    },
  } as const;

  async create(
    createResidentialComplexDto: CreateResidentialComplexDto,
    files: string[],
  ): Promise<ServiceDataResponse<ResidentialComplexListItem>> {
    const { slug } = createResidentialComplexDto;

    this.logger.log(
      `Residential complex creation attempt started (slug=${slug}).`,
    );

    const bySlug = await this.prismaService.residentialComplex.findUnique({
      where: { slug },
    });

    if (bySlug) {
      this.logger.warn(
        `Residential complex creation conflict: slug already exists (slug=${slug}).`,
      );
      throw new ConflictException(
        'Residential complex with this slug already exists',
      );
    }

    const residentialComplex = await this.prismaService.$transaction(
      async (tx) => {
        const complex = await tx.residentialComplex.create({
          data: { ...createResidentialComplexDto },
        });

        await tx.file.createMany({
          data: files.map((item) => ({
            path: `residential-complexes/${item}`,
            residentialComplexId: complex.id,
          })),
        });

        return tx.residentialComplex.findUniqueOrThrow({
          where: { id: complex.id },
          include: this.complexFilesInclude,
        });
      },
    );

    this.logger.log(
      `Residential complex created successfully (id=${residentialComplex.id}, slug=${slug}).`,
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

    const { page = 1, limit = 20, search, isPublished } = query;

    const skip = (page - 1) * limit;

    const where = {
      ...(isPublished !== undefined && { isPublished }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { city: { contains: search } },
          { address: { contains: search } },
          { slug: { contains: search } },
        ],
      }),
    };

    const [residentialComplexes, total] = await this.prismaService.$transaction(
      [
        this.prismaService.residentialComplex.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'asc' },
          include: this.complexFilesInclude,
        }),
        this.prismaService.residentialComplex.count({ where }),
      ],
    );

    const formattedResidentialComplexes = residentialComplexes.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      city: item.city,
      address: item.address,
      isPublished: item.isPublished,
      files: item.files,
    }));

    this.logger.log(
      `Residential complexes list retrieved: items=${formattedResidentialComplexes.length}, total=${total}, page=${page}.`,
    );

    return {
      message: 'Residential complexes retrieved successfully.',
      data: {
        items: formattedResidentialComplexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    identifier: string,
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log(
      `Residential complex get attempt started (identifier=${identifier}).`,
    );

    const isId = !isNaN(Number(identifier));

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: isId ? { id: Number(identifier) } : { slug: identifier },
        include: {
          ...this.complexFilesInclude,
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
              ...this.complexFilesInclude,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex get failed: not found (identifier=${identifier}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const formattedApartments = residentialComplex.apartments.map((item) => ({
      ...item,
      area: Number(item.area),
    }));

    this.logger.log(
      `Residential complex retrieved successfully (id=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex retrieved successfully.',
      data: {
        ...residentialComplex,
        apartments: formattedApartments,
      },
    };
  }

  async update(
    slug: string,
    updateResidentialComplexDto: UpdateResidentialComplexDto,
    newFiles: string[],
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log(
      `Residential complex update attempt started (slug=${slug}).`,
    );

    const complex = await this.prismaService.residentialComplex.findUnique({
      where: { slug },
      include: {
        files: { select: { id: true } },
      },
    });

    if (!complex) {
      this.logger.warn(
        `Residential complex update failed: not found (slug=${slug}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const { deletedFileIds = [], ...updateData } = updateResidentialComplexDto;

    const filesToDelete = deletedFileIds.length
      ? await this.prismaService.file.findMany({
          where: {
            id: { in: deletedFileIds },
            residentialComplexId: complex.id,
          },
          select: { id: true, path: true },
        })
      : [];

    const currentFilesCount = complex.files.length;
    const remainingFiles =
      currentFilesCount - filesToDelete.length + (newFiles?.length ?? 0);

    if (remainingFiles <= 0) {
      this.logger.warn(
        `Residential complex update failed: attempt to delete last image (slug=${slug}).`,
      );
      throw new ConflictException(
        'At least one image must remain for the residential complex',
      );
    }

    const updatedComplex = await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.residentialComplex.update({
        where: { slug },
        data: updateData,
      });

      if (filesToDelete.length) {
        await tx.file.deleteMany({
          where: {
            id: { in: filesToDelete.map((item) => item.id) },
            residentialComplexId: updated.id,
          },
        });
      }

      if (newFiles?.length) {
        await tx.file.createMany({
          data: newFiles.map((item) => ({
            path: `residential-complexes/${item}`,
            residentialComplexId: updated.id,
          })),
        });
      }

      return tx.residentialComplex.findUniqueOrThrow({
        where: { id: updated.id },
        include: this.complexFilesInclude,
      });
    });

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((item) => item.path));
    }

    this.logger.log(
      `Residential complex updated successfully (id=${updatedComplex.id}).`,
    );

    return {
      message: 'Residential complex updated successfully.',
      data: updatedComplex,
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Residential complex delete attempt started (id=${id}).`);

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { id },
        include: {
          files: {
            select: { path: true },
          },
        },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex delete failed: not found (id=${id}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const filePaths = residentialComplex.files.map((item) => item.path);

    await this.prismaService.residentialComplex.delete({
      where: { id },
    });

    if (filePaths.length) {
      await removeUploadedFiles(filePaths);
    }

    this.logger.log(`Residential complex deleted successfully (id=${id}).`);

    return {
      message: 'Residential complex deleted successfully',
    };
  }
}
