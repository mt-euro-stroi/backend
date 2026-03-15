import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import {
  ComplexListItem,
  ComplexResponse,
} from './types/complex-response.types';
import { PublicFindAllComplexesDto } from './dto/public-find-all-complexes.dto';
import {
  apartmentCardSelect,
  complexFullSelect,
  complexListSelect,
} from './prisma/complex.select';
import { CreateComplexDto } from './dto/create-complex.dto';
import { AdminFindAllComplexesDto } from './dto/admin-find-all-complexes.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { UpdateComplexStatusDto } from './dto/update-complex-status.dto';
import { removeUploadedFiles } from 'src/common/utils/remove-uploaded-files.util';
import { mapApartmentCard } from './mappers/apartment-card.mapper';

@Injectable()
export class ComplexService {
  private readonly logger = new Logger(ComplexService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findAll(
    query: PublicFindAllComplexesDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ComplexListItem>>> {
    const { page = 1, limit = 20, search } = query;

    this.logger.log(
      `Public complexes list request started (page=${page}, limit=${limit})`,
    );

    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
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
        select: complexListSelect,
      }),
      this.prismaService.complex.count({ where }),
    ]);

    this.logger.log(
      `Public complexes retrieved (items=${complexes.length}, total=${total})`,
    );

    return {
      message: 'Комплексы успешно получены',
      data: {
        items: complexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string): Promise<ServiceDataResponse<ComplexResponse>> {
    this.logger.log(`Public complex get attempt started (slug=${slug})`);

    const complex = await this.prismaService.complex.findUnique({
      where: {
        slug,
      },
      select: {
        ...complexFullSelect,
        apartments: {
          where: { isPublished: true },
          select: apartmentCardSelect,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!complex || !complex.isPublished) {
      this.logger.warn(
        `Public complex get failed: not found or unpublished (slug=${slug})`,
      );
      throw new NotFoundException('Комплекс не найден');
    }

    const formatted = complex.apartments.map(mapApartmentCard);

    this.logger.log(
      `Public complex retrieved successfully (id=${complex.id}, slug=${slug})`,
    );

    return {
      message: 'Комплекс успешно получен',
      data: {
        ...complex,
        apartments: formatted,
      },
    };
  }

  async create(
    dto: CreateComplexDto,
    files: string[],
  ): Promise<ServiceDataResponse<ComplexListItem>> {
    const { slug } = dto;

    this.logger.log(`Complex creation attempt started (slug=${slug})`);

    const complex = await this.prismaService.$transaction(async (tx) => {
      const createdComplex = await tx.complex.create({
        data: dto,
      });

      if (files.length) {
        await tx.file.createMany({
          data: files.map((item) => ({
            path: `complexes/${item}`,
            complexId: createdComplex.id,
          })),
        });
      }

      return tx.complex.findUniqueOrThrow({
        where: { id: createdComplex.id },
        select: complexListSelect,
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

  async findAllAdmin(
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
        select: complexListSelect,
      }),
      this.prismaService.complex.count({ where }),
    ]);

    this.logger.log(
      `Complexes retrieved successfully (items=${complexes.length}, total=${total}, page=${page})`,
    );

    return {
      message: 'Комплексы успешно получены',
      data: {
        items: complexes,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(
    identifier: string,
  ): Promise<ServiceDataResponse<ComplexResponse>> {
    this.logger.log(`Complex get attempt started (identifier=${identifier})`);

    const isId = !isNaN(Number(identifier));

    const complex = await this.prismaService.complex.findUnique({
      where: isId ? { id: Number(identifier) } : { slug: identifier },
      select: {
        ...complexFullSelect,
        apartments: {
          select: apartmentCardSelect,
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

    const formatted = complex.apartments.map(mapApartmentCard);

    this.logger.log(`Complex retrieved successfully (id=${complex.id})`);

    return {
      message: 'Комплекс успешно получен',
      data: {
        ...complex,
        apartments: formatted,
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

    const remainingFiles =
      complex.files.length - filesToDelete.length + newFiles.length;

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
            id: { in: filesToDelete.map((f) => f.id) },
            complexId: updated.id,
          },
        });
      }

      if (newFiles.length) {
        await tx.file.createMany({
          data: newFiles.map((file) => ({
            path: `complexes/${file}`,
            complexId: updated.id,
          })),
        });
      }

      return tx.complex.findUniqueOrThrow({
        where: { id: updated.id },
        select: complexListSelect,
      });
    });

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((f) => f.path));
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

    if (existingComplex.isPublished === isPublished) {
      const complex = await this.prismaService.complex.findUniqueOrThrow({
        where: { id },
        select: complexListSelect,
      });

      return {
        message: 'Статус публикации комплекса успешно обновлен',
        data: complex,
      };
    }

    const updatedComplex = await this.prismaService.complex.update({
      where: { id },
      data: { isPublished },
      select: complexListSelect,
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

    const { filePaths } = await this.prismaService.$transaction(async (tx) => {
      const complex = await tx.complex.findUnique({
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

      await tx.complex.delete({
        where: { id },
      });

      return {
        filePaths: complex.files.map((f) => f.path),
      };
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
