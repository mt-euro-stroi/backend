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
      `Apartment creation attempt started (number=${dto.number}).`,
    );

    const { complexSlug, ...apartmentData } = dto;

    const complex = await this.prismaService.complex.findUnique({
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
        `Apartment creation failed: complex not found (slug=${complexSlug}).`,
      );
      throw new NotFoundException('Complex not found.');
    }

    const apartment = await this.prismaService.$transaction(async (tx) => {
      const existingApartment = await tx.apartment.findFirst({
        where: {
          number: dto.number,
          entrance: dto.entrance,
          complexId: complex.id,
        },
      });

      if (existingApartment) {
        throw new ConflictException(
          'Apartment with this number already exists in the complex.',
        );
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

    this.logger.log(`Apartment created successfully (id=${apartment.id}).`);

    return {
      message: 'Apartment created successfully.',
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
      message: 'Apartments retrieved successfully.',
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
    this.logger.log(`Apartment retrieval attempt started (id=${id}).`);

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id },
      include: apartmentInclude,
    });

    if (!apartment) {
      this.logger.warn(`Apartment not found (id=${id}).`);
      throw new NotFoundException('Apartment not found.');
    }

    this.logger.log(`Apartment retrieved successfully (id=${id}).`);

    return {
      message: 'Apartment retrieved successfully.',
      data: mapApartment(apartment),
    };
  }

  async update(
    id: number,
    dto: UpdateApartmentDto,
    newFiles: string[],
  ): Promise<ServiceDataResponse<ApartmentResponse>> {
    this.logger.log(`Apartment update attempt started (id=${id}).`);

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id },
      include: {
        files: { select: { id: true } },
      },
    });

    if (!apartment) {
      this.logger.warn(
        `Apartment update failed: apartment not found (id=${id}).`,
      );
      throw new NotFoundException(`Apartment with id ${id} not found.`);
    }

    const { deletedFileIds = [], ...updateData } = dto;

    const filesToDelete = deletedFileIds.length
      ? await this.prismaService.file.findMany({
          where: {
            id: { in: deletedFileIds },
            apartmentId: apartment.id,
          },
          select: { id: true, path: true },
        })
      : [];

    const currentFilesCount = apartment.files.length;
    const remainingFiles =
      currentFilesCount - filesToDelete.length + (newFiles?.length ?? 0);

    if (remainingFiles <= 0) {
      this.logger.warn(
        `Apartment update rejected: attempt to remove all files (id=${id}).`,
      );
      throw new ConflictException(`Apartment must contain at least one file.`);
    }

    const updatedApartment = await this.prismaService.$transaction(
      async (tx) => {
        const updated = await tx.apartment.update({
          where: { id },
          data: updateData,
        });

        if (filesToDelete.length) {
          await tx.file.deleteMany({
            where: {
              id: { in: filesToDelete.map((item) => item.id) },
              apartmentId: updated.id,
            },
          });

          this.logger.log(
            `Apartment files deleted in DB (id=${id}, count=${deletedFileIds.length}).`,
          );
        }

        if (newFiles?.length) {
          await tx.file.createMany({
            data: newFiles.map((item) => ({
              path: `apartments/${item}`,
              apartmentId: updated.id,
            })),
          });

          this.logger.log(
            `New files added to apartment (id=${id}, count=${newFiles.length}).`,
          );
        }

        return tx.apartment.findFirstOrThrow({
          where: { id: updated.id },
          include: apartmentInclude,
        });
      },
    );

    if (filesToDelete.length) {
      await removeUploadedFiles(filesToDelete.map((item) => item.path));
      this.logger.log(
        `Apartment files removed from storage (id=${id}, count=${filesToDelete.length}).`,
      );
    }

    this.logger.log(`Apartment update completed successfully (id=${id}).`);

    return {
      message: `Apartment with id ${id} successfully updated.`,
      data: mapApartment(updatedApartment),
    };
  }

  async updateStatus(
    id: number,
    dto: UpdateApartmentStatusDto,
  ): Promise<ServiceDataResponse<ApartmentResponse>> {
    const { isPublished } = dto;

    this.logger.log(
      `Apartment publish status update started (id=${id}, newStatus=${isPublished}).`,
    );

    const existingApartment = await this.prismaService.apartment.findUnique({
      where: { id },
      select: { id: true, isPublished: true, complexId: true },
    });

    if (!existingApartment) {
      this.logger.warn(
        `Apartment publish update failed: not found (id=${id}).`,
      );
      throw new NotFoundException('Apartment not found.');
    }

    if (isPublished) {
      const complex = await this.prismaService.complex.findUnique({
        where: { id: existingApartment.complexId },
        select: { isPublished: true },
      });

      if (!complex?.isPublished) {
        this.logger.warn(
          `Apartment publish blocked: complex is unpublished (apartmentId=${id}).`,
        );
        throw new ConflictException(
          'Cannot publish apartment while complex is unpublished.',
        );
      }
    }

    const updatedApartment = await this.prismaService.apartment.update({
      where: { id },
      data: { isPublished },
      include: apartmentInclude,
    });

    this.logger.log(
      `Apartment publish status updated successfully (id=${id}, newStatus=${isPublished}).`,
    );

    return {
      message: 'Apartment publish status updated successfully.',
      data: mapApartment(updatedApartment),
    };
  }

  async remove(id: number): Promise<ServiceMessageResponse> {
    this.logger.log(`Apartment delete attempt started (id=${id}).`);

    const apartment = await this.prismaService.apartment.findUnique({
      where: { id },
      include: {
        files: {
          select: { path: true },
        },
      },
    });

    if (!apartment) {
      this.logger.warn(
        `Apartment delete failed: apartment not found (id=${id}).`,
      );
      throw new NotFoundException(`Apartment with id ${id} not found.`);
    }

    const filePaths = apartment.files.map((item) => item.path);

    await this.prismaService.apartment.delete({
      where: { id },
    });

    this.logger.log(`Apartment deleted from database (id=${id}).`);

    if (filePaths.length) {
      await removeUploadedFiles(filePaths);
      this.logger.log(
        `Associated files removed from storage (id=${id}, files=${filePaths.length}).`,
      );
    }

    this.logger.log(
      `Apartment delete process completed successfully (id=${id}).`,
    );

    return {
      message: `Apartment with id ${id} successfully deleted.`,
    };
  }
}
