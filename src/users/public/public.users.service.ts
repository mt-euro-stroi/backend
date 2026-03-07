import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';
import type { AuthUser } from 'src/common/types/auth-user.type';
import { UserResponse } from '../types/users-response.types';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from 'src/generated/prisma/enums';
import { userFullSelect } from '../prisma/user.select';

@Injectable()
export class PublicUsersService {
  private readonly logger = new Logger(PublicUsersService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async findMe(authUser: AuthUser): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User profile request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      select: userFullSelect,
    });

    this.logger.log(`User profile retrieved successfully (userId=${userId})`);

    return {
      message: 'Пользователь успешно получен',
      data: user,
    };
  }

  async updateMe(
    dto: UpdateUserDto,
    authUser: AuthUser,
  ): Promise<ServiceDataResponse<UserResponse>> {
    const userId = authUser.sub;

    this.logger.log(`User update request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
    });

    let resetEmailVerified = false;

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.prismaService.user.findUnique({
        where: { email: dto.email },
      });

      if (existingEmail) {
        this.logger.warn(
          `User update failed: email already exists (userId=${userId})`,
        );
        throw new ConflictException('Email уже используется');
      }

      resetEmailVerified = true;
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prismaService.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        this.logger.warn(
          `User update failed: phone already exists (userId=${userId})`,
        );
        throw new ConflictException('Номер телефона уже используется');
      }
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...dto,
        ...(resetEmailVerified && { isEmailVerified: false }),
      },
      select: userFullSelect,
    });

    this.logger.log(`User updated successfully (userId=${userId})`);

    return {
      message: 'Пользователь успешно обновлен',
      data: updatedUser,
    };
  }

  async removeMe(authUser: AuthUser): Promise<ServiceMessageResponse> {
    const userId = authUser.sub;

    this.logger.log(`User delete request started (userId=${userId})`);

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (user.role === Role.ADMIN) {
      this.logger.warn(`Admin self-deletion blocked (adminId=${userId})`);
      throw new ForbiddenException('Админ не может удалить свою учетную запись');
    }

    await this.prismaService.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User account deleted (userId=${userId})`);

    return { message: 'Пользователь успешно удален' };
  }
}
