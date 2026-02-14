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
import { removeUploadedFiles } from 'src/common/utils/remove-uploaded-files.util';

@Injectable()
export class ResidentialComplexService {
  private readonly logger = new Logger(ResidentialComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

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
          data: {
            ...createResidentialComplexDto,
          },
        });

        if (files?.length) {
          await tx.file.createMany({
            data: files.map((item, index) => ({
              path: `residential-complexes/${item}`,
              residentialComplexId: complex.id,
              isMain: index === 0,
            })),
          });
        }

        return complex;
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

    const { search, isPublished } = query;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(isPublished !== undefined ? { isPublished } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
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
          include: {
            files: {
              where: { isMain: true },
              select: { path: true },
              take: 1,
            },
          },
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
      mainFile: item.files[0]?.path ?? null,
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
          files: {
            select: {
              id: true,
              path: true,
            },
            orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
          },
        },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex get failed: not found (identifier=${identifier}).`,
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
    updateDto: UpdateResidentialComplexDto,
    newFiles: string[],
  ): Promise<ServiceDataResponse<ResidentialComplexResponse>> {
    this.logger.log(
      `Residential complex update attempt started (slug=${slug}).`,
    );

    const complex = await this.prismaService.residentialComplex.findUnique({
      where: { slug },
    });

    if (!complex) {
      this.logger.warn(
        `Residential complex update failed: not found (slug=${slug}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const { deletedFileIds = [], ...updateData } = updateDto;

    const filesToDelete = deletedFileIds.length
      ? await this.prismaService.file.findMany({
          where: {
            id: { in: deletedFileIds },
            residentialComplexId: complex.id,
          },
          select: { id: true, path: true, isMain: true },
        })
      : [];

    const mainDeleted = filesToDelete.some((f) => f.isMain);

    const updatedComplex = await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.residentialComplex.update({
        where: { slug },
        data: updateData,
      });

      if (deletedFileIds.length) {
        await tx.file.deleteMany({
          where: {
            id: { in: deletedFileIds },
            residentialComplexId: updated.id,
          },
        });
      }

      if (newFiles?.length) {
        await tx.file.createMany({
          data: newFiles.map((file) => ({
            path: `residential-complexes/${file}`,
            residentialComplexId: updated.id,
            isMain: false,
          })),
        });
      }

      if (mainDeleted) {
        const newMain = await tx.file.findFirst({
          where: {
            residentialComplexId: updated.id,
          },
          orderBy: { createdAt: 'asc' },
        });

        if (newMain) {
          await tx.file.update({
            where: { id: newMain.id },
            data: { isMain: true },
          });
        }
      }

      return updated;
    });

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((f) => f.path));
    }

    const files = await this.prismaService.file.findMany({
      where: {
        residentialComplexId: updatedComplex.id,
      },
      select: {
        id: true,
        path: true,
      },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
    });

    this.logger.log(
      `Residential complex updated successfully (id=${updatedComplex.id}).`,
    );

    return {
      message: 'Residential complex updated successfully.',
      data: {
        ...updatedComplex,
        files,
      },
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

    const filePaths = residentialComplex.files.map((file) => file.path);

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
