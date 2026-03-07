import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateApartmentDto } from '../dto/create-apartment.dto';
import { UpdateApartmentDto } from '../dto/update-apartment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminFindAllApartmentsDto } from '../dto/admin-find-all-apartments.dto';
import {
  PaginatedResult,
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import { removeUploadedFiles } from 'src/common/utils/remove-uploaded-files.util';
import { ApartmentResponse } from '../types/apartment-response.types';
import { UpdateApartmentStatusDto } from '../dto/update-apartment-status.dto';
import { apartmentInclude } from '../prisma/apartment.include';
import { mapApartment } from '../mappers/apartment.mapper';

@Injectable()
export class AdminApartmentService {
  private readonly logger = new Logger(AdminApartmentService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: CreateApartmentDto,
    files: string[],
  ): Promise<ServiceDataResponse<ApartmentResponse>> {
    this.logger.log(
      `Apartment creation attempt started (number=${dto.number})`,
    );

    const { complexSlug, ...apartmentData } = dto;

    const apartment = await this.prismaService.$transaction(async (tx) => {
      const complex = await tx.complex.findUnique({
        where: { slug: complexSlug },
        select: {
          id: true,
          title: true,
          slug: true,
          city: true,
          address: true,
          priceFrom: true,
        },
      });

      if (!complex) {
        this.logger.warn(
          `Apartment creation failed: complex not found (slug=${complexSlug})`,
        );
        throw new NotFoundException('Комплекс не найден');
      }

      if (
        complex.priceFrom === null ||
        apartmentData.price < complex.priceFrom
      ) {
        await tx.complex.update({
          where: { id: complex.id },
          data: { priceFrom: apartmentData.price },
        });
      }

      const createdApartment = await tx.apartment.create({
        data: {
          ...apartmentData,
          complexId: complex.id,
        },
      });

      if (files?.length) {
        await tx.file.createMany({
          data: files.map((item) => ({
            path: `apartments/${item}`,
            apartmentId: createdApartment.id,
          })),
        });
      }

      return tx.apartment.findUniqueOrThrow({
        where: { id: createdApartment.id },
        include: apartmentInclude,
      });
    });

    this.logger.log(`Apartment created successfully (id=${apartment.id})`);

    return {
      message: 'Квартира успешно создана',
      data: mapApartment(apartment),
    };
  }

  async findAll(
    query: AdminFindAllApartmentsDto,
  ): Promise<ServiceDataResponse<PaginatedResult<ApartmentResponse>>> {
    const {
      page = 1,
      limit = 20,
      search,
      minPrice,
      maxPrice,
      rooms,
      floor,
      status,
      isPublished,
    } = query;

    this.logger.log(
      `Apartments list request started (page=${page}, limit=${limit})`,
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
      ...(status !== undefined && { status }),
      ...(rooms !== undefined && { rooms }),
      ...(floor !== undefined && { floor }),
      ...(isPublished !== undefined && { isPublished }),
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
      `Apartments retrieved successfully (items=${formatted.length}, total=${total}, page=${page})`,
    );

    return {
      message: 'Квартиры успешно получены',
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
    this.logger.log(`Apartment retrieval attempt started (id=${id})`);

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id },
      include: apartmentInclude,
    });

    if (!apartment) {
      this.logger.warn(`Apartment not found (id=${id})`);
      throw new NotFoundException('Квартира не найдена');
    }

    this.logger.log(`Apartment retrieved successfully (id=${id})`);

    return {
      message: 'Квартира успешно получена',
      data: mapApartment(apartment),
    };
  }

  async update(
    id: number,
    dto: UpdateApartmentDto,
    newFiles: string[],
  ): Promise<ServiceDataResponse<ApartmentResponse>> {
    this.logger.log(`Apartment update attempt started (id=${id})`);

    const { deletedFileIds = [], ...updateData } = dto;

    const { updatedApartment, filesToDelete } =
      await this.prismaService.$transaction(async (tx) => {
        const apartment = await tx.apartment.findUnique({
          where: { id },
          include: {
            files: { select: { id: true, path: true } },
          },
        });

        if (!apartment) {
          this.logger.warn(
            `Apartment update failed: apartment not found (id=${id})`,
          );
          throw new NotFoundException('Квартира не найдена');
        }

        const filesToDelete = deletedFileIds.length
          ? await tx.file.findMany({
              where: {
                id: { in: deletedFileIds },
                apartmentId: apartment.id,
              },
              select: { id: true, path: true },
            })
          : [];

        const remainingFiles =
          apartment.files.length -
          filesToDelete.length +
          (newFiles.length ?? 0);

        if (remainingFiles <= 0) {
          this.logger.warn(
            `Apartment update rejected: attempt to remove all files (id=${id})`,
          );
          throw new ConflictException(
            'Квартира должна содержать хотя бы один файл',
          );
        }

        const updated = await tx.apartment.update({
          where: { id },
          data: updateData,
        });

        if (filesToDelete.length) {
          await tx.file.deleteMany({
            where: { id: { in: filesToDelete.map((f) => f.id) } },
          });
        }

        if (newFiles.length) {
          await tx.file.createMany({
            data: newFiles.map((f) => ({
              path: `apartments/${f}`,
              apartmentId: updated.id,
            })),
          });
        }

        const minPrice = await tx.apartment.aggregate({
          where: { complexId: updated.complexId },
          _min: { price: true },
        });

        await tx.complex.update({
          where: { id: updated.complexId },
          data: { priceFrom: minPrice._min.price ?? null },
        });

        const updatedApartment = await tx.apartment.findUniqueOrThrow({
          where: { id: updated.id },
          include: apartmentInclude,
        });

        return { updatedApartment, filesToDelete };
      });

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((f) => f.path));

      this.logger.log(
        `Apartment files removed from storage (id=${id}, count=${filesToDelete.length})`,
      );
    }

    this.logger.log(`Apartment update completed successfully (id=${id})`);

    return {
      message: 'Квартира успешно обновлена',
      data: mapApartment(updatedApartment),
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateApartmentStatusDto,
  ): Promise<ServiceDataResponse<ApartmentResponse>> {
    const { isPublished } = dto;

    this.logger.log(
      `Apartment publish status update started (id=${id}, newStatus=${isPublished})`,
    );

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id },
      select: {
        id: true,
        isPublished: true,
        complexId: true,
        complex: {
          select: { isPublished: true },
        },
      },
    });

    if (!apartment) {
      this.logger.warn(
        `Apartment publish update failed: not found (id=${id})`,
      );
      throw new NotFoundException('Квартира не найдена');
    }

    if (isPublished && !apartment.complex?.isPublished) {
      this.logger.warn(
        `Apartment publish blocked: complex is unpublished (apartmentId=${id})`,
      );
      throw new ConflictException(
        'Невозможно опубликовать квартиру, пока комплекс не опубликован',
      );
    }

    const updatedApartment = await this.prismaService.apartment.update({
      where: { id },
      data: { isPublished },
      include: apartmentInclude,
    });

    this.logger.log(
      `Apartment publish status updated successfully (id=${id}, newStatus=${isPublished})`,
    );

    return {
      message: 'Статус публикации квартиры успешно обновлен',
      data: mapApartment(updatedApartment),
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Apartment delete attempt started (id=${id})`);

    const { filePaths } = await this.prismaService.$transaction(async (tx) => {
      const apartment = await tx.apartment.findUnique({
        where: { id },
        include: {
          files: {
            select: { path: true },
          },
        },
      });

      if (!apartment) {
        this.logger.warn(
          `Apartment delete failed: apartment not found (id=${id})`,
        );
        throw new NotFoundException('Квартира не найдена');
      }

      await tx.apartment.delete({
        where: { id },
      });

      this.logger.log(`Apartment deleted from database (id=${id})`);

      return {
        filePaths: apartment.files.map((f) => f.path),
      };
    });

    if (filePaths.length) {
      await removeUploadedFiles(filePaths);

      this.logger.log(
        `Associated files removed from storage (id=${id}, files=${filePaths.length})`,
      );
    }

    this.logger.log(
      `Apartment delete process completed successfully (id=${id})`,
    );

    return {
      message: 'Квартира успешно удалена',
    };
  }
}
