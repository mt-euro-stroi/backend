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

    try {
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

          await tx.file.createMany({
            data: files.map((file, index) => ({
              path: `residential-complexes/${file}`,
              entityId: complex.id,
              entityType: 'RESIDENTIAL_COMPLEX',
              isMain: index === 0,
            })),
          });

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
    } catch (error) {
      await removeUploadedFiles(
        files.map((file) => `residential-complexes/${file}`),
      );

      this.logger.error(
        'Residential complex creation failed. Uploaded files were removed.',
        error.stack,
      );

      throw error;
    }
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

    const [residentialComplexes, total] =
      await this.prismaService.$transaction([
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
      ]);

    const ids = residentialComplexes.map(rc => rc.id);

    const mainFiles = await this.prismaService.file.findMany({
      where: {
        entityType: 'RESIDENTIAL_COMPLEX',
        entityId: { in: ids },
        isMain: true,
      },
      select: {
        entityId: true,
        path: true,
      },
    });

    const mainFileMap = new Map(
      mainFiles.map(file => [file.entityId, file.path]),
    );

    const formattedResidentialComplexes = residentialComplexes.map(rc => ({
      ...rc,
      mainFile: mainFileMap.get(rc.id),
    }));

    this.logger.log(
      `Residential complexes list retrieved: items=${residentialComplexes.length}, total=${total}, page=${page}.`,
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

    const files = await this.prismaService.file.findMany({
      where: {
        entityId: id,
        entityType: 'RESIDENTIAL_COMPLEX',
      },
      select: {
        id: true,
        path: true
      },
      orderBy: [
        { isMain: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    this.logger.log(
      `Residential complex retrieved successfully (id=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex retrieved successfully.',
      data: {
        ...residentialComplex,
        files
      },
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

    const files = await this.prismaService.file.findMany({
      where: {
        entityId: residentialComplex.id,
        entityType: 'RESIDENTIAL_COMPLEX',
      },
      select: {
        id: true,
        path: true
      },
      orderBy: [
        { isMain: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    this.logger.log(
      `Residential complex retrieved successfully (id=${residentialComplex.id}).`,
    );

    return {
      message: 'Residential complex retrieved successfully.',
      data: {
        ...residentialComplex,
        files
      },
    };
  }

  async update(
    slug: string,
    updateResidentialComplexDto: UpdateResidentialComplexDto,
    newFiles: string[],
  ) {
    this.logger.log(
      `Residential complex update attempt started (slug=${slug}).`,
    );

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

    const { deletedFileIds, ...updateData } =
      updateResidentialComplexDto;

    let filesToDelete: { path: string }[] = [];

    if (deletedFileIds?.length) {
      filesToDelete = await this.prismaService.file.findMany({
        where: {
          id: { in: deletedFileIds },
          entityId: residentialComplex.id,
          entityType: 'RESIDENTIAL_COMPLEX',
        },
        select: { path: true },
      });
    }

    const updatedResidentialComplex =
      await this.prismaService.$transaction(async (tx) => {
        const complex = await tx.residentialComplex.update({
          where: { slug },
          data: updateData,
        });

        let mainWasDeleted = false;

        if (deletedFileIds?.length) {
          const mainFile = await tx.file.findFirst({
            where: {
              entityId: complex.id,
              entityType: 'RESIDENTIAL_COMPLEX',
              isMain: true,
            },
          });

          if (mainFile && deletedFileIds.includes(mainFile.id)) {
            mainWasDeleted = true;
          }

          await tx.file.deleteMany({
            where: {
              id: { in: deletedFileIds },
              entityId: complex.id,
              entityType: 'RESIDENTIAL_COMPLEX',
            },
          });
        }

        if (newFiles?.length) {
          await tx.file.createMany({
            data: newFiles.map((file) => ({
              path: `residential-complexes/${file}`,
              entityId: complex.id,
              entityType: 'RESIDENTIAL_COMPLEX',
              isMain: false,
            })),
          });
        }

        if (mainWasDeleted) {
          const newMain = await tx.file.findFirst({
            where: {
              entityId: complex.id,
              entityType: 'RESIDENTIAL_COMPLEX',
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

        return complex;
      });


    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((f) => f.path));
    }

    this.logger.log(
      `Residential complex updated successfully (id=${updatedResidentialComplex.id}).`,
    );

    return {
      message: 'Residential complex updated successfully.',
      data: updatedResidentialComplex,
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(
      `Residential complex delete attempt started (id=${id}).`,
    );

    const residentialComplex =
      await this.prismaService.residentialComplex.findUnique({
        where: { id },
      });

    if (!residentialComplex) {
      this.logger.warn(
        `Residential complex delete failed: not found (id=${id}).`,
      );
      throw new NotFoundException('Residential complex not found');
    }

    const files = await this.prismaService.file.findMany({
      where: {
        entityId: id,
        entityType: 'RESIDENTIAL_COMPLEX',
      },
      select: { path: true },
    });

    const filePaths = files.map(file => file.path);

    await this.prismaService.$transaction([
      this.prismaService.file.deleteMany({
        where: {
          entityId: id,
          entityType: 'RESIDENTIAL_COMPLEX',
        },
      }),
      this.prismaService.residentialComplex.delete({
        where: { id },
      }),
    ]);

    await removeUploadedFiles(filePaths);

    this.logger.log(
      `Residential complex deleted successfully (id=${id}).`,
    );

    return {
      message: 'Residential complex deleted successfully',
    };
  }
}
