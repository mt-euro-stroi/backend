import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateComplexDto } from '../dto/create-complex.dto';
import { UpdateComplexDto } from '../dto/update-complex.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import {
  ComplexListItem,
  ComplexResponse,
} from '../types/complex-response.types';
import { AdminFindAllComplexesDto } from '../dto/admin-find-all-complexes.dto';
import { removeUploadedFiles } from 'src/common/utils/remove-uploaded-files.util';
import { UpdateComplexStatusDto } from '../dto/update-complex-status.dto';
import { complexFilesInclude } from '../prisma/complex.include';

@Injectable()
export class AdminComplexService {
  private readonly logger = new Logger(AdminComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: CreateComplexDto,
    files: string[],
  ): Promise<ServiceDataResponse<ComplexListItem>> {
    const { slug } = dto;

    this.logger.log(`Complex creation attempt started (slug=${slug})`);

    const bySlug = await this.prismaService.complex.findUnique({
      where: { slug },
    });

    if (bySlug) {
      this.logger.warn(
        `Complex creation conflict: slug already exists (slug=${slug})`,
      );
      throw new ConflictException('Комплекс с таким slug уже существует');
    }

    const complex = await this.prismaService.$transaction(async (tx) => {
      const complex = await tx.complex.create({
        data: { ...dto },
      });

      await tx.file.createMany({
        data: files.map((item) => ({
          path: `complexes/${item}`,
          complexId: complex.id,
        })),
      });

      return tx.complex.findUniqueOrThrow({
        where: { id: complex.id },
        include: complexFilesInclude,
      });
    });

    this.logger.log(
      `Complex created successfully (id=${complex.id}, slug=${slug})`,
    );

    return {
      message: 'Комплекс успешно создан',
      data: complex,
    };
  }

  async findAll(
    query: AdminFindAllComplexesDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ComplexListItem>>> {
    const { page = 1, limit = 20, search, isPublished } = query;

    this.logger.log(
      `Complexes list request started (page=${page}, limit=${limit}, isPublished=${isPublished ?? 'any'})`,
    );

    const skip = (page - 1) * limit;

    const where = {
      ...(isPublished !== undefined && { isPublished }),
      ...(search && {
        OR: [
          { title: { search } },
          { city: { search } },
          { address: { search } },
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
      `Complexes retrieved successfully (items=${formattedComplexes.length}, total=${total}, page=${page})`,
    );

    return {
      message: 'Комплексы успешно получены',
      data: {
        items: formattedComplexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    identifier: string,
  ): Promise<ServiceDataResponse<ComplexResponse>> {
    this.logger.log(`Complex get attempt started (identifier=${identifier})`);

    const isId = !isNaN(Number(identifier));

    const complex = await this.prismaService.complex.findUnique({
      where: isId ? { id: Number(identifier) } : { slug: identifier },
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
        `Complex get failed: not found (identifier=${identifier})`,
      );
      throw new NotFoundException('Комплекс не найден');
    }

    const formattedApartments = complex.apartments.map((item) => ({
      ...item,
      area: Number(item.area),
    }));

    this.logger.log(`Complex retrieved successfully (id=${complex.id})`);

    return {
      message: 'Комплекс успешно получен',
      data: {
        ...complex,
        apartments: formattedApartments,
      },
    };
  }

  async update(
    id: number,
    dto: UpdateComplexDto,
    newFiles: string[],
  ): Promise<ServiceDataResponse<ComplexListItem>> {
    this.logger.log(`Complex update attempt started (id=${id})`);

    const complex = await this.prismaService.complex.findUnique({
      where: { id },
      include: {
        files: { select: { id: true } },
      },
    });

    if (!complex) {
      this.logger.warn(`Complex update failed: not found (id=${id})`);
      throw new NotFoundException('Комплекс не найден');
    }

    const { deletedFileIds = [], ...updateData } = dto;

    const filesToDelete = deletedFileIds.length
      ? await this.prismaService.file.findMany({
          where: {
            id: { in: deletedFileIds },
            complexId: complex.id,
          },
          select: { id: true, path: true },
        })
      : [];

    const currentFilesCount = complex.files.length;
    const remainingFiles =
      currentFilesCount - filesToDelete.length + (newFiles?.length ?? 0);

    if (remainingFiles <= 0) {
      this.logger.warn(
        `Complex update failed: attempt to delete last image (id=${id})`,
      );
      throw new ConflictException(
        'Для комплекса должно остаться хотя бы одно изображение',
      );
    }

    const updatedComplex = await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.complex.update({
        where: { id },
        data: updateData,
      });

      if (filesToDelete.length) {
        await tx.file.deleteMany({
          where: {
            id: { in: filesToDelete.map((item) => item.id) },
            complexId: updated.id,
          },
        });
      }

      if (newFiles?.length) {
        await tx.file.createMany({
          data: newFiles.map((item) => ({
            path: `complexes/${item}`,
            complexId: updated.id,
          })),
        });
      }

      return tx.complex.findUniqueOrThrow({
        where: { id: updated.id },
        include: complexFilesInclude,
      });
    });

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((item) => item.path));
    }

    this.logger.log(`Complex updated successfully (id=${updatedComplex.id})`);

    return {
      message: 'Комплекс успешно обновлен',
      data: updatedComplex,
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateComplexStatusDto,
  ): Promise<ServiceDataResponse<ComplexListItem>> {
    const { isPublished } = dto;

    this.logger.log(
      `Complex publish status update started (id=${id}, newStatus=${isPublished})`,
    );

    const existingComplex = await this.prismaService.complex.findUnique({
      where: { id },
      select: { id: true, isPublished: true },
    });

    if (!existingComplex) {
      this.logger.warn(`Complex publish update failed: not found (id=${id})`);
      throw new NotFoundException('Комплекс не найден');
    }

    const updatedComplex = await this.prismaService.complex.update({
      where: { id },
      data: { isPublished },
      include: complexFilesInclude,
    });

    this.logger.log(
      `Complex publish status updated successfully (id=${id}, newStatus=${isPublished})`,
    );

    return {
      message: 'Статус публикации комплекса успешно обновлен',
      data: updatedComplex,
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Complex delete attempt started (id=${id})`);

    const complex = await this.prismaService.complex.findUnique({
      where: { id },
      include: {
        files: {
          select: { path: true },
        },
      },
    });

    if (!complex) {
      this.logger.warn(`Complex delete failed: not found (id=${id})`);
      throw new NotFoundException('Комплекс не найден');
    }

    const filePaths = complex.files.map((item) => item.path);

    await this.prismaService.complex.delete({
      where: { id },
    });

    if (filePaths.length) {
      await removeUploadedFiles(filePaths);
    }

    this.logger.log(`Complex deleted successfully (id=${id})`);

    return {
      message: 'Комплекс успешно удален',
    };
  }
}
